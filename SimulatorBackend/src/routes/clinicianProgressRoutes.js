import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import { validateObjectId, validateProgressUpdate } from '../middleware/validation.js';
import { progressLimiter } from '../middleware/rateLimiter.js';
import { 
  getClinicianProgress, 
  updateProgressAfterCase, 
  getProgressRecommendations 
} from '../controllers/clinicianProgressController.js';

const router = express.Router();

router.use(protect, progressLimiter);

router.get('/recommendations/:userId', validateObjectId('userId'), getProgressRecommendations);
router.post('/update', validateProgressUpdate, updateProgressAfterCase);
router.get('/:userId', validateObjectId('userId'), getClinicianProgress);

export default router;