import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope, Video, Clock, CheckCircle2, XCircle,
  AlertTriangle, FileText, Calendar, Phone, MapPin, User,
  Pill
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TeleconsultRoom from '../components/TeleconsultRoom';

const SpecialistDashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();

  const [pending, setPending] = useState([]);
  const [myConsults, setMyConsults] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeConsultId, setActiveConsultId] = useState(null);
  const [prescriptionModal, setPrescriptionModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    followUpDays: 7
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.emit('joinUserRoom', user.id);

      socket.on('newTeleconsultRequest', (data) => {
        setPending(prev => {
          const exists = prev.find(p => p._id === data.consult._id);
          if (exists) return prev;
          return [data.consult, ...prev];
        });
        setSuccess('🩺 New teleconsult request received');
        setTimeout(() => setSuccess(''), 5000);
      });

      return () => {
        socket.off('newTeleconsultRequest');
      };
    }
  }, [socket, connected, user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, myRes] = await Promise.all([
        api.get('/api/teleconsults/pending').catch(() => ({ data: { pending: [] } })),
        api.get('/api/teleconsults/my-consults').catch(() => ({ data: { consults: [] } }))
      ]);
      setPending(pendingRes.data.pending || []);
      setMyConsults(myRes.data.consults || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (consultId) => {
    setError(''); setSuccess('');
    try {
      const response = await api.patch(`/api/teleconsults/${consultId}/accept`);
      setSuccess('✅ Consultation accepted');
      await fetchData();
      setActiveConsultId(consultId);
      setActiveRoom(response.data.consult.roomId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/teleconsults/${rejectModal}/reject`, { reason: rejectReason });
      setSuccess('❌ Consultation rejected — CHW notified');
      setRejectModal(null);
      setRejectReason('');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleStartCall = async (consultId) => {
    try {
      const response = await api.patch(`/api/teleconsults/${consultId}/start`);
      setActiveConsultId(consultId);
      setActiveRoom(response.data.consult.roomId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start');
    }
  };

  const handleOpenRoom = (consult) => {
    setActiveConsultId(consult._id);
    setActiveRoom(consult.roomId);
  };

  const handleCloseRoom = () => {
    const consult = myConsults.find(c => c._id === activeConsultId);
    if (consult && ['accepted', 'active'].includes(consult.status)) {
      setPrescriptionModal({ ...consult });
    }
    setActiveRoom(null);
  };

  const handleCompleteConsult = async () => {
    if (!prescriptionModal) return;
    if (!prescriptionForm.diagnosis.trim()) {
      setError('Please enter a diagnosis before completing');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await api.patch(`/api/teleconsults/${prescriptionModal._id}/complete`, prescriptionForm);
      const followUpCreated = Boolean(response.data.followUp);
      setSuccess(
        followUpCreated
          ? `✅ Consultation completed. Follow-up scheduled in ${prescriptionForm.followUpDays} days.`
          : '✅ Consultation completed successfully.'
      );
      setPrescriptionModal(null);
      setActiveConsultId(null);
      setPrescriptionForm({ diagnosis: '', prescription: '', notes: '', followUpDays: 7 });
      await fetchData();
      setActiveTab('completed');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  const severityBadge = (sev) => {
    const classes = {
      critical: 'bg-red-100 text-red-700 border-red-300',
      moderate: 'bg-amber-100 text-amber-700 border-amber-300',
      mild: 'bg-emerald-100 text-emerald-700 border-emerald-300'
    };
    return classes[sev] || classes.moderate;
  };

  const statusColor = (status) => {
    const colors = {
      requested: 'bg-slate-100 text-slate-700',
      accepted: 'bg-blue-100 text-blue-700',
      active: 'bg-amber-100 text-amber-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.requested;
  };

  const activeConsults = myConsults.filter(c => ['accepted', 'active'].includes(c.status));
  const completedConsults = myConsults.filter(c => c.status === 'completed');

  const specIcons = {
    cardiac: '❤️', trauma: '🩹', respiratory: '🫁', general: '🩺',
    neurology: '🧠', pediatric: '👶', maternal: '🤰', orthopedic: '🦴',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-cyan-400/20 rounded-full blur-3xl" />

      <header className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm sticky top-0">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-2.5 rounded-2xl shadow-lg shadow-teal-500/30">
              <Stethoscope className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary">{t('roles.specialist')}</h1>
              <p className="text-xs text-slate-500">
                {user?.name} · {specIcons[user?.specialization]} <span className="uppercase">{user?.specialization}</span> Specialist
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

      <div className="relative z-10 bg-white/60 backdrop-blur-sm border-b border-white/60">
        <div className="max-w-7xl mx-auto flex space-x-1 px-4">
          {[
            { id: 'pending', label: `⏳ Pending Requests (${pending.length})` },
            { id: 'active', label: `🎥 Active (${activeConsults.length})` },
            { id: 'completed', label: `✅ Completed (${completedConsults.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.id ? 'text-teal-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="spec-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto py-6 px-4">
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

        {/* PENDING TAB */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-3">☕</div>
                <p className="text-slate-600 font-medium">No pending requests</p>
                <p className="text-slate-400 text-sm mt-1">New requests will appear here automatically</p>
              </div>
            ) : (
              pending.map(consult => (
                <motion.div
                  key={consult._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 border-2 border-teal-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg">{consult.patientId?.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${severityBadge(consult.aiSeverity)}`}>
                          {consult.aiSeverity?.toUpperCase()}
                        </span>
                        {consult.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                            🚨 URGENT
                          </span>
                        )}
                        {!consult.doctorId && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            📢 BROADCAST
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        <span>👤 {consult.patientId?.age} yrs · {consult.patientId?.gender}</span>
                        <span>📍 {consult.patientId?.village}, {consult.patientId?.district}</span>
                        {consult.patientId?.phone && <span>📞 {consult.patientId.phone}</span>}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(consult.status)}`}>
                      {consult.status}
                    </span>
                  </div>

                  {/* Patient chronic/high-risk flags */}
                  {(consult.patientId?.chronicConditions?.length > 0 || consult.patientId?.highRiskFlags?.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {consult.patientId?.chronicConditions?.map(c => (
                        <span key={c} className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                          {c.replace('_', ' ')}
                        </span>
                      ))}
                      {consult.patientId?.highRiskFlags?.map(f => (
                        <span key={f} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          ⚠️ {f.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-1">
                      📋 Symptoms (from CHW)
                    </p>
                    <p className="text-sm text-slate-700 mb-3">{consult.symptoms}</p>
                    <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-1">
                      🧠 AI Preliminary Assessment
                    </p>
                    <p className="text-xs text-slate-600">{consult.aiReasoning}</p>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-slate-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Requested {new Date(consult.requestedAt).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRejectModal(consult._id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAccept(consult._id)}
                        className="btn-gradient-success px-6 py-2 text-sm flex items-center gap-2"
                      >
                        <Video className="w-4 h-4" />
                        Accept & Join Call
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ACTIVE TAB */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeConsults.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-3">🎥</div>
                <p className="text-slate-600 font-medium">No active consultations</p>
              </div>
            ) : (
              activeConsults.map(consult => (
                <motion.div
                  key={consult._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 border-2 border-teal-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{consult.patientId?.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{consult.symptoms?.slice(0, 150)}...</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Accepted {new Date(consult.acceptedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(consult.status)}`}>
                      {consult.status}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (consult.status === 'accepted') {
                        handleStartCall(consult._id);
                      } else {
                        handleOpenRoom(consult);
                      }
                    }}
                    className="mt-4 w-full btn-gradient-primary py-3 flex items-center justify-center gap-2"
                  >
                    <Video className="w-5 h-5" />
                    {consult.status === 'accepted' ? '🎬 Start Video Call' : '🔁 Rejoin Call'}
                  </button>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* COMPLETED TAB */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedConsults.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-3">📋</div>
                <p className="text-slate-600 font-medium">No completed consultations yet</p>
              </div>
            ) : (
              completedConsults.map(consult => (
                <motion.div
                  key={consult._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">{consult.patientId?.name}</h3>
                      <p className="text-xs text-slate-500">
                        {new Date(consult.endedAt).toLocaleString()} · {consult.durationMinutes} min
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      ✅ Completed
                    </span>
                  </div>
                  {consult.diagnosis && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase">Diagnosis</p>
                      <p className="text-sm text-slate-800">{consult.diagnosis}</p>
                    </div>
                  )}
                  {consult.prescription && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-700 uppercase flex items-center mb-1">
                        <Pill className="w-3 h-3 mr-1" /> Prescription
                      </p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{consult.prescription}</p>
                    </div>
                  )}
                  {consult.followUpDays > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 mt-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-800">
                        Follow-up scheduled in <strong>{consult.followUpDays} days</strong> — assigned to CHW
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Video Room */}
      <AnimatePresence>
        {activeRoom && (
          <TeleconsultRoom
            roomId={activeRoom}
            onClose={handleCloseRoom}
            patientName={myConsults.find(c => c._id === activeConsultId)?.patientId?.name}
          />
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                Reject Consultation Request
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                The CHW will be notified that you cannot take this consultation.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g., Not available, Refer to colleague)"
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
                  onClick={handleReject}
                  className="flex-1 btn-gradient-danger py-2.5"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meeting Completion Modal */}
      <AnimatePresence>
        {prescriptionModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto"
            >
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-3xl text-white">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Complete Consultation</h3>
                    <p className="text-sm text-emerald-100">
                      Patient: {prescriptionModal.patientId?.name || 'Unknown'} · {prescriptionModal.patientId?.age} yrs · {prescriptionModal.patientId?.village}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-800">✅ Video call completed — please document what happened</span>
                  {prescriptionModal.startedAt && (
                    <span className="text-emerald-600 text-xs">
                      Duration: ~{Math.round((Date.now() - new Date(prescriptionModal.startedAt).getTime()) / 60000)} min
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-2">
                    📋 Reported Symptoms (from CHW)
                  </p>
                  <p className="text-sm text-slate-700">{prescriptionModal.symptoms}</p>
                  {prescriptionModal.aiReasoning && (
                    <>
                      <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mt-3 mb-1">
                        🧠 AI Preliminary Assessment
                      </p>
                      <p className="text-xs text-slate-600">{prescriptionModal.aiReasoning}</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-800">
                    🩺 Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.diagnosis}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                    placeholder="e.g., Acute bronchitis, Stable angina, Migraine"
                    className="input-modern"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-800">💊 Prescription</label>
                  <textarea
                    value={prescriptionForm.prescription}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, prescription: e.target.value})}
                    rows="4"
                    placeholder="e.g.,&#10;Amoxicillin 500mg - 1 tablet TID x 5 days&#10;Paracetamol 650mg - 1 tablet SOS"
                    className="input-modern resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-800">📝 Clinical Notes</label>
                  <textarea
                    value={prescriptionForm.notes}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
                    rows="2"
                    placeholder="Any additional observations..."
                    className="input-modern resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Schedule Follow-up (days)
                  </label>
                  <input
                    type="number"
                    value={prescriptionForm.followUpDays}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, followUpDays: parseInt(e.target.value) || 0})}
                    min="0"
                    max="90"
                    className="input-modern"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {prescriptionForm.followUpDays > 0
                      ? `Follow-up will be auto-scheduled for the CHW in ${prescriptionForm.followUpDays} days`
                      : 'No follow-up needed'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex gap-3">
                <button
                  onClick={() => { setPrescriptionModal(null); setActiveConsultId(null); }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCompleteConsult}
                  disabled={loading || !prescriptionForm.diagnosis.trim()}
                  className="flex-1 btn-gradient-success py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save & Move to Completed'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpecialistDashboard;
