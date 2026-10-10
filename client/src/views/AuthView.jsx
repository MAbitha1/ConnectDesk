import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function AuthView({ onAuthSuccess, showToast }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (isRegister && !name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
      errs.email = 'Invalid email format';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (isRegister) {
      if (!confirmPassword) {
        errs.confirmPassword = 'Please confirm your password';
      } else if (confirmPassword !== password) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;

    setLoading(true);
    setError(null);

    const endpoint = getApiUrl(isRegister ? '/api/auth/register' : '/api/auth/login');
    const payload = isRegister 
      ? { name: name.trim(), email: email.trim(), password }
      : { email: email.trim(), password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.error || 'Authentication failed');
        return;
      }

      // Save token & report success
      localStorage.setItem('connectdesk_token', json.token);
      if (showToast) {
        showToast(
          isRegister ? `Welcome to ConnectDesk, ${json.user.name}!` : `Welcome back, ${json.user.name}!`,
          'success'
        );
      }
      onAuthSuccess(json.user, json.token);
    } catch (err) {
      console.error('Auth submit error:', err);
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="card-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
      }}>
        {/* Header Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {isRegister 
              ? 'Join ConnectDesk CRM workspace to manage customers' 
              : 'Sign in to access your MongoDB workspace records'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="status-banner error" style={{ marginBottom: '1.25rem', marginTop: 0 }}>
            <div className="status-indicator">
              <AlertCircle size={18} className="toast-icon error" />
              <div className="status-text-headline">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid" style={{ gap: '1.25rem' }}>
          {isRegister && (
            <div className="form-group full-width">
              <label className="form-label">Full Name *</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`text-input ${fieldErrors.name ? 'error' : ''}`}
                />
              </div>
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>
          )}

          <div className="form-group full-width">
            <label className="form-label">Email Address *</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                placeholder="alex@connectdesk.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`text-input ${fieldErrors.email ? 'error' : ''}`}
              />
            </div>
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group full-width">
            <label className="form-label">Password *</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`text-input ${fieldErrors.password ? 'error' : ''}`}
              />
            </div>
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          {isRegister && (
            <div className="form-group full-width">
              <label className="form-label">Confirm Password *</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`text-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                />
              </div>
              {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
            </div>
          )}

          <button 
            type="submit" 
            className="primary-btn full-width" 
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
            {!loading && <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            className="text-link-btn"
            style={{ fontWeight: 600, color: '#38bdf8', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setFieldErrors({});
            }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
