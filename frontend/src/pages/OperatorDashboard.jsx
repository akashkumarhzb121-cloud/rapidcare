import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, MapPin, Search, Ambulance, Building2, 
  Clock, BedDouble, Phone, AlertTriangle, CheckCircle2,
  Loader2, Brain, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import VoiceInput from '../components/VoiceInput';

const OperatorDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected, joinIncidentRoom } = useSocket();
  const [incidentForm, setIncidentForm] = useState({
    patientDescription: '',
    patientLocation: '',
  });
  const [currentIncident, setCurrentIncident] = useState(null);
  const [matchedHospitals, setMatchedHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (socket && connected) {
      socket.on('hospitalAvailabilityUpdated', (data) => {
        setMatchedHospitals(prev =>
          prev.map(h => h._id === data.facilityId || h._id === data.hospitalId
            ? { ...h, availableBeds: data.availableBeds }
            : h
          )
        );
      });
      socket.on('incidentStatusChanged', (data) => {
        if (data.incidentId === currentIncident?._id) {
          setCurrentIncident(prev => ({ ...prev, status: data.status }));
          if (data.status === 'completed') setSuccess('✅ Incident completed');
        }
      });
      return () => {
        socket.off('hospitalAvailabilityUpdated');
        socket.off('incidentStatusChanged');
      };
    }
  }, [socket, connected, currentIncident?._id]);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const response = await api.post('/api/incidents', {
        patientDescription: incidentForm.patientDescription,
        patientLocation: incidentForm.patientLocation,
      });
      setCurrentIncident(response.data.incident);
      setMatchedHospitals(response.data.matchedHospitals);
      joinIncidentRoom(response.data.incident._id);
      setSuccess('✅ Incident created - AI analysis complete');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (hospitalId) => {
    setError(''); setSuccess('');
    try {
      const response = await api.patch(`/api/incidents/${currentIncident._id}/dispatch`, { hospitalId });
      setCurrentIncident(prev => ({ ...prev, status: 'dispatched' }));
      // Update bed count in matched hospitals list
      setMatchedHospitals(prev =>
        prev.map(h => h._id === hospitalId
          ? { ...h, availableBeds: response.data.hospital?.availableBeds ?? h.availableBeds - 1 }
          : h
        )
      );
      setSuccess('🚑 Dispatched! Bed reserved.');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to dispatch');
    }
  };

  const severityBadge = (severity) => {
    const config = {
      critical: { class: 'badge-critical', icon: AlertTriangle, label: 'CRITICAL' },
      moderate: { class: 'badge-moderate', icon: TrendingUp, label: 'MODERATE' },
      mild: { class: 'badge-mild', icon: CheckCircle2, label: 'MILD' },
    };
    return config[severity] || config.moderate;
  };

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-sky-500/30">
              <Ambulance className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary">RapidCare</h1>
              <p className="text-xs text-slate-500">Emergency Operator</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {connected ? 'LIVE' : 'OFFLINE'}
            </motion.span>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
            </div>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 font-medium">Logout</button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Incident Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8"
          >
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-sky-500/30 mr-4">
                <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Report Emergency</h2>
                <p className="text-sm text-slate-500">AI will analyze and find the right hospital</p>
              </div>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Patient Symptoms
                  </label>
                  <VoiceInput
                    onTranscript={(text) => setIncidentForm(prev => ({ ...prev, patientDescription: text }))}
                    currentValue={incidentForm.patientDescription}
                  />
                </div>
                <textarea
                  value={incidentForm.patientDescription}
                  onChange={(e) => setIncidentForm({...incidentForm, patientDescription: e.target.value})}
                  rows="4"
                  required
                  placeholder="Describe the patient's condition... or click Voice Input to speak"
                  className="input-modern resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={incidentForm.patientLocation}
                    onChange={(e) => setIncidentForm({...incidentForm, patientLocation: e.target.value})}
                    required
                    placeholder="e.g., Connaught Place, New Delhi"
                    className="input-modern pl-12"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-gradient-primary w-full py-4 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Find Hospitals</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Status Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT: Results */}
          <div className="space-y-6">
            {/* AI Assessment */}
            <AnimatePresence>
              {currentIncident && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-xl mr-3">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">AI Assessment</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className={severityBadge(currentIncident.severity).class}>
                      {React.createElement(severityBadge(currentIncident.severity).icon, { className: 'w-3.5 h-3.5 mr-1.5' })}
                      {severityBadge(currentIncident.severity).label}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                      {currentIncident.requiredSpecialization.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                      currentIncident.status === 'dispatched' 
                        ? 'bg-blue-100 text-blue-700 border-blue-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {currentIncident.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-1">
                      🧠 AI Reasoning
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {currentIncident.aiReasoning}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Matched Hospitals */}
            <AnimatePresence>
              {matchedHospitals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-sky-600" />
                      Matched Hospitals
                    </h3>
                    <span className="text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-semibold">
                      {matchedHospitals.length} found
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {matchedHospitals.map((hospital, index) => (
                      <motion.div
                        key={hospital._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`relative rounded-2xl p-5 border-2 transition-all duration-300 ${
                          index === 0
                            ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-lg'
                        }`}
                      >
                        {index === 0 && (
                          <div className="absolute -top-2.5 left-4">
                            <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-md">
                              ⭐ RECOMMENDED
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-start mt-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-base mb-1 truncate">
                              {hospital.name}
                            </h4>
                            <p className="text-xs text-slate-500 mb-2 truncate flex items-center">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              {hospital.address}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-slate-600">
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {hospital.contactNumber}
                              </span>
                            </div>
                          </div>

                          <div className="ml-4 text-right flex-shrink-0">
                            <p className="text-2xl font-bold text-sky-600 leading-none">
                              {hospital.distance}
                              <span className="text-sm ml-1">km</span>
                            </p>
                            {hospital.travelTime && (
                              <p className="text-xs text-slate-600 mt-1 flex items-center justify-end">
                                <Clock className="w-3 h-3 mr-1" />
                                {hospital.travelTime.formatted}
                              </p>
                            )}
                            <div className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              hospital.availableBeds > 10 ? 'bg-emerald-100 text-emerald-700' :
                              hospital.availableBeds > 5 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              <BedDouble className="w-3 h-3 mr-1" />
                              {hospital.availableBeds} beds
                            </div>
                          </div>
                        </div>

                        <motion.button
                          onClick={() => handleDispatch(hospital._id)}
                          disabled={currentIncident?.status === 'dispatched' || currentIncident?.status === 'completed'}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
                            index === 0
                              ? 'btn-gradient-success'
                              : 'btn-gradient-primary'
                          }`}
                        >
                          <Ambulance className="w-4 h-4" />
                          <span>
                            {currentIncident?.status === 'dispatched' ? 'Already Dispatched' : 'Dispatch Here'}
                          </span>
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OperatorDashboard;
