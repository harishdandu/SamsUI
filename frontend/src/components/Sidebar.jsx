import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  LayoutDashboard, 
  GraduationCap,
  Sparkles,
  BarChart3,
  Book,
  Lock,
  Clock,
  LogOut,
  BookOpen,
  Layers
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Students', icon: <Users size={20} />, path: '/students' },
    { name: 'Staff', icon: <Users size={20} />, path: '/staff' },
    { name: 'Staff Payroll', icon: <CalendarCheck size={20} />, path: '/staff-payroll', roles: ['admin'], visibleAfter: 25 },
    { name: 'Attendance', icon: <CalendarCheck size={20} />, path: '/attendance', roles: ['admin', 'teacher'] },
    { name: 'Fees', icon: <CreditCard size={20} />, path: '/fees', roles: ['admin','hr','accountant'] },
    { name: 'Pending Fees', icon: <Clock size={20} />, path: '/pending-fees', roles: ['admin','hr','accountant'] },
    { name: 'Ledgers', icon: <BookOpen size={20} />, path: '/ledger', roles: ['admin','hr','accountant'] },
    { name: 'Subjects', icon: <Book size={20} />, path: '/subjects', roles: ['admin'] },
    { name: 'Classes', icon: <Layers size={20} />, path: '/classes', roles: ['admin'] },
    { name: 'AI Test Gen', icon: <Sparkles size={20} />, path: '/test-gen' },
    { name: 'Accounting', icon: <BarChart3 size={20} />, path: '/accounting' },
    { name: 'Leave Tracker', icon: <CalendarCheck size={20} />, path: '/leave-tracker', roles: ['hr', 'teacher', 'accountant'] },
    { name: 'Track Leaves', icon: <CalendarCheck size={20} />, path: '/admin/leaves', roles: ['admin', 'hr'] },
    { name: 'Profile', icon: <Users size={20} />, path: '/school-profile', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => {
    // If school profile is not completed, only show the Profile page for Admin
    if (user?.role === 'Admin' && !user?.isProfileCompleted) {
      return item.name === 'Profile';
    }

    if (!item.roles) return true;
    const userRole = user?.role?.toLowerCase();
    const isRoleAllowed = item.roles.some(role => role.toLowerCase() === userRole);
    
    // Check for date-based visibility
    if (item.visibleAfter && isRoleAllowed) {
      const today = new Date().getDate();
      return today >= item.visibleAfter;
    }

    return isRoleAllowed;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <GraduationCap size={32} color="var(--primary)" />
        <span>SAMS Elite</span>
      </div>
      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.username?.[0].toUpperCase()}</div>
          <div className="user-details">
            <p className="user-name">{user?.username}</p>
            <p className="user-role">{user?.role}</p>
          </div>
        </div>
        {! (user?.role === 'Admin' && !user?.isProfileCompleted) && (
          <NavLink to="/change-password" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Lock size={20} />
            <span>Change Password</span>
          </NavLink>
        )}
        <button className="logout-btn nav-item" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2.5rem;
          padding-left: 0.5rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          overflow-y: auto;
          margin-bottom: 1rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius);
          color: var(--text-secondary);
          font-weight: 500;
          transition: var(--transition);
        }

        .nav-item:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        .nav-item.active {
          background: #eef2ff;
          color: var(--primary);
        }

        .nav-item.active svg {
          color: var(--primary);
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 0 0.5rem;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .user-details p {
          margin: 0;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .logout-btn {
          width: 100%;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--danger);
        }

        .logout-btn:hover {
          background: #fee2e2;
          color: var(--danger);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
