import React, { useState, useEffect } from 'react';
import { 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  ShieldCheck, 
  Sliders, 
  Database,
  Globe,
  Bell,
  User,
  Mail,
  Save,
  Lock,
  Sparkles
} from 'lucide-react';

export default function SettingsView({ 
  healthData, 
  healthLoading, 
  healthError, 
  healthLatency, 
  onRefreshHealth,
  currentUser,
  onUpdateCurrentUser,
  showToast
}) {
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Preference Toggles (Local Storage)
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('connectdesk_pref_notifications') !== 'false'
  );
  const [autoTelemetryEnabled, setAutoTelemetryEnabled] = useState(
    localStorage.getItem('connectdesk_pref_telemetry') !== 'false'
  );

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to update your workspace profile', 'error');
      return;
    }

    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const token = localStorage.getItem('connectdesk_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update profile');
      }

      if (json.token) {
        localStorage.setItem('connectdesk_token', json.token);
      }

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(json.user);
      }

      setProfileMsg({ type: 'success', text: 'Profile details saved successfully!' });
      showToast('Profile details updated!', 'success');
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Error updating profile' });
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleNotifications = (e) => {
    const val = e.target.checked;
    setNotificationsEnabled(val);
    localStorage.setItem('connectdesk_pref_notifications', val ? 'true' : 'false');
    showToast(val ? 'Notifications enabled' : 'Notifications disabled', 'info');
  };

  const handleToggleTelemetry = (e) => {
    const val = e.target.checked;
    setAutoTelemetryEnabled(val);
    localStorage.setItem('connectdesk_pref_telemetry', val ? 'true' : 'false');
    showToast(val ? 'Automatic telemetry active' : 'Telemetry paused', 'info');
  };

  const dbConnected = healthData?.database?.connected || false;

  return (
    <div className="view-container">
      {/* Account & User Profile Card */}
      <div className="card-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <User size={20} className="text-cyan" />
            <h3>User Account & Profile</h3>
            <span className="tag-active" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              Authenticated Workspace
            </span>
          </div>
        </div>

        {currentUser ? (
          <form onSubmit={handleProfileSubmit} style={{ marginTop: '1rem' }}>
            {profileMsg && (
              <div className={`status-banner ${profileMsg.type}`} style={{ marginBottom: '1.25rem' }}>
                <div className="status-indicator">
                  {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span style={{ fontSize: '0.875rem' }}>{profileMsg.text}</span>
                </div>
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="text-input"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Login ID)</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="text-input"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Account created: {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active'}
              </div>
              <button
                type="submit"
                className="primary-btn"
                disabled={savingProfile}
              >
                <Save size={16} className={savingProfile ? 'spin' : ''} />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Lock size={32} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
            <p>Please sign in to view and manage your workspace profile details.</p>
          </div>
        )}
      </div>

      {/* System Health Diagnostic Card (Phase 1 Integration) */}
      <div className="card-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header">
          <div className="panel-title-group">
            <Server size={20} className="text-indigo" />
            <h3>Backend API Health Diagnostics</h3>
            <span className="tag-active">Live Monitor</span>
          </div>
          <button 
            className="secondary-sm-btn"
            onClick={onRefreshHealth}
            disabled={healthLoading}
          >
            <RefreshCw size={14} className={healthLoading ? 'spin' : ''} />
            {healthLoading ? 'Testing...' : 'Test Health Endpoint'}
          </button>
        </div>

        <div className={`status-banner ${healthLoading ? 'loading' : healthError ? 'error' : 'success'}`}>
          <div className="status-indicator">
            <div className={`status-pulse ${healthLoading ? 'loading' : healthError ? 'error' : 'success'}`}></div>
            <div>
              <div className="status-text-headline">
                {healthLoading ? 'Ping sent to GET /api/health...' : healthError ? 'Express Backend Disconnected' : 'Express API Healthy & Active'}
              </div>
              <div className="status-text-sub">
                {healthLoading ? 'Awaiting HTTP 200 response' : healthError ? healthError : 'Express backend server is processing API requests without errors'}
              </div>
            </div>
          </div>
          {!healthLoading && !healthError && (
            <span className="badge-pill success"><CheckCircle2 size={16} /> 200 OK</span>
          )}
          {!healthLoading && healthError && (
            <span className="badge-pill error"><XCircle size={16} /> Connection Refused</span>
          )}
        </div>

        <div className="metrics-grid" style={{ marginTop: '1.25rem' }}>
          <div className="metric-box">
            <div className="metric-label">Target Route</div>
            <div className="metric-value font-mono">GET /api/health</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">API Latency</div>
            <div className="metric-value">{healthLatency !== null ? `${healthLatency} ms` : '--'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Server Uptime</div>
            <div className="metric-value">{healthData?.uptime || '--'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Environment</div>
            <div className="metric-value">{healthData?.environment || 'development'}</div>
          </div>
        </div>

        <div className="payload-box" style={{ marginTop: '1.25rem' }}>
          <div className="payload-title">
            <Terminal size={14} />
            Live JSON Response Payload (`GET /api/health`)
          </div>
          <pre className="payload-code">
            {healthLoading 
              ? '// Requesting telemetry...' 
              : healthData 
                ? JSON.stringify(healthData, null, 2) 
                : `// Connection Error: ${healthError}`}
          </pre>
        </div>
      </div>

      {/* Workspace Preferences */}
      <div className="card-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header">
          <div className="panel-title-group">
            <Sliders size={20} className="text-cyan" />
            <h3>Workspace Preferences</h3>
          </div>
        </div>

        <div className="settings-options-list">
          <div className="settings-option-item">
            <div>
              <div className="option-title"><Bell size={16} /> Email & Desktop Notifications</div>
              <div className="option-desc">Receive real-time alerts when high priority tasks or follow-ups are due.</div>
            </div>
            <input 
              type="checkbox" 
              checked={notificationsEnabled} 
              onChange={handleToggleNotifications}
              className="toggle-switch" 
            />
          </div>

          <div className="settings-option-item">
            <div>
              <div className="option-title"><Globe size={16} /> Automatic Health Telemetry</div>
              <div className="option-desc">Poll backend health ping every 30 seconds automatically.</div>
            </div>
            <input 
              type="checkbox" 
              checked={autoTelemetryEnabled} 
              onChange={handleToggleTelemetry}
              className="toggle-switch" 
            />
          </div>

          <div className="settings-option-item">
            <div>
              <div className="option-title"><Database size={16} /> MongoDB Atlas Persistence</div>
              <div className="option-desc">Mongoose database connection status verified via health telemetry.</div>
            </div>
            {dbConnected ? (
              <span className="badge-pill success"><CheckCircle2 size={14} /> Connected & Active</span>
            ) : (
              <span className="badge-pill warning"><Database size={14} /> Connection Offline</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
