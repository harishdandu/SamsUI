import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, Filter, Loader2, Edit, Trash2, Upload, ClipboardList, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { studentApi, classApi, staffApi } from '../utils/api';
import StudentModal from '../components/StudentModal';
import BulkUploadModal from '../components/BulkUploadModal';
import MarksEntryModal from '../components/MarksEntryModal';
import { useAuth } from '../context/AuthContext';

const Students = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  
  // Filtering States
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [classesConfig, setClassesConfig] = useState([]);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit, setLimit] = useState(10);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';
  const isTeacher = user?.role?.toLowerCase() === 'teacher';
  const canEditDelete = isAdmin || isTeacher;

  // Load class configurations and filters on user mount
  useEffect(() => {
    if (user) {
      fetchFiltersData();
    }
  }, [user]);

  const fetchFiltersData = async () => {
    try {
      const classRes = await classApi.getAll({ schoolId: user?.schoolId });
      const configs = classRes.data || [];
      setClassesConfig(configs);

      const userRole = user?.role?.toLowerCase();

      if (userRole === 'teacher' && user?.staffId) {
        // Teacher logic: show only the classes which are assigned to that teacher
        const staffRes = await staffApi.getById(user.staffId);
        const teachingSubs = staffRes.data.teachingSubjects || [];
        const teacherClassNames = [...new Set(teachingSubs.flatMap(ts => ts.classes))];
        setClassesList(teacherClassNames);

        // Smart Defaulting for Teacher
        if (teacherClassNames.length > 0) {
          const defClass = teacherClassNames[0];
          setSelectedClass(defClass);
          
          const classObj = configs.find(c => c.name === defClass);
          if (classObj && classObj.sections && classObj.sections.length > 0) {
            setSelectedSection(classObj.sections[0]);
          }
        }
      } else {
        // Admin or Super Admin logic: classes 1 to 10
        const adminClasses = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
        setClassesList(adminClasses);

        // Smart Defaulting for Admin/Super Admin (Default to Class 1, Section A or first section of Class 1)
        setSelectedClass('1');
        const classObj = configs.find(c => c.name === '1');
        if (classObj && classObj.sections && classObj.sections.length > 0) {
          setSelectedSection(classObj.sections[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching filter data:', err);
    } finally {
      setFiltersInitialized(true);
    }
  };

  // Populate sections when selected class changes
  useEffect(() => {
    if (selectedClass) {
      const classObj = classesConfig.find(c => c.name === selectedClass);
      if (classObj) {
        setSectionsList(classObj.sections || []);
      } else {
        setSectionsList([]);
      }
    } else {
      setSectionsList([]);
    }
  }, [selectedClass, classesConfig]);

  // Single debounced hook for search, page, limit, and class/section filters
  useEffect(() => {
    if (!filtersInitialized) return;

    const delayDebounceFn = setTimeout(() => {
      fetchStudents(currentPage);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, limit, searchTerm, selectedClass, selectedSection, filtersInitialized]);

  const fetchStudents = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await studentApi.getAll({ 
        page, 
        limit,
        search: searchTerm,
        schoolId: user?.schoolId,
        class: selectedClass || undefined,
        section: selectedSection || undefined
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
    if (!canEditDelete) return;
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

  const handleBulkUpload = async (studentsData) => {
    if (!canEditDelete) return;
    try {
      await studentApi.bulkRegister(studentsData);
      await fetchStudents(1); // Refresh list
    } catch (err) {
      console.error('Error during bulk upload:', err);
      throw err;
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!canEditDelete) return;
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      background: '#ffffff',
      customClass: {
        popup: 'swal2-premium-popup'
      }
    });

    if (result.isConfirmed) {
      try {
        await studentApi.delete(id);
        await fetchStudents(currentPage);
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Student record has been successfully deleted.',
          icon: 'success',
          confirmButtonColor: '#6366f1',
          timer: 1500
        });
      } catch (err) {
        console.error('Error deleting student:', err);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete the student. Please try again.',
          icon: 'error',
          confirmButtonColor: '#6366f1'
        });
      }
    }
  };

  const handleClassChange = (val) => {
    setSelectedClass(val);
    setSelectedSection('');
    setCurrentPage(1);
  };

  const handleSectionChange = (val) => {
    setSelectedSection(val);
    setCurrentPage(1);
  };

  const openAddModal = () => {
    if (!canEditDelete) return;
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    if (!canEditDelete) return;
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
        {canEditDelete && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setIsBulkModalOpen(true)}>
              <Upload size={18} />
              Bulk Register
            </button>
            <button className="btn btn-primary" onClick={openAddModal}>
              <UserPlus size={18} />
              Add Student
            </button>
          </div>
        )}
      </header>

      <div className="table-actions card">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name or roll number..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-dropdowns">
          <select 
            value={selectedClass} 
            onChange={(e) => handleClassChange(e.target.value)}
            className="filter-select"
          >
            {!isTeacher && <option value="">All Classes</option>}
            {classesList.map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>

          <select 
            value={selectedSection} 
            onChange={(e) => handleSectionChange(e.target.value)}
            className="filter-select"
            disabled={!selectedClass}
          >
            {!isTeacher && <option value="">All Sections</option>}
            {sectionsList.map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
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
                {canEditDelete && <th>Action</th>}
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
                    {canEditDelete && (
                      <td className="action-cell">
                        <button 
                          className="btn-icon" 
                          onClick={() => navigate(`/student-profile/${student._id}`)}
                          title="View Profile"
                        >
                          <Eye size={18} color="var(--text-secondary)" />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => setActionMenuId(actionMenuId === student._id ? null : student._id)}
                        >
                          <MoreVertical size={18} color="var(--text-secondary)" />
                        </button>
                        {actionMenuId === student._id && (
                          <div className="action-menu card">
                            <button onClick={() => {
                              setSelectedStudent(student);
                              setIsMarksModalOpen(true);
                              setActionMenuId(null);
                            }}>
                              <ClipboardList size={16} /> Marks Entry
                            </button>
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
                  <td colSpan={canEditDelete ? 5 : 4} style={{ textAlign: 'center', padding: '2rem' }}>
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

      <BulkUploadModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onUploadComplete={handleBulkUpload}
      />

      <MarksEntryModal
        isOpen={isMarksModalOpen}
        onClose={() => setIsMarksModalOpen(false)}
        student={selectedStudent}
      />

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .header-actions {
          display: flex;
          gap: 1rem;
        }
        .header-left h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem; }
        .header-left p { color: var(--text-secondary); }
        
        .table-actions {
          display: flex; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;
        }
        
        .filter-dropdowns {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        
        .filter-select {
          padding: 0.45rem 1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: white;
          color: var(--text-primary);
          cursor: pointer;
          outline: none;
          font-family: inherit;
          font-size: 0.875rem;
          transition: var(--transition);
          min-width: 140px;
          font-weight: 500;
        }
        
        .filter-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .filter-select:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
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

        .action-cell { 
          position: relative; 
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
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
