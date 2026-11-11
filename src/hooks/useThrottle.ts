import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

// biome-ignore lint/suspicious/noExplicitAny: throttled callbacks have arbitrary signatures
type AnyFn = (...args: any[]) => any;

export interface ThrottledFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Drop the pending trailing call, if any. */
  cancel: () => void;
  /** Run the pending trailing call now (no-op when nothing is pending). */
  flush: () => void;
}

export interface UseThrottleFnOptions {
  /** Run a pending trailing call on unmount instead of dropping it. Default `false`. */
  flushOnUnmount?: boolean;
}

/**
 * Throttle a callback. Returns a stable function that invokes `fn` at most once
 * every `delay` ms: the first call runs immediately (leading), calls made during
 * the wait collapse into one trailing call with the latest arguments. The latest
 * `fn` is always used, and the pending call is cancelled on unmount (or run,
 * with `flushOnUnmount`). The returned function also exposes `cancel()` and
 * `flush()`.
 *
 * @param fn - the callback to throttle
 * @param delay - throttle interval in milliseconds (default `500`)
 * @param options - unmount behavior
 * @returns a throttled version of `fn`
 */
export function useThrottle<F extends AnyFn>(
  fn: F,
  delay?: number,
  options?: UseThrottleFnOptions,
): ThrottledFunction<Parameters<F>>;
/**
 * Throttle a rapidly changing value. The returned value updates at most once
 * every `delay` ms, always settling on the latest value (trailing update).
 *
 * @param value - the value to throttle
 * @param delay - throttle interval in milliseconds (default `500`)
 * @returns the throttled value
 */
export function useThrottle<T>(value: T, delay?: number): T;
export function useThrottle(input: unknown, delay = 500, options: UseThrottleFnOptions = {}) {
  const isFn = typeof input === 'function';

  // ---- value branch ----
  // Lazy init so a function `input` isn't called as a state initializer.
  const [throttled, setThrottled] = useState(() => input);
  const lastValueRef = useRef(input);
  const lastAppliedAtRef = useRef(0);

  useEffect(() => {
    if (isFn || Object.is(lastValueRef.current, input)) return;

    const apply = () => {
      lastValueRef.current = input;
      lastAppliedAtRef.current = Date.now();
      setThrottled(() => input);
    };

    const elapsed = Date.now() - lastAppliedAtRef.current;
    if (elapsed >= delay) {
      apply();
      return;
    }

    const timer = setTimeout(apply, delay - elapsed);
    return () => clearTimeout(timer);
  }, [input, delay, isFn]);

  // ---- function branch ----
  const fnRef = useRef(input);
  const optionsRef = useRef(options);
  // Synced after commit (not during render) so discarded renders never leak in.
  useIsomorphicLayoutEffect(() => {
    fnRef.current = input;
    optionsRef.current = options;
  });
  const lastCalledAtRef = useRef(0);
  const lastArgsRef = useRef<unknown[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const throttledFn = useMemo(() => {
    const invoke = () => {
      lastCalledAtRef.current = Date.now();
      (fnRef.current as AnyFn)(...lastArgsRef.current);
    };
    const run = (...args: unknown[]) => {
      lastArgsRef.current = args;
      const remaining = delay - (Date.now() - lastCalledAtRef.current);

      if (remaining <= 0) {
        invoke();
        return;
      }

      if (timeoutRef.current !== undefined) return;
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        invoke();
      }, remaining);
    };
    run.cancel = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    };
    run.flush = () => {
      if (timeoutRef.current === undefined) return;
      run.cancel();
      invoke();
    };
    return run as ThrottledFunction<unknown[]>;
  }, [delay]);

  // On unmount, drop the pending trailing call — or run it with `flushOnUnmount`.
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

  return isFn ? throttledFn : throttled;
}
