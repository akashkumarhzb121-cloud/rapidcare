import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  UserPlus, Stethoscope, ClipboardList, CalendarClock,
  CheckCircle2, AlertTriangle, Search,
  Users, Clock, WifiOff, Video, Plus, FlaskConical,
  FileText, Bell, LogOut
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
import DashboardSidebar from '../components/DashboardSidebar';

const CHWDashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { online, refreshPendingCount } = useOffline();

  const [activeTab, setActiveTab] = useState('register');
  const [facilities, setFacilities] = useState([]);
  const [dueFollowUps, setDueFollowUps] = useState([]);
  const [allFollowUps, setAllFollowUps] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [forceEmergency, setForceEmergency] = useState(false);

  // Referral patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Modal patient search (used by queue/appointment/diagnostic modals)
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState([]);

  // Teleconsult
  const [teleconsults, setTeleconsults] = useState([]);
  const [teleconsultModal, setTeleconsultModal] = useState(null);
  const [teleconsultSearchResults, setTeleconsultSearchResults] = useState([]);
  const [teleconsultForm, setTeleconsultForm] = useState({
    patientId: '', symptoms: '', patientName: '', targetDoctorId: ''
  });
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);

  // Queue
  const [queueEntries, setQueueEntries] = useState([]);
  const [queueModal, setQueueModal] = useState(null);
  const [queueForm, setQueueForm] = useState({
    patientId: '', patientName: '', facilityId: '', priority: 'normal', reason: ''
  });

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [appointmentModal, setAppointmentModal] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '', patientName: '', facilityId: '', scheduledAt: '',
    department: 'general', reason: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  // Diagnostics
  const [diagnosticOrders, setDiagnosticOrders] = useState([]);
  const [diagnosticCatalog, setDiagnosticCatalog] = useState([]);
  const [diagnosticModal, setDiagnosticModal] = useState(null);
  const [diagnosticForm, setDiagnosticForm] = useState({
    patientId: '', patientName: '', facilityId: '', tests: [], reason: '', priority: 'normal'
  });

  const [patientForm, setPatientForm] = useState({
    name: '', age: '', gender: 'female', village: '', district: '',
    phone: '', languagePreference: 'mr', chronicConditions: [], highRiskFlags: []
  });

  const [referralForm, setReferralForm] = useState({
    patientId: '', fromFacilityId: '', toFacilityId: '',
    patientDescription: '', patientLocation: ''
  });

  // Teleconsult debounced search
  useEffect(() => {
    const query = teleconsultForm.patientName.trim();
    if (teleconsultForm.patientId || query.length < 2) {
      setTeleconsultSearchResults([]);
      return undefined;
    }
    if (!online) { setTeleconsultSearchResults([]); return undefined; }
    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`/api/patients/search?q=${encodeURIComponent(query)}`);
        setTeleconsultSearchResults(response.data.patients || []);
      } catch (e) { setTeleconsultSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [teleconsultForm.patientName, teleconsultForm.patientId, online]);

  // Modal debounced search (queue/appointment/diagnostic)
  useEffect(() => {
    const query = modalSearchQuery.trim();
    if (query.length < 2) {
      setModalSearchResults([]);
      return undefined;
    }
    if (!online) { setModalSearchResults([]); return undefined; }
    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`/api/patients/search?q=${encodeURIComponent(query)}`);
        setModalSearchResults(response.data.patients || []);
      } catch (e) { setModalSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [modalSearchQuery, online]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.emit('joinUserRoom', user.id);

      socket.on('referralStatusChanged', () => {
        fetchReferrals(); fetchFollowUps();
        setSuccess('📋 Referral status updated!');
        setTimeout(() => setSuccess(''), 3000);
      });
      socket.on('followUpCreated', () => fetchFollowUps());
      socket.on('teleconsultAccepted', () => {
        fetchTeleconsults();
        setSuccess('👨‍⚕️ Specialist accepted! Check Teleconsult tab.');
      });
      socket.on('teleconsultStarted', () => { setSuccess('🎥 Call starting!'); fetchTeleconsults(); });
      socket.on('teleconsultCompleted', (data) => {
        fetchTeleconsults();
        setSuccess(`✅ Consultation completed. Prescription: ${data.prescription?.slice(0, 50)}...`);
      });
      socket.on('diagnosticReportReady', (data) => {
        fetchDiagnosticOrders();
        setSuccess(`🔬 Report ready for ${data.testName}!`);
        setTimeout(() => setSuccess(''), 8000);
      });
      socket.on('diagnosticOrderUpdated', () => fetchDiagnosticOrders());

      return () => {
        socket.off('referralStatusChanged');
        socket.off('followUpCreated');
        socket.off('teleconsultAccepted');
        socket.off('teleconsultStarted');
        socket.off('teleconsultCompleted');
        socket.off('diagnosticReportReady');
        socket.off('diagnosticOrderUpdated');
      };
    }
  }, [socket, connected, user?.id]);

  const fetchInitialData = async () => {
    try {
      const [facilitiesRes, catalogRes] = await Promise.all([
        api.get('/api/facilities').catch(() => ({ data: { facilities: [] } })),
        api.get('/api/diagnostics/catalog').catch(() => ({ data: { catalog: [] } }))
      ]);
      setFacilities(facilitiesRes.data.facilities || []);
      setDiagnosticCatalog(catalogRes.data.catalog || []);

      if (user?.linkedFacilityId) {
        setReferralForm(prev => ({ ...prev, fromFacilityId: user.linkedFacilityId }));
      }

      await Promise.all([
        fetchReferrals(), fetchFollowUps(), fetchTeleconsults(),
        fetchMyAppointments(), fetchDiagnosticOrders()
      ]);
    } catch (error) {
      console.error('Init error:', error);
    }
  };

  const fetchReferrals = async () => {
    if (!user?.linkedFacilityId) return;
    try {
      const response = await api.get(`/api/referrals/facility/${user.linkedFacilityId}?type=outgoing`);
      setReferrals(response.data.referrals);
    } catch (e) { console.error(e); }
  };

  const fetchFollowUps = async () => {
    try {
      const [dueRes, allRes] = await Promise.all([
        api.get('/api/followups/due').catch(() => ({ data: { followUps: [] } })),
        api.get('/api/followups/all').catch(() => ({ data: { followUps: [] } }))
      ]);
      setDueFollowUps(dueRes.data.followUps || []);
      setAllFollowUps(allRes.data.followUps || []);
    } catch (e) { console.error(e); }
  };

  const fetchTeleconsults = async () => {
    try {
      const res = await api.get('/api/teleconsults/my-requests');
      setTeleconsults(res.data.consults || []);
    } catch (e) { console.error(e); }
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await api.get('/api/appointments/my-upcoming');
      setAppointments(res.data.appointments || []);
    } catch (e) { console.error(e); }
  };

  const fetchDiagnosticOrders = async () => {
    try {
      const res = await api.get('/api/diagnostics/my-orders');
      setDiagnosticOrders(res.data.orders || []);
    } catch (e) { console.error(e); }
  };

  const fetchSpecialists = async () => {
    try {
      const res = await api.get('/api/teleconsults/specialists');
      setSpecialists(res.data.specialists || []);
    } catch (e) { setSpecialists([]); }
  };

  const fetchSlotsForDate = async (facilityId, date) => {
    if (!facilityId || !date) { setAvailableSlots([]); return; }
    try {
      const res = await api.get(`/api/appointments/facility/${facilityId}/slots?date=${date}`);
      setAvailableSlots(res.data.slots || []);
    } catch (e) { setAvailableSlots([]); }
  };

  // Referral tab search
  const handleSearchPatients = async () => {
    if (!searchQuery.trim()) return;
    if (!online) { setError('🔌 Offline — patient search requires internet'); return; }
    try {
      const response = await api.get(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.patients);
    } catch (error) { setError('Failed to search patients'); }
  };

  const handleSelectPatient = (patient) => {
    setReferralForm(prev => ({ ...prev, patientId: patient._id }));
    setSearchResults([]);
    setSearchQuery(patient.name);
  };

  // Modal search helper (queue, appointment, diagnostic)
  const handleModalPatientSearch = (value) => {
    setModalSearchQuery(value);
  };

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
        const response = await api.post('/api/patients', payload);
        const newPatient = response.data.patient;
        setSuccess(`✅ ${t('chw.patientRegistered')} (${newPatient.name})`);
        setRegisteredPatients(prev => [newPatient, ...prev]);
        setReferralForm(prev => ({ ...prev, patientId: newPatient._id }));
      } else {
        await queueRequest('/api/patients', 'POST', payload, { type: 'patient' });
        await refreshPendingCount();
        setSuccess(`📦 Saved offline — will sync when connected`);
        setRegisteredPatients(prev => [{ _id: `pending-${Date.now()}`, ...patientForm, _pending: true }, ...prev]);
      }
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

  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    if (referralForm.patientId?.startsWith('pending-')) {
      setError('⏳ This patient is queued offline. Wait for sync before referring.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...referralForm, forceEmergency };
      if (checkOnline()) {
        const response = await api.post('/api/referrals', payload);
        setSuccess(response.data.isEmergency
          ? '🚨 CRITICAL! Emergency incident created.'
          : '✅ Referral created successfully!');
        await fetchReferrals();
        setReferralForm(prev => ({ ...prev, patientId: '', patientDescription: '', patientLocation: '' }));
        setSearchQuery(''); setForceEmergency(false);
      } else {
        await queueRequest('/api/referrals', 'POST', payload, { type: 'referral' });
        await refreshPendingCount();
        setSuccess('📦 Referral queued offline — will sync when connected');
        setReferralForm(prev => ({ ...prev, patientId: '', patientDescription: '', patientLocation: '' }));
        setSearchQuery(''); setForceEmergency(false);
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
      if (current.includes(value)) return { ...prev, [field]: current.filter(v => v !== value) };
      return { ...prev, [field]: [...current, value] };
    });
  };

  const handleCompleteFollowUp = async (followUpId) => {
    if (!online) { setError('🔌 Offline — follow-up actions require internet'); return; }
    try {
      await api.patch(`/api/followups/${followUpId}/complete`, { notes: 'Completed by CHW' });
      setSuccess('✅ Follow-up marked as complete');
      fetchFollowUps();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) { setError('Failed to complete follow-up'); }
  };

  const handleRequestTeleconsult = async () => {
    if (!teleconsultForm.patientId || !teleconsultForm.symptoms.trim()) {
      setError('Patient and symptoms are required'); return;
    }
    if (!teleconsultForm.targetDoctorId) {
      setError('Please select a specialist doctor'); return;
    }
    if (!online) { setError('🔌 Teleconsultation requires internet'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/teleconsults', {
        patientId: teleconsultForm.patientId,
        symptoms: teleconsultForm.symptoms,
        targetDoctorId: teleconsultForm.targetDoctorId
      });
      const doctorName = res.data.targetDoctor?.name || 'specialist';
      setSuccess(`✅ Request sent to ${doctorName}`);
      setTeleconsultModal(null);
      setTeleconsultForm({ patientId: '', symptoms: '', patientName: '', targetDoctorId: '' });
      setSelectedSpecialist(null);
      await fetchTeleconsults();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request teleconsult');
    } finally { setLoading(false); }
  };

  const handleAddToQueue = async () => {
    if (!queueForm.patientId || !queueForm.facilityId) {
      setError('Patient and facility required'); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/queue', queueForm);
      setSuccess(`✅ ${res.data.message}`);
      setQueueModal(null);
      setQueueForm({ patientId: '', patientName: '', facilityId: '', priority: 'normal', reason: '' });
      setModalSearchQuery(''); setModalSearchResults([]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to queue');
    } finally { setLoading(false); }
  };

  const handleBookAppointment = async () => {
    if (!appointmentForm.patientId || !appointmentForm.facilityId || !appointmentForm.scheduledAt || !appointmentForm.reason) {
      setError('All fields required'); return;
    }
    setLoading(true);
    try {
      await api.post('/api/appointments', appointmentForm);
      setSuccess('✅ Appointment booked');
      setAppointmentModal(null);
      setAppointmentForm({ patientId: '', patientName: '', facilityId: '', scheduledAt: '', department: 'general', reason: '' });
      setAvailableSlots([]);
      setModalSearchQuery(''); setModalSearchResults([]);
      await fetchMyAppointments();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book');
    } finally { setLoading(false); }
  };

  const handleCreateDiagnosticOrder = async () => {
    if (!diagnosticForm.patientId || !diagnosticForm.facilityId) {
      setError('Patient and facility required'); return;
    }
    if (!diagnosticForm.tests.length) { setError('Select at least one test'); return; }
    if (!diagnosticForm.reason.trim()) { setError('Reason is required'); return; }
    setLoading(true);
    try {
      await api.post('/api/diagnostics', {
        patientId: diagnosticForm.patientId,
        facilityId: diagnosticForm.facilityId,
        tests: diagnosticForm.tests,
        reason: diagnosticForm.reason,
        priority: diagnosticForm.priority
      });
      setSuccess('✅ Diagnostic order placed');
      setDiagnosticModal(null);
      setDiagnosticForm({ patientId: '', patientName: '', facilityId: '', tests: [], reason: '', priority: 'normal' });
      setModalSearchQuery(''); setModalSearchResults([]);
      await fetchDiagnosticOrders();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally { setLoading(false); }
  };

  const toggleTestSelection = (testName) => {
    setDiagnosticForm(prev => {
      const current = prev.tests || [];
      if (current.includes(testName)) return { ...prev, tests: current.filter(t => t !== testName) };
      return { ...prev, tests: [...current, testName] };
    });
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

  const DIAG_STATUS = {
    ordered: 'bg-amber-100 text-amber-800 border-amber-300',
    'sample-collected': 'bg-sky-100 text-sky-800 border-sky-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    ready: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    delivered: 'bg-violet-100 text-violet-800 border-violet-300',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-300'
  };

  const TABS = [
    { id: 'register', label: 'Register', icon: UserPlus },
    { id: 'triage', label: 'Triage', icon: Stethoscope },
    { id: 'referrals', label: `Referrals (${referrals.length})`, icon: ClipboardList },
    { id: 'followups', label: `Follow-ups (${allFollowUps.length})`, icon: CalendarClock },
    { id: 'teleconsult', label: `Teleconsult (${teleconsults.length})`, icon: Video },
    { id: 'appointments', label: `Appointments (${appointments.length})`, icon: CalendarClock },
    { id: 'diagnostics', label: `Diagnostics (${diagnosticOrders.length})`, icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-y-3 px-4 py-3 sm:flex-nowrap sm:justify-between sm:px-6">
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/30">
              <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient-success sm:text-xl">{t('common.appName')}</h1>
              <p className="text-xs text-slate-500">{t('roles.chw')}</p>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto sm:gap-3">
            <span className="hidden sm:inline-flex"><OfflineBadge /></span>
            <span className="inline-flex sm:hidden"><OfflineBadge variant="compact" /></span>
            <LanguageSwitcher variant="dropdown" />
            <button aria-label="Notifications" title="Notifications" className="btn-ghost h-10 w-10 p-0">
              <Bell className="h-5 w-5" />
            </button>
            <span className="hidden text-sm font-medium text-slate-700 lg:block">{user?.name}</span>
            <button onClick={logout} aria-label={t('common.logout')} title={t('common.logout')} className="btn-ghost h-10 w-10 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-auto sm:w-auto sm:px-3">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 bg-white/60 backdrop-blur-sm border-b border-white/60 lg:hidden">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto px-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                  active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {active && <motion.div layoutId="chw-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 lg:ml-64">
        <DashboardSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} accent="emerald" />
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* REGISTER TAB */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-card p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl mr-3">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                {t('chw.registerPatient')}
              </h2>
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientName')} *</label>
                    <input type="text" value={patientForm.name}
                      onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                      required placeholder="e.g., Lakshmi Patil" className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientAge')} *</label>
                    <input type="number" value={patientForm.age}
                      onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                      required min="0" max="120" className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientGender')} *</label>
                    <select value={patientForm.gender} onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})} className="input-modern">
                      <option value="female">{t('chw.female')}</option>
                      <option value="male">{t('chw.male')}</option>
                      <option value="other">{t('chw.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientVillage')} *</label>
                    <input type="text" value={patientForm.village}
                      onChange={(e) => setPatientForm({...patientForm, village: e.target.value})}
                      required placeholder="e.g., Uruli Kanchan" className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientDistrict')}</label>
                    <input type="text" value={patientForm.district}
                      onChange={(e) => setPatientForm({...patientForm, district: e.target.value})}
                      placeholder="e.g., Pune" className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('chw.patientPhone')}</label>
                    <input type="tel" value={patientForm.phone}
                      onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                      placeholder="+91-XXXXXXXXXX" className="input-modern" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.chronicConditions')}</label>
                  <div className="flex flex-wrap gap-2">
                    {['diabetes', 'hypertension', 'asthma', 'heart_disease', 'tuberculosis'].map(cond => (
                      <button key={cond} type="button" onClick={() => handleCheckboxChange('chronicConditions', cond)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          patientForm.chronicConditions?.includes(cond)
                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                        {cond.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.highRiskFlags')}</label>
                  <div className="flex flex-wrap gap-2">
                    {['pregnancy', 'child_under_5', 'elderly', 'chronic', 'post_surgery'].map(flag => (
                      <button key={flag} type="button" onClick={() => handleCheckboxChange('highRiskFlags', flag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          patientForm.highRiskFlags?.includes(flag)
                            ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                        {flag.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="btn-gradient-success w-full py-3.5 flex items-center justify-center gap-2">
                  {loading ? '⏳ ' + t('common.loading') : (online ? t('chw.registerPatient') : `${t('chw.registerPatient')} (Offline)`)}
                </button>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">{t('chw.recentlyRegistered')}</h2>
              {registeredPatients.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">{t('chw.noPatientsYet')}</p>
              ) : (
                <div className="space-y-2">
                  {registeredPatients.map(p => (
                    <div key={p._id} className={`p-3 rounded-xl border ${p._pending ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-600">{p.age} yrs • {p.village}</p>
                        </div>
                        {p._pending ? (
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">⏳</span>
                        ) : (
                          <span className="text-xs text-emerald-700">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* TRIAGE TAB */}
        {activeTab === 'triage' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto glass-card p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center">
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl mr-3">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              {t('chw.triageTab')}
            </h2>
            <form onSubmit={handleReferralSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('chw.searchPatient')} *</label>
                <div className="flex space-x-2">
                  <input type="text" value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length > 2) handleSearchPatients(); }}
                    placeholder={t('chw.searchPlaceholder')} className="input-modern flex-1" />
                  <button type="button" onClick={handleSearchPatients} className="btn-gradient-primary px-6 flex items-center gap-2">
                    <Search className="w-4 h-4" /> Search
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
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {t('chw.patientSelected')}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold">{t('chw.symptoms')} *</label>
                  <VoiceInput onTranscript={(text) => setReferralForm({...referralForm, patientDescription: text})}
                    currentValue={referralForm.patientDescription} />
                </div>
                <textarea value={referralForm.patientDescription}
                  onChange={(e) => setReferralForm({...referralForm, patientDescription: e.target.value})}
                  required rows="4" placeholder={t('chw.symptomsPlaceholder')} className="input-modern resize-none" />
              </div>

              <div className={`rounded-2xl p-4 border-2 transition-all ${forceEmergency ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.span animate={forceEmergency ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.5, repeat: forceEmergency ? Infinity : 0 }} className="text-3xl">🚨</motion.span>
                    <div>
                      <p className="font-bold text-slate-800">{t('chw.markAsEmergency')}</p>
                      <p className="text-xs text-slate-600">{t('chw.emergencyDescription')}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setForceEmergency(!forceEmergency)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${forceEmergency ? 'bg-red-600' : 'bg-slate-300'}`}>
                    <motion.span layout className="inline-block h-6 w-6 rounded-full bg-white shadow"
                      animate={{ x: forceEmergency ? 36 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  </button>
                </div>
                {forceEmergency && <p className="mt-2 text-sm text-red-700 font-semibold bg-red-100 p-2 rounded-lg">⚠️ {t('chw.emergencyOn')}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.referToFacility')} *</label>
                  <select value={referralForm.toFacilityId}
                    onChange={(e) => setReferralForm({...referralForm, toFacilityId: e.target.value})} required className="input-modern">
                    <option value="">{t('chw.selectFacility')}</option>
                    {facilities.filter(f => f._id !== referralForm.fromFacilityId).map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.facilityType}) — {f.availableBeds} beds</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('chw.patientLocation')}</label>
                  <input type="text" value={referralForm.patientLocation}
                    onChange={(e) => setReferralForm({...referralForm, patientLocation: e.target.value})}
                    placeholder="e.g., Uruli Kanchan, Pune" className="input-modern" />
                </div>
              </div>

              <button type="submit" disabled={loading || !referralForm.patientId}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  forceEmergency ? 'btn-gradient-danger' : 'btn-gradient-primary'} disabled:opacity-50`}>
                {loading ? t('chw.analyzing') : forceEmergency ? t('chw.createEmergency') : t('chw.analyzeAndRefer')}
              </button>
            </form>
          </motion.div>
        )}

        {/* REFERRALS TAB */}
        {activeTab === 'referrals' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">{t('chw.referralsTab')} ({referrals.length})</h2>
            {referrals.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No referrals yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.map(ref => (
                  <div key={ref._id} className={`border-2 rounded-2xl p-4 ${ref.isEmergencyFlagged ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ref.patientId?.name || 'Unknown'}</span>
                        {ref.isEmergencyFlagged && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">🚨</span>}
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
                        ref.severity === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {t(`triage.${ref.severity}`, ref.severity)}
                      </span>
                      {ref.linkedIncident && <span className="text-xs text-red-600 font-medium">🚑 Emergency</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* FOLLOW-UPS TAB */}
        {activeTab === 'followups' && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
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
                          <p className="text-xs text-slate-500 mt-1">📍 {fu.patientId?.village} • 📞 {fu.patientId?.phone || 'N/A'}</p>
                        </div>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                          {t(`followUp.${fu.priority}`, fu.priority)}
                        </span>
                      </div>
                      <button onClick={() => handleCompleteFollowUp(fu._id)} disabled={!online}
                        className="mt-3 w-full btn-gradient-success py-2 text-sm disabled:opacity-50">
                        ✅ {t('chw.markComplete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">{t('chw.allFollowUps')} ({allFollowUps.length})</h2>
              {allFollowUps.length === 0 ? (
                <p className="text-slate-500 text-center py-8">{t('chw.noFollowUps')}</p>
              ) : (
                <div className="space-y-2">
                  {allFollowUps.map(fu => (
                    <div key={fu._id} className={`border rounded-xl p-3 ${fu.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{fu.patientId?.name}</p>
                          <p className="text-xs text-slate-600">{fu.condition}</p>
                          <p className="text-xs text-slate-500">Due: {new Date(fu.dueDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          fu.status === 'completed' ? 'bg-emerald-600 text-white' :
                          fu.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {fu.status === 'completed' ? '✅ ' : ''}{fu.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* TELECONSULT TAB */}
        {activeTab === 'teleconsult' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-2 rounded-xl mr-3">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  Video Consultations ({teleconsults.length})
                </h2>
                <button onClick={() => {
                  setTeleconsultModal('new');
                  setTeleconsultSearchResults([]);
                  setSelectedSpecialist(null);
                  setTeleconsultForm({ patientId: '', symptoms: '', patientName: '', targetDoctorId: '' });
                  fetchSpecialists();
                }} className="btn-gradient-primary px-4 py-2 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Request
                </button>
              </div>

              {teleconsults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">📹</div>
                  <p className="text-slate-500">No teleconsultations requested yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teleconsults.map(tc => (
                    <div key={tc._id} className="border-2 rounded-2xl p-4 border-slate-200 bg-white hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold">{tc.patientId?.name}</p>
                          <p className="text-xs text-slate-500">{tc.patientId?.age} yrs · {tc.patientId?.village}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tc.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                          tc.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                          tc.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          tc.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>
                          {tc.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 line-clamp-2">{tc.symptoms}</p>
                      {tc.doctorId && <p className="text-xs text-teal-700 mb-2">👨‍⚕️ {tc.doctorId.name} ({tc.doctorId.specialization})</p>}
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
                                💊 Prescription
                                <span className="ml-2 text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full">READY</span>
                              </p>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap mt-1">{tc.prescription}</p>
                            </div>
                          )}
                        </>
                      )}
                      {tc.status === 'accepted' && (
                        <button onClick={() => setActiveRoom({ roomId: tc.roomId, patientName: tc.patientId?.name })}
                          className="mt-3 w-full btn-gradient-success py-2 text-sm flex items-center justify-center gap-2">
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

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl mr-3">
                  <CalendarClock className="w-5 h-5 text-white" />
                </div>
                Upcoming Appointments ({appointments.length})
              </h2>
              <button onClick={() => {
                setAppointmentModal('new');
                setAvailableSlots([]);
                setModalSearchQuery(''); setModalSearchResults([]);
              }} className="btn-gradient-primary px-4 py-2 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Book
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-3">📅</div>
                <p className="text-slate-500">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt._id} className="border-2 border-slate-200 rounded-2xl p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{apt.patientId?.name}</p>
                        <p className="text-xs text-slate-500">{apt.patientId?.age} yrs · {apt.patientId?.village}</p>
                        <p className="text-xs text-slate-600 mt-1">🏥 {apt.facilityId?.name}</p>
                        <p className="text-xs text-slate-600 mt-1">📋 {apt.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-rose-600">
                          {new Date(apt.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* DIAGNOSTICS TAB */}
        {activeTab === 'diagnostics' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-xl mr-3">
                    <FlaskConical className="w-5 h-5 text-white" />
                  </div>
                  My Diagnostic Orders ({diagnosticOrders.length})
                </h2>
                <button onClick={() => {
                  setDiagnosticModal('new');
                  setModalSearchQuery(''); setModalSearchResults([]);
                }} className="btn-gradient-primary px-4 py-2 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Order Tests
                </button>
              </div>

              {diagnosticOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">🔬</div>
                  <p className="text-slate-500">No diagnostic orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {diagnosticOrders.map(order => (
                    <div key={order._id} className="border-2 border-slate-200 rounded-2xl p-4 bg-white">
                      <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold">{order.patientId?.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${DIAG_STATUS[order.status] || ''}`}>
                              {order.status.replace('-', ' ').toUpperCase()}
                            </span>
                            {order.priority === 'urgent' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🚨</span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">🏥 {order.facilityId?.name}</p>
                          <p className="text-xs text-slate-500">📋 {order.reason}</p>
                          {order.expectedReadyBy && order.status !== 'delivered' && order.status !== 'ready' && (
                            <p className="text-xs text-violet-600 mt-1">⏱ Expected by {new Date(order.expectedReadyBy).toLocaleString()}</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Tests ({order.tests.length})</p>
                        <div className="space-y-2">
                          {order.tests.map((test, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-slate-100">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  test.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {test.status === 'ready' ? '✓' : <FlaskConical className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{test.name}</p>
                                  <p className="text-xs text-slate-500 capitalize">{test.status.replace('-', ' ')}</p>
                                </div>
                              </div>
                              {test.status === 'ready' && test.reportUrl && (
                                <a href={test.reportUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 flex-shrink-0">
                                  <FileText className="w-3 h-3" /> View Report
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* TELECONSULT MODAL */}
      <AnimatePresence>
        {teleconsultModal === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Video className="w-5 h-5 mr-2 text-teal-600" /> Request Video Consultation
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">1. Select Patient *</label>
                  <input type="text" value={teleconsultForm.patientName}
                    onChange={(e) => setTeleconsultForm({...teleconsultForm, patientName: e.target.value, patientId: ''})}
                    placeholder="Type patient name" className="input-modern" />
                  {teleconsultSearchResults.length > 0 && !teleconsultForm.patientId && (
                    <div className="mt-2 border rounded-xl max-h-40 overflow-y-auto bg-white shadow-lg">
                      {teleconsultSearchResults.map(p => (
                        <button key={p._id} type="button"
                          onClick={() => { setTeleconsultForm({...teleconsultForm, patientId: p._id, patientName: p.name}); setTeleconsultSearchResults([]); }}
                          className="w-full text-left px-4 py-2 hover:bg-teal-50 border-b last:border-b-0">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.age} yrs · {p.village}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">2. Symptoms *</label>
                  <div className="flex items-center justify-end mb-2">
                    <VoiceInput onTranscript={(text) => setTeleconsultForm(prev => ({ ...prev, symptoms: text }))}
                      currentValue={teleconsultForm.symptoms} />
                  </div>
                  <textarea value={teleconsultForm.symptoms}
                    onChange={(e) => setTeleconsultForm({...teleconsultForm, symptoms: e.target.value})}
                    rows="3" placeholder="Describe symptoms..." className="input-modern resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">3. Select Specialist *</label>
                  {specialists.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      ⚠️ No specialists available
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {specialists.map(doc => {
                        const isSelected = teleconsultForm.targetDoctorId === doc._id;
                        const icons = { cardiac: '❤️', trauma: '🩹', respiratory: '🫁', general: '🩺', neurology: '🧠', pediatric: '👶', maternal: '🤰', orthopedic: '🦴' };
                        return (
                          <button key={doc._id} type="button"
                            onClick={() => { setTeleconsultForm({...teleconsultForm, targetDoctorId: doc._id}); setSelectedSpecialist(doc); }}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${
                              isSelected ? 'border-teal-500 bg-teal-50 shadow-lg' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
                            <div className="flex items-start gap-2">
                              <div className="text-2xl flex-shrink-0">{icons[doc.specialization] || '🩺'}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{doc.name}</p>
                                <p className="text-xs text-teal-700 font-medium capitalize">{doc.specialization}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => { setTeleconsultModal(null); setTeleconsultSearchResults([]); setSelectedSpecialist(null); }}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button onClick={handleRequestTeleconsult}
                  disabled={loading || !teleconsultForm.patientId || !teleconsultForm.symptoms.trim() || !teleconsultForm.targetDoctorId}
                  className="flex-1 btn-gradient-success py-2.5 disabled:opacity-50">
                  {loading ? 'Sending...' : '📨 Send Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUEUE MODAL */}
      <AnimatePresence>
        {queueModal === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" /> Add Patient to Queue
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Patient *</label>
                  <input type="text" value={queueForm.patientName}
                    onChange={(e) => {
                      setQueueForm({ ...queueForm, patientName: e.target.value, patientId: '' });
                      handleModalPatientSearch(e.target.value);
                    }}
                    placeholder="Type patient name" className="input-modern" />
                  {modalSearchResults.length > 0 && !queueForm.patientId && (
                    <div className="mt-2 border rounded-xl max-h-40 overflow-y-auto">
                      {modalSearchResults.map(p => (
                        <button key={p._id} type="button"
                          onClick={() => { setQueueForm({ ...queueForm, patientId: p._id, patientName: p.name }); setModalSearchResults([]); }}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b last:border-b-0">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.age} yrs · {p.village}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Facility *</label>
                  <select value={queueForm.facilityId} onChange={(e) => setQueueForm({ ...queueForm, facilityId: e.target.value })} className="input-modern">
                    <option value="">Select facility...</option>
                    {facilities.map(f => <option key={f._id} value={f._id}>{f.name} ({f.facilityType})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Priority</label>
                  <select value={queueForm.priority} onChange={(e) => setQueueForm({ ...queueForm, priority: e.target.value })} className="input-modern">
                    <option value="normal">Normal</option>
                    <option value="high">High (elderly, pregnant, chronic)</option>
                    <option value="emergency">Emergency (jump to front)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Reason</label>
                  <input type="text" value={queueForm.reason} onChange={(e) => setQueueForm({ ...queueForm, reason: e.target.value })}
                    placeholder="Chief complaint" className="input-modern" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setQueueModal(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button onClick={handleAddToQueue} disabled={loading} className="flex-1 btn-gradient-success py-2.5">
                  {loading ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPOINTMENT MODAL */}
      <AnimatePresence>
        {appointmentModal === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <CalendarClock className="w-5 h-5 mr-2 text-rose-600" /> Book Appointment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Patient *</label>
                  <input type="text" value={appointmentForm.patientName}
                    onChange={(e) => {
                      setAppointmentForm({ ...appointmentForm, patientName: e.target.value, patientId: '' });
                      handleModalPatientSearch(e.target.value);
                    }}
                    placeholder="Type patient name" className="input-modern" />
                  {modalSearchResults.length > 0 && !appointmentForm.patientId && (
                    <div className="mt-2 border rounded-xl max-h-40 overflow-y-auto">
                      {modalSearchResults.map(p => (
                        <button key={p._id} type="button"
                          onClick={() => { setAppointmentForm({ ...appointmentForm, patientId: p._id, patientName: p.name }); setModalSearchResults([]); }}
                          className="w-full text-left px-4 py-2 hover:bg-rose-50 border-b last:border-b-0">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.age} yrs · {p.village}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Facility *</label>
                  <select value={appointmentForm.facilityId}
                    onChange={(e) => { setAppointmentForm({ ...appointmentForm, facilityId: e.target.value });
                      if (appointmentForm.scheduledAt) fetchSlotsForDate(e.target.value, appointmentForm.scheduledAt.split('T')[0]); }}
                    className="input-modern">
                    <option value="">Select facility...</option>
                    {facilities.map(f => <option key={f._id} value={f._id}>{f.name} — {f.district}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Date *</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => fetchSlotsForDate(appointmentForm.facilityId, e.target.value)}
                    className="input-modern" />
                </div>
                {availableSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Time Slot *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <button key={slot.time} type="button" disabled={!slot.available}
                          onClick={() => setAppointmentForm({ ...appointmentForm, scheduledAt: slot.time })}
                          className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                            appointmentForm.scheduledAt === slot.time ? 'bg-rose-500 text-white shadow-md' :
                            slot.available ? 'bg-slate-100 text-slate-700 hover:bg-rose-100' :
                            'bg-slate-50 text-slate-300 cursor-not-allowed line-through'}`}>
                          {slot.display}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1">Department</label>
                  <select value={appointmentForm.department} onChange={(e) => setAppointmentForm({ ...appointmentForm, department: e.target.value })} className="input-modern">
                    <option value="general">General</option>
                    <option value="cardiac">Cardiac</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="maternal">Maternal</option>
                    <option value="orthopedic">Orthopedic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Reason *</label>
                  <textarea value={appointmentForm.reason} onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                    rows="2" placeholder="Purpose of visit" className="input-modern resize-none" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setAppointmentModal(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button onClick={handleBookAppointment} disabled={loading} className="flex-1 btn-gradient-success py-2.5">
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIAGNOSTIC ORDER MODAL */}
      <AnimatePresence>
        {diagnosticModal === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <FlaskConical className="w-5 h-5 mr-2 text-violet-600" /> Order Diagnostic Tests
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Patient *</label>
                  <input type="text" value={diagnosticForm.patientName}
                    onChange={(e) => {
                      setDiagnosticForm({ ...diagnosticForm, patientName: e.target.value, patientId: '' });
                      handleModalPatientSearch(e.target.value);
                    }}
                    placeholder="Type patient name" className="input-modern" />
                  {modalSearchResults.length > 0 && !diagnosticForm.patientId && (
                    <div className="mt-2 border rounded-xl max-h-40 overflow-y-auto">
                      {modalSearchResults.map(p => (
                        <button key={p._id} type="button"
                          onClick={() => { setDiagnosticForm({ ...diagnosticForm, patientId: p._id, patientName: p.name }); setModalSearchResults([]); }}
                          className="w-full text-left px-4 py-2 hover:bg-violet-50 border-b last:border-b-0">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.age} yrs · {p.village}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Facility *</label>
                  <select value={diagnosticForm.facilityId} onChange={(e) => setDiagnosticForm({ ...diagnosticForm, facilityId: e.target.value })} className="input-modern">
                    <option value="">Select facility...</option>
                    {facilities.map(f => <option key={f._id} value={f._id}>{f.name} — {f.district}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Select Tests * ({diagnosticForm.tests.length} selected)</label>
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                    {['blood', 'imaging', 'cardiac', 'urine', 'other'].map(cat => {
                      const catTests = diagnosticCatalog.filter(t => t.category === cat);
                      if (catTests.length === 0) return null;
                      const catEmoji = { blood: '🩸', imaging: '📷', cardiac: '❤️', urine: '🧪', other: '🔬' }[cat];
                      return (
                        <div key={cat}>
                          <p className="text-xs font-bold text-slate-600 uppercase mb-1">{catEmoji} {cat}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {catTests.map(t => {
                              const selected = diagnosticForm.tests.includes(t.name);
                              return (
                                <button key={t.name} type="button" onClick={() => toggleTestSelection(t.name)}
                                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                    selected ? 'bg-violet-600 text-white font-semibold' : 'bg-slate-50 hover:bg-violet-50 text-slate-700'}`}>
                                  {t.name}
                                  <span className="block text-[10px] opacity-70">~{t.hours}h</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Reason *</label>
                  <input type="text" value={diagnosticForm.reason}
                    onChange={(e) => setDiagnosticForm({ ...diagnosticForm, reason: e.target.value })}
                    placeholder="e.g., Suspected dengue, routine screening" className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Priority</label>
                  <select value={diagnosticForm.priority} onChange={(e) => setDiagnosticForm({ ...diagnosticForm, priority: e.target.value })} className="input-modern">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setDiagnosticModal(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button onClick={handleCreateDiagnosticOrder}
                  disabled={loading || !diagnosticForm.patientId || !diagnosticForm.facilityId || !diagnosticForm.tests.length || !diagnosticForm.reason.trim()}
                  className="flex-1 btn-gradient-success py-2.5 disabled:opacity-50">
                  {loading ? 'Placing order...' : `Order ${diagnosticForm.tests.length} Test(s)`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIDEO ROOM */}
      <AnimatePresence>
        {activeRoom && (
          <TeleconsultRoom roomId={activeRoom.roomId} onClose={() => setActiveRoom(null)} patientName={activeRoom.patientName} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CHWDashboard;
