import { useMemo, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export interface UseDistinctTriggerOptions<T> {
  /** Equality used to compare values. Default `Object.is`. */
  isEqual?: (a: T, b: T) => boolean;
}

export interface UseDistinctTriggerReturn<T> {
  /** `true` when `value` differs from the remembered one (or nothing is remembered). */
  shouldRun: (value: T) => boolean;
  /** Remember `value` — or, without an argument, the last value passed to `shouldRun`. */
  remember: (value?: T) => void;
  /** Forget the remembered value, so the next `shouldRun` returns `true`. */
  reset: () => void;
}

/**
 * Run a side effect only when its input really changed — e.g. look up a
 * CEP/CNPJ once per distinct value instead of on every blur or keystroke.
 * Call `remember()` after a successful run so a failed lookup can be retried.
 * Pairs well with `useLatestRequest`.
 *
 * @example
 * const lookup = useDistinctTrigger<string>();
 * async function onCepChange(cep: string) {
 *   if (cep.length !== 8 || !lookup.shouldRun(cep)) return;
 *   const address = await fetchAddress(cep);
 *   lookup.remember();
 *   setAddress(address);
 * }
 */
export function useDistinctTrigger<T>(
  options: UseDistinctTriggerOptions<T> = {},
): UseDistinctTriggerReturn<T> {
  const isEqualRef = useRef(options.isEqual ?? Object.is);
  useIsomorphicLayoutEffect(() => {
    isEqualRef.current = options.isEqual ?? Object.is;
  });

  const rememberedRef = useRef<{ value: T } | null>(null);
  const lastCheckedRef = useRef<{ value: T } | null>(null);

  return useMemo<UseDistinctTriggerReturn<T>>(
    () => ({
      shouldRun: (value) => {
        lastCheckedRef.current = { value };
        const remembered = rememberedRef.current;
        return remembered === null || !isEqualRef.current(remembered.value, value);
      },
      remember: (...args: [value?: T]) => {
        if (args.length > 0) {
          rememberedRef.current = { value: args[0] as T };
        } else if (lastCheckedRef.current !== null) {
          rememberedRef.current = lastCheckedRef.current;
        }
      },
      reset: () => {
        rememberedRef.current = null;
      },
    }),
    [],
  );
}
