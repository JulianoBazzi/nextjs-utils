import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { type QueryParams, useUpdateQueryParams } from './useUpdateQueryParams';

export interface UpdateSearchParamOptions {
  /** Param key to update. Default `'search'`. */
  key?: string;
  /** Navigation method. Default `'replace'`. */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
  /** Update the URL without a server round-trip. See `useUpdateQueryParams`. Default `false`. */
  shallow?: boolean;
}

/**
 * Update a single URL search param (Next.js App Router). Convenience wrapper
 * over {@link useUpdateQueryParams}. Empty values remove the param, and a value
 * equal to the current one is a no-op (avoids a redundant navigation).
 */
export function useUpdateSearchParam(options: UpdateSearchParamOptions = {}) {
  const { key = 'search', history, scroll, shallow } = options;
  const searchParams = useSearchParams();
  const update = useUpdateQueryParams({ history, scroll, shallow });

  return useCallback(
    (value?: string) => {
      const next = value || undefined;
      const current = searchParams.getAll(key);
      // No-op only when the URL holds exactly this single value (duplicates get cleaned up).
      if (current.length <= 1 && current[0] === next) {
        return;
      }
      update({ [key]: next } as Partial<QueryParams>);
    },
    [key, update, searchParams],
  );
}
