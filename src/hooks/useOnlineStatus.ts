import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);

  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function getSnapshot() {
  if (typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

const getServerSnapshot = () => true;

/**
 * Track the browser connectivity status via the `online`/`offline` events.
 * SSR-safe: returns `true` on the server.
 *
 * @returns `true` while the browser reports being online
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
