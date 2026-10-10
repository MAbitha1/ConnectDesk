import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteFollowUpModal({ isOpen, onClose, onConfirm, followUpToDelete }) {
  if (!isOpen || !followUpToDelete) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header warning">
          <div className="modal-title-with-icon">
            <AlertTriangle className="modal-icon text-amber" size={20} />
            <h2 className="modal-title">Delete Follow-up Record</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-message">
            Are you sure you want to delete scheduled follow-up{' '}
            <strong>"{followUpToDelete.title}"</strong>?
          </p>
          <div className="callout-box warning" style={{ marginTop: '0.75rem' }}>
            <span>This follow-up record will be permanently removed from MongoDB.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            Delete Follow-up
          </button>
        </div>
      </div>
    </div>
  );
}
