import { useCallback, useSyncExternalStore } from 'react';

export interface UseHashParamSetOptions {
  /**
   * `'push'` (default) assigns `location.hash`, adding a history entry.
   * `'replace'` rewrites the current entry via `history.replaceState`.
   */
  history?: 'push' | 'replace';
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('hashchange', onChange);
  // `pushState`/`replaceState` (used by the App Router) never fire `hashchange`.
  window.addEventListener('popstate', onChange);

  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

function getSnapshot(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === '') {
    return undefined;
  }
  try {
    return decodeURIComponent(hash);
  } catch {
    // Malformed percent-escapes (e.g. `#%`) must never crash the render.
    return hash;
  }
}

const getServerSnapshot = () => undefined;

/**
 * Read and write the URL `#hash` fragment — handy for tabs, accordions, or
 * modal state that should survive reloads without triggering a Next.js
 * navigation. Call the setter with no argument (or `''`) to clear the hash.
 * SSR-safe: returns `defaultValue` on the server.
 *
 * @param defaultValue - value returned while the URL has no hash
 * @returns `[value, setValue]`
 */
export function useHashParam(
  defaultValue?: string,
): [string | undefined, (value?: string, options?: UseHashParamSetOptions) => void] {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setHash = useCallback((value?: string, options?: UseHashParamSetOptions) => {
    if (typeof window === 'undefined') {
      return;
    }

    const base = window.location.pathname + window.location.search;

    if (value === undefined || value === '') {
      // Assigning an empty `location.hash` leaves a dangling '#' in the URL.
      window.history.replaceState(null, '', base);
    } else if (options?.history === 'replace') {
      window.history.replaceState(null, '', `${base}#${encodeURIComponent(value)}`);
    } else {
      window.location.hash = encodeURIComponent(value);
    }

    // Some environments only fire `hashchange` asynchronously (or not at all
    // for replaceState); dispatching manually keeps every subscriber in sync.
    window.dispatchEvent(new Event('hashchange'));
  }, []);

  return [hash ?? defaultValue, setHash];
}
