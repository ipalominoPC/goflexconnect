import { useEffect, useRef, useState, useCallback } from 'react';

interface InactivityTimerConfig {
  warningTimeoutMs?: number;
  logoutTimeoutMs?: number;
  onWarning?: () => void;
  onLogout?: () => void;
  enabled?: boolean;
}

interface InactivityTimerState {
  isWarningShown: boolean;
  resetTimer: () => void;
  lastActivityTime: number;
}

const DEFAULT_WARNING_MS = 25 * 60 * 1000; // 25 minutes
const DEFAULT_LOGOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useInactivityTimer(config: InactivityTimerConfig = {}): InactivityTimerState {
  const {
    warningTimeoutMs = DEFAULT_WARNING_MS,
    logoutTimeoutMs = DEFAULT_LOGOUT_MS,
    onWarning,
    onLogout,
    enabled = true,
  } = config;

  const [isWarningShown, setIsWarningShown] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  // Request notification permission on mount (non-intrusive)
  useEffect(() => {
    if ('Notification' in window) {
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

  const showBrowserNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('GoFlexConnect – Session Warning', {
          body: "You'll be logged out in 5 minutes unless you return to the app.",
          icon: '/icon.png',
          tag: 'inactivity-warning',
          requireInteraction: false,
        });
      } catch (error) {
        console.warn('Failed to show notification:', error);
      }
    }
  }, []);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);
    setIsWarningShown(false);
    warningShownRef.current = false;

    // Clear existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    if (!enabled) {
      return;
    }

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        setIsWarningShown(true);
        showBrowserNotification();
        if (onWarning) {
          onWarning();
        }
      }
    }, warningTimeoutMs);

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      if (onLogout) {
        onLogout();
      }
    }, logoutTimeoutMs);
  }, [enabled, warningTimeoutMs, logoutTimeoutMs, onWarning, onLogout, showBrowserNotification]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Activity event handlers
    const handleActivity = () => {
      resetTimer();
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'];

    // Throttle activity events to avoid excessive resets
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledHandleActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          handleActivity();
          throttleTimer = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, throttledHandleActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandleActivity);
      });
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [enabled, resetTimer]);

  return {
    isWarningShown,
    resetTimer,
    lastActivityTime,
  };
}

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch((error) => {
      console.warn('Failed to request notification permission:', error);
    });
  }
}
