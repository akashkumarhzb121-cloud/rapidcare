import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import OperatorDashboard from './pages/OperatorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If specific role required and user doesn't match
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their correct dashboard
    if (user.role === 'ambulance_operator') {
      return <Navigate to="/operator" replace />;
    } else if (user.role === 'hospital_staff') {
      return <Navigate to="/hospital" replace />;
    }
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Landing page - requires auth */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <LandingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Operator dashboard - requires operator role */}
            <Route 
              path="/operator" 
              element={
                <ProtectedRoute requiredRole="ambulance_operator">
                  <OperatorDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Hospital dashboard - requires hospital_staff role */}
            <Route 
              path="/hospital" 
              element={
                <ProtectedRoute requiredRole="hospital_staff">
                  <HospitalDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
