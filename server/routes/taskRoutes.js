import express from 'express';
import mongoose from 'mongoose';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply JWT protection middleware to all task routes
router.use(protect);

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Task ID format'
    });
  }
  next();
};

// Task CRUD Endpoints
router.get('/', getTasks);
router.get('/:id', validateObjectId, getTaskById);
router.post('/', createTask);
router.put('/:id', validateObjectId, updateTask);
router.delete('/:id', validateObjectId, deleteTask);

export default router;
