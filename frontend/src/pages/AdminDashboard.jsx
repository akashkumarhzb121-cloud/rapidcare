import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, AlertTriangle, Users, Building2, Activity,
  Heart, Pill, Trophy, MapPin, Shield, Clock, CheckCircle2
  , Bell, LogOut
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import FacilityMap from '../components/FacilityMap';
import DashboardSidebar from '../components/DashboardSidebar';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [emergencyDist, setEmergencyDist] = useState([]);
  const [severityDist, setSeverityDist] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('all');

  useEffect(() => {
    fetchAll();
  }, [districtFilter]);

  const fetchAll = async () => {
    setLoading(true);
    const params = districtFilter !== 'all' ? { district: districtFilter } : {};

    try {
      const [
        overviewRes, trendRes, emergencyRes, severityRes,
        shortagesRes, rankingRes, districtsRes
      ] = await Promise.all([
        api.get('/api/analytics/overview', { params }).catch(() => ({ data: null })),
        api.get('/api/analytics/referral-trend', { params }).catch(() => ({ data: { trend: [] } })),
        api.get('/api/analytics/emergency-distribution', { params }).catch(() => ({ data: { distribution: [] } })),
        api.get('/api/analytics/severity-distribution', { params }).catch(() => ({ data: { distribution: [] } })),
        api.get('/api/analytics/medicine-shortages', { params }).catch(() => ({ data: { shortages: [] } })),
        api.get('/api/analytics/facility-ranking', { params }).catch(() => ({ data: { ranking: [] } })),
        api.get('/api/analytics/district-breakdown').catch(() => ({ data: { districts: [] } }))
      ]);

      setOverview(overviewRes.data);
      setTrend(trendRes.data.trend || []);
      setEmergencyDist(emergencyRes.data.distribution || []);
      setSeverityDist(severityRes.data.distribution || []);
      setShortages(shortagesRes.data.shortages || []);
      setRanking(rankingRes.data.ranking || []);
      setDistricts(districtsRes.data.districts || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'map', label: 'Facility Map', icon: MapPin },
    { id: 'referrals', label: 'Referral Analytics', icon: TrendingUp },
    { id: 'emergencies', label: 'Emergency Insights', icon: AlertTriangle },
    { id: 'ranking', label: 'Facility Ranking', icon: Trophy },
    { id: 'shortages', label: `Medicine Alerts${shortages.length ? ` (${shortages.length})` : ''}`, icon: Pill },
  ];

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/30">
              <BarChart3 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="truncate text-lg font-bold text-gradient-primary sm:text-xl">District Health Dashboard</h1>
              <p className="hidden text-xs text-slate-500 sm:block">Maharashtra Public Health — Real-time analytics</p>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-3">
            {/* District filter */}
            {districts.length > 0 && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="min-w-0 max-w-[145px] rounded-xl border border-slate-200 bg-white/80 px-2 py-2 text-xs font-medium sm:max-w-none sm:px-3 sm:text-sm"
              >
                <option value="all">All Districts</option>
                {districts.map(d => (
                  <option key={d.district} value={d.district}>{d.district} ({d.facilities})</option>
                ))}
              </select>
            )}
            <LanguageSwitcher variant="dropdown" />
            <button aria-label="Notifications" title="Notifications" className="btn-ghost h-10 w-10 p-0">
              <Bell className="h-5 w-5" />
            </button>
            <span className="hidden text-sm font-medium text-slate-700 lg:block">{user?.name}</span>
            <button onClick={logout} aria-label="Logout" title="Logout" className="btn-ghost h-10 w-10 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-auto sm:w-auto sm:px-3">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative z-10 bg-white/60 backdrop-blur-sm border-b border-white/60 lg:hidden">
        <div className="mx-auto flex space-x-1 overflow-x-auto px-4">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-11 items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.id ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 lg:ml-64">
        <DashboardSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} accent="indigo" />

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 border-l-4 border-sky-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Facilities</p>
                    <p className="text-3xl font-bold text-sky-600 mt-1">{overview?.totalFacilities || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Under monitoring</p>
                  </div>
                  <Building2 className="w-10 h-10 text-sky-400" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="glass-card p-5 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Bed Occupancy</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{overview?.occupancyRate || 0}%</p>
                    <p className="text-xs text-slate-500 mt-1">{overview?.availableBeds || 0}/{overview?.totalBeds || 0} available</p>
                  </div>
                  <Activity className="w-10 h-10 text-emerald-400" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card p-5 border-l-4 border-violet-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Referral Completion</p>
                    <p className="text-3xl font-bold text-violet-600 mt-1">{overview?.referrals?.completionRate || 0}%</p>
                    <p className="text-xs text-slate-500 mt-1">{overview?.referrals?.completed || 0}/{overview?.referrals?.total || 0} completed</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-violet-400" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass-card p-5 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Active Emergencies</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{overview?.emergencies?.active || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">{overview?.emergencies?.total || 0} total today</p>
                  </div>
                  <Heart className="w-10 h-10 text-red-400" />
                </div>
              </motion.div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-slate-500" />
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total Patients</p>
                </div>
                <p className="text-2xl font-bold text-slate-800">{overview?.totalPatients || 0}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <p className="text-xs text-slate-500 uppercase font-semibold">Follow-ups Due</p>
                </div>
                <p className="text-2xl font-bold text-amber-600">{overview?.followUpsDue || 0}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-slate-500 uppercase font-semibold">Diagnostics Pending</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{overview?.diagnostics?.pending || 0}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-slate-500 uppercase font-semibold">Diagnostics Ready</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{overview?.diagnostics?.ready || 0}</p>
              </div>
            </div>

            {/* Two charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" /> Emergency Types Distribution
                </h3>
                {emergencyDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={emergencyDist} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {emergencyDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-center py-20">No emergency data yet</p>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-amber-500" /> Severity Distribution
                </h3>
                {severityDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={severityDist} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {severityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-center py-20">No referral data yet</p>}
              </motion.div>
            </div>

            {/* District Breakdown */}
            {districts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-500" /> District-wise Overview
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">District</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Facilities</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Beds</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Occupancy</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Referrals</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Completion</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Emergencies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {districts.map((d, i) => (
                        <tr key={d.district} className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/50' : ''}`}>
                          <td className="py-3 px-3 font-semibold text-slate-800">{d.district}</td>
                          <td className="text-right py-3 px-3 text-slate-700">{d.facilities}</td>
                          <td className="text-right py-3 px-3 text-slate-700">{d.availableBeds}/{d.totalBeds}</td>
                          <td className="text-right py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              d.occupancyRate >= 90 ? 'bg-red-100 text-red-700' :
                              d.occupancyRate >= 75 ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>{d.occupancyRate}%</span>
                          </td>
                          <td className="text-right py-3 px-3 text-slate-700">{d.referrals}</td>
                          <td className="text-right py-3 px-3">
                            <span className="font-semibold text-violet-600">{d.completionRate}%</span>
                          </td>
                          <td className="text-right py-3 px-3 text-slate-700">{d.incidents}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FacilityMap height="700px" showFilters={true} />
          </motion.div>
        )}

        {/* REFERRAL ANALYTICS TAB */}
        {activeTab === 'referrals' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-violet-500" /> Referral Volume — Last 14 Days
              </h3>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} name="Total" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={3} name="Critical" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-center py-20">No referral trend data</p>}
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-violet-500" /> Daily Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Legend />
                  <Bar dataKey="total" fill="#0ea5e9" name="Total" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* EMERGENCIES TAB */}
        {activeTab === 'emergencies' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-5 border-l-4 border-red-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Total Emergencies</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{overview?.emergencies?.total || 0}</p>
              </div>
              <div className="glass-card p-5 border-l-4 border-amber-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Active</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{overview?.emergencies?.active || 0}</p>
              </div>
              <div className="glass-card p-5 border-l-4 border-emerald-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Completed</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{overview?.emergencies?.completed || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-bold text-slate-800 mb-4">By Specialization</h3>
                {emergencyDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={emergencyDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {emergencyDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-center py-20">No data</p>}
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold text-slate-800 mb-4">By Severity</h3>
                {severityDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={severityDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {severityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-center py-20">No data</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* FACILITY RANKING TAB */}
        {activeTab === 'ranking' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-amber-500" /> Facility Performance Ranking
            </h3>
            {ranking.length === 0 ? (
              <p className="text-slate-400 text-center py-12">No facility data</p>
            ) : (
              <div className="space-y-3">
                {ranking.map((f, i) => (
                  <motion.div
                    key={f.facilityId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                      i === 0 ? 'border-amber-300 bg-amber-50' :
                      i === 1 ? 'border-slate-300 bg-slate-50' :
                      i === 2 ? 'border-orange-300 bg-orange-50' :
                      'border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      i === 0 ? 'bg-amber-500 text-white' :
                      i === 1 ? 'bg-slate-400 text-white' :
                      i === 2 ? 'bg-orange-500 text-white' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{f.name}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {f.facilityType.replace('-', ' ')} · {f.district}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-right">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Beds</p>
                        <p className="text-sm font-bold text-slate-700">{f.availableBeds}/{f.totalBeds}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Referrals</p>
                        <p className="text-sm font-bold text-slate-700">{f.completedReferrals}/{f.totalReferrals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Completion</p>
                        <p className={`text-sm font-bold ${
                          f.completionRate >= 80 ? 'text-emerald-600' :
                          f.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>{f.completionRate}%</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* MEDICINE SHORTAGES TAB */}
        {activeTab === 'shortages' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {shortages.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-3">✅</div>
                <p className="text-slate-600 font-medium">All facilities have adequate medicine stock</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card p-5 border-l-4 border-red-500">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Critical (0 units)</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">
                      {shortages.filter(s => s.severity === 'critical').length}
                    </p>
                  </div>
                  <div className="glass-card p-5 border-l-4 border-orange-500">
                    <p className="text-xs text-slate-500 uppercase font-semibold">High Priority</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {shortages.filter(s => s.severity === 'high').length}
                    </p>
                  </div>
                  <div className="glass-card p-5 border-l-4 border-amber-500">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Medium Priority</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                      {shortages.filter(s => s.severity === 'medium').length}
                    </p>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-red-500" /> Medicine Shortage Alerts
                  </h3>
                  <div className="space-y-2">
                    {shortages.map((s, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${
                        s.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        s.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                        'border-amber-500 bg-amber-50'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{s.medicine}</p>
                          <p className="text-xs text-slate-600">{s.facilityName} · {s.district}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-lg font-bold ${
                            s.severity === 'critical' ? 'text-red-600' :
                            s.severity === 'high' ? 'text-orange-600' : 'text-amber-600'
                          }`}>
                            {s.quantity} {s.unit}
                          </p>
                          <span className={`text-xs uppercase font-semibold ${
                            s.severity === 'critical' ? 'text-red-700' :
                            s.severity === 'high' ? 'text-orange-700' : 'text-amber-700'
                          }`}>
                            {s.severity === 'critical' ? '🚨 OUT OF STOCK' : s.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
