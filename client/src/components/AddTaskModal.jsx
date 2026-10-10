import React, { useState } from 'react';
import Modal from './Modal';
import { CheckSquare, User, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function AddTaskModal({ isOpen, onClose, onAddTask, customers }) {
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState(customers[0]?.name || '');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Sales Demo');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Task title is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onAddTask({
      title: title.trim(),
      customerName: customerName || 'General Account',
      priority,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      status: 'Pending',
      category
    });

    setTitle('');
    setPriority('Medium');
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Workspace Task">
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group full-width">
          <label className="form-label">Task Title *</label>
          <div className="input-with-icon">
            <CheckSquare size={16} className="input-icon" />
            <input
              type="text"
              placeholder="e.g. Schedule product demo with technical lead"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`text-input ${errors.title ? 'error' : ''}`}
            />
          </div>
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Related Customer</label>
          <select 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)}
            className="select-input"
          >
            {customers.map(c => (
              <option key={c.id} value={c.name}>{c.name} ({c.company})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Priority Level</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="select-input"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Due Date</label>
          <div className="input-with-icon">
            <Calendar size={16} className="input-icon" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="select-input"
          >
            <option value="Sales Demo">Sales Demo</option>
            <option value="Proposal">Proposal</option>
            <option value="Account Management">Account Management</option>
            <option value="Lead Nurturing">Lead Nurturing</option>
            <option value="Onboarding">Onboarding</option>
          </select>
        </div>

        <div className="form-actions full-width">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-btn">
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
