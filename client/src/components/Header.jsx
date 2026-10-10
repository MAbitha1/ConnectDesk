import React from 'react';
import { 
  Plus, 
  Server, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search,
  UserCheck,
  LogOut,
  LogIn
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  healthData, 
  healthLoading, 
  healthError, 
  healthLatency, 
  onRefreshHealth,
  onOpenAddCustomerModal,
  onOpenAddTaskModal,
  globalSearch,
  setGlobalSearch,
  currentUser,
  onLogout,
  onOpenAuth
}) {
  const getTabTitles = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Workspace Overview', subtitle: 'Real-time CRM metrics, activity timeline & quick actions' };
      case 'customers':
        return { title: 'Customer Directory', subtitle: 'Manage leads, active clients, deal values & contact records' };
      case 'tasks':
        return { title: 'Task Manager', subtitle: 'Track action items, priorities, due dates & status' };
      case 'followups':
        return { title: 'Upcoming Follow-ups', subtitle: 'Scheduled client communications, calls & presentations' };
      case 'settings':
        return { title: 'Settings & System Diagnostics', subtitle: 'Workspace config & live backend API health telemetry' };
      case 'auth':
        return { title: 'Account Authentication', subtitle: 'Secure JWT sign-in, registration & session security' };
      default:
        return { title: 'Dashboard', subtitle: 'Customer Relationship Workspace' };
    }
  };

  const { title, subtitle } = getTabTitles();

  return (
    <header className="main-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      <div className="header-right">
        {/* Global Search Bar */}
        <div className="header-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Quick search workspace..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Live Health API Status Badge */}
        <div 
          className={`health-badge ${healthError ? 'error' : healthLoading ? 'loading' : 'success'}`}
          title="Live backend API health monitor (/api/health)"
          onClick={onRefreshHealth}
        >
          <Server size={14} className="health-icon" />
          <span className="health-label">API:</span>
          {healthLoading ? (
            <span className="health-status">
              <RefreshCw size={12} className="spin" /> Checking...
            </span>
          ) : healthError ? (
            <span className="health-status offline">
              <XCircle size={13} /> Offline
            </span>
          ) : (
            <span className="health-status online">
              <CheckCircle2 size={13} /> 200 OK
            </span>
          )}
        </div>

        {/* User Session Profile Badge */}
        {currentUser ? (
          <div className="user-session-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.4rem 0.75rem',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem'
            }}>
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                {currentUser.email}
              </span>
            </div>
            <button 
              onClick={onLogout} 
              className="icon-action-btn danger" 
              title="Sign Out"
              style={{ marginLeft: '0.25rem', padding: '4px' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button 
            className="secondary-btn" 
            onClick={onOpenAuth}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}

        {/* Quick Action Button */}
        {activeTab === 'tasks' ? (
          <button className="primary-btn" onClick={onOpenAddTaskModal}>
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        ) : (
          <button className="primary-btn" onClick={onOpenAddCustomerModal}>
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        )}
      </div>
    </header>
  );
}
