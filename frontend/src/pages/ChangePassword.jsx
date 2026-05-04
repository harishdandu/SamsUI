import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Change
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
      const response = await fetch(`${baseUrl}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep(2);
        setSuccess('OTP has been sent to your registered email.');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);
    setError('');

    try {
      const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
      const response = await fetch(`${baseUrl}/auth/change-password-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully! Redirecting...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="header-section">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Security Settings</h1>
        <p>Manage your account security and password</p>
      </div>

      <div className="content-container">
        <div className="security-card card">
          <div className="card-header">
            <ShieldCheck size={32} color="var(--primary)" />
            <h2>Change Password</h2>
            <p>Verification required via Email OTP</p>
          </div>

          {error && <div className="error-alert">{error}</div>}
          {success && <div className="success-alert"><CheckCircle2 size={18} /> {success}</div>}

          {step === 1 ? (
            <div className="step-content">
              <div className="info-box">
                <Mail size={24} color="var(--primary)" />
                <div>
                  <p className="info-title">Verify your identity</p>
                  <p className="info-text">We will send a 6-digit code to <strong>{user?.email}</strong></p>
                </div>
              </div>
              <button 
                className="btn btn-primary btn-block" 
                onClick={handleRequestOTP}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Verification OTP'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="step-content">
              <div className="form-group">
                <label className="form-label">Enter OTP Code</label>
                <div className="input-group">
                  <ShieldCheck size={18} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="6-digit code"
                    maxLength={6}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-group">
                  <Lock size={18} />
                  <input 
                    type="password" 
                    className="form-input" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Min 6 characters"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-group">
                  <Lock size={18} />
                  <input 
                    type="password" 
                    className="form-input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Repeat password"
                    required 
                  />
                </div>
              </div>

              <div className="button-group">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-block" 
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-block" 
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .change-password-page { padding: 2rem; max-width: 800px; margin: 0 auto; }
        .header-section { margin-bottom: 2.5rem; }
        .header-section h1 { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); margin: 0.5rem 0; }
        .header-section p { color: var(--text-secondary); }
        
        .back-btn { display: flex; align-items: center; gap: 0.5rem; background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0; font-weight: 500; margin-bottom: 1rem; }
        .back-btn:hover { color: var(--primary); }

        .security-card { padding: 2.5rem; background: white; border-radius: 1rem; }
        .card-header { text-align: center; margin-bottom: 2rem; }
        .card-header h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .card-header p { color: var(--text-secondary); font-size: 0.875rem; }

        .info-box { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: #eef2ff; border-radius: 0.75rem; margin-bottom: 2rem; }
        .info-title { font-weight: 600; color: var(--primary); margin-bottom: 0.25rem; }
        .info-text { font-size: 0.875rem; color: #4338ca; margin: 0; }

        .error-alert { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.875rem; text-align: center; }
        .success-alert { background: #dcfce7; color: #166534; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

        .input-group { position: relative; display: flex; align-items: center; }
        .input-group svg { position: absolute; left: 1rem; color: var(--text-secondary); }
        .input-group .form-input { padding-left: 2.75rem; }
        
        .btn-block { width: 100%; justify-content: center; padding: 0.875rem; margin-top: 1rem; }
        .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text-secondary); }
        .btn-ghost:hover { background: #f8fafc; color: var(--text-primary); }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ChangePassword;
