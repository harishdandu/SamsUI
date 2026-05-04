import React, { useState, useEffect } from 'react';
import { Users, CalendarCheck, CreditCard, TrendingUp, Loader2 } from 'lucide-react';
import { statsApi } from '../utils/api';

const StatCard = ({ title, value, icon, trend, color }) => (
  <div className="card stat-card">
    <div className="stat-content">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
    <div className="stat-trend">
      <TrendingUp size={16} />
      <span>{trend}</span>
    </div>
    <style>{`
      .stat-card { display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; }
      .stat-content { display: flex; align-items: center; gap: 1rem; }
      .stat-icon { padding: 0.75rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .stat-icon.blue { background: #eff6ff; color: #3b82f6; }
      .stat-icon.green { background: #ecfdf5; color: #10b981; }
      .stat-icon.orange { background: #fff7ed; color: #f59e0b; }
      .stat-icon.purple { background: #f5f3ff; color: #8b5cf6; }
      .stat-info h3 { font-size: 1.5rem; margin-bottom: 0.25rem; }
      .stat-info p { color: var(--text-secondary); font-size: 0.875rem; }
      .stat-trend { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--secondary); font-weight: 600; }
    `}</style>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await statsApi.getDashboard();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={48} className="animate-spin" color="var(--primary)" />
        <p>Calculating school metrics...</p>
        <style>{`
          .dashboard-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 1.5rem; }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Welcome Back, Admin</h1>
        <p>Here's what's happening in your school today.</p>
      </header>
      
      <div className="stats-grid">
        <StatCard 
          title="Total Students" 
          value={stats?.studentCount || 0} 
          icon={<Users size={24} />} 
          trend="+2% from last month" 
          color="blue"
        />
        <StatCard 
          title="Attendance Today" 
          value={`${stats?.attendancePercentage || 0}%`} 
          icon={<CalendarCheck size={24} />} 
          trend="Real-time data" 
          color="green"
        />
        <StatCard 
          title="Fees Collected" 
          value={`$${stats?.totalFees?.toLocaleString() || 0}`} 
          icon={<CreditCard size={24} />} 
          trend="Total paid" 
          color="orange"
        />
        <StatCard 
          title="Total Staff" 
          value={stats?.staffCount || 0} 
          icon={<Users size={24} />} 
          trend="Active staff members" 
          color="purple"
        />
      </div>

      <div className="card" style={{ marginTop: '2rem', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <h3>School Activity Feed</h3>
          <p>Recent events and notifications will appear here in Phase 3.</p>
      </div>

      <style>{`
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem; }
        .page-header p { color: var(--text-secondary); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
      `}</style>
    </div>
  );
};

export default Dashboard;
