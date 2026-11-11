import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/** Next local occurrence of `hour:minute`, strictly after `now`. */
function nextOccurrence(hour: number, minute: number, now: Date): Date {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Run `callback` every day at `hour:minute` local time while the component is
 * mounted — e.g. a kiosk that refreshes at 05:00. Timers can fire late or not
 * at all while a device sleeps, so the schedule is re-checked whenever the
 * page becomes visible again: a missed run fires then, once.
 *
 * @param hour - 0–23
 * @param minute - 0–59
 * @param callback - the latest callback is always used
 */
export function useDailyAt(hour: number, minute: number, callback: () => void): void {
  const callbackRef = useRef(callback);
  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dueAt = nextOccurrence(hour, minute, new Date()).getTime();

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(check, Math.max(0, dueAt - Date.now()));
    };

    function check() {
      if (Date.now() >= dueAt) {
        dueAt = nextOccurrence(hour, minute, new Date()).getTime();
        callbackRef.current();
      }
      schedule();
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [hour, minute]);
}
