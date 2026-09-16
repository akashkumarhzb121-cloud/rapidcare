import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { OfflineProvider } from './context/OfflineContext';
import './i18n';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ConnectPage from './pages/ConnectPage.jsx';
import OperatorDashboard from './pages/OperatorDashboard.jsx';
import HospitalDashboard from './pages/HospitalDashboard.jsx';
import CHWDashboard from './pages/CHWDashboard.jsx';
import SpecialistDashboard from './pages/SpecialistDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'ambulance_operator') return <Navigate to="/operator" replace />;
    if (user.role === 'hospital_staff') return <Navigate to="/hospital" replace />;
    if (user.role === 'community_health_worker') return <Navigate to="/chw" replace />;
    if (user.role === 'specialist') return <Navigate to="/specialist" replace />;
    if (user.role === 'district_admin') return <Navigate to="/admin" replace />;
  }
  return children;
};

function App() {
  return (
    <OfflineProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/connect" element={<ConnectPage />} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
              <Route path="/operator" element={<ProtectedRoute roles={['ambulance_operator']}><OperatorDashboard /></ProtectedRoute>} />
              <Route path="/hospital" element={<ProtectedRoute roles={['hospital_staff']}><HospitalDashboard /></ProtectedRoute>} />
              <Route path="/chw" element={<ProtectedRoute roles={['community_health_worker']}><CHWDashboard /></ProtectedRoute>} />
              <Route path="/specialist" element={<ProtectedRoute roles={['specialist']}><SpecialistDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['district_admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </OfflineProvider>
  );
}

export default App;
