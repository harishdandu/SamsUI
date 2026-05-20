import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Award, CreditCard, CalendarCheck, Loader2, Calendar, FileText, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { studentApi, examMarkApi } from '../utils/api';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [examMarks, setExamMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch student details
        const studentRes = await studentApi.getById(id);
        setStudent(studentRes.data);

        // Fetch exam marks
        const marksRes = await examMarkApi.getAll({ studentId: id });
        setExamMarks(marksRes.data || []);
      } catch (err) {
        console.error('Error fetching student profile:', err);
        toast.error('Failed to load student profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p>Loading student profile data...</p>
        <style>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 80vh;
            color: var(--text-secondary);
          }
          .loading-screen p { margin-top: 1rem; font-size: 1.1rem; }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="error-screen">
        <AlertTriangle size={48} color="var(--danger)" />
        <p>Student profile not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/students')}>
          Go Back to Students
        </button>
      </div>
    );
  }

  const feeStatus = student.fees?.status || 'Pending';
  const totalFees = student.fees?.amount || 0;
  const paidFees = student.fees?.paid || 0;
  const pendingFees = Math.max(0, totalFees - paidFees);
  const paidPercent = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-active';
      case 'inactive': return 'badge-inactive';
      default: return 'badge-alumni';
    }
  };

  const getFeeStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'fee-paid';
      case 'partial': return 'fee-partial';
      default: return 'fee-pending';
    }
  };

  return (
    <div className="student-profile-page">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate('/students')}>
          <ArrowLeft size={18} />
          Back to Students
        </button>
        <div className="header-meta">
          <h1>Student Profile</h1>
          <p>Detailed overview of student demographics, payments, and tests</p>
        </div>
      </header>

      <div className="profile-grid">
        {/* Basic Details Card */}
        <section className="profile-card basic-info-card card">
          <div className="card-header-icon">
            <User size={24} />
            <h2>Demographics & Identity</h2>
          </div>
          <div className="avatar-section">
            <div className="profile-avatar">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div className="avatar-meta">
              <h3>{student.firstName} {student.lastName}</h3>
              <span className={`badge ${getStatusBadgeClass(student.status)}`}>
                {student.status}
              </span>
            </div>
          </div>

          <div className="detail-list">
            <div className="detail-item">
              <span className="detail-label">Roll Number</span>
              <span className="detail-value font-mono">#{student.rollNumber}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Class & Section</span>
              <span className="detail-value font-semibold">Class {student.class} - {student.section}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Parent Name</span>
              <span className="detail-value">{student.parentName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Contact Phone</span>
              <span className="detail-value">
                <a href={`tel:${student.phoneNumber}`} className="tel-link">
                  <Phone size={14} /> {student.phoneNumber}
                </a>
              </span>
            </div>
          </div>
        </section>

        {/* Fees Summary Card */}
        <section className="profile-card fees-info-card card">
          <div className="card-header-icon">
            <CreditCard size={24} />
            <h2>Fee & Installments Summary</h2>
          </div>

          <div className="fee-progress-section">
            <div className="progress-stats">
              <div>
                <span className="stat-label">Tuition Progress</span>
                <span className="stat-value">{paidPercent}% Paid</span>
              </div>
              <span className={`fee-status-badge ${getFeeStatusClass(feeStatus)}`}>
                {feeStatus}
              </span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${paidPercent}%` }}></div>
            </div>
          </div>

          <div className="fee-breakdown font-mono">
            <div className="fee-row">
              <span>Total Assessed</span>
              <strong>₹{totalFees.toLocaleString('en-IN')}</strong>
            </div>
            <div className="fee-row text-success">
              <span>Total Paid</span>
              <strong>₹{paidFees.toLocaleString('en-IN')}</strong>
            </div>
            <div className="fee-row text-danger border-top">
              <span>Outstanding Bal</span>
              <strong>₹{pendingFees.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="fee-meta-info">
            <div className="meta-pair">
              <span>Payment Cycle:</span>
              <strong>{student.fees?.feeFrequency || 'Monthly'}</strong>
            </div>
            {student.fees?.tuitionStartDate && (
              <div className="meta-pair">
                <span>Start Date:</span>
                <strong>{new Date(student.fees.tuitionStartDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
              </div>
            )}
            {student.fees?.tuitionEndDate && (
              <div className="meta-pair">
                <span>End Date:</span>
                <strong>{new Date(student.fees.tuitionEndDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
              </div>
            )}
          </div>
        </section>

        {/* Exam Performance Section */}
        <section className="profile-card exam-marks-section card full-width">
          <div className="card-header-icon">
            <Award size={24} />
            <h2>Academic Performance & Test Scores</h2>
          </div>

          {examMarks.length === 0 ? (
            <div className="empty-scores">
              <FileText size={40} className="empty-icon" />
              <p>No recorded exam or test marks found for this student.</p>
            </div>
          ) : (
            <div className="scores-table-container">
              <table className="scores-table">
                <thead>
                  <tr>
                    <th>Exam / Test Name</th>
                    <th>Subject Name</th>
                    <th>Exam Date</th>
                    <th>Max Marks</th>
                    <th>Score Obtained</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {examMarks.map((mark) => {
                    const pct = Math.round((mark.marksObtained / mark.totalMarks) * 100);
                    let colorClass = 'pct-high';
                    if (pct < 40) colorClass = 'pct-low';
                    else if (pct < 75) colorClass = 'pct-mid';

                    return (
                      <tr key={mark._id}>
                        <td><strong>{mark.testName}</strong></td>
                        <td>{mark.subjectName}</td>
                        <td>
                          {new Date(mark.examDate).toLocaleDateString('en-IN', {
                            dateStyle: 'medium'
                          })}
                        </td>
                        <td>{mark.totalMarks}</td>
                        <td><strong>{mark.marksObtained}</strong></td>
                        <td>
                          <span className={`pct-tag ${colorClass}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .student-profile-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .profile-header {
          margin-bottom: 2.5rem;
        }
        
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0;
          font-weight: 600;
          margin-bottom: 1.25rem;
          transition: var(--transition);
        }
        .back-btn:hover {
          color: var(--primary);
        }
        
        .header-meta h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }
        .header-meta p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 1rem;
        }
        
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        
        .full-width {
          grid-column: span 2;
        }
        
        .profile-card {
          padding: 2.25rem;
          background: white;
          border-radius: 1rem;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        
        .card-header-icon {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--primary);
          margin-bottom: 1.75rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
        }
        
        .card-header-icon h2 {
          margin: 0;
          font-size: 1.35rem;
          color: var(--text-primary);
          font-weight: 700;
        }
        
        .avatar-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.75rem;
          background: #f8fafc;
          padding: 1.25rem;
          border-radius: 0.75rem;
          border: 1px solid #edf2f7;
        }
        
        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), #818cf8);
          color: white;
          font-size: 1.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
        }
        
        .avatar-meta h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.4rem;
          color: var(--text-primary);
          font-weight: 700;
        }
        
        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-inactive { background: #fee2e2; color: #991b1b; }
        .badge-alumni { background: #f1f5f9; color: #475569; }
        
        .detail-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .detail-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .detail-label {
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .detail-value {
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 600;
        }
        
        .tel-link {
          color: var(--primary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: var(--transition);
        }
        .tel-link:hover {
          text-decoration: underline;
        }
        
        .fee-progress-section {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid #edf2f7;
          margin-bottom: 1.75rem;
        }
        
        .progress-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .stat-value {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .fee-status-badge {
          padding: 0.35rem 0.875rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .fee-paid { background: #dcfce7; color: #166534; }
        .fee-partial { background: #fef9c3; color: #854d0e; }
        .fee-pending { background: #fee2e2; color: #991b1b; }
        
        .progress-bar-container {
          height: 10px;
          background: #e2e8f0;
          border-radius: 5px;
          overflow: hidden;
        }
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), #818cf8);
          border-radius: 5px;
          transition: width 1s ease-out;
        }
        
        .fee-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-bottom: 1.75rem;
          background: #fdfdfd;
          padding: 1.25rem;
          border-radius: 0.5rem;
          border: 1px solid #f1f5f9;
        }
        
        .fee-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        
        .border-top {
          border-top: 1px dashed var(--border);
          padding-top: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .text-success { color: #166534; }
        .text-danger { color: #991b1b; }
        
        .fee-meta-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .meta-pair {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }
        
        .meta-pair span {
          color: var(--text-secondary);
        }
        .meta-pair strong {
          color: var(--text-primary);
        }
        
        .empty-scores {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
          text-align: center;
        }
        
        .empty-icon {
          color: var(--border);
          margin-bottom: 1rem;
        }
        
        .scores-table-container {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
        }
        
        .scores-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        
        .scores-table th, .scores-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }
        
        .scores-table th {
          background: #f8fafc;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .scores-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .pct-tag {
          display: inline-block;
          padding: 0.25rem 0.65rem;
          border-radius: 0.25rem;
          font-weight: 700;
          font-size: 0.8rem;
        }
        
        .pct-high { background: #dcfce7; color: #166534; }
        .pct-mid { background: #fef9c3; color: #854d0e; }
        .pct-low { background: #fee2e2; color: #991b1b; }
        
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
          .full-width {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentProfile;
