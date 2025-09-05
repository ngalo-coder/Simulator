import Case from '../models/CaseModel.js';
import auditLogger from './AuditLoggerService.js';

/**
 * Case Content Analytics Service
 * Handles analytics and usage tracking for case content
 */
class CaseContentAnalyticsService {
  constructor() {
    this.analyticsRetentionDays = 365; // Keep analytics for 1 year
    this.popularThreshold = 10; // Minimum usage count for popular content
  }

  /**
   * Track case access event
   * @param {string} caseId - Case ID
   * @param {Object} user - User accessing the case
   * @param {string} accessType - Type of access (view, edit, simulation, etc.)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async trackCaseAccess(caseId, user, accessType = 'view', metadata = {}) {
    try {
      const caseDoc = await Case.findById(caseId);

      if (!caseDoc) {
        console.warn(`Case not found for analytics tracking: ${caseId}`);
        return;
      }

      // Update case usage statistics
      const updateData = {
        lastAccessedAt: new Date(),
        $inc: { accessCount: 1 }
      };

      // Update specific counters based on access type
      switch (accessType) {
        case 'simulation':
          updateData.$inc.usageCount = 1;
          break;
        case 'edit':
          updateData.$inc.editCount = 1;
          break;
        case 'download':
          updateData.$inc.downloadCount = 1;
          break;
      }

      await Case.findByIdAndUpdate(caseId, updateData);

      // Log access event
      await auditLogger.logAuthEvent({
        event: 'CASE_ACCESSED',
        userId: user._id,
        username: user.username,
        metadata: {
          caseId,
          caseTitle: caseDoc.case_metadata?.title,
          accessType,
          userRole: user.primaryRole,
          ...metadata
        }
      });

    } catch (error) {
      console.error('Track case access error:', error);
    }
  }

  /**
   * Get case usage analytics
   * @param {string} caseId - Case ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} - Case analytics
   */
  async getCaseAnalytics(caseId, options = {}) {
    try {
      const { period = 'all', includeTrends = true } = options;

      const caseDoc = await Case.findById(caseId)
        .populate('createdBy', 'username profile.firstName profile.lastName')
        .lean();

      if (!caseDoc) {
        throw new Error('Case not found');
      }

      const analytics = {
        caseId,
        title: caseDoc.case_metadata?.title,
        specialty: caseDoc.case_metadata?.specialty,
        difficulty: caseDoc.case_metadata?.difficulty,
        status: caseDoc.status,
        createdAt: caseDoc.createdAt,
        lastAccessedAt: caseDoc.lastAccessedAt,
        usageStats: {
          totalAccessCount: caseDoc.accessCount || 0,
          totalUsageCount: caseDoc.usageCount || 0,
          totalEditCount: caseDoc.editCount || 0,
          totalDownloadCount: caseDoc.downloadCount || 0,
          averageRating: caseDoc.averageRating || 0,
          totalRatings: caseDoc.totalRatings || 0
        },
        multimediaStats: this.calculateMultimediaStats(caseDoc.multimediaContent || []),
        engagementMetrics: await this.calculateEngagementMetrics(caseId, period)
      };

      if (includeTrends) {
        analytics.trends = await this.calculateUsageTrends(caseId, period);
      }

      return analytics;
    } catch (error) {
      console.error('Get case analytics error:', error);
      throw error;
    }
  }

