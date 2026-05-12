import React, { useState, useEffect } from 'react';
import { Search, BookPlus, Edit, Trash2, Loader2, Book } from 'lucide-react';
import { subjectApi } from '../utils/api';
import SubjectModal from '../components/SubjectModal';
import { useAuth } from '../context/AuthContext';

const Subjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await subjectApi.getAll({ schoolId: user?.schoolId });
      setSubjects(res.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    setSelectedSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectApi.delete(id);
        fetchSubjects();
      } catch (err) {
        console.error('Error deleting subject:', err);
      }
    }
  };

  const handleSaveSubject = async (formData) => {
    try {
      if (selectedSubject) {
        await subjectApi.update(selectedSubject._id, formData);
      } else {
        await subjectApi.create(formData);
      }
      fetchSubjects();
    } catch (err) {
      console.error('Error saving subject:', err);
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="subjects-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Subject Management</h1>
          <p>Define subjects and map them to classes (1-10).</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddSubject}>
          <BookPlus size={18} /> Add Subject
        </button>
      </header>

      <div className="table-actions card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by subject name or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading subjects...</p>
        </div>
      ) : (
        <div className="subjects-grid">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((s) => (
              <div key={s._id} className="card subject-card">
                <div className="subject-icon"><Book size={24} /></div>
                <div className="subject-content">
                  <div className="subject-header">
                    <h3>{s.name}</h3>
                    <span className="subject-code">{s.code || 'No Code'}</span>
                  </div>
                  <div className="classes-tags">
                    {s.classes.map(c => <span key={c} className="class-tag">Class {c}</span>)}
                  </div>
                  {s.description && <p className="subject-desc">{s.description}</p>}
                </div>
                <div className="subject-actions">
                  <button className="btn-icon" title="Edit" onClick={() => handleEditSubject(s)}><Edit size={18} /></button>
                  <button className="btn-icon delete" title="Delete" onClick={() => handleDeleteSubject(s._id)}><Trash2 size={18} /></button>
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
        
        .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .subject-card { display: flex; gap: 1.25rem; padding: 1.5rem; position: relative; }
        .subject-icon { width: 48px; height: 48px; background: #eef2ff; color: var(--primary); display: flex; align-items: center; justify-content: center; border-radius: 12px; flex-shrink: 0; }
        .subject-content { flex: 1; }
        .subject-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .subject-header h3 { font-size: 1.125rem; font-weight: 700; margin: 0; }
        .subject-code { font-size: 0.75rem; color: var(--text-secondary); background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px; }
        
        .classes-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.75rem; }
        .class-tag { font-size: 0.75rem; color: var(--primary); background: #eef2ff; padding: 0.25rem 0.625rem; border-radius: 999px; font-weight: 500; }
        .subject-desc { font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
        
        .subject-actions { position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.25rem; opacity: 0; transition: var(--transition); }
        .subject-card:hover .subject-actions { opacity: 1; }
        .btn-icon { padding: 0.5rem; border-radius: var(--radius); transition: var(--transition); color: var(--text-secondary); border: none; background: none; cursor: pointer; }
        .btn-icon:hover { background: #f1f5f9; color: var(--primary); }
        .btn-icon.delete:hover { background: #fef2f2; color: var(--danger); }
        
        .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Subjects;
