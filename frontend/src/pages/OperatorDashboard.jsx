import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const OperatorDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected, joinIncidentRoom } = useSocket();
  const [incidentForm, setIncidentForm] = useState({
    patientDescription: '',
    patientLocation: '',
  });
  const [currentIncident, setCurrentIncident] = useState(null);
  const [matchedHospitals, setMatchedHospitals] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.on('hospitalAvailabilityUpdated', (data) => {
        setHospitals(prevHospitals => 
          prevHospitals.map(h => 
            h._id === data.hospitalId 
              ? { ...h, availableBeds: data.availableBeds }
              : h
          )
        );
        setMatchedHospitals(prevHospitals => 
          prevHospitals.map(h => 
            h._id === data.hospitalId 
              ? { ...h, availableBeds: data.availableBeds }
              : h
          )
        );
      });

      return () => {
        socket.off('hospitalAvailabilityUpdated');
      };
    }
  }, [socket, connected]);

  useEffect(() => {
    if (socket && connected && currentIncident) {
      socket.on('incidentStatusChanged', (data) => {
        if (data.incidentId === currentIncident._id) {
          setCurrentIncident(prev => ({ ...prev, status: data.status }));
          if (data.status === 'completed') {
            setSuccess('Incident completed successfully');
          }
        }
      });

      return () => {
        socket.off('incidentStatusChanged');
      };
    }
  }, [socket, connected, currentIncident?._id]);

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/api/hospitals');
      setHospitals(response.data.hospitals);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const handleInputChange = (e) => {
    setIncidentForm({
      ...incidentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/api/incidents', {
        patientDescription: incidentForm.patientDescription,
        patientLocation: incidentForm.patientLocation,
      });
      
      setCurrentIncident(response.data.incident);
      setMatchedHospitals(response.data.matchedHospitals);
      joinIncidentRoom(response.data.incident._id);
      setSuccess('Incident created successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (hospitalId) => {
    setError('');
    setSuccess('');

    try {
      await api.patch(`/api/incidents/${currentIncident._id}/dispatch`, { hospitalId });
      setCurrentIncident(prev => ({ ...prev, status: 'dispatched' }));
      setSuccess('Incident dispatched successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to dispatch incident');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      mild: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      matched: 'bg-blue-100 text-blue-800',
      dispatched: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">RapidCare</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {connected ? 'Live' : 'Offline'}
            </span>
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Incident Creation */}
          <div className="space-y-6">
            <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Report Emergency
              </h2>
              
              <form onSubmit={handleCreateIncident} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    What's the emergency?
                  </label>
                  <textarea
                    name="patientDescription"
                    value={incidentForm.patientDescription}
                    onChange={handleInputChange}
                    rows="4"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Describe the patient's symptoms... e.g., '65-year-old male with severe chest pain and difficulty breathing'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Location
                  </label>
                  <input
                    type="text"
                    name="patientLocation"
                    value={incidentForm.patientLocation}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your address... e.g., '123 Main Street, Jaipur' or 'Andheri, Mumbai'"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter street address, area, or city name
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing emergency...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Find Hospitals</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {currentIncident && (
              <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">AI Assessment</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(currentIncident.status)}`}>
                      {currentIncident.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Severity</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityColor(currentIncident.severity)}`}>
                      {currentIncident.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Specialization</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {currentIncident.requiredSpecialization}
                    </span>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">🤖 AI Analysis:</span>
                    <p className="text-sm text-gray-600 mt-1">{currentIncident.aiReasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {matchedHospitals.length > 0 && (
              <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Nearby Hospitals ({matchedHospitals.length})
                </h2>
                <div className="space-y-4">
                  {matchedHospitals.map((hospital, index) => (
                    <div key={hospital._id} className={`border rounded-lg p-4 transition-all ${index === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:shadow-md'}`}>
                      {index === 0 && (
                        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          ⭐ Recommended
                        </span>
                      )}
                      <div className="flex justify-between items-start mt-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                          <p className="text-sm text-gray-500">{hospital.address}</p>
                          <p className="text-sm text-gray-500">📞 {hospital.contactNumber}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">{hospital.distance} km</p>
                          <p className="text-sm text-blue-600 font-medium">🕐 {hospital.travelTime?.formatted || 'Calculating...'}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className={`font-semibold ${hospital.availableBeds > 10 ? 'text-green-600' : hospital.availableBeds > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {hospital.availableBeds} beds
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDispatch(hospital._id)}
                        disabled={currentIncident?.status === 'dispatched' || currentIncident?.status === 'completed'}
                        className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Dispatch Ambulance
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OperatorDashboard;
