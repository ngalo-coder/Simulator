import Case from '../models/CaseModel.js';
import auditLogger from './AuditLoggerService.js';

/**
 * Multimedia Access Control Service
 * Handles granular permissions for multimedia content access and management
 */
class MultimediaAccessControlService {
  constructor() {
    this.permissions = {
      VIEW: 'view',
      DOWNLOAD: 'download',
      EDIT: 'edit',
      DELETE: 'delete',
      SHARE: 'share',
      EMBED: 'embed'
    };

    this.resourceTypes = {
      MULTIMEDIA: 'multimedia',
      CASE: 'case',
      CATEGORY: 'category'
    };
  }

  /**
   * Check if user has permission for multimedia content
   * @param {string} multimediaId - Multimedia content ID
   * @param {string} permission - Permission to check
   * @param {Object} user - User requesting access
   * @returns {Promise<boolean>} - Access granted
   */
  async checkMultimediaPermission(multimediaId, permission, user) {
    try {
      // Find cases containing this multimedia content
      const cases = await Case.find({
        'multimediaContent.fileId': multimediaId
      }).lean();

      if (cases.length === 0) {
        return false;
      }

      // Check permissions for each case
      for (const caseDoc of cases) {
        const multimediaItem = caseDoc.multimediaContent.find(
          content => content.fileId === multimediaId
        );

        if (multimediaItem) {
          const hasPermission = await this.checkMultimediaItemPermission(
            multimediaItem,
            caseDoc,
            permission,
            user
          );

          if (hasPermission) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Check multimedia permission error:', error);
      return false;
    }
  }

  /**
   * Check permission for specific multimedia item within a case
   * @param {Object} multimediaItem - Multimedia content item
   * @param {Object} caseDoc - Case document
   * @param {string} permission - Permission to check
   * @param {Object} user - User requesting access
   * @returns {Promise<boolean>} - Access granted
   */
  async checkMultimediaItemPermission(multimediaItem, caseDoc, permission, user) {
    try {
      // Admin has all permissions
      if (user.primaryRole === 'admin') {
        return true;
      }

      // Check if user is the uploader
      if (multimediaItem.uploadedBy && multimediaItem.uploadedBy.toString() === user._id.toString()) {
        return true;
      }

      // Check case-level permissions
      const casePermission = this.checkCasePermission(caseDoc, permission, user);
      if (!casePermission) {
        return false;
      }

      // Check multimedia-specific restrictions
      if (multimediaItem.isActive === false) {
        return false;
      }

      // Check category-based restrictions
      if (multimediaItem.category === 'patient_image' && user.primaryRole === 'student') {
        // Students may have restricted access to patient images
        return permission === this.permissions.VIEW;
      }

      // Check time-based restrictions (if implemented)
      if (multimediaItem.metadata && multimediaItem.metadata.expiresAt) {
        if (new Date() > new Date(multimediaItem.metadata.expiresAt)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Check multimedia item permission error:', error);
      return false;
    }
  }

  /**
   * Check case-level permission
   * @param {Object} caseDoc - Case document
   * @param {string} permission - Permission to check
   * @param {Object} user - User requesting access
   * @returns {boolean} - Access granted
   */
  checkCasePermission(caseDoc, permission, user) {
    try {
      // Admin has all permissions
      if (user.primaryRole === 'admin') {
        return true;
      }

      // Check if user is case owner
      if (caseDoc.createdBy && caseDoc.createdBy.toString() === user._id.toString()) {
        return true;
      }

      // Check if user is a collaborator
      if (caseDoc.collaborators) {
        const collaborator = caseDoc.collaborators.find(
          collab => collab.user.toString() === user._id.toString()
        );

        if (collaborator) {
          return collaborator.permissions.includes(this.mapPermission(permission));
        }
      }

      // Check if case is published (public access)
      if (caseDoc.status === 'published') {
        return permission === this.permissions.VIEW || permission === this.permissions.DOWNLOAD;
      }

      return false;
    } catch (error) {
      console.error('Check case permission error:', error);
      return false;
    }
  }

  /**
   * Map permission string to collaborator permission
   * @param {string} permission - Permission to map
   * @returns {string} - Mapped permission
   */
  mapPermission(permission) {
    switch (permission) {
      case this.permissions.VIEW:
        return 'read';
      case this.permissions.EDIT:
        return 'write';
      case this.permissions.DELETE:
        return 'delete';
      case this.permissions.SHARE:
        return 'share';
      default:
        return 'read';
    }
  }

  /**
   * Get user's permissions for multimedia content
   * @param {string} multimediaId - Multimedia content ID
   * @param {Object} user - User requesting permissions
   * @returns {Promise<Array>} - Array of permissions
   */
  async getMultimediaPermissions(multimediaId, user) {
    try {
      const permissions = [];

      for (const permission of Object.values(this.permissions)) {
        const hasPermission = await this.checkMultimediaPermission(multimediaId, permission, user);
        if (hasPermission) {
          permissions.push(permission);
        }
      }

      return permissions;
    } catch (error) {
      console.error('Get multimedia permissions error:', error);
      return [];
    }
  }

  /**
   * Grant permissions to user for multimedia content
   * @param {string} multimediaId - Multimedia content ID
   * @param {string} targetUserId - User to grant permissions to
   * @param {Array} permissions - Permissions to grant
   * @param {Object} granter - User granting permissions
   * @returns {Promise<boolean>} - Success status
   */
  async grantMultimediaPermissions(multimediaId, targetUserId, permissions, granter) {
    try {
      // Find cases containing this multimedia content
      const cases = await Case.find({
        'multimediaContent.fileId': multimediaId
      });

      if (cases.length === 0) {
        throw new Error('Multimedia content not found');
      }

      let success = false;

      for (const caseDoc of cases) {
        // Check if granter has permission to share
        if (this.checkCasePermission(caseDoc, this.permissions.SHARE, granter)) {
          // Add target user as collaborator if not already
          const existingCollaborator = caseDoc.collaborators.find(
            collab => collab.user.toString() === targetUserId
          );

          if (existingCollaborator) {
            // Update existing collaborator permissions
            existingCollaborator.permissions = [...new Set([
              ...existingCollaborator.permissions,
              ...permissions.map(p => this.mapPermission(p))
            ])];
          } else {
            // Add new collaborator
            caseDoc.collaborators.push({
              user: targetUserId,
              role: 'viewer',
              permissions: permissions.map(p => this.mapPermission(p)),
              addedAt: new Date(),
              addedBy: granter._id
            });
          }

          await caseDoc.save();
          success = true;

          // Log permission grant
          await auditLogger.logAuthEvent({
            event: 'MULTIMEDIA_PERMISSIONS_GRANTED',
            userId: granter._id,
            username: granter.username,
            metadata: {
              multimediaId,
              targetUserId,
              permissions,
              caseId: caseDoc._id
            }
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Grant multimedia permissions error:', error);
      throw error;
    }
  }

  /**
   * Revoke permissions from user for multimedia content
   * @param {string} multimediaId - Multimedia content ID
   * @param {string} targetUserId - User to revoke permissions from
   * @param {Object} revoker - User revoking permissions
   * @returns {Promise<boolean>} - Success status
   */
  async revokeMultimediaPermissions(multimediaId, targetUserId, revoker) {
    try {
      // Find cases containing this multimedia content
      const cases = await Case.find({
        'multimediaContent.fileId': multimediaId
      });

      if (cases.length === 0) {
        throw new Error('Multimedia content not found');
      }

      let success = false;

      for (const caseDoc of cases) {
        // Check if revoker has permission to manage permissions
        if (this.checkCasePermission(caseDoc, this.permissions.SHARE, revoker)) {
          // Remove target user from collaborators
          caseDoc.collaborators = caseDoc.collaborators.filter(
            collab => collab.user.toString() !== targetUserId
          );

          await caseDoc.save();
          success = true;

          // Log permission revoke
          await auditLogger.logAuthEvent({
            event: 'MULTIMEDIA_PERMISSIONS_REVOKED',
            userId: revoker._id,
            username: revoker.username,
            metadata: {
              multimediaId,
              targetUserId,
              caseId: caseDoc._id
            }
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Revoke multimedia permissions error:', error);
      throw error;
    }
  }

  /**
   * Check if multimedia content is accessible via public link
   * @param {string} multimediaId - Multimedia content ID
   * @param {string} accessToken - Access token (optional)
   * @returns {Promise<Object>} - Access result with permissions
   */
  async checkPublicAccess(multimediaId, accessToken = null) {
    try {
      // Find cases containing this multimedia content
      const cases = await Case.find({
        'multimediaContent.fileId': multimediaId,
        status: 'published'
      }).lean();

      if (cases.length === 0) {
        return { accessible: false, permissions: [] };
      }

      // Check if any case allows public access
      for (const caseDoc of cases) {
        const multimediaItem = caseDoc.multimediaContent.find(
          content => content.fileId === multimediaId
        );

        if (multimediaItem && multimediaItem.isActive) {
          // Check if public access is allowed for this content type
          const publicPermissions = this.getPublicPermissions(multimediaItem.category);

          if (publicPermissions.length > 0) {
            return {
              accessible: true,
              permissions: publicPermissions,
              caseId: caseDoc._id,
              expiresAt: multimediaItem.metadata?.expiresAt
            };
          }
        }
      }

      return { accessible: false, permissions: [] };
    } catch (error) {
      console.error('Check public access error:', error);
      return { accessible: false, permissions: [] };
    }
  }

  /**
   * Get public permissions for content category
   * @param {string} category - Content category
   * @returns {Array} - Public permissions
   */
  getPublicPermissions(category) {
    // Define which permissions are allowed for public access based on category
    const publicPermissionsMap = {
      'reference_material': [this.permissions.VIEW, this.permissions.DOWNLOAD],
      'patient_image': [this.permissions.VIEW], // Restricted for privacy
      'xray': [this.permissions.VIEW],
      'lab_result': [this.permissions.VIEW],
      'audio_recording': [this.permissions.VIEW],
      'video_demo': [this.permissions.VIEW, this.permissions.EMBED]
    };

    return publicPermissionsMap[category] || [this.permissions.VIEW];
  }

  /**
   * Generate access token for multimedia content
   * @param {string} multimediaId - Multimedia content ID
   * @param {Array} permissions - Permissions to grant
   * @param {Date} expiresAt - Expiration date
   * @param {Object} user - User generating token
   * @returns {Promise<string>} - Access token
   */
  async generateAccessToken(multimediaId, permissions, expiresAt, user) {
    try {
      // This would typically generate a JWT token with the permissions
      // For now, return a placeholder
      const token = `mm_${multimediaId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log token generation
      await auditLogger.logAuthEvent({
        event: 'MULTIMEDIA_ACCESS_TOKEN_GENERATED',
        userId: user._id,
        username: user.username,
        metadata: {
          multimediaId,
          permissions,
          expiresAt,
          token: token.substring(0, 10) + '...' // Log partial token for security
        }
      });

      return token;
    } catch (error) {
      console.error('Generate access token error:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   * @param {string} token - Access token
   * @param {string} multimediaId - Multimedia content ID
   * @returns {Promise<Object>} - Token validation result
   */
  async validateAccessToken(token, multimediaId) {
    try {
      // This would typically validate the JWT token
      // For now, return a basic validation
      if (token.startsWith(`mm_${multimediaId}_`)) {
        return {
          valid: true,
          permissions: [this.permissions.VIEW, this.permissions.DOWNLOAD],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
      }

      return { valid: false, permissions: [] };
    } catch (error) {
      console.error('Validate access token error:', error);
      return { valid: false, permissions: [] };
    }
  }

  /**
   * Get access control list for multimedia content
   * @param {string} multimediaId - Multimedia content ID
   * @param {Object} user - User requesting ACL
   * @returns {Promise<Array>} - Access control list
   */
  async getAccessControlList(multimediaId, user) {
    try {
      // Find cases containing this multimedia content
      const cases = await Case.find({
        'multimediaContent.fileId': multimediaId
      })
      .populate('collaborators.user', 'username profile.firstName profile.lastName')
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .lean();

      if (cases.length === 0) {
        return [];
      }

      const acl = [];

      for (const caseDoc of cases) {
        // Add case owner
        if (caseDoc.createdBy) {
          acl.push({
            user: caseDoc.createdBy,
            role: 'owner',
            permissions: ['view', 'download', 'edit', 'delete', 'share'],
            source: 'case_owner'
          });
        }

        // Add collaborators
        if (caseDoc.collaborators) {
          for (const collaborator of caseDoc.collaborators) {
            acl.push({
              user: collaborator.user,
              role: collaborator.role,
              permissions: collaborator.permissions,
              source: 'case_collaborator',
              addedAt: collaborator.addedAt
            });
          }
        }

        // Add uploader if different from owner
        const multimediaItem = caseDoc.multimediaContent.find(
          content => content.fileId === multimediaId
        );

        if (multimediaItem && multimediaItem.uploadedBy &&
            multimediaItem.uploadedBy.toString() !== caseDoc.createdBy?._id?.toString()) {
          acl.push({
            user: multimediaItem.uploadedBy,
            role: 'uploader',
            permissions: ['view', 'download', 'edit', 'delete'],
            source: 'content_uploader'
          });
        }
      }

      // Remove duplicates based on user ID
      const uniqueAcl = acl.filter((item, index, self) =>
        index === self.findIndex(other => other.user._id?.toString() === item.user._id?.toString())
      );

      return uniqueAcl;
    } catch (error) {
      console.error('Get access control list error:', error);
      return [];
    }
  }

  /**
   * Bulk permission operations
   * @param {Array} operations - Array of permission operations
   * @param {Object} user - User performing operations
   * @returns {Promise<Array>} - Operation results
   */
  async bulkPermissionOperations(operations, user) {
    try {
      const results = [];

      for (const operation of operations) {
        try {
          let result = false;

          switch (operation.action) {
            case 'grant':
              result = await this.grantMultimediaPermissions(
                operation.multimediaId,
                operation.targetUserId,
                operation.permissions,
                user
              );
              break;
            case 'revoke':
              result = await this.revokeMultimediaPermissions(
                operation.multimediaId,
                operation.targetUserId,
                user
              );
              break;
            default:
              throw new Error(`Unknown operation: ${operation.action}`);
          }

          results.push({
            operation: operation,
            success: result,
            error: null
          });
        } catch (error) {
          results.push({
            operation: operation,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Bulk permission operations error:', error);
      throw error;
    }
  }
}

export default new MultimediaAccessControlService();