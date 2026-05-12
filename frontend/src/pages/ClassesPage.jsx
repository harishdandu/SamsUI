import React, { useState, useEffect } from 'react';
import { Search, Save, Loader2, Plus, Trash2, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { classApi, subjectApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ClassesPage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [config, setConfig] = useState({}); // { className: { sections: [], subjects: [] } }

  const availableClasses = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
  const sectionOptions = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, subjectRes] = await Promise.all([
        classApi.getAll({ schoolId: user?.schoolId }),
        subjectApi.getAll({ schoolId: user?.schoolId })
      ]);
      
      setClasses(classRes.data);
      setSubjects(subjectRes.data);

      // Initialize config from fetched classes
      const initialConfig = {};
      availableClasses.forEach(c => {
        const found = classRes.data.find(cls => cls.name === c);
        initialConfig[c] = {
          sections: found ? found.sections : ['A'],
          subjects: found ? found.subjects.map(s => s._id) : []
        };
      });
      setConfig(initialConfig);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionToggle = (className, section) => {
    setConfig(prev => {
      const currentSections = prev[className].sections;
      const newSections = currentSections.includes(section)
        ? currentSections.filter(s => s !== section)
        : [...currentSections, section].sort();
      
      return {
        ...prev,
        [className]: { ...prev[className], sections: newSections.length > 0 ? newSections : ['A'] }
      };
    });
  };

  const handleSubjectToggle = (className, subjectId) => {
    setConfig(prev => {
      const currentSubjects = prev[className].subjects;
      const newSubjects = currentSubjects.includes(subjectId)
        ? currentSubjects.filter(s => s !== subjectId)
        : [...currentSubjects, subjectId];
      
      return {
        ...prev,
        [className]: { ...prev[className], subjects: newSubjects }
      };
    });
  };

  const handleSelectAllSubjects = (className) => {
    const classSubjects = subjects.filter(s => s.classes.includes(className)).map(s => s._id);
    const currentSelected = config[className].subjects;
    const allSelected = classSubjects.every(id => currentSelected.includes(id));
    
    setConfig(prev => ({
      ...prev,
      [className]: {
        ...prev[className],
        subjects: allSelected ? [] : [...new Set([...currentSelected, ...classSubjects])]
      }
    }));
  };

  const handleBulkSave = async () => {
    try {
      setSavingId('global');
      const configs = availableClasses.map(c => ({
        name: c,
        sections: config[c].sections,
        subjects: config[c].subjects
      }));
      
      await classApi.bulkUpdate({ configs, schoolId: user?.schoolId });
      alert('All configurations saved successfully!');
    } catch (err) {
      console.error('Error saving configurations:', err);
      alert('Failed to save configurations.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={32} className="animate-spin" />
        <p>Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="classes-config-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Class Configuration</h1>
          <p>Define sections and assign subjects for each class.</p>
        </div>
        <button 
          className={`btn btn-primary ${savingId === 'global' ? 'loading' : ''}`}
          onClick={handleBulkSave}
          disabled={savingId === 'global'}
        >
          {savingId === 'global' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save All Changes
        </button>
      </header>

      <div className="config-grid">
        {availableClasses.map((c) => (
          <div key={c} className="card class-config-card">
            <div className="card-header">
              <div className="class-title">
                <div className="icon-box"><Layers size={20} /></div>
                <h3>Class {c}</h3>
              </div>
            </div>

            <div className="config-section">
              <label className="section-label">Sections</label>
              <div className="sections-list">
                {sectionOptions.map(sec => (
                  <button
                    key={sec}
                    className={`section-chip ${config[c].sections.includes(sec) ? 'active' : ''}`}
                    onClick={() => handleSectionToggle(c, sec)}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-section">
              <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="section-label" style={{ marginBottom: 0 }}>Assigned Subjects</label>
                {subjects.filter(s => s.classes.includes(c)).length > 0 && (
                  <button 
                    type="button" 
                    className="btn-text" 
                    onClick={() => handleSelectAllSubjects(c)}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    {subjects.filter(s => s.classes.includes(c)).every(s => config[c].subjects.includes(s._id)) ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="subjects-scroll">
                {subjects.filter(s => s.classes.includes(c)).length > 0 ? (
                  subjects.filter(s => s.classes.includes(c)).map(sub => (
                    <label key={sub._id} className="subject-check-item">
                      <input 
                        type="checkbox"
                        checked={config[c].subjects.includes(sub._id)}
                        onChange={() => handleSubjectToggle(c, sub._id)}
                      />
                      <span>{sub.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="no-data">No subjects associated with Class {c}. Edit subjects to include this class.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .classes-config-page { padding-bottom: 3rem; }
        .page-header { margin-bottom: 2rem; }
        
        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .class-config-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border: 1px solid var(--border);
          transition: var(--transition);
        }

        .class-config-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--primary-light);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .class-title { display: flex; align-items: center; gap: 0.75rem; }
        .class-title h3 { margin: 0; font-size: 1.125rem; font-weight: 700; }
        .icon-box { background: #eef2ff; color: var(--primary); padding: 0.5rem; border-radius: 8px; }

        .section-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .sections-list {
          display: flex;
          gap: 0.5rem;
        }

        .section-chip {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .section-chip:hover { border-color: var(--primary); color: var(--primary); }
        .section-chip.active { background: var(--primary); color: white; border-color: var(--primary); }

        .subjects-scroll {
          max-height: 180px;
          overflow-y: auto;
          padding-right: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          scrollbar-width: thin;
        }

        .subject-check-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
          font-size: 0.875rem;
        }

        .subject-check-item:hover { background: #f8fafc; }
        .subject-check-item input { accent-color: var(--primary); width: 16px; height: 16px; }

        .no-data { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem;
          gap: 1rem;
        }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8125rem; }
      `}</style>
    </div>
  );
};

export default ClassesPage;
