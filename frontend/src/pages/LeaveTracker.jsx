import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi } from '../utils/api';
import { Calendar, Send, History, AlertCircle, Loader2 } from 'lucide-react';

const LeaveTracker = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getMyLeaves();
      setLeaves(res.data);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to fetch your leave history.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await leaveApi.apply(formData);
      setFormData({
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
      });
      fetchMyLeaves();
    } catch (err) {
      console.error('Error applying for leave:', err);
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="leave-tracker-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Leave Tracker</h1>
          <p>View your balances and apply for time off.</p>
        </div>
      </header>

      <div className="balance-grid">
        <div className="balance-card casual">
          <div className="icon-box"><Calendar size={24} /></div>
          <div className="info">
            <h3>Casual Leaves</h3>
            <p className="count">{user?.leaveBalance?.casual || 0} <span className="total">/ {user?.leaveBalance?.totalCasual || 0}</span></p>
          </div>
        </div>
        <div className="balance-card sick">
          <div className="icon-box"><Calendar size={24} /></div>
          <div className="info">
            <h3>Sick Leaves</h3>
            <p className="count">{user?.leaveBalance?.sick || 0} <span className="total">/ {user?.leaveBalance?.totalSick || 0}</span></p>
          </div>
        </div>
        <div className="balance-card other">
          <div className="icon-box"><Calendar size={24} /></div>
          <div className="info">
            <h3>Other Leaves</h3>
            <p className="count">{user?.leaveBalance?.other || 0} <span className="total">/ {user?.leaveBalance?.totalOther || 0}</span></p>
          </div>
        </div>
        <div className="balance-card unpaid">
          <div className="icon-box"><Calendar size={24} /></div>
          <div className="info">
            <h3>Unpaid Leaves</h3>
            <p className="count">{user?.leaveBalance?.unpaid || 0} </p>
          </div>
        </div>
      </div>

      <div className="main-content-grid">
        {/* Apply Leave Form */}
        <section className="card apply-section">
          <div className="section-header">
            <Send size={20} className="text-primary" />
            <h2>Apply for Leave</h2>
          </div>
          <form onSubmit={handleApply}>
            {error && (
              <div className="error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            <div className="form-group">
              <label>Leave Category</label>
              <select 
                className="form-input"
                value={formData.leaveType}
                onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                required
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Other Leave">Other Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={formData.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData(prev => ({
                      ...prev, 
                      startDate: newStart,
                      // If end date is now before start date, reset it
                      endDate: prev.endDate && prev.endDate < newStart ? newStart : prev.endDate
                    }));
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={formData.endDate}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea 
                className="form-input" 
                rows="4"
                placeholder="Please provide a brief reason..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
              ></textarea>
            </div>
            <button className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Request'}
            </button>
          </form>
        </section>

        {/* Leave History */}
        <section className="card history-section">
          <div className="section-header">
            <History size={20} className="text-primary" />
            <h2>My Leave History</h2>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin" size={24} />
              <p>Fetching history...</p>
            </div>
          ) : leaves.length > 0 ? (
            <div className="table-container scrollable">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>{leave.leaveType}</td>
                      <td>
                        <div className="date-range">
                          <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                          <span className="arrow">→</span>
                          <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No leave requests found.</p>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .leave-tracker-page { padding: 1rem; }
        .balance-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 1rem; 
          margin-bottom: 2rem; 
        }
        .balance-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #6366f1;
        }
        .balance-card.casual { border-left-color: #6366f1; }
        .balance-card.sick { border-left-color: #ef4444; }
        .balance-card.other { border-left-color: #f59e0b; }
        .balance-card.unpaid { border-left-color: #64748b; }
        
        .icon-box {
          background: #f1f5f9;
          padding: 0.75rem;
          border-radius: 12px;
          color: var(--primary);
        }
        .info h3 { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
        .info .count { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
        .info .total { font-size: 1rem; color: var(--text-secondary); font-weight: 500; }

        .main-content-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
        }
        
        .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .section-header h2 { font-size: 1.25rem; font-weight: 700; }

        .error-alert {
          background: #fef2f2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .date-range { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
        .arrow { color: var(--text-secondary); }
        .scrollable { max-height: 400px; overflow-y: auto; }
        
        .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
        .loading-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .main-content-grid { grid-template-columns: 1fr; }
          .balance-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .balance-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default LeaveTracker;
