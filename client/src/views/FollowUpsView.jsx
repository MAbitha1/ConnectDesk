import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Users, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Edit,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import FollowUpFormModal from '../components/FollowUpFormModal';
import DeleteFollowUpModal from '../components/DeleteFollowUpModal';
import { getApiUrl } from '../config/api';

export default function FollowUpsView({ showToast, onCountsChange }) {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [completedFilter, setCompletedFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unauthorized, setUnauthorized] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followUpToEdit, setFollowUpToEdit] = useState(null);
  const [followUpToDelete, setFollowUpToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchFollowUps = async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);

    try {
      const token = localStorage.getItem('connectdesk_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'All') params.append('type', typeFilter);
      if (completedFilter !== 'All') params.append('completed', completedFilter === 'Completed' ? 'true' : 'false');
      params.append('page', page);
      params.append('limit', 20);

      const response = await fetch(getApiUrl(`/api/follow-ups?${params.toString()}`), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (json.success) {
        setFollowUps(json.data || []);
        setTotalPages(json.totalPages || 1);
      } else {
        throw new Error(json.error || 'Failed to load follow-ups');
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      setError(err.message || 'Failed to connect to follow-ups API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [search, typeFilter, completedFilter, page]);

  const handleSaveFollowUp = async (formData) => {
    const token = localStorage.getItem('connectdesk_token');
    const isEdit = Boolean(formData._id);
    const endpoint = isEdit ? getApiUrl(`/api/follow-ups/${formData._id}`) : getApiUrl('/api/follow-ups');
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(formData)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to save follow-up');
    }

    showToast(isEdit ? 'Follow-up updated successfully!' : 'Follow-up scheduled successfully!');
    fetchFollowUps();
    onCountsChange?.();
  };

  const handleToggleCompleted = async (followUp) => {
    try {
      const token = localStorage.getItem('connectdesk_token');
      const nextState = !followUp.completed;

      // Optimistic update
      setFollowUps(prev => prev.map(f => f._id === followUp._id ? { ...f, completed: nextState } : f));

      const res = await fetch(getApiUrl(`/api/follow-ups/${followUp._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ completed: nextState })
      });

      if (!res.ok) {
        fetchFollowUps();
        showToast('Failed to update status', 'error');
      } else {
        showToast(nextState ? 'Follow-up marked completed!' : 'Follow-up reopened', 'info');
        onCountsChange?.();
      }
    } catch (err) {
      fetchFollowUps();
      showToast('Network error updating status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!followUpToDelete) return;
    try {
      const token = localStorage.getItem('connectdesk_token');
      const res = await fetch(getApiUrl(`/api/follow-ups/${followUpToDelete._id}`), {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        showToast(`Deleted follow-up "${followUpToDelete.title}"`, 'info');
        setIsDeleteModalOpen(false);
        setFollowUpToDelete(null);
        fetchFollowUps();
        onCountsChange?.();
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to delete follow-up', 'error');
      }
    } catch (err) {
      showToast('Error deleting follow-up record', 'error');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call': return <Phone size={16} className="type-icon call" />;
      case 'Email': return <Mail size={16} className="type-icon email" />;
      case 'Meeting': return <Users size={16} className="type-icon meeting" />;
      case 'Demo': return <Video size={16} className="type-icon demo" />;
      default: return <FileText size={16} className="type-icon note" />;
    }
  };

  if (unauthorized) {
    return (
      <div className="view-container">
        <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginTop: '2rem' }}>
          <Lock size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Please sign in to access scheduled client follow-ups and MongoDB CRM records.
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
      {/* Workspace Header Actions */}
      <div className="view-header-actions">
        <div className="search-filter-bar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search follow-ups by title or notes..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="text-input search-input"
            />
          </div>

          <div className="filter-pill-group">
            <span className="filter-label">Type:</span>
            {['All', 'Call', 'Email', 'Meeting', 'Demo'].map(t => (
              <button
                key={t}
                className={`filter-pill ${typeFilter === t ? 'active' : ''}`}
                onClick={() => { setTypeFilter(t); setPage(1); }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="filter-pill-group">
            <span className="filter-label">Status:</span>
            {['All', 'Pending', 'Completed'].map(s => (
              <button
                key={s}
                className={`filter-pill ${completedFilter === s ? 'active' : ''}`}
                onClick={() => { setCompletedFilter(s); setPage(1); }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="primary-btn"
          onClick={() => {
            setFollowUpToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="status-banner error" style={{ marginBottom: '1.5rem' }}>
          <div className="status-indicator">
            <AlertCircle size={18} className="toast-icon error" />
            <div className="status-text-headline">{error}</div>
          </div>
          <button className="secondary-btn" onClick={fetchFollowUps} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="table-card-wrapper">
        {loading ? (
          <div className="table-loading-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin text-blue" style={{ marginBottom: '0.5rem' }} />
            <p>Loading scheduled follow-ups from MongoDB...</p>
          </div>
        ) : followUps.length === 0 ? (
          <div className="table-empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <Calendar size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <h3>No follow-ups found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Schedule a call, meeting, or email follow-up with a client.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table followups-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>Done</th>
                  <th style={{ minWidth: '110px' }}>Type</th>
                  <th style={{ minWidth: '180px' }}>Title / Subject</th>
                  <th style={{ minWidth: '160px' }}>Customer</th>
                  <th style={{ minWidth: '160px' }}>Scheduled Date</th>
                  <th style={{ minWidth: '200px' }}>Notes</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map(f => (
                  <tr key={f._id} className={f.completed ? 'row-completed' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={f.completed}
                        onChange={() => handleToggleCompleted(f)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                    </td>
                    <td>
                      <div className="type-badge-row" style={{ display: 'inline-flex', width: 'auto' }}>
                        {getTypeIcon(f.type)}
                        <span>{f.type}</span>
                      </div>
                    </td>
                    <td className="font-semibold" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.title}
                    </td>
                    <td>
                      {f.customer ? (
                        <div>
                          <div className="font-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{f.customer.name}</div>
                          <div className="text-muted text-xs" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{f.customer.company}</div>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex-align-gap" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <Clock size={14} className="text-muted" />
                        <span>{new Date(f.scheduledDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.notes || <span className="text-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="icon-action-btn"
                          title="Edit Follow-up"
                          onClick={() => {
                            setFollowUpToEdit(f);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          className="icon-action-btn danger"
                          title="Delete Follow-up"
                          onClick={() => {
                            setFollowUpToDelete(f);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="table-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
            <span className="pagination-info">Page {page} of {totalPages}</span>
            <div className="pagination-buttons">
              <button className="secondary-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft size={16} /> Prev
              </button>
              <button className="secondary-btn" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FollowUpFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFollowUp}
        followUpToEdit={followUpToEdit}
      />

      <DeleteFollowUpModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        followUpToDelete={followUpToDelete}
      />
    </div>
  );
}
