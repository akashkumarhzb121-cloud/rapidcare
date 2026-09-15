import React from 'react';
import { Menu } from 'lucide-react';

const DashboardSidebar = ({ tabs, activeTab, onTabChange, accent = 'sky' }) => {
  const accentClasses = {
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200/80 bg-white/80 px-4 pb-6 pt-24 shadow-xl backdrop-blur-xl lg:block">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                  active ? `${accentClasses[accent]} border shadow-sm` : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <details className="group relative z-20 mb-4 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><Menu className="h-4 w-4" /> Dashboard sections</span>
          <span className="text-xs text-slate-400 group-open:rotate-180">⌄</span>
        </summary>
        <nav className="mt-2 grid grid-cols-1 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:grid-cols-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                  active ? accentClasses[accent] : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </details>
    </>
  );
};

export default DashboardSidebar;
