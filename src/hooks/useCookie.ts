import { useCallback, useSyncExternalStore } from 'react';
import type { SetValue } from './useLocalStorage';

export interface CookieOptions {
  /** Expiration in days. Omit for a session cookie. */
  days?: number;
  /** Cookie path. Default `'/'`. */
  path?: string;
  /** SameSite attribute. Default `'lax'`. `'none'` requires `secure: true`. */
  sameSite?: 'lax' | 'strict' | 'none';
  /** Only send the cookie over HTTPS. Default `false`. */
  secure?: boolean;
}

function dispatchCookieChange(name: string) {
  // document.cookie writes emit no event; notify listeners in the same tab.
  window.dispatchEvent(new CustomEvent('cookie-change', { detail: { name } }));
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie.split('; ').find((row) => row.startsWith(prefix));
  return entry === undefined ? null : entry.slice(prefix.length);
}

/**
 * Persist state in a cookie, JSON-serialized and synced across components.
 * SSR-safe: falls back to `initialValue` when `document` is unavailable.
 * Note: reads happen client-side only; for server-side reads use
 * `cookies()` from `next/headers`.
 *
 * @param name - the cookie name
 * @param initialValue - value used when the cookie is absent
 * @param options - expiration and cookie attributes
 * @returns `[value, setValue, remove]`
 */
export function useCookie<T = string>(
  name: string,
  initialValue: T,
  options: CookieOptions = {},
): [T, SetValue<T>, () => void] {
  const { days, path = '/', sameSite = 'lax', secure = false } = options;

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const handler = (event: Event) => {
        if (event instanceof CustomEvent && event.detail?.name !== name) {
          return;
        }
        onChange();
      };

      window.addEventListener('cookie-change', handler);

      return () => {
        window.removeEventListener('cookie-change', handler);
      };
    },
    [name],
  );

  const getSnapshot = useCallback(() => {
    if (typeof document === 'undefined') {
      return null;
    }
    return readCookie(name);
  }, [name]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const value: T = raw === null ? initialValue : safeParse(raw, initialValue);

  const writeCookie = useCallback(
    (serialized: string, maxAge?: number) => {
      let cookie = `${encodeURIComponent(name)}=${serialized}; path=${path}; samesite=${sameSite}`;
      if (maxAge !== undefined) {
        cookie += `; max-age=${maxAge}`;
      }
      if (secure || sameSite === 'none') {
        cookie += '; secure';
      }
      // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is async and lacks universal browser support
      document.cookie = cookie;
      dispatchCookieChange(name);
    },
    [name, path, sameSite, secure],
  );

  const setValue = useCallback<SetValue<T>>(
    (next) => {
      if (typeof document === 'undefined') {
        return;
      }
      const stored = readCookie(name);
      const current = stored === null ? initialValue : safeParse(stored, initialValue);
      const resolved = next instanceof Function ? next(current) : next;
      writeCookie(
        encodeURIComponent(JSON.stringify(resolved)),
        days === undefined ? undefined : days * 86400,
      );
    },
    [name, initialValue, days, writeCookie],
  );

  const remove = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    writeCookie('', 0);
  }, [writeCookie]);

  return [value, setValue, remove];
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return fallback;
  }
}
