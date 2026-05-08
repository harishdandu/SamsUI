import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, Filter, Loader2, Edit, Trash2 } from 'lucide-react';
import { studentApi } from '../utils/api';
import StudentModal from '../components/StudentModal';
import { useAuth } from '../context/AuthContext';

const Students = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit, setLimit] = useState(10);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents(1); // Reset to page 1 on search
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents(currentPage);
  }, [currentPage, limit]);

  const fetchStudents = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await studentApi.getAll({ 
        page, 
        limit,
        search: searchTerm 
      });
      
      const { students: studentList, total, totalPages: pages } = response.data;
      setStudents(studentList || []);
      setTotalStudents(total || 0);
      setTotalPages(pages || 1);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      setError('Failed to fetch students. Please make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async (formData) => {
    if (!isAdmin) return;
    try {
      if (selectedStudent) {
        await studentApi.update(selectedStudent._id, formData);
      } else {
        await studentApi.create(formData);
      }
      await fetchStudents(currentPage);
    } catch (err) {
      console.error('Error saving student:', err);
      throw err;
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentApi.delete(id);
        await fetchStudents(currentPage);
      } catch (err) {
        console.error('Error deleting student:', err);
      }
    }
  };

  const openAddModal = () => {
    if (!isAdmin) return;
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    if (!isAdmin) return;
    setSelectedStudent(student);
    setIsModalOpen(true);
    setActionMenuId(null);
  };

  return (
    <div className="students-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Students</h1>
          <p>Manage your student lifecycle and records. Total: {totalStudents}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={18} />
            Add Student
          </button>
        )}
      </header>

      <div className="table-actions card">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name or roll number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="limit-selector">
          <span>Rows per page:</span>
          <select 
            value={limit} 
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading && students.length === 0 ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading students...</p>
        </div>
      ) : error ? (
        <div className="error-state card">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchStudents(1)}>Retry</button>
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
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id}>
                    <td><strong>{student.rollNumber}</strong></td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.class} - {student.section}</td>
                    <td>
                      <span className={`badge badge-${student.status === 'Active' ? 'success' : 'warning'}`}>
                        {student.status}
                      </span>
                    </td>
                    {isAdmin && (
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
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-secondary" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <div className="page-info">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>
              <button 
                className="btn btn-secondary" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
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

        .limit-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .limit-selector select {
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: white;
          color: var(--text-primary);
          cursor: pointer;
          outline: none;
          transition: var(--transition);
        }
        .limit-selector select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

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

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 1.5rem;
          border-top: 1px solid var(--border);
          background: #f8fafc;
        }
        .page-info {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .page-info strong {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default Students;
