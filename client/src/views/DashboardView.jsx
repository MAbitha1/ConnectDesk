import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Plus,
  Sparkles,
  ChevronRight,
  Activity,
  Phone,
  Mail,
  Video,
  FileText
} from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function DashboardView({ 
  activities,
  onNavigate,
  onOpenAddCustomerModal,
  onOpenAddTaskModal
}) {
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loadingCust, setLoadingCust] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingFollowUps, setLoadingFollowUps] = useState(true);

  const fetchLiveMetrics = async () => {
    try {
      const token = localStorage.getItem('connectdesk_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [custRes, taskRes, followRes] = await Promise.all([
        fetch(getApiUrl('/api/customers?limit=100'), { headers }),
        fetch(getApiUrl('/api/tasks?limit=100'), { headers }),
        fetch(getApiUrl('/api/follow-ups?limit=100'), { headers })
      ]);

      if (custRes.ok) {
        const custJson = await custRes.json();
        if (custJson.success) setCustomers(custJson.data || []);
      }

      if (taskRes.ok) {
        const taskJson = await taskRes.json();
        if (taskJson.success) setTasks(taskJson.data || []);
      }

      if (followRes.ok) {
        const followJson = await followRes.json();
        if (followJson.success) setFollowUps(followJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching live dashboard metrics:', err);
    } finally {
      setLoadingCust(false);
      setLoadingTasks(false);
      setLoadingFollowUps(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const token = localStorage.getItem('connectdesk_token');
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchLiveMetrics();
    } catch (err) {
      console.error('Error toggling dashboard task status:', err);
    }
  };

  // Metric calculations based on live DB data
  const totalCustomers = customers.length;
  const activeLeads = customers.filter(c => c.status === 'Lead' || c.status === 'Contacted' || c.status === 'Proposal').length;
  const totalPipeline = customers.reduce((acc, c) => acc + (Number(c.dealValue) || 0), 0);
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const upcomingFollowUps = followUps.filter(f => !f.completed).length;

  const stats = [
    {
      title: 'Total Customers',
      value: loadingCust ? '...' : totalCustomers,
      subtext: `${activeLeads} active leads & proposals`,
      icon: Users,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      targetTab: 'customers'
    },
    {
      title: 'Pipeline Deal Value',
      value: loadingCust ? '...' : `$${totalPipeline.toLocaleString()}`,
      subtext: 'Across all customer stages',
      icon: DollarSign,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      targetTab: 'customers'
    },
    {
      title: 'Pending Tasks',
      value: loadingTasks ? '...' : pendingTasks,
      subtext: `${completedTasksCount} tasks completed`,
      icon: CheckSquare,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      targetTab: 'tasks'
    },
    {
      title: 'Upcoming Follow-ups',
      value: loadingFollowUps ? '...' : upcomingFollowUps,
      subtext: 'Scheduled client pings',
      icon: Calendar,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      targetTab: 'followups'
    }
  ];

  return (
    <div className="view-container">
      {/* Live DB Banner */}
      <div className="demo-banner">
        <div className="demo-banner-content">
          <Sparkles size={16} className="demo-icon" />
          <span><strong>Phase 10 Production Workspace:</strong> Multi-tenant user isolated, security hardened, and live MongoDB integration.</span>
        </div>
        <span className="demo-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Phase 10 Verified</span>
      </div>

      {/* Top Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className="stat-card"
              onClick={() => onNavigate(stat.targetTab)}
            >
              <div className="stat-card-top">
                <span className="stat-title">{stat.title}</span>
                <div className="stat-icon-badge" style={{ color: stat.color, backgroundColor: stat.bg }}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-footer">
                <span className="stat-subtext">{stat.subtext}</span>
                <ChevronRight size={14} className="stat-arrow" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Tasks & Follow-ups + Activity Timeline */}
      <div className="dashboard-content-grid">
        {/* Left Column: Action Items */}
        <div className="dashboard-col">
          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <CheckSquare size={18} className="panel-icon text-amber" />
                <h3>Pending Tasks</h3>
                <span className="count-badge">{pendingTasks}</span>
              </div>
              <div className="panel-actions">
                <button className="text-link-btn" onClick={() => onNavigate('tasks')}>
                  View All
                </button>
              </div>
            </div>

            <div className="task-preview-list">
              {loadingTasks ? (
                <div className="empty-state">
                  <p>Loading tasks from database...</p>
                </div>
              ) : tasks.filter(t => t.status !== 'Completed').slice(0, 4).length > 0 ? (
                tasks.filter(t => t.status !== 'Completed').slice(0, 4).map(task => (
                  <div key={task._id} className="task-preview-item">
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => handleToggleTask(task._id, task.status)}
                      className="task-checkbox"
                    />
                    <div className="task-info">
                      <div className="task-title-line">
                        <span className={`task-title ${task.status === 'Completed' ? 'done' : ''}`}>
                          {task.title}
                        </span>
                        <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="task-meta-line">
                        <span>Customer: <strong>{task.customer?.name || 'Unassigned'}</strong> ({task.customer?.company || ''})</span>
                        <span>•</span>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '--'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <CheckCircle2 size={32} className="text-emerald" />
                  <p>All tasks completed! Great job.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Calendar size={18} className="panel-icon text-cyan" />
                <h3>Scheduled Follow-ups</h3>
                <span className="count-badge">{upcomingFollowUps}</span>
              </div>
              <button className="text-link-btn" onClick={() => onNavigate('followups')}>
                Manage Calendar
              </button>
            </div>

            <div className="followup-preview-list">
              {loadingFollowUps ? (
                <div className="empty-state"><p>Loading follow-ups...</p></div>
              ) : followUps.filter(f => !f.completed).slice(0, 4).length > 0 ? (
                followUps.filter(f => !f.completed).slice(0, 4).map(fol => (
                  <div key={fol._id} className="followup-preview-item">
                    <div className="followup-type-badge">
                      {fol.type}
                    </div>
                    <div className="followup-details">
                      <div className="followup-name">{fol.title}</div>
                      <div className="followup-notes">
                        Customer: {fol.customer?.name || 'Unassigned'} ({fol.customer?.company || ''})
                      </div>
                    </div>
                    <div className="followup-time">
                      <Clock size={13} />
                      <span>{new Date(fol.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p style={{ color: 'var(--text-muted)' }}>No pending follow-ups scheduled.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Pipeline Breakdown & Activity */}
        <div className="dashboard-col">
          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <TrendingUp size={18} className="panel-icon text-indigo" />
                <h3>Customer Pipeline</h3>
              </div>
              <button className="text-link-btn" onClick={() => onNavigate('customers')}>
                View Directory
              </button>
            </div>

            <div className="pipeline-bars">
              {['Lead', 'Contacted', 'Proposal', 'Customer'].map(statusName => {
                const stageCount = customers.filter(c => c.status === statusName).length;
                const percent = totalCustomers > 0 ? Math.round((stageCount / totalCustomers) * 100) : 0;
                return (
                  <div key={statusName} className="pipeline-row">
                    <div className="pipeline-labels">
                      <span className="pipeline-name">{statusName}</span>
                      <span className="pipeline-count">{stageCount} customers ({percent}%)</span>
                    </div>
                    <div className="pipeline-track">
                      <div 
                        className={`pipeline-fill status-${statusName.toLowerCase()}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Activity size={18} className="panel-icon text-emerald" />
                <h3>Recent Workspace Activity</h3>
              </div>
            </div>

            <div className="activity-timeline">
              {activities.map(act => (
                <div key={act.id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <p className="activity-text">{act.text}</p>
                    <span className="activity-time">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
