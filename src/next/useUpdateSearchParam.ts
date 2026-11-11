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
  /**
   * Trim the value before writing it, so `'ana '` after `'ana'` is a no-op and
   * a whitespace-only value removes the param. Default `false`.
   */
  trim?: boolean;
}

/**
 * Update a single URL search param (Next.js App and Pages Router). Convenience
 * wrapper over {@link useUpdateQueryParams}. Empty values remove the param, and
 * a value equal to the current one is a no-op (avoids a redundant navigation).
 */
export function useUpdateSearchParam(options: UpdateSearchParamOptions = {}) {
  const { key = 'search', history, scroll, shallow, trim = false } = options;
  // `skipUnchanged` makes an equal value a no-op, while still collapsing
  // duplicated entries (`?search=a&search=a`) into one.
  const update = useUpdateQueryParams({ history, scroll, shallow, skipUnchanged: true });

  return useCallback(
    (value?: string) => {
      const next = trim ? value?.trim() : value;
      update({ [key]: next || undefined } as Partial<QueryParams>);
    },
    [key, trim, update],
  );
}
