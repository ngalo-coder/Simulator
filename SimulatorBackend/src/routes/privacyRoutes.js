import express from 'express';
import { protect, isAdmin } from '../middleware/jwtAuthMiddleware.js';
import {
  getPrivacySettings,
  updatePrivacySettings,
  exportUserData,
  requestAccountDeletion,
  getPrivacyStatistics
} from '../controllers/privacyController.js';

const router = express.Router();

/**
 * @swagger
 * /privacy/settings:
 *   get:
 *     summary: Get user privacy settings
 *     description: Retrieves the privacy settings for the authenticated user
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dataSharing:
 *                   type: boolean
 *                   description: Whether data sharing is enabled
 *                 analyticsTracking:
 *                   type: boolean
 *                   description: Whether analytics tracking is enabled
 *                 emailNotifications:
 *                   type: boolean
 *                   description: Whether email notifications are enabled
 *                 profileVisibility:
 *                   type: string
 *                   enum: [public, private, contacts_only]
 *                   description: Profile visibility setting
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/settings', protect, getPrivacySettings);

/**
 * @swagger
 * /privacy/settings:
 *   put:
 *     summary: Update user privacy settings
 *     description: Updates the privacy settings for the authenticated user
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataSharing:
 *                 type: boolean
 *                 description: Whether to enable data sharing
 *               analyticsTracking:
 *                 type: boolean
 *                 description: Whether to enable analytics tracking
 *               emailNotifications:
 *                 type: boolean
 *                 description: Whether to enable email notifications
 *               profileVisibility:
 *                 type: string
 *                 enum: [public, private, contacts_only]
 *                 description: Profile visibility setting
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       400:
 *         description: Invalid privacy settings provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/settings', protect, updatePrivacySettings);

/**
 * @swagger
 * /privacy/export:
 *   get:
 *     summary: Export user data
 *     description: Exports all personal data for the authenticated user in a downloadable format
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data export generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL to download the exported data
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: When the download link expires
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export', protect, exportUserData);

/**
 * @swagger
 * /privacy/account:
 *   delete:
 *     summary: Request account deletion
 *     description: Initiates the account deletion process for the authenticated user
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Account deletion request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletionScheduled:
 *                   type: string
 *                   format: date-time
 *                   description: When the account will be permanently deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/account', protect, requestAccountDeletion);

/**
 * @swagger
 * /privacy/statistics:
 *   get:
 *     summary: Get privacy statistics (Admin only)
 *     description: Retrieves aggregated privacy statistics across all users (admin access required)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 dataSharingEnabled:
 *                   type: integer
 *                   description: Number of users with data sharing enabled
 *                 analyticsEnabled:
 *                   type: integer
 *                   description: Number of users with analytics tracking enabled
 *                 profileVisibility:
 *                   type: object
 *                   properties:
 *                     public:
 *                       type: integer
 *                     private:
 *                       type: integer
 *                     contacts_only:
 *                       type: integer
 *                 deletionRequests:
 *                   type: integer
 *                   description: Number of pending account deletion requests
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', protect, isAdmin, getPrivacyStatistics);

export default router;