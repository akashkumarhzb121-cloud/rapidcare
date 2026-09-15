import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOffline } from '../context/OfflineContext';

const OfflineBadge = ({ variant = 'pill' }) => {
  const { t } = useTranslation();
  const { online, pendingCount, syncing, runSync } = useOffline();

  const handleSync = () => {
    if (online && pendingCount > 0) runSync();
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span title={online ? 'Connected to the network' : 'Working offline'} className={`inline-flex min-h-9 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
          online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {online ? <Wifi className="w-3 h-3 mr-1.5" /> : <WifiOff className="w-3 h-3 mr-1.5" />}
          {online ? 'Online' : 'Offline'}
        </span>
        {pendingCount > 0 && (
          <span title={`${pendingCount} pending offline changes`} className="inline-flex min-h-9 items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
            <CloudOff className="w-3 h-3 mr-1.5" />
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {/* Online/Offline indicator */}
        <motion.div
          key={online ? 'online' : 'offline'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
            online
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
        >
          {online ? (
            <>
              <Wifi className="w-3.5 h-3.5 mr-1.5" />
              {t('common.online', 'Online')}
            </>
          ) : (
            <>
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <WifiOff className="w-3.5 h-3.5 mr-1.5" />
              </motion.div>
              {t('common.offline', 'Offline')}
            </>
          )}
        </motion.div>

        {/* Pending sync badge */}
        {pendingCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSync}
            disabled={!online || syncing}
            aria-label={syncing ? 'Syncing offline changes' : 'Sync offline changes'}
            className={`inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
              syncing
                ? 'bg-blue-100 text-blue-700'
                : online
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer'
                : 'bg-amber-100 text-amber-800 cursor-not-allowed opacity-80'
            }`}
            title={online ? 'Click to sync now' : 'Will sync when online'}
          >
            {syncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 mr-1.5" />
                {pendingCount} pending
              </>
            )}
          </motion.button>
        )}

        {/* Synced confirmation */}
        {online && pendingCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center px-2 py-1.5 rounded-full text-xs font-medium text-emerald-600"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Synced
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineBadge;
