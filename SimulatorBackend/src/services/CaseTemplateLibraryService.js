import Case from '../models/CaseModel.js';
import auditLogger from './AuditLoggerService.js';

/**
 * Case Template Library Service
 * Handles template library management, discovery, and recommendation features
 */
class CaseTemplateLibraryService {
  constructor() {
    this.popularityThreshold = 5; // Minimum usage count for popular templates
    this.recentThreshold = 30; // Days for recent templates
    this.featuredCategories = ['cardiology', 'emergency_medicine', 'pediatrics'];
  }

  /**
   * Get template library with filtering and sorting
   * @param {Object} filters - Search and filter options
   * @param {Object} options - Pagination and sorting options
   * @param {Object} user - User requesting templates
   * @returns {Promise<Object>} - Template library results
   */
  async getTemplateLibrary(filters = {}, options = {}, user) {
    try {
      const {
        discipline,
        specialty,
        difficulty,
        tags,
        categories,
        searchQuery,
        isPublic = true,
        featured = false,
        popular = false,
        recent = false,
        sortBy = 'usageCount',
        sortOrder = 'desc'
      } = filters;

      const {
        page = 1,
        limit = 20,
        includeStats = true
      } = options;

      // Build query for template cases
      let query = { isTemplate: true };

      // Add user access control
      if (user.primaryRole !== 'admin') {
        query.$or = [
          { isPublic: true },
          { createdBy: user._id },
          { 'collaborators.user': user._id }
        ];
      } else if (isPublic !== undefined) {
        query.isPublic = isPublic;
      }

      // Add filters
      if (discipline) query['case_metadata.program_area'] = discipline;
      if (specialty) query['case_metadata.specialty'] = specialty;
      if (difficulty) query['case_metadata.difficulty'] = difficulty;

      if (tags && tags.length > 0) {
        query.tags = { $in: tags.map(tag => new RegExp(tag, 'i')) };
      }

      if (categories && categories.length > 0) {
        query.categories = { $in: categories };
      }

      // Add search query
      if (searchQuery) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { 'case_metadata.title': { $regex: searchQuery, $options: 'i' } },
            { 'case_metadata.specialty': { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { tags: { $in: [new RegExp(searchQuery, 'i')] } }
          ]
        });
      }

      // Add special filters
      if (featured) {
        query['case_metadata.specialty'] = { $in: this.featuredCategories };
        query.usageCount = { $gte: this.popularityThreshold };
      }

      if (popular) {
        query.usageCount = { $gte: this.popularityThreshold };
      }

