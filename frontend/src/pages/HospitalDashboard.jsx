import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Building2, BedDouble, CheckCircle2, Clock, AlertTriangle, Activity,
  MapPin, XCircle, ShieldCheck, FlaskConical, Upload, FileText
  , Ticket, CalendarClock, Bell, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DashboardSidebar from '../components/DashboardSidebar';
import HelpRequestsPanel from '../components/HelpRequestsPanel';

const HospitalDashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [facility, setFacility] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({
    totalIncoming: 0, pendingReferrals: 0, completedToday: 0,
    emergencyCount: 0, activeEmergencies: 0
  });
  const [availableBeds, setAvailableBeds] = useState(0);
  const [queueData, setQueueData] = useState({ entries: [], stats: {} });
  const [appointments, setAppointments] = useState([]);
  const [diagnosticOrders, setDiagnosticOrders] = useState([]);
  const [diagnosticStats, setDiagnosticStats] = useState({ pending: 0, inProgress: 0, ready: 0, completedToday: 0 });
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [uploadModal, setUploadModal] = useState(null);
  const [uploadForm, setUploadForm] = useState({ reportUrl: '', reportNotes: '' });

  const facilityId = user?.linkedFacilityId || user?.linkedHospitalId;

  useEffect(() => {
    if (facilityId) {
      fetchFacilityData();
      fetchReferrals();
      fetchIncidents();
      fetchStats();
      fetchQueue();
      fetchAppointments();
      fetchDiagnosticOrders();
      fetchDiagnosticStats();
    }
  }, [facilityId]);

  useEffect(() => {
    if (socket && connected && facilityId) {
      socket.emit('joinHospitalRoom', facilityId);
      socket.emit('joinFacilityRoom', facilityId);
      socket.emit('joinUserRoom', user.id);

      socket.on('facilityAvailabilityUpdated', (data) => {
        if (data.facilityId === facilityId) setAvailableBeds(data.availableBeds);
      });
      socket.on('hospitalAvailabilityUpdated', (data) => {
        if (data.hospitalId === facilityId || data.facilityId === facilityId) setAvailableBeds(data.availableBeds);
      });
      socket.on('newIncidentAssigned', (data) => {
        if (data.incident?.assignedHospitalId === facilityId) {
          setIncidents(prev => {
            const exists = prev.find(i => i._id === data.incident._id);
            if (exists) return prev.map(i => i._id === data.incident._id ? data.incident : i);
            return [data.incident, ...prev];
          });
          setSuccess('🚨 New emergency dispatched — please confirm!');
          fetchStats();
          setTimeout(() => setSuccess(''), 8000);
        }
      });
      socket.on('newReferralReceived', (data) => {
        if (data.referral?.toFacilityId === facilityId) {
          setReferrals(prev => [data.referral, ...prev]);
          setSuccess('📥 New referral received!');
          fetchStats();
          setTimeout(() => setSuccess(''), 5000);
        }
      });
      socket.on('referralStatusChanged', () => { fetchReferrals(); fetchStats(); });
      socket.on('facilityStatsUpdated', (data) => { if (data.facilityId === facilityId) setStats(data.stats); });
      socket.on('queueUpdated', () => fetchQueue());
      socket.on('appointmentBooked', () => fetchAppointments());
      socket.on('appointmentUpdated', () => fetchAppointments());
      socket.on('newDiagnosticOrder', () => { fetchDiagnosticOrders(); fetchDiagnosticStats(); });
      socket.on('diagnosticOrderUpdated', () => { fetchDiagnosticOrders(); fetchDiagnosticStats(); });
      socket.on('newHelpRequest', (data) => {
        const myRole = user?.role;
        const targetRole = data.request?.targetRole;
        if (targetRole === 'any' || targetRole === myRole) {
          console.log('📞 New help request:', data.request.patientName);
        }
      });
      socket.on('helpRequestClaimed', (data) => {
        console.log('✅ Claimed by', data.claimedBy?.name);
      });
      socket.on('helpRequestResolved', () => {
        console.log('✅ Request resolved');
      });

      return () => {
        socket.off('facilityAvailabilityUpdated');
        socket.off('hospitalAvailabilityUpdated');
        socket.off('newIncidentAssigned');
        socket.off('newReferralReceived');
        socket.off('referralStatusChanged');
        socket.off('facilityStatsUpdated');
        socket.off('queueUpdated');
        socket.off('appointmentBooked');
        socket.off('appointmentUpdated');
        socket.off('newDiagnosticOrder');
        socket.off('diagnosticOrderUpdated');
        socket.off('newHelpRequest');
        socket.off('helpRequestClaimed');
        socket.off('helpRequestResolved');
      };
    }
  }, [socket, connected, facilityId, user?.id]);

  const fetchFacilityData = async () => {
    try {
      const response = await api.get(`/api/facilities/${facilityId}/dashboard`);
      const f = response.data.facility;
      setFacility(f);
      setAvailableBeds(f.availableBeds);
    } catch (error) {
      console.error('Facility fetch error:', error);
      setError('Failed to load facility data');
    } finally { setLoading(false); }
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

  const fetchQueue = async () => {
    try {
      const response = await api.get(`/api/queue/facility/${facilityId}`);
      setQueueData(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchAppointments = async () => {
    try {
      const response = await api.get(`/api/appointments/facility/${facilityId}`);
      setAppointments(response.data.appointments || []);
    } catch (error) { console.error(error); }
  };

  const fetchDiagnosticOrders = async () => {
    try {
      const response = await api.get(`/api/diagnostics/facility/${facilityId}`);
      setDiagnosticOrders(response.data.orders || []);
    } catch (error) { console.error(error); }
  };

  const fetchDiagnosticStats = async () => {
    try {
      const response = await api.get(`/api/diagnostics/facility/${facilityId}/stats`);
      setDiagnosticStats(response.data.stats);
    } catch (error) { console.error(error); }
  };

  const handleUpdateBeds = async () => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/facilities/${facilityId}/availability`, { availableBeds: parseInt(availableBeds) });
      setSuccess('✅ Bed availability updated');
    } catch (error) { setError(error.response?.data?.error || 'Failed to update beds'); }
  };

  const handleAcknowledgeIncident = async (incidentId, notes = '') => {
    try {
      await api.patch(`/api/incidents/${incidentId}/acknowledge`, { notes });
      setSuccess('✅ Incident acknowledged');
      await Promise.all([fetchIncidents(), fetchStats()]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) { setError(error.response?.data?.error || 'Failed'); }
  };

  const handleRejectIncident = async () => {
    if (!rejectModal) return;
    try {
      await api.patch(`/api/incidents/${rejectModal}/reject`, { reason: rejectReason });
      setSuccess('❌ Incident rejected');
      setRejectModal(null); setRejectReason('');
      await Promise.all([fetchIncidents(), fetchStats()]);
    } catch (error) { setError(error.response?.data?.error || 'Failed'); }
  };

  const handleCompleteIncident = async (incidentId) => {
    try {
      await api.patch(`/api/incidents/${incidentId}/complete`);
      setSuccess('✅ Incident completed');
      await Promise.all([fetchIncidents(), fetchStats()]);
    } catch (error) { setError(error.response?.data?.error || 'Failed'); }
  };

  const handleUpdateReferralStatus = async (referralId, newStatus) => {
    try {
      await api.patch(`/api/referrals/${referralId}/status`, {
        status: newStatus, facilityId,
        notes: newStatus === 'received' ? 'Referral accepted' : 'Referral completed'
      });
      setSuccess(newStatus === 'received' ? '✅ Referral accepted!' : '✅ Referral completed');
      await Promise.all([fetchReferrals(), fetchStats()]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) { setError(error.response?.data?.error || 'Failed'); }
  };

  const handleCallNext = async () => {
    try {
      const response = await api.patch(`/api/queue/facility/${facilityId}/call-next`);
      setSuccess(`📢 Token #${response.data.entry.tokenNumber} — ${response.data.entry.patientId?.name}`);
      await fetchQueue();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleQueueStatusChange = async (entryId, newStatus) => {
    try {
      await api.patch(`/api/queue/${entryId}/status`, { status: newStatus });
      await fetchQueue();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleSkipPatient = async (entryId) => {
    try {
      await api.patch(`/api/queue/${entryId}/skip`);
      await fetchQueue();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleDiagnosticStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/diagnostics/${orderId}/status`, { status });
      setSuccess(`✅ Order marked as ${status}`);
      await Promise.all([fetchDiagnosticOrders(), fetchDiagnosticStats()]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) { setError(error.response?.data?.error || 'Failed'); }
  };

  const handleUploadReport = async () => {
    if (!uploadModal) return;
    if (!uploadForm.reportUrl.trim()) { setError('Report URL is required'); return; }
    try {
      await api.patch(`/api/diagnostics/${uploadModal.orderId}/upload-report`, {
        testIndex: uploadModal.testIndex,
        reportUrl: uploadForm.reportUrl,
        reportNotes: uploadForm.reportNotes
      });
      setSuccess('✅ Report uploaded');
      setUploadModal(null);
      setUploadForm({ reportUrl: '', reportNotes: '' });
      await Promise.all([fetchDiagnosticOrders(), fetchDiagnosticStats()]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) { setError(error.response?.data?.error || 'Failed'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const pendingAckIncidents = incidents.filter(i => i.status === 'dispatched');
  const acknowledgedIncidents = incidents.filter(i => i.status === 'acknowledged');
  const pendingReferrals = referrals.filter(r => r.status === 'initiated');

  const STATUS_COLORS = {
    ordered: 'bg-amber-100 text-amber-800 border-amber-300',
    'sample-collected': 'bg-sky-100 text-sky-800 border-sky-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    ready: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    delivered: 'bg-violet-100 text-violet-800 border-violet-300',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-300'
  };

  const hospitalTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'queue', label: `Queue (${queueData.entries?.length || 0})`, icon: Ticket },
    { id: 'appointments', label: `Appointments (${appointments.length})`, icon: CalendarClock },
    { id: 'diagnostics', label: `Diagnostics (${diagnosticOrders.length})`, icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-violet-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-violet-500/30">
              <Building2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="truncate text-lg font-bold text-gradient-primary sm:text-xl">{facility?.name || 'Hospital'}</h1>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {facility?.taluka && `${facility.taluka}, `}{facility?.district}, {facility?.state} • {user?.name}
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-3">
            <LanguageSwitcher variant="dropdown" />
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
              connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {connected ? t('common.live') : t('common.offline')}
            </span>
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

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 lg:ml-64">
        <DashboardSidebar tabs={hospitalTabs} activeTab={activeSection} onTabChange={setActiveSection} accent="violet" />
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {hospitalTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/70 text-slate-700 hover:bg-white'}`}>
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Available Beds', value: `${availableBeds}/${facility?.totalBeds}`, color: 'violet' },
                { label: 'Pending Referrals', value: stats.pendingReferrals, color: 'blue' },
                { label: 'Active Emergencies', value: stats.activeEmergencies, color: 'red', pulse: pendingAckIncidents.length > 0 },
                { label: 'Completed Today', value: stats.completedToday, color: 'emerald' },
                { label: 'Diagnostics Pending', value: diagnosticStats.pending, color: 'amber' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass-card p-4 border-l-4 border-${s.color}-500 relative`}>
                  <p className="text-xs text-slate-500 uppercase font-semibold">{s.label}</p>
                  <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                  {s.pulse && (
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <HelpRequestsPanel userRole="hospital_staff" facilityId={facilityId} />
            </motion.div>

            {pendingAckIncidents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 mb-6 border-2 border-red-300 bg-red-50/50">
                <h2 className="text-lg font-bold mb-4 flex items-center text-red-700">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="mr-2">
                    <ShieldCheck className="w-5 h-5" />
                  </motion.div>
                  ⚠️ Awaiting Your Confirmation ({pendingAckIncidents.length})
                </h2>
                <div className="space-y-4">
                  {pendingAckIncidents.map(inc => (
                    <div key={inc._id} className="bg-white rounded-2xl p-5 border-2 border-red-200 shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-lg">
                            {inc.patientId?.name || 'Unknown'} {inc.patientId?.age && <span className="text-sm text-slate-500">({inc.patientId.age} yrs)</span>}
                          </p>
                          <p className="text-sm text-slate-700 mb-2">{inc.patientDescription}</p>
                          <p className="text-xs text-slate-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> {inc.patientLocation || 'Location not specified'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          inc.severity === 'critical' ? 'bg-red-100 text-red-700 border border-red-300' :
                          inc.severity === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {inc.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleAcknowledgeIncident(inc._id, 'Patient accepted')}
                          className="flex-1 btn-gradient-success py-3 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Confirm & Accept
                        </button>
                        <button onClick={() => setRejectModal(inc._id)}
                          className="px-4 py-3 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded-xl font-semibold flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {acknowledgedIncidents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
                <h2 className="text-lg font-bold mb-4">🏥 Accepted Patients ({acknowledgedIncidents.length})</h2>
                <div className="space-y-3">
                  {acknowledgedIncidents.map(inc => (
                    <div key={inc._id} className="border-l-4 border-emerald-500 bg-emerald-50/50 rounded-lg p-4">
                      <p className="font-semibold">{inc.patientId?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-600 mt-1">{inc.patientDescription}</p>
                      <button onClick={() => handleCompleteIncident(inc._id)}
                        className="mt-3 w-full btn-gradient-success py-2 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Mark Complete
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <BedDouble className="w-5 h-5 mr-2 text-violet-600" /> Bed Availability
              </h2>
              <div className="flex gap-3">
                <input type="number" value={availableBeds} onChange={(e) => setAvailableBeds(e.target.value)}
                  min="0" max={facility?.totalBeds || 0} className="input-modern flex-1" />
                <button onClick={handleUpdateBeds} className="btn-gradient-purple px-8">Update</button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">📥 Incoming Referrals ({pendingReferrals.length} pending)</h2>
              {referrals.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No incoming referrals</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {referrals.map(ref => (
                    <div key={ref._id} className={`border-2 rounded-2xl p-4 ${
                      ref.isEmergencyFlagged ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{ref.patientId?.name || 'Unknown'}</p>
                          {ref.isEmergencyFlagged && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">🚨</span>}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          ref.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          ref.severity === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {ref.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 line-clamp-2">{ref.reason}</p>
                      <p className="text-xs text-slate-500 mb-2">From: {ref.fromFacilityId?.name}</p>
                      <div className="flex gap-2">
                        {ref.status === 'initiated' && (
                          <button onClick={() => handleUpdateReferralStatus(ref._id, 'received')}
                            className="flex-1 btn-gradient-primary py-1.5 text-xs">Accept</button>
                        )}
                        {ref.status === 'received' && (
                          <button onClick={() => handleUpdateReferralStatus(ref._id, 'completed')}
                            className="flex-1 btn-gradient-success py-1.5 text-xs">Complete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* QUEUE */}
        {activeSection === 'queue' && (
          <div className="space-y-6">
            <div className="glass-card p-6 border-l-4 border-teal-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Waiting</p><p className="text-3xl font-bold text-teal-600">{queueData.stats?.totalWaiting || 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">In Consultation</p><p className="text-3xl font-bold text-blue-600">{queueData.stats?.inProgress || 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Avg Consult</p><p className="text-3xl font-bold text-violet-600">{queueData.stats?.avgConsultMinutes || 10}<span className="text-sm text-slate-500"> min</span></p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Est. Clear By</p><p className="text-lg font-bold text-slate-700">{queueData.stats?.estClearTime ? new Date(queueData.stats.estClearTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
              </div>
              <button onClick={handleCallNext}
                disabled={!queueData.entries?.some(e => e.status === 'waiting')}
                className="mt-6 w-full btn-gradient-success py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50">
                📢 Call Next Patient
              </button>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">🎫 Live OPD Queue</h2>
              {!queueData.entries || queueData.entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">✨</div>
                  <p className="text-slate-500">Queue is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueData.entries.map(entry => (
                    <div key={entry._id} className={`rounded-xl p-4 border-2 ${
                      entry.status === 'in-consultation' ? 'border-blue-400 bg-blue-50' :
                      entry.status === 'called' ? 'border-amber-400 bg-amber-50' :
                      entry.priority === 'emergency' ? 'border-red-400 bg-red-50' :
                      entry.priority === 'high' ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                            entry.status === 'in-consultation' ? 'bg-blue-600 text-white' :
                            entry.status === 'called' ? 'bg-amber-500 text-white' :
                            entry.priority === 'emergency' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {entry.tokenNumber}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900">{entry.patientId?.name || 'Unknown'}</p>
                              {entry.priority === 'emergency' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🚨</span>}
                              {entry.priority === 'high' && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">⚡</span>}
                            </div>
                            <p className="text-sm text-slate-600">{entry.patientId?.age} yrs · {entry.patientId?.gender} · {entry.patientId?.village}</p>
                            {entry.reason && <p className="text-xs text-slate-500 mt-1 truncate">📋 {entry.reason}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {entry.status === 'waiting' && (
                            <>
                              <button onClick={() => handleQueueStatusChange(entry._id, 'called')}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold">Call</button>
                              <button onClick={() => handleSkipPatient(entry._id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 rounded-lg text-xs font-semibold">Skip</button>
                            </>
                          )}
                          {entry.status === 'called' && (
                            <>
                              <button onClick={() => handleQueueStatusChange(entry._id, 'in-consultation')}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">Start</button>
                              <button onClick={() => handleSkipPatient(entry._id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 rounded-lg text-xs font-semibold">Skip</button>
                            </>
                          )}
                          {entry.status === 'in-consultation' && (
                            <button onClick={() => handleQueueStatusChange(entry._id, 'done')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold">✅ Done</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeSection === 'appointments' && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">📅 Today's Appointments ({appointments.length})</h2>
            {appointments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No appointments scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt._id} className="border rounded-xl p-4 border-slate-200 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{apt.patientId?.name}</p>
                        <p className="text-sm text-slate-600">{apt.patientId?.age} yrs · {apt.patientId?.village}</p>
                        <p className="text-xs text-slate-500 mt-1">📋 {apt.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {new Date(apt.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          apt.status === 'checked-in' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIAGNOSTICS */}
        {activeSection === 'diagnostics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Pending', value: diagnosticStats.pending, icon: Clock, color: 'amber' },
                { label: 'In Progress', value: diagnosticStats.inProgress, icon: FlaskConical, color: 'blue' },
                { label: 'Ready', value: diagnosticStats.ready, icon: FileText, color: 'emerald' },
                { label: 'Completed Today', value: diagnosticStats.completedToday, icon: CheckCircle2, color: 'violet' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`glass-card p-4 border-l-4 border-${s.color}-500`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">{s.label}</p>
                        <p className={`text-3xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                      </div>
                      <Icon className={`w-8 h-8 text-${s.color}-400`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <FlaskConical className="w-5 h-5 mr-2 text-violet-600" />
                Diagnostic Orders ({diagnosticOrders.length})
              </h2>

              {diagnosticOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">🔬</div>
                  <p className="text-slate-500">No diagnostic orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {diagnosticOrders.map(order => (
                    <div key={order._id} className="border-2 border-slate-200 rounded-2xl p-5 bg-white">
                      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <p className="font-bold text-lg">{order.patientId?.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] || 'bg-slate-100'}`}>
                              {order.status.replace('-', ' ').toUpperCase()}
                            </span>
                            {order.priority === 'urgent' && (
                              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">🚨 URGENT</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{order.patientId?.age} yrs · {order.patientId?.gender} · {order.patientId?.village}</p>
                          <p className="text-xs text-slate-500 mt-1">📋 {order.reason}</p>
                          <p className="text-xs text-slate-500 mt-1">Ordered by {order.orderedBy?.name} · {new Date(order.orderedAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 mb-4">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Tests ({order.tests.length})</p>
                        <div className="space-y-2">
                          {order.tests.map((test, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-slate-100">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  test.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {test.status === 'ready' ? '✓' : <FlaskConical className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{test.name}</p>
                                  <p className="text-xs text-slate-500 capitalize">{test.category} · {test.status.replace('-', ' ')}</p>
                                </div>
                              </div>
                              {test.status === 'ready' && test.reportUrl ? (
                                <a href={test.reportUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 flex-shrink-0">
                                  <FileText className="w-3 h-3" /> View
                                </a>
                              ) : (
                                <button onClick={() => {
                                  setUploadModal({ orderId: order._id, testIndex: idx, testName: test.name });
                                  setUploadForm({ reportUrl: '', reportNotes: '' });
                                }}
                                  className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-700 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 flex-shrink-0">
                                  <Upload className="w-3 h-3" /> Upload
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.status === 'ordered' && (
                          <button onClick={() => handleDiagnosticStatus(order._id, 'sample-collected')}
                            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2 rounded-lg text-sm font-semibold min-w-[140px]">
                            🧪 Mark Sample Collected
                          </button>
                        )}
                        {order.status === 'sample-collected' && (
                          <button onClick={() => handleDiagnosticStatus(order._id, 'in-progress')}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold min-w-[140px]">
                            ⏳ Mark In Progress
                          </button>
                        )}
                        {['ready', 'delivered'].includes(order.status) && (
                          <button onClick={() => handleDiagnosticStatus(order._id, 'delivered')}
                            disabled={order.status === 'delivered'}
                            className="flex-1 bg-violet-500 hover:bg-violet-600 text-white py-2 rounded-lg text-sm font-semibold min-w-[140px] disabled:opacity-50">
                            📤 Mark Delivered to CHW
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setRejectModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center">
                <XCircle className="w-5 h-5 mr-2" /> Reject Incident
              </h3>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g., No ICU bed available)" rows="3" className="input-modern mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Cancel</button>
                <button onClick={handleRejectIncident}
                  className="flex-1 btn-gradient-danger py-2.5">Confirm Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Report Modal */}
      <AnimatePresence>
        {uploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setUploadModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-violet-600" /> Upload Report
              </h3>
              <p className="text-sm text-slate-500 mb-4">Test: <strong>{uploadModal.testName}</strong></p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Report URL *</label>
                  <input type="url" value={uploadForm.reportUrl}
                    onChange={(e) => setUploadForm({ ...uploadForm, reportUrl: e.target.value })}
                    placeholder="https://..." className="input-modern" />
                  <p className="text-xs text-slate-500 mt-1">Upload to your cloud storage and paste the shared link</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Summary / Notes</label>
                  <textarea value={uploadForm.reportNotes}
                    onChange={(e) => setUploadForm({ ...uploadForm, reportNotes: e.target.value })}
                    rows="3" placeholder="Brief summary..." className="input-modern resize-none" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setUploadModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Cancel</button>
                <button onClick={handleUploadReport}
                  className="flex-1 btn-gradient-success py-2.5 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HospitalDashboard;
