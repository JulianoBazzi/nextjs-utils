import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import type { SetValue } from './useLocalStorage';

export interface CookieOptions<T = string> {
  /** Expiration in days. Omit (together with `maxAge`) for a session cookie. */
  days?: number;
  /** Expiration in seconds. Takes precedence over `days`. */
  maxAge?: number;
  /** Cookie path. Default `'/'`. Must not contain `;`, `,` or whitespace. */
  path?: string;
  /** Cookie domain (e.g. `'example.com'`). Omit to scope to the current host. */
  domain?: string;
  /** SameSite attribute. Default `'lax'`. `'none'` requires `secure: true`. */
  sameSite?: 'lax' | 'strict' | 'none';
  /**
   * Only send the cookie over HTTPS. `'auto'` sets it when the page itself is
   * served over HTTPS. Default `false`.
   */
  secure?: boolean | 'auto';
  /** Turns a value into the (un-encoded) cookie string. Default `JSON.stringify`. Keep it stable. */
  serializer?: (value: T) => string;
  /**
   * Turns the (decoded) cookie string back into a value. Default `JSON.parse`;
   * throwing falls back to `initialValue`. Use `(raw) => raw` to read plain
   * text cookies written by a server.
   */
  deserializer?: (raw: string) => T;
}

const SAME_SITE_VALUES = ['lax', 'strict', 'none'] as const;
// Hostname (optionally dot-prefixed); excludes attribute separators.
const DOMAIN_PATTERN = /^\.?[a-z0-9-]+(\.[a-z0-9-]+)*$/i;

function dispatchCookieChange(name: string) {
  // document.cookie writes emit no event; notify listeners in the same tab.
  window.dispatchEvent(new CustomEvent('cookie-change', { detail: { name } }));
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie
    .split(';')
    .map((row) => row.trim())
    .find((row) => row.startsWith(prefix));
  return entry === undefined ? null : entry.slice(prefix.length);
}

function defaultSerializer<T>(value: T): string {
  return JSON.stringify(value);
}

function defaultDeserializer<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

/**
 * Persist state in a cookie, JSON-serialized and synced across components in
 * the same tab. Changes from other tabs or from the server are picked up via
 * the Cookie Store API `change` event where supported, and otherwise when the
 * tab regains focus or visibility. SSR-safe: falls back to `initialValue` when
 * `document` is unavailable; for server-side reads use `cookies()` from
 * `next/headers`.
 *
 * Security: cookies written from JavaScript are never `HttpOnly`, so they are
 * readable by any script on the page. Do not store session tokens, credentials
 * or other secrets here — keep those in server-set `HttpOnly` cookies.
 *
 * @param name - the cookie name
 * @param initialValue - value used when the cookie is absent or unreadable
 * @param options - expiration, cookie attributes and (de)serialization
 * @returns `[value, setValue, remove]`
 */
export function useCookie<T = string>(
  name: string,
  initialValue: T,
  options: CookieOptions<T> = {},
): [T, SetValue<T>, () => void] {
  const {
    days,
    maxAge,
    path = '/',
    domain,
    sameSite = 'lax',
    secure = false,
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
  } = options;

  // Latest values, so `setValue`/`remove` stay referentially stable.
  const initialRef = useRef(initialValue);
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);
  useIsomorphicLayoutEffect(() => {
    initialRef.current = initialValue;
    serializerRef.current = serializer;
    deserializerRef.current = deserializer;
  });

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

      // Other tabs and the server write cookies silently: re-read when the tab
      // comes back, and on Cookie Store `change` events where available.
      const cookieStore = (window as { cookieStore?: EventTarget }).cookieStore;

      window.addEventListener('cookie-change', handler);
      window.addEventListener('focus', onChange);
      document.addEventListener('visibilitychange', onChange);
      cookieStore?.addEventListener('change', onChange);

      return () => {
        window.removeEventListener('cookie-change', handler);
        window.removeEventListener('focus', onChange);
        document.removeEventListener('visibilitychange', onChange);
        cookieStore?.removeEventListener('change', onChange);
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

  const parse = useCallback((stored: string): { value: T } | null => {
    try {
      return { value: deserializerRef.current(decodeURIComponent(stored)) };
    } catch {
      return null;
    }
  }, []);

  // Memoized on the raw string so object values keep their identity across
  // unrelated re-renders (even with an inline `initialValue`).
  const parsed = useMemo(() => (raw === null ? null : parse(raw)), [raw, parse]);
  const value: T = parsed === null ? initialValue : parsed.value;

  const writeCookie = useCallback(
    (serialized: string, maxAgeSeconds?: number) => {
      // Attributes are interpolated raw into the cookie string; refuse values
      // that could smuggle extra attributes (e.g. `path: '/; domain=evil.com'`).
      if (/[;,\s]/.test(path)) {
        throw new Error(`useCookie: invalid path "${path}"`);
      }
      if (!SAME_SITE_VALUES.includes(sameSite)) {
        throw new Error(`useCookie: invalid sameSite "${String(sameSite)}"`);
      }
      if (domain !== undefined && !DOMAIN_PATTERN.test(domain)) {
        throw new Error(`useCookie: invalid domain "${domain}"`);
      }

      let cookie = `${encodeURIComponent(name)}=${serialized}; path=${path}; samesite=${sameSite}`;
      if (domain !== undefined) {
        cookie += `; domain=${domain}`;
      }
      if (maxAgeSeconds !== undefined) {
        cookie += `; max-age=${maxAgeSeconds}`;
      }
      const isSecure = secure === 'auto' ? window.location.protocol === 'https:' : secure;
      if (isSecure || sameSite === 'none') {
        cookie += '; secure';
      }
      // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is async and lacks universal browser support
      document.cookie = cookie;
      dispatchCookieChange(name);
    },
    [name, path, domain, sameSite, secure],
  );

  const remove = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    writeCookie('', 0);
  }, [writeCookie]);

  const setValue = useCallback<SetValue<T>>(
    (next) => {
      if (typeof document === 'undefined') {
        return;
      }
      const stored = readCookie(name);
      const parsedCurrent = stored === null ? null : parse(stored);
      const current = parsedCurrent === null ? initialRef.current : parsedCurrent.value;
      const resolved = next instanceof Function ? next(current) : next;
      // `JSON.stringify(undefined)` is not a string; treat it as a removal.
      if (resolved === undefined) {
        remove();
        return;
      }
      writeCookie(
        encodeURIComponent(serializerRef.current(resolved)),
        maxAge ?? (days === undefined ? undefined : days * 86400),
      );
    },
    [name, days, maxAge, parse, remove, writeCookie],
  );

  return [value, setValue, remove];
}
