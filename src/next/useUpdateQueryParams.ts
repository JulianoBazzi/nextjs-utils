import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export type QueryParams = Record<string, QueryParamValue>;

export interface UpdateQueryParamsOptions<T extends object> {
  /** Keys never written to the URL (e.g. internal-only params). Default `[]`. */
  ignoredParams?: (keyof T | string)[];
  /** Navigation method. Default `'replace'` (no extra history entry). */
  history?: 'push' | 'replace';
  /** Scroll to top after navigation. Default `false`. */
  scroll?: boolean;
}

/**
 * Update multiple URL search params from an object (Next.js App Router).
 * Empty values (`''`, `null`, `undefined`, empty arrays) delete the param;
 * array values produce repeated entries. Call with no argument to clear all
 * params and return to the bare pathname.
 */
export function useUpdateQueryParams<T extends object = QueryParams>(
  options: UpdateQueryParamsOptions<T> = {},
) {
  const { ignoredParams = [], history = 'replace', scroll = false } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Stable primitive so an inline `ignoredParams` array doesn't recreate the callback.
  const ignoredKey = ignoredParams.map(String).join(',');

  return useCallback(
    (params?: Partial<T>) => {
      const navigate = (url: string) =>
        history === 'push' ? router.push(url, { scroll }) : router.replace(url, { scroll });

      if (!params) {
        navigate(pathname);
        return;
      }

      const current = new URLSearchParams(searchParams.toString());
      const ignored = new Set(ignoredKey ? ignoredKey.split(',') : []);

      for (const [key, value] of Object.entries(params)) {
        if (ignored.has(key)) {
          continue;
        }

        current.delete(key);

        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            if (item == null || item === '') {
              continue;
            }
            current.append(key, String(item));
          }
          continue;
        }

        current.set(key, String(value));
      }

      const query = current.toString();
      navigate(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams, ignoredKey, history, scroll],
  );
}
