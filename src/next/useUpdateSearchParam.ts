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
}

/**
 * Update a single URL search param (Next.js App Router). Convenience wrapper
 * over {@link useUpdateQueryParams}. Empty values remove the param, and a value
 * equal to the current one is a no-op (avoids a redundant navigation).
 */
export function useUpdateSearchParam(options: UpdateSearchParamOptions = {}) {
  const { key = 'search', history, scroll } = options;
  const searchParams = useSearchParams();
  const update = useUpdateQueryParams({ history, scroll });

  return useCallback(
    (value?: string) => {
      const next = value || undefined;
      const currentValue = searchParams.get(key) ?? undefined;
      if (next === currentValue) {
        return;
      }
      update({ [key]: next } as Partial<QueryParams>);
    },
    [key, update, searchParams],
  );
}
