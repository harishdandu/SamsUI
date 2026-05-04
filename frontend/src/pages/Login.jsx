import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, User, Loader2 } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-header">
          <GraduationCap size={48} color="var(--primary)" />
          <h1>SAMS Elite</h1>
          <p>Login to your school portal</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-group">
              <User size={18} />
              <input 
                type="text" 
                className="form-input" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="admin"
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group">
              <Lock size={18} />
              <input 
                type="password" 
                className="form-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Sample Credentials: admin / admin123</p>
        </div>
      </div>

      <style>{`
        .login-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
        .login-card { width: 100%; max-width: 400px; padding: 2.5rem; text-align: center; }
        .login-header { margin-bottom: 2rem; }
        .login-header h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .login-header p { color: var(--text-secondary); }
        .input-group { position: relative; display: flex; align-items: center; }
        .input-group svg { position: absolute; left: 1rem; color: var(--text-secondary); }
        .input-group .form-input { padding-left: 2.75rem; }
        .btn-block { width: 100%; justify-content: center; padding: 0.875rem; margin-top: 1rem; }
        .error-alert { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: var(--radius); margin-bottom: 1.5rem; font-size: 0.875rem; }
        .login-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;
