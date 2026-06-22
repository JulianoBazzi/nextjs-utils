import { useEffect, useRef } from 'react';

/**
 * Run a callback on a fixed interval. The latest `callback` is always used
 * without resetting the timer; pass `delay = null` to pause.
 *
 * @param callback - function invoked on each tick
 * @param delay - interval in milliseconds, or `null` to pause
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => savedCallback.current(), delay);

    return () => {
      clearInterval(id);
    };
  }, [delay]);
}
