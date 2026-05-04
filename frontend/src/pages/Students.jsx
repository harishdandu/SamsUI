import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, Filter, Loader2, Edit, Trash2 } from 'lucide-react';
import { studentApi } from '../utils/api';
import StudentModal from '../components/StudentModal';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getAll();
      setStudents(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch students. Please make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async (formData) => {
    try {
      if (selectedStudent) {
        await studentApi.update(selectedStudent._id, formData);
      } else {
        await studentApi.create(formData);
      }
      await fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      throw err;
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentApi.delete(id);
        await fetchStudents();
      } catch (err) {
        console.error('Error deleting student:', err);
      }
    }
  };

  const openAddModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setActionMenuId(null);
  };

  const filteredStudents = students.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="students-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Students</h1>
          <p>Manage your student lifecycle and records.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <UserPlus size={18} />
          Add Student
        </button>
      </header>

      <div className="table-actions card">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" style={{ border: '1px solid var(--border)' }}>
          <Filter size={18} />
          Filter
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading students...</p>
        </div>
      ) : error ? (
        <div className="error-state card">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStudents}>Retry</button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td><strong>{student.rollNumber}</strong></td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.class} - {student.section}</td>
                    <td>
                      <span className={`badge badge-${student.status === 'Active' ? 'success' : 'warning'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button 
                        className="btn-icon" 
                        onClick={() => setActionMenuId(actionMenuId === student._id ? null : student._id)}
                      >
                        <MoreVertical size={18} color="var(--text-secondary)" />
                      </button>
                      {actionMenuId === student._id && (
                        <div className="action-menu card">
                          <button onClick={() => openEditModal(student)}>
                            <Edit size={16} /> Edit
                          </button>
                          <button className="delete" onClick={() => handleDeleteStudent(student._id)}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <StudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveStudent}
        student={selectedStudent}
      />

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .header-left h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem; }
        .header-left p { color: var(--text-secondary); }
        
        .table-actions {
          display: flex; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem;
        }
        
        .search-box {
          flex: 1; display: flex; align-items: center; gap: 0.75rem; background: #f1f5f9;
          padding: 0.5rem 1rem; border-radius: var(--radius); border: 1px solid transparent;
          transition: var(--transition);
        }
        
        .search-box:focus-within {
          background: white; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .search-box input { border: none; background: none; outline: none; width: 100%; font-family: inherit; }

        .loading-state, .error-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem; gap: 1rem;
        }

        .animate-spin { animation: spin 1s linear infinite; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .action-cell { position: relative; }
        .action-menu {
          position: absolute; right: 0; top: 100%; width: 140px; padding: 0.5rem;
          z-index: 10; display: flex; flex-direction: column; gap: 0.25rem;
        }
        .action-menu button {
          display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem;
          border-radius: var(--radius); font-size: 0.875rem; color: var(--text-primary);
          transition: var(--transition); text-align: left;
        }
        .action-menu button:hover { background: #f1f5f9; }
        .action-menu button.delete { color: var(--danger); }
        .action-menu button.delete:hover { background: #fef2f2; }

        .btn-icon {
          padding: 0.5rem; border-radius: var(--radius); transition: var(--transition);
        }
        .btn-icon:hover { background: #f1f5f9; }
      `}</style>
    </div>
  );
};

export default Students;
