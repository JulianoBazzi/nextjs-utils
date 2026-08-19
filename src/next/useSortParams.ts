import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
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
  /** Navigation method. Default `'replace'`. */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
}

export interface UseSortParamsReturn {
  /** The sorted column, or `undefined` when unsorted. */
  sortBy: string | undefined;
  order: SortOrder;
  /** Cycle a column: unsorted -> `defaultOrder` -> flipped -> unsorted. */
  toggleSort: (column: string) => void;
  clearSort: () => void;
}

/**
 * Table sorting state stored in the URL (Next.js App Router). `toggleSort`
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
    history,
    scroll,
  } = options;

  const searchParams = useSearchParams();
  const updateQueryParams = useUpdateQueryParams({ history, scroll });

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
      if (sortBy !== column) {
        updateQueryParams({ [sortKey]: column, [orderKey]: defaultOrder });
        return;
      }
      if (order === defaultOrder) {
        updateQueryParams({ [sortKey]: column, [orderKey]: flippedOrder });
        return;
      }
      updateQueryParams({ [sortKey]: undefined, [orderKey]: undefined });
    },
    [updateQueryParams, sortKey, orderKey, sortBy, order, defaultOrder, flippedOrder, isAllowed],
  );

  const clearSort = useCallback(() => {
    updateQueryParams({ [sortKey]: undefined, [orderKey]: undefined });
  }, [updateQueryParams, sortKey, orderKey]);

  return { sortBy, order, toggleSort, clearSort };
}
