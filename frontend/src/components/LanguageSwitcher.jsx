import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import api from '../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

const LanguageSwitcher = ({ variant = 'dropdown' }) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = async (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('rapidcare-language', langCode);

    // Sync to user profile if logged in
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        await api.patch('/api/auth/language', { language: langCode }).catch(() => {});
      }
    } catch (e) { /* silent */ }
  };

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-slate-200">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              i18n.language === lang.code
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang.nativeLabel}
          </button>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <button aria-label="Change language" title="Change language" className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 backdrop-blur-sm hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
        <Globe className="w-4 h-4 text-sky-600" />
        <span className="text-sm font-medium text-slate-700">
          {LANGUAGES.find((l) => l.code === i18n.language)?.nativeLabel || 'English'}
        </span>
      </button>
      <div className="invisible absolute right-0 z-50 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`min-h-11 w-full rounded-xl px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-inset ${
              i18n.language === lang.code
                ? 'bg-sky-50 text-sky-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            } first:rounded-t-xl last:rounded-b-xl`}
          >
            <div className="flex items-center justify-between">
              <span>{lang.nativeLabel}</span>
              {i18n.language === lang.code && <span className="text-sky-600">✓</span>}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default LanguageSwitcher;
