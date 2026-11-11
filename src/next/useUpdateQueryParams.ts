import { useCallback, useMemo } from 'react';
import { buildQuery } from './internal/query';
import { useQueryNavigation, useStableList } from './internal/useQueryNavigation';

export type QueryParamValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | Array<string | number | boolean | Date>;

export type QueryParams = Record<string, QueryParamValue>;

export interface UpdateQueryParamsOptions<T extends object> {
  /** Keys never written to the URL (e.g. internal-only params). Default `[]`. */
  ignoredParams?: (keyof T | (string & NonNullable<unknown>))[];
  /** Navigation method. Default `'replace'` (no extra history entry). */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
  /**
   * Update the URL without re-rendering on the server. Pages Router: shallow
   * routing (`getServerSideProps` does not run). App Router: the History API
   * (requires Next 14.1+; `useSearchParams` stays in sync). Default `false`.
   */
  shallow?: boolean;
  /**
   * Skip the navigation when the resulting params equal the current ones
   * (order-insensitive). Avoids a redundant RSC round-trip. Default `false`.
   */
  skipUnchanged?: boolean;
  /** Keep the current `#hash` fragment in the new URL. Default `false`. */
  preserveHash?: boolean;
}

/**
 * Update multiple URL search params from an object (Next.js App and Pages
 * Router). Empty values (`''`, `null`, `undefined`, `NaN`, invalid dates,
 * empty arrays) delete the param; `false` and `0` are written; dates become
 * ISO strings; array values produce repeated entries. Call with no argument to
 * clear all params and return to the bare pathname.
 *
 * Consecutive calls in the same tick (from this or other URL hooks) build on
 * each other. In the Pages Router nothing is written before `router.isReady`.
 */
export function useUpdateQueryParams<T extends object = QueryParams>(
  options: UpdateQueryParamsOptions<T> = {},
) {
  const {
    ignoredParams = [],
    history = 'replace',
    scroll = false,
    shallow = false,
    skipUnchanged = false,
    preserveHash = false,
  } = options;
  const { navigate } = useQueryNavigation();
  const ignoredList = useStableList(ignoredParams);
  const ignored = useMemo(() => new Set(ignoredList), [ignoredList]);

  return useCallback(
    (params?: Partial<T>) => {
      navigate((base) => (params ? buildQuery(base, params, ignored) : new URLSearchParams()), {
        history,
        scroll,
        shallow,
        skipUnchanged,
        preserveHash,
      });
    },
    [navigate, ignored, history, scroll, shallow, skipUnchanged, preserveHash],
  );
}
