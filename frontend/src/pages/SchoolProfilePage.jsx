import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building, Mail, Hash, Phone, MapPin, Globe, Upload, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const SchoolProfilePage = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const isCompleted = user?.isProfileCompleted;

  const [formData, setFormData] = useState({
    schoolName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    plotNo: '',
    streetName: '',
    mandal: '',
    district: '',
    state: '',
    logo: ''
  });

  const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.schoolId) return;
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/schools/profile/${user.schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.status === 'success') {
          const profile = response.data.data;
          setFormData({
            schoolName: profile.schoolName || '',
            registrationNumber: profile.registrationNumber || '',
            email: profile.email || '',
            phone: profile.phone || '',
            plotNo: profile.plotNo || '',
            streetName: profile.streetName || '',
            mandal: profile.mandal || '',
            district: profile.district || '',
            state: profile.state || '',
            logo: profile.logo || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.schoolId, token, baseUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return setMessage({ type: 'error', text: 'Logo size should be less than 2MB' });
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      await axios.put(`${baseUrl}/schools/profile/${user.schoolId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Update context state and local storage
      updateUser({ isProfileCompleted: true, schoolName: formData.schoolName });
      
      if (!isCompleted) {
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-header-banner">
        <div className="header-content">
          <h1>{isCompleted ? 'Manage School Profile' : 'Complete Your School Profile'}</h1>
          <p>{isCompleted ? 'Keep your institutional details up to date.' : 'Please provide additional details to unlock the full management suite.'}</p>
        </div>
        {!isCompleted && <button onClick={logout} className="logout-btn">Sign Out</button>}
      </div>

      <div className="profile-card card">
        <form onSubmit={handleSubmit}>
          {message && (
            <div className={`message-alert ${message.type}`}>
              {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="profile-grid">
            {/* Read-only Section */}
            <div className="section-title">Institutional Identity</div>
            
            <div className="form-group">
              <label><Building size={16} /> School Name</label>
              <input 
                type="text" 
                name="schoolName"
                placeholder="Elite International School"
                value={formData.schoolName} 
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group readonly">
              <label><Hash size={16} /> Registration Number</label>
              <input type="text" value={formData.registrationNumber} readOnly />
            </div>

            <div className="form-group readonly">
              <label><Mail size={16} /> Email ID</label>
              <input type="text" value={formData.email} readOnly />
            </div>

            {/* Editable Section */}
            <div className="section-title">Contact & Location</div>

            <div className="form-group">
              <label><Phone size={16} /> Phone Number</label>
              <input 
                type="text" 
                name="phone" 
                placeholder="+91 98765 43210" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label><MapPin size={16} /> Plot No / Building</label>
              <input 
                type="text" 
                name="plotNo" 
                placeholder="Plot No. 123" 
                value={formData.plotNo} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label><MapPin size={16} /> Street Name</label>
              <input 
                type="text" 
                name="streetName" 
                placeholder="Main Road, Sector 5" 
                value={formData.streetName} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label><Globe size={16} /> Mandal / Taluk</label>
              <input 
                type="text" 
                name="mandal" 
                placeholder="Mandal Name" 
                value={formData.mandal} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label><Globe size={16} /> District</label>
              <input 
                type="text" 
                name="district" 
                placeholder="District Name" 
                value={formData.district} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label><Globe size={16} /> State</label>
              <input 
                type="text" 
                name="state" 
                placeholder="State Name" 
                value={formData.state} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="section-title">Branding</div>
            <div className="form-group full-width">
              <label><Upload size={16} /> School Logo</label>
              <div className="logo-upload-container">
                {formData.logo && (
                  <div className="logo-preview">
                    <img src={formData.logo} alt="School Logo Preview" />
                  </div>
                )}
                <div className="upload-controls">
                  <input 
                    type="file" 
                    accept="image/*"
                    id="logo-upload"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload" className="upload-label">
                    <Upload size={18} /> {formData.logo ? 'Change Logo' : 'Upload School Logo'}
                  </label>
                  <p className="help-text">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {isCompleted ? 'Update Profile' : 'Save & Complete Profile'}</>}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .profile-page-container { min-height: 100vh; background: #f8fafc; padding: 2rem; }
        .profile-header-banner { display: flex; justify-content: space-between; align-items: center; max-width: 1000px; margin: 0 auto 2rem; }
        .header-content h1 { font-size: 1.875rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
        .header-content p { color: #64748b; }
        .logout-btn { background: #fee2e2; color: #991b1b; padding: 0.625rem 1.25rem; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; }
        
        .profile-card { max-width: 1000px; margin: 0 auto; padding: 2.5rem; border-radius: 1.5rem; }
        .section-title { grid-column: 1 / -1; font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 1.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; }
        .section-title:first-child { margin-top: 0; }
        
        .profile-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.625rem; }
        .form-group input { width: 100%; padding: 0.75rem 1rem; background: #f1f5f9; border: 2px solid transparent; border-radius: 0.75rem; outline: none; transition: all 0.2s; font-size: 0.9375rem; }
        .form-group input:focus { background: white; border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        .form-group.readonly input { background: #f8fafc; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0; }
        
        .logo-upload-container { display: flex; align-items: center; gap: 2rem; background: #f1f5f9; padding: 1.5rem; border-radius: 1rem; border: 2px dashed #cbd5e1; }
        .logo-preview { width: 100px; height: 100px; background: white; border-radius: 0.75rem; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; }
        .logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .upload-label { display: flex; align-items: center; gap: 0.5rem; background: #4f46e5; color: white; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .upload-label:hover { background: #4338ca; }

        .help-text { font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; }
        .form-actions { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
        .save-btn { display: flex; align-items: center; gap: 0.75rem; background: #4f46e5; color: white; padding: 1rem 2rem; border: none; border-radius: 1rem; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
        .save-btn:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
        .save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        
        .message-alert { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: 1rem; margin-bottom: 2rem; font-weight: 500; }
        .message-alert.error { background: #fee2e2; color: #991b1b; }
        .message-alert.success { background: #dcfce7; color: #166534; }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr; }
          .profile-card { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default SchoolProfilePage;
