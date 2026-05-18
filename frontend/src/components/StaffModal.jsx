import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { subjectApi } from '../utils/api';

const StaffModal = ({ isOpen, onClose, onSave, staffMember = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    role: 'Teacher',
    designation: '',
    gender: '',
    email: '',
    phone: '',
    status: 'Active',
    salary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    teachingSubjects: [], // Array of { subjectId, classes }
    casualLeaves: 0,
    sickLeaves: 0,
    otherLeaves: 0
  });
  
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  const fetchSubjects = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await subjectApi.getAll({ schoolId: user?.schoolId });
      setAvailableSubjects(res.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  useEffect(() => {
    if (staffMember) {
      setFormData({
        ...staffMember,
        salary: staffMember.salary?.base || 0,
        joiningDate: staffMember.joiningDate ? new Date(staffMember.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        teachingSubjects: (staffMember.teachingSubjects && staffMember.teachingSubjects.length > 0) 
          ? staffMember.teachingSubjects 
          : (staffMember.role === 'Teacher' ? [{ subjectId: '', classes: [] }] : [])
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        employeeId: '',
        role: 'Teacher',
        designation: '',
        gender: '',
        email: '',
        phone: '',
        status: 'Active',
        salary: 0,
        joiningDate: new Date().toISOString().split('T')[0],
        teachingSubjects: [{ subjectId: '', classes: [] }],
        casualLeaves: 0,
        sickLeaves: 0,
        otherLeaves: 0
      });
    }
  }, [staffMember, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      teachingSubjects: [{ subjectId, classes: [] }]
    }));
  };

  const handleCheckboxToggle = (className) => {
    setFormData(prev => {
      let newSubjects = [...prev.teachingSubjects];
      if (newSubjects.length === 0) {
        newSubjects = [{ subjectId: '', classes: [className] }];
      } else {
        newSubjects = newSubjects.map((ts, i) => {
          if (i === 0) {
            const currentClasses = ts.classes || [];
            const newClasses = currentClasses.includes(className)
              ? currentClasses.filter(c => c !== className)
              : [...currentClasses, className].sort((a, b) => parseInt(a) - parseInt(b));
            return { ...ts, classes: newClasses };
          }
          return ts;
        });
      }
      return { ...prev, teachingSubjects: newSubjects };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Clean up teachingSubjects to avoid BSON errors for non-teachers or empty selections
      const cleanedTeachingSubjects = formData.role === 'Teacher' 
        ? (formData.teachingSubjects || []).filter(ts => ts.subjectId && ts.subjectId !== '')
        : [];

      const dataToSave = {
        ...formData,
        schoolId: user?.schoolId,
        salary: { base: Number(formData.salary || 0) },
        teachingSubjects: cleanedTeachingSubjects
      };
      await onSave(dataToSave);
      onClose();
    } catch (err) {
      console.error('Error saving staff:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="modal-header">
          <h2>{staffMember ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text" name="firstName" className="form-input" 
                value={formData.firstName} onChange={handleChange} required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                type="text" name="lastName" className="form-input" 
                value={formData.lastName} onChange={handleChange} required 
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" className="form-input" value={formData.role} onChange={handleChange}>
                <option value="Admin">Admin</option>
                <option value="Teacher">Teacher</option>
                <option value="Accountant">Accountant</option>
                <option value="HR">HR</option>
              </select>
            </div>
            {formData.role === 'Teacher' && (
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select 
                  className="form-input" 
                  value={formData.teachingSubjects[0]?.subjectId || ''} 
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.role === 'Teacher' && formData.teachingSubjects[0]?.subjectId && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Assigned Classes</label>
              <div className="checkbox-grid">
                {availableSubjects.find(s => s._id === formData.teachingSubjects[0]?.subjectId)?.classes.map(c => (
                  <label key={c} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={formData.teachingSubjects[0]?.classes?.includes(c) || false}
                      onChange={() => handleCheckboxToggle(c)}
                    />
                    <span>Class {c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-input" value={formData.gender || ''} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" name="phone" className="form-input" 
                value={formData.phone} onChange={handleChange} 
              />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" name="email" className="form-input" 
                value={formData.email} onChange={handleChange} required 
                disabled={!!staffMember}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Salary ($)</label>
              <input 
                type="number" name="salary" className="form-input" 
                value={formData.salary} onChange={handleChange} required 
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input 
                type="date" name="joiningDate" className="form-input" 
                value={formData.joiningDate} onChange={handleChange} required 
                disabled={!!staffMember}
              />
            </div>
          </div>

          <div className="form-section-title">Leave Balance</div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Casual Leaves</label>
              <input 
                type="number" name="casualLeaves" className="form-input" 
                value={formData.casualLeaves} onChange={handleChange} min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sick Leaves</label>
              <input 
                type="number" name="sickLeaves" className="form-input" 
                value={formData.sickLeaves} onChange={handleChange} min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Other Leaves</label>
              <input 
                type="number" name="otherLeaves" className="form-input" 
                value={formData.otherLeaves} onChange={handleChange} min="0"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {staffMember ? 'Update Staff' : 'Save Staff'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 2rem; }
        .modal-content { width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; padding: 2.5rem; position: relative; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; position: sticky; top: -2.5rem; background: var(--surface); z-index: 5; padding: 1rem 0; margin-top: -1rem; border-bottom: 1px solid var(--border); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .form-section-title { font-size: 0.875rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin: 1.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border); margin-top: 2rem; position: sticky; bottom: -2.5rem; background: var(--surface); z-index: 5; padding-bottom: 1rem; margin-bottom: -1rem; }
        
        .teaching-subjects-section { margin-top: 1.5rem; border-top: 1px solid var(--border); padding-top: 1.5rem; margin-bottom: 2rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .section-header h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .btn-text { display: flex; align-items: center; gap: 0.25rem; background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; font-size: 0.875rem; }
        
        .teaching-subject-item { padding: 1.25rem; margin-bottom: 1rem; background: #f8fafc; border: 1px solid var(--border); }
        .classes-selection .label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; display: block; }
        
        .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; background: #f8fafc; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); }
        .checkbox-item { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; color: var(--text-primary); transition: var(--transition); }
        .checkbox-item:hover { color: var(--primary); }
        .checkbox-item input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary); }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default StaffModal;
