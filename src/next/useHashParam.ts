import { useCallback, useSyncExternalStore } from 'react';

export interface UseHashParamSetOptions {
  /**
   * `'push'` adds a history entry, `'replace'` rewrites the current one.
   * Default: `'push'` when setting a value (via `location.hash`, so the page
   * still scrolls to a matching anchor), `'replace'` when clearing.
   */
  history?: 'push' | 'replace';
}

// Same-tab notification for every `useHashParam` instance. A custom event
// (instead of a second `hashchange`) so third-party `hashchange` listeners
// don't see the native event twice.
const HASH_PARAM_EVENT = 'hash-param-change';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('hashchange', onChange);
  // `pushState`/`replaceState` (used by the App Router) never fire `hashchange`.
  window.addEventListener('popstate', onChange);
  window.addEventListener(HASH_PARAM_EVENT, onChange);

  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(HASH_PARAM_EVENT, onChange);
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
 * History state for a hash-only update: the Pages Router's own entry state
 * (marked `__N`) is kept so its back/forward handling keeps working; anything
 * else gets `null`, which the App Router (Next 14.1+) fills with its internal
 * state while syncing the new URL.
 */
function historyState(): unknown {
  const state: unknown = window.history.state;
  return state !== null && typeof state === 'object' && '__N' in state ? state : null;
}

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
    const clearing = value === undefined || value === '';
    const history = options?.history ?? (clearing ? 'replace' : 'push');

    if (!clearing && history === 'push') {
      // The browser fires the native `hashchange` (asynchronously).
      window.location.hash = encodeURIComponent(value);
    } else {
      // Assigning an empty `location.hash` would leave a dangling '#'.
      const url = clearing ? base : `${base}#${encodeURIComponent(value)}`;
      const method = history === 'push' ? 'pushState' : 'replaceState';
      window.history[method](historyState(), '', url);
      // The History API never fires `hashchange`; emit it for listeners.
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }

    // Update every instance now, without waiting for the native event.
    window.dispatchEvent(new Event(HASH_PARAM_EVENT));
  }, []);

  return [hash ?? defaultValue, setHash];
}
