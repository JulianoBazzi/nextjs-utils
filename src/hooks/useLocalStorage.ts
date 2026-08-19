import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export type SetValue<T> = (value: T | ((prev: T) => T)) => void;

export interface UseLocalStorageOptions<T> {
  /** Turns a value into the stored string. Default `JSON.stringify`. Keep it stable. */
  serializer?: (value: T) => string;
  /**
   * Turns the stored string back into a value. Default `JSON.parse`. Throwing
   * (or returning garbage) falls back to `initialValue` — validate here when
   * the data must be trusted (e.g. a schema parser).
   */
  deserializer?: (raw: string) => T;
  /**
   * Called when storage is unavailable (sandboxed iframe, private mode),
   * full (`QuotaExceededError`), or the stored value cannot be deserialized.
   * Failures are otherwise silent and the hook keeps working with `initialValue`.
   * May fire repeatedly (once per read) while storage stays unavailable.
   */
  onError?: (error: unknown) => void;
}

function dispatchStorageChange(key: string) {
  // Notify listeners in the SAME tab (the native `storage` event only fires cross-tab).
  window.dispatchEvent(new StorageEvent('local-storage', { key }));
}

function defaultSerializer<T>(value: T): string {
  return JSON.stringify(value);
}

function defaultDeserializer<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

/**
 * Persist state in `localStorage`, synced across components and browser tabs.
 * SSR-safe: falls back to `initialValue` when `window` is unavailable.
 * Storage errors never throw — see `options.onError`.
 *
 * @param key - the localStorage key
 * @param initialValue - value used when the key is absent or unreadable
 * @param options - custom (de)serialization and error reporting
 * @returns `[value, setValue, remove]`
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): [T, SetValue<T>, () => void] {
  const { serializer = defaultSerializer, deserializer = defaultDeserializer, onError } = options;

  // Latest values, so `setValue`/`remove` stay referentially stable.
  const initialRef = useRef(initialValue);
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);
  const onErrorRef = useRef(onError);
  useIsomorphicLayoutEffect(() => {
    initialRef.current = initialValue;
    serializerRef.current = serializer;
    deserializerRef.current = deserializer;
    onErrorRef.current = onError;
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const handler = (event: Event) => {
        if (event instanceof StorageEvent) {
          if (event.key !== null && event.key !== key) {
            return;
          }
          // Ignore sessionStorage mutations (same event type, different area).
          if (event.storageArea !== null && event.storageArea !== window.localStorage) {
            return;
          }
        }
        onChange();
      };

      window.addEventListener('storage', handler);
      window.addEventListener('local-storage', handler);

      return () => {
        window.removeEventListener('storage', handler);
        window.removeEventListener('local-storage', handler);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      onErrorRef.current?.(error);
      return null;
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const parse = useCallback((stored: string): { value: T } | null => {
    try {
      return { value: deserializerRef.current(stored) };
    } catch (error) {
      onErrorRef.current?.(error);
      return null;
    }
  }, []);

  // Memoized on the raw string so object values keep their identity across
  // unrelated re-renders (even with an inline `initialValue`).
  const parsed = useMemo(() => (raw === null ? null : parse(raw)), [raw, parse]);
  const value: T = parsed === null ? initialValue : parsed.value;

  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      onErrorRef.current?.(error);
      return;
    }
    dispatchStorageChange(key);
  }, [key]);

  const setValue = useCallback<SetValue<T>>(
    (next) => {
      if (typeof window === 'undefined') {
        return;
      }
      const stored = getSnapshot();
      const parsedCurrent = stored === null ? null : parse(stored);
      const current = parsedCurrent === null ? initialRef.current : parsedCurrent.value;
      const resolved = next instanceof Function ? next(current) : next;
      // `JSON.stringify(undefined)` is not a string; treat it as a removal.
      if (resolved === undefined) {
        remove();
        return;
      }
      try {
        window.localStorage.setItem(key, serializerRef.current(resolved));
      } catch (error) {
        onErrorRef.current?.(error);
        return;
      }
      dispatchStorageChange(key);
    },
    [key, getSnapshot, parse, remove],
  );

  return [value, setValue, remove];
}
