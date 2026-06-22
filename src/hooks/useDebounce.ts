import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly changing value.
 *
 * @param value - the value to debounce
 * @param delay - debounce delay in milliseconds (default `500`)
 * @returns the value after it has stopped changing for `delay` ms
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}
