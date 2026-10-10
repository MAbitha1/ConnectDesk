import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Customer } from '../models/Customer.js';

const VALID_PRIORITIES = ['High', 'Medium', 'Low'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// GET /api/tasks — Retrieve tasks scoped to current authenticated user
export const getTasks = async (req, res) => {
  try {
    const { search, status, priority, customer, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { user: req.user._id };

    if (status && status !== 'All') {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status filter. Allowed values: ${VALID_STATUSES.join(', ')}`
        });
      }
      filter.status = status;
    }

    if (priority && priority !== 'All') {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: `Invalid priority filter. Allowed values: ${VALID_PRIORITIES.join(', ')}`
        });
      }
      filter.priority = priority;
    }

    if (customer && mongoose.Types.ObjectId.isValid(customer)) {
      filter.customer = customer;
    }

    if (search && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      filter.$or = [
        { title: searchRegex },
        { category: searchRegex }
      ];
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('customer', 'name company email status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve tasks'
    });
  }
};

// GET /api/tasks/:id — Retrieve single task owned by current user
export const getTaskById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ObjectId format' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
      .populate('customer', 'name company email status');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve task'
    });
  }
};

// POST /api/tasks — Create new task attached to current user
export const createTask = async (req, res) => {
  try {
    const { title, customer, priority, dueDate, status, category } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    if (!customer) {
      return res.status(400).json({ success: false, error: 'Related customer reference is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({ success: false, error: 'Invalid Customer ID format' });
    }

    // Verify referenced customer exists and belongs to current user
    const existingCustomer = await Customer.findOne({ _id: customer, user: req.user._id });
    if (!existingCustomer) {
      return res.status(400).json({ success: false, error: 'Referenced customer does not exist in your workspace' });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const newTask = await Task.create({
      user: req.user._id,
      title: title.trim(),
      customer,
      priority: priority || 'Medium',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: status || 'Pending',
      category: category ? category.trim() : 'Sales Demo'
    });

    const populatedTask = await Task.findById(newTask._id).populate('customer', 'name company email status');

    return res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
};

// PUT /api/tasks/:id — Update task owned by current user
export const updateTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ObjectId format' });
    }

    const { title, customer, priority, dueDate, status, category } = req.body;

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task record not found'
      });
    }

    if (title !== undefined) {
      if (!title || !title.trim()) return res.status(400).json({ success: false, error: 'Task title cannot be empty' });
      task.title = title.trim();
    }

    if (customer !== undefined) {
      if (!customer || !mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({ success: false, error: 'Invalid Customer ID format' });
      }
      const existingCustomer = await Customer.findOne({ _id: customer, user: req.user._id });
      if (!existingCustomer) {
        return res.status(400).json({ success: false, error: 'Referenced customer does not exist in your workspace' });
      }
      task.customer = customer;
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
        });
      }
      task.priority = priority;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      task.status = status;
    }

    if (dueDate !== undefined) task.dueDate = new Date(dueDate);
    if (category !== undefined) task.category = category.trim();

    await task.save();

    const updatedTask = await Task.findById(task._id).populate('customer', 'name company email status');

    return res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
};

// DELETE /api/tasks/:id — Delete task owned by current user
export const deleteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ObjectId format' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
};
