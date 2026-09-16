import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, User, MapPin, AlertTriangle, CheckCircle2,
  Clock, X, Bell, Inbox
} from 'lucide-react';
import api from '../services/api';

const HelpRequestsPanel = ({ userRole, facilityId = null }) => {
  const [pending, setPending] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => {
    fetchAll();

    // Refresh every 30 seconds as a safety net
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [pendingRes, claimsRes] = await Promise.all([
        api.get('/api/help/pending').catch(() => ({ data: { requests: [] } })),
        api.get('/api/help/my-claims').catch(() => ({ data: { requests: [] } }))
      ]);
      setPending(pendingRes.data.requests || []);
      setMyClaims(claimsRes.data.requests || []);
    } catch (err) {
      console.error('Help requests fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id) => {
    setError(''); setSuccess('');
    try {
      const res = await api.patch(`/api/help/${id}/claim`);
      setSuccess(`✅ Claimed. Call ${res.data.request.patientPhone} now.`);
      await fetchAll();
      setTimeout(() => setSuccess(''), 8000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to claim');
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    setError(''); setSuccess('');
    try {
      await api.patch(`/api/help/${resolveModal}/resolve`, { notes: resolveNotes });
      setSuccess('✅ Request resolved');
      setResolveModal(null);
      setResolveNotes('');
      await fetchAll();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve');
    }
  };

  const urgencyConfig = {
    emergency: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-600 text-white', label: '🚨 EMERGENCY' },
    urgent: { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-500 text-white', label: '⚠️ URGENT' },
    normal: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-500 text-white', label: '📋 NORMAL' }
  };

  const roleLabels = {
    ambulance_operator: '🚑 Operator',
    hospital_staff: '🏥 Staff',
    community_health_worker: '👩‍⚕️ CHW',
    any: '🌐 Any'
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
      </div>
    );
  }

  const totalBadge = pending.length + myClaims.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold flex items-center">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl mr-3">
            <Bell className="w-5 h-5 text-white" />
          </div>
          Patient Help Requests
          {pending.length > 0 && (
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-3 bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full"
            >
              {pending.length} new
            </motion.span>
          )}
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/70 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('claimed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'claimed'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Claims ({myClaims.length})
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No pending requests</p>
              <p className="text-slate-400 text-sm mt-1">New patient requests will appear here in real time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(req => {
                const cfg = urgencyConfig[req.urgency] || urgencyConfig.normal;
                return (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4`}
                  >
                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-full font-semibold">
                          {roleLabels[req.targetRole]}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{req.patientName}</p>
                          {req.patientVillage && (
                            <p className="text-xs text-slate-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-0.5" />
                              {req.patientVillage}{req.patientDistrict ? `, ${req.patientDistrict}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={`tel:${req.patientPhone}`}
                        className="flex items-center gap-2 text-sky-700 hover:text-sky-900 font-semibold text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        {req.patientPhone}
                      </a>
                    </div>

                    <div className="bg-white rounded-xl p-3 mb-3 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Issue</p>
                      <p className="text-sm text-slate-800">{req.issue}</p>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleClaim(req._id)}
                        className="flex-1 btn-gradient-success py-2.5 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Claim & Call Now
                      </motion.button>
                      <a
                        href={`tel:${req.patientPhone}`}
                        className="px-4 py-2.5 bg-white hover:bg-sky-50 border border-sky-200 text-sky-700 rounded-xl font-semibold text-sm flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Direct Call
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My Claims Tab */}
      {activeTab === 'claimed' && (
        <div>
          {myClaims.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">You haven't claimed any requests yet</p>
              <p className="text-slate-400 text-sm mt-1">Claim a request from the Pending tab to start helping</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClaims.map(req => {
                const cfg = urgencyConfig[req.urgency] || urgencyConfig.normal;
                return (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                          ✅ CLAIMED BY YOU
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Claimed {new Date(req.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <p className="font-semibold text-slate-800 text-sm">{req.patientName}</p>
                    </div>

                    <a
                      href={`tel:${req.patientPhone}`}
                      className="inline-flex items-center gap-2 text-lg font-bold text-emerald-700 hover:text-emerald-900 mb-3"
                    >
                      <Phone className="w-5 h-5" />
                      {req.patientPhone}
                    </a>

                    <div className="bg-white rounded-xl p-3 mb-3 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Issue</p>
                      <p className="text-sm text-slate-800">{req.issue}</p>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${req.patientPhone}`}
                        className="flex-1 btn-gradient-primary py-2.5 flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Call Patient
                      </a>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setResolveModal(req._id)}
                        className="flex-1 btn-gradient-success py-2.5 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Resolved
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Resolve Modal */}
      <AnimatePresence>
        {resolveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setResolveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                Mark Request as Resolved
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Add a short note about how this was resolved.
              </p>

              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows="3"
                placeholder="e.g., Advised patient to visit PHC. Ambulance dispatched."
                className="input-modern resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setResolveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  className="flex-1 btn-gradient-success py-2.5"
                >
                  Confirm Resolved
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpRequestsPanel;
