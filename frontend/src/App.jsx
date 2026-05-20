import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import StaffPayroll from './pages/StaffPayroll';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Subjects from './pages/Subjects';
import ClassesPage from './pages/ClassesPage';
import Syllabus from './pages/Syllabus';
import TestGenerator from './pages/TestGenerator';
import Accounting from './pages/Accounting';
import PendingFees from './pages/PendingFees';
import Ledger from './pages/Ledger';
import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import SchoolProfilePage from './pages/SchoolProfilePage';
import LeaveTracker from './pages/LeaveTracker';
import AdminLeaveTracker from './pages/AdminLeaveTracker';
import StudentProfile from './pages/StudentProfile';

const ProtectedRoute = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" />;

  // If school profile is not completed, redirect Admin/Super Admin to profile page
  if ((user?.role === 'Admin' || user?.role === 'Super Admin') && !user?.isProfileCompleted && window.location.pathname !== '/school-profile') {
    return <Navigate to="/school-profile" />;
  }

  const isProfileGate = window.location.pathname === '/school-profile' && !user?.isProfileCompleted;

  return (
    <div className="app-container">
      {!isProfileGate && <Sidebar />}
      <main className={`main-content ${isProfileGate ? 'full-width' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/student-profile/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
          <Route path="/staff-payroll" element={<ProtectedRoute><StaffPayroll /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
          <Route path="/syllabus" element={<ProtectedRoute><Syllabus /></ProtectedRoute>} />
          <Route path="/test-gen" element={<ProtectedRoute><TestGenerator /></ProtectedRoute>} />
          <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
          <Route path="/pending-fees" element={<ProtectedRoute><PendingFees /></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
          <Route path="/leave-tracker" element={<ProtectedRoute><LeaveTracker /></ProtectedRoute>} />
          <Route path="/admin/leaves" element={<ProtectedRoute><AdminLeaveTracker /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/school-profile" element={<ProtectedRoute><SchoolProfilePage /></ProtectedRoute>} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
