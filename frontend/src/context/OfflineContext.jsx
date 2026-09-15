import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  isOnline as checkOnline,
  getPendingCount,
  syncPendingRequests,
  registerConnectivityListeners,
} from '../services/offlineQueue';

const OfflineContext = createContext();

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
};

export const OfflineProvider = ({ children }) => {
  const [online, setOnline] = useState(checkOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.warn('Failed to read pending count:', err);
    }
  }, []);

  // Run sync
  const runSync = useCallback(async () => {
    if (syncing) return;
    if (!checkOnline()) {
      console.log('Cannot sync — offline');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncPendingRequests(api);
      setLastSyncResult(result);
      await refreshPendingCount();
      return result;
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshPendingCount]);

  // Initial load + connectivity listeners
  useEffect(() => {
    refreshPendingCount();

    const cleanup = registerConnectivityListeners({
      onOnline: async () => {
        setOnline(true);
        // Auto-sync on reconnect
        setTimeout(() => runSync(), 500);
      },
      onOffline: () => setOnline(false),
    });

    return cleanup;
  }, [refreshPendingCount, runSync]);

  // Poll for pending count every 5s when offline
  useEffect(() => {
    if (online) return;
    const interval = setInterval(refreshPendingCount, 5000);
    return () => clearInterval(interval);
  }, [online, refreshPendingCount]);

  const value = {
    online,
    pendingCount,
    syncing,
    lastSyncResult,
    refreshPendingCount,
    runSync,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};
