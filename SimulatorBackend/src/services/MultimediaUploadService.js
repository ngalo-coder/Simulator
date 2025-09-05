import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import Case from '../models/CaseModel.js';
import auditLogger from './AuditLoggerService.js';

/**
 * Multimedia Upload Service
 * Handles file uploads, validation, processing, and storage for multimedia content
 */
class MultimediaUploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
      audio: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'],
      document: ['application/pdf', 'text/plain', 'application/msword']
    };

    this.thumbnailSizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    this.initializeDirectories();
  }

  /**
   * Initialize upload directories
   */
  async initializeDirectories() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'images'),
      path.join(this.uploadDir, 'videos'),
      path.join(this.uploadDir, 'audio'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'thumbnails')
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Configure multer for file uploads
   */
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const type = this.getFileType(file.mimetype);
        const uploadPath = path.join(this.uploadDir, type + 's');
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const fileId = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, `${fileId}${extension}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      const isAllowed = Object.values(this.allowedTypes).flat().includes(file.mimetype);
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 10 // Maximum 10 files per upload
      }
    });
  }

  /**
   * Process uploaded file
   * @param {Object} file - Multer file object
   * @param {Object} metadata - Additional metadata
   * @param {Object} user - User uploading the file
   * @returns {Promise<Object>} - Processed file information
   */
  async processUploadedFile(file, metadata = {}, user) {
    try {
      const fileId = path.parse(file.filename).name;
      const fileType = this.getFileType(file.mimetype);
      const filePath = file.path;
      const fileUrl = `/uploads/${fileType}s/${file.filename}`;

      let thumbnailUrl = null;
      let fileMetadata = {};

      // Generate thumbnail for images
      if (fileType === 'image') {
        thumbnailUrl = await this.generateImageThumbnails(filePath, fileId);
        fileMetadata = await this.getImageMetadata(filePath);
      } else if (fileType === 'video') {
        fileMetadata = await this.getVideoMetadata(filePath);
      } else if (fileType === 'audio') {
        fileMetadata = await this.getAudioMetadata(filePath);
      }

      const multimediaContent = {
        fileId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
        thumbnailUrl,
        type: fileType,
        category: metadata.category || 'reference_material',
        description: metadata.description || '',
        tags: metadata.tags || [],
        uploadedBy: user._id,
        uploadedAt: new Date(),
        isActive: true,
        metadata: fileMetadata
      };

      // Log file upload
      await auditLogger.logAuthEvent({
        event: 'MULTIMEDIA_FILE_UPLOADED',
        userId: user._id,
        username: user.username,
        metadata: {
          fileId,
          filename: file.originalname,
          fileType,
          fileSize: file.size,
          category: metadata.category
        }
      });

      return multimediaContent;
    } catch (error) {
      console.error('Process uploaded file error:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnails for images
   * @param {string} filePath - Path to the original image
   * @param {string} fileId - Unique file identifier
   * @returns {Promise<string>} - Thumbnail URL
   */
  async generateImageThumbnails(filePath, fileId) {
    try {
      const thumbnailDir = path.join(this.uploadDir, 'thumbnails');
      const thumbnailFilename = `${fileId}_thumb.jpg`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

      await sharp(filePath)
        .resize(this.thumbnailSizes.medium.width, this.thumbnailSizes.medium.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return `/uploads/thumbnails/${thumbnailFilename}`;
    } catch (error) {
      console.error('Generate image thumbnails error:', error);
      return null;
    }
  }

  /**
   * Get image metadata
   * @param {string} filePath - Path to the image file
   * @returns {Promise<Object>} - Image metadata
   */
  async getImageMetadata(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      console.error('Get image metadata error:', error);
      return {};
    }
  }

  /**
   * Get video metadata (placeholder - would need ffprobe or similar)
   * @param {string} filePath - Path to the video file
   * @returns {Promise<Object>} - Video metadata
   */
  async getVideoMetadata(filePath) {
    try {
      // This would typically use ffprobe or a similar tool
      // For now, return basic file stats
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Get video metadata error:', error);
      return {};
    }
  }

  /**
   * Get audio metadata (placeholder - would need audio processing library)
   * @param {string} filePath - Path to the audio file
   * @returns {Promise<Object>} - Audio metadata
   */
  async getAudioMetadata(filePath) {
    try {
      // This would typically use a library like music-metadata
      // For now, return basic file stats
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Get audio metadata error:', error);
      return {};
    }
  }

  /**
   * Validate file before upload
   * @param {Object} file - File object
   * @returns {Object} - Validation result
   */
  validateFile(file) {
    const errors = [];
    const warnings = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size ${(this.maxFileSize / 1024 / 1024).toFixed(0)}MB`);
    }

    // Check file type
    const allowedMimes = Object.values(this.allowedTypes).flat();
    if (!allowedMimes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimes.join(', ')}`);
    }

    // Check for potentially malicious files
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'];
    const extension = path.extname(file.originalname).toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed for security reasons`);
    }

    // Validate filename
    const filename = path.basename(file.originalname, extension);
    if (filename.length > 100) {
      errors.push('Filename is too long (maximum 100 characters)');
    }

    // Check for suspicious characters in filename
    const suspiciousChars = /[<>:"\/\\|?*\x00-\x1f]/;
    if (suspiciousChars.test(filename)) {
      errors.push('Filename contains invalid characters');
    }

    // Type-specific validations
    const fileType = this.getFileType(file.mimetype);
    if (fileType === 'image') {
      // Image-specific validations
      if (file.size < 1024) { // Less than 1KB
        warnings.push('Image file is very small, may be corrupted');
      }
    } else if (fileType === 'video') {
      // Video-specific validations
      if (file.size > 100 * 1024 * 1024) { // 100MB
        warnings.push('Large video file detected. Processing may take longer.');
      }
    } else if (fileType === 'audio') {
      // Audio-specific validations
      if (file.size > 50 * 1024 * 1024) { // 50MB
        warnings.push('Large audio file detected. Processing may take longer.');
      }
    }

    // General warnings for large files
    if (file.size > 10 * 1024 * 1024) { // 10MB
      warnings.push('Large file detected. Upload and processing may take longer.');
    }

    // Check for duplicate filenames (warning only)
    // This would require checking existing files in the database

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Process and optimize uploaded file
   * @param {Object} file - Multer file object
   * @param {Object} metadata - Additional metadata
   * @param {Object} user - User uploading the file
   * @returns {Promise<Object>} - Processed file information
   */
  async processAndOptimizeFile(file, metadata = {}, user) {
    try {
      const fileType = this.getFileType(file.mimetype);
      let optimizedFile = file;

      // Apply type-specific optimizations
      if (fileType === 'image') {
        optimizedFile = await this.optimizeImage(file);
      } else if (fileType === 'video') {
        optimizedFile = await this.optimizeVideo(file);
      } else if (fileType === 'audio') {
        optimizedFile = await this.optimizeAudio(file);
      }

      // Generate additional metadata
      const enhancedMetadata = await this.generateEnhancedMetadata(optimizedFile);

      // Create multimedia content object
      const multimediaContent = {
        fileId: path.parse(optimizedFile.filename).name,
        filename: optimizedFile.filename,
        originalName: file.originalname,
        mimeType: optimizedFile.mimetype,
        size: optimizedFile.size,
        url: `/uploads/${fileType}s/${optimizedFile.filename}`,
        thumbnailUrl: fileType === 'image' ? await this.generateImageThumbnails(optimizedFile.path, path.parse(optimizedFile.filename).name) : null,
        type: fileType,
        category: metadata.category || 'reference_material',
        description: metadata.description || '',
        tags: metadata.tags || [],
        uploadedBy: user._id,
        uploadedAt: new Date(),
        isActive: true,
        metadata: enhancedMetadata,
        processingStatus: 'completed',
        originalSize: file.size,
        optimizedSize: optimizedFile.size,
        compressionRatio: file.size > 0 ? ((file.size - optimizedFile.size) / file.size * 100).toFixed(2) : 0
      };

      return multimediaContent;
    } catch (error) {
      console.error('Process and optimize file error:', error);
      throw error;
    }
  }

  /**
   * Optimize image file
   * @param {Object} file - File object
   * @returns {Promise<Object>} - Optimized file
   */
  async optimizeImage(file) {
    try {
      const inputPath = file.path;
      const outputPath = inputPath; // Overwrite original for now

      // Get image info
      const metadata = await sharp(inputPath).metadata();

      // Apply optimizations based on image size and type
      let pipeline = sharp(inputPath);

      // Resize if too large
      if (metadata.width > 2048 || metadata.height > 2048) {
        pipeline = pipeline.resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Compress based on format
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
      } else if (metadata.format === 'png') {
        pipeline = pipeline.png({ compressionLevel: 8, progressive: true });
      } else if (metadata.format === 'webp') {
        pipeline = pipeline.webp({ quality: 85 });
      }

      await pipeline.toFile(outputPath + '.tmp');
      await fs.rename(outputPath + '.tmp', outputPath);

      // Update file size
      const stats = await fs.stat(outputPath);
      file.size = stats.size;

      return file;
    } catch (error) {
      console.error('Optimize image error:', error);
      // Return original file if optimization fails
      return file;
    }
  }

  /**
   * Optimize video file (placeholder - would need video processing library)
   * @param {Object} file - File object
   * @returns {Promise<Object>} - Optimized file
   */
  async optimizeVideo(file) {
    try {
      // This would typically use ffmpeg or similar
      // For now, return original file
      console.log('Video optimization not yet implemented');
      return file;
    } catch (error) {
      console.error('Optimize video error:', error);
      return file;
    }
  }

  /**
   * Optimize audio file (placeholder - would need audio processing library)
   * @param {Object} file - File object
   * @returns {Promise<Object>} - Optimized file
   */
  async optimizeAudio(file) {
    try {
      // This would typically use ffmpeg or audio processing libraries
      // For now, return original file
      console.log('Audio optimization not yet implemented');
      return file;
    } catch (error) {
      console.error('Optimize audio error:', error);
      return file;
    }
  }

  /**
   * Generate enhanced metadata for file
   * @param {Object} file - File object
   * @returns {Promise<Object>} - Enhanced metadata
   */
  async generateEnhancedMetadata(file) {
    try {
      const fileType = this.getFileType(file.mimetype);
      const stats = await fs.stat(file.path);

      const baseMetadata = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode,
        checksum: await this.generateFileChecksum(file.path)
      };

      // Type-specific metadata
      if (fileType === 'image') {
        const imageMetadata = await this.getImageMetadata(file.path);
        return { ...baseMetadata, ...imageMetadata };
      }

      return baseMetadata;
    } catch (error) {
      console.error('Generate enhanced metadata error:', error);
      return {};
    }
  }

  /**
   * Generate file checksum for integrity verification
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} - File checksum
   */
  async generateFileChecksum(filePath) {
    try {
      const crypto = await import('crypto');
      const fileBuffer = await fs.readFile(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (error) {
      console.error('Generate file checksum error:', error);
      return null;
    }
  }

  /**
   * Validate file integrity after upload
   * @param {Object} file - File object
   * @param {string} expectedChecksum - Expected checksum
   * @returns {Promise<boolean>} - Integrity status
   */
  async validateFileIntegrity(file, expectedChecksum) {
    try {
      const actualChecksum = await this.generateFileChecksum(file.path);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Validate file integrity error:', error);
      return false;
    }
  }

  /**
   * Clean up temporary files
   * @param {Array} tempFiles - Array of temporary file paths
   * @returns {Promise<void>}
   */
  async cleanupTempFiles(tempFiles) {
    try {
      for (const filePath of tempFiles) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Failed to cleanup temp file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.error('Cleanup temp files error:', error);
    }
  }

  /**
   * Delete file from storage
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  /**
   * Get file type from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} - File type
   */
  getFileType(mimeType) {
    if (this.allowedTypes.image.includes(mimeType)) return 'image';
    if (this.allowedTypes.video.includes(mimeType)) return 'video';
    if (this.allowedTypes.audio.includes(mimeType)) return 'audio';
    if (this.allowedTypes.document.includes(mimeType)) return 'document';
    return 'unknown';
  }

  /**
   * Clean up orphaned files
   * @returns {Promise<number>} - Number of files cleaned up
   */
  async cleanupOrphanedFiles() {
    try {
      // This would scan the upload directories and remove files not referenced in the database
      // Implementation would depend on specific requirements
      console.log('Cleanup orphaned files - not yet implemented');
      return 0;
    } catch (error) {
      console.error('Cleanup orphaned files error:', error);
      throw error;
    }
  }
}

export default new MultimediaUploadService();