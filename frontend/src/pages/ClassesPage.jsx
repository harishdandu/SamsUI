import React, { useState, useEffect } from 'react';
import { Save, Loader2, Plus, X, Settings2 } from 'lucide-react';
import { classApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ClassesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({}); // { className: { sections: [] } }
  const [sectionInputs, setSectionInputs] = useState({}); // { className: 'current input text' }
  const [editingSection, setEditingSection] = useState(null); // { className, index }
  const [editValue, setEditValue] = useState('');

  const availableClasses = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const classRes = await classApi.getAll({ schoolId: user?.schoolId });
      
      const initialConfig = {};
      const initialInputs = {};
      
      availableClasses.forEach(c => {
        const found = classRes.data.find(cls => cls.name === c);
        initialConfig[c] = {
          sections: found ? found.sections : []
        };
        initialInputs[c] = '';
      });
      
      setConfig(initialConfig);
      setSectionInputs(initialInputs);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = (className) => {
    const sectionName = sectionInputs[className]?.trim();
    if (!sectionName) return;
    
    if (config[className].sections.includes(sectionName)) {
      setSectionInputs(prev => ({ ...prev, [className]: '' }));
      return;
    }

    setConfig(prev => ({
      ...prev,
      [className]: {
        ...prev[className],
        sections: [...prev[className].sections, sectionName]
      }
    }));
    
    setSectionInputs(prev => ({ ...prev, [className]: '' }));
  };

  const handleRemoveSection = (className, sectionToRemove) => {
    setConfig(prev => {
      const currentSections = prev[className].sections;
      const newSections = currentSections.filter(s => s !== sectionToRemove);
      
      return {
        ...prev,
        [className]: { 
          ...prev[className], 
          sections: newSections
        }
      };
    });
  };
  
  const handleStartEdit = (className, index, currentName) => {
    setEditingSection({ className, index });
    setEditValue(currentName);
  };

  const handleRenameSection = (className, index) => {
    const newName = editValue.trim();
    if (!newName) {
      setEditingSection(null);
      return;
    }

    setConfig(prev => {
      const currentSections = [...prev[className].sections];
      
      // Check for duplicates
      if (currentSections.some((s, idx) => s === newName && idx !== index)) {
        alert('A section with this name already exists in this class.');
        return prev;
      }

      currentSections[index] = newName;
      return {
        ...prev,
        [className]: {
          ...prev[className],
          sections: currentSections
        }
      };
    });
    setEditingSection(null);
  };

  const handleBulkSave = async () => {
    try {
      // Validation: Check if at least one class has at least one section
      const hasAnySection = availableClasses.some(c => config[c].sections.length > 0);
      
      if (!hasAnySection) {
        alert('Please add at least one section to at least one class before saving.');
        return;
      }

      setSaving(true);
      const configs = availableClasses.map(c => ({
        name: c,
        sections: config[c].sections
      }));
      
      await classApi.bulkUpdate({ configs, schoolId: user?.schoolId });
      alert('Class configurations saved successfully!');
    } catch (err) {
      console.error('Error saving configurations:', err);
      alert('Failed to save configurations.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 size={40} className="animate-spin" />
        <p>Orchestrating Class Data...</p>
      </div>
    );
  }

  return (
    <div className="classes-page">
      <div className="sticky-header">
        <div className="header-content">
          <div className="header-info">
            <div className="icon-badge">
              <Settings2 size={24} />
            </div>
            <div>
              <h1>Institutional Class Structure</h1>
              <p>Define and manage sections for each grade level.</p>
            </div>
          </div>
          <button 
            className={`save-all-btn ${saving ? 'loading' : ''}`}
            onClick={handleBulkSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="class-grid">
        {availableClasses.map((c) => (
          <div key={c} className="grade-card">
            <div className="grade-header">
              <div className="grade-indicator">
                <span className="grade-label">GRADE</span>
                <span className="grade-value">{c}</span>
              </div>
              <div className="grade-status">
                <div className={`status-dot ${config[c].sections.length > 0 ? 'active' : ''}`} />
                <span>{config[c].sections.length} Sections</span>
              </div>
            </div>

            <div className="grade-body">
              <section className="config-group">
                <label>Manage Sections</label>
                <div className="section-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="e.g. Alpha, B, Section 1"
                    value={sectionInputs[c] || ''}
                    onChange={(e) => setSectionInputs(prev => ({ ...prev, [c]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSection(c)}
                  />
                  <button onClick={() => handleAddSection(c)} type="button">
                    <Plus size={18} />
                  </button>
                </div>
                <div className="tags-container">
                  {config[c].sections.map((sec, idx) => (
                    <div key={`${sec}-${idx}`} className="section-tag">
                      {editingSection?.className === c && editingSection?.index === idx ? (
                        <input 
                          autoFocus
                          type="text"
                          className="edit-section-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleRenameSection(c, idx)}
                          onKeyPress={(e) => e.key === 'Enter' && handleRenameSection(c, idx)}
                        />
                      ) : (
                        <span onClick={() => handleStartEdit(c, idx, sec)} title="Click to rename">{sec}</span>
                      )}
                      <button onClick={() => handleRemoveSection(c, sec)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .classes-page {
          padding-top: 1rem;
        }

        .sticky-header {
          position: sticky;
          top: -2rem;
          z-index: 50;
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(8px);
          padding: 1.5rem 0;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-badge {
          background: var(--primary);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .header-info h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .header-info p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
        }

        .save-all-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--text-primary);
          color: white;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          transition: var(--transition);
          box-shadow: var(--shadow);
        }

        .save-all-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #000;
          box-shadow: var(--shadow-lg);
        }

        .save-all-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .class-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 2rem;
        }

        .grade-card {
          background: white;
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
        }

        .grade-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }

        .grade-header {
          padding: 1.5rem;
          background: linear-gradient(to right, #f8fafc, #fff);
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .grade-indicator {
          display: flex;
          flex-direction: column;
        }

        .grade-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-secondary);
          letter-spacing: 0.1em;
        }

        .grade-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--primary);
          line-height: 1;
        }

        .grade-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: #f1f5f9;
          padding: 0.35rem 0.75rem;
          border-radius: 99px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #cbd5e1;
        }

        .status-dot.active {
          background: var(--secondary);
          box-shadow: 0 0 8px var(--secondary);
        }

        .grade-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .config-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .config-group label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-input-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        .section-input-wrapper input {
          flex: 1;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          border: 2px solid #f1f5f9;
          font-size: 0.875rem;
          transition: var(--transition);
        }

        .section-input-wrapper input:focus {
          border-color: var(--primary-light);
          background: white;
          outline: none;
        }

        .section-input-wrapper button {
          background: #f1f5f9;
          color: var(--text-primary);
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: var(--transition);
        }

        .section-input-wrapper button:hover {
          background: var(--primary);
          color: white;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-height: 32px;
        }

        .section-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #eef2ff;
          color: var(--primary);
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid #e0e7ff;
        }

        .section-tag button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          color: var(--primary);
          border-radius: 4px;
          padding: 2px;
          transition: var(--transition);
        }

        .section-tag button:hover {
          background: var(--danger);
          color: white;
        }

        .section-tag span {
          cursor: pointer;
        }

        .edit-section-input {
          background: white;
          border: 1px solid var(--primary);
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary);
          outline: none;
          width: 80px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8rem 0;
          gap: 1rem;
          color: var(--text-secondary);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .class-grid { grid-template-columns: 1fr; }
          .header-content { flex-direction: column; gap: 1rem; align-items: flex-start; }
          .save-all-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default ClassesPage;
