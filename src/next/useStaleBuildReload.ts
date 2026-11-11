import { useRouter as usePagesRouter } from 'next/compat/router';
import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import { navigateTo, reloadPage } from '../internal/page';

export interface UseStaleBuildReloadOptions {
  /** `sessionStorage` key that remembers the last reload. Default `'nextjs-utils:stale-build-reload'`. */
  guardKey?: string;
  /**
   * Never reload again within this window, so a chunk that is really gone
   * (not just from an old build) can't cause a reload loop. Default `10000` ms.
   */
  minIntervalMs?: number;
}

const STALE_BUILD_MESSAGES = [
  /Loading (CSS )?chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Failed to load script/i,
];

/**
 * Whether an error means the page runs an outdated build: after a deploy, the
 * chunks the old page refers to no longer exist (`ChunkLoadError`, "Loading
 * (CSS) chunk … failed", failed dynamic imports). Use it in error boundaries
 * (`error.tsx`) to reload instead of showing an error.
 */
export function isStaleBuildNavigationError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'ChunkLoadError') {
    return true;
  }
  return (
    typeof message === 'string' && STALE_BUILD_MESSAGES.some((pattern) => pattern.test(message))
  );
}

/** Records the reload in `sessionStorage`; `false` when one happened too recently. */
function claimReload(guardKey: string, minIntervalMs: number): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(guardKey));
    if (Date.now() - last < minIntervalMs) {
      return false;
    }
    window.sessionStorage.setItem(guardKey, String(Date.now()));
  } catch {
    // Storage unavailable: reload anyway (a loop is no worse than a dead page).
  }
  return true;
}

/**
 * Reload the page when it fails to load code from an outdated build — the
 * classic "navigation broken after a deploy". Listens for uncaught stale-build
 * errors and rejections and, in the Pages Router, `routeChangeError` (then it
 * goes straight to the target URL). A `sessionStorage` guard prevents reload
 * loops. It only listens: errors still reach your own handlers.
 */
export function useStaleBuildReload(options: UseStaleBuildReloadOptions = {}): void {
  const events = usePagesRouter()?.events;

  const optionsRef = useRef(options);
  useIsomorphicLayoutEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const recover = (error: unknown, url?: string) => {
      const { guardKey = 'nextjs-utils:stale-build-reload', minIntervalMs = 10000 } =
        optionsRef.current;
      if (!isStaleBuildNavigationError(error) || !claimReload(guardKey, minIntervalMs)) {
        return;
      }
      if (url === undefined) {
        reloadPage();
      } else {
        navigateTo(url);
      }
    };

    const onError = (event: ErrorEvent) => recover(event.error);
    const onRejection = (event: PromiseRejectionEvent) => recover(event.reason);
    const onRouteChangeError = (error: unknown, url: string) => recover(error, url);

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    events?.on('routeChangeError', onRouteChangeError);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      events?.off('routeChangeError', onRouteChangeError);
    };
  }, [events]);
}
