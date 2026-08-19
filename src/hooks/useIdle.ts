import { useEffect, useState } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;

// Re-arming the idle timer on every mousemove is wasteful; activity bursts
// within this window are coalesced into a single reset.
const ACTIVITY_THROTTLE_MS = 200;

/**
 * Detect when the user has been inactive (no mouse, keyboard, scroll, or touch
 * activity) for `timeout` ms. SSR-safe: returns `false` on the server.
 *
 * @param timeout - inactivity threshold in milliseconds (default `60000`)
 * @returns `true` once the user is idle, `false` as soon as activity resumes
 */
export function useIdle(timeout = 60_000): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let isIdle = false;
    let lastReset = 0;
    let timer: ReturnType<typeof setTimeout>;

    const startTimer = () => {
      timer = setTimeout(() => {
        isIdle = true;
        setIdle(true);
      }, timeout);
    };

    const handleActivity = () => {
      const now = Date.now();
      if (!isIdle && now - lastReset < ACTIVITY_THROTTLE_MS) {
        return;
      }
      lastReset = now;
      if (isIdle) {
        isIdle = false;
        setIdle(false);
      }
      clearTimeout(timer);
      startTimer();
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }
    // `scroll` does not bubble to window in all cases; capture it instead.
    window.addEventListener('scroll', handleActivity, { passive: true, capture: true });

    startTimer();

    return () => {
      clearTimeout(timer);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }
      window.removeEventListener('scroll', handleActivity, { capture: true });
    };
  }, [timeout]);

  return idle;
}
