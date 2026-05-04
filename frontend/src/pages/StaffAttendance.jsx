import React, { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, CheckCircle2, Search, Users, History } from 'lucide-react';
import { staffApi, staffAttendanceApi } from '../utils/api';

const StaffAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [staff, setStaff] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [attendanceExists, setAttendanceExists] = useState(false);

  useEffect(() => {
    fetchStaffAndAttendance();
  }, [date]);

  const fetchStaffAndAttendance = async () => {
    setLoading(true);
    setStaff([]);
    setAttendanceData({});
    try {
      const staffRes = await staffApi.getAll();
      setStaff(staffRes.data);
      
      const attRes = await staffAttendanceApi.get({ date });
      if (attRes.data.length > 0) {
        setAttendanceExists(true);
        const mapped = {};
        attRes.data.forEach(rec => {
          mapped[rec.staffId._id || rec.staffId] = rec.status;
        });
        setAttendanceData(mapped);
      } else {
        setAttendanceExists(false);
        const initial = {};
        staffRes.data.forEach(s => { initial[s._id] = 'Present'; });
        setAttendanceData(initial);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleStatusChange = (staffId, status) => {
    setAttendanceData(prev => ({ ...prev, [staffId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendanceData).map(([staffId, status]) => ({
        staffId, status, date
      }));
      await staffAttendanceApi.markBulk({ records });
      setMessage({ type: 'success', text: 'Staff attendance saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-attendance-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Staff Attendance</h1>
          <p>Mark and track daily staff attendance.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || staff.length === 0}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Attendance
          </button>
        </div>
      </header>

      {message && <div className={`message-banner ${message.type}`}><CheckCircle2 size={18} />{message.text}</div>}

      <div className="attendance-filters card" style={{ display: 'flex', gap: '1.5rem' }}>
        <div className="form-group" style={{ flex: 1, maxWidth: '300px' }}>
          <label className="form-label">Select Date</label>
          <div className="input-with-icon">
            <Calendar size={18} />
            <input type="date" className="form-input" style={{ paddingLeft: '2.5rem' }} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {!loading && staff.length > 0 && !attendanceExists && (
        <div className="info-banner">
          <Calendar size={18} />
          <span>Attendance hasn't been marked for this date yet. You can mark and save it below.</span>
        </div>
      )}

      {loading ? <div className="loading-state"><Loader2 className="animate-spin" /></div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Role</th>
                <th className="center">Present</th>
                <th className="center">Absent</th>
                <th className="center">Late</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.employeeId}</strong></td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.role}</td>
                  <td className="center"><input type="radio" checked={attendanceData[s._id] === 'Present'} onChange={() => handleStatusChange(s._id, 'Present')} /></td>
                  <td className="center"><input type="radio" checked={attendanceData[s._id] === 'Absent'} onChange={() => handleStatusChange(s._id, 'Absent')} /></td>
                  <td className="center"><input type="radio" checked={attendanceData[s._id] === 'Late'} onChange={() => handleStatusChange(s._id, 'Late')} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .attendance-filters { display: flex; gap: 1.5rem; align-items: flex-end; margin-bottom: 1.5rem; padding: 1.5rem; }
        .save-btn { height: 42px; }
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

export default StaffAttendance;
