import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { CheckSquare, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function TaskFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null, 
  apiError = null,
  isSubmitting = false 
}) {
  const isEditMode = Boolean(initialData && initialData._id);

  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [category, setCategory] = useState('Sales Demo');
  const [errors, setErrors] = useState({});

  // Fetch available customers for dropdown selection
  useEffect(() => {
    if (isOpen) {
      async function loadCustomerOptions() {
        setLoadingCustomers(true);
        try {
          const token = localStorage.getItem('connectdesk_token');
          const res = await fetch(getApiUrl('/api/customers?limit=100'), {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              setCustomers(json.data);
              if (!isEditMode && json.data.length > 0 && !customerId) {
                setCustomerId(json.data[0]._id);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching customer options:', err);
        } finally {
          setLoadingCustomers(false);
        }
      }
      loadCustomerOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setCustomerId(initialData.customer?._id || initialData.customer || '');
        setPriority(initialData.priority || 'Medium');
        setDueDate(
          initialData.dueDate 
            ? new Date(initialData.dueDate).toISOString().split('T')[0] 
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        );
        setStatus(initialData.status || 'Pending');
        setCategory(initialData.category || 'Sales Demo');
      } else {
        setTitle('');
        setPriority('Medium');
        setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setStatus('Pending');
        setCategory('Sales Demo');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Task title is required';
    if (!customerId) errs.customer = 'Please select a related customer';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    onSave({
      _id: isEditMode ? initialData._id : undefined,
      title: title.trim(),
      customer: customerId,
      priority,
      dueDate,
      status,
      category: category.trim()
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Task' : 'Create New Task'}
    >
      {apiError && (
        <div className="status-banner error" style={{ marginBottom: '1rem', marginTop: 0 }}>
          <div className="status-indicator">
            <AlertCircle size={18} className="toast-icon error" />
            <div className="status-text-headline">{apiError}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group full-width">
          <label className="form-label">Task Title *</label>
          <div className="input-with-icon">
            <CheckSquare size={16} className="input-icon" />
            <input
              type="text"
              placeholder="e.g. Schedule discovery demo call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`text-input ${errors.title ? 'error' : ''}`}
            />
          </div>
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Related Customer *</label>
          <div className="input-with-icon">
            <User size={16} className="input-icon" />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={`select-input ${errors.customer ? 'error' : ''}`}
              disabled={loadingCustomers}
            >
              {loadingCustomers ? (
                <option value="">Loading customer records...</option>
              ) : customers.length === 0 ? (
                <option value="">No customers found — add a customer first</option>
              ) : (
                customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.company})
                  </option>
                ))
              )}
            </select>
          </div>
          {errors.customer && <span className="field-error">{errors.customer}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Priority</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="select-input"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
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
          <div className="input-with-icon">
            <Tag size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Sales Demo, Contract, Follow-up..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-input"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label className="form-label">Status</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="select-input"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="form-actions full-width">
          <button 
            type="button" 
            className="secondary-btn" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="primary-btn"
            disabled={isSubmitting || customers.length === 0}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
