import { useCallback, useSyncExternalStore } from 'react';

export interface UseMediaQueryOptions {
  /**
   * Value used on the server, during hydration, and where `matchMedia` is
   * unavailable. Set it to the likeliest client value (e.g. `true` for a
   * mobile-first query) to avoid flashing the wrong variant. Default `false`.
   */
  defaultValue?: boolean;
}

/**
 * Track whether a CSS media query currently matches.
 * SSR-safe: returns `defaultValue` (`false`) on the server.
 *
 * @param query - a media query string, e.g. `'(min-width: 768px)'`
 * @param options - server/hydration value
 * @returns `true` when the query matches
 */
export function useMediaQuery(query: string, options: UseMediaQueryOptions = {}): boolean {
  const { defaultValue = false } = options;

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
      }

      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);

      return () => {
        mql.removeEventListener('change', onChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  }, [query, defaultValue]);

  const getServerSnapshot = () => defaultValue;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
