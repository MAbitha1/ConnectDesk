import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { User, Building2, Mail, Phone, DollarSign, AlertCircle } from 'lucide-react';

export default function CustomerFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null, 
  apiError = null,
  isSubmitting = false 
}) {
  const isEditMode = Boolean(initialData && initialData._id);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Lead');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCompany(initialData.company || '');
        setEmail(initialData.email || '');
        setPhone(initialData.phone || '');
        setStatus(initialData.status || 'Lead');
        setDealValue(initialData.dealValue !== undefined ? String(initialData.dealValue) : '');
        setNotes(initialData.notes || '');
      } else {
        setName('');
        setCompany('');
        setEmail('');
        setPhone('');
        setStatus('Lead');
        setDealValue('');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!company.trim()) errs.company = 'Company name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (dealValue && Number(dealValue) < 0) {
      errs.dealValue = 'Deal value cannot be negative';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    onSave({
      _id: isEditMode ? initialData._id : undefined,
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status,
      dealValue: dealValue ? Number(dealValue) : 0,
      notes: notes.trim()
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Customer Details' : 'Add New Customer'}
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
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <div className="input-with-icon">
            <User size={16} className="input-icon" />
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`text-input ${errors.name ? 'error' : ''}`}
            />
          </div>
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Company Name *</label>
          <div className="input-with-icon">
            <Building2 size={16} className="input-icon" />
            <input
              type="text"
              placeholder="e.g. Apex Innovations"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`text-input ${errors.company ? 'error' : ''}`}
            />
          </div>
          {errors.company && <span className="field-error">{errors.company}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <div className="input-with-icon">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`text-input ${errors.email ? 'error' : ''}`}
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <div className="input-with-icon">
            <Phone size={16} className="input-icon" />
            <input
              type="text"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Pipeline Stage / Status</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="select-input"
          >
            <option value="Lead">Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Proposal">Proposal</option>
            <option value="Customer">Customer</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Est. Deal Value ($)</label>
          <div className="input-with-icon">
            <DollarSign size={16} className="input-icon" />
            <input
              type="number"
              placeholder="15000"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              className={`text-input ${errors.dealValue ? 'error' : ''}`}
            />
          </div>
          {errors.dealValue && <span className="field-error">{errors.dealValue}</span>}
        </div>

        <div className="form-group full-width">
          <label className="form-label">Notes & Description</label>
          <textarea
            placeholder="Add discovery call notes, requirements..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="textarea-input"
            rows={3}
          ></textarea>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Customer' : 'Save Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
