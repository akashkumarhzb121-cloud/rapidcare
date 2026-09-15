import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Building2, BedDouble, Activity, CheckCircle2, Clock,
  AlertTriangle, Phone, MapPin, User, HeartPulse, Brain,
  XCircle, ShieldCheck, Pill, Stethoscope, Users, CalendarClock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

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
  const [medicineStock, setMedicineStock] = useState([]);
  const [queueData, setQueueData] = useState({ entries: [], stats: {} });
  const [appointments, setAppointments] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const facilityId = user?.linkedFacilityId || user?.linkedHospitalId;

  useEffect(() => {
    if (facilityId) {
      fetchFacilityData();
      fetchReferrals();
      fetchIncidents();
      fetchStats();
      fetchQueue();
      fetchAppointments();
    }
  }, [facilityId]);

  useEffect(() => {
    if (socket && connected && facilityId) {
      socket.emit('joinHospitalRoom', facilityId);
      socket.emit('joinFacilityRoom', facilityId);

      socket.on('facilityAvailabilityUpdated', (data) => {
        if (data.facilityId === facilityId) setAvailableBeds(data.availableBeds);
      });
      socket.on('hospitalAvailabilityUpdated', (data) => {
        if (data.hospitalId === facilityId || data.facilityId === facilityId) {
          setAvailableBeds(data.availableBeds);
        }
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

      socket.on('referralStatusChanged', () => {
        fetchReferrals();
        fetchStats();
      });

      socket.on('facilityStatsUpdated', (data) => {
        if (data.facilityId === facilityId) setStats(data.stats);
      });
      socket.on('queueUpdated', (data) => {
        if (data.facilityId === facilityId) fetchQueue();
      });
      socket.on('appointmentBooked', () => fetchAppointments());
      socket.on('appointmentUpdated', () => fetchAppointments());

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

  const fetchQueue = async () => {
    try {
      const response = await api.get(`/api/queue/facility/${facilityId}`);
      setQueueData(response.data);
    } catch (error) { console.error('Queue fetch error:', error); }
  };

  const fetchAppointments = async () => {
    try {
      const response = await api.get(`/api/appointments/facility/${facilityId}`);
      setAppointments(response.data.appointments || []);
    } catch (error) { console.error('Appointments fetch error:', error); }
  };

  const handleCallNext = async () => {
    try {
      const response = await api.patch(`/api/queue/facility/${facilityId}/call-next`);
      setSuccess(`📢 Now calling Token #${response.data.entry.tokenNumber} — ${response.data.entry.patientId?.name}`);
      await fetchQueue();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to call next');
    }
  };

  const handleQueueStatusChange = async (entryId, newStatus) => {
    try {
      await api.patch(`/api/queue/${entryId}/status`, { status: newStatus });
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleSkipPatient = async (entryId) => {
    try {
      await api.patch(`/api/queue/${entryId}/skip`);
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to skip');
    }
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

  const handleAcknowledgeIncident = async (incidentId, notes = '') => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/incidents/${incidentId}/acknowledge`, { notes });
      setSuccess('✅ Incident acknowledged — patient expected');
      await Promise.all([fetchIncidents(), fetchStats()]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to acknowledge');
    }
  };

  const handleRejectIncident = async () => {
    if (!rejectModal) return;
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/incidents/${rejectModal}/reject`, { reason: rejectReason });
      setSuccess('❌ Incident rejected — bed released');
      setRejectModal(null);
      setRejectReason('');
      await Promise.all([fetchIncidents(), fetchStats()]);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reject');
    }
  };

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
      setSuccess(newStatus === 'received' ? '✅ Referral accepted! Follow-up scheduled for CHW.' : '✅ Referral completed');
      await Promise.all([fetchReferrals(), fetchStats()]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update referral');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Categorize incidents
  const pendingAckIncidents = incidents.filter(i => i.status === 'dispatched');
  const acknowledgedIncidents = incidents.filter(i => i.status === 'acknowledged');
  const completedIncidents = incidents.filter(i => i.status === 'completed');
  const pendingReferrals = referrals.filter(r => r.status === 'initiated');

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-violet-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-violet-500/30">
              <Building2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary">{facility?.name || 'Hospital'}</h1>
              <p className="text-xs text-slate-500">
                {facility?.taluka && `${facility.taluka}, `}
                {facility?.district}, {facility?.state} • {user?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageSwitcher variant="dropdown" />
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
              connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {connected ? t('common.live') : t('common.offline')}
            </span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 font-medium">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto py-6 px-4">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'queue', label: `🎫 Queue (${queueData.entries?.length || 0})` },
            { id: 'appointments', label: `📅 Appointments (${appointments.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/70 text-slate-700 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Alerts */}
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

        {activeSection === 'overview' && (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass-card p-4 border-l-4 border-violet-500">
            <p className="text-xs text-slate-500 uppercase font-semibold">{t('hospital.availableBeds')}</p>
            <p className="text-2xl font-bold text-violet-600 mt-1">
              {availableBeds}<span className="text-sm text-slate-500">/{facility?.totalBeds}</span>
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-4 border-l-4 border-blue-500">
            <p className="text-xs text-slate-500 uppercase font-semibold">{t('hospital.pendingReferrals')}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pendingReferrals}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-4 border-l-4 border-red-500 relative">
            <p className="text-xs text-slate-500 uppercase font-semibold">{t('hospital.activeEmergencies')}</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.activeEmergencies}</p>
            {pendingAckIncidents.length > 0 && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"
              />
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-4 border-l-4 border-emerald-500">
            <p className="text-xs text-slate-500 uppercase font-semibold">{t('hospital.completedToday')}</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedToday}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card p-4 border-l-4 border-orange-500">
            <p className="text-xs text-slate-500 uppercase font-semibold">{t('hospital.totalIncoming')}</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.totalIncoming}</p>
          </motion.div>
        </div>

        {/* PENDING ACKNOWLEDGMENT — Priority section */}
        {pendingAckIncidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6 border-2 border-red-300 bg-red-50/50"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center text-red-700">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mr-2"
              >
                <ShieldCheck className="w-5 h-5" />
              </motion.div>
              ⚠️ Awaiting Your Confirmation ({pendingAckIncidents.length})
              <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">ACTION REQUIRED</span>
            </h2>
            <p className="text-xs text-red-600 mb-4">
              An ambulance has been dispatched. Confirm to let the operator know you can accept the patient.
            </p>

            <div className="space-y-4">
              {pendingAckIncidents.map(inc => (
                <motion.div
                  key={inc._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-5 border-2 border-red-200 shadow-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-lg">
                          {inc.patientId?.name || 'Unknown Patient'}
                        </span>
                        {inc.patientId?.age && (
                          <span className="text-sm text-slate-500">({inc.patientId.age} yrs)</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{inc.patientDescription}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />
                          {inc.patientLocation || 'Location not specified'}
                        </span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />
                          {new Date(inc.dispatchedAt || inc.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      inc.severity === 'critical' ? 'bg-red-100 text-red-700 border border-red-300' :
                      inc.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {inc.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-sky-50/70 border border-sky-100 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-sky-700 mb-1">🧠 {t('triage.reasoning')}</p>
                    <p className="text-xs text-slate-700">{inc.aiReasoning}</p>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAcknowledgeIncident(inc._id, 'Patient accepted')}
                      className="flex-1 btn-gradient-success py-3 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ✅ Confirm & Accept Patient
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRejectModal(inc._id)}
                      className="px-4 py-3 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bed Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <BedDouble className="w-5 h-5 mr-2 text-violet-600" />
            {t('hospital.bedAvailability')}
          </h2>
          <div className="flex gap-3">
            <input
              type="number"
              value={availableBeds}
              onChange={(e) => setAvailableBeds(e.target.value)}
              min="0"
              max={facility?.totalBeds || 0}
              className="input-modern flex-1"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpdateBeds}
              className="btn-gradient-purple px-8"
            >
              {t('hospital.update')}
            </motion.button>
          </div>
        </motion.div>

        {/* Acknowledged Incidents (active) */}
        {acknowledgedIncidents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              🏥 Accepted Patients ({acknowledgedIncidents.length})
            </h2>
            <div className="space-y-3">
              {acknowledgedIncidents.map(inc => (
                <div key={inc._id} className="border-l-4 border-emerald-500 bg-emerald-50/50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {inc.patientId?.name || 'Unknown'}
                        {inc.patientId?.age && <span className="text-sm text-slate-500"> ({inc.patientId.age} yrs)</span>}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">{inc.patientDescription}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        ✅ Acknowledged {new Date(inc.acknowledgedAt).toLocaleTimeString()}
                        {inc.acknowledgedBy?.name && ` by ${inc.acknowledgedBy.name}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompleteIncident(inc._id)}
                    className="mt-3 w-full btn-gradient-success py-2 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('hospital.markComplete')}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Referrals Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            📥 {t('hospital.incomingReferrals')}
            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-sm">
              {pendingReferrals.length} {t('common.pending')}
            </span>
          </h2>
          {referrals.length === 0 ? (
            <p className="text-slate-500 text-center py-8">{t('hospital.noReferrals')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referrals.map(ref => (
                <div key={ref._id} className={`border rounded-2xl p-4 hover:shadow-lg transition-shadow ${
                  ref.isEmergencyFlagged ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{ref.patientId?.name || 'Unknown'}</p>
                      {ref.isEmergencyFlagged && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">🚨</span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      ref.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      ref.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {ref.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2 line-clamp-2">{ref.reason}</p>
                  <p className="text-xs text-slate-500 mb-2">From: {ref.fromFacilityId?.name}</p>
                  <p className="text-xs mb-3">
                    Status: <span className="font-medium">{ref.status}</span>
                  </p>
                  <div className="flex space-x-2">
                    {ref.status === 'initiated' && (
                      <button onClick={() => handleUpdateReferralStatus(ref._id, 'received')}
                        className="flex-1 btn-gradient-primary py-1.5 text-xs">
                        ✅ {t('hospital.accept')}
                      </button>
                    )}
                    {ref.status === 'received' && (
                      <button onClick={() => handleUpdateReferralStatus(ref._id, 'completed')}
                        className="flex-1 btn-gradient-success py-1.5 text-xs">
                        ✔️ {t('hospital.complete')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
          </>
        )}

        {activeSection === 'queue' && (
          <div className="space-y-6">
            <div className="glass-card p-6 border-l-4 border-teal-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Currently Waiting</p><p className="text-3xl font-bold text-teal-600">{queueData.stats?.totalWaiting || 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">In Consultation</p><p className="text-3xl font-bold text-blue-600">{queueData.stats?.inProgress || 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Avg Consult Time</p><p className="text-3xl font-bold text-violet-600">{queueData.stats?.avgConsultMinutes || 10}<span className="text-sm text-slate-500"> min</span></p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Est. Clear By</p><p className="text-lg font-bold text-slate-700">{queueData.stats?.estClearTime ? new Date(queueData.stats.estClearTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCallNext}
                disabled={!queueData.entries?.some(entry => entry.status === 'waiting')}
                className="mt-6 w-full btn-gradient-success py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                📢 Call Next Patient
              </motion.button>
            </div>
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">🎫 Live OPD Queue</h2>
              {queueData.entries?.length ? (
                <div className="space-y-3">
                  {queueData.entries.map(entry => (
                    <div key={entry._id} className={`rounded-xl p-4 border-2 ${
                      entry.status === 'in-consultation' ? 'border-blue-400 bg-blue-50' :
                      entry.status === 'called' ? 'border-amber-400 bg-amber-50' :
                      entry.priority === 'emergency' ? 'border-red-400 bg-red-50' :
                      entry.priority === 'high' ? 'border-orange-300 bg-orange-50' :
                      'border-slate-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl">{entry.tokenNumber}</div>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{entry.patientId?.name || 'Unknown Patient'}</p>
                            <p className="text-sm text-slate-600">{entry.patientId?.age} yrs · {entry.patientId?.gender} · {entry.patientId?.village}</p>
                            {entry.reason && <p className="text-xs text-slate-500 mt-1 truncate">📋 {entry.reason}</p>}
                            {entry.status === 'waiting' && <p className="text-xs text-slate-600 mt-1">Position <strong>#{entry.position}</strong> · Est. wait <strong>{entry.estimatedWaitMinutes} min</strong></p>}
                            {entry.status === 'called' && <p className="text-xs text-amber-700 font-semibold mt-1">📢 Called</p>}
                            {entry.status === 'in-consultation' && <p className="text-xs text-blue-700 font-semibold mt-1">⏱ In consultation</p>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {entry.status === 'waiting' && <><button onClick={() => handleQueueStatusChange(entry._id, 'called')} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold">Call</button><button onClick={() => handleSkipPatient(entry._id)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Skip</button></>}
                          {entry.status === 'called' && <><button onClick={() => handleQueueStatusChange(entry._id, 'in-consultation')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">Start</button><button onClick={() => handleSkipPatient(entry._id)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Skip</button></>}
                          {entry.status === 'in-consultation' && <button onClick={() => handleQueueStatusChange(entry._id, 'done')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">✅ Done</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-12"><div className="text-6xl mb-3">✨</div><p className="text-slate-500 font-medium">Queue is empty</p><p className="text-slate-400 text-sm mt-1">Patients added by CHWs will appear here</p></div>}
            </div>
          </div>
        )}

        {activeSection === 'appointments' && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">📅 Today's Appointments ({appointments.length})</h2>
            {appointments.length ? <div className="space-y-3">{appointments.map(apt => (
              <div key={apt._id} className="border rounded-xl p-4 border-slate-200 bg-white">
                <div className="flex justify-between items-start"><div><p className="font-bold">{apt.patientId?.name}</p><p className="text-sm text-slate-600">{apt.patientId?.age} yrs · {apt.patientId?.village}</p><p className="text-xs text-slate-500 mt-1">📋 {apt.reason}</p></div><div className="text-right"><p className="text-lg font-bold text-slate-900">{new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{apt.status}</span></div></div>
              </div>
            ))}</div> : <p className="text-slate-500 text-center py-8">No appointments scheduled for today</p>}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                Reject Incident
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                The ambulance will be notified and the reserved bed will be released.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g., No ICU bed available)"
                rows="3"
                className="input-modern mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectIncident}
                  className="flex-1 btn-gradient-danger py-2.5"
                >
                  Confirm Reject
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
