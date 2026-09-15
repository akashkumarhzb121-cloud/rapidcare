import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  UserPlus, Stethoscope, ClipboardList, CalendarClock, Mic,
  CheckCircle2, AlertTriangle, Search, MapPin, Phone,
  User, Activity, Brain, HeartPulse, Baby, Users,
  ClipboardCheck, Clock, TrendingUp, Wifi, WifiOff, Video, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useOffline } from '../context/OfflineContext';
import api from '../services/api';
import { queueRequest, isOnline as checkOnline } from '../services/offlineQueue';
import LanguageSwitcher from '../components/LanguageSwitcher';
import VoiceInput from '../components/VoiceInput';
import OfflineBadge from '../components/OfflineBadge';
import TeleconsultRoom from '../components/TeleconsultRoom';

const CHWDashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { online, pendingCount, refreshPendingCount } = useOffline();

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

  // Teleconsult state
  const [teleconsults, setTeleconsults] = useState([]);
  const [queueEntries, setQueueEntries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentModal, setAppointmentModal] = useState(null);
  const [queueModal, setQueueModal] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '', patientName: '', facilityId: '', scheduledAt: '', department: 'general', reason: ''
  });
  const [queueForm, setQueueForm] = useState({
    patientId: '', patientName: '', facilityId: '', priority: 'normal', reason: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [teleconsultModal, setTeleconsultModal] = useState(null);
  const [teleconsultSearchResults, setTeleconsultSearchResults] = useState([]);
  const [teleconsultForm, setTeleconsultForm] = useState({
    patientId: '', symptoms: '', patientName: '', targetDoctorId: ''
  });
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    const query = teleconsultForm.patientName.trim();

    if (teleconsultForm.patientId || query.length < 2) {
      setTeleconsultSearchResults([]);
      return undefined;
    }

    if (!online) {
      setError('🔌 Offline — patient search requires internet');
      setTeleconsultSearchResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`/api/patients/search?q=${encodeURIComponent(query)}`);
        setTeleconsultSearchResults(response.data.patients || []);
      } catch (error) {
        console.error('Failed to search patients for teleconsult:', error);
        setError('Failed to search patients');
        setTeleconsultSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [teleconsultForm.patientName, teleconsultForm.patientId, online]);

  const [patientForm, setPatientForm] = useState({
    name: '', age: '', gender: 'female', village: '', district: '',
    phone: '', languagePreference: 'mr', chronicConditions: [], highRiskFlags: []
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
      socket.on('followUpCreated', () => fetchFollowUps());

      socket.on('teleconsultAccepted', () => {
        fetchTeleconsults();
        setSuccess('👨‍⚕️ Specialist accepted! Check the Teleconsult tab to join.');
      });
      socket.on('teleconsultStarted', () => {
        setSuccess('🎥 Call starting!');
        fetchTeleconsults();
      });
      socket.on('teleconsultCompleted', (data) => {
        fetchTeleconsults();
        setSuccess(`✅ Consultation completed. Prescription: ${data.prescription?.slice(0, 50)}...`);
        setTimeout(() => setSuccess(''), 8000);
      });
      socket.on('queueUpdated', () => fetchQueueForCHW());
      socket.on('appointmentUpdated', () => fetchMyAppointments());
      socket.on('appointmentBooked', () => fetchMyAppointments());

      return () => {
        socket.off('referralStatusChanged');
        socket.off('followUpCreated');
        socket.off('teleconsultAccepted');
        socket.off('teleconsultStarted');
        socket.off('teleconsultCompleted');
        socket.off('queueUpdated');
        socket.off('appointmentUpdated');
        socket.off('appointmentBooked');
      };

    }
  }, [socket, connected]);

  const fetchInitialData = async () => {
    try {
      const [facilitiesRes] = await Promise.all([
        api.get('/api/facilities').catch(() => ({ data: { facilities: [] } }))
      ]);
      setFacilities(facilitiesRes.data.facilities || []);

      if (user?.linkedFacilityId) {
        setReferralForm(prev => ({ ...prev, fromFacilityId: user.linkedFacilityId }));
      }

      await Promise.all([fetchReferrals(), fetchFollowUps(), fetchTeleconsults(), fetchQueueForCHW(), fetchMyAppointments()]);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchReferrals = async () => {
    if (!user?.linkedFacilityId) return;
    try {
      const response = await api.get(`/api/referrals/facility/${user.linkedFacilityId}?type=outgoing`);
      setReferrals(response.data.referrals);
    } catch (error) { console.error(error); }
  };

  const fetchFollowUps = async () => {
    try {
      const [dueRes, allRes] = await Promise.all([
        api.get('/api/followups/due').catch(() => ({ data: { followUps: [] } })),
        api.get('/api/followups/all').catch(() => ({ data: { followUps: [] } }))
      ]);
      setDueFollowUps(dueRes.data.followUps || []);
      setAllFollowUps(allRes.data.followUps || []);
    } catch (error) { console.error(error); }
  };

  const fetchTeleconsults = async () => {
    try {
      const res = await api.get('/api/teleconsults/my-requests');
      setTeleconsults(res.data.consults || []);
    } catch (e) { console.error(e); }
  };

  const fetchSpecialists = async () => {
    try {
      const res = await api.get('/api/teleconsults/specialists');
      setSpecialists(res.data.specialists || []);
    } catch (e) {
      console.error('Failed to load specialists:', e);
      setSpecialists([]);
    }
  };

  const fetchQueueForCHW = async () => {
    try {
      const res = await api.get('/api/queue/patient/all');
      setQueueEntries(res.data.entries || []);
    } catch (e) { console.error('Queue fetch error:', e); }
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await api.get('/api/appointments/my-upcoming');
      setAppointments(res.data.appointments || []);
    } catch (e) { console.error('Appointments fetch error:', e); }
  };

  const fetchSlotsForDate = async (facilityId, date) => {
    if (!facilityId || !date) { setAvailableSlots([]); return; }
    try {
      const res = await api.get(`/api/appointments/facility/${facilityId}/slots?date=${date}`);
      setAvailableSlots(res.data.slots || []);
    } catch (e) { console.error('Slots fetch error:', e); setAvailableSlots([]); }
  };

  const handleAddToQueue = async () => {
    if (!queueForm.patientId || !queueForm.facilityId) {
      setError('Patient and facility required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/queue', queueForm);
      setSuccess(`✅ ${res.data.message}`);
      setQueueModal(null);
      setQueueForm({ patientId: '', patientName: '', facilityId: '', priority: 'normal', reason: '' });
      await fetchQueueForCHW();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to queue');
    } finally { setLoading(false); }
  };

  const handleBookAppointment = async () => {
    if (!appointmentForm.patientId || !appointmentForm.facilityId || !appointmentForm.scheduledAt || !appointmentForm.reason.trim()) {
      setError('All appointment fields are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/appointments', appointmentForm);
      setSuccess('✅ Appointment booked successfully');
      setAppointmentModal(null);
      setAppointmentForm({ patientId: '', patientName: '', facilityId: '', scheduledAt: '', department: 'general', reason: '' });
      setAvailableSlots([]);
      await fetchMyAppointments();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment');
    } finally { setLoading(false); }
  };

  const handleSearchPatients = async () => {
    if (!searchQuery.trim()) return;
    if (!online) {
      setError('🔌 Offline — patient search requires internet');
      return;
    }
    try {
      const response = await api.get(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.patients);
    } catch (error) {
      setError('Failed to search patients');
    }
  };

  const handleModalPatientSearch = async (value) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      if (!online) {
        setError('🔌 Offline — patient search requires internet');
        return;
      }
      try {
        const response = await api.get(`/api/patients/search?q=${encodeURIComponent(value)}`);
        setSearchResults(response.data.patients || []);
      } catch (error) {
        setError('Failed to search patients');
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectPatient = (patient) => {
    setReferralForm(prev => ({ ...prev, patientId: patient._id }));
    setSearchResults([]);
    setSearchQuery(patient.name);
  };

  // ========== PATIENT REGISTRATION WITH OFFLINE SUPPORT ==========
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    const payload = {
      ...patientForm,
      _offlineClientId: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    };

    try {
      if (checkOnline()) {
        // Online — direct API call
        const response = await api.post('/api/patients', payload);
        const newPatient = response.data.patient;
        setSuccess(`✅ ${t('chw.patientRegistered')} (${newPatient.name})`);
        setRegisteredPatients(prev => [newPatient, ...prev]);
        setReferralForm(prev => ({ ...prev, patientId: newPatient._id }));
      } else {
        // Offline — queue it
        await queueRequest('/api/patients', 'POST', payload, { type: 'patient' });
        await refreshPendingCount();
        setSuccess(`📦 ${t('common.saved', 'Saved')} offline — will sync when connected`);
        // Add a temporary placeholder to the recent list
        setRegisteredPatients(prev => [{
          _id: `pending-${Date.now()}`,
          ...patientForm,
          _pending: true
        }, ...prev]);
      }

      // Reset form
      setPatientForm({
        name: '', age: '', gender: 'female', village: '', district: '',
        phone: '', languagePreference: 'mr', chronicConditions: [], highRiskFlags: []
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register patient');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  // ========== REFERRAL CREATION WITH OFFLINE FALLBACK ==========
  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    // Patient ID must be a real ObjectId — offline-queued patients can't be referred yet
    if (referralForm.patientId?.startsWith('pending-')) {
      setError('⏳ This patient is queued offline. Wait for sync before referring.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...referralForm, forceEmergency };

      if (checkOnline()) {
        const response = await api.post('/api/referrals', payload);
        if (response.data.isEmergency) {
          setSuccess('🚨 CRITICAL! Emergency incident created and ambulance will be dispatched.');
        } else {
          setSuccess('✅ Referral created successfully!');
        }
        await fetchReferrals();
        setReferralForm(prev => ({ ...prev, patientId: '', patientDescription: '', patientLocation: '' }));
        setSearchQuery('');
        setForceEmergency(false);
      } else {
        // Offline referral — queue it
        await queueRequest('/api/referrals', 'POST', payload, { type: 'referral' });
        await refreshPendingCount();
        setSuccess('📦 Referral queued offline — will sync when connected');
        setReferralForm(prev => ({ ...prev, patientId: '', patientDescription: '', patientLocation: '' }));
        setSearchQuery('');
        setForceEmergency(false);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create referral');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 6000);
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
    if (!online) {
      setError('🔌 Offline — follow-up actions require internet');
      return;
    }
    try {
      await api.patch(`/api/followups/${followUpId}/complete`, { notes: 'Completed by CHW' });
      setSuccess('✅ Follow-up marked as complete');
      fetchFollowUps();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to complete follow-up');
    }
  };

  // ========== TELECONSULT REQUEST ==========
  const handleRequestTeleconsult = async () => {
    if (!teleconsultForm.patientId || !teleconsultForm.symptoms.trim()) {
      setError('Patient and symptoms are required');
      return;
    }
    if (!teleconsultForm.targetDoctorId) {
      setError('Please select a specialist doctor');
      return;
    }
    if (!online) {
      setError('🔌 Teleconsultation requires internet');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/teleconsults', {
        patientId: teleconsultForm.patientId,
        symptoms: teleconsultForm.symptoms,
        targetDoctorId: teleconsultForm.targetDoctorId
      });
      const doctorName = res.data.targetDoctor?.name || 'specialist';
      setSuccess(`✅ Request sent to ${doctorName}. Waiting for acceptance...`);
      setTeleconsultModal(null);
      setTeleconsultForm({ patientId: '', symptoms: '', patientName: '', targetDoctorId: '' });
      setSelectedSpecialist(null);
      await fetchTeleconsults();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request teleconsult');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      initiated: 'bg-slate-100 text-slate-700',
      'in-transit': 'bg-amber-100 text-amber-700',
      received: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const TABS = [
    { id: 'register', label: t('chw.registerTab'), icon: UserPlus, color: 'from-emerald-500 to-teal-600' },
    { id: 'triage', label: t('chw.triageTab'), icon: Stethoscope, color: 'from-sky-500 to-blue-600' },
    { id: 'referrals', label: `${t('chw.referralsTab')} (${referrals.length})`, icon: ClipboardList, color: 'from-violet-500 to-purple-600' },
    { id: 'followups', label: `${t('chw.followupsTab')} (${allFollowUps.length})`, icon: CalendarClock, color: 'from-orange-500 to-rose-600' },
    { id: 'teleconsult', label: `${t('teleconsult.title', 'Teleconsult')} (${teleconsults.length})`, icon: Video, color: 'from-teal-500 to-cyan-600' },
    { id: 'appointments', label: `📅 Appointments (${appointments.length})`, icon: CalendarClock, color: 'from-rose-500 to-pink-600' },
    { id: 'queue', label: '🎫 Queue', icon: Users, color: 'from-indigo-500 to-blue-600' },
  ];

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm sticky top-0">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/30">
              <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-success">{t('common.appName')}</h1>
              <p className="text-xs text-slate-500">{t('roles.chw')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <OfflineBadge />
            <LanguageSwitcher variant="dropdown" />
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 font-medium">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative z-10 bg-white/60 backdrop-blur-sm border-b border-white/60">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto px-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                  active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto py-6 px-4">
        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center"
            >
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 flex items-center"
            >
              <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== REGISTER TAB ========== */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl mr-3">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  {t('chw.registerPatient')}
                </h2>
                {!online && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-300">
                    <WifiOff className="w-3 h-3 mr-1.5" />
                    {t('common.offline', 'Offline')} — {t('common.saved', 'will save locally')}
                  </span>
                )}
              </div>

              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientName')} *</label>
                    <input type="text" value={patientForm.name}
                      onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                      required placeholder="e.g., Lakshmi Patil"
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientAge')} *</label>
                    <input type="number" value={patientForm.age}
                      onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                      required min="0" max="120"
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientGender')} *</label>
                    <select value={patientForm.gender}
                      onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                      className="input-modern">
                      <option value="female">{t('chw.female')}</option>
                      <option value="male">{t('chw.male')}</option>
                      <option value="other">{t('chw.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientVillage')} *</label>
                    <input type="text" value={patientForm.village}
                      onChange={(e) => setPatientForm({...patientForm, village: e.target.value})}
                      required placeholder="e.g., Uruli Kanchan"
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientDistrict')}</label>
                    <input type="text" value={patientForm.district}
                      onChange={(e) => setPatientForm({...patientForm, district: e.target.value})}
                      placeholder="e.g., Pune"
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientPhone')}</label>
                    <input type="tel" value={patientForm.phone}
                      onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                      placeholder="+91-XXXXXXXXXX"
                      className="input-modern" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.chronicConditions')}</label>
                  <div className="flex flex-wrap gap-2">
                    {['diabetes', 'hypertension', 'asthma', 'heart_disease', 'tuberculosis'].map(cond => (
                      <button key={cond} type="button"
                        onClick={() => handleCheckboxChange('chronicConditions', cond)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          patientForm.chronicConditions?.includes(cond)
                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}>
                        {t(`chw.${cond.replace('_', '')}`, cond.replace('_', ' '))}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.highRiskFlags')}</label>
                  <div className="flex flex-wrap gap-2">
                    {['pregnancy', 'child_under_5', 'elderly', 'chronic', 'post_surgery'].map(flag => (
                      <button key={flag} type="button"
                        onClick={() => handleCheckboxChange('highRiskFlags', flag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          patientForm.highRiskFlags?.includes(flag)
                            ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}>
                        {t(`chw.${flag.replace(/_/g, '')}`, flag.replace(/_/g, ' '))}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="btn-gradient-success w-full py-3.5 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>⏳ {t('common.loading')}</>
                  ) : (
                    <>
                      {online ? <CheckCircle2 className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                      {online ? t('chw.registerPatient') : `${t('chw.registerPatient')} (Offline)`}
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Recently Registered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-bold mb-4">{t('chw.recentlyRegistered')}</h2>
              {registeredPatients.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">{t('chw.noPatientsYet')}</p>
              ) : (
                <div className="space-y-2">
                  {registeredPatients.map(p => (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border ${
                        p._pending
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-600">{p.age} yrs • {p.village}</p>
                        </div>
                        {p._pending ? (
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                            ⏳ Pending
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700">✓ {t('chw.readyForTriage')}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ========== TRIAGE TAB ========== */}
        {activeTab === 'triage' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center">
                <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl mr-3">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                {t('chw.triageTab')}
              </h2>
            </div>

            <form onSubmit={handleReferralSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('chw.searchPatient')} *</label>
                <div className="flex space-x-2">
                  <input type="text" value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length > 2) handleSearchPatients(); }}
                    placeholder={t('chw.searchPlaceholder')}
                    className="input-modern flex-1" />
                  <button type="button" onClick={handleSearchPatients}
                    className="btn-gradient-primary px-6 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    {t('common.search')}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-xl max-h-48 overflow-y-auto bg-white shadow-lg">
                    {searchResults.map(p => (
                      <button key={p._id} type="button" onClick={() => handleSelectPatient(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-sky-50 border-b border-slate-100 last:border-b-0">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.age} yrs • {p.village}</p>
                      </button>
                    ))}
                  </div>
                )}

                {referralForm.patientId && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t('chw.patientSelected')}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold">{t('chw.symptoms')} *</label>
                  <VoiceInput
                    onTranscript={(text) => setReferralForm({...referralForm, patientDescription: text})}
                    currentValue={referralForm.patientDescription}
                  />
                </div>
                <textarea value={referralForm.patientDescription}
                  onChange={(e) => setReferralForm({...referralForm, patientDescription: e.target.value})}
                  required rows="4"
                  placeholder={t('chw.symptomsPlaceholder')}
                  className="input-modern resize-none" />
              </div>

              {/* Emergency toggle */}
              <div className={`rounded-2xl p-4 border-2 transition-all ${
                forceEmergency ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.span
                      animate={forceEmergency ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.5, repeat: forceEmergency ? Infinity : 0 }}
                      className="text-3xl"
                    >
                      🚨
                    </motion.span>
                    <div>
                      <p className="font-bold text-slate-800">{t('chw.markAsEmergency')}</p>
                      <p className="text-xs text-slate-600">{t('chw.emergencyDescription')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForceEmergency(!forceEmergency)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                      forceEmergency ? 'bg-red-600' : 'bg-slate-300'
                    }`}
                  >
                    <motion.span
                      layout
                      className="inline-block h-6 w-6 transform rounded-full bg-white shadow"
                      animate={{ x: forceEmergency ? 36 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                {forceEmergency && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 text-sm text-red-700 font-semibold bg-red-100 p-2 rounded-lg"
                  >
                    ⚠️ {t('chw.emergencyOn')}
                  </motion.p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.referToFacility')} *</label>
                  <select value={referralForm.toFacilityId}
                    onChange={(e) => setReferralForm({...referralForm, toFacilityId: e.target.value})}
                    required
                    className="input-modern">
                    <option value="">{t('chw.selectFacility')}</option>
                    {facilities.filter(f => f._id !== referralForm.fromFacilityId).map(f => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.facilityType}) — {f.availableBeds} {t('operator.beds')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.patientLocation')}</label>
                  <input type="text" value={referralForm.patientLocation}
                    onChange={(e) => setReferralForm({...referralForm, patientLocation: e.target.value})}
                    placeholder="e.g., Uruli Kanchan, Pune"
                    className="input-modern" />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !referralForm.patientId}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  forceEmergency ? 'btn-gradient-danger' : 'btn-gradient-primary'
                } disabled:opacity-50`}
              >
                {loading ? (
                  <>{t('chw.analyzing')}</>
                ) : forceEmergency ? (
                  <>{t('chw.createEmergency')}</>
                ) : (
                  <>{t('chw.analyzeAndRefer')}</>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* ========== REFERRALS TAB ========== */}
        {activeTab === 'referrals' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">{t('chw.referralsTab')} ({referrals.length})</h2>
            {referrals.length === 0 ? (
              <p className="text-slate-500 text-center py-8">{t('chw.noPatientsYet')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.map(ref => (
                  <div key={ref._id} className={`border-2 rounded-2xl p-4 ${
                    ref.isEmergencyFlagged ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ref.patientId?.name || 'Unknown'}</span>
                        {ref.isEmergencyFlagged && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">🚨</span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ref.status)}`}>
                        {t(`referral.${ref.status}`, ref.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1 line-clamp-2">{ref.reason}</p>
                    <p className="text-xs text-slate-500">→ {ref.toFacilityId?.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ref.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        ref.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t(`triage.${ref.severity}`, ref.severity)}
                      </span>
                      {ref.linkedIncident && (
                        <span className="text-xs text-red-600 font-medium">🚑 {t('emergency.alert')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ========== FOLLOW-UPS TAB ========== */}
        {activeTab === 'followups' && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                {t('chw.followUpsDue')} ({dueFollowUps.length})
              </h2>
              {dueFollowUps.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-slate-500">{t('chw.noFollowUps')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dueFollowUps.map(fu => (
                    <div key={fu._id} className="border-l-4 border-amber-500 bg-amber-50/60 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{fu.patientId?.name}</p>
                          <p className="text-sm text-slate-700 mt-1">{fu.condition}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            📍 {fu.patientId?.village} • 📞 {fu.patientId?.phone || 'N/A'}
                          </p>
                        </div>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                          {t(`followUp.${fu.priority}`, fu.priority)}
                        </span>
                      </div>
                      <button onClick={() => handleCompleteFollowUp(fu._id)}
                        disabled={!online}
                        className="mt-3 w-full btn-gradient-success py-2 text-sm disabled:opacity-50">
                        ✅ {t('chw.markComplete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">{t('chw.allFollowUps')} ({allFollowUps.length})</h2>
              {allFollowUps.length === 0 ? (
                <p className="text-slate-500 text-center py-8">{t('chw.noFollowUps')}</p>
              ) : (
                <div className="space-y-2">
                  {allFollowUps.map(fu => (
                    <div key={fu._id} className={`border rounded-xl p-3 ${
                      fu.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{fu.patientId?.name}</p>
                          <p className="text-xs text-slate-600">{fu.condition}</p>
                          <p className="text-xs text-slate-500">{t('chw.dueDate')}: {new Date(fu.dueDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          fu.status === 'completed' ? 'bg-emerald-600 text-white' :
                          fu.status === 'missed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {fu.status === 'completed' ? '✅ ' : ''}{t(`followUp.${fu.status}`, fu.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ========== TELECONSULT TAB ========== */}
        {activeTab === 'teleconsult' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-2 rounded-xl mr-3">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  Video Consultation Requests
                </h2>
                <button
                  onClick={() => {
                    setTeleconsultModal('new');
                    setTeleconsultSearchResults([]);
                    setSelectedSpecialist(null);
                    setTeleconsultForm({ patientId: '', symptoms: '', patientName: '', targetDoctorId: '' });
                    fetchSpecialists();
                  }}
                  className="btn-gradient-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Request
                </button>
              </div>

              {teleconsults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">📹</div>
                  <p className="text-slate-500">No teleconsultations requested yet</p>
                  <p className="text-slate-400 text-sm mt-1">Connect your patient with a specialist</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teleconsults.map(tc => (
                    <div key={tc._id} className="border-2 rounded-2xl p-4 border-slate-200 bg-white hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold">{tc.patientId?.name}</p>
                          <p className="text-xs text-slate-500">
                            {tc.patientId?.age} yrs · {tc.patientId?.village}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tc.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                          tc.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                          tc.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          tc.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {tc.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 line-clamp-2">{tc.symptoms}</p>
                      {tc.doctorId ? (
                        <p className="text-xs text-teal-700 mb-2 flex items-center">
                          👨‍⚕️ <strong className="ml-1">{tc.doctorId.name}</strong>
                          <span className="ml-1 text-slate-500 capitalize">({tc.doctorId.specialization})</span>
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mb-2 italic">
                          ⏳ Waiting for specialist assignment
                        </p>
                      )}
                      {tc.status === 'completed' && (
                        <>
                          {tc.diagnosis && (
                            <div className="bg-slate-50 rounded-lg p-2 mt-2">
                              <p className="text-xs font-semibold text-slate-700">🩺 Diagnosis:</p>
                              <p className="text-xs text-slate-800">{tc.diagnosis}</p>
                            </div>
                          )}
                          {tc.prescription && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 mt-2">
                              <p className="text-xs font-semibold text-emerald-700 flex items-center">
                                <span className="mr-1">💊</span> Prescription
                                <span className="ml-2 text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full">READY</span>
                              </p>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap mt-1">{tc.prescription}</p>
                            </div>
                          )}
                          {tc.notes && (
                            <div className="bg-sky-50 rounded-lg p-2 mt-2">
                              <p className="text-xs font-semibold text-sky-700">📝 Doctor's Notes:</p>
                              <p className="text-xs text-slate-700">{tc.notes}</p>
                            </div>
                          )}
                        </>
                      )}
                      {tc.status === 'accepted' && (
                        <button
                          onClick={() => setActiveRoom({ roomId: tc.roomId, patientName: tc.patientId?.name })}
                          className="mt-3 w-full btn-gradient-success py-2 text-sm flex items-center justify-center gap-2"
                        >
                          <Video className="w-4 h-4" /> Join Call
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center"><CalendarClock className="w-5 h-5 mr-2 text-rose-600" /> Upcoming Appointments ({appointments.length})</h2>
                <button onClick={() => { setAppointmentModal('new'); setAvailableSlots([]); }} className="btn-gradient-primary px-4 py-2 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Book Appointment</button>
              </div>
              {appointments.length ? <div className="space-y-3">{appointments.map(apt => (
                <div key={apt._id} className="border-2 border-slate-200 rounded-2xl p-4 bg-white">
                  <div className="flex justify-between items-start"><div><p className="font-bold">{apt.patientId?.name}</p><p className="text-xs text-slate-500">{apt.patientId?.age} yrs · {apt.patientId?.village}</p><p className="text-xs text-slate-600 mt-1">🏥 {apt.facilityId?.name}</p><p className="text-xs text-slate-600 mt-1">📋 {apt.reason}</p></div><div className="text-right"><p className="text-lg font-bold text-rose-600">{new Date(apt.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p><p className="text-sm text-slate-600">{new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{apt.department}</span></div></div>
                </div>
              ))}</div> : <div className="text-center py-12"><div className="text-6xl mb-3">📅</div><p className="text-slate-500">No upcoming appointments</p></div>}
            </div>
          </motion.div>
        )}

        {activeTab === 'queue' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold flex items-center"><Users className="w-5 h-5 mr-2 text-indigo-600" /> Live OPD Queue</h2><button onClick={() => setQueueModal('new')} className="btn-gradient-primary px-4 py-2 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add to Queue</button></div>
              {queueEntries.length ? <div className="space-y-3">{queueEntries.map(entry => (
                <div key={entry._id} className="border-2 border-slate-200 rounded-2xl p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">{entry.tokenNumber}</div><div><p className="font-bold">{entry.patientId?.name}</p><p className="text-xs text-slate-500">{entry.facilityId?.name}</p></div></div><div className="text-right"><span className="text-xs px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">{entry.status}</span>{entry.position && <p className="text-xs text-slate-600 mt-1">Position {entry.position} · ~{entry.estimatedWaitMinutes} min</p>}</div></div></div>
              ))}</div> : <div className="text-center py-12"><div className="text-6xl mb-3">🎫</div><p className="text-slate-500">No patients currently in queue</p></div>}
            </div>
          </motion.div>
        )}
      </main>

      {/* Teleconsult Request Modal */}
      <AnimatePresence>
        {teleconsultModal === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Video className="w-5 h-5 mr-2 text-teal-600" />
                Request Video Consultation
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold mr-1.5">1</span>
                    Select Patient *
                  </label>
                  <input
                    type="text"
                    value={teleconsultForm.patientName}
                    onChange={(e) => setTeleconsultForm({
                      ...teleconsultForm,
                      patientName: e.target.value,
                      patientId: ''
                    })}
                    placeholder="Type patient name (min 2 characters)"
                    className="input-modern"
                  />
                  {teleconsultSearchResults.length > 0 && !teleconsultForm.patientId && (
                    <div className="mt-2 border border-slate-200 rounded-xl max-h-40 overflow-y-auto bg-white shadow-lg">
                      {teleconsultSearchResults.map(p => (
                        <button key={p._id} type="button"
                          onClick={() => {
                            setTeleconsultForm({...teleconsultForm, patientId: p._id, patientName: p.name});
                            setTeleconsultSearchResults([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-teal-50 border-b border-slate-100 last:border-b-0">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.age} yrs · {p.village}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {teleconsultForm.patientId && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Patient selected
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold mr-1.5">2</span>
                    Describe Symptoms *
                  </label>
                  <div className="flex items-center justify-end mb-2">
                    <VoiceInput
                      onTranscript={(text) => setTeleconsultForm(prev => ({ ...prev, symptoms: text }))}
                      currentValue={teleconsultForm.symptoms}
                    />
                  </div>
                  <textarea
                    value={teleconsultForm.symptoms}
                    onChange={(e) => setTeleconsultForm({...teleconsultForm, symptoms: e.target.value})}
                    rows="3"
                    placeholder="Describe the symptoms for the specialist..."
                    className="input-modern resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold mr-1.5">3</span>
                    Select Specialist Doctor *
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Choose a doctor to send the consultation request to
                  </p>
                  {specialists.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <strong>⚠️ No specialists available.</strong> Please ask your admin to add specialist doctors.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {specialists.map(doc => {
                        const isSelected = teleconsultForm.targetDoctorId === doc._id;
                        const specIcons = {
                          cardiac: '❤️',
                          trauma: '🩹',
                          respiratory: '🫁',
                          general: '🩺',
                          neurology: '🧠',
                          pediatric: '👶',
                          maternal: '🤰',
                          orthopedic: '🦴',
                        };
                        return (
                          <motion.button
                            key={doc._id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setTeleconsultForm(prev => ({ ...prev, targetDoctorId: doc._id }));
                              setSelectedSpecialist(doc);
                            }}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/20'
                                : 'border-slate-200 bg-white hover:border-teal-300'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="text-2xl flex-shrink-0">{specIcons[doc.specialization] || '🩺'}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-sm truncate">{doc.name}</p>
                                <p className="text-xs text-teal-700 font-medium capitalize">
                                  {doc.specialization} Specialist
                                </p>
                                {doc.linkedFacilityId?.name && (
                                  <p className="text-xs text-slate-500 truncate mt-0.5">
                                    🏥 {doc.linkedFacilityId.name}
                                  </p>
                                )}
                                {isSelected && (
                                  <p className="text-xs text-teal-700 mt-1 flex items-center font-semibold">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Selected
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedSpecialist && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-teal-800 mb-1">Request will be sent to:</p>
                    <p className="text-sm font-bold text-slate-900">{selectedSpecialist.name}</p>
                    <p className="text-xs text-slate-600 capitalize">
                      {selectedSpecialist.specialization} Specialist · {selectedSpecialist.email}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => {
                  setTeleconsultModal(null);
                  setTeleconsultSearchResults([]);
                  setSelectedSpecialist(null);
                }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleRequestTeleconsult}
                  disabled={loading || !teleconsultForm.patientId || !teleconsultForm.symptoms.trim() || !teleconsultForm.targetDoctorId}
                  className="flex-1 btn-gradient-success py-2.5 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {queueModal === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-indigo-600" /> Add Patient to Queue</h3>
              <div className="space-y-4">
                <input type="text" value={queueForm.patientName} onChange={e => { setQueueForm({ ...queueForm, patientName: e.target.value, patientId: '' }); handleModalPatientSearch(e.target.value); }} placeholder="Type patient name" className="input-modern" />
                {searchResults.length > 0 && !queueForm.patientId && <div className="border rounded-xl max-h-32 overflow-y-auto">{searchResults.map(p => <button key={p._id} type="button" onClick={() => { setQueueForm({ ...queueForm, patientId: p._id, patientName: p.name }); setSearchResults([]); }} className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b"><p className="font-medium">{p.name}</p><p className="text-xs text-slate-500">{p.age} yrs · {p.village}</p></button>)}</div>}
                <select value={queueForm.facilityId} onChange={e => setQueueForm({ ...queueForm, facilityId: e.target.value })} className="input-modern"><option value="">Select facility...</option>{facilities.map(f => <option key={f._id} value={f._id}>{f.name} ({f.facilityType})</option>)}</select>
                <select value={queueForm.priority} onChange={e => setQueueForm({ ...queueForm, priority: e.target.value })} className="input-modern"><option value="normal">Normal</option><option value="high">High</option><option value="emergency">Emergency</option></select>
                <input type="text" value={queueForm.reason} onChange={e => setQueueForm({ ...queueForm, reason: e.target.value })} placeholder="Chief complaint" className="input-modern" />
              </div>
              <div className="mt-6 flex gap-3"><button onClick={() => setQueueModal(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold">Cancel</button><button onClick={handleAddToQueue} disabled={loading} className="flex-1 btn-gradient-success py-2.5">{loading ? 'Adding...' : 'Add to Queue'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appointmentModal === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center"><CalendarClock className="w-5 h-5 mr-2 text-rose-600" /> Book Appointment</h3>
              <div className="space-y-4">
                <input type="text" value={appointmentForm.patientName} onChange={e => { setAppointmentForm({ ...appointmentForm, patientName: e.target.value, patientId: '' }); handleModalPatientSearch(e.target.value); }} placeholder="Type patient name" className="input-modern" />
                {searchResults.length > 0 && !appointmentForm.patientId && <div className="border rounded-xl max-h-32 overflow-y-auto">{searchResults.map(p => <button key={p._id} type="button" onClick={() => { setAppointmentForm({ ...appointmentForm, patientId: p._id, patientName: p.name }); setSearchResults([]); }} className="w-full text-left px-4 py-2 hover:bg-rose-50 border-b"><p className="font-medium">{p.name}</p><p className="text-xs text-slate-500">{p.age} yrs · {p.village}</p></button>)}</div>}
                <select value={appointmentForm.facilityId} onChange={e => setAppointmentForm({ ...appointmentForm, facilityId: e.target.value })} className="input-modern"><option value="">Select facility...</option>{facilities.map(f => <option key={f._id} value={f._id}>{f.name} — {f.district}</option>)}</select>
                <input type="date" min={new Date().toISOString().split('T')[0]} onChange={e => { setAppointmentForm({ ...appointmentForm, scheduledAt: '' }); fetchSlotsForDate(appointmentForm.facilityId, e.target.value); }} className="input-modern" />
                {availableSlots.length > 0 && <div className="grid grid-cols-4 gap-2">{availableSlots.map(slot => <button key={slot.time} type="button" disabled={!slot.available} onClick={() => setAppointmentForm({ ...appointmentForm, scheduledAt: slot.time })} className={`py-2 rounded-lg text-xs font-semibold ${appointmentForm.scheduledAt === slot.time ? 'bg-rose-500 text-white' : slot.available ? 'bg-slate-100 hover:bg-rose-100' : 'bg-slate-50 text-slate-300 line-through'}`}>{slot.display}</button>)}</div>}
                <select value={appointmentForm.department} onChange={e => setAppointmentForm({ ...appointmentForm, department: e.target.value })} className="input-modern"><option value="general">General</option><option value="cardiac">Cardiac</option><option value="pediatric">Pediatric</option><option value="maternal">Maternal</option><option value="orthopedic">Orthopedic</option></select>
                <textarea value={appointmentForm.reason} onChange={e => setAppointmentForm({ ...appointmentForm, reason: e.target.value })} rows="2" placeholder="Purpose of visit" className="input-modern resize-none" />
              </div>
              <div className="mt-6 flex gap-3"><button onClick={() => setAppointmentModal(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold">Cancel</button><button onClick={handleBookAppointment} disabled={loading} className="flex-1 btn-gradient-success py-2.5">{loading ? 'Booking...' : 'Book Appointment'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Room */}
      <AnimatePresence>
        {activeRoom && (
          <TeleconsultRoom
            roomId={activeRoom.roomId}
            onClose={() => setActiveRoom(null)}
            patientName={activeRoom.patientName}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CHWDashboard;