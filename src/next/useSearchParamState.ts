import { useCallback, useMemo, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import { buildQuery } from './internal/query';
import { useQueryNavigation } from './internal/useQueryNavigation';

export type SearchParamStateSetter<T> = (value: T | ((previous: T) => T)) => void;

export interface UseSearchParamStateOptions<T> {
  /** Turns the raw param (`null` when absent) into the state value. */
  parse?: (raw: string | null) => T;
  /**
   * Turns the state value into the param. `undefined`, `null`, `''` and
   * non-finite numbers remove the param. Default `String(value)`.
   */
  serialize?: (value: T) => string | null | undefined;
  /** Navigation method. Default `'replace'`. */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
  /**
   * Update the URL without a server round-trip (Pages Router shallow routing,
   * or the History API in the App Router). Default `false`.
   */
  shallow?: boolean;
}

const NO_IGNORED = new Set<string>();

/**
 * `useState` backed by a single URL search param (Next.js App and Pages
 * Router): the value survives reloads and is shareable, and setting an equal
 * value is a no-op. Without `parse` the state is the raw string (`undefined`
 * when absent). Use `shallow` for client-only state such as a search box, so
 * typing never re-renders the page on the server.
 *
 * @example
 * const [search, setSearch] = useSearchParamState('search', { shallow: true });
 * const [page, setPage] = useSearchParamState('page', {
 *   parse: (raw) => Number(raw) || 1,
 *   serialize: (value) => (value > 1 ? String(value) : undefined),
 * });
 */
export function useSearchParamState(
  key: string,
  options?: UseSearchParamStateOptions<string | undefined>,
): [string | undefined, SearchParamStateSetter<string | undefined>];
export function useSearchParamState<T>(
  key: string,
  options: UseSearchParamStateOptions<T> & { parse: (raw: string | null) => T },
): [T, SearchParamStateSetter<T>];
export function useSearchParamState<T>(
  key: string,
  options: UseSearchParamStateOptions<T> = {},
): [T, SearchParamStateSetter<T>] {
  const { history = 'replace', scroll = false, shallow = false } = options;
  const { currentQuery, navigate } = useQueryNavigation();

  const parseRef = useRef(options.parse);
  const serializeRef = useRef(options.serialize);
  useIsomorphicLayoutEffect(() => {
    parseRef.current = options.parse;
    serializeRef.current = options.serialize;
  });

  const read = useCallback(
    (params: URLSearchParams): T => {
      const raw = params.get(key);
      const parse = parseRef.current;
      return parse ? parse(raw) : ((raw ?? undefined) as T);
    },
    [key],
  );

  // Parsed once per URL change, so object values keep their identity.
  const value = useMemo(() => read(new URLSearchParams(currentQuery)), [read, currentQuery]);

  const setValue = useCallback<SearchParamStateSetter<T>>(
    (next) => {
      navigate(
        (base) => {
          const resolved = next instanceof Function ? next(read(base)) : next;
          const serialize = serializeRef.current;
          const serialized = serialize ? serialize(resolved) : resolved;
          return buildQuery(base, { [key]: serialized }, NO_IGNORED);
        },
        { history, scroll, shallow, preserveHash: true, skipUnchanged: true },
      );
    },
    [navigate, read, key, history, scroll, shallow],
  );

  return [value, setValue];
}
