import Case from '../models/CaseModel.js';
import User from '../models/UserModel.js';
import auditLogger from './AuditLoggerService.js';
import mongoose from 'mongoose';

/**
 * Case Management Service
 * Handles case creation, editing, versioning, approval workflow, and collaboration for educators
 */
class CaseManagementService {
  constructor() {
    this.defaultPageSize = 20;
    this.maxPageSize = 100;
    this.caseStatuses = {
      DRAFT: 'draft',
      PENDING_REVIEW: 'pending_review',
      APPROVED: 'approved',
      PUBLISHED: 'published',
      ARCHIVED: 'archived',
      REJECTED: 'rejected'
    };
  }

  /**
   * Create a new case
   * @param {Object} caseData - Case data
   * @param {Object} user - User creating the case
   * @returns {Promise<Object>} - Created case
   */
  async createCase(caseData, user) {
    try {
      // Validate case data
      this.validateCaseData(caseData);

      // Generate unique case ID if not provided
      if (!caseData.case_metadata?.case_id) {
        if (!caseData.case_metadata) caseData.case_metadata = {};
        caseData.case_metadata.case_id = await this.generateCaseId(caseData.case_metadata.specialty || 'general');
      }

      // Set initial metadata
      const caseDoc = new Case({
        ...caseData,
        createdBy: user._id,
        lastModifiedBy: user._id,
        status: this.caseStatuses.DRAFT,
        version: 1,
        versionHistory: [{
          version: 1,
          createdBy: user._id,
          createdAt: new Date(),
          changes: 'Initial case creation',
          status: this.caseStatuses.DRAFT
        }],
        collaborators: [{
          user: user._id,
          role: 'owner',
          permissions: ['read', 'write', 'delete', 'share'],
          addedAt: new Date()
        }]
      });

      await caseDoc.save();

      // Log case creation
      await auditLogger.logAuthEvent({
        event: 'CASE_CREATED',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case',
          specialty: caseDoc.case_metadata?.specialty || 'general'
        }
      });

      return await this.getCaseById(caseDoc._id, user);
    } catch (error) {
      console.error('Create case error:', error);
      throw error;
    }
  }

  /**
   * Get case by ID with permission checking
   * @param {string} caseId - Case ID
   * @param {Object} user - User making the request
   * @returns {Promise<Object>} - Case details
   */
  async getCaseById(caseId, user) {
    try {
      const caseDoc = await Case.findById(caseId)
        .populate('createdBy', 'username profile.firstName profile.lastName')
        .populate('lastModifiedBy', 'username profile.firstName profile.lastName')
        .populate('reviewedBy', 'username profile.firstName profile.lastName')
        .lean();
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check permissions
      if (!this.canUserAccessCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      return caseDoc;
    } catch (error) {
      console.error('Get case by ID error:', error);
      throw error;
    }
  }

  /**
   * Update an existing case
   * @param {string} caseId - Case ID
   * @param {Object} updateData - Update data
   * @param {Object} user - User updating the case
   * @returns {Promise<Object>} - Updated case
   */
  async updateCase(caseId, updateData, user) {
    try {
      const caseDoc = await Case.findById(caseId);
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check permissions
      if (!this.canUserEditCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      // Validate update data
      this.validateCaseData(updateData, true);

      // Store original data for version history
      const originalData = caseDoc.toObject();
      
      // Update case fields
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
          caseDoc[key] = updateData[key];
        }
      });

      // Update metadata
      caseDoc.lastModifiedBy = user._id;
      caseDoc.lastModifiedAt = new Date();

      // If case was approved and now being edited, reset to draft
      if (caseDoc.status === this.caseStatuses.APPROVED || 
          caseDoc.status === this.caseStatuses.PUBLISHED) {
        caseDoc.status = this.caseStatuses.DRAFT;
      }

      // Add to version history
      const changes = this.generateChangeDescription(originalData, updateData);
      if (!caseDoc.versionHistory) caseDoc.versionHistory = [];
      caseDoc.versionHistory.push({
        version: caseDoc.version + 1,
        createdBy: user._id,
        createdAt: new Date(),
        changes: changes,
        status: caseDoc.status
      });

      caseDoc.version = (caseDoc.version || 1) + 1;

      await caseDoc.save();

      // Log case update
      await auditLogger.logAuthEvent({
        event: 'CASE_UPDATED',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case',
          version: caseDoc.version,
          changes: changes
        }
      });

      return await this.getCaseById(caseDoc._id, user);
    } catch (error) {
      console.error('Update case error:', error);
      throw error;
    }
  }

  /**
   * Delete a case
   * @param {string} caseId - Case ID
   * @param {Object} user - User deleting the case
   * @returns {Promise<boolean>} - Success status
   */
  async deleteCase(caseId, user) {
    try {
      const caseDoc = await Case.findById(caseId);
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check permissions
      if (!this.canUserDeleteCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      // Soft delete - archive instead of hard delete
      caseDoc.status = this.caseStatuses.ARCHIVED;
      caseDoc.archivedAt = new Date();
      caseDoc.archivedBy = user._id;
      await caseDoc.save();

      // Log case deletion
      await auditLogger.logAuthEvent({
        event: 'CASE_DELETED',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case'
        }
      });

      return true;
    } catch (error) {
      console.error('Delete case error:', error);
      throw error;
    }
  }

  /**
   * Submit case for review
   * @param {string} caseId - Case ID
   * @param {Object} user - User submitting the case
   * @returns {Promise<Object>} - Updated case
   */
  async submitForReview(caseId, user) {
    try {
      const caseDoc = await Case.findById(caseId);
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check permissions
      if (!this.canUserEditCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      // Validate case is complete enough for review
      this.validateCaseForReview(caseDoc);

      // Update status
      caseDoc.status = this.caseStatuses.PENDING_REVIEW;
      caseDoc.submittedForReviewAt = new Date();
      caseDoc.submittedForReviewBy = user._id;

      // Add to version history
      if (!caseDoc.versionHistory) caseDoc.versionHistory = [];
      caseDoc.versionHistory.push({
        version: caseDoc.version || 1,
        createdBy: user._id,
        createdAt: new Date(),
        changes: 'Submitted for review',
        status: this.caseStatuses.PENDING_REVIEW
      });

      await caseDoc.save();

      // Log submission
      await auditLogger.logAuthEvent({
        event: 'CASE_SUBMITTED_FOR_REVIEW',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case'
        }
      });

      return await this.getCaseById(caseDoc._id, user);
    } catch (error) {
      console.error('Submit for review error:', error);
      throw error;
    }
  }

  /**
   * Review and approve/reject a case
   * @param {string} caseId - Case ID
   * @param {Object} reviewData - Review data
   * @param {Object} user - User reviewing the case
   * @returns {Promise<Object>} - Updated case
   */
  async reviewCase(caseId, reviewData, user) {
    try {
      const { action, comments, suggestions } = reviewData;
      
      if (!['approve', 'reject'].includes(action)) {
        throw new Error('Invalid review action');
      }

      const caseDoc = await Case.findById(caseId);
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check if user can review cases (admin or senior educator)
      if (!this.canUserReviewCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      // Update case status
      const newStatus = action === 'approve' ? this.caseStatuses.APPROVED : this.caseStatuses.REJECTED;
      caseDoc.status = newStatus;
      caseDoc.reviewedAt = new Date();
      caseDoc.reviewedBy = user._id;
      caseDoc.reviewComments = comments;
      caseDoc.reviewSuggestions = suggestions;

      // Add to version history
      if (!caseDoc.versionHistory) caseDoc.versionHistory = [];
      caseDoc.versionHistory.push({
        version: caseDoc.version || 1,
        createdBy: user._id,
        createdAt: new Date(),
        changes: `Case ${action}ed by reviewer`,
        status: newStatus,
        reviewComments: comments,
        reviewSuggestions: suggestions
      });

      await caseDoc.save();

      // Log review
      await auditLogger.logAuthEvent({
        event: `CASE_${action.toUpperCase()}ED`,
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case',
          comments: comments
        }
      });

      return await this.getCaseById(caseDoc._id, user);
    } catch (error) {
      console.error('Review case error:', error);
      throw error;
    }
  }

  /**
   * Publish an approved case
   * @param {string} caseId - Case ID
   * @param {Object} user - User publishing the case
   * @returns {Promise<Object>} - Updated case
   */
  async publishCase(caseId, user) {
    try {
      const caseDoc = await Case.findById(caseId);
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check permissions and status
      if (!this.canUserPublishCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      if (caseDoc.status !== this.caseStatuses.APPROVED) {
        throw new Error('Case must be approved before publishing');
      }

      // Update status
      caseDoc.status = this.caseStatuses.PUBLISHED;
      caseDoc.publishedAt = new Date();
      caseDoc.publishedBy = user._id;

      // Add to version history
      if (!caseDoc.versionHistory) caseDoc.versionHistory = [];
      caseDoc.versionHistory.push({
        version: caseDoc.version || 1,
        createdBy: user._id,
        createdAt: new Date(),
        changes: 'Case published',
        status: this.caseStatuses.PUBLISHED
      });

      await caseDoc.save();

      // Log publication
      await auditLogger.logAuthEvent({
        event: 'CASE_PUBLISHED',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case'
        }
      });

      return await this.getCaseById(caseDoc._id, user);
    } catch (error) {
      console.error('Publish case error:', error);
      throw error;
    }
  }

  /**
   * Add collaborator to a case
   * @param {string} caseId - Case ID
   * @param {Object} collaboratorData - Collaborator data
   * @param {Object} user - User adding the collaborator
   * @returns {Promise<Object>} - Updated case
   */
  async addCollaborator(caseId, collaboratorData, user) {
    try {
      const { userId, role, permissions } = collaboratorData;
      
      const caseDoc = await Case.findById(caseId);
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check permissions
      if (!this.canUserShareCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      // Check if user exists
      const collaboratorUser = await User.findById(userId);
      if (!collaboratorUser) {
        throw new Error('Collaborator user not found');
      }

      // Initialize collaborators array if it doesn't exist
      if (!caseDoc.collaborators) {
        caseDoc.collaborators = [];
      }

      // Check if already a collaborator
      const existingCollaborator = caseDoc.collaborators.find(
        collab => collab.user.toString() === userId
      );

      if (existingCollaborator) {
        // Update existing collaborator
        existingCollaborator.role = role;
        existingCollaborator.permissions = permissions;
        existingCollaborator.updatedAt = new Date();
      } else {
        // Add new collaborator
        caseDoc.collaborators.push({
          user: userId,
          role: role,
          permissions: permissions,
          addedBy: user._id,
          addedAt: new Date()
        });
      }

      await caseDoc.save();

      // Log collaboration
      await auditLogger.logAuthEvent({
        event: 'CASE_COLLABORATOR_ADDED',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case',
          collaboratorId: userId,
          collaboratorUsername: collaboratorUser.username,
          role: role
        }
      });

      return await this.getCaseById(caseDoc._id, user);
    } catch (error) {
      console.error('Add collaborator error:', error);
      throw error;
    }
  }

  /**
   * Remove collaborator from a case
   * @param {string} caseId - Case ID
   * @param {string} collaboratorId - Collaborator user ID
   * @param {Object} user - User removing the collaborator
   * @returns {Promise<Object>} - Updated case
   */
  async removeCollaborator(caseId, collaboratorId, user) {
    try {
      const caseDoc = await Case.findById(caseId);
      
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Check permissions
      if (!this.canUserShareCase(caseDoc, user)) {
        throw new Error('Access denied');
      }

      // Initialize collaborators array if it doesn't exist
      if (!caseDoc.collaborators) {
        caseDoc.collaborators = [];
      }

      // Cannot remove the owner
      const collaborator = caseDoc.collaborators.find(
        collab => collab.user.toString() === collaboratorId
      );

      if (!collaborator) {
        throw new Error('Collaborator not found');
      }

      if (collaborator.role === 'owner') {
        throw new Error('Cannot remove case owner');
      }

      // Remove collaborator
      caseDoc.collaborators = caseDoc.collaborators.filter(
        collab => collab.user.toString() !== collaboratorId
      );

      await caseDoc.save();

      // Log removal
      await auditLogger.logAuthEvent({
        event: 'CASE_COLLABORATOR_REMOVED',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId: caseDoc._id,
          caseTitle: caseDoc.case_metadata?.title || 'Untitled Case',
          collaboratorId: collaboratorId
        }
      });

      return await this.getCaseById(caseDoc._id, user);
    } catch (error) {
      console.error('Remove collaborator error:', error);
      throw error;
    }
  }

  /**
   * Get case statistics
   * @param {Object} user - User requesting statistics
   * @returns {Promise<Object>} - Case statistics
   */
  async getCaseStatistics(user) {
    try {
      const userQuery = this.buildUserCaseQuery(user);
      
      const [
        totalCases,
        draftCases,
        pendingReviewCases,
        approvedCases,
        publishedCases,
        casesBySpecialty,
        recentCases
      ] = await Promise.all([
        Case.countDocuments(userQuery),
        Case.countDocuments({ ...userQuery, status: this.caseStatuses.DRAFT }),
        Case.countDocuments({ ...userQuery, status: this.caseStatuses.PENDING_REVIEW }),
        Case.countDocuments({ ...userQuery, status: this.caseStatuses.APPROVED }),
        Case.countDocuments({ ...userQuery, status: this.caseStatuses.PUBLISHED }),
        
        Case.aggregate([
          { $match: userQuery },
          { $group: { _id: '$case_metadata.specialty', count: { $sum: 1 } } }
        ]),
        
        Case.countDocuments({
          ...userQuery,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        totalCases,
        draftCases,
        pendingReviewCases,
        approvedCases,
        publishedCases,
        archivedCases: totalCases - (draftCases + pendingReviewCases + approvedCases + publishedCases),
        recentCases,
        casesBySpecialty: casesBySpecialty.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Get case statistics error:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Helper method to build user-specific case query
   */
  buildUserCaseQuery(user) {
    if (user.primaryRole === 'admin') {
      return {};
    }
    
    return {
      $or: [
        { createdBy: user._id },
        { 'collaborators.user': user._id }
      ]
    };
  }

  /**
   * Permission checking methods
   */
  canUserAccessCase(caseDoc, user) {
    if (user.primaryRole === 'admin') return true;
    if (caseDoc.createdBy && caseDoc.createdBy.toString() === user._id.toString()) return true;
    if (caseDoc.status === this.caseStatuses.PUBLISHED) return true;
    if (caseDoc.collaborators && caseDoc.collaborators.some(collab => collab.user.toString() === user._id.toString())) return true;
    return false;
  }

  canUserEditCase(caseDoc, user) {
    if (user.primaryRole === 'admin') return true;
    if (caseDoc.createdBy && caseDoc.createdBy.toString() === user._id.toString()) return true;
    if (caseDoc.collaborators) {
      const collaborator = caseDoc.collaborators.find(collab => collab.user.toString() === user._id.toString());
      if (collaborator && collaborator.permissions.includes('write')) return true;
    }
    return false;
  }

  canUserDeleteCase(caseDoc, user) {
    if (user.primaryRole === 'admin') return true;
    if (caseDoc.createdBy && caseDoc.createdBy.toString() === user._id.toString()) return true;
    if (caseDoc.collaborators) {
      const collaborator = caseDoc.collaborators.find(collab => collab.user.toString() === user._id.toString());
      if (collaborator && collaborator.permissions.includes('delete')) return true;
    }
    return false;
  }

  canUserReviewCase(caseDoc, user) {
    return user.primaryRole === 'admin' || user.primaryRole === 'educator';
  }

  canUserPublishCase(caseDoc, user) {
    return user.primaryRole === 'admin' || user.primaryRole === 'educator';
  }

  canUserShareCase(caseDoc, user) {
    if (user.primaryRole === 'admin') return true;
    if (caseDoc.createdBy && caseDoc.createdBy.toString() === user._id.toString()) return true;
    if (caseDoc.collaborators) {
      const collaborator = caseDoc.collaborators.find(collab => collab.user.toString() === user._id.toString());
      if (collaborator && collaborator.permissions.includes('share')) return true;
    }
    return false;
  }

  validateCaseData(caseData, isUpdate = false) {
    if (!isUpdate) {
      if (!caseData.case_metadata) {
        throw new Error('Case metadata is required');
      }
      if (!caseData.case_metadata.title) {
        throw new Error('Case title is required');
      }
    }
    // Add more validation as needed
    return true;
  }

  validateCaseForReview(caseDoc) {
    if (!caseDoc.case_metadata?.title) {
      throw new Error('Case must have a title before review');
    }
    if (!caseDoc.description) {
      throw new Error('Case must have a description before review');
    }
    return true;
  }

  async generateCaseId(specialty) {
    const prefix = specialty.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}_${timestamp}_${random}`;
  }

  generateChangeDescription(originalData, updateData) {
    const changes = [];
    Object.keys(updateData).forEach(key => {
      if (originalData[key] !== updateData[key]) {
        changes.push(`Updated ${key}`);
      }
    });
    return changes.length > 0 ? changes.join(', ') : 'Minor updates';
  }
}

export default new CaseManagementService();