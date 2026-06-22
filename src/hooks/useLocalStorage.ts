import { useCallback, useSyncExternalStore } from 'react';

export type SetValue<T> = (value: T | ((prev: T) => T)) => void;

function dispatchStorageChange(key: string) {
  // Notify listeners in the SAME tab (the native `storage` event only fires cross-tab).
  window.dispatchEvent(new StorageEvent('local-storage', { key }));
}

/**
 * Persist state in `localStorage`, synced across components and browser tabs.
 * SSR-safe: falls back to `initialValue` when `window` is unavailable.
 *
 * @param key - the localStorage key
 * @param initialValue - value used when the key is absent
 * @returns `[value, setValue, remove]`
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>, () => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const handler = (event: Event) => {
        if (event instanceof StorageEvent && event.key !== null && event.key !== key) {
          return;
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
    return window.localStorage.getItem(key);
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const value: T = raw === null ? initialValue : safeParse(raw, initialValue);

  const setValue = useCallback<SetValue<T>>(
    (next) => {
      if (typeof window === 'undefined') {
        return;
      }
      const current = (() => {
        const stored = window.localStorage.getItem(key);
        return stored === null ? initialValue : safeParse(stored, initialValue);
      })();
      const resolved = next instanceof Function ? next(current) : next;
      window.localStorage.setItem(key, JSON.stringify(resolved));
      dispatchStorageChange(key);
    },
    [key, initialValue],
  );

  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(key);
    dispatchStorageChange(key);
  }, [key]);

  return [value, setValue, remove];
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
