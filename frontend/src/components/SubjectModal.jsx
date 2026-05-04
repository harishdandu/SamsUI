import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';

const SubjectModal = ({ isOpen, onClose, onSave, subject = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    classes: [],
    code: '',
    description: ''
  });

  const classOptions = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    if (subject) {
      setFormData(subject);
    } else {
      setFormData({ name: '', classes: [], code: '', description: '' });
    }
  }, [subject, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassToggle = (className) => {
    setFormData(prev => {
      const isSelected = prev.classes.includes(className);
      if (isSelected) {
        return { ...prev, classes: prev.classes.filter(c => c !== className) };
      } else {
        return { ...prev, classes: [...prev.classes, className].sort((a, b) => parseInt(a) - parseInt(b)) };
      }
    });
  };

  const handleSelectAll = () => {
    if (formData.classes.length === classOptions.length) {
      setFormData(prev => ({ ...prev, classes: [] }));
    } else {
      setFormData(prev => ({ ...prev, classes: [...classOptions] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.classes.length === 0) {
      alert('Please select at least one class.');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving subject:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="modal-header">
          <h2>{subject ? 'Edit Subject' : 'Add New Subject'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input 
              type="text" name="name" className="form-input" 
              value={formData.name} onChange={handleChange} required 
              placeholder="e.g. Mathematics"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject Code (Optional)</label>
            <input 
              type="text" name="code" className="form-input" 
              value={formData.code} onChange={handleChange} 
              placeholder="e.g. MATH101"
            />
          </div>

          <div className="form-group">
            <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Select Classes (1-10)</label>
              <button 
                type="button" 
                className="btn-text" 
                onClick={handleSelectAll}
                style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                {formData.classes.length === classOptions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="classes-grid">
              {classOptions.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`class-chip ${formData.classes.includes(c) ? 'selected' : ''}`}
                  onClick={() => handleClassToggle(c)}
                >
                  Class {c}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              name="description" className="form-input" rows="3"
              value={formData.description} onChange={handleChange}
            ></textarea>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {subject ? 'Update Subject' : 'Save Subject'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { width: 100%; max-width: 500px; padding: 2rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .classes-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-top: 0.5rem; }
        .class-chip { padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius); background: white; cursor: pointer; transition: var(--transition); font-size: 0.875rem; text-align: center; }
        .class-chip:hover { border-color: var(--primary); color: var(--primary); }
        .class-chip.selected { background: var(--primary); color: white; border-color: var(--primary); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border); margin-top: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SubjectModal;
