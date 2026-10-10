import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import TaskFormModal from '../components/TaskFormModal';
import DeleteTaskConfirmationModal from '../components/DeleteTaskConfirmationModal';

export default function TasksView({ showToast, onCountsChange }) {
  // Data & Pagination State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [unauthorized, setUnauthorized] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Modal Dialog States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalApiError, setModalApiError] = useState(null);

  // Fetch Tasks from Backend REST API
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const token = localStorage.getItem('connectdesk_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchQuery,
        status: selectedStatus,
        priority: selectedPriority
      });

      const response = await fetch(`/api/tasks?${params.toString()}`, {
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
        setTasks(json.data);
        setTotalTasks(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      } else {
        throw new Error(json.error || 'Failed to fetch task data');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Unable to connect to backend Task API');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedStatus, selectedPriority]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handlePriorityFilterChange = (priority) => {
    setSelectedPriority(priority);
    setPage(1);
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const token = localStorage.getItem('connectdesk_token');
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const json = await response.json();
      if (response.ok && json.success) {
        fetchTasks();
        onCountsChange?.();
        if (showToast) {
          showToast(
            nextStatus === 'Completed' ? 'Task marked as completed!' : 'Task reopened',
            'info'
          );
        }
      } else {
        if (showToast) showToast(json.error || 'Failed to update task status', 'error');
      }
    } catch (err) {
      console.error('Error toggling task status:', err);
      if (showToast) showToast('Network connection error', 'error');
    }
  };

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setModalApiError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setModalApiError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (task) => {
    setDeletingTask(task);
    setIsDeletingModalOpen(true);
  };

  const handleSaveTask = async (formData) => {
    setIsSubmitting(true);
    setModalApiError(null);
    try {
      const token = localStorage.getItem('connectdesk_token');
      const isEdit = Boolean(formData._id);
      const url = isEdit ? `/api/tasks/${formData._id}` : '/api/tasks';
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
      fetchTasks();
      onCountsChange?.();
      if (showToast) {
        showToast(
          isEdit 
            ? `Task "${json.data.title}" updated!` 
            : `Task "${json.data.title}" created successfully!`,
          'success'
        );
      }
    } catch (err) {
      console.error('Error saving task:', err);
      setModalApiError('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('connectdesk_token');
      const response = await fetch(`/api/tasks/${deletingTask._id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete task');
      }

      setIsDeletingModalOpen(false);
      setDeletingTask(null);
      fetchTasks();
      onCountsChange?.();
      if (showToast) {
        showToast(`Task "${deletingTask.title}" deleted`, 'info');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      if (showToast) {
        showToast(err.message || 'Failed to delete task', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusList = ['All', 'Pending', 'In Progress', 'Completed'];
  const priorityList = ['All', 'High', 'Medium', 'Low'];

  if (unauthorized) {
    return (
      <div className="view-container">
        <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginTop: '2rem' }}>
          <Lock size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Please sign in to access tasks in MongoDB.
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
          <div className="input-with-icon" style={{ width: '260px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search tasks or categories..."
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

          <div className="filter-pill-group">
            <span className="filter-group-label">Priority:</span>
            {priorityList.map(pr => (
              <button
                key={pr}
                className={`filter-pill ${selectedPriority === pr ? 'active' : ''}`}
                onClick={() => handlePriorityFilterChange(pr)}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        <button className="primary-btn" onClick={handleOpenAddModal}>
          <Plus size={16} /> New Task
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
          <button className="secondary-sm-btn" onClick={fetchTasks}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="table-card-wrapper">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Task Title & Category</th>
                <th>Related Customer</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-table-state">
                      <RefreshCw size={32} className="spin text-cyan" />
                      <h4>Loading Tasks from Backend Database...</h4>
                    </div>
                  </td>
                </tr>
              ) : tasks.length > 0 ? (
                tasks.map(t => (
                  <tr key={t._id} className={t.status === 'Completed' ? 'row-completed' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={t.status === 'Completed'}
                        onChange={() => handleToggleTaskStatus(t)}
                        className="task-checkbox"
                        title={t.status === 'Completed' ? 'Mark as Pending' : 'Mark as Completed'}
                      />
                    </td>
                    <td>
                      <div>
                        <div className={`customer-name ${t.status === 'Completed' ? 'done' : ''}`}>
                          {t.title}
                        </div>
                        <div className="customer-email">
                          <Tag size={12} /> {t.category || 'General'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="company-cell">
                        <User size={14} className="cell-icon" />
                        <span>{t.customer?.name || 'Unassigned'} <span className="text-muted">({t.customer?.company || ''})</span></span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-tag ${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <div className="company-cell">
                        <Calendar size={13} className="cell-icon" />
                        <span className="font-mono font-sm">
                          {t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '--'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${t.status.toLowerCase().replace(' ', '-')}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="icon-action-btn"
                          title="Edit Task"
                          onClick={() => handleOpenEditModal(t)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="icon-action-btn danger" 
                          title="Delete Task"
                          onClick={() => handleOpenDeleteModal(t)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-table-state">
                      <CheckCircle2 size={36} className="text-muted" />
                      <h4>No task records found</h4>
                      <p>
                        {searchQuery || selectedStatus !== 'All' || selectedPriority !== 'All'
                          ? 'Try clearing your search query or filter pills.' 
                          : 'Click "+ New Task" to create your first task in MongoDB.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalTasks > 0 && (
          <div className="stat-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.4)' }}>
            <span className="stat-subtext">
              Showing page {page} of {totalPages} ({totalTasks} total task records)
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

      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveTask}
        initialData={editingTask}
        apiError={modalApiError}
        isSubmitting={isSubmitting}
      />

      <DeleteTaskConfirmationModal
        isOpen={isDeletingModalOpen}
        onClose={() => setIsDeletingModalOpen(false)}
        onConfirm={handleConfirmDelete}
        taskTitle={deletingTask?.title}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
