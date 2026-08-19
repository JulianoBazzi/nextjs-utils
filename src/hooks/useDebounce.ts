import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

// biome-ignore lint/suspicious/noExplicitAny: debounced callbacks have arbitrary signatures
type AnyFn = (...args: any[]) => any;

export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Drop the pending call, if any. */
  cancel: () => void;
  /** Run the pending call now (no-op when nothing is pending). */
  flush: () => void;
}

/**
 * Debounce a callback. Returns a stable function that delays invoking `fn`
 * until `delay` ms have elapsed since the last call. The latest `fn` is always
 * used, and the pending call is cancelled on unmount. The returned function
 * also exposes `cancel()` and `flush()`.
 *
 * @param fn - the callback to debounce
 * @param delay - debounce delay in milliseconds (default `500`)
 * @returns a debounced version of `fn`
 */
export function useDebounce<F extends AnyFn>(
  fn: F,
  delay?: number,
): DebouncedFunction<Parameters<F>>;
/**
 * Debounce a rapidly changing value.
 *
 * @param value - the value to debounce
 * @param delay - debounce delay in milliseconds (default `500`)
 * @returns the value after it has stopped changing for `delay` ms
 */
export function useDebounce<T>(value: T, delay?: number): T;
export function useDebounce(input: unknown, delay = 500) {
  const isFn = typeof input === 'function';

  // ---- value branch ----
  // Lazy init so a function `input` isn't called as a state initializer.
  const [debounced, setDebounced] = useState(() => input);

  // ---- function branch ----
  const fnRef = useRef(input);
  // Synced after commit (not during render) so discarded renders never leak in.
  useIsomorphicLayoutEffect(() => {
    fnRef.current = input;
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastArgsRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (isFn) return;
    const timer = setTimeout(() => setDebounced(() => input), delay);
    return () => clearTimeout(timer);
  }, [input, delay, isFn]);

  // Cancel any pending function-branch call on unmount.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const debouncedFn = useMemo(() => {
    const run = (...args: unknown[]) => {
      lastArgsRef.current = args;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        (fnRef.current as AnyFn)(...args);
      }, delay);
    };
    run.cancel = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    };
    run.flush = () => {
      if (timeoutRef.current === undefined) return;
      run.cancel();
      (fnRef.current as AnyFn)(...lastArgsRef.current);
    };
    return run as DebouncedFunction<unknown[]>;
  }, [delay]);

  return isFn ? debouncedFn : debounced;
}
