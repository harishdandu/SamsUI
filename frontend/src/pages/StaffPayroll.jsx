import React, { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, CheckCircle2, Search, Users, History, Banknote } from 'lucide-react';
import { staffApi, staffAttendanceApi } from '../utils/api';

import PayrollModal from '../components/PayrollModal';

const StaffPayroll = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenPayroll = (member) => {
    setSelectedStaff(member);
    setIsPayrollModalOpen(true);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getAll();
      setStaff(res.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setMessage({ type: 'error', text: 'Failed to load staff records.' });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="staff-payroll-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Staff Payroll</h1>
          <p>Manage and track staff salary and payroll records.</p>
        </div>
      </header>

      {message && <div className={`message-banner ${message.type}`}><CheckCircle2 size={18} />{message.text}</div>}

      

      {loading ? <div className="loading-state"><Loader2 className="animate-spin" /></div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Base Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.employeeId}</strong></td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.role}</td>
                  <td>${s.salary || 0}</td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenPayroll(s)}
                    >
                      <Banknote size={16} />
                      Payroll
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PayrollModal 
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        staff={selectedStaff}
      />

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .attendance-filters { display: flex; gap: 1.5rem; align-items: flex-end; margin-bottom: 1.5rem; padding: 1.5rem; }
        .center { text-align: center; }
        .message-banner { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem; font-weight: 500; }
        .message-banner.success { background: #dcfce7; color: #166534; }
        .message-banner.error { background: #fee2e2; color: #991b1b; }
        
        .info-banner { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #eff6ff; color: #1e40af; border-radius: var(--radius); margin-bottom: 1.5rem; font-weight: 500; border: 1px solid #bfdbfe; }
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-with-icon svg { position: absolute; left: 0.75rem; color: var(--text-secondary); }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef9c3; color: #854d0e; }
      `}</style>
    </div>
  );
};

export default StaffPayroll;
