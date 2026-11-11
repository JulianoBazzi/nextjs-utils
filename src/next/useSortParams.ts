import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { deletionsOf, useStableList } from './internal/useQueryNavigation';
import { useUpdateQueryParams } from './useUpdateQueryParams';

export type SortOrder = 'asc' | 'desc';

export interface UseSortParamsOptions {
  /** URL key for the sorted column. Default `'sortBy'`. */
  sortKey?: string;
  /** URL key for the sort direction. Default `'order'`. */
  orderKey?: string;
  /** Column assumed when the param is absent. Default `undefined` (unsorted). */
  defaultSort?: string;
  /** Direction applied when a column is first sorted. Default `'asc'`. */
  defaultOrder?: SortOrder;
  /**
   * Columns that may be sorted. A URL value outside this list is ignored
   * (falls back to `defaultSort`) and `toggleSort` refuses unknown columns.
   * Strongly recommended when `sortBy` is forwarded to a database query.
   */
  allowedSorts?: readonly string[];
  /**
   * Keys deleted in the same navigation whenever the sort changes — e.g.
   * `['page']` to go back to the first page. Default `[]`.
   */
  resetKeys?: string[];
  /** Navigation method. Default `'replace'`. */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
  /** Update the URL without a server round-trip. See `useUpdateQueryParams`. Default `false`. */
  shallow?: boolean;
}

export interface UseSortParamsReturn {
  /** The sorted column, or `undefined` when unsorted. */
  sortBy: string | undefined;
  order: SortOrder;
  /**
   * Cycle a column: unsorted -> `defaultOrder` -> flipped -> unsorted. With
   * `defaultSort`, clearing falls back to that column, so it only alternates
   * between the two directions.
   */
  toggleSort: (column: string) => void;
  clearSort: () => void;
}

/**
 * Table sorting state stored in the URL (Next.js App and Pages Router). `toggleSort`
 * cycles the direction of a column and switching columns starts over at
 * `defaultOrder`, matching typical sortable table headers.
 *
 * @param options - URL keys, defaults, and navigation behavior
 * @returns `{ sortBy, order, toggleSort, clearSort }`
 */
export function useSortParams(options: UseSortParamsOptions = {}): UseSortParamsReturn {
  const {
    sortKey = 'sortBy',
    orderKey = 'order',
    defaultSort,
    defaultOrder = 'asc',
    allowedSorts,
    resetKeys = [],
    history,
    scroll,
    shallow,
  } = options;

  const searchParams = useSearchParams();
  const updateQueryParams = useUpdateQueryParams({ history, scroll, shallow });
  const resetList = useStableList(resetKeys);

  const isAllowed = useCallback(
    (column: string) =>
      column !== '' && (allowedSorts === undefined || allowedSorts.includes(column)),
    [allowedSorts],
  );

  const rawSort = searchParams.get(sortKey);
  const sortBy = rawSort !== null && isAllowed(rawSort) ? rawSort : defaultSort;
  const rawOrder = searchParams.get(orderKey);
  const order: SortOrder = rawOrder === 'asc' || rawOrder === 'desc' ? rawOrder : defaultOrder;

  const flippedOrder: SortOrder = defaultOrder === 'asc' ? 'desc' : 'asc';

  const toggleSort = useCallback(
    (column: string) => {
      if (!isAllowed(column)) {
        return;
      }
      const resets = deletionsOf(resetList);
      if (sortBy !== column) {
        updateQueryParams({ ...resets, [sortKey]: column, [orderKey]: defaultOrder });
        return;
      }
      if (order === defaultOrder) {
        updateQueryParams({ ...resets, [sortKey]: column, [orderKey]: flippedOrder });
        return;
      }
      updateQueryParams({ ...resets, [sortKey]: undefined, [orderKey]: undefined });
    },
    [
      updateQueryParams,
      sortKey,
      orderKey,
      sortBy,
      order,
      defaultOrder,
      flippedOrder,
      isAllowed,
      resetList,
    ],
  );

  const clearSort = useCallback(() => {
    updateQueryParams({ ...deletionsOf(resetList), [sortKey]: undefined, [orderKey]: undefined });
  }, [updateQueryParams, sortKey, orderKey, resetList]);

  return { sortBy, order, toggleSort, clearSort };
}
