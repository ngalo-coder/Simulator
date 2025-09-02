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

// User privacy settings routes
router.get('/settings', protect, getPrivacySettings);
router.put('/settings', protect, updatePrivacySettings);

// Data export and deletion routes
router.get('/export', protect, exportUserData);
router.delete('/account', protect, requestAccountDeletion);

// Admin routes
router.get('/statistics', protect, isAdmin, getPrivacyStatistics);

export default router;