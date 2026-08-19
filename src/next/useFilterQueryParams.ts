import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useUpdateQueryParams } from './useUpdateQueryParams';

export interface UseFilterQueryParamsOptions<T extends object> {
  /** Returns the current filter values to sync to the URL. */
  parameters: () => Partial<T>;
  /**
   * Dependencies that, when changed, re-sync the URL. Must be a fixed-length
   * list of primitives (it is spread into an effect dependency array). Anything
   * that feeds `parameters()` or `overrides` belongs here.
   */
  deps: unknown[];
  /** Current search term, written to the URL alongside the parameters. */
  search?: string;
  /** External setter for the search term. */
  setSearch?: (value?: string) => void;
  /** Search term applied once on mount / when it changes. */
  initialSearch?: string;
  /** URL key for the search term. Default `'search'`. */
  searchKey?: string;
  /** Keys never written to the URL. */
  ignoredParams?: (keyof T | string)[];
  /** Values merged on top of `parameters()` before writing. */
  overrides?: Partial<T>;
}

/**
 * Keep URL search params in sync with a filter form's state (Next.js App Router).
 * Re-syncs whenever `deps` or `search` change, seeds the search term from
 * `initialSearch`, and returns a `handleSearch` setter.
 */
export function useFilterQueryParams<T extends object>({
  parameters,
  deps,
  search,
  setSearch,
  initialSearch,
  searchKey = 'search',
  ignoredParams,
  overrides,
}: UseFilterQueryParamsOptions<T>) {
  const updateQueryParams = useUpdateQueryParams<T>({ ignoredParams });
  const lastSeedRef = useRef<string | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: seed only when initialSearch changes
  useEffect(() => {
    // Without an initial term there is nothing to seed (or un-seed); don't
    // wipe the consumer's own initial search state.
    if (initialSearch === undefined && lastSeedRef.current === undefined) {
      return;
    }
    lastSeedRef.current = initialSearch;
    setSearch?.(initialSearch || undefined);
  }, [initialSearch]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-sync is keyed on caller deps + search
  useEffect(() => {
    updateQueryParams({ ...parameters(), [searchKey]: search, ...overrides } as Partial<T>);
  }, [...deps, search, searchKey]);

  const handleSearch = useCallback(
    (value?: string) => setSearch?.(value || undefined),
    [setSearch],
  );

  return useMemo(() => ({ handleSearch }), [handleSearch]);
}
