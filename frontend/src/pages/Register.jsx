import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Building, ArrowRight, ShieldCheck, Loader2, AlertCircle, CheckCircle2, Phone, Eye, EyeOff } from 'lucide-react';
import { schoolApi } from '../utils/api';
import { toast } from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    schoolName: '',
    registrationNumber: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return setMessage({ type: 'error', text: 'Passwords do not match!' });
    }

    // Clean up spaces, dashes, parentheses to validate
    const phoneCleaned = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneCleaned)) {
      toast.error('Please enter a valid 10-digit Indian phone number (e.g., 98765 43210).');
      return setMessage({ 
        type: 'error', 
        text: 'Please enter a valid 10-digit Indian phone number (e.g., 98765 43210).' 
      });
    }

    const fullPhoneNumber = `+91${phoneCleaned}`;

    setLoading(true);
    setMessage(null);
    try {
      await schoolApi.register({
        ...formData,
        phoneNumber: fullPhoneNumber
      });
      setStep(2);
      toast.success('OTP sent to your email. Please verify.');
      setMessage({ type: 'success', text: 'OTP sent to your email. Please verify.' });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
      toast.error(errMsg);
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await schoolApi.verifyOTP({ 
        email: formData.email, 
        otp,
        password: formData.password 
      });
      toast.success('Registration successful! Redirecting to login...');
      setMessage({ type: 'success', text: 'Registration successful! Admin account created. Redirecting to login...' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid OTP.';
      toast.error(errMsg);
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-section">
            <div className="logo-icon">S</div>
            <h1>SAMS Elite</h1>
          </div>
          <h2>{step === 1 ? 'School Registration' : 'Verify Email'}</h2>
          <p>{step === 1 ? 'Join our elite school management network' : `Enter the 6-digit code sent to ${formData.email}`}</p>
        </div>

        {message && (
          <div className={`message-alert ${message.type}`}>
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={step === 1 ? handleRegister : handleVerify}>
          <div className="form-group">
            <label className="form-label">School Name<span style={{ color: '#ef4444' }}> *</span></label>
            <div className={`input-wrapper ${step === 2 ? 'disabled' : ''}`}>
              <Building size={18} />
              <input 
                type="text" 
                name="schoolName"
                placeholder="Elite International School"
                value={formData.schoolName}
                onChange={handleChange}
                disabled={step === 2}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address<span style={{ color: '#ef4444' }}> *</span></label>
            <div className={`input-wrapper ${step === 2 ? 'disabled' : ''}`}>
              <Mail size={18} />
              <input 
                type="email" 
                name="email"
                placeholder="school@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={step === 2}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">School Registration Number<span style={{ color: '#ef4444' }}> *</span></label>
            <div className={`input-wrapper ${step === 2 ? 'disabled' : ''}`}>
              <Building size={18} />
              <input 
                type="text" 
                name="registrationNumber"
                placeholder="REG123456"
                value={formData.registrationNumber}
                onChange={handleChange}
                disabled={step === 2}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (10-digit)<span style={{ color: '#ef4444' }}> *</span></label>
            <div className={`input-wrapper ${step === 2 ? 'disabled' : ''}`}>
              <Phone size={18} />
              <input 
                type="text" 
                name="phoneNumber"
                placeholder="98765 43210"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={step === 2}
                required 
              />
            </div>
          </div>

          {step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label">Password<span style={{ color: '#ef4444' }}> *</span></label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required 
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password<span style={{ color: '#ef4444' }}> *</span></label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required 
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Get OTP <ArrowRight size={18} /></>}
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Enter OTP<span style={{ color: '#ef4444' }}> *</span></label>
                <div className="input-wrapper">
                  <ShieldCheck size={18} />
                  <input 
                    type="text" 
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required 
                  />
                </div>
              </div>

              <button className="auth-btn verify" type="submit" disabled={loading}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Complete Registration'}
              </button>
              
              <button 
                type="button" 
                className="btn-link center" 
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={() => setStep(1)}
              >
                Back to Details
              </button>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>

      <style>{`
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 2rem; }
        .auth-card { background: white; padding: 2.5rem; border-radius: 1.5rem; width: 100%; max-width: 450px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); }
        .auth-header { text-align: center; margin-bottom: 2rem; }
        .logo-section { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .logo-icon { width: 40px; height: 40px; background: #4f46e5; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.5rem; }
        .logo-section h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
        .auth-header h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
        .auth-header p { color: #64748b; font-size: 0.875rem; }
        
        .message-alert { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem; font-size: 0.875rem; font-weight: 500; }
        .message-alert.error { background: #fee2e2; color: #991b1b; }
        .message-alert.success { background: #dcfce7; color: #166534; }
        
        .form-group { margin-bottom: 1.25rem; }
        .form-label { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
        .input-wrapper { display: flex; align-items: center; background: #f1f5f9; border: 2px solid transparent; border-radius: 0.75rem; padding: 0 1rem; transition: all 0.2s; position: relative; }
        .input-wrapper:focus-within { border-color: #4f46e5; background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        .input-wrapper.disabled { background: #f8fafc; opacity: 0.7; pointer-events: none; }
        .input-wrapper svg { color: #64748b; margin-right: 0.75rem; }
        .input-wrapper input { border: none; background: transparent; padding: 0.75rem 0; width: 100%; outline: none; color: #1e293b; font-size: 0.9375rem; padding-right: 2.5rem; }
        .password-toggle-btn {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .password-toggle-btn:hover {
          color: #4f46e5;
        }
        
        .auth-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: #4f46e5; color: white; padding: 0.875rem; border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 1rem; }
        .auth-btn:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
        .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .auth-btn.verify { background: #10b981; }
        .auth-btn.verify:hover { background: #059669; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
        
        .auth-footer { margin-top: 2rem; text-align: center; font-size: 0.875rem; color: #64748b; }
        .auth-footer a { color: #4f46e5; font-weight: 700; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Register;
