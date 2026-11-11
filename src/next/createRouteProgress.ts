import { useRouter as usePagesRouter } from 'next/compat/router';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export type RouteProgressState = 'idle' | 'loading' | 'done';

export interface CreateRouteProgressOptions {
  /**
   * Ignore navigations that keep the pathname (query/hash-only changes, e.g.
   * filters). Default `true`. With `false`, `useRouteProgress` also watches
   * `useSearchParams`, so in the App Router its component needs a
   * `<Suspense>` boundary on statically rendered routes.
   */
  ignoreSamePathname?: boolean;
}

export interface UseRouteProgressOptions {
  /** Give up waiting and finish after this long. Default `10000` ms. */
  timeoutMs?: number;
  /** How long `'done'` lasts before going back to `'idle'`. Default `300` ms. */
  doneMs?: number;
  /** Pages Router: ignore shallow navigations. Default `true`. */
  ignoreShallow?: boolean;
}

export interface RouteProgress {
  /**
   * App Router hook: re-export it from `instrumentation-client.ts`
   * (Next 15.3+) as `export const onRouterTransitionStart = …`.
   */
  onRouterTransitionStart: (url: string, navigationType?: string) => void;
  /** Navigation state for a progress bar, in both routers. */
  useRouteProgress: (options?: UseRouteProgressOptions) => RouteProgressState;
}

const finishLoading = (current: RouteProgressState): RouteProgressState =>
  current === 'loading' ? 'done' : current;

function isSamePathname(url: string): boolean {
  return new URL(url, window.location.href).pathname === window.location.pathname;
}

function usePathnameKey(): string {
  return usePathname() ?? '';
}

function useUrlKey(): string {
  return `${usePathname() ?? ''}?${useSearchParams()?.toString() ?? ''}`;
}

/**
 * Navigation progress for a top loading bar, in both routers.
 *
 * - **App Router** has no router events. Export the returned
 *   `onRouterTransitionStart` from `instrumentation-client.ts` (Next 15.3+);
 *   the navigation counts as finished when the URL commits.
 * - **Pages Router**: `useRouteProgress` follows `router.events` by itself.
 *
 * Create it once at module level and share it.
 *
 * @example
 * // lib/progress.ts
 * export const progress = createRouteProgress();
 * // instrumentation-client.ts
 * export const { onRouterTransitionStart } = progress;
 * // components/TopBar.tsx
 * const state = progress.useRouteProgress(); // 'idle' | 'loading' | 'done'
 */
export function createRouteProgress(options: CreateRouteProgressOptions = {}): RouteProgress {
  const { ignoreSamePathname = true } = options;
  const listeners = new Set<() => void>();
  const useLocationKey = ignoreSamePathname ? usePathnameKey : useUrlKey;

  function onRouterTransitionStart(url: string) {
    if (ignoreSamePathname && isSamePathname(url)) {
      return;
    }
    for (const listener of listeners) {
      listener();
    }
  }

  function useRouteProgress(hookOptions: UseRouteProgressOptions = {}): RouteProgressState {
    const { timeoutMs = 10000, doneMs = 300, ignoreShallow = true } = hookOptions;
    const events = usePagesRouter()?.events;
    const locationKey = useLocationKey();
    const [state, setState] = useState<RouteProgressState>('idle');

    // App Router: started by `onRouterTransitionStart`.
    useEffect(() => {
      if (events) {
        return;
      }
      const start = () => setState('loading');
      listeners.add(start);
      return () => {
        listeners.delete(start);
      };
    }, [events]);

    // App Router: finished when the new URL commits.
    const lastKeyRef = useRef(locationKey);
    useEffect(() => {
      if (events || lastKeyRef.current === locationKey) {
        return;
      }
      lastKeyRef.current = locationKey;
      setState(finishLoading);
    }, [events, locationKey]);

    // Pages Router: router events.
    useEffect(() => {
      if (!events) {
        return;
      }
      const start = (url: string, info?: { shallow?: boolean }) => {
        if ((ignoreShallow && info?.shallow) || (ignoreSamePathname && isSamePathname(url))) {
          return;
        }
        setState('loading');
      };
      const finish = () => setState(finishLoading);
      events.on('routeChangeStart', start);
      events.on('routeChangeComplete', finish);
      events.on('routeChangeError', finish);
      return () => {
        events.off('routeChangeStart', start);
        events.off('routeChangeComplete', finish);
        events.off('routeChangeError', finish);
      };
    }, [events, ignoreShallow]);

    useEffect(() => {
      if (state === 'idle') {
        return;
      }
      const timer =
        state === 'loading'
          ? setTimeout(() => setState('done'), timeoutMs)
          : setTimeout(() => setState('idle'), doneMs);
      return () => clearTimeout(timer);
    }, [state, timeoutMs, doneMs]);

    return state;
  }

  return { onRouterTransitionStart, useRouteProgress };
}
