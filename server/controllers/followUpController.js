import mongoose from 'mongoose';
import { FollowUp } from '../models/FollowUp.js';
import { Customer } from '../models/Customer.js';

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// GET /api/follow-ups — Retrieve follow-ups scoped to current user
export const getFollowUps = async (req, res) => {
  try {
    const { search, type, completed, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.user._id };

    if (search && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      query.$or = [
        { title: searchRegex },
        { notes: searchRegex }
      ];
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (completed !== undefined && completed !== 'All') {
      query.completed = completed === 'true' || completed === true;
    }

    const [followUps, total] = await Promise.all([
      FollowUp.find(query)
        .populate('customer', 'name company email status')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limitNum),
      FollowUp.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: followUps.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      data: followUps
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch follow-up records' });
  }
};

// GET /api/follow-ups/:id — Retrieve single follow-up owned by current user
export const getFollowUpById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Follow-up ID format' });
    }

    const followUp = await FollowUp.findOne({ _id: id, user: req.user._id })
      .populate('customer', 'name company email status');

    if (!followUp) {
      return res.status(404).json({ success: false, error: 'Follow-up record not found' });
    }

    return res.status(200).json({ success: true, data: followUp });
  } catch (error) {
    console.error('Error fetching follow-up by ID:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch follow-up record' });
  }
};

// POST /api/follow-ups — Create follow-up attached to current user
export const createFollowUp = async (req, res) => {
  try {
    const { customer, title, type, scheduledDate, notes, completed } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Follow-up title/subject is required' });
    }

    if (!customer) {
      return res.status(400).json({ success: false, error: 'Customer reference is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({ success: false, error: 'Invalid customer ObjectId format' });
    }

    const customerExists = await Customer.findOne({ _id: customer, user: req.user._id });
    if (!customerExists) {
      return res.status(400).json({ success: false, error: 'Associated customer record does not exist in your workspace' });
    }

    if (!scheduledDate) {
      return res.status(400).json({ success: false, error: 'Scheduled date is required' });
    }

    if (type && !['Call', 'Email', 'Meeting', 'Demo', 'Presentation', 'Other'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid communication type' });
    }

    const newFollowUp = await FollowUp.create({
      user: req.user._id,
      customer,
      title: title.trim(),
      type: type || 'Call',
      scheduledDate,
      notes: notes ? notes.trim() : '',
      completed: completed === true || completed === 'true'
    });

    const populatedFollowUp = await FollowUp.findById(newFollowUp._id).populate('customer', 'name company email status');

    return res.status(201).json({
      success: true,
      data: populatedFollowUp
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return res.status(500).json({ success: false, error: 'Failed to create follow-up record' });
  }
};

// PUT /api/follow-ups/:id — Update follow-up owned by current user
export const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Follow-up ID format' });
    }

    const followUp = await FollowUp.findOne({ _id: id, user: req.user._id });
    if (!followUp) {
      return res.status(404).json({ success: false, error: 'Follow-up record not found' });
    }

    const { customer, title, type, scheduledDate, notes, completed } = req.body;

    if (customer) {
      if (!mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({ success: false, error: 'Invalid customer ObjectId format' });
      }
      const customerExists = await Customer.findOne({ _id: customer, user: req.user._id });
      if (!customerExists) {
        return res.status(400).json({ success: false, error: 'Associated customer record does not exist in your workspace' });
      }
      followUp.customer = customer;
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ success: false, error: 'Follow-up title cannot be empty' });
      }
      followUp.title = title.trim();
    }

    if (type !== undefined) {
      if (!['Call', 'Email', 'Meeting', 'Demo', 'Presentation', 'Other'].includes(type)) {
        return res.status(400).json({ success: false, error: 'Invalid communication type' });
      }
      followUp.type = type;
    }

    if (scheduledDate !== undefined) followUp.scheduledDate = scheduledDate;
    if (notes !== undefined) followUp.notes = notes.trim();
    if (completed !== undefined) followUp.completed = completed === true || completed === 'true';

    await followUp.save();
    const updatedFollowUp = await FollowUp.findById(id).populate('customer', 'name company email status');

    return res.status(200).json({
      success: true,
      data: updatedFollowUp
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return res.status(500).json({ success: false, error: 'Failed to update follow-up record' });
  }
};

// DELETE /api/follow-ups/:id — Delete follow-up owned by current user
export const deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Follow-up ID format' });
    }

    const followUp = await FollowUp.findOneAndDelete({ _id: id, user: req.user._id });
    if (!followUp) {
      return res.status(404).json({ success: false, error: 'Follow-up record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Follow-up record deleted successfully',
      data: followUp
    });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete follow-up record' });
  }
};
