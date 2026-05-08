import React, { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { studentApi, attendanceApi, staffApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(user?.role?.toLowerCase() === 'teacher');
  
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';
  
  const [className, setClassName] = useState('1');
  const [section, setSection] = useState('A');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [attendanceExists, setAttendanceExists] = useState(false);

  useEffect(() => {
    const role = user?.role?.toLowerCase();
    if (role === 'teacher' && user.staffId) {
      fetchTeacherClasses();
    } else {
      setLoadingClasses(false);
      // For Admins, ensure className is '1' if not already set
      if (isAdmin) setClassName('1');
    }
  }, [user, isAdmin]);

  const fetchTeacherClasses = async () => {
    try {
      const response = await staffApi.getById(user.staffId);
      const currentStaff = response.data;
      if (currentStaff && currentStaff.teachingSubjects) {
        const classes = [...new Set(currentStaff.teachingSubjects.flatMap(sub => sub.classes))];
        setTeacherClasses(classes);
        if (classes.length > 0) {
          setClassName(classes[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    if (!loadingClasses) {
      fetchStudents();
    }
  }, [className, section, date, loadingClasses]);

  const classOptions = isAdmin 
    ? Array.from({ length: 10 }, (_, i) => (i + 1).toString())
    : teacherClasses;

  const fetchStudents = async () => {
    if (loadingClasses) return;
    setLoading(true);
    setStudents([]);
    setAttendanceData({});
    try {
      const response = await studentApi.getForAttendance({ class: className, section, date });
      const studentList = response.data;
      setStudents(studentList);
      
      const initial = {};
      let exists = false;
      studentList.forEach(s => {
        initial[s._id] = s.attendanceStatus || 'Present';
        if (s.attendanceStatus) exists = true;
      });
      setAttendanceData(initial);
      setAttendanceExists(exists);
    } catch (err) {
      console.error('Error fetching students for attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendanceData).map(([studentId, status]) => ({
        studentId,
        status,
        date,
        class: className,
        section
      }));
      await attendanceApi.markBulk(records);
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setMessage({ type: 'error', text: 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Daily Attendance</h1>
          <p>Mark and track daily student attendance.</p>
        </div>
        <div className="header-actions">
           <button className="btn btn-primary" onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Attendance
          </button>
        </div>
      </header>

      {message && (
        <div className={`message-banner ${message.type}`}>
          <CheckCircle2 size={18} />
          {message.text}
        </div>
      )}

      <div className="attendance-filters card">
        <div className="form-group">
          <label className="form-label">Select Date</label>
          <div className="input-with-icon">
            <Calendar size={18} />
            <input 
              type="date" 
              className="form-input" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Class</label>
          <select className="form-input" value={className} onChange={(e) => setClassName(e.target.value)}>
            {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Section</label>
          <select className="form-input" value={section} onChange={(e) => setSection(e.target.value)}>
            {['A', 'B'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {!loading && students.length > 0 && !attendanceExists && (
        <div className="info-banner">
          <Calendar size={18} />
          <span>Attendance hasn't been marked for this date yet. You can mark and save it below.</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Fetching students...</p>
        </div>
      ) : students.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th className="center">Present</th>
                <th className="center">Absent</th>
                <th className="center">Late</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td><strong>{student.rollNumber}</strong></td>
                  <td>{student.firstName} {student.lastName}</td>
                  <td className="center">
                    <input 
                      type="radio" 
                      name={`attendance-${student._id}`} 
                      checked={attendanceData[student._id] === 'Present'}
                      onChange={() => handleStatusChange(student._id, 'Present')}
                    />
                  </td>
                  <td className="center">
                    <input 
                      type="radio" 
                      name={`attendance-${student._id}`} 
                      checked={attendanceData[student._id] === 'Absent'}
                      onChange={() => handleStatusChange(student._id, 'Absent')}
                    />
                  </td>
                  <td className="center">
                    <input 
                      type="radio" 
                      name={`attendance-${student._id}`} 
                      checked={attendanceData[student._id] === 'Late'}
                      onChange={() => handleStatusChange(student._id, 'Late')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">
          <p>No students found for Class {className}-{section}.</p>
        </div>
      )}

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .attendance-filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; }
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-with-icon svg { position: absolute; left: 0.75rem; color: var(--text-secondary); }
        .input-with-icon input { padding-left: 2.5rem; }
        .form-group { margin-bottom: 0; }
        .center { text-align: center; }
        
        table input[type="radio"] { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: var(--primary); }
        
        .message-banner { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem; font-weight: 500; }
        .message-banner.success { background: #dcfce7; color: #166534; }
        .message-banner.error { background: #fee2e2; color: #991b1b; }
        
        .info-banner { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #eff6ff; color: #1e40af; border-radius: var(--radius); margin-bottom: 1.5rem; font-weight: 500; border: 1px solid #bfdbfe; }
        
        .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
      `}</style>
    </div>
  );
};

export default Attendance;
