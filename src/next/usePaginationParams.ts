import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useUpdateQueryParams } from './useUpdateQueryParams';

export interface UsePaginationParamsOptions {
  /** URL key for the page number. Default `'page'`. */
  pageKey?: string;
  /** URL key for the page size. Default `'pageSize'`. */
  pageSizeKey?: string;
  /** Page size used when the param is absent; that value is kept out of the URL. Default `10`. */
  defaultPageSize?: number;
  /**
   * Upper bound for the page size. Larger values (from the URL or `setPageSize`)
   * are clamped. Recommended whenever `pageSize` feeds a database `LIMIT`.
   */
  maxPageSize?: number;
  /** Navigation method. Default `'replace'`. */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
  /** Update the URL without a server round-trip. See `useUpdateQueryParams`. Default `false`. */
  shallow?: boolean;
}

export interface UsePaginationParamsReturn {
  /** Current page (1-based). `1` when the param is absent or invalid. */
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  /** Change the page size and reset the page back to 1. */
  setPageSize: (pageSize: number) => void;
  /** Remove both params from the URL, returning to the first page. */
  reset: () => void;
}

function isPositiveInt(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/** Strict: only plain base-10 digits are accepted (`'3abc'`, `'1e9'`, `'3.5'` are rejected). */
function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw === null || !/^\d+$/.test(raw)) {
    return fallback;
  }
  const value = Number(raw);
  return isPositiveInt(value) ? value : fallback;
}

function clamp(value: number, max: number | undefined): number {
  return max !== undefined && value > max ? max : value;
}

/**
 * Pagination state stored in the URL (Next.js App Router), so pages are
 * shareable and survive reloads. Default values are kept out of the URL:
 * page 1 and the default page size remove their params.
 *
 * @param options - URL keys, defaults, and navigation behavior
 * @returns `{ page, pageSize, setPage, setPageSize, reset }`
 */
export function usePaginationParams(
  options: UsePaginationParamsOptions = {},
): UsePaginationParamsReturn {
  const {
    pageKey = 'page',
    pageSizeKey = 'pageSize',
    defaultPageSize = 10,
    maxPageSize,
    history,
    scroll,
    shallow,
  } = options;

  const searchParams = useSearchParams();
  const updateQueryParams = useUpdateQueryParams({ history, scroll, shallow });

  const page = parsePositiveInt(searchParams.get(pageKey), 1);
  const pageSize = clamp(
    parsePositiveInt(searchParams.get(pageSizeKey), defaultPageSize),
    maxPageSize,
  );

  const setPage = useCallback(
    (nextPage: number) => {
      // Invalid input (NaN, 0, negatives, non-integers) resets to the first page.
      updateQueryParams({
        [pageKey]: isPositiveInt(nextPage) && nextPage > 1 ? nextPage : undefined,
      });
    },
    [updateQueryParams, pageKey],
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      const size = isPositiveInt(nextPageSize) ? clamp(nextPageSize, maxPageSize) : defaultPageSize;
      updateQueryParams({
        [pageSizeKey]: size === defaultPageSize ? undefined : size,
        [pageKey]: undefined,
      });
    },
    [updateQueryParams, pageKey, pageSizeKey, defaultPageSize, maxPageSize],
  );

  const reset = useCallback(() => {
    updateQueryParams({ [pageKey]: undefined, [pageSizeKey]: undefined });
  }, [updateQueryParams, pageKey, pageSizeKey]);

  return { page, pageSize, setPage, setPageSize, reset };
}
