import express from 'express';
import ContributedCase from '../models/ContributedCaseModel.js';
import Case from '../models/CaseModel.js';
import ClinicianPerformance from '../models/ClinicianPerformanceModel.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Contribution
 *   description: Admin management of contributed cases and review process
 */

/**
 * @swagger
 * /admin/contribution/contributed-cases:
 *   get:
 *     summary: Get all contributed cases for admin review
 *     description: Retrieves a paginated list of contributed cases with filtering options
 *     tags: [Admin Contribution]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, under_review, approved, rejected, needs_revision, all]
 *         description: Filter by case status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by specialty
 *     responses:
 *       200:
 *         description: List of contributed cases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContributedCase'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/contributed-cases', async (req, res) => {
  try {
    const { status = 'submitted', page = 1, limit = 20, specialty } = req.query;
    
    let query = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (specialty) {
      query['caseData.case_metadata.specialty'] = specialty;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const cases = await ContributedCase.find(query)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('_id contributorName contributorEmail status caseData.case_metadata submittedAt reviewComments reviewedBy reviewedAt');
    
    const total = await ContributedCase.countDocuments(query);
    
    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching contributed cases:', error);
    res.status(500).json({ error: 'Failed to fetch contributed cases' });
  }
});

/**
 * @swagger
 * /admin/contribution/contributed-cases/{caseId}:
 *   get:
 *     summary: Get full case details for review
 *     description: Retrieves detailed information about a specific contributed case including contributor performance
 *     tags: [Admin Contribution]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the contributed case to retrieve
 *     responses:
 *       200:
 *         description: Case details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 contributorName:
 *                   type: string
 *                 contributorEmail:
 *                   type: string
 *                 status:
 *                   type: string
 *                 caseData:
 *                   $ref: '#/components/schemas/Case'
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 *                 reviewComments:
 *                   type: string
 *                 reviewedBy:
 *                   type: string
 *                 reviewedAt:
 *                   type: string
 *                   format: date-time
 *                 contributorPerformance:
 *                   type: object
 *                   properties:
 *                     totalCases:
 *                       type: integer
 *                     excellentCount:
 *                       type: integer
 *                     averageRating:
 *                       type: number
 *                     contributionHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                     eligibleSpecialties:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/contributed-cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const contributedCase = await ContributedCase.findById(caseId);
    
    if (!contributedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Get contributor performance info
    const performance = await ClinicianPerformance.findOne({ 
      userId: contributedCase.contributorId 
    });
    
    res.json({
      ...contributedCase.toObject(),
      contributorPerformance: performance ? {
        totalCases: performance.performanceStats.totalCases,
        excellentCount: performance.performanceStats.excellentCount,
        averageRating: performance.performanceStats.averageRating,
        contributionHistory: performance.contributionHistory,
        eligibleSpecialties: performance.contributorStatus.eligibleSpecialties
      } : null
    });
  } catch (error) {
    console.error('Error fetching case details:', error);
    res.status(500).json({ error: 'Failed to fetch case details' });
  }
});

/**
 * @swagger
 * /admin/contribution/contributed-cases/{caseId}/approve:
 *   post:
 *     summary: Approve case and add to main database
 *     description: Approves a contributed case and adds it to the main case database
 *     tags: [Admin Contribution]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to approve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewerId
 *               - reviewerName
 *             properties:
 *               reviewerId:
 *                 type: string
 *                 description: ID of the reviewer
 *               reviewerName:
 *                 type: string
 *                 description: Name of the reviewer
 *               reviewComments:
 *                 type: string
 *                 description: Comments from the reviewer
 *     responses:
 *       200:
 *         description: Case approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newCaseId:
 *                   type: string
 *                 caseId:
 *                   type: string
 *       400:
 *         description: Bad request - case not in reviewable state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/contributed-cases/:caseId/approve', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reviewerId, reviewerName, reviewComments } = req.body;
    
    const contributedCase = await ContributedCase.findById(caseId);
    
    if (!contributedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    if (contributedCase.status !== 'submitted' && contributedCase.status !== 'under_review') {
      return res.status(400).json({ error: 'Case is not in a reviewable state' });
    }
    
    // Create new case in main database
    const newCase = new Case(contributedCase.caseData);
    await newCase.save();
    
    // Update contributed case status
    contributedCase.status = 'approved';
    contributedCase.reviewedBy = reviewerId;
    contributedCase.reviewedAt = new Date();
    contributedCase.reviewComments = reviewComments;
    
    await contributedCase.save();
    
    // Update contributor performance stats
    const performance = await ClinicianPerformance.findOne({ 
      userId: contributedCase.contributorId 
    });
    
    if (performance) {
      performance.updateContributionStats('approved');
      await performance.save();
    }
    
    // TODO: Send notification email to contributor
    
    res.json({
      message: 'Case approved and added to database',
      newCaseId: newCase._id,
      caseId: newCase.case_metadata.case_id
    });
  } catch (error) {
    console.error('Error approving case:', error);
    res.status(500).json({ error: 'Failed to approve case' });
  }
});

/**
 * @swagger
 * /admin/contribution/contributed-cases/{caseId}/reject:
 *   post:
 *     summary: Reject case
 *     description: Rejects a contributed case
 *     tags: [Admin Contribution]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to reject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewerId
 *               - reviewerName
 *             properties:
 *               reviewerId:
 *                 type: string
 *                 description: ID of the reviewer
 *               reviewerName:
 *                 type: string
 *                 description: Name of the reviewer
 *               reviewComments:
 *                 type: string
 *                 description: Comments from the reviewer
 *     responses:
 *       200:
 *         description: Case rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - case not in reviewable state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/contributed-cases/:caseId/reject', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reviewerId, reviewerName, reviewComments } = req.body;
    
    const contributedCase = await ContributedCase.findById(caseId);
    
    if (!contributedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    contributedCase.status = 'rejected';
    contributedCase.reviewedBy = reviewerId;
    contributedCase.reviewedAt = new Date();
    contributedCase.reviewComments = reviewComments;
    
    await contributedCase.save();
    
    // Update contributor performance stats
    const performance = await ClinicianPerformance.findOne({ 
      userId: contributedCase.contributorId 
    });
    
    if (performance) {
      performance.updateContributionStats('rejected');
      await performance.save();
    }
    
    // TODO: Send notification email to contributor
    
    res.json({ message: 'Case rejected' });
  } catch (error) {
    console.error('Error rejecting case:', error);
    res.status(500).json({ error: 'Failed to reject case' });
  }
});

/**
 * @swagger
 * /admin/contribution/contributed-cases/{caseId}/request-revision:
 *   post:
 *     summary: Request revisions for case
 *     description: Requests revisions for a contributed case and changes status to needs_revision
 *     tags: [Admin Contribution]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to request revisions for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewerId
 *               - reviewerName
 *               - revisionRequests
 *             properties:
 *               reviewerId:
 *                 type: string
 *                 description: ID of the reviewer
 *               reviewerName:
 *                 type: string
 *                 description: Name of the reviewer
 *               reviewComments:
 *                 type: string
 *                 description: General comments from the reviewer
 *               revisionRequests:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     section:
 *                       type: string
 *                     feedback:
 *                       type: string
 *                     required:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Revision requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/contributed-cases/:caseId/request-revision', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reviewerId, reviewerName, reviewComments, revisionRequests } = req.body;
    
    const contributedCase = await ContributedCase.findById(caseId);
    
    if (!contributedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    contributedCase.status = 'needs_revision';
    contributedCase.reviewedBy = reviewerId;
    contributedCase.reviewedAt = new Date();
    contributedCase.reviewComments = reviewComments;
    contributedCase.revisionRequests = revisionRequests.map(req => ({
      ...req,
      requestedAt: new Date()
    }));
    
    await contributedCase.save();
    
    // TODO: Send notification email to contributor
    
    res.json({ message: 'Revision requested' });
  } catch (error) {
    console.error('Error requesting revision:', error);
    res.status(500).json({ error: 'Failed to request revision' });
  }
});

/**
 * @swagger
 * /admin/contribution/contributed-cases/bulk-action:
 *   post:
 *     summary: Perform bulk actions on cases
 *     description: Approve or reject multiple cases in bulk
 *     tags: [Admin Contribution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - caseIds
 *               - reviewerId
 *               - reviewerName
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to perform on the cases
 *               caseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of case IDs to process
 *               reviewerId:
 *                 type: string
 *                 description: ID of the reviewer
 *               reviewerName:
 *                 type: string
 *                 description: Name of the reviewer
 *               reviewComments:
 *                 type: string
 *                 description: Comments from the reviewer
 *     responses:
 *       200:
 *         description: Bulk action completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       caseId:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [success, error]
 *                       message:
 *                         type: string
 *                       newCaseId:
 *                         type: string
 *       400:
 *         description: Bad request - invalid action
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/contributed-cases/bulk-action', async (req, res) => {
  try {
    const { action, caseIds, reviewerId, reviewerName, reviewComments } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const results = [];
    
    for (const caseId of caseIds) {
      try {
        const contributedCase = await ContributedCase.findById(caseId);
        
        if (!contributedCase) {
          results.push({ caseId, status: 'error', message: 'Case not found' });
          continue;
        }
        
        if (action === 'approve') {
          // Create new case in main database
          const newCase = new Case(contributedCase.caseData);
          await newCase.save();
          
          contributedCase.status = 'approved';
          
          // Update contributor stats
          const performance = await ClinicianPerformance.findOne({ 
            userId: contributedCase.contributorId 
          });
          if (performance) {
            performance.updateContributionStats('approved');
            await performance.save();
          }
          
          results.push({ 
            caseId, 
            status: 'success', 
            message: 'Approved',
            newCaseId: newCase.case_metadata.case_id
          });
        } else {
          contributedCase.status = 'rejected';
          
          // Update contributor stats
          const performance = await ClinicianPerformance.findOne({ 
            userId: contributedCase.contributorId 
          });
          if (performance) {
            performance.updateContributionStats('rejected');
            await performance.save();
          }
          
          results.push({ caseId, status: 'success', message: 'Rejected' });
        }
        
        contributedCase.reviewedBy = reviewerId;
        contributedCase.reviewedAt = new Date();
        contributedCase.reviewComments = reviewComments;
        
        await contributedCase.save();
        
      } catch (error) {
        results.push({ 
          caseId, 
          status: 'error', 
          message: error.message 
        });
      }
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

/**
 * @swagger
 * /admin/contribution/contribution-stats:
 *   get:
 *     summary: Get contribution statistics
 *     description: Retrieves statistics about case contributions including status counts, top contributors, and specialty stats
 *     tags: [Admin Contribution]
 *     responses:
 *       200:
 *         description: Contribution statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 topContributors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       contributorName:
 *                         type: string
 *                       contributorEmail:
 *                         type: string
 *                       totalSubmissions:
 *                         type: integer
 *                       approved:
 *                         type: integer
 *                       rejected:
 *                         type: integer
 *                       approvalRate:
 *                         type: number
 *                 specialtyStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       total:
 *                         type: integer
 *                       approved:
 *                         type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/contribution-stats', async (req, res) => {
  try {
    const stats = await ContributedCase.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const contributorStats = await ContributedCase.aggregate([
      {
        $group: {
          _id: '$contributorId',
          contributorName: { $first: '$contributorName' },
          contributorEmail: { $first: '$contributorEmail' },
          totalSubmissions: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          approvalRate: {
            $cond: [
              { $gt: [{ $add: ['$approved', '$rejected'] }, 0] },
              { $divide: ['$approved', { $add: ['$approved', '$rejected'] }] },
              0
            ]
          }
        }
      },
      { $sort: { totalSubmissions: -1 } },
      { $limit: 10 }
    ]);
    
    const specialtyStats = await ContributedCase.aggregate([
      {
        $group: {
          _id: '$caseData.case_metadata.specialty',
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      statusStats: stats,
      topContributors: contributorStats,
      specialtyStats
    });
  } catch (error) {
    console.error('Error fetching contribution stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * @swagger
 * /admin/contribution/review-queue:
 *   get:
 *     summary: Get review queue summary
 *     description: Retrieves summary information about the current review queue including urgent cases
 *     tags: [Admin Contribution]
 *     responses:
 *       200:
 *         description: Review queue summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queueStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       oldestSubmission:
 *                         type: string
 *                         format: date-time
 *                 urgentCases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       contributorName:
 *                         type: string
 *                       caseData:
 *                         type: object
 *                         properties:
 *                           case_metadata:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                               specialty:
 *                                 type: string
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                 totalPending:
 *                   type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/review-queue', async (req, res) => {
  try {
    const queueStats = await ContributedCase.aggregate([
      {
        $match: {
          status: { $in: ['submitted', 'under_review'] }
        }
      },
      {
        $group: {
          _id: '$caseData.case_metadata.specialty',
          count: { $sum: 1 },
          oldestSubmission: { $min: '$submittedAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const urgentCases = await ContributedCase.find({
      status: 'submitted',
      submittedAt: { $lt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) } // Older than 7 days
    })
    .select('_id contributorName caseData.case_metadata.title caseData.case_metadata.specialty submittedAt')
    .sort({ submittedAt: 1 })
    .limit(10);
    
    res.json({
      queueStats,
      urgentCases,
      totalPending: queueStats.reduce((sum, stat) => sum + stat.count, 0)
    });
  } catch (error) {
    console.error('Error fetching review queue:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

export default router;