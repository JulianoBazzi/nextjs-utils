import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/**
 * Run `onUpdate` when a new service worker takes control of the page
 * (`controllerchange`) — the moment to reload or show "new version available".
 * The very first install on a page that had no controller is not an update
 * and is ignored. SSR-safe; does nothing without service worker support.
 *
 * @param onUpdate - called on every controller change after the first one
 */
export function useServiceWorkerUpdate(onUpdate: () => void): void {
  const onUpdateRef = useRef(onUpdate);
  useIsomorphicLayoutEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    const container = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
    if (!container) {
      return;
    }

    let hadController = container.controller !== null;
    const onControllerChange = () => {
      if (hadController) {
        onUpdateRef.current();
      }
      hadController = true;
    };

    container.addEventListener('controllerchange', onControllerChange);
    return () => {
      container.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);
}
