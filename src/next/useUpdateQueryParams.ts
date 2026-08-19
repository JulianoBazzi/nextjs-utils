import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

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
  /**
   * Skip the navigation when the resulting params equal the current ones
   * (order-insensitive). Avoids a redundant RSC round-trip. Default `false`.
   */
  skipUnchanged?: boolean;
  /** Keep the current `#hash` fragment in the new URL. Default `false`. */
  preserveHash?: boolean;
}

/** `''`, `null`, `undefined` and non-finite numbers (`NaN`, `Infinity`) delete the param. */
function isEmpty(value: unknown): boolean {
  return value == null || value === '' || (typeof value === 'number' && !Number.isFinite(value));
}

function sameParams(a: URLSearchParams, b: URLSearchParams): boolean {
  const left = new URLSearchParams(a);
  const right = new URLSearchParams(b);
  left.sort();
  right.sort();
  return left.toString() === right.toString();
}

/**
 * Update multiple URL search params from an object (Next.js App Router).
 * Empty values (`''`, `null`, `undefined`, `NaN`, empty arrays) delete the
 * param; array values produce repeated entries. Call with no argument to clear
 * all params and return to the bare pathname.
 */
export function useUpdateQueryParams<T extends object = QueryParams>(
  options: UpdateQueryParamsOptions<T> = {},
) {
  const {
    ignoredParams = [],
    history = 'replace',
    scroll = false,
    skipUnchanged = false,
    preserveHash = false,
  } = options;
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  // Stable primitive so an inline `ignoredParams` array doesn't recreate the callback.
  const ignoredKey = JSON.stringify(ignoredParams.map(String));
  const ignored = useMemo(() => new Set<string>(JSON.parse(ignoredKey)), [ignoredKey]);

  return useCallback(
    (params?: Partial<T>) => {
      const navigate = (url: string) => {
        const hash = preserveHash && typeof window !== 'undefined' ? window.location.hash : '';
        const target = `${url}${hash}`;
        if (history === 'push') {
          router.push(target, { scroll });
        } else {
          router.replace(target, { scroll });
        }
      };

      if (!params) {
        navigate(pathname);
        return;
      }

      const current = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (ignored.has(key)) {
          continue;
        }

        current.delete(key);

        if (isEmpty(value) || (Array.isArray(value) && value.length === 0)) {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            if (isEmpty(item)) {
              continue;
            }
            current.append(key, String(item));
          }
          continue;
        }

        current.set(key, String(value));
      }

      if (skipUnchanged && sameParams(current, new URLSearchParams(searchParams.toString()))) {
        return;
      }

      const query = current.toString();
      navigate(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams, ignored, history, scroll, skipUnchanged, preserveHash],
  );
}
