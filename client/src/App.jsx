import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import AddCustomerModal from './components/AddCustomerModal';
import AddTaskModal from './components/AddTaskModal';

import DashboardView from './views/DashboardView';
import CustomersView from './views/CustomersView';
import TasksView from './views/TasksView';
import FollowUpsView from './views/FollowUpsView';
import SettingsView from './views/SettingsView';
import AuthView from './views/AuthView';

import { 
  INITIAL_CUSTOMERS, 
  INITIAL_TASKS, 
  INITIAL_FOLLOWUPS, 
  INITIAL_ACTIVITIES 
} from './data/initialData';

import './App.css';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  // Authentication Session State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('connectdesk_token') || null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Live Sidebar Badge Counts State
  const [sidebarTaskCount, setSidebarTaskCount] = useState(0);
  const [sidebarFollowUpCount, setSidebarFollowUpCount] = useState(0);

  const fetchSidebarCounts = useCallback(async () => {
    const token = localStorage.getItem('connectdesk_token');
    if (!token) {
      setSidebarTaskCount(0);
      setSidebarFollowUpCount(0);
      return;
    }
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [taskRes, followRes] = await Promise.all([
        fetch('/api/tasks?limit=100', { headers }),
        fetch('/api/follow-ups?limit=100', { headers })
      ]);

      if (taskRes.ok) {
        const taskJson = await taskRes.json();
        if (taskJson.success && Array.isArray(taskJson.data)) {
          const pendingCount = taskJson.data.filter(t => t.status !== 'Completed').length;
          setSidebarTaskCount(pendingCount);
        }
      }

      if (followRes.ok) {
        const followJson = await followRes.json();
        if (followJson.success && Array.isArray(followJson.data)) {
          const upcomingCount = followJson.data.filter(f => !f.completed).length;
          setSidebarFollowUpCount(upcomingCount);
        }
      }
    } catch (err) {
      console.error('Error fetching live sidebar counts:', err);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSidebarCounts();
    } else {
      setSidebarTaskCount(0);
      setSidebarFollowUpCount(0);
    }
  }, [currentUser, fetchSidebarCounts]);

  // Restore authenticated user profile on app load
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem('connectdesk_token');
      if (savedToken) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          if (response.ok) {
            const json = await response.json();
            if (json.success) {
              setCurrentUser(json.user);
              setAuthToken(savedToken);
            } else {
              localStorage.removeItem('connectdesk_token');
              setCurrentUser(null);
              setAuthToken(null);
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('connectdesk_token');
            setCurrentUser(null);
            setAuthToken(null);
          }
        } catch (err) {
          console.error('Error restoring auth session:', err);
          localStorage.removeItem('connectdesk_token');
          setCurrentUser(null);
          setAuthToken(null);
        }
      }
      setIsAuthChecking(false);
    }
    restoreSession();
  }, []);

  const handleAuthSuccess = (userData, token) => {
    setCurrentUser(userData);
    setAuthToken(token);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('connectdesk_token');
    setCurrentUser(null);
    setAuthToken(null);
    setActiveTab('auth');
    showToast('Signed out successfully', 'info');
  };

  // Domain Entities State
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [followUps, setFollowUps] = useState(INITIAL_FOLLOWUPS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // UI Modals & Toast State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Health API State (Preserved Phase 1 Integration)
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);
  const [healthLatency, setHealthLatency] = useState(null);

  const fetchHealthStatus = async () => {
    setHealthLoading(true);
    setHealthError(null);
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health');
      const endTime = performance.now();
      setHealthLatency(Math.round(endTime - startTime));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch API health:', err);
      setHealthError(err.message || 'Unable to connect to backend server');
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Customer Handlers
  const handleAddCustomer = (newCustomerData) => {
    const newCust = {
      ...newCustomerData,
      id: `cust-${Date.now()}`
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast(`Customer "${newCust.name}" added successfully!`);
  };

  // Task Handlers
  const handleAddTask = (newTaskData) => {
    const newTask = {
      ...newTaskData,
      id: `task-${Date.now()}`
    };
    setTasks(prev => [newTask, ...prev]);
    showToast(`Task created!`);
  };

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        showToast(nextStatus === 'Completed' ? `Task completed!` : `Task marked pending`, 'info');
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;
  const followUpsCount = followUps.filter(f => !f.completed).length;

  if (isAuthChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        color: '#f8fafc',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        <div className="spin" style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: '#38bdf8',
          borderRadius: '50%',
          marginBottom: '1rem'
        }}></div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Verifying ConnectDesk Session...</h3>
      </div>
    );
  }

  // If user is not authenticated, render AuthView gateway
  if (!currentUser) {
    return (
      <div className="workspace-layout">
        <Sidebar 
          activeTab="auth"
          setActiveTab={() => {}}
          pendingTasksCount={0}
          followUpsCount={0}
          isUnauthenticated={true}
        />
        <div className="main-content">
          <Header 
            activeTab="auth"
            healthData={healthData}
            healthLoading={healthLoading}
            healthError={healthError}
            healthLatency={healthLatency}
            onRefreshHealth={fetchHealthStatus}
            onOpenAddCustomerModal={() => {}}
            onOpenAddTaskModal={() => {}}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            currentUser={null}
            onLogout={() => {}}
            onOpenAuth={() => {}}
          />
          <main className="content-body">
            <AuthView 
              onAuthSuccess={handleAuthSuccess}
              showToast={showToast}
            />
          </main>
        </div>
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="workspace-layout">
      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab === 'auth' ? 'dashboard' : activeTab} 
        setActiveTab={setActiveTab}
        pendingTasksCount={sidebarTaskCount}
        followUpsCount={sidebarFollowUpCount}
      />

      {/* Main Content Workspace */}
      <div className="main-content">
        <Header 
          activeTab={activeTab === 'auth' ? 'dashboard' : activeTab}
          healthData={healthData}
          healthLoading={healthLoading}
          healthError={healthError}
          healthLatency={healthLatency}
          onRefreshHealth={fetchHealthStatus}
          onOpenAddCustomerModal={() => setIsAddCustomerOpen(true)}
          onOpenAddTaskModal={() => setIsAddTaskOpen(true)}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={() => setActiveTab('auth')}
        />

        <main className="content-body">
          {(activeTab === 'dashboard' || activeTab === 'auth') && (
            <DashboardView 
              followUps={followUps}
              activities={activities}
              onNavigate={setActiveTab}
              onOpenAddCustomerModal={() => setIsAddCustomerOpen(true)}
              onOpenAddTaskModal={() => setIsAddTaskOpen(true)}
              onCountsChange={fetchSidebarCounts}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView 
              showToast={showToast}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView 
              showToast={showToast}
              onCountsChange={fetchSidebarCounts}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpsView 
              showToast={showToast}
              followUps={followUps}
              onToggleFollowUp={() => {}}
              onCountsChange={fetchSidebarCounts}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              healthData={healthData}
              healthLoading={healthLoading}
              healthError={healthError}
              healthLatency={healthLatency}
              onRefreshHealth={fetchHealthStatus}
              currentUser={currentUser}
              onUpdateCurrentUser={(updatedUser) => setCurrentUser(updatedUser)}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddCustomerModal 
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onAddCustomer={handleAddCustomer}
      />

      <AddTaskModal 
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        customers={customers}
      />

      {/* Floating Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
