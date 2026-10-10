import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  customerName = '', 
  isDeleting = false 
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Customer Deletion">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fb7185' }}>
          <AlertTriangle size={24} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Are you sure you want to delete this customer record?
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          You are about to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{customerName}</strong> from MongoDB. This action cannot be undone.
        </p>

        <div className="form-actions full-width" style={{ marginTop: '0.5rem' }}>
          <button 
            type="button" 
            className="secondary-btn" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="primary-btn" 
            style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)' }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Customer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
