import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [facility, setFacility] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({
    totalIncoming: 0,
    pendingReferrals: 0,
    completedToday: 0,
    emergencyCount: 0,
    activeEmergencies: 0
  });
  const [availableBeds, setAvailableBeds] = useState(0);
  const [medicineStock, setMedicineStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const facilityId = user?.linkedFacilityId || user?.linkedHospitalId;

  useEffect(() => {
    if (facilityId) {
      fetchFacilityData();
      fetchReferrals();
      fetchIncidents();
      fetchStats();
    }
  }, [facilityId]);

  useEffect(() => {
    if (socket && connected && facilityId) {
      socket.emit('joinHospitalRoom', facilityId);
      socket.emit('joinFacilityRoom', facilityId);

      // Real-time updates for availability
      socket.on('facilityAvailabilityUpdated', (data) => {
        if (data.facilityId === facilityId) setAvailableBeds(data.availableBeds);
      });
      socket.on('hospitalAvailabilityUpdated', (data) => {
        if (data.hospitalId === facilityId || data.facilityId === facilityId) {
          setAvailableBeds(data.availableBeds);
        }
      });

      // Real-time incident updates
      socket.on('newIncidentAssigned', (data) => {
        if (data.incident?.assignedHospitalId === facilityId) {
          setIncidents(prev => [data.incident, ...prev]);
          setSuccess('🚨 New emergency dispatched to your hospital!');
          fetchStats();
          setTimeout(() => setSuccess(''), 5000);
        }
      });

      // Real-time referral updates
      socket.on('newReferralReceived', (data) => {
        if (data.referral?.toFacilityId === facilityId) {
          setReferrals(prev => [data.referral, ...prev]);
          setSuccess('📥 New referral received!');
          fetchStats();
          setTimeout(() => setSuccess(''), 5000);
        }
      });

      socket.on('referralStatusChanged', () => {
        fetchReferrals();
        fetchStats();
      });

      // Real-time stats update
      socket.on('facilityStatsUpdated', (data) => {
        if (data.facilityId === facilityId) {
          setStats(data.stats);
        }
      });

      return () => {
        socket.off('facilityAvailabilityUpdated');
        socket.off('hospitalAvailabilityUpdated');
        socket.off('newIncidentAssigned');
        socket.off('newReferralReceived');
        socket.off('referralStatusChanged');
        socket.off('facilityStatsUpdated');
      };
    }
  }, [socket, connected, facilityId]);

  const fetchFacilityData = async () => {
    try {
      const response = await api.get(`/api/facilities/${facilityId}/dashboard`);
      const f = response.data.facility;
      setFacility(f);
      setAvailableBeds(f.availableBeds);
      setMedicineStock(f.medicineStock || []);
    } catch (error) {
      console.error('Facility fetch error:', error);
      setError('Failed to load facility data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await api.get(`/api/referrals/facility/${facilityId}?type=incoming`);
      setReferrals(response.data.referrals);
    } catch (error) { console.error(error); }
  };

  const fetchIncidents = async () => {
    try {
      const response = await api.get(`/api/incidents/facility/${facilityId}`);
      setIncidents(response.data.incidents);
    } catch (error) { console.error(error); }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/api/referrals/facility/${facilityId}/stats`);
      setStats(response.data.stats);
    } catch (error) { console.error(error); }
  };

  const handleUpdateBeds = async () => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/facilities/${facilityId}/availability`, {
        availableBeds: parseInt(availableBeds),
      });
      setSuccess('✅ Bed availability updated');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update beds');
    }
  };

  // UPDATED: Complete incident AND accept referral together
  const handleCompleteIncident = async (incidentId) => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/incidents/${incidentId}/complete`);
      setSuccess('✅ Emergency incident completed');
      await Promise.all([fetchIncidents(), fetchStats(), fetchReferrals()]);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to complete incident');
    }
  };

  const handleUpdateReferralStatus = async (referralId, newStatus) => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/referrals/${referralId}/status`, {
        status: newStatus,
        facilityId,
        notes: newStatus === 'received' ? 'Referral accepted by hospital staff' : 'Referral completed'
      });
      
      if (newStatus === 'received') {
        setSuccess('✅ Referral accepted! Follow-up scheduled for CHW.');
      } else {
        setSuccess('✅ Referral completed');
      }
      
      await Promise.all([fetchReferrals(), fetchStats()]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update referral');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const pendingReferrals = referrals.filter(r => r.status === 'initiated');
  const activeIncidents = incidents.filter(i => i.status === 'dispatched');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">{facility?.name || 'Hospital'}</h1>
              <p className="text-xs text-gray-500">{facility?.district}, {facility?.state} • {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {connected ? 'Live' : 'Offline'}
            </span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 font-medium">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

        {/* Stats Cards - Real-Time */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 uppercase">Available Beds</p>
            <p className="text-2xl font-bold text-purple-600">{availableBeds}/{facility?.totalBeds}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase">Pending Referrals</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pendingReferrals}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-xs text-gray-500 uppercase">Active Emergencies</p>
            <p className="text-2xl font-bold text-red-600">{stats.activeEmergencies}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase">Completed Today</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
            <p className="text-xs text-gray-500 uppercase">Total Incoming</p>
            <p className="text-2xl font-bold text-orange-600">{stats.totalIncoming}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bed Management */}
          <div className="bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">🛏️ Bed Availability</h2>
            <div className="flex space-x-2">
              <input type="number" value={availableBeds}
                onChange={(e) => setAvailableBeds(e.target.value)}
                min="0" max={facility?.totalBeds || 0}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              <button onClick={handleUpdateBeds}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium">
                Update
              </button>
            </div>
          </div>

          {/* Active Emergencies */}
          <div className="lg:col-span-2 bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              🚨 Active Emergencies 
              <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-sm">
                {activeIncidents.length}
              </span>
            </h2>
            {activeIncidents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-500">No active emergencies</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeIncidents.map(inc => (
                  <div key={inc._id} className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {inc.patientId?.name || 'Unknown Patient'}
                          {inc.patientId?.age && <span className="text-sm text-gray-600"> ({inc.patientId.age} yrs)</span>}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{inc.patientDescription}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inc.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        inc.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'}`}>
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">🤖 {inc.aiReasoning}</p>
                    <p className="text-xs text-gray-500 mb-3">📍 {inc.patientLocation || 'Location not specified'}</p>
                    <button onClick={() => handleCompleteIncident(inc._id)}
                      className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium">
                      ✅ Mark as Completed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Referrals */}
          <div className="lg:col-span-3 bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              📥 Incoming Referrals 
              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-sm">
                {pendingReferrals.length} pending
              </span>
            </h2>
            {referrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No incoming referrals</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {referrals.map(ref => (
                  <div key={ref._id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    ref.isEmergencyFlagged ? 'border-red-300 bg-red-50' : ''
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{ref.patientId?.name || 'Unknown'}</p>
                        {ref.isEmergencyFlagged && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">🚨</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        ref.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        ref.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'}`}>
                        {ref.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{ref.reason}</p>
                    <p className="text-xs text-gray-500 mb-2">From: {ref.fromFacilityId?.name}</p>
                    <p className="text-xs mb-3">
                      Status: <span className="font-medium">{ref.status}</span>
                    </p>
                    <div className="flex space-x-2">
                      {ref.status === 'initiated' && (
                        <button onClick={() => handleUpdateReferralStatus(ref._id, 'received')}
                          className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm hover:bg-blue-700 font-medium">
                          ✅ Accept
                        </button>
                      )}
                      {ref.status === 'received' && (
                        <button onClick={() => handleUpdateReferralStatus(ref._id, 'completed')}
                          className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm hover:bg-green-700 font-medium">
                          ✔️ Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HospitalDashboard;
