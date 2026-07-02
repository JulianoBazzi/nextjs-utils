import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  if (typeof document === 'undefined') {
    return () => {};
  }

  document.addEventListener('visibilitychange', onChange);

  return () => {
    document.removeEventListener('visibilitychange', onChange);
  };
}

function getSnapshot() {
  if (typeof document === 'undefined') {
    return true;
  }
  return document.visibilityState === 'visible';
}

const getServerSnapshot = () => true;

/**
 * Track whether the page is currently visible (`document.visibilityState`).
 * Useful to pause polling, animations, or media when the tab is in background.
 * SSR-safe: returns `true` on the server.
 *
 * @returns `true` while the page is visible
 */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
