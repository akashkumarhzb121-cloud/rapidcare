import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const CHWDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  
  // State
  const [activeTab, setActiveTab] = useState('register');
  const [patients, setPatients] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [dueFollowUps, setDueFollowUps] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Patient form
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    gender: 'female',
    village: '',
    district: '',
    phone: '',
    languagePreference: 'hindi',
    chronicConditions: [],
    highRiskFlags: []
  });
  
  // Referral form
  const [referralForm, setReferralForm] = useState({
    patientId: '',
    fromFacilityId: '',
    toFacilityId: '',
    patientDescription: '',
    patientLocation: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.on('referralStatusChanged', (data) => {
        fetchReferrals();
      });
      return () => socket.off('referralStatusChanged');
    }
  }, [socket, connected]);

  const fetchInitialData = async () => {
    try {
      const [facilitiesRes, followUpsRes] = await Promise.all([
        api.get('/api/facilities'),
        api.get('/api/followups/due')
      ]);
      setFacilities(facilitiesRes.data.facilities);
      setDueFollowUps(followUpsRes.data.followUps);
      
      if (user?.linkedFacilityId) {
        setReferralForm(prev => ({
          ...prev,
          fromFacilityId: user.linkedFacilityId
        }));
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await api.get(`/api/referrals/facility/${user.linkedFacilityId}?type=outgoing`);
      setReferrals(response.data.referrals);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    }
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/api/patients', patientForm);
      setSuccess(`Patient ${response.data.patient.name} registered successfully!`);
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
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/api/referrals', referralForm);
      if (response.data.incident) {
        setSuccess('Emergency incident created from critical referral!');
      } else {
        setSuccess('Referral created successfully!');
      }
      fetchReferrals();
      setReferralForm(prev => ({
        ...prev,
        patientDescription: '',
        patientLocation: ''
      }));
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create referral');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field, value, formType) => {
    if (formType === 'patient') {
      setPatientForm(prev => {
        const current = prev[field] || [];
        if (current.includes(value)) {
          return { ...prev, [field]: current.filter(v => v !== value) };
        }
        return { ...prev, [field]: [...current, value] };
      });
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
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
              <h1 className="text-xl font-bold">{t('common.appName')}</h1>
              <p className="text-xs text-gray-500">Community Health Worker</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
            <span className="text-sm">{user?.name}</span>
            <button onClick={logout} className="text-red-600 text-sm">{t('common.logout')}</button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto flex space-x-1">
          {[
            { id: 'register', label: 'Register Patient', icon: '👤' },
            { id: 'triage', label: 'Symptom Triage', icon: '🏥' },
            { id: 'referrals', label: 'Referrals', icon: '📋' },
            { id: 'followups', label: 'Follow-ups', icon: '📅' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
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

        {/* Register Patient Tab */}
        {activeTab === 'register' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">👤 Register New Patient</h2>
            <form onSubmit={handlePatientSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age *</label>
                  <input
                    type="number"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                    required
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender *</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Village *</label>
                  <input
                    type="text"
                    value={patientForm.village}
                    onChange={(e) => setPatientForm({...patientForm, village: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">District</label>
                  <input
                    type="text"
                    value={patientForm.district}
                    onChange={(e) => setPatientForm({...patientForm, district: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Patient'}
              </button>
            </form>
          </div>
        )}

        {/* Triage Tab */}
        {activeTab === 'triage' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">🏥 Symptom Triage & Referral</h2>
            <form onSubmit={handleReferralSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient ID *</label>
                <input
                  type="text"
                  value={referralForm.patientId}
                  onChange={(e) => setReferralForm({...referralForm, patientId: e.target.value})}
                  required
                  placeholder="Enter patient ID from registration"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Symptoms *</label>
                <textarea
                  value={referralForm.patientDescription}
                  onChange={(e) => setReferralForm({...referralForm, patientDescription: e.target.value})}
                  required
                  rows="3"
                  placeholder="Describe patient symptoms..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Refer To *</label>
                  <select
                    value={referralForm.toFacilityId}
                    onChange={(e) => setReferralForm({...referralForm, toFacilityId: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select facility...</option>
                    {facilities.filter(f => f._id !== referralForm.fromFacilityId).map(f => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.facilityType})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={referralForm.patientLocation}
                    onChange={(e) => setReferralForm({...referralForm, patientLocation: e.target.value})}
                    placeholder="Patient location"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze & Create Referral'}
              </button>
            </form>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">📋 Referrals ({referrals.length})</h2>
            {referrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals created yet</p>
            ) : (
              <div className="space-y-3">
                {referrals.map(ref => (
                  <div key={ref._id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{ref.patientId?.name || 'Unknown'}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        ref.status === 'completed' ? 'bg-green-100 text-green-700' :
                        ref.status === 'in-transit' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ref.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{ref.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      To: {ref.toFacilityId?.name} | Severity: {ref.severity}
                    </p>
                    {ref.linkedIncident && (
                      <p className="text-xs text-red-600 mt-1">🚨 Emergency Incident Created</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Follow-ups Tab */}
        {activeTab === 'followups' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">📅 Due Follow-ups ({dueFollowUps.length})</h2>
            {dueFollowUps.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No due follow-ups</p>
            ) : (
              <div className="space-y-3">
                {dueFollowUps.map(fu => (
                  <div key={fu._id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{fu.patientId?.name}</span>
                      <span className="text-sm text-gray-500">
                        Due: {new Date(fu.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{fu.condition}</p>
                    <p className="text-xs text-gray-500">Type: {fu.scheduleType}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CHWDashboard;
