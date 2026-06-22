import { useCallback, useEffect } from 'react';
import { useUpdateQueryParams } from './useUpdateQueryParams';

export interface UseFilterQueryParamsOptions<T extends object> {
  /** Returns the current filter values to sync to the URL. */
  parameters: () => Partial<T>;
  /** Dependencies that, when changed, re-sync the URL. */
  deps: unknown[];
  /** Current search term, written to the URL alongside the parameters. */
  search?: string;
  /** External setter for the search term. */
  setSearch?: (value?: string) => void;
  /** Search term applied once on mount / when it changes. */
  initialSearch?: string;
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
  ignoredParams,
  overrides,
}: UseFilterQueryParamsOptions<T>) {
  const updateQueryParams = useUpdateQueryParams<T>({ ignoredParams });

  // biome-ignore lint/correctness/useExhaustiveDependencies: seed only when initialSearch changes
  useEffect(() => {
    setSearch?.(initialSearch || undefined);
  }, [initialSearch]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-sync is keyed on caller deps + search
  useEffect(() => {
    updateQueryParams({ ...parameters(), search, ...overrides } as Partial<T>);
  }, [...deps, search]);

  const handleSearch = useCallback(
    (value?: string) => setSearch?.(value || undefined),
    [setSearch],
  );

  return { handleSearch };
}