  /**
   * Get system-wide case analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} - System analytics
   */
  async getSystemCaseAnalytics(options = {}) {
    try {
      const { period = 'all', includeTrends = true } = options;

      const [
        totalCases,
        casesByStatus,
        casesBySpecialty,
        casesByDifficulty,
        topUsedCases,
        multimediaStats,
        userEngagementStats
      ] = await Promise.all([
        Case.countDocuments(),

        // Cases by status
        Case.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),

        // Cases by specialty
        Case.aggregate([
          { $group: { _id: '$case_metadata.specialty', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),

        // Cases by difficulty
        Case.aggregate([
          { $group: { _id: '$case_metadata.difficulty', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),

        // Top used cases
        Case.find()
          .sort({ usageCount: -1 })
          .limit(10)
          .select('case_metadata.title usageCount accessCount averageRating')
          .lean(),

        // Multimedia statistics
        this.getSystemMultimediaStats(),

        // User engagement statistics
        this.getUserEngagementStats()
      ]);

      const analytics = {
        overview: {
          totalCases,
          totalActiveCases: casesByStatus.find(s => s._id === 'published')?.count || 0,
          totalDraftCases: casesByStatus.find(s => s._id === 'draft')?.count || 0,
          totalArchivedCases: casesByStatus.find(s => s._id === 'archived')?.count || 0
        },
        distribution: {
          byStatus: casesByStatus,
          bySpecialty: casesBySpecialty,
          byDifficulty: casesByDifficulty
        },
        topContent: topUsedCases,
        multimediaStats,
        userEngagementStats
      };

      if (includeTrends) {
        analytics.trends = await this.calculateSystemTrends(period);
      }

      return analytics;
    } catch (error) {
      console.error('Get system case analytics error:', error);
      throw error;
    }
  }

  /**
   * Generate case usage report
   * @param {Object} filters - Report filters
   * @param {Object} user - User requesting report
   * @returns {Promise<Object>} - Usage report
   */
  async generateUsageReport(filters = {}, user) {
    try {
      const {
        startDate,
        endDate,
        caseIds,
        userIds,
        specialties,
        includeMultimedia = true
      } = filters;

      let query = {};

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Case IDs filter
      if (caseIds && caseIds.length > 0) {
        query._id = { $in: caseIds };
      }

      // User filter
      if (userIds && userIds.length > 0) {
        query.createdBy = { $in: userIds };
      }

      // Specialty filter
      if (specialties && specialties.length > 0) {
        query['case_metadata.specialty'] = { $in: specialties };
      }

      // Apply user access control
      if (user.primaryRole !== 'admin') {
        query.$or = [
          { createdBy: user._id },
          { 'collaborators.user': user._id },
          { status: 'published' }
        ];
      }

      const cases = await Case.find(query)
        .populate('createdBy', 'username profile.firstName profile.lastName')
        .select('case_metadata.title case_metadata.specialty usageCount accessCount createdAt lastAccessedAt multimediaContent')
        .lean();

      const report = {
        generatedAt: new Date(),
        generatedBy: user.username,
        filters: Object.keys(filters).filter(key => filters[key] !== undefined),
        summary: {
          totalCases: cases.length,
          totalUsage: cases.reduce((sum, c) => sum + (c.usageCount || 0), 0),
          totalAccess: cases.reduce((sum, c) => sum + (c.accessCount || 0), 0),
          averageUsagePerCase: cases.length > 0 ?
            (cases.reduce((sum, c) => sum + (c.usageCount || 0), 0) / cases.length).toFixed(2) : 0
        },
        cases: cases.map(c => ({
          id: c._id,
          title: c.case_metadata?.title,
          specialty: c.case_metadata?.specialty,
          usageCount: c.usageCount || 0,
          accessCount: c.accessCount || 0,
          createdAt: c.createdAt,
          lastAccessedAt: c.lastAccessedAt,
          multimediaCount: c.multimediaContent?.length || 0
        }))
      };

      if (includeMultimedia) {
        report.multimediaSummary = await this.getSystemMultimediaStats();
      }

      return report;
    } catch (error) {
      console.error('Generate usage report error:', error);
      throw error;
    }
  }

  // Helper methods

  calculateMultimediaStats(multimediaContent) {
    if (!multimediaContent || multimediaContent.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        byType: {},
        byCategory: {},
        mostAccessed: null
      };
    }

    const byType = {};
    const byCategory = {};
    let totalSize = 0;
    let mostAccessed = null;
    let maxAccessCount = 0;

    multimediaContent.forEach(item => {
      // Count by type
      byType[item.type] = (byType[item.type] || 0) + 1;

      // Count by category
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;

      // Track total size
      totalSize += item.size || 0;

      // Track most accessed
      const accessCount = item.accessCount || 0;
      if (accessCount > maxAccessCount) {
        maxAccessCount = accessCount;
        mostAccessed = {
          fileId: item.fileId,
          filename: item.filename,
          accessCount: accessCount
        };
      }
    });

    return {
      totalFiles: multimediaContent.length,
      totalSize,
      byType,
      byCategory,
      mostAccessed
    };
  }

  async calculateEngagementMetrics(caseId, period) {
    try {
      // This would typically query detailed usage logs
      // For now, return basic metrics from case data
      const caseDoc = await Case.findById(caseId).lean();

      if (!caseDoc) return {};

      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(caseDoc.createdAt)) / (1000 * 60 * 60 * 24)
      );

      return {
        averageDailyUsage: daysSinceCreation > 0 ?
          ((caseDoc.usageCount || 0) / daysSinceCreation).toFixed(2) : 0,
        engagementRate: caseDoc.accessCount > 0 ?
          ((caseDoc.usageCount || 0) / caseDoc.accessCount * 100).toFixed(2) : 0,
        daysSinceLastAccess: caseDoc.lastAccessedAt ?
          Math.floor((Date.now() - new Date(caseDoc.lastAccessedAt)) / (1000 * 60 * 60 * 24)) : null,
        totalEngagementTime: 0, // Would need detailed tracking
        completionRate: 0 // Would need simulation completion tracking
      };
    } catch (error) {
      console.error('Calculate engagement metrics error:', error);
      return {};
    }
  }

  async calculateUsageTrends(caseId, period) {
    try {
      // This would typically analyze historical usage data
      // For now, return simplified trend data
      return {
        trend: 'stable', // increasing, decreasing, stable
        changePercent: 0,
        period: period,
        dataPoints: [] // Would contain time-series data
      };
    } catch (error) {
      console.error('Calculate usage trends error:', error);
      return {};
    }
  }

  async getSystemMultimediaStats() {
    try {
      const stats = await Case.aggregate([
        { $unwind: '$multimediaContent' },
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: '$multimediaContent.size' },
            totalAccessCount: { $sum: '$multimediaContent.accessCount' },
            byType: {
              $push: '$multimediaContent.type'
            },
            byCategory: {
              $push: '$multimediaContent.category'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalFiles: 0,
          totalSize: 0,
          totalAccessCount: 0,
          byType: {},
          byCategory: {}
        };
      }

      const result = stats[0];

      // Count occurrences
      const byType = {};
      const byCategory = {};

      result.byType.forEach(type => {
        byType[type] = (byType[type] || 0) + 1;
      });

      result.byCategory.forEach(category => {
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      return {
        totalFiles: result.totalFiles,
        totalSize: result.totalSize,
        totalAccessCount: result.totalAccessCount,
        byType,
        byCategory
      };
    } catch (error) {
      console.error('Get system multimedia stats error:', error);
      return {};
    }
  }

  async getUserEngagementStats() {
    try {
      const stats = await Case.aggregate([
        {
          $group: {
            _id: '$createdBy',
            caseCount: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' },
            totalAccess: { $sum: '$accessCount' },
            averageRating: { $avg: '$averageRating' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            username: '$user.username',
            caseCount: 1,
            totalUsage: 1,
            totalAccess: 1,
            averageRating: 1,
            engagementScore: {
              $add: [
                { $multiply: ['$totalUsage', 2] },
                '$totalAccess',
                { $multiply: ['$averageRating', 10] }
              ]
            }
          }
        },
        { $sort: { engagementScore: -1 } },
        { $limit: 10 }
      ]);

      return stats;
    } catch (error) {
      console.error('Get user engagement stats error:', error);
      return [];
    }
  }

  async calculateSystemTrends(period) {
    try {
      // This would analyze system-wide trends over time
      // For now, return simplified trend data
      return {
        caseCreationTrend: 'increasing',
        usageTrend: 'stable',
        userEngagementTrend: 'increasing',
        period: period,
        dataPoints: []
      };
    } catch (error) {
      console.error('Calculate system trends error:', error);
      return {};
    }
  }
}

export default new CaseContentAnalyticsService();