import React, { useState, useEffect } from 'react';
import { Search, BookPlus, Edit, Trash2, Loader2, Book } from 'lucide-react';
import { classApi } from '../utils/api';
import SubjectModal from '../components/SubjectModal';
import { useAuth } from '../context/AuthContext';

const Subjects = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const availableClasses = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await classApi.getAll({ schoolId: user?.schoolId });
      setClasses(res.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique subjects from classes
  const getDerivedSubjects = () => {
    const subjectsMap = {};
    
    classes.forEach(cls => {
      if (cls.subjects && Array.isArray(cls.subjects)) {
        cls.subjects.forEach(subName => {
          if (!subjectsMap[subName]) {
            subjectsMap[subName] = {
              name: subName,
              classes: [],
              _id: subName // Use name as ID for derivation
            };
          }
          subjectsMap[subName].classes.push(cls.name);
        });
      }
    });

    return Object.values(subjectsMap);
  };

  const handleAddSubject = () => {
    setSelectedSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = async (subjectName) => {
    if (window.confirm(`Are you sure you want to remove "${subjectName}" from all classes?`)) {
      try {
        setSaving(true);
        // Remove this subject name from all classes
        const updatedConfigs = availableClasses.map(c => {
          const classData = classes.find(cls => cls.name === c);
          const currentSubjects = classData ? classData.subjects : [];
          const currentSections = classData ? classData.sections : [];
          
          return {
            name: c,
            sections: currentSections,
            subjects: currentSubjects.filter(s => s !== subjectName)
          };
        });

        await classApi.bulkUpdate({ configs: updatedConfigs, schoolId: user?.schoolId });
        fetchData();
      } catch (err) {
        console.error('Error deleting subject:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveSubject = async (formData) => {
    try {
      setSaving(true);
      const { name: newName, classes: selectedClasses } = formData;
      const oldName = selectedSubject?.name;

      // Map through all possible classes and update their subjects list
      const updatedConfigs = availableClasses.map(c => {
        const classData = classes.find(cls => cls.name === c);
        let currentSubjects = classData ? [...classData.subjects] : [];
        const currentSections = classData ? classData.sections : [];

        // 1. If we are editing, remove the old name first
        if (oldName) {
          currentSubjects = currentSubjects.filter(s => s !== oldName);
        }

        // 2. If this class is selected for the subject, add the (new) name
        if (selectedClasses.includes(c)) {
          if (!currentSubjects.includes(newName)) {
            currentSubjects.push(newName);
          }
        }

        return {
          name: c,
          sections: currentSections,
          subjects: currentSubjects
        };
      });

      await classApi.bulkUpdate({ configs: updatedConfigs, schoolId: user?.schoolId });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving subject:', err);
      alert('Failed to save subject configuration.');
    } finally {
      setSaving(false);
    }
  };

  const derivedSubjects = getDerivedSubjects();
  const filteredSubjects = derivedSubjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="subjects-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Subject Management</h1>
          <p>Define subjects and assign them to classes.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddSubject} disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <BookPlus size={18} />}
          {saving ? 'Processing...' : 'Add Subject'}
        </button>
      </header>

      <div className="table-actions card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by subject name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading subjects from class data...</p>
        </div>
      ) : (
        <div className="subjects-grid">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((s) => (
              <div key={s.name} className="card subject-card">
                <div className="subject-icon"><Book size={24} /></div>
                <div className="subject-content">
                  <div className="subject-header">
                    <h3>{s.name}</h3>
                  </div>
                  <div className="classes-tags">
                    {s.classes.sort((a,b) => parseInt(a) - parseInt(b)).map(c => (
                      <span key={c} className="class-tag">Class {c}</span>
                    ))}
                  </div>
                </div>
                <div className="subject-actions">
                  <button className="btn-icon" title="Edit" onClick={() => handleEditSubject(s)}><Edit size={18} /></button>
                  <button className="btn-icon delete" title="Delete" onClick={() => handleDeleteSubject(s.name)}><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
              <p>No subjects found. Click "Add Subject" to create one.</p>
            </div>
          )}
        </div>
      )}

      <SubjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveSubject} 
        subject={selectedSubject} 
      />

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .search-box { display: flex; align-items: center; gap: 0.75rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: var(--radius); }
        .search-box input { border: none; background: none; outline: none; width: 100%; font-family: inherit; }
        
        .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .subject-card { display: flex; gap: 1.25rem; padding: 1.5rem; position: relative; border: 1px solid var(--border); transition: var(--transition); }
        .subject-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); border-color: var(--primary); }
        .subject-icon { width: 48px; height: 48px; background: #eef2ff; color: var(--primary); display: flex; align-items: center; justify-content: center; border-radius: 12px; flex-shrink: 0; }
        .subject-content { flex: 1; }
        .subject-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .subject-header h3 { font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        
        .classes-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .class-tag { font-size: 0.75rem; color: var(--primary); background: #eef2ff; padding: 0.25rem 0.625rem; border-radius: 999px; font-weight: 600; }
        
        .subject-actions { position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.25rem; opacity: 0; transition: var(--transition); }
        .subject-card:hover .subject-actions { opacity: 1; }
        .btn-icon { padding: 0.5rem; border-radius: var(--radius); transition: var(--transition); color: var(--text-secondary); border: none; background: none; cursor: pointer; }
        .btn-icon:hover { background: #f1f5f9; color: var(--primary); }
        .btn-icon.delete:hover { background: #fef2f2; color: var(--danger); }
        
        .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; gap: 1rem; color: var(--text-secondary); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Subjects;
