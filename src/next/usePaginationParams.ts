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
  /** Navigation method. Default `'replace'`. */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
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

function parsePositiveInt(raw: string | null, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
    history,
    scroll,
  } = options;

  const searchParams = useSearchParams();
  const updateQueryParams = useUpdateQueryParams({ history, scroll });

  const page = parsePositiveInt(searchParams.get(pageKey), 1);
  const pageSize = parsePositiveInt(searchParams.get(pageSizeKey), defaultPageSize);

  const setPage = useCallback(
    (nextPage: number) => {
      updateQueryParams({ [pageKey]: nextPage > 1 ? nextPage : undefined });
    },
    [updateQueryParams, pageKey],
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      updateQueryParams({
        [pageSizeKey]: nextPageSize === defaultPageSize ? undefined : nextPageSize,
        [pageKey]: undefined,
      });
    },
    [updateQueryParams, pageKey, pageSizeKey, defaultPageSize],
  );

  const reset = useCallback(() => {
    updateQueryParams({ [pageKey]: undefined, [pageSizeKey]: undefined });
  }, [updateQueryParams, pageKey, pageSizeKey]);

  return { page, pageSize, setPage, setPageSize, reset };
}
