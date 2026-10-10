import express from 'express';
import mongoose from 'mongoose';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply JWT protection middleware to all customer routes
router.use(protect);

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Customer ID format'
    });
  }
  next();
};

// Customer CRUD Endpoints
router.get('/', getCustomers);
router.get('/:id', validateObjectId, getCustomerById);
router.post('/', createCustomer);
router.put('/:id', validateObjectId, updateCustomer);
router.delete('/:id', validateObjectId, deleteCustomer);

export default router;
