import { useState, useEffect, useRef, useCallback } from 'react';
import NoSleep from 'nosleep.js';

/**
 * Custom hook for fullscreen and screen wake-lock controls.
 * 
 * Wake lock uses NoSleep.js (battle-tested library) which internally:
 *   1. Uses navigator.wakeLock.request('screen') on supported browsers
 *   2. Falls back to playing a silent video on loop on older Android WebView/Chrome
 *      — this is the exact technique used by the legacy sc-prod system
 *
 * The silent video fallback prevents Android from entering sleep mode because
 * the browser treats it as active media playback.
 */
export function useScreenControls() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const noSleepRef = useRef<NoSleep | null>(null);

  // Lazy-init NoSleep instance
  const getNoSleep = useCallback(() => {
    if (!noSleepRef.current) {
      noSleepRef.current = new NoSleep();
    }
    return noSleepRef.current;
  }, []);

  // ─── Fullscreen ──────────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('[ScreenControls] Fullscreen toggle failed:', err);
    }
  }, []);

  // Sync state on fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ─── Wake Lock ───────────────────────────────────────────────
  const toggleWakeLock = useCallback(async () => {
    const noSleep = getNoSleep();
    if (isWakeLockActive) {
      noSleep.disable();
      setIsWakeLockActive(false);
      console.log('[ScreenControls] Wake lock disabled');
    } else {
      // NoSleep.enable() MUST be called from a user gesture (click/tap)
      await noSleep.enable();
      setIsWakeLockActive(true);
      console.log('[ScreenControls] Wake lock enabled');
    }
  }, [isWakeLockActive, getNoSleep]);

  // Re-enable when page becomes visible again (native wake lock gets released
  // when the tab is hidden; NoSleep handles this internally for video fallback)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isWakeLockActive) {
        try {
          const noSleep = getNoSleep();
          // Re-enable to re-acquire native wake lock if it was released
          await noSleep.enable();
        } catch {
          // Silently ignore — video fallback stays active regardless
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isWakeLockActive, getNoSleep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (noSleepRef.current) {
        noSleepRef.current.disable();
        noSleepRef.current = null;
      }
    };
  }, []);

  return {
    isFullscreen,
    isWakeLockActive,
    toggleFullscreen,
    toggleWakeLock,
  };
}
