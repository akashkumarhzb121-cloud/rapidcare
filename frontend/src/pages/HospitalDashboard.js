import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [hospital, setHospital] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [availableBeds, setAvailableBeds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.linkedHospitalId) {
      fetchHospitalData();
      fetchIncidents();
    }
  }, [user?.linkedHospitalId]);

  useEffect(() => {
    if (socket && connected && user?.linkedHospitalId) {
      socket.on('hospitalAvailabilityUpdated', (data) => {
        if (data.hospitalId === user.linkedHospitalId) {
          setAvailableBeds(data.availableBeds);
          setHospital(prev => prev ? { ...prev, availableBeds: data.availableBeds } : prev);
        }
      });

      socket.on('newIncidentAssigned', (data) => {
        setIncidents(prev => [data.incident, ...prev]);
      });

      socket.on('incidentStatusChanged', (data) => {
        setIncidents(prev => 
          prev.map(inc => 
            inc._id === data.incidentId 
              ? { ...inc, status: data.status }
              : inc
          )
        );
      });

      return () => {
        socket.off('hospitalAvailabilityUpdated');
        socket.off('newIncidentAssigned');
        socket.off('incidentStatusChanged');
      };
    }
  }, [socket, connected, user?.linkedHospitalId]);

  const fetchHospitalData = async () => {
    try {
      const response = await api.get('/api/hospitals');
      const hospital = response.data.hospitals.find(h => h._id === user.linkedHospitalId);
      if (hospital) {
        setHospital(hospital);
        setAvailableBeds(hospital.availableBeds);
      }
    } catch (error) {
      console.error('Failed to fetch hospital data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await api.get(`/api/hospitals/${user.linkedHospitalId}/incidents`);
      setIncidents(response.data.incidents);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  };

  const handleUpdateBeds = async () => {
    setError('');
    setSuccess('');

    try {
      await api.patch(`/api/hospitals/${user.linkedHospitalId}/availability`, {
        availableBeds: parseInt(availableBeds),
      });
      setSuccess('Bed availability updated successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update availability');
    }
  };

  const handleCompleteIncident = async (incidentId) => {
    setError('');
    setSuccess('');

    try {
      await api.patch(`/api/incidents/${incidentId}/complete`);
      setSuccess('Incident completed successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to complete incident');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">RapidCare Hospital Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-sm text-gray-600">{hospital?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Bed Management */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Bed Availability</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total Beds</p>
                    <p className="text-2xl font-bold text-gray-900">{hospital?.totalBeds || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Available Beds</p>
                    <p className="text-2xl font-bold text-green-600">{availableBeds}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Available Beds
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={availableBeds}
                      onChange={(e) => setAvailableBeds(e.target.value)}
                      min="0"
                      max={hospital?.totalBeds || 0}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleUpdateBeds}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}
          </div>

          {/* Right Column - Incidents */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Incoming Incidents</h2>
              {incidents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No incidents assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {incident.patientDescription.substring(0, 100)}
                            {incident.patientDescription.length > 100 ? '...' : ''}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Severity: {incident.severity} | Specialization: {incident.requiredSpecialization}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          incident.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                          incident.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                      {incident.status === 'dispatched' && (
                        <button
                          onClick={() => handleCompleteIncident(incident._id)}
                          className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HospitalDashboard;