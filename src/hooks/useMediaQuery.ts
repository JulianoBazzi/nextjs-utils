import { useCallback, useSyncExternalStore } from 'react';

/**
 * Track whether a CSS media query currently matches.
 * SSR-safe: returns `false` on the server.
 *
 * @param query - a media query string, e.g. `'(min-width: 768px)'`
 * @returns `true` when the query matches
 */
export function useMediaQuery(query: string): boolean {
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
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
