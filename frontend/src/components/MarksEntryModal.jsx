import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subjectApi, staffApi, examMarkApi } from '../utils/api';
import toast from 'react-hot-toast';

const MarksEntryModal = ({ isOpen, onClose, student, mark = null, onSave }) => {
  const { user } = useAuth();
  const [testName, setTestName] = useState('Slip Test1');
  const [totalMarks, setTotalMarks] = useState(100);
  const [marksObtained, setMarksObtained] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSubjects, setFetchingSubjects] = useState(false);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';
  const isTeacher = user?.role?.toLowerCase() === 'teacher';
  const isEdit = !!mark;
  const isTeacherEdit = isEdit && isTeacher;

  const testOptions = [
    'Slip Test1',
    'Slip Test2',
    'Slip Test3',
    'Unit Test1',
    'Unit Test2',
    'Unit Test3',
    'Quarterly',
    'Half Yearly',
    'Annual'
  ];

  useEffect(() => {
    if (!isOpen || !user) return;

    const resetForm = () => {
      setTestName('Slip Test1');
      setTotalMarks(100);
      setMarksObtained('');
      setExamDate(new Date().toISOString().split('T')[0]);
      setSubjectName('');
      setSubjectsList([]);
    };

    if (isEdit && mark) {
      setTestName(mark.testName || 'Slip Test1');
      setTotalMarks(mark.totalMarks || 100);
      setMarksObtained(mark.marksObtained ?? '');
      setSubjectName(mark.subjectName || '');
      setExamDate(mark.examDate ? new Date(mark.examDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setFetchingSubjects(false);
      return;
    }

    resetForm();

    if (isTeacher) {
      if (user.staffId) {
        setFetchingSubjects(true);
        staffApi.getById(user.staffId)
          .then(res => {
            const teachingSubs = res.data.teachingSubjects || [];
            if (teachingSubs.length > 0 && teachingSubs[0].subjectId) {
              setSubjectName(teachingSubs[0].subjectId.name || '');
            }
          })
          .catch(err => {
            console.error('Error fetching teacher subjects:', err);
            toast.error('Failed to load assigned subjects.');
          })
          .finally(() => {
            setFetchingSubjects(false);
          });
      }
    } else {
      setFetchingSubjects(true);
      subjectApi.getAll({ schoolId: user.schoolId })
        .then(res => {
          const list = res.data || [];
          setSubjectsList(list);
          if (list.length > 0) {
            setSubjectName(list[0].name || '');
          }
        })
        .catch(err => {
          console.error('Error fetching subjects:', err);
          toast.error('Failed to load school subjects.');
        })
        .finally(() => {
          setFetchingSubjects(false);
        });
    }
  }, [isOpen, user, isEdit, mark]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student) return;

    const obtainedNum = Number(marksObtained);
    const totalNum = Number(totalMarks);

    if (obtainedNum < 0 || totalNum <= 0) {
      toast.error('Marks must be greater than or equal to 0.');
      return;
    }

    if (obtainedNum > totalNum) {
      toast.error('Marks obtained cannot exceed total marks.');
      return;
    }

    if (!subjectName) {
      toast.error('Please select or specify a subject name.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        studentId: student._id,
        className: student.class,
        testName,
        totalMarks: totalNum,
        marksObtained: obtainedNum,
        subjectName,
        examDate
      };
      if (isTeacherEdit) {
        payload.testName = undefined;
        payload.totalMarks = undefined;
        payload.subjectName = undefined;
        payload.examDate = undefined;
      }

      if (isEdit && mark && mark._id) {
        await examMarkApi.update(mark._id, payload);
        toast.success('Exam marks updated successfully!');
      } else {
        await examMarkApi.create(payload);
        toast.success('Exam marks saved successfully!');
      }

      onSave?.();
      onClose();
    } catch (err) {
      console.error('Error saving exam marks:', err);
      toast.error(err.response?.data?.message || 'Failed to save exam marks.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="modal-header">
          <h2>Marks Entry - {student ? `${student.firstName} ${student.lastName}` : 'Student'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="student-badge card">
          <p>
            <strong>Roll No:</strong> {student?.rollNumber} &nbsp;|&nbsp; 
            <strong>Class:</strong> {student?.class} - Section {student?.section}
          </p>
        </div>

        {fetchingSubjects ? (
          <div className="loading-container">
            <Loader2 className="animate-spin" size={32} />
            <p>Loading subjects...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Test Name</label>
                <select
                  className="form-input"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  required
                  disabled={isTeacherEdit}
                >
                  {testOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject Name</label>
                {(isTeacher && !isEdit) ? (
                  <input
                    type="text"
                    className="form-input"
                    value={subjectName}
                    disabled
                    required
                  />
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    required
                    placeholder="Enter subject name"
                    disabled={isTeacherEdit}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input
                  type="number"
                  className="form-input"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  min={1}
                  required
                  disabled={isTeacherEdit}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Marks Obtained</label>
                <input
                  type="number"
                  className="form-input"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(e.target.value)}
                  min={0}
                  max={totalMarks}
                  required
                  placeholder="e.g. 85"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Exam Conducted Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  disabled={isTeacherEdit}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isEdit ? 'Save Changes' : 'Submit Marks'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 2rem;
          box-shadow: var(--shadow-lg);
          position: relative;
          background: white;
          border-radius: 1rem;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }
        .close-btn {
          color: var(--text-secondary);
          transition: var(--transition);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          color: var(--danger);
        }
        .student-badge {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .student-badge p {
          margin: 0;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--text-secondary);
        }
        .loading-container p {
          margin-top: 0.5rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .full-width {
          grid-column: span 2;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MarksEntryModal;
