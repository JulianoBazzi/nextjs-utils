import { useRouter as usePagesRouter } from 'next/compat/router';
import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';

export type RouterEventName =
  | 'routeChangeStart'
  | 'routeChangeComplete'
  | 'routeChangeError'
  | 'beforeHistoryChange'
  | 'hashChangeStart'
  | 'hashChangeComplete';

export interface RouterEventInfo {
  /** Whether the navigation is shallow (skips data fetching). */
  shallow: boolean;
  /** The failure, for `routeChangeError` (`error.cancelled` is `true` when superseded). */
  error?: unknown;
}

export type RouterEventHandler = (url: string, info: RouterEventInfo) => void;

/**
 * Subscribe to a Pages Router event (`router.events`) with automatic cleanup —
 * e.g. analytics on `routeChangeComplete` or a progress bar. The latest
 * `handler` is always used. The App Router has no router events: there the
 * hook does nothing (see `createRouteProgress` for navigation progress).
 *
 * @param event - the router event name
 * @param handler - receives the URL and `{ shallow, error? }`
 */
export function useRouterEvent(event: RouterEventName, handler: RouterEventHandler): void {
  const events = usePagesRouter()?.events;

  const handlerRef = useRef(handler);
  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!events) {
      return;
    }

    // `routeChangeError` is emitted as (error, url, options); the rest as (url, options).
    const listener =
      event === 'routeChangeError'
        ? (error: unknown, url: string, options?: { shallow?: boolean }) =>
            handlerRef.current(url, { shallow: options?.shallow ?? false, error })
        : (url: string, options?: { shallow?: boolean }) =>
            handlerRef.current(url, { shallow: options?.shallow ?? false });

    events.on(event, listener);
    return () => {
      events.off(event, listener);
    };
  }, [events, event]);
}
