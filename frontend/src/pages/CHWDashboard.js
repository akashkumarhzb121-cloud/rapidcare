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
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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

  const fetchInitialData = async () => {
    try {
      const [facilitiesRes, followUpsRes] = await Promise.all([
        api.get('/api/facilities'),
        api.get('/api/followups/due')
      ]);
      setFacilities(facilitiesRes.data.facilities);
      setDueFollowUps(followUpsRes.data.followUps);
      
      if (user?.linkedFacilityId) {
        setReferralForm(prev => ({ ...prev, fromFacilityId: user.linkedFacilityId }));
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/patients', patientForm);
      setSuccess('Patient registered successfully!');
      setPatientForm({ name: '', age: '', gender: 'female', village: '', district: '', phone: '', languagePreference: 'hindi', chronicConditions: [], highRiskFlags: [] });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/referrals', referralForm);
      setSuccess(response.data.incident ? 'Emergency created!' : 'Referral created!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create referral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">RapidCare - Health Worker</h1>
          <div className="flex items-center space-x-3">
            <span>{user?.name}</span>
            <button onClick={logout} className="text-red-600">Logout</button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto flex space-x-1">
          {['register', 'triage', 'referrals', 'followups'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto py-6 px-4">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{success}</div>}

        {activeTab === 'register' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="font-bold mb-4">Register Patient</h2>
            <form onSubmit={handlePatientSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Name *" value={patientForm.name} onChange={(e) => setPatientForm({...patientForm, name: e.target.value})} required className="px-3 py-2 border rounded" />
                <input type="number" placeholder="Age *" value={patientForm.age} onChange={(e) => setPatientForm({...patientForm, age: e.target.value})} required className="px-3 py-2 border rounded" />
                <select value={patientForm.gender} onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})} className="px-3 py-2 border rounded">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
                <input type="text" placeholder="Village *" value={patientForm.village} onChange={(e) => setPatientForm({...patientForm, village: e.target.value})} required className="px-3 py-2 border rounded" />
                <input type="text" placeholder="District" value={patientForm.district} onChange={(e) => setPatientForm({...patientForm, district: e.target.value})} className="px-3 py-2 border rounded" />
                <input type="tel" placeholder="Phone" value={patientForm.phone} onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})} className="px-3 py-2 border rounded" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">Register</button>
            </form>
          </div>
        )}

        {activeTab === 'triage' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="font-bold mb-4">Symptom Triage</h2>
            <form onSubmit={handleReferralSubmit} className="space-y-4">
              <input type="text" placeholder="Patient ID *" value={referralForm.patientId} onChange={(e) => setReferralForm({...referralForm, patientId: e.target.value})} required className="w-full px-3 py-2 border rounded" />
              <textarea placeholder="Symptoms *" value={referralForm.patientDescription} onChange={(e) => setReferralForm({...referralForm, patientDescription: e.target.value})} required rows="3" className="w-full px-3 py-2 border rounded" />
              <select value={referralForm.toFacilityId} onChange={(e) => setReferralForm({...referralForm, toFacilityId: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">Select facility...</option>
                {facilities.filter(f => f._id !== referralForm.fromFacilityId).map(f => (
                  <option key={f._id} value={f._id}>{f.name} ({f.facilityType})</option>
                ))}
              </select>
              <input type="text" placeholder="Location" value={referralForm.patientLocation} onChange={(e) => setReferralForm({...referralForm, patientLocation: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">Analyze & Refer</button>
            </form>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="font-bold mb-4">Referrals ({referrals.length})</h2>
            {referrals.length === 0 ? <p>No referrals</p> : referrals.map(r => (
              <div key={r._id} className="border rounded p-3 mb-2">
                <p className="font-medium">{r.patientId?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-600">{r.reason}</p>
                <p className="text-xs text-gray-500">Status: {r.status} | Severity: {r.severity}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'followups' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="font-bold mb-4">Due Follow-ups ({dueFollowUps.length})</h2>
            {dueFollowUps.length === 0 ? <p>No due follow-ups</p> : dueFollowUps.map(fu => (
              <div key={fu._id} className="border rounded p-3 mb-2">
                <p className="font-medium">{fu.patientId?.name}</p>
                <p className="text-sm">{fu.condition}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CHWDashboard;
