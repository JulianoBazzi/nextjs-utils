import { useEffect, useMemo, useRef } from 'react';
import { reloadPage } from '../internal/page';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export interface UseReloadWhenOptions {
  /**
   * Whether reloading now is safe (e.g. no dialog open, no unsaved form).
   * Checked on every attempt. Default: always.
   */
  canReload?: () => boolean;
  /** Delay between attempts while `canReload()` is `false`. Default `1000` ms. */
  retryMs?: number;
  /** What "reload" means. Default: a full page reload. */
  reload?: () => void;
}

export interface UseReloadWhenReturn {
  /** Ask for a reload; it happens as soon as `canReload()` allows. Repeated calls are merged. */
  requestReload: () => void;
}

/**
 * Defer a page reload until it is safe — e.g. after a service worker update
 * or at a scheduled time on a kiosk, but never while a dialog is open. A
 * request made while reloading is unsafe is kept and retried, not dropped.
 *
 * @example
 * const { requestReload } = useReloadWhen({ canReload: () => !hasOpenDialog() });
 * useServiceWorkerUpdate(requestReload);
 */
export function useReloadWhen(options: UseReloadWhenOptions = {}): UseReloadWhenReturn {
  const optionsRef = useRef(options);
  useIsomorphicLayoutEffect(() => {
    optionsRef.current = options;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef(false);

  const api = useMemo<UseReloadWhenReturn>(() => {
    const attempt = () => {
      timerRef.current = undefined;
      const { canReload, retryMs = 1000, reload = reloadPage } = optionsRef.current;
      if (canReload && !canReload()) {
        timerRef.current = setTimeout(attempt, retryMs);
        return;
      }
      pendingRef.current = false;
      reload();
    };

    return {
      requestReload: () => {
        if (pendingRef.current) {
          return;
        }
        pendingRef.current = true;
        attempt();
      },
    };
  }, []);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      pendingRef.current = false;
    },
    [],
  );

  return api;
}
