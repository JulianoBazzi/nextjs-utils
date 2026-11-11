import { useEffect, useMemo, useRef } from 'react';

export interface LatestRequest {
  /** Aborted as soon as a newer request starts, `cancel()` runs, or the component unmounts. */
  signal: AbortSignal;
  /** `true` while this is still the latest request (check it before setting state). */
  isCurrent: () => boolean;
}

export interface UseLatestRequestReturn {
  /** Start a new request, superseding (and aborting) the previous one. */
  start: () => LatestRequest;
  /** Abort the current request, if any. */
  cancel: () => void;
}

/**
 * Keep only the latest of overlapping async requests — e.g. a modal that
 * fetches on open, or a CEP/CNPJ lookup — so a slow, stale response never
 * overwrites a newer one. Pass `signal` to `fetch` to cancel the network call
 * too. Every request is aborted on unmount.
 *
 * @example
 * const { start } = useLatestRequest();
 * async function load(id: number) {
 *   const request = start();
 *   const data = await fetch(`/api/items/${id}`, { signal: request.signal }).then((r) => r.json());
 *   if (request.isCurrent()) setItem(data);
 * }
 */
export function useLatestRequest(): UseLatestRequestReturn {
  const controllerRef = useRef<AbortController | null>(null);

  const api = useMemo<UseLatestRequestReturn>(
    () => ({
      start: () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        return {
          signal: controller.signal,
          isCurrent: () => controllerRef.current === controller && !controller.signal.aborted,
        };
      },
      cancel: () => {
        controllerRef.current?.abort();
        controllerRef.current = null;
      },
    }),
    [],
  );

  useEffect(() => api.cancel, [api]);

  return api;
}
