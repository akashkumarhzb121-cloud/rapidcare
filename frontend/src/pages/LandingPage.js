import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleOperatorClick = () => {
    if (user?.role === 'ambulance_operator') {
      navigate('/operator');
    } else {
      navigate('/login', { state: { from: { pathname: '/operator' } } });
    }
  };

  const handleHospitalClick = () => {
    if (user?.role === 'hospital_staff') {
      navigate('/hospital');
    } else {
      navigate('/login', { state: { from: { pathname: '/hospital' } } });
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
                <span className="text-sm text-gray-600">
                  {user.name} ({user.role === 'ambulance_operator' ? 'Operator' : 'Hospital Staff'})
                </span>
                <button 
                  onClick={logout} 
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to RapidCare</h2>
          <p className="text-lg text-gray-600">AI-Powered Emergency Response System</p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              You are logged in as: <span className="font-semibold">
                {user.role === 'ambulance_operator' ? 'Ambulance Operator' : 'Hospital Staff'}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Operator Card */}
          <div
            onClick={handleOperatorClick}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500 cursor-pointer"
          >
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Operator Dashboard</h3>
              <p className="text-gray-600">Create emergencies, find hospitals, dispatch ambulances</p>
              {user?.role === 'ambulance_operator' ? (
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  ✓ You have access
                </span>
              ) : (
                <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  Login as operator to access
                </span>
              )}
            </div>
          </div>

          {/* Hospital Card */}
          <div
            onClick={handleHospitalClick}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-green-500 cursor-pointer"
          >
            <div className="text-center">
              <div className="bg-green-100 text-green-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hospital Dashboard</h3>
              <p className="text-gray-600">Manage beds, view incoming patients, update availability</p>
              {user?.role === 'hospital_staff' ? (
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  ✓ You have access
                </span>
              ) : (
                <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  Login as hospital staff to access
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Both dashboards can be opened simultaneously in different tabs</p>
          <p className="mt-1">Tip: Use different browsers or incognito mode for different roles</p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
