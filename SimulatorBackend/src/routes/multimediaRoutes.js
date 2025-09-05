import express from 'express';
import multimediaUploadService from '../services/MultimediaUploadService.js';
import Case from '../models/CaseModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/multimedia/upload
 * @desc Upload multimedia files
 * @access Private (Educator, Admin)
 */
router.post('/upload',
  requireAnyRole(['educator', 'admin']),
  multimediaUploadService.getMulterConfig().array('files', 10),
  async (req, res) => {
    try {
      const { caseId, category, description, tags } = req.body;
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Validate case exists if caseId is provided
      if (caseId) {
        const caseDoc = await Case.findById(caseId);
        if (!caseDoc) {
          return res.status(404).json({
            success: false,
            message: 'Case not found'
          });
        }
      }

      const uploadedFiles = [];
      const errors = [];

      for (const file of files) {
        try {
          // Validate file
          const validation = multimediaUploadService.validateFile(file);
          if (!validation.isValid) {
            errors.push({
              filename: file.originalname,
              errors: validation.errors
            });
            continue;
          }

          // Process file
          const metadata = {
            category: category || 'reference_material',
            description: description || '',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
          };

          const multimediaContent = await multimediaUploadService.processUploadedFile(
            file,
            metadata,
            req.user
          );

          uploadedFiles.push(multimediaContent);

          // Add to case if caseId is provided
          if (caseId) {
            await Case.findByIdAndUpdate(caseId, {
              $push: { multimediaContent: multimediaContent },
              lastModifiedBy: req.user._id,
              lastModifiedAt: new Date()
            });
          }

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} files`,
        data: {
          uploadedFiles,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error) {
      console.error('Upload files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload files'
      });
    }
  }
);

/**
 * @route GET /api/multimedia/case/:caseId
 * @desc Get multimedia content for a case
 * @access Private
 */
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { type, category } = req.query;

    const caseDoc = await Case.findById(caseId)
      .populate('multimediaContent.uploadedBy', 'username profile.firstName profile.lastName')
      .lean();

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check permissions
    if (!caseDoc.createdBy.equals(req.user._id) &&
        !caseDoc.collaborators?.some(collab => collab.user.equals(req.user._id)) &&
        caseDoc.status !== 'published' &&
        req.user.primaryRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let multimediaContent = caseDoc.multimediaContent || [];

    // Filter by type if specified
    if (type) {
      multimediaContent = multimediaContent.filter(content => content.type === type);
    }

    // Filter by category if specified
    if (category) {
      multimediaContent = multimediaContent.filter(content => content.category === category);
    }

    res.json({
      success: true,
      data: {
        caseId,
        multimediaContent: multimediaContent.filter(content => content.isActive)
      }
    });

  } catch (error) {
    console.error('Get case multimedia error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve multimedia content'
    });
  }
});

/**
 * @route PUT /api/multimedia/:fileId
 * @desc Update multimedia content metadata
 * @access Private (Educator, Admin)
 */
router.put('/:fileId',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const { description, tags, category } = req.body;

      // Find and update the multimedia content in cases
      const caseDoc = await Case.findOneAndUpdate(
        {
          'multimediaContent.fileId': fileId,
          $or: [
            { createdBy: req.user._id },
            { 'collaborators.user': req.user._id },
            { 'multimediaContent.uploadedBy': req.user._id }
          ]
        },
        {
          $set: {
            'multimediaContent.$.description': description,
            'multimediaContent.$.tags': tags,
            'multimediaContent.$.category': category,
            lastModifiedBy: req.user._id,
            lastModifiedAt: new Date()
          }
        },
        { new: true }
      );

      if (!caseDoc) {
        return res.status(404).json({
          success: false,
          message: 'Multimedia content not found or access denied'
        });
      }

      const updatedContent = caseDoc.multimediaContent.find(content => content.fileId === fileId);

      res.json({
        success: true,
        message: 'Multimedia content updated successfully',
        data: updatedContent
      });

    } catch (error) {
      console.error('Update multimedia error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update multimedia content'
      });
    }
  }
);

/**
 * @route DELETE /api/multimedia/:fileId
 * @desc Delete multimedia content
 * @access Private (Educator, Admin)
 */
router.delete('/:fileId',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { fileId } = req.params;

      // Find the case containing this multimedia content
      const caseDoc = await Case.findOne({
        'multimediaContent.fileId': fileId,
        $or: [
          { createdBy: req.user._id },
          { 'collaborators.user': req.user._id },
          { 'multimediaContent.uploadedBy': req.user._id }
        ]
      });

      if (!caseDoc) {
        return res.status(404).json({
          success: false,
          message: 'Multimedia content not found or access denied'
        });
      }

      const multimediaContent = caseDoc.multimediaContent.find(content => content.fileId === fileId);

      // Remove from case
      await Case.findByIdAndUpdate(caseDoc._id, {
        $pull: { multimediaContent: { fileId: fileId } },
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date()
      });

      // Delete physical file
      if (multimediaContent) {
        const filePath = multimediaContent.url.replace('/uploads/', 'uploads/');
        await multimediaUploadService.deleteFile(filePath);

        // Delete thumbnail if exists
        if (multimediaContent.thumbnailUrl) {
          const thumbnailPath = multimediaContent.thumbnailUrl.replace('/uploads/', 'uploads/');
          await multimediaUploadService.deleteFile(thumbnailPath);
        }
      }

      res.json({
        success: true,
        message: 'Multimedia content deleted successfully'
      });

    } catch (error) {
      console.error('Delete multimedia error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete multimedia content'
      });
    }
  }
);

/**
 * @route GET /api/multimedia/stats
 * @desc Get multimedia usage statistics
 * @access Private (Admin)
 */
router.get('/stats',
  requireAnyRole(['admin']),
  async (req, res) => {
    try {
      const stats = await Case.aggregate([
        {
          $match: {
            'multimediaContent.0': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            totalFiles: { $sum: { $size: '$multimediaContent' } },
            filesByType: {
              $push: {
                $map: {
                  input: '$multimediaContent',
                  as: 'content',
                  in: '$$content.type'
                }
              }
            },
            filesByCategory: {
              $push: {
                $map: {
                  input: '$multimediaContent',
                  as: 'content',
                  in: '$$content.category'
                }
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalCases: 0,
        totalFiles: 0,
        filesByType: [],
        filesByCategory: []
      };

      // Flatten and count types/categories
      const typeCount = {};
      const categoryCount = {};

      result.filesByType.flat().forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      result.filesByCategory.flat().forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          totalCases: result.totalCases,
          totalFiles: result.totalFiles,
          filesByType: typeCount,
          filesByCategory: categoryCount
        }
      });

    } catch (error) {
      console.error('Get multimedia stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve statistics'
      });
    }
  }
);

export default router;