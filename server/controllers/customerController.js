import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';

const VALID_STATUSES = ['Lead', 'Contacted', 'Proposal', 'Customer', 'Inactive'];
const EMAIL_REGEX = /\S+@\S+\.\S+/;

// Helper to escape special characters in user search input to prevent ReDoS / search regex injection
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// GET /api/customers — Retrieve customers scoped to current authenticated user
export const getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Always filter by current authenticated user
    const filter = { user: req.user._id };

    // Status filter
    if (status && status !== 'All') {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status filter. Allowed values: ${VALID_STATUSES.join(', ')}`
        });
      }
      filter.status = status;
    }

    // Search query across name, company, and email with regex escaping
    if (search && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      filter.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex }
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Customer.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve customers'
    });
  }
};

// GET /api/customers/:id — Retrieve single customer owned by current user
export const getCustomerById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid customer ObjectId format' });
    }

    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer'
    });
  }
};

// POST /api/customers — Create new customer attached to current user
export const createCustomer = async (req, res) => {
  try {
    const { name, company, email, phone, status, dealValue, lastContact, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    if (!company || !company.trim()) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    if (dealValue !== undefined && dealValue !== null) {
      const val = Number(dealValue);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({ success: false, error: 'Deal value must be a non-negative number' });
      }
    }

    // Check duplicate email for current user's workspace
    const existing = await Customer.findOne({ 
      user: req.user._id, 
      email: email.trim().toLowerCase() 
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A customer with this email address already exists in your workspace'
      });
    }

    const newCustomer = await Customer.create({
      user: req.user._id,
      name: name.trim(),
      company: company.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      status: status || 'Lead',
      dealValue: dealValue ? Number(dealValue) : 0,
      lastContact: lastContact ? new Date(lastContact) : new Date(),
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json({
      success: true,
      data: newCustomer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A customer with this email address already exists in your workspace'
      });
    }
    console.error('Error creating customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
};

// PUT /api/customers/:id — Update customer owned by current user
export const updateCustomer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid customer ObjectId format' });
    }

    const { name, company, email, phone, status, dealValue, lastContact, notes } = req.body;

    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer record not found'
      });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Name cannot be empty' });
      customer.name = name.trim();
    }

    if (company !== undefined) {
      if (!company || !company.trim()) return res.status(400).json({ success: false, error: 'Company cannot be empty' });
      customer.company = company.trim();
    }

    if (email !== undefined) {
      if (!email || !email.trim()) return res.status(400).json({ success: false, error: 'Email cannot be empty' });
      if (!EMAIL_REGEX.test(email.trim())) return res.status(400).json({ success: false, error: 'Invalid email address' });

      const existing = await Customer.findOne({ 
        user: req.user._id,
        email: email.trim().toLowerCase(), 
        _id: { $ne: req.params.id } 
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'A customer with this email address already exists in your workspace'
        });
      }
      customer.email = email.trim().toLowerCase();
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      customer.status = status;
    }

    if (dealValue !== undefined) {
      const val = Number(dealValue);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({ success: false, error: 'Deal value must be a non-negative number' });
      }
      customer.dealValue = val;
    }

    if (phone !== undefined) customer.phone = phone.trim();
    if (lastContact !== undefined) customer.lastContact = new Date(lastContact);
    if (notes !== undefined) customer.notes = notes.trim();

    const updated = await customer.save();

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A customer with this email address already exists in your workspace'
      });
    }
    console.error('Error updating customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
};

// DELETE /api/customers/:id — Delete customer owned by current user
export const deleteCustomer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid customer ObjectId format' });
    }

    const customer = await Customer.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    });
  }
};
