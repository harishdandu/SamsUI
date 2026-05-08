import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, Banknote, AlertCircle, CheckCircle2 } from 'lucide-react';
import { leaveApi, payrollApi } from '../utils/api';

const PayrollModal = ({ isOpen, onClose, staff }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [months, setMonths] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [existingPayroll, setExistingPayroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      generateFinancialYearMonths();
      setMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMonth && staff) {
      fetchLeavesAndPayroll();
    }
  }, [selectedMonth, staff]);

  const fetchLeavesAndPayroll = async () => {
    setLoading(true);
    setExistingPayroll(null);
    try {
      const [m, y] = selectedMonth.split('-');
      
      // Fetch leaves
      const leaveRes = await leaveApi.getStaffMonthLeaves({
        staffId: staff._id,
        month: m,
        year: y
      });
      setLeaves(leaveRes.data);

      // Fetch existing payroll
      const payrollRes = await payrollApi.getMonthPayroll({
        staffId: staff._id,
        month: m,
        year: y
      });
      if (payrollRes.data) {
        setExistingPayroll(payrollRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const [m, y] = selectedMonth.split('-');
      const res = await payrollApi.generate({
        staffId: staff._id,
        baseSalary: staff.salary || 0,
        unpaidDays: unpaidDays,
        salaryDeduction: parseFloat(deduction.toFixed(2)),
        netSalary: parseFloat(netPayable.toFixed(2)),
        totalWorkingDays: workingDays,
        payrollMonth: parseInt(m),
        payrollYear: parseInt(y)
      });
      setExistingPayroll(res.data.payroll);
      setMessage({ type: 'success', text: 'Payroll generated successfully!' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate payroll.' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateFinancialYearMonths = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Financial year starts from April
    let startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    
    const financialMonths = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (i + 3) % 12;
      const year = i + 3 > 11 ? startYear + 1 : startYear;
      const date = new Date(year, monthIndex, 1);
      const label = date.toLocaleString('default', { month: 'short' }) + '/' + date.getFullYear().toString().slice(-2);
      const value = `${monthIndex}-${year}`;
      financialMonths.push({ label, value, month: monthIndex, year });
    }
    
    setMonths(financialMonths);
    
    // Default to current month if it's in the list
    const currentVal = `${currentMonth}-${currentYear}`;
    setSelectedMonth(currentVal);
  };



  const calculateWorkingDays = (month, year) => {
    const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) { // 0 is Sunday
        workingDays++;
      }
    }
    return workingDays;
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e - s);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const leaveSummary = leaves.reduce((acc, leave) => {
    const days = calculateDays(leave.startDate, leave.endDate);
    acc[leave.leaveType] = (acc[leave.leaveType] || 0) + days;
    return acc;
  }, {});

  const totalDays = Object.values(leaveSummary).reduce((sum, val) => sum + val, 0);

  const [m, y] = selectedMonth.split('-');
  const workingDays = selectedMonth ? calculateWorkingDays(parseInt(m), parseInt(y)) : 0;
  const unpaidDays = leaveSummary['Unpaid Leave'] || 0;
  const perDaySalary = workingDays > 0 ? (staff?.salary || 0) / workingDays : 0;
  const deduction = perDaySalary * unpaidDays;
  const netPayable = (staff?.salary || 0) - deduction;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content payroll-modal">
        <div className="modal-header d-flex justify-content-between">
          <div className="title-with-icon">
            <div className="icon-circle"><Banknote size={20} /></div>
            <div>
              <h2>Staff Payroll</h2>
              <p>{staff?.firstName} {staff?.lastName} ({staff?.employeeId})</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`message-banner ${message.type}`}>
              <AlertCircle size={18} />
              <span>{message.text}</span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Select Month</label>
            <div className="input-with-icon">
              {/* <Calendar size={18} /> */}
              <select 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="leave-summary-section">
            <h3>Leave Summary</h3>
            {loading ? (
              <div className="loading-inline"><Loader2 size={24} className="animate-spin" /> Fetching leave records...</div>
            ) : leaves.length > 0 ? (
              <div className="leave-grid">
                {Object.entries(leaveSummary).map(([type, count]) => (
                  <div key={type} className={`leave-card-mini ${type.toLowerCase().replace(' ', '-')}`}>
                    <span className="type">{type}</span>
                    <span className="count">{count} Days</span>
                  </div>
                ))}
                <div className="leave-card-mini total">
                  <span className="type">Total Approved Leaves</span>
                  <span className="count">{totalDays} Days</span>
                </div>
              </div>
            ) : (
              <div className="empty-leaves">
                <AlertCircle size={24} />
                <p>No approved leaves found for this month.</p>
              </div>
            )}
          </div>

          <div className="payroll-details card">
            {existingPayroll && (
              <div className="existing-badge">
                <CheckCircle2 size={16} /> Payroll Generated on {new Date(existingPayroll.generatedAt).toLocaleDateString()}
              </div>
            )}
            <div className="detail-row">
              <span>Base Salary</span>
              <strong>INR{existingPayroll ? existingPayroll.baseSalary : (staff?.salary || 0)}</strong>
            </div>
            <div className="detail-row">
              <span>Working Days (Excl. Sun)</span>
              <strong>{existingPayroll ? existingPayroll.totalWorkingDays : workingDays} Days</strong>
            </div>
            <div className="detail-row">
              <span>Salary Deduction ({existingPayroll ? existingPayroll.unpaidDays : unpaidDays} Unpaid)</span>
              <span className="text-danger">- INR{(existingPayroll ? existingPayroll.salaryDeduction : deduction).toFixed(2)}</span>
            </div>
            <div className="detail-row total">
              <span>Net Payable</span>
              <strong>INR{(existingPayroll ? existingPayroll.netSalary : netPayable).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {!existingPayroll && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={generating}>Cancel</button>
            <button 
              className="btn btn-primary" 
              onClick={handleGeneratePayroll}
              disabled={generating}
            >
              {generating ? (
                <><Loader2 size={18} className="animate-spin" /> Generating...</>
              ) : (
                'Generate Payroll'
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .existing-badge { background: #dcfce7; color: #166534; padding: 0.75rem; border-radius: var(--radius); margin-bottom: 1rem; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
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
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .payroll-modal { max-width: 500px; }
        .title-with-icon { display: flex; gap: 1rem; align-items: center; }
        .close-btn { background: none; border: none; padding: 0.5rem; border-radius: 50%; cursor: pointer; transition: background 0.2s; color: var(--text-secondary); }
        .close-btn:hover { background: #f1f5f9; color: var(--text-primary); }
        .icon-circle { width: 40px; height: 40px; background: #eef2ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .leave-summary-section { margin: 1.5rem 0; }
        .leave-summary-section h3 { font-size: 1rem; margin-bottom: 1rem; color: var(--text-primary); }
        .leave-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .leave-card-mini { padding: 1rem; border-radius: var(--radius); border-left: 4px solid #cbd5e1; background: #f8fafc; display: flex; flex-direction: column; gap: 0.25rem; }
        .leave-card-mini.casual-leave { border-left-color: #6366f1; background: #eef2ff; }
        .leave-card-mini.sick-leave { border-left-color: #ef4444; background: #fef2f2; }
        .leave-card-mini.other-leave { border-left-color: #f59e0b; background: #fffbeb; }
        .leave-card-mini.unpaid-leave { border-left-color: #64748b; background: #f1f5f9; }
        .leave-card-mini.total { grid-column: span 2; border-left-color: #10b981; background: #ecfdf5; flex-direction: row; justify-content: space-between; align-items: center; }
        .leave-card-mini .type { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
        .leave-card-mini .count { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); }
        
        .empty-leaves { display: flex; flex-direction: column; align-items: center; padding: 2rem; background: #f8fafc; border-radius: var(--radius); color: var(--text-secondary); gap: 0.5rem; text-align: center; }
        .loading-inline { display: flex; align-items: center; gap: 0.75rem; padding: 2rem; justify-content: center; color: var(--text-secondary); }
        
        .payroll-details { padding: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.9375rem; }
        .detail-row.total { margin-top: 1rem; padding-top: 1rem; border-top: 2px dashed #e2e8f0; font-size: 1.125rem; }
        .detail-row.total strong { color: var(--primary); }
        .text-danger { color: #ef4444; }
      `}</style>
    </div>
  );
};

export default PayrollModal;
