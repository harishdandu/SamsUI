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
  LogOut
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
    { name: 'Staff Attendance', icon: <CalendarCheck size={20} />, path: '/staff-attendance' },
    { name: 'Attendance', icon: <CalendarCheck size={20} />, path: '/attendance' },
    { name: 'Fees', icon: <CreditCard size={20} />, path: '/fees' },
    { name: 'Subjects', icon: <Book size={20} />, path: '/subjects' },
    { name: 'AI Test Gen', icon: <Sparkles size={20} />, path: '/test-gen' },
    { name: 'Accounting', icon: <BarChart3 size={20} />, path: '/accounting' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <GraduationCap size={32} color="var(--primary)" />
        <span>SAMS Elite</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
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
          overflow-y: auto;
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
