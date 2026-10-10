import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Calendar, 
  Settings, 
  Layers, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingTasksCount, followUpsCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasksCount },
    { id: 'followups', label: 'Follow-ups', icon: Calendar, badge: followUpsCount },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Layers size={24} className="brand-logo" />
        </div>
        <div className="brand-info">
          <div className="brand-title-row">
            <span className="brand-name">ConnectDesk</span>
            <span className="brand-tag">CRM</span>
          </div>
          <span className="brand-sub">Workspace v2.0</span>
        </div>
      </div>

      <div className="sidebar-demo-badge">
        <Sparkles size={14} />
        <span>Live Workspace Active</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">MAIN NAVIGATION</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={19} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className={`nav-badge ${isActive ? 'active-badge' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="phase-indicator">
          <ShieldCheck size={16} className="phase-icon" />
          <div>
            <div className="phase-title">Phase 10 Architecture</div>
            <div className="phase-desc">React + Express + MongoDB</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
