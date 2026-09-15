import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import MyAttendance from './pages/MyAttendance';
import ApplyLeave from './pages/ApplyLeave';
import EmployeeProfile from './pages/EmployeeProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDirectory from './pages/admin/EmployeeDirectory';
import AttendanceReports from './pages/admin/AttendanceReports';
import AdminMapView from './pages/admin/AdminMapView';
import LeaveApprovals from './pages/admin/LeaveApprovals';
import { SidebarProvider } from './context/SidebarContext';
import { Toaster } from 'react-hot-toast';

const AppLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid #334155' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Employee Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppLayout><EmployeeDashboard /></AppLayout>} />
            <Route path="/my-attendance" element={<AppLayout><MyAttendance /></AppLayout>} />
            <Route path="/apply-leave" element={<AppLayout><ApplyLeave /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><EmployeeProfile /></AppLayout>} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AppLayout><AdminDashboard /></AppLayout>} />
            <Route path="/admin/employees" element={<AppLayout><EmployeeDirectory /></AppLayout>} />
            <Route path="/admin/reports" element={<AppLayout><AttendanceReports /></AppLayout>} />
            <Route path="/admin/map-view" element={<AppLayout><AdminMapView /></AppLayout>} />
            <Route path="/admin/leaves" element={<AppLayout><LeaveApprovals /></AppLayout>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
