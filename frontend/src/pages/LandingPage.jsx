import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path, requiredRole) => {
    if (user?.role === requiredRole) {
      navigate(path);
    } else {
      navigate('/login', { state: { from: { pathname: path } } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">RapidCare</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.name}</span>
                <button onClick={logout} className="text-sm text-red-600">Logout</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="text-sm text-blue-600">Login</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Welcome to RapidCare</h2>
          <p className="text-lg text-gray-600">AI-Powered Care Continuity & Emergency Response Platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Operator Card */}
          <div
            onClick={() => handleNavigation('/operator', 'ambulance_operator')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🚑</div>
              <h3 className="text-lg font-bold mb-2">Emergency Operator</h3>
              <p className="text-sm text-gray-600">Dispatch ambulances and manage emergencies</p>
              {user?.role === 'ambulance_operator' && (
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Access</span>
              )}
            </div>
          </div>

          {/* CHW Card */}
          <div
            onClick={() => handleNavigation('/chw', 'community_health_worker')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👩‍⚕️</div>
              <h3 className="text-lg font-bold mb-2">Health Worker</h3>
              <p className="text-sm text-gray-600">Register patients, triage symptoms, track referrals</p>
              {user?.role === 'community_health_worker' && (
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Access</span>
              )}
            </div>
          </div>

          {/* Hospital Card */}
          <div
            onClick={() => handleNavigation('/hospital', 'hospital_staff')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="text-lg font-bold mb-2">Hospital Staff</h3>
              <p className="text-sm text-gray-600">Manage beds, medicine, and facility resources</p>
              {user?.role === 'hospital_staff' && (
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Access</span>
              )}
            </div>
          </div>

          {/* Specialist Card */}
          <div
            onClick={() => handleNavigation('/specialist', 'specialist')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-teal-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🩺</div>
              <h3 className="text-lg font-bold mb-2">Specialist Doctor</h3>
              <p className="text-sm text-gray-600">Review consults, join video calls, and prescribe treatment</p>
              {user?.role === 'specialist' && (
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Access</span>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Demo Credentials:</p>
          <p>Operator: mumbai.operator@rapidcare.com | Staff: mumbai.staff@rapidcare.com | CHW: mumbai.chw@rapidcare.com</p>
          <p className="mt-1">All passwords: password123</p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
