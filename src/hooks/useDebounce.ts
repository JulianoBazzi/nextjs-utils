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

export interface UseDebounceFnOptions {
  /** Run a pending call on unmount instead of dropping it (e.g. autosave). Default `false`. */
  flushOnUnmount?: boolean;
}

export interface UseDebounceValueOptions<T> {
  /**
   * Called whenever the debounced value changes — never for the initial
   * value, so no "first render" guard is needed.
   */
  onChange?: (value: T) => void;
}

/**
 * Debounce a callback. Returns a stable function that delays invoking `fn`
 * until `delay` ms have elapsed since the last call. The latest `fn` is always
 * used, and the pending call is cancelled on unmount (or run, with
 * `flushOnUnmount`). The returned function also exposes `cancel()` and `flush()`.
 *
 * @param fn - the callback to debounce
 * @param delay - debounce delay in milliseconds (default `500`)
 * @param options - unmount behavior
 * @returns a debounced version of `fn`
 */
export function useDebounce<F extends AnyFn>(
  fn: F,
  delay?: number,
  options?: UseDebounceFnOptions,
): DebouncedFunction<Parameters<F>>;
/**
 * Debounce a rapidly changing value.
 *
 * @param value - the value to debounce
 * @param delay - debounce delay in milliseconds (default `500`)
 * @param options - change notification
 * @returns the value after it has stopped changing for `delay` ms
 */
export function useDebounce<T>(value: T, delay?: number, options?: UseDebounceValueOptions<T>): T;
export function useDebounce(
  input: unknown,
  delay = 500,
  options: UseDebounceFnOptions & UseDebounceValueOptions<unknown> = {},
) {
  const isFn = typeof input === 'function';

  // ---- value branch ----
  // Lazy init so a function `input` isn't called as a state initializer.
  const [debounced, setDebounced] = useState(() => input);
  const emittedRef = useRef(input);

  // ---- function branch ----
  const fnRef = useRef(input);
  const optionsRef = useRef(options);
  // Synced after commit (not during render) so discarded renders never leak in.
  useIsomorphicLayoutEffect(() => {
    fnRef.current = input;
    optionsRef.current = options;
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastArgsRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (isFn) return;
    const timer = setTimeout(() => {
      setDebounced(() => input);
      if (!Object.is(emittedRef.current, input)) {
        emittedRef.current = input;
        optionsRef.current.onChange?.(input);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [input, delay, isFn]);

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

  // On unmount, drop the pending call — or run it with `flushOnUnmount`.
  useEffect(
    () => () => {
      if (timeoutRef.current === undefined) return;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
      if (optionsRef.current.flushOnUnmount) {
        (fnRef.current as AnyFn)(...lastArgsRef.current);
      }
    },
    [],
  );

  return isFn ? debouncedFn : debounced;
}
