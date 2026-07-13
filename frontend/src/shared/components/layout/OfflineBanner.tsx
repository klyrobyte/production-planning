import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import api from '../../lib/axios';

// Render a floating banner when connection to backend server or database is lost
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Ping health endpoint to confirm backend database connection
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await api.get('/site-config');
      if (res.status === 200) {
        setIsOffline(false);
      } else {
        setIsOffline(true);
      }
    } catch (e) {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Monitor online status events and perform periodic health checks
  useEffect(() => {
    const handleOnline = () => checkConnection();
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 z-9999 w-full max-w-sm -translate-x-1/2 px-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <WifiOff className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Koneksi Terputus</p>
            <p className="text-[10px] font-medium text-amber-700 mt-0.5">Database offline atau tidak dapat dijangkau.</p>
          </div>
        </div>
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition hover:bg-amber-200 disabled:opacity-50 cursor-pointer"
          title="Segarkan Koneksi"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
