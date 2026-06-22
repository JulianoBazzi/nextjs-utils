import { useEffect, useRef } from 'react';

/**
 * Return the value a variable held on the previous render.
 *
 * @param value - the current value to track
 * @returns the value from the previous render, or `undefined` on first render
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
