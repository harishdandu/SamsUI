import React, { useState, useEffect } from 'react';
import { leaveApi, staffApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Check, X, Clock, Loader2, User, FileText, Calendar, Wallet } from 'lucide-react';

const AdminLeaveTracker = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'balances'

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const res = await leaveApi.getAll();
        // Only show pending leaves
        setLeaves(res.data.filter(l => l.status === 'Pending'));
      } else {
        const res = await staffApi.getAll({ schoolId: user?.schoolId });
        setStaffList(res.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      setActioning(id);
      await leaveApi.updateStatus(id, { 
        status, 
        adminRemarks: remarks[id] || '' 
      });
      fetchData();
    } catch (err) {
      console.error('Error updating leave status:', err);
      alert(err.response?.data?.message || 'Failed to update leave status.');
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="admin-leaves-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Leave Management</h1>
          <p>Review requests and monitor employee leave entitlements.</p>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={18} />
          Pending Requests ({leaves.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          <Wallet size={18} />
          Staff Balances
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>Loading {activeTab}...</p>
        </div>
      ) : activeTab === 'pending' ? (
        leaves.length > 0 ? (
          <div className="request-list">
            {leaves.map((leave) => (
              <div key={leave._id} className="request-card card">
                <div className="card-top">
                  <div className="staff-info">
                    <div className="avatar">
                      <User size={20} />
                    </div>
                    <div>
                      <h3>{leave.staffId?.firstName} {leave.staffId?.lastName}</h3>
                      <p>{leave.staffId?.employeeId} • {leave.staffId?.role}</p>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="detail-item">
                    <Calendar size={18} className="text-secondary" />
                    <span>
                      <strong>{new Date(leave.startDate).toLocaleDateString()}</strong> to <strong>{new Date(leave.endDate).toLocaleDateString()}</strong>
                    </span>
                  </div>
                  <div className="detail-item">
                    <FileText size={18} className="text-secondary" />
                    <span><strong>Type:</strong> {leave.leaveType}</span>
                  </div>
                  <div className="reason-box">
                    <strong>Reason:</strong>
                    <p>{leave.reason}</p>
                  </div>
                </div>

                <div className="card-actions">
                  <input 
                    type="text" 
                    placeholder="Add remarks (optional)..." 
                    className="form-input"
                    value={remarks[leave._id] || ''}
                    onChange={(e) => setRemarks({...remarks, [leave._id]: e.target.value})}
                  />
                  <div className="btn-group">
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleAction(leave._id, 'Rejected')}
                      disabled={actioning === leave._id}
                    >
                      <X size={18} /> Reject
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleAction(leave._id, 'Approved')}
                      disabled={actioning === leave._id}
                    >
                      {actioning === leave._id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <Check size={48} className="text-success" />
            <p>All caught up! No pending leave requests.</p>
          </div>
        )
      ) : (
        <div className="card balances-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Casual</th>
                  <th>Sick</th>
                  <th>Other</th>
                  <th>Unpaid</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff._id}>
                    <td>
                      <div className="staff-cell">
                        <strong>{staff.firstName} {staff.lastName}</strong>
                        <span>{staff.employeeId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="balance-badge casual">
                        {staff.casualLeaves || 0} / {staff.totalCasualLeaves || 0}
                      </div>
                    </td>
                    <td>
                      <div className="balance-badge sick">
                        {staff.sickLeaves || 0} / {staff.totalSickLeaves || 0}
                      </div>
                    </td>
                    <td>
                      <div className="balance-badge other">
                        {staff.otherLeaves || 0} / {staff.totalOtherLeaves || 0}
                      </div>
                    </td>
                    <td>
                      <div className="balance-badge unpaid">
                        {staff.unpaidLeaves || 0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .admin-leaves-page { padding: 1rem; }
        .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: none; border: none; color: var(--text-secondary); font-weight: 600; cursor: pointer; transition: all 0.2s; border-radius: var(--radius); }
        .tab-btn:hover { color: var(--primary); background: #f1f5f9; }
        .tab-btn.active { color: var(--primary); background: #eef2ff; border-bottom: 2px solid var(--primary); border-radius: var(--radius) var(--radius) 0 0; }

        .request-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .request-card { padding: 1.5rem; border-left: 4px solid var(--warning); }
        
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .staff-info { display: flex; align-items: center; gap: 1rem; }
        .avatar { background: #f1f5f9; padding: 0.75rem; border-radius: 50%; color: var(--primary); }
        
        .card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .detail-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9375rem; }
        .reason-box { grid-column: span 2; background: #f8fafc; padding: 1rem; border-radius: var(--radius); }
        .reason-box p { margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }

        .card-actions { border-top: 1px solid var(--border); padding-top: 1.5rem; display: flex; gap: 1rem; align-items: center; }
        .card-actions .form-input { flex: 1; margin-bottom: 0; }
        .btn-group { display: flex; gap: 0.75rem; }
        
        .balances-card { padding: 0; overflow: hidden; }
        .staff-cell { display: flex; flex-direction: column; }
        .staff-cell span { font-size: 0.75rem; color: var(--text-secondary); }
        
        .balance-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 700; font-size: 0.875rem; min-width: 40px; text-align: center; }
        .balance-badge.casual { background: #eef2ff; color: #4f46e5; }
        .balance-badge.sick { background: #fef2f2; color: #ef4444; }
        .balance-badge.other { background: #fffbeb; color: #f59e0b; }
        .balance-badge.unpaid { background: #f8fafc; color: #64748b; }

        .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 5rem; gap: 1.5rem; color: var(--text-secondary); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .card-body { grid-template-columns: 1fr; }
          .reason-box { grid-column: span 1; }
          .card-actions { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  );
};

export default AdminLeaveTracker;
