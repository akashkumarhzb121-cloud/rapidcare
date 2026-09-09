import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    console.log('Role mismatch:', user.role, '!=', role);
    // Redirect to their correct dashboard
    if (user.role === 'ambulance_operator') {
      return <Navigate to="/operator" replace />;
    } else if (user.role === 'hospital_staff') {
      return <Navigate to="/hospital" replace />;
    }
  }

  console.log('Access granted for role:', user.role);
  return children;
};

export default PrivateRoute;
