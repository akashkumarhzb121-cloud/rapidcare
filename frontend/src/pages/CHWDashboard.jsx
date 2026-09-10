import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const CHWDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  
  const [activeTab, setActiveTab] = useState('register');
  const [facilities, setFacilities] = useState([]);
  const [dueFollowUps, setDueFollowUps] = useState([]);
  const [allFollowUps, setAllFollowUps] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [forceEmergency, setForceEmergency] = useState(false);
  
  const [patientForm, setPatientForm] = useState({
    name: '', age: '', gender: 'female', village: '', district: '',
    phone: '', languagePreference: 'hindi', chronicConditions: [], highRiskFlags: []
  });
  
  const [referralForm, setReferralForm] = useState({
    patientId: '', fromFacilityId: '', toFacilityId: '',
    patientDescription: '', patientLocation: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.on('referralStatusChanged', () => {
        fetchReferrals();
        fetchFollowUps();
        setSuccess('📋 Referral status updated!');
        setTimeout(() => setSuccess(''), 3000);
      });
      
      socket.on('followUpCreated', () => {
        fetchFollowUps();
      });
      
      return () => {
        socket.off('referralStatusChanged');
        socket.off('followUpCreated');
      };
    }
  }, [socket, connected]);

  const fetchInitialData = async () => {
    try {
      const [facilitiesRes] = await Promise.all([
        api.get('/api/facilities')
      ]);
      setFacilities(facilitiesRes.data.facilities);
      
      if (user?.linkedFacilityId) {
        setReferralForm(prev => ({ ...prev, fromFacilityId: user.linkedFacilityId }));
      }
      
      await Promise.all([fetchReferrals(), fetchFollowUps()]);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchReferrals = async () => {
    if (!user?.linkedFacilityId) return;
    try {
      const response = await api.get(`/api/referrals/facility/${user.linkedFacilityId}?type=outgoing`);
      setReferrals(response.data.referrals);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const [dueRes, allRes] = await Promise.all([
        api.get('/api/followups/due'),
        api.get('/api/followups/all')
      ]);
      setDueFollowUps(dueRes.data.followUps || []);
      setAllFollowUps(allRes.data.followUps || []);
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error);
    }
  };

  const handleSearchPatients = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await api.get(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.patients);
    } catch (error) {
      setError('Failed to search patients');
    }
  };

  const handleSelectPatient = (patient) => {
    setReferralForm(prev => ({ ...prev, patientId: patient._id }));
    setSearchResults([]);
    setSearchQuery(patient.name);
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/api/patients', patientForm);
      const newPatient = response.data.patient;
      setSuccess(`✅ Patient "${newPatient.name}" registered successfully!`);
      setRegisteredPatients(prev => [newPatient, ...prev]);
      setReferralForm(prev => ({ ...prev, patientId: newPatient._id }));
      setPatientForm({
        name: '', age: '', gender: 'female', village: '', district: '',
        phone: '', languagePreference: 'hindi', chronicConditions: [], highRiskFlags: []
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...referralForm,
        forceEmergency
      };
      
      const response = await api.post('/api/referrals', payload);
      
      if (response.data.isEmergency) {
        setSuccess('🚨 CRITICAL! Emergency incident created and ambulance will be dispatched.');
      } else {
        setSuccess('✅ Referral created successfully!');
      }
      
      await fetchReferrals();
      setReferralForm(prev => ({
        ...prev,
        patientId: '',
        patientDescription: '',
        patientLocation: ''
      }));
      setSearchQuery('');
      setForceEmergency(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create referral');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field, value) => {
    setPatientForm(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...current, value] };
    });
  };

  const handleCompleteFollowUp = async (followUpId) => {
    try {
      await api.patch(`/api/followups/${followUpId}/complete`, { notes: 'Completed by CHW' });
      setSuccess('✅ Follow-up marked as complete');
      fetchFollowUps();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to complete follow-up');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      initiated: 'bg-gray-100 text-gray-700',
      'in-transit': 'bg-yellow-100 text-yellow-700',
      received: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">RapidCare</h1>
              <p className="text-xs text-gray-500">Community Health Worker</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {connected ? 'Live' : 'Offline'}
            </span>
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button onClick={logout} className="text-red-600 text-sm font-medium">Logout</button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto">
          {[
            { id: 'register', label: '👤 Register Patient' },
            { id: 'triage', label: '🏥 Symptom Triage' },
            { id: 'referrals', label: `📋 My Referrals (${referrals.length})` },
            { id: 'followups', label: `📅 Follow-ups (${allFollowUps.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* ========== REGISTER TAB ========== */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white shadow-xl rounded-xl p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">👤</span>
                Register New Patient
              </h2>
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Full Name *</label>
                    <input type="text" value={patientForm.name}
                      onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                      required placeholder="e.g., Lakshmi Devi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Age *</label>
                    <input type="number" value={patientForm.age}
                      onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                      required min="0" max="120"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Gender *</label>
                    <select value={patientForm.gender}
                      onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Village *</label>
                    <input type="text" value={patientForm.village}
                      onChange={(e) => setPatientForm({...patientForm, village: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">District</label>
                    <input type="text" value={patientForm.district}
                      onChange={(e) => setPatientForm({...patientForm, district: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Phone</label>
                    <input type="tel" value={patientForm.phone}
                      onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Chronic Conditions</label>
                  <div className="flex flex-wrap gap-2">
                    {['diabetes', 'hypertension', 'asthma', 'heart_disease', 'tuberculosis'].map(cond => (
                      <button key={cond} type="button"
                        onClick={() => handleCheckboxChange('chronicConditions', cond)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          patientForm.chronicConditions?.includes(cond) 
                            ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {cond.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">High Risk Flags</label>
                  <div className="flex flex-wrap gap-2">
                    {['pregnancy', 'child_under_5', 'elderly', 'chronic', 'post_surgery'].map(flag => (
                      <button key={flag} type="button"
                        onClick={() => handleCheckboxChange('highRiskFlags', flag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          patientForm.highRiskFlags?.includes(flag) 
                            ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {flag.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Registering...' : '✅ Register Patient'}
                </button>
              </form>
            </div>

            <div className="bg-white shadow-xl rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">Recently Registered</h2>
              {registeredPatients.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No patients registered this session</p>
              ) : (
                <div className="space-y-2">
                  {registeredPatients.map(p => (
                    <div key={p._id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-600">{p.age} yrs • {p.village}</p>
                      <p className="text-xs text-green-700 mt-1">✓ Ready for triage</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TRIAGE TAB WITH EMERGENCY BUTTON ========== */}
        {activeTab === 'triage' && (
          <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">🏥</span>
              Symptom Triage & Referral
            </h2>
            
            <form onSubmit={handleReferralSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Search Patient *</label>
                <div className="flex space-x-2">
                  <input type="text" value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length > 2) handleSearchPatients(); }}
                    placeholder="Search by name, village, or ABHA ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={handleSearchPatients}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Search
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p._id} type="button" onClick={() => handleSelectPatient(p)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.age} yrs • {p.village}</p>
                      </button>
                    ))}
                  </div>
                )}
                
                {referralForm.patientId && (
                  <p className="text-xs text-green-600 mt-1">✓ Patient selected</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Symptoms *</label>
                <textarea value={referralForm.patientDescription}
                  onChange={(e) => setReferralForm({...referralForm, patientDescription: e.target.value})}
                  required rows="4"
                  placeholder="Describe the patient's symptoms in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* EMERGENCY BUTTON */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🚨</span>
                    <div>
                      <p className="font-bold text-red-800">Mark as Emergency</p>
                      <p className="text-xs text-red-600">
                        Force this referral to be treated as CRITICAL. 
                        Will create an emergency incident and dispatch ambulance.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForceEmergency(!forceEmergency)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                      forceEmergency ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                      forceEmergency ? 'translate-x-9' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                {forceEmergency && (
                  <p className="mt-2 text-sm text-red-700 font-semibold bg-red-100 p-2 rounded">
                    ⚠️ Emergency mode ON - This will trigger an ambulance dispatch
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Refer to Facility *</label>
                  <select value={referralForm.toFacilityId}
                    onChange={(e) => setReferralForm({...referralForm, toFacilityId: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select facility...</option>
                    {facilities.filter(f => f._id !== referralForm.fromFacilityId).map(f => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.facilityType}) — {f.availableBeds} beds
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Patient Location</label>
                  <input type="text" value={referralForm.patientLocation}
                    onChange={(e) => setReferralForm({...referralForm, patientLocation: e.target.value})}
                    placeholder="e.g., Chikna Village, Nagpur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <button type="submit" disabled={loading || !referralForm.patientId}
                className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 ${
                  forceEmergency 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : forceEmergency ? (
                  <span>🚨 Create Emergency & Dispatch</span>
                ) : (
                  <span>🤖 Analyze & Create Referral</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========== REFERRALS TAB ========== */}
        {activeTab === 'referrals' && (
          <div className="bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">📋 My Referrals ({referrals.length})</h2>
            {referrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals created yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.map(ref => (
                  <div key={ref._id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    ref.isEmergencyFlagged ? 'border-red-300 bg-red-50' : ''
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{ref.patientId?.name || 'Unknown'}</span>
                        {ref.isEmergencyFlagged && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">🚨 EMERGENCY</span>}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ref.status)}`}>
                        {ref.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{ref.reason}</p>
                    <p className="text-xs text-gray-500">To: {ref.toFacilityId?.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ref.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        ref.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'}`}>
                        {ref.severity}
                      </span>
                      {ref.linkedIncident && (
                        <span className="text-xs text-red-600 font-medium">🚑 Ambulance Dispatched</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== FOLLOW-UPS TAB ========== */}
        {activeTab === 'followups' && (
          <div className="space-y-6">
            {/* Due Follow-ups */}
            <div className="bg-white shadow-xl rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <span className="bg-yellow-100 text-yellow-600 p-2 rounded-lg mr-3">⏰</span>
                Due Follow-ups ({dueFollowUps.length})
              </h2>
              {dueFollowUps.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-gray-500">No due follow-ups. Great job!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dueFollowUps.map(fu => (
                    <div key={fu._id} className="border-l-4 border-yellow-500 bg-yellow-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{fu.patientId?.name}</p>
                          <p className="text-sm text-gray-700 mt-1">{fu.condition}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {fu.patientId?.village} • 📞 {fu.patientId?.phone || 'N/A'}
                          </p>
                          {fu.referralId && (
                            <p className="text-xs text-blue-600 mt-1">
                              🔗 Linked referral: {fu.referralId.reason?.substring(0, 60)}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          fu.priority === 'high' ? 'bg-red-100 text-red-700' :
                          fu.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'}`}>
                          {fu.priority}
                        </span>
                      </div>
                      <button onClick={() => handleCompleteFollowUp(fu._id)}
                        className="mt-3 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm font-medium">
                        ✅ Mark Follow-up Complete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Follow-ups (including scheduled) */}
            <div className="bg-white shadow-xl rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">📅 All Follow-ups ({allFollowUps.length})</h2>
              {allFollowUps.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No follow-ups scheduled yet</p>
              ) : (
                <div className="space-y-2">
                  {allFollowUps.map(fu => (
                    <div key={fu._id} className={`border rounded-lg p-3 ${
                      fu.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{fu.patientId?.name}</p>
                          <p className="text-xs text-gray-600">{fu.condition}</p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(fu.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          fu.status === 'completed' ? 'bg-green-600 text-white' :
                          fu.status === 'missed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'}`}>
                          {fu.status === 'completed' ? '✅ Completed' : fu.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CHWDashboard;
