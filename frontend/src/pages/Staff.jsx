import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, MoreVertical, Filter, Loader2, Edit, Trash2, Banknote } from 'lucide-react';
import { staffApi } from '../utils/api';
import StaffModal from '../components/StaffModal';
import PayrollModal from '../components/PayrollModal';
import { useAuth } from '../context/AuthContext';

const Staff = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const menuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollStaff, setPayrollStaff] = useState(null);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const handleOpenPayroll = (member) => {
    setPayrollStaff(member);
    setIsPayrollModalOpen(true);
    setActionMenuId(null);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffApi.getAll();
      setStaff(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch staff records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    if (!isAdmin) return;
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleEditStaff = (member) => {
    if (!isAdmin) return;
    setSelectedStaff(member);
    setIsModalOpen(true);
    setActionMenuId(null);
  };

  const handleSaveStaff = async (formData) => {
    if (!isAdmin) return;
    try {
      if (selectedStaff) {
        await staffApi.update(selectedStaff._id, formData);
      } else {
        await staffApi.create(formData);
      }
      await fetchStaff();
    } catch (err) {
      console.error('Error saving staff:', err);
      throw err;
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this staff record?')) {
      try {
        await staffApi.delete(id);
        await fetchStaff();
      } catch (err) {
        console.error('Error deleting staff:', err);
      }
    }
    setActionMenuId(null);
  };

  const filteredStaff = staff.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="staff-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Staff Management</h1>
          <p>Manage teachers, admins, and other school staff.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleAddStaff}>
            <UserPlus size={18} />
            Add Staff
          </button>
        )}
      </header>

      <div className="table-actions card">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name, ID or role..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading staff records...</p>
        </div>
      ) : error ? (
        <div className="error-state card">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStaff}>Retry</button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <tr key={member._id}>
                    <td><strong>{member.employeeId}</strong></td>
                    <td>{member.firstName} {member.lastName}</td>
                    <td>{member.role}</td>
                    <td>{member.email}</td>
                    <td>
                      <span className={`badge badge-${member.status === 'Active' ? 'success' : 'warning'}`}>
                        {member.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="action-cell">
                        <div ref={actionMenuId === member._id ? menuRef : null}>
                          <button 
                            className="btn-icon" 
                            onClick={() => setActionMenuId(actionMenuId === member._id ? null : member._id)}
                          >
                            <MoreVertical size={18} color="var(--text-secondary)" />
                          </button>
                          {actionMenuId === member._id && (
                            <div className="action-menu card">
                              <button onClick={() => handleEditStaff(member)}><Edit size={16} /> Edit</button>
                              <button onClick={() => handleOpenPayroll(member)}><Banknote size={16} /> Payroll</button>
                              <button className="delete" onClick={() => handleDeleteStaff(member._id)}>
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>
                    No staff records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <StaffModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveStaff}
          staffMember={selectedStaff}
        />
      )}

      <PayrollModal 
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        staff={payrollStaff}
      />

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-left h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem; }
        .header-left p { color: var(--text-secondary); }
        .table-actions { display: flex; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; }
        .search-box { flex: 1; display: flex; align-items: center; gap: 0.75rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: var(--radius); border: 1px solid transparent; transition: var(--transition); }
        .search-box:focus-within { background: white; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
        .search-box input { border: none; background: none; outline: none; width: 100%; font-family: inherit; }
        .loading-state, .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .action-cell { position: relative; }
        .action-menu { position: absolute; right: 0; top: 100%; width: 140px; padding: 0.5rem; z-index: 10; display: flex; flex-direction: column; gap: 0.25rem; }
        .action-menu button { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem; border-radius: var(--radius); font-size: 0.875rem; color: var(--text-primary); transition: var(--transition); text-align: left; }
        .action-menu button:hover { background: #f1f5f9; }
        .action-menu button.delete { color: var(--danger); }
        .action-menu button.delete:hover { background: #fef2f2; }
        .btn-icon { padding: 0.5rem; border-radius: var(--radius); transition: var(--transition); }
        .btn-icon:hover { background: #f1f5f9; }
      `}</style>
    </div>
  );
};

export default Staff;
