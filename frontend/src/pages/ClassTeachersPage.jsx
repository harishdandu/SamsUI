import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Search, 
  Filter, 
  X, 
  ShieldAlert,
  Award
} from 'lucide-react';
import { classApi, classTeacherApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ClassTeachersPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);
  const [eligibleTeachers, setEligibleTeachers] = useState([]);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'assigned', 'unassigned', ''

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null); // { _id, name, sections }
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, teacherRes] = await Promise.all([
        classApi.getAll({ schoolId: user?.schoolId }),
        classTeacherApi.getAll({ schoolId: user?.schoolId })
      ]);
      setClasses(classRes.data);
      setClassTeachers(teacherRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load class teacher data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = async (cls, section) => {
    if (!isAdmin) return;
    
    setSelectedClass(cls);
    setSelectedSection(section);
    setIsModalOpen(true);
    setLoadingEligible(true);
    setSelectedTeacherId('');
    setCurrentAssignmentId(null);

    // Find if there is an existing class teacher for this class & section
    const existing = classTeachers.find(
      ct => ct.classId?._id === cls._id && ct.section === section
    );
    if (existing) {
      setSelectedTeacherId(existing.teacherId?._id || '');
      setCurrentAssignmentId(existing._id);
    }

    try {
      const eligibleRes = await classTeacherApi.getEligible({ classId: cls._id });
      setEligibleTeachers(eligibleRes.data);
    } catch (err) {
      console.error('Error fetching eligible teachers:', err);
      toast.error('Failed to load eligible teachers.');
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!selectedTeacherId) {
      toast.error('Please select a teacher.');
      return;
    }

    // Double check if selected teacher is already assigned elsewhere (extra client safeguard)
    const selectedEligible = eligibleTeachers.find(t => t._id === selectedTeacherId);
    if (selectedEligible?.isAlreadyClassTeacher && selectedEligible._id !== classTeachers.find(ct => ct._id === currentAssignmentId)?.teacherId?._id) {
      toast.error(`Teacher is already a class teacher for Class ${selectedEligible.assignedClass} Section ${selectedEligible.assignedSection}.`);
      return;
    }

    try {
      setSaving(true);
      const res = await classTeacherApi.assign({
        classId: selectedClass._id,
        section: selectedSection,
        teacherId: selectedTeacherId
      });
      
      toast.success(`Class Teacher configured successfully for Class ${selectedClass.name} Section ${selectedSection}!`);
      
      // Update local state instead of refetching everything
      setClassTeachers(prev => {
        const filtered = prev.filter(ct => !(ct.classId?._id === selectedClass._id && ct.section === selectedSection));
        return [...filtered, res.data];
      });
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error assigning class teacher:', err);
      const errMsg = err.response?.data?.message || 'Failed to save configuration.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (assignmentId, className, sectionName) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to remove the Class Teacher for Class ${className} Section ${sectionName}?`)) {
      try {
        setSaving(true);
        await classTeacherApi.unassign(assignmentId);
        toast.success(`Unassigned class teacher for Class ${className} Section ${sectionName}.`);
        setClassTeachers(prev => prev.filter(ct => ct._id !== assignmentId));
        if (isModalOpen) {
          setIsModalOpen(false);
        }
      } catch (err) {
        console.error('Error unassigning class teacher:', err);
        toast.error('Failed to unassign class teacher.');
      } finally {
        setSaving(false);
      }
    }
  };

  // Compile all sections with their configured teachers
  const allSectionsData = [];
  classes.forEach(cls => {
    if (cls.sections && Array.isArray(cls.sections)) {
      cls.sections.forEach(sec => {
        const assignment = classTeachers.find(
          ct => ct.classId?._id === cls._id && ct.section === sec
        );
        allSectionsData.push({
          classObj: cls,
          section: sec,
          assignment: assignment || null
        });
      });
    }
  });

  // Calculate statistics
  const totalSectionsCount = allSectionsData.length;
  const configuredTeachersCount = classTeachers.length;
  const unassignedSectionsCount = totalSectionsCount - configuredTeachersCount;

  // Filter sections
  const filteredSections = allSectionsData.filter(item => {
    const classMatch = !classFilter || item.classObj.name === classFilter;
    
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || 
      `class ${item.classObj.name}`.toLowerCase().includes(searchLower) ||
      `grade ${item.classObj.name}`.toLowerCase().includes(searchLower) ||
      item.section.toLowerCase().includes(searchLower) ||
      (item.assignment && (
        `${item.assignment.teacherId?.firstName} ${item.assignment.teacherId?.lastName}`.toLowerCase().includes(searchLower) ||
        item.assignment.teacherId?.employeeId?.toLowerCase().includes(searchLower) ||
        item.assignment.teacherId?.email?.toLowerCase().includes(searchLower)
      ));

    let statusMatch = true;
    if (statusFilter === 'assigned') {
      statusMatch = !!item.assignment;
    } else if (statusFilter === 'unassigned') {
      statusMatch = !item.assignment;
    }

    return classMatch && searchMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p>Configuring Class Teacher Grid...</p>
      </div>
    );
  }

  return (
    <div className="class-teachers-page">
      <header className="page-header">
        <div className="header-left">
          <div className="badge-icon">
            <Award size={26} />
          </div>
          <div>
            <h1>Class Teacher Configuration</h1>
            <p>Assign and view the dedicated class teachers for institutional sections.</p>
          </div>
        </div>
      </header>

      {/* Metrics Banner */}
      <div className="metrics-banner">
        <div className="metric-card card shadow-sm">
          <div className="metric-icon blue">
            <Users size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Sections</span>
            <span className="metric-value">{totalSectionsCount}</span>
          </div>
        </div>

        <div className="metric-card card shadow-sm">
          <div className="metric-icon green">
            <UserCheck size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Assigned Teachers</span>
            <span className="metric-value">{configuredTeachersCount}</span>
          </div>
        </div>

        <div className="metric-card card shadow-sm">
          <div className="metric-icon orange">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Pending Sections</span>
            <span className="metric-value">{unassignedSectionsCount}</span>
          </div>
        </div>
      </div>

      {/* Filtering Control Bar */}
      <div className="table-actions card shadow-sm">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Class, Section, or Teacher details..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="select-wrapper">
            <Filter size={16} />
            <select 
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c.name}>Class {c.name}</option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <Filter size={16} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Pending Assignment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="sections-grid">
        {filteredSections.length > 0 ? (
          filteredSections.map((item, index) => {
            const hasTeacher = !!item.assignment;
            const teacher = item.assignment?.teacherId;
            const initials = teacher 
              ? `${teacher.firstName?.[0] || ''}${teacher.lastName?.[0] || ''}`.toUpperCase() 
              : '';

            return (
              <div 
                key={`${item.classObj._id}-${item.section}-${index}`} 
                className={`section-card card ${hasTeacher ? 'has-teacher' : 'no-teacher'}`}
              >
                <div className="card-top">
                  <div className="card-badge">
                    <span className="class-name">Class {item.classObj.name}</span>
                    <span className="section-name">Section {item.section}</span>
                  </div>
                  {hasTeacher && isAdmin && (
                    <div className="card-actions">
                      <button 
                        className="btn-icon-sm edit" 
                        onClick={() => handleOpenAssignModal(item.classObj, item.section)}
                        title="Edit Assignment"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn-icon-sm delete" 
                        onClick={() => handleUnassign(item.assignment._id, item.classObj.name, item.section)}
                        title="Remove Assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="card-bottom">
                  {hasTeacher ? (
                    <div className="teacher-info-block">
                      <div className="avatar-badge">
                        {initials}
                      </div>
                      <div className="teacher-text">
                        <h3>{teacher.firstName} {teacher.lastName}</h3>
                        <p className="emp-id">ID: {teacher.employeeId}</p>
                        <p className="email">{teacher.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="unassigned-block">
                      <div className="dashed-circle">
                        <Users size={20} className="text-secondary" />
                      </div>
                      <p>No Class Teacher Assigned</p>
                      {isAdmin ? (
                        <button 
                          className="btn btn-primary btn-sm assign-btn"
                          onClick={() => handleOpenAssignModal(item.classObj, item.section)}
                        >
                          <Plus size={14} />
                          <span>Assign Teacher</span>
                        </button>
                      ) : (
                        <span className="read-only-badge">Pending</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state card">
            <ShieldAlert size={40} className="text-secondary" />
            <h3>No sections found</h3>
            <p>Try resetting your search query or filters.</p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card shadow-xl">
            <div className="modal-header">
              <h2>Configure Class Teacher</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="selected-meta-badge">
              <span>Class <strong>{selectedClass?.name}</strong></span>
              <span>Section <strong>{selectedSection}</strong></span>
            </div>

            <form onSubmit={handleSaveAssignment}>
              <div className="form-group">
                <label className="form-label">Select Class Teacher</label>
                
                {loadingEligible ? (
                  <div className="modal-loader">
                    <Loader2 size={20} className="animate-spin text-primary" />
                    <span>Fetching eligible teachers assigned to this class...</span>
                  </div>
                ) : eligibleTeachers.length === 0 ? (
                  <div className="empty-teachers-warning">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>No eligible teachers found!</strong>
                      <p>To assign a teacher, please first assign teachers to Class "{selectedClass?.name}" inside Staff Management.</p>
                    </div>
                  </div>
                ) : (
                  <select 
                    className="form-input select-teacher-input"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an Assigned Teacher --</option>
                    {eligibleTeachers.map(teacher => {
                      // Check if already assigned elsewhere
                      // Allow selecting the teacher currently assigned to THIS specific section though!
                      const isAssignedElsewhere = teacher.isAlreadyClassTeacher && 
                        !(teacher.assignedClass === selectedClass?.name && teacher.assignedSection === selectedSection);

                      return (
                        <option 
                          key={teacher._id} 
                          value={teacher._id}
                          disabled={isAssignedElsewhere}
                        >
                          {teacher.firstName} {teacher.lastName} ({teacher.employeeId}) 
                          {isAssignedElsewhere ? ` - [Already Class Teacher for Class ${teacher.assignedClass} Sec ${teacher.assignedSection}]` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="modal-footer mt-4">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                {currentAssignmentId && (
                  <button 
                    type="button" 
                    className="btn btn-danger-outline"
                    onClick={() => handleUnassign(currentAssignmentId, selectedClass?.name, selectedSection)}
                    disabled={saving}
                  >
                    <Trash2 size={16} />
                    <span>Unassign</span>
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving || loadingEligible || eligibleTeachers.length === 0 || !selectedTeacherId}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .class-teachers-page {
          padding-top: 1rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .badge-icon {
          background: var(--primary);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-left h1 {
          font-size: 1.625rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .header-left p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
        }

        /* Metrics Banner */
        .metrics-banner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border);
          transition: var(--transition);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .metric-icon {
          padding: 0.75rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-icon.blue { background: #eff6ff; color: #2563eb; }
        .metric-icon.green { background: #f0fdf4; color: #16a34a; }
        .metric-icon.orange { background: #fff7ed; color: #ea580c; }

        .metric-details {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
          margin-top: 0.125rem;
        }

        /* Search & Filter Bar */
        .table-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border);
          align-items: center;
          justify-content: space-between;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #f8fafc;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          transition: var(--transition);
        }

        .search-box:focus-within {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-box input {
          border: none;
          background: none;
          outline: none;
          width: 100%;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .filter-group {
          display: flex;
          gap: 0.75rem;
        }

        .select-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .select-wrapper select {
          border: none;
          background: transparent;
          outline: none;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* Grid */
        .sections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .section-card {
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 1.5rem;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-height: 180px;
        }

        .section-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .section-card.has-teacher {
          border-left: 4px solid var(--primary);
        }

        .section-card.no-teacher {
          border-style: dashed;
          background: #fafafb;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-badge {
          display: flex;
          gap: 0.375rem;
          align-items: center;
        }

        .class-name {
          background: #eef2ff;
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .section-name {
          background: #f1f5f9;
          color: var(--text-primary);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .card-actions {
          display: flex;
          gap: 0.35rem;
        }

        .btn-icon-sm {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-icon-sm.edit:hover {
          background: #eef2ff;
          color: var(--primary);
          border-color: #e0e7ff;
        }

        .btn-icon-sm.delete:hover {
          background: #fef2f2;
          color: var(--danger);
          border-color: #fee2e2;
        }

        .teacher-info-block {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar-badge {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.125rem;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.15);
        }

        .teacher-text {
          flex: 1;
        }

        .teacher-text h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .teacher-text p {
          margin: 0;
          font-size: 0.75rem;
        }

        .teacher-text .emp-id {
          color: var(--text-secondary);
          font-weight: 600;
          margin-top: 0.125rem;
        }

        .teacher-text .email {
          color: #64748b;
          margin-top: 0.05rem;
          word-break: break-all;
        }

        .unassigned-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          flex: 1;
          gap: 0.5rem;
        }

        .dashed-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .unassigned-block p {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0;
        }

        .assign-btn {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          padding: 0.4rem 0.875rem;
          gap: 0.35rem;
        }

        .read-only-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #ea580c;
          background: #fff7ed;
          padding: 0.25rem 0.625rem;
          border-radius: 99px;
        }

        .empty-state {
          grid-column: 1 / -1;
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1rem;
        }

        .empty-state h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .empty-state p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
          max-width: 320px;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 20px;
          padding: 2rem;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0.25rem;
          border-radius: 6px;
          transition: var(--transition);
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: var(--text-primary);
        }

        .selected-meta-badge {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .selected-meta-badge span {
          background: #f1f5f9;
          color: var(--text-primary);
          font-size: 0.8125rem;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
        }

        .selected-meta-badge span strong {
          color: var(--primary);
        }

        .modal-loader {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
        }

        .empty-teachers-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: #fff7ed;
          border: 1px solid #ffedd5;
          color: #ea580c;
          border-radius: 10px;
        }

        .empty-teachers-warning strong {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.125rem;
        }

        .empty-teachers-warning p {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.4;
          color: #c2410c;
        }

        .select-teacher-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 2px solid #f1f5f9;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
          transition: var(--transition);
        }

        .select-teacher-input:focus {
          border-color: var(--primary-light);
        }

        .btn-danger-outline {
          background: transparent;
          border: 2px solid var(--danger);
          color: var(--danger);
          font-weight: 700;
          padding: 0.625rem 1.25rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-danger-outline:hover {
          background: var(--danger);
          color: white;
        }

        .mt-4 { margin-top: 1.5rem; }

        @media (max-width: 640px) {
          .table-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-group {
            flex-direction: column;
          }
          .modal-footer {
            flex-direction: column-reverse;
          }
          .modal-footer button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ClassTeachersPage;
