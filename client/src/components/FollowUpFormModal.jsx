import React, { useState, useEffect } from 'react';
import { X, Calendar, PhoneCall, Mail, Users, FileText, CheckCircle } from 'lucide-react';

export default function FollowUpFormModal({ isOpen, onClose, onSave, followUpToEdit }) {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Call');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      if (followUpToEdit) {
        setSelectedCustomer(followUpToEdit.customer?._id || followUpToEdit.customer || '');
        setTitle(followUpToEdit.title || '');
        setType(followUpToEdit.type || 'Call');
        setScheduledDate(
          followUpToEdit.scheduledDate 
            ? new Date(followUpToEdit.scheduledDate).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
        );
        setNotes(followUpToEdit.notes || '');
        setCompleted(followUpToEdit.completed || false);
      } else {
        setSelectedCustomer('');
        setTitle('');
        setType('Call');
        setScheduledDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
        setNotes('');
        setCompleted(false);
      }
      setError(null);
    }
  }, [isOpen, followUpToEdit]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const token = localStorage.getItem('connectdesk_token');
      const res = await fetch('/api/customers?limit=100', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch customer list for follow-up modal:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedCustomer || !scheduledDate) {
      setError('Please fill out all required fields (*)');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        _id: followUpToEdit?._id,
        customer: selectedCustomer,
        title: title.trim(),
        type,
        scheduledDate,
        notes: notes.trim(),
        completed
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save follow-up');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {followUpToEdit ? 'Edit Scheduled Follow-up' : 'Schedule New Follow-up'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body form-grid">
          {error && (
            <div className="status-banner error" style={{ marginBottom: '1rem', marginTop: 0 }}>
              <div className="status-indicator">
                <span className="status-text-headline">{error}</span>
              </div>
            </div>
          )}

          <div className="form-group full-width">
            <label className="form-label">Title / Subject *</label>
            <input
              type="text"
              placeholder="e.g. Q3 Renewal & Contract Signing Call"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Related Customer *</label>
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="text-input"
              required
              disabled={loadingCustomers}
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Communication Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="text-input"
            >
              <option value="Call">Phone Call</option>
              <option value="Email">Email Communication</option>
              <option value="Meeting">In-Person / Virtual Meeting</option>
              <option value="Demo">Product Demo</option>
              <option value="Presentation">Proposal Presentation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label">Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="text-input"
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Notes & Preparation Details</label>
            <textarea
              placeholder="Add agenda items, phone numbers, or meeting links..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="text-input"
              rows={3}
            />
          </div>

          {followUpToEdit && (
            <div className="form-group full-width">
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={e => setCompleted(e.target.checked)}
                />
                <span>Mark Follow-up as Completed</span>
              </label>
            </div>
          )}

          <div className="modal-footer full-width" style={{ marginTop: '1rem' }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : followUpToEdit ? 'Save Changes' : 'Schedule Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
