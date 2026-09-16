import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Activity, Ambulance, ArrowRight, BarChart3, HeartPulse, LogIn, LogOut, ShieldCheck, Stethoscope, Users, Building2, Phone } from 'lucide-react';

const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path, requiredRole) => {
    if (user?.role === requiredRole) {
      navigate(path);
    } else {
      navigate('/login', { state: { from: { pathname: path } } });
    }
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-2.5 text-white shadow-lg shadow-sky-500/25">
              <Activity className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary sm:text-2xl">RapidCare</h1>
              <p className="hidden text-xs text-slate-500 sm:block">Connected care for every community</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <span className="hidden text-sm font-medium text-slate-600 sm:block">{user.name}</span>
                <button onClick={logout} aria-label="Logout" title="Logout" className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-secondary text-sky-700">
                <LogIn className="h-4 w-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-xl shadow-sky-900/10">
            <HeartPulse className="h-7 w-7" />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Maharashtra rural health network</p>
          <h2 className="text-3xl font-bold tracking-tight text-gradient-primary sm:text-5xl">Care that moves at the speed of need.</h2>
          {/* Emergency / Patient Connect CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 text-center"
          >
            <button
              onClick={() => navigate('/connect')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-2xl shadow-2xl shadow-rose-500/40 hover:shadow-rose-500/60 hover:-translate-y-1 transition-all text-lg"
            >
              <Phone className="w-6 h-6" />
              Patient? Need Help? Connect Now →
            </button>
            <p className="text-xs text-slate-500 mt-2">No login required</p>
          </motion.div>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">AI-powered care continuity and emergency response, connecting frontline teams, hospitals, and specialists in one calm workspace.</p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Operator Card */}
          <div
            onClick={() => handleNavigation('/operator', 'ambulance_operator')}
            className="group panel-card cursor-pointer p-6 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl sm:p-7"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600"><Ambulance className="h-7 w-7" /></div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Emergency Operator</h3>
              <p className="text-sm leading-6 text-slate-600">Dispatch ambulances and manage emergencies.</p>
              {user?.role === 'ambulance_operator' && (
                <span className="badge-success mt-4">✓ Access</span>
              )}
            </div>
          </div>

          {/* CHW Card */}
          <div
            onClick={() => handleNavigation('/chw', 'community_health_worker')}
            className="group panel-card cursor-pointer p-6 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl sm:p-7"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><Users className="h-7 w-7" /></div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Community Health Worker</h3>
              <p className="text-sm leading-6 text-slate-600">Register patients, triage symptoms, and track referrals.</p>
              {user?.role === 'community_health_worker' && (
                <span className="badge-success mt-4">✓ Access</span>
              )}
            </div>
          </div>

          {/* Hospital Card */}
          <div
            onClick={() => handleNavigation('/hospital', 'hospital_staff')}
            className="group panel-card cursor-pointer p-6 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl sm:p-7"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600"><Building2 className="h-7 w-7" /></div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-violet-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Hospital Staff</h3>
              <p className="text-sm leading-6 text-slate-600">Manage beds, medicine, and facility resources.</p>
              {user?.role === 'hospital_staff' && (
                <span className="badge-success mt-4">✓ Access</span>
              )}
            </div>
          </div>

          {/* Specialist Card */}
          <div
            onClick={() => handleNavigation('/specialist', 'specialist')}
            className="group panel-card cursor-pointer p-6 hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl sm:p-7"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-2xl bg-teal-50 p-3 text-teal-600"><Stethoscope className="h-7 w-7" /></div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-teal-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Specialist Doctor</h3>
              <p className="text-sm leading-6 text-slate-600">Review consults, join video calls, and prescribe treatment.</p>
              {user?.role === 'specialist' && (
                <span className="badge-success mt-4">✓ Access</span>
              )}
            </div>
          </div>

          {/* Administrator Card */}
          <div
            onClick={() => handleNavigation('/admin', 'district_admin')}
            className="group panel-card cursor-pointer p-6 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl sm:p-7"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><BarChart3 className="h-7 w-7" /></div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold">District Administrator</h3>
              <p className="text-sm leading-6 text-slate-600">Monitor facilities, referrals, emergencies, and medicine availability.</p>
              {user?.role === 'district_admin' && (
                <span className="badge-success mt-4">✓ Access</span>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/80 bg-white/60 p-5 text-center text-xs text-slate-500 shadow-sm backdrop-blur sm:mt-12">
          <div className="mb-2 flex items-center justify-center gap-2 font-semibold text-slate-700"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Demo access</div>
          <p className="leading-6">Operator: mumbai.operator@rapidcare.com · Staff: mumbai.staff@rapidcare.com · CHW: mumbai.chw@rapidcare.com</p>
          <p className="mt-1">All passwords: password123</p>
        </div>
      </main>
      <footer className="border-t border-white/70 bg-white/60 px-4 py-6 text-center text-xs text-slate-500 backdrop-blur sm:px-6">
        <p>Made with <span className="text-red-500">♥</span> for rural Maharashtra · RapidCare</p>
      </footer>
    </div>
  );
};

export default LandingPage;
