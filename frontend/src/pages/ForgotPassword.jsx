import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, ShieldCheck, Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
      const response = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        toast.success('OTP has been sent to your email.');
      } else {
        setError(data.message || 'Failed to send OTP');
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return setError('Passwords do not match');
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);
    setError('');

    try {
      const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
      const response = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to reset password');
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card card">
        <div className="card-header">
          <GraduationCap size={48} color="var(--primary)" />
          <h1>Reset Password</h1>
          <p>{step === 1 ? 'Enter your email to receive an OTP' : 'Enter the code and your new password'}</p>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert"><CheckCircle2 size={18} /> {success}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <Mail size={18} />
                <input 
                  type="email" 
                  className="form-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@example.com"
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset OTP'}
            </button>
            <div className="card-footer">
              <Link to="/login" className="back-to-login">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
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

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password'}
            </button>
            
            <div className="card-footer">
              <button type="button" className="resend-link" onClick={() => setStep(1)} disabled={loading}>
                Try another email
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .forgot-password-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; padding: 1rem; }
        .forgot-password-card { width: 100%; max-width: 400px; padding: 2.5rem; }
        .card-header { text-align: center; margin-bottom: 2rem; }
        .card-header h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .card-header p { color: var(--text-secondary); font-size: 0.875rem; }

        .error-alert { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: var(--radius); margin-bottom: 1.5rem; font-size: 0.875rem; text-align: center; }
        .success-alert { background: #dcfce7; color: #166534; padding: 0.75rem; border-radius: var(--radius); margin-bottom: 1.5rem; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

        .input-group { position: relative; display: flex; align-items: center; }
        .input-group svg { position: absolute; left: 1rem; color: var(--text-secondary); }
        .input-group .form-input { padding-left: 2.75rem; }
        
        .btn-block { width: 100%; justify-content: center; padding: 0.875rem; margin-top: 1rem; }
        
        .card-footer { margin-top: 2rem; text-align: center; padding-top: 1.5rem; border-top: 1px solid var(--border); }
        .back-to-login { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; font-weight: 500; }
        .back-to-login:hover { color: var(--primary); }
        
        .resend-link { background: none; border: none; color: var(--primary); font-size: 0.875rem; font-weight: 600; cursor: pointer; }
        .resend-link:hover { text-decoration: underline; }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
