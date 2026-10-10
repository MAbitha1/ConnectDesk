import express from 'express';
import {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp
} from '../controllers/followUpController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply JWT protection middleware to all follow-up routes
router.use(protect);

router.route('/')
  .get(getFollowUps)
  .post(createFollowUp);

router.route('/:id')
  .get(getFollowUpById)
  .put(updateFollowUp)
  .delete(deleteFollowUp);

export default router;