      if (recent) {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - this.recentThreshold);
        query.createdAt = { $gte: recentDate };
      }

      // Build sort options
      const sortOptions = {};
      switch (sortBy) {
        case 'title':
          sortOptions['case_metadata.title'] = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'created':
          sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'updated':
          sortOptions.lastModified = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'rating':
          sortOptions.averageRating = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'usageCount':
        default:
          sortOptions.usageCount = sortOrder === 'desc' ? -1 : 1;
          break;
      }

      // Execute query
      const skip = (page - 1) * limit;

      const [templates, total] = await Promise.all([
        Case.find(query)
          .populate('createdBy', 'username profile.firstName profile.lastName')
          .populate('categories')
          .populate('lastModifiedBy', 'username profile.firstName profile.lastName')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Case.countDocuments(query)
      ]);

      // Add computed fields
      const enhancedTemplates = templates.map(template => ({
        ...template,
        computedFields: {
          isPopular: template.usageCount >= this.popularityThreshold,
          isRecent: this.isRecentTemplate(template.createdAt),
          isFeatured: this.isFeaturedTemplate(template),
          usageTrend: 'stable', // Placeholder for usage trend
          similarTemplates: [] // Placeholder for similar templates
        }
      }));

      // Get statistics if requested
      let stats = null;
      if (includeStats) {
        stats = await this.getLibraryStatistics(query);
      }

      return {
        templates: enhancedTemplates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats,
        filters: {
          applied: Object.keys(filters).filter(key => filters[key] !== undefined && filters[key] !== ''),
          available: await this.getAvailableFilters()
        }
      };
    } catch (error) {
      console.error('Get template library error:', error);
      throw error;
    }
  }

  /**
   * Get featured templates for homepage/dashboard
   * @param {Object} user - User requesting featured templates
   * @returns {Promise<Array>} - Featured templates
   */
  async getFeaturedTemplates(user) {
    try {
      const featuredTemplates = await this.getTemplateLibrary(
        { featured: true, limit: 6 },
        { includeStats: false },
        user
      );

      return featuredTemplates.templates;
    } catch (error) {
      console.error('Get featured templates error:', error);
      return [];
    }
  }

  /**
   * Get recommended templates for user
   * @param {Object} user - User to get recommendations for
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Recommended templates
   */
  async getRecommendedTemplates(user, limit = 5) {
    try {
      // Get user's usage history and preferences
      const userHistory = await this.getUserTemplateHistory(user._id);

      if (userHistory.length === 0) {
        // Return popular templates if no history
        return await this.getPopularTemplates(limit);
      }

      // Analyze user's preferences
      const preferences = this.analyzeUserPreferences(userHistory);

      // Find templates matching preferences
      const recommendations = await Case.find({
        isTemplate: true,
        isPublic: true,
        'case_metadata.specialty': { $in: preferences.specialties },
        'case_metadata.difficulty': { $in: preferences.difficulties },
        _id: { $nin: userHistory.map(h => h.templateId) } // Exclude already used
      })
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .populate('categories')
      .sort({ usageCount: -1, averageRating: -1 })
      .limit(limit)
      .lean();

      return recommendations;
    } catch (error) {
      console.error('Get recommended templates error:', error);
      return [];
    }
  }

  /**
   * Get popular templates
   * @param {number} limit - Number of templates to return
   * @returns {Promise<Array>} - Popular templates
   */
  async getPopularTemplates(limit = 10) {
    try {
      const popularTemplates = await Case.find({
        isTemplate: true,
        isPublic: true,
        usageCount: { $gte: this.popularityThreshold }
      })
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .populate('categories')
      .sort({ usageCount: -1, averageRating: -1 })
      .limit(limit)
      .lean();

      return popularTemplates;
    } catch (error) {
      console.error('Get popular templates error:', error);
      return [];
    }
  }

  /**
   * Get templates by category
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options
   * @param {Object} user - User requesting templates
   * @returns {Promise<Array>} - Templates in category
   */
  async getTemplatesByCategory(categoryId, options = {}, user) {
    try {
      const { limit = 20, sortBy = 'usageCount' } = options;

      const templates = await Case.find({
        isTemplate: true,
        categories: categoryId,
        $or: [
          { isPublic: true },
          { createdBy: user._id },
          { 'collaborators.user': user._id }
        ]
      })
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .populate('categories')
      .sort({ [sortBy]: -1 })
      .limit(limit)
      .lean();

      return templates;
    } catch (error) {
      console.error('Get templates by category error:', error);
      return [];
    }
  }

  /**
   * Search templates with advanced filtering
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @param {Object} user - User performing search
   * @returns {Promise<Object>} - Search results
   */
  async searchTemplates(query, filters = {}, user) {
    try {
      const searchFilters = {
        searchQuery: query,
        ...filters
      };

      return await this.getTemplateLibrary(searchFilters, {}, user);
    } catch (error) {
      console.error('Search templates error:', error);
      throw error;
    }
  }

  /**
   * Get template details with usage statistics
   * @param {string} templateId - Template ID
   * @param {Object} user - User requesting details
   * @returns {Promise<Object>} - Template details
   */
  async getTemplateDetails(templateId, user) {
    try {
      const template = await Case.findOne({
        _id: templateId,
        isTemplate: true,
        $or: [
          { isPublic: true },
          { createdBy: user._id },
          { 'collaborators.user': user._id }
        ]
      })
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .populate('categories')
      .populate('lastModifiedBy', 'username profile.firstName profile.lastName')
      .lean();

      if (!template) {
        throw new Error('Template not found or access denied');
      }

      // Get additional statistics
      const stats = await this.getTemplateStatistics(templateId);
      const similarTemplates = await this.getSimilarTemplates(template, 5);
      const usageHistory = await this.getTemplateUsageHistory(templateId, 10);

      return {
        ...template,
        statistics: stats,
        similarTemplates,
        usageHistory,
        computedFields: {
          isPopular: template.usageCount >= this.popularityThreshold,
          isRecent: this.isRecentTemplate(template.createdAt),
          isFeatured: this.isFeaturedTemplate(template)
        }
      };
    } catch (error) {
      console.error('Get template details error:', error);
      throw error;
    }
  }

  /**
   * Create a case from template
   * @param {string} templateId - Template ID
   * @param {Object} customization - Customization options
   * @param {Object} user - User creating the case
   * @returns {Promise<Object>} - Created case
   */
  async createCaseFromTemplate(templateId, customization = {}, user) {
    try {
      const template = await Case.findById(templateId);

      if (!template || !template.isTemplate) {
        throw new Error('Template not found');
      }

      // Check access permissions
      const hasAccess = template.isPublic ||
                       template.createdBy.toString() === user._id.toString() ||
                       template.collaborators?.some(collab => collab.user.toString() === user._id.toString());

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Create case from template
      const caseData = {
        version: 1,
        description: customization.description || template.description,
        system_instruction: template.system_instruction,
        case_metadata: {
          ...template.case_metadata.toObject(),
          case_id: await this.generateCaseId(template.case_metadata.specialty || 'general'),
          title: customization.title || `${template.case_metadata.title} (from template)`
        },
        patient_persona: template.patient_persona,
        initial_prompt: template.initial_prompt,
        clinical_dossier: template.clinical_dossier,
        simulation_triggers: template.simulation_triggers,
        evaluation_criteria: template.evaluation_criteria,
        multimediaContent: template.multimediaContent || [],
        categories: template.categories || [],
        tags: [...(template.tags || []), 'from_template'],
        templateSource: templateId,
        status: 'draft',
        createdBy: user._id,
        lastModifiedBy: user._id
      };

      const newCase = new Case(caseData);
      await newCase.save();

      // Increment template usage count
      await Case.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

      // Log template usage
      await auditLogger.logAuthEvent({
        event: 'TEMPLATE_USED',
        userId: user._id,
        username: user.username,
        metadata: {
          templateId,
          caseId: newCase._id,
          templateTitle: template.case_metadata.title,
          caseTitle: newCase.case_metadata.title
        }
      });

      return newCase;
    } catch (error) {
      console.error('Create case from template error:', error);
      throw error;
    }
  }

  /**
   * Rate a template
   * @param {string} templateId - Template ID
   * @param {number} rating - Rating (1-5)
   * @param {Object} user - User rating the template
   * @returns {Promise<Object>} - Updated template
   */
  async rateTemplate(templateId, rating, user) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const template = await Case.findById(templateId);

      if (!template || !template.isTemplate) {
        throw new Error('Template not found');
      }

      // Initialize ratings array if it doesn't exist
      if (!template.ratings) {
        template.ratings = [];
      }

      // Remove existing rating from this user
      template.ratings = template.ratings.filter(r => r.user.toString() !== user._id.toString());

      // Add new rating
      template.ratings.push({
        user: user._id,
        rating,
        ratedAt: new Date()
      });

      // Recalculate average rating
      const totalRating = template.ratings.reduce((sum, r) => sum + r.rating, 0);
      template.averageRating = totalRating / template.ratings.length;
      template.totalRatings = template.ratings.length;

      await template.save();

      return template;
    } catch (error) {
      console.error('Rate template error:', error);
      throw error;
    }
  }

  // Helper methods

  async getUserTemplateHistory(userId) {
    // This would typically query a usage history collection
    // For now, return empty array
    return [];
  }

  analyzeUserPreferences(history) {
    // Analyze user's template usage patterns
    const specialties = [...new Set(history.map(h => h.specialty))];
    const difficulties = [...new Set(history.map(h => h.difficulty))];

    return { specialties, difficulties };
  }

  isRecentTemplate(createdAt) {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - this.recentThreshold);
    return new Date(createdAt) >= recentDate;
  }

  isFeaturedTemplate(template) {
    return this.featuredCategories.includes(template.case_metadata?.specialty) &&
           template.usageCount >= this.popularityThreshold;
  }

  async getUsageTrend(templateId) {
    // Calculate usage trend (simplified)
    return 'stable'; // stable, increasing, decreasing
  }

  async getSimilarTemplates(template, limit) {
    try {
      const similarTemplates = await Case.find({
        isTemplate: true,
        isPublic: true,
        _id: { $ne: template._id },
        $or: [
          { 'case_metadata.specialty': template.case_metadata?.specialty },
          { 'case_metadata.difficulty': template.case_metadata?.difficulty },
          { categories: { $in: template.categories || [] } }
        ]
      })
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .sort({ usageCount: -1 })
      .limit(limit)
      .lean();

      return similarTemplates;
    } catch (error) {
      console.error('Get similar templates error:', error);
      return [];
    }
  }

  async getLibraryStatistics(query) {
    try {
      const stats = await Case.aggregate([
        { $match: { ...query, isTemplate: true } },
        {
          $group: {
            _id: null,
            totalTemplates: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' },
            averageRating: { $avg: '$averageRating' },
            specialties: { $addToSet: '$case_metadata.specialty' },
            difficulties: { $addToSet: '$case_metadata.difficulty' }
          }
        }
      ]);

      return stats[0] || {
        totalTemplates: 0,
        totalUsage: 0,
        averageRating: 0,
        specialties: [],
        difficulties: []
      };
    } catch (error) {
      console.error('Get library statistics error:', error);
      return {};
    }
  }

  async getAvailableFilters() {
    try {
      const filters = await Case.aggregate([
        { $match: { isTemplate: true, isPublic: true } },
        {
          $group: {
            _id: null,
            disciplines: { $addToSet: '$case_metadata.program_area' },
            specialties: { $addToSet: '$case_metadata.specialty' },
            difficulties: { $addToSet: '$case_metadata.difficulty' }
          }
        }
      ]);

      return filters[0] || {
        disciplines: [],
        specialties: [],
        difficulties: []
      };
    } catch (error) {
      console.error('Get available filters error:', error);
      return {};
    }
  }

  async getTemplateStatistics(templateId) {
    try {
      // Get usage statistics for the template
      const template = await Case.findById(templateId).lean();

      if (!template) return {};

      return {
        usageCount: template.usageCount || 0,
        averageRating: template.averageRating || 0,
        totalRatings: template.totalRatings || 0,
        lastUsed: template.lastAccessedAt,
        createdAt: template.createdAt,
        daysSinceCreation: Math.floor((Date.now() - new Date(template.createdAt)) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      console.error('Get template statistics error:', error);
      return {};
    }
  }

  async getTemplateUsageHistory(templateId, limit) {
    // This would typically query a usage history collection
    // For now, return empty array
    return [];
  }

  async generateCaseId(specialty) {
    const prefix = specialty.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}_${timestamp}_${random}`;
  }
}

export default new CaseTemplateLibraryService();