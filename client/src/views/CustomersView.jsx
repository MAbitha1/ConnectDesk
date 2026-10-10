import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Edit3, 
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react';
import CustomerFormModal from '../components/CustomerFormModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

export default function CustomersView({ showToast }) {
  // Data & Pagination State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [unauthorized, setUnauthorized] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal Dialog States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalApiError, setModalApiError] = useState(null);

  // Fetch Customers from Backend REST API
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const token = localStorage.getItem('connectdesk_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchQuery,
        status: selectedStatus
      });

      const response = await fetch(`/api/customers?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.success) {
        setCustomers(json.data);
        setTotalCustomers(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      } else {
        throw new Error(json.error || 'Failed to fetch customer data');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Unable to connect to backend Customer API');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedStatus]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setModalApiError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setModalApiError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (cust) => {
    setDeletingCustomer(cust);
    setIsDeletingModalOpen(true);
  };

  const handleSaveCustomer = async (formData) => {
    setIsSubmitting(true);
    setModalApiError(null);
    try {
      const token = localStorage.getItem('connectdesk_token');
      const isEdit = Boolean(formData._id);
      const url = isEdit ? `/api/customers/${formData._id}` : '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setModalApiError(json.error || 'Operation failed');
        return;
      }

      setIsFormModalOpen(false);
      fetchCustomers();
      if (showToast) {
        showToast(
          isEdit 
            ? `Customer "${json.data.name}" updated successfully!` 
            : `Customer "${json.data.name}" added successfully!`,
          'success'
        );
      }
    } catch (err) {
      console.error('Error saving customer:', err);
      setModalApiError('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('connectdesk_token');
      const response = await fetch(`/api/customers/${deletingCustomer._id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete customer');
      }

      setIsDeletingModalOpen(false);
      setDeletingCustomer(null);
      fetchCustomers();
      if (showToast) {
        showToast(`Customer "${deletingCustomer.name}" deleted`, 'info');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      if (showToast) {
        showToast(err.message || 'Failed to delete customer', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusList = ['All', 'Lead', 'Contacted', 'Proposal', 'Customer', 'Inactive'];

  if (unauthorized) {
    return (
      <div className="view-container">
        <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginTop: '2rem' }}>
          <Lock size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Please sign in to access customer directory records in MongoDB.
          </p>
          <button className="primary-btn" onClick={() => window.location.reload()}>
            Sign In to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="table-actions-bar">
        <div className="search-filter-group">
          <div className="input-with-icon" style={{ width: '280px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="text-input"
            />
          </div>

          <div className="filter-pill-group">
            <Filter size={14} className="filter-icon" />
            <span className="filter-group-label">Status:</span>
            {statusList.map(st => (
              <button
                key={st}
                className={`filter-pill ${selectedStatus === st ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button className="primary-btn" onClick={handleOpenAddModal}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {error && (
        <div className="status-banner error">
          <div className="status-indicator">
            <AlertCircle size={20} className="toast-icon error" />
            <div>
              <div className="status-text-headline">API Fetch Error</div>
              <div className="status-text-sub">{error}</div>
            </div>
          </div>
          <button className="secondary-sm-btn" onClick={fetchCustomers}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="table-card-wrapper">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer / Contact</th>
                <th>Company</th>
                <th>Status</th>
                <th>Est. Deal Value</th>
                <th>Last Contact Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-table-state">
                      <RefreshCw size={32} className="spin text-cyan" />
                      <h4>Loading Customers from Backend Database...</h4>
                    </div>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map(cust => (
                  <tr key={cust._id}>
                    <td>
                      <div className="user-contact-cell">
                        <div className="avatar-circle">
                          {cust.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="customer-name">{cust.name}</div>
                          <div className="customer-email">
                            <Mail size={12} /> {cust.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="company-cell">
                        <Building2 size={14} className="cell-icon" />
                        <span>{cust.company}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${cust.status.toLowerCase()}`}>
                        {cust.status}
                      </span>
                    </td>
                    <td>
                      <span className="deal-value">${Number(cust.dealValue || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="font-mono font-sm">
                        {cust.lastContact ? new Date(cust.lastContact).toISOString().split('T')[0] : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="icon-action-btn"
                          title="Edit Customer"
                          onClick={() => handleOpenEditModal(cust)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="icon-action-btn danger" 
                          title="Delete Customer"
                          onClick={() => handleOpenDeleteModal(cust)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-table-state">
                      <Users size={36} className="text-muted" />
                      <h4>No customer records found</h4>
                      <p>
                        {searchQuery || selectedStatus !== 'All' 
                          ? 'Try clearing your search query or status filter.' 
                          : 'Click "+ Add Customer" to create your first record in MongoDB.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalCustomers > 0 && (
          <div className="stat-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.4)' }}>
            <span className="stat-subtext">
              Showing page {page} of {totalPages} ({totalCustomers} total customer records)
            </span>
            <div className="row-actions">
              <button 
                className="secondary-sm-btn" 
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button 
                className="secondary-sm-btn" 
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
        apiError={modalApiError}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeletingModalOpen}
        onClose={() => setIsDeletingModalOpen(false)}
        onConfirm={handleConfirmDelete}
        customerName={deletingCustomer?.name}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
