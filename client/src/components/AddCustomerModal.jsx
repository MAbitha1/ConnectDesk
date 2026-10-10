import React, { useState } from 'react';
import Modal from './Modal';
import { User, Building2, Mail, Phone, DollarSign, AlertCircle } from 'lucide-react';

export default function AddCustomerModal({ isOpen, onClose, onAddCustomer }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Lead');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!company.trim()) errs.company = 'Company name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onAddCustomer({
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      status,
      dealValue: dealValue ? parseFloat(dealValue) : 0,
      lastContact: new Date().toISOString().split('T')[0],
      notes: notes.trim() || 'Newly added customer record.'
    });

    // Reset form
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setStatus('Lead');
    setDealValue('');
    setNotes('');
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer">
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
              className="text-input"
            />
          </div>
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
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-btn">
            Save Customer
          </button>
        </div>
      </form>
    </Modal>
  );
}
