import { useCallback, useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('hashchange', onChange);

  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

function getSnapshot(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? undefined : decodeURIComponent(hash);
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
): [string | undefined, (value?: string) => void] {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setHash = useCallback((value?: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (value === undefined || value === '') {
      // Assigning an empty `location.hash` leaves a dangling '#' in the URL.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = encodeURIComponent(value);
    }

    // Some environments only fire `hashchange` asynchronously (or not at all
    // for replaceState); dispatching manually keeps every subscriber in sync.
    window.dispatchEvent(new Event('hashchange'));
  }, []);

  return [hash ?? defaultValue, setHash];
}
