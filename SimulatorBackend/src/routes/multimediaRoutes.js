import express from 'express';
import multimediaUploadService from '../services/MultimediaUploadService.js';
import Case from '../models/CaseModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /multimedia/upload:
 *   post:
 *     summary: Upload multimedia files
 *     description: Uploads multimedia files for use in cases. Supports multiple file types including images, videos, audio, and documents.
 *     tags: [Multimedia]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multimedia files to upload (max 10 files)
 *               caseId:
 *                 type: string
 *                 description: ID of the case to associate the files with (optional)
 *               category:
 *                 type: string
 *                 enum: [reference_material, teaching_aid, patient_data, diagnostic_image, procedure_video, audio_recording, document]
 *                 description: Category of the multimedia content
 *               description:
 *                 type: string
 *                 description: Description of the multimedia content
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedFiles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MultimediaContent'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           errors:
 *                             type: array
 *                             items:
 *                               type: string
 *       400:
 *         description: No files uploaded or invalid request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *       404:
 *         description: Case not found (if caseId provided)
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /multimedia/case/{caseId}:
 *   get:
 *     summary: Get multimedia content for a case
 *     description: Retrieves all multimedia content associated with a specific case, with optional filtering by type and category.
 *     tags: [Multimedia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to retrieve multimedia for
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video, audio, document, other]
 *         description: Filter by file type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [reference_material, teaching_aid, patient_data, diagnostic_image, procedure_video, audio_recording, document]
 *         description: Filter by content category
 *     responses:
 *       200:
 *         description: Multimedia content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseId:
 *                       type: string
 *                     multimediaContent:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MultimediaContent'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - access to case denied
 *       404:
 *         description: Case not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /multimedia/{fileId}:
 *   put:
 *     summary: Update multimedia content metadata
 *     description: Updates the metadata (description, tags, category) for a specific multimedia file.
 *     tags: [Multimedia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the multimedia file to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: New description for the multimedia content
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags for the content
 *               category:
 *                 type: string
 *                 enum: [reference_material, teaching_aid, patient_data, diagnostic_image, procedure_video, audio_recording, document]
 *                 description: New category for the content
 *     responses:
 *       200:
 *         description: Multimedia content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/MultimediaContent'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required, or not owner of content
 *       404:
 *         description: Multimedia content not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /multimedia/{fileId}:
 *   delete:
 *     summary: Delete multimedia content
 *     description: Permanently deletes a multimedia file and removes it from associated cases.
 *     tags: [Multimedia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the multimedia file to delete
 *     responses:
 *       200:
 *         description: Multimedia content deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required, or not owner of content
 *       404:
 *         description: Multimedia content not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /multimedia/stats:
 *   get:
 *     summary: Get multimedia usage statistics (Admin only)
 *     description: Retrieves aggregated statistics about multimedia usage across all cases in the system.
 *     tags: [Multimedia]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCases:
 *                       type: integer
 *                       description: Number of cases with multimedia content
 *                     totalFiles:
 *                       type: integer
 *                       description: Total number of multimedia files
 *                     filesByType:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Count of files by type (image, video, audio, document, other)
 *                     filesByCategory:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Count of files by category
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
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