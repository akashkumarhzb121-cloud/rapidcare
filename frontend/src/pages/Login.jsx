import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, Mail, Lock, ArrowRight, Shield, Sparkles, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      const from = location.state?.from?.pathname;
      if (from) navigate(from, { replace: true });
      else if (result.user.role === 'ambulance_operator') navigate('/operator', { replace: true });
      else if (result.user.role === 'hospital_staff') navigate('/hospital', { replace: true });
      else if (result.user.role === 'community_health_worker') navigate('/chw', { replace: true });
      else if (result.user.role === 'specialist') navigate('/specialist', { replace: true });
      else if (result.user.role === 'district_admin') navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const quickLogin = (role) => {
    const creds = {
      operator: { email: 'pune.operator@rapidcare.com', password: 'password123' },
      staff: { email: 'pune.staff@rapidcare.com', password: 'password123' },
      chw: { email: 'pune.chw@rapidcare.com', password: 'password123' },
      specialist: { email: 'cardio.specialist@rapidcare.com', password: 'password123' },
      admin: { email: 'admin@rapidcare.com', password: 'password123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-r from-sky-400/30 to-indigo-400/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-r from-violet-400/30 to-pink-400/30 rounded-full blur-3xl"
      />

      {/* Language Switcher - Top Right */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher variant="dropdown" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-3xl shadow-2xl shadow-sky-500/40 mb-4"
          >
            <Activity className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-gradient-primary mb-2"
          >
            {t('common.appName')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 text-sm"
          >
            {t('common.tagline')}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card relative p-5 sm:p-8"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

          <motion.button
            type="button"
            onClick={() => navigate('/connect')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/50"
          >
            <Phone className="h-5 w-5" />
            Patient? Need Help? Connect Now
          </motion.button>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center"
              >
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@rapidcare.com"
                  className="input-modern pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-modern pl-12"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-gradient-primary w-full py-3.5 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>{t('auth.signingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.signIn')}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4 text-sky-500 mr-2" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {t('auth.quickDemoLogin')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t('roles.operator'), role: 'operator', color: 'from-sky-500 to-blue-600' },
                { label: t('roles.staff'), role: 'staff', color: 'from-violet-500 to-purple-600' },
                { label: t('roles.chw'), role: 'chw', color: 'from-emerald-500 to-teal-600' },
                { label: t('roles.specialist', 'Specialist'), role: 'specialist', color: 'from-teal-500 to-cyan-600' },
                { label: t('roles.admin', 'Admin'), role: 'admin', color: 'from-amber-500 to-rose-600', colSpan: 'col-span-2' },
              ].map((btn) => (
                <motion.button
                  key={btn.role}
                  type="button"
                  onClick={() => quickLogin(btn.role)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`min-h-11 rounded-2xl px-2 py-2 text-xs font-semibold text-white
                             bg-gradient-to-r ${btn.color} shadow-md hover:shadow-lg transition-all ${btn.colSpan || ''}`}
                >
                  {btn.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              {t('auth.dontHaveAccount')}{' '}
              <span className="font-bold">{t('auth.registerHere')}</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;