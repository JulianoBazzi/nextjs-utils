import { useRouter as usePagesRouter } from 'next/compat/router';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { recordPending, resolveBase } from './pending';
import { isSameQuery, splitAsPath, withQuery } from './query';

export interface NavigateOptions {
  history: 'push' | 'replace';
  scroll: boolean;
  /**
   * Update the URL without a server round-trip: Pages Router `shallow` routing
   * (skips `getServerSideProps`), or the History API in the App Router (Next
   * 14.1+ keeps `useSearchParams` in sync).
   */
  shallow: boolean;
  preserveHash: boolean;
  skipUnchanged: boolean;
}

export interface QueryNavigation {
  /** `false` until the Pages Router is ready; always `true` in the App Router. */
  ready: boolean;
  pathname: string;
  /** The committed query string, without `?`. */
  currentQuery: string;
  /** Build the next query from the current one and navigate to it. No-op until `ready`. */
  navigate: (produce: (base: URLSearchParams) => URLSearchParams, options: NavigateOptions) => void;
}

/**
 * Router-agnostic URL navigation shared by the `/next` hooks. Detects the
 * Pages Router via `next/compat/router` (which returns `null` in the App
 * Router) and reads/writes the URL through whichever router is mounted.
 */
export function useQueryNavigation(): QueryNavigation {
  const pages = usePagesRouter();
  const app = useRouter();
  const appPathname = usePathname();
  const searchParams = useSearchParams();

  let ready = true;
  let pathname: string;
  let currentQuery: string;
  if (pages) {
    // `asPath` excludes basePath and locale, which the router adds back.
    // Before `isReady` it may still be the route template (`/items/[id]`).
    ready = pages.isReady;
    [pathname, currentQuery] = splitAsPath(pages.asPath);
  } else {
    pathname = appPathname ?? '';
    currentQuery = searchParams?.toString() ?? '';
  }

  const navigate = useCallback<QueryNavigation['navigate']>(
    (produce, options) => {
      if (!ready) {
        return;
      }

      const key = `${pathname}?${currentQuery}`;
      const base = new URLSearchParams(resolveBase(key, currentQuery));
      const next = produce(base);

      if (options.skipUnchanged && isSameQuery(next, base)) {
        return;
      }

      const query = next.toString();
      recordPending(key, query);

      const hash =
        options.preserveHash && typeof window !== 'undefined' ? window.location.hash : '';

      if (pages) {
        void pages[options.history](`${withQuery(pathname, query)}${hash}`, undefined, {
          shallow: options.shallow,
          scroll: options.scroll,
        });
        return;
      }

      if (options.shallow && typeof window !== 'undefined') {
        // `null` state lets Next attach its own; passing the current state
        // (which carries Next's `__NA` marker) would skip the
        // `useSearchParams` sync. `location.pathname` already has basePath.
        const method = options.history === 'push' ? 'pushState' : 'replaceState';
        window.history[method](null, '', `${withQuery(window.location.pathname, query)}${hash}`);
        if (options.scroll) {
          window.scrollTo(0, 0);
        }
        return;
      }

      app[options.history](`${withQuery(pathname, query)}${hash}`, { scroll: options.scroll });
    },
    [ready, pathname, currentQuery, pages, app],
  );

  return { ready, pathname, currentQuery, navigate };
}
