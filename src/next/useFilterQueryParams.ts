import { useCallback, useEffect, useMemo, useRef } from 'react';
import { buildQuery } from './internal/query';
import { deletionsOf, useQueryNavigation, useStableList } from './internal/useQueryNavigation';

export interface UseFilterQueryParamsOptions<T extends object> {
  /** Returns the current filter values to sync to the URL. */
  parameters: () => Partial<T>;
  /**
   * Dependencies that, when changed, re-sync the URL. Must be a fixed-length
   * list of primitives (it is spread into an effect dependency array). Anything
   * that feeds `parameters()` or `overrides` belongs here.
   */
  deps: unknown[];
  /**
   * Current search term, written to the URL under `searchKey`. The key is only
   * touched when the hook manages a search (`search`, `setSearch` or
   * `initialSearch` passed), so another component's param is never wiped.
   */
  search?: string;
  /** External setter for the search term. */
  setSearch?: (value?: string) => void;
  /**
   * Search term applied once on mount / when it changes. `null` (as sent by
   * `getServerSideProps` props) means "no initial term". The first URL sync
   * waits for this seed to reach `search`, so mounting navigates only once.
   */
  initialSearch?: string | null;
  /** URL key for the search term. Default `'search'`. */
  searchKey?: string;
  /** Keys never written to the URL. */
  ignoredParams?: (keyof T | (string & NonNullable<unknown>))[];
  /** Values merged on top of `parameters()` before writing. */
  overrides?: Partial<T>;
  /**
   * Keys deleted whenever `deps` or `search` change after the first sync —
   * e.g. `['page']` to go back to the first page when a filter changes.
   */
  resetKeys?: string[];
  /** Navigation method. Default `'replace'`. */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
  /** Update the URL without a server round-trip. See `useUpdateQueryParams`. Default `false`. */
  shallow?: boolean;
  /** Keep the current `#hash` fragment in the new URL. Default `false`. */
  preserveHash?: boolean;
}

function sameList(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}

/**
 * Keep URL search params in sync with a filter form's state (Next.js App and
 * Pages Router). Re-syncs whenever `deps` or `search` change (skipping
 * navigations that would not change the URL), seeds the search term from
 * `initialSearch`, and returns a `handleSearch` setter. In the Pages Router
 * the first sync waits for `router.isReady`.
 */
export function useFilterQueryParams<T extends object>(options: UseFilterQueryParamsOptions<T>) {
  const {
    parameters,
    deps,
    search,
    setSearch,
    initialSearch,
    searchKey = 'search',
    ignoredParams = [],
    overrides,
    resetKeys = [],
    history = 'replace',
    scroll = false,
    shallow = false,
    preserveHash = false,
  } = options;

  const seed = initialSearch ?? undefined;
  const managesSearch = 'search' in options || setSearch !== undefined || seed !== undefined;

  const { ready, navigate } = useQueryNavigation();
  const ignoredList = useStableList(ignoredParams);
  const ignored = useMemo(() => new Set(ignoredList), [ignoredList]);
  const resetList = useStableList(resetKeys);

  const lastSeedRef = useRef<string | undefined>(undefined);
  // Set by the seed effect, consumed by the sync effect of the same commit.
  const pendingSeedRef = useRef<{ value: string | undefined } | null>(null);
  // `[...deps, search]` of the last sync that actually ran.
  const lastSyncedRef = useRef<unknown[] | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: seed only when initialSearch changes
  useEffect(() => {
    // Without an initial term there is nothing to seed (or un-seed); don't
    // wipe the consumer's own initial search state.
    if (seed === undefined && lastSeedRef.current === undefined) {
      return;
    }
    lastSeedRef.current = seed;
    if (setSearch) {
      pendingSeedRef.current = { value: seed || undefined };
      setSearch(seed || undefined);
    }
  }, [seed]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-sync is keyed on caller deps + search
  useEffect(() => {
    const seeded = pendingSeedRef.current;
    pendingSeedRef.current = null;

    // Wait for the router, and for a seed set in this commit to reach `search`
    // (the re-render it causes runs this effect again).
    if (!ready || (seeded !== null && seeded.value !== search)) {
      return;
    }

    const current = [...deps, search];
    const changed = lastSyncedRef.current !== null && !sameList(lastSyncedRef.current, current);
    lastSyncedRef.current = current;

    const params = {
      ...(changed ? deletionsOf(resetList) : {}),
      ...parameters(),
      ...(managesSearch ? { [searchKey]: search } : {}),
      ...overrides,
    };
    navigate((base) => buildQuery(base, params, ignored), {
      history,
      scroll,
      shallow,
      preserveHash,
      skipUnchanged: true,
    });
  }, [...deps, search, searchKey, ready]);

  const handleSearch = useCallback(
    (value?: string): void => {
      setSearch?.(value || undefined);
    },
    [setSearch],
  );

  return useMemo(() => ({ handleSearch }), [handleSearch]);
}
