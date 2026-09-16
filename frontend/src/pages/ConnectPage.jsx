import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone, User, MapPin, AlertTriangle, Ambulance, Building2,
  Users, Send, CheckCircle2, ArrowLeft, Shield
} from 'lucide-react';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ConnectPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientVillage: '',
    patientDistrict: '',
    issue: '',
    urgency: 'normal',
    targetRole: 'ambulance_operator'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [submittedId, setSubmittedId] = useState(null);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/help', form);
      setSuccess(response.data.message);
      setSubmittedId(response.data.request._id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'ambulance_operator',
      icon: Ambulance,
      color: 'from-red-500 to-rose-600',
      title: 'Emergency / Ambulance',
      desc: 'For immediate medical emergency'
    },
    {
      value: 'hospital_staff',
      icon: Building2,
      color: 'from-violet-500 to-purple-600',
      title: 'Hospital Staff',
      desc: 'For hospital admission or bed info'
    },
    {
      value: 'community_health_worker',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      title: 'Health Worker',
      desc: 'For guidance or home visit'
    },
    {
      value: 'any',
      icon: Shield,
      color: 'from-sky-500 to-indigo-600',
      title: 'Any Available',
      desc: 'Send to whoever is available first'
    }
  ];

  const urgencyOptions = [
    { value: 'emergency', label: '🚨 Emergency', desc: 'Life-threatening' },
    { value: 'urgent', label: '⚠️ Urgent', desc: 'Needs attention soon' },
    { value: 'normal', label: '📋 Normal', desc: 'Can wait a bit' }
  ];

  if (success) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-lg w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6 shadow-2xl"
          >
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Request Sent Successfully
          </h1>
          <p className="text-slate-600 mb-6">
            {success}
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-emerald-800 uppercase mb-1">What happens next?</p>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• Your request has been sent to available responders</li>
              <li>• Someone will call you on your phone number</li>
              <li>• Keep your phone nearby</li>
              <li>• If emergency, call 108 directly</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setSuccess(null);
                setSubmittedId(null);
                setForm({
                  patientName: '', patientPhone: '', patientVillage: '',
                  patientDistrict: '', issue: '', urgency: 'normal',
                  targetRole: 'ambulance_operator'
                });
              }}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Send Another
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 btn-gradient-primary py-3"
            >
              Back to Home
            </button>
          </div>

          {submittedId && (
            <p className="mt-6 text-xs text-slate-400">
              Reference ID: {submittedId}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/60">
        <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <LanguageSwitcher variant="dropdown" />
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto py-8 px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl shadow-2xl shadow-sky-500/30 mb-4">
            <Phone className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">
            Need Help? Connect with Us
          </h1>
          <p className="text-slate-600">
            Fill this form and an available responder will call you back.
            <br />
            <span className="text-sm">No login required. Free service.</span>
          </p>
        </motion.div>

        {/* Warning */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">
              Life-threatening emergency?
            </p>
            <p className="text-red-700 text-xs mt-1">
              Call <strong>108</strong> immediately for an ambulance. This form is for non-immediate requests.
            </p>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center"
            >
              <AlertTriangle className="w-5 h-5 mr-2" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="glass-card p-6 sm:p-8 space-y-6"
        >
          {/* Section 1: Who */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold mr-2">1</span>
              Your Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.patientName}
                    onChange={(e) => handleChange('patientName', e.target.value)}
                    required
                    placeholder="e.g., Ramesh Patil"
                    className="input-modern pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={form.patientPhone}
                    onChange={(e) => handleChange('patientPhone', e.target.value)}
                    required
                    pattern="[0-9+\- ]{10,15}"
                    placeholder="+91-XXXXXXXXXX"
                    className="input-modern pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Village / Area</label>
                <input
                  type="text"
                  value={form.patientVillage}
                  onChange={(e) => handleChange('patientVillage', e.target.value)}
                  placeholder="e.g., Uruli Kanchan"
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">District</label>
                <input
                  type="text"
                  value={form.patientDistrict}
                  onChange={(e) => handleChange('patientDistrict', e.target.value)}
                  placeholder="e.g., Pune"
                  className="input-modern"
                />
              </div>
            </div>
          </div>

          {/* Section 2: What */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold mr-2">2</span>
              What's the Problem?
            </h3>
            <textarea
              value={form.issue}
              onChange={(e) => handleChange('issue', e.target.value)}
              required
              rows="4"
              placeholder="Describe briefly what's happening... e.g., 'My mother has high fever since 2 days and needs to see a doctor'"
              className="input-modern resize-none"
            />

            <div className="mt-3">
              <p className="text-sm font-semibold mb-2">Urgency</p>
              <div className="grid grid-cols-3 gap-2">
                {urgencyOptions.map(u => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => handleChange('urgency', u.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.urgency === u.value
                        ? u.value === 'emergency' ? 'border-red-500 bg-red-50' :
                          u.value === 'urgent' ? 'border-amber-500 bg-amber-50' :
                          'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold">{u.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{u.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Who to reach */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold mr-2">3</span>
              Who Do You Want to Reach?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleOptions.map(r => {
                const Icon = r.icon;
                const isSelected = form.targetRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleChange('targetRole', r.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? `border-transparent bg-gradient-to-br ${r.color} text-white shadow-lg`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-white/20' : 'bg-slate-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {r.title}
                        </p>
                        <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {r.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="btn-gradient-primary w-full py-4 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Help Request
              </>
            )}
          </motion.button>

          <p className="text-xs text-center text-slate-500">
            By submitting, you agree to be contacted on the phone number provided.
            Your data is used only to connect you with the right responder.
          </p>
        </motion.form>
      </main>
    </div>
  );
};

export default ConnectPage;
