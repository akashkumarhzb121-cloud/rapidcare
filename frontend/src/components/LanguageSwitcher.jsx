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
      <button className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 hover:border-sky-400 transition-all">
        <Globe className="w-4 h-4 text-sky-600" />
        <span className="text-sm font-medium text-slate-700">
          {LANGUAGES.find((l) => l.code === i18n.language)?.nativeLabel || 'English'}
        </span>
      </button>
      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
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
