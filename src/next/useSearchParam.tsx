import { useSearchParams } from 'next/navigation';

/**
 * Read a single query string parameter from the current URL (Next.js App Router).
 * Thin, typed wrapper around `next/navigation`'s `useSearchParams`.
 *
 * @param key - the search param name
 * @returns the param value, or `null` when absent
 */
export function useSearchParam(key: string): string | null;
/**
 * @param key - the search param name
 * @param defaultValue - value returned when the param is absent
 * @returns the param value, or `defaultValue` when absent
 */
export function useSearchParam(key: string, defaultValue: string): string;
export function useSearchParam(key: string, defaultValue?: string): string | null {
  const params = useSearchParams();
  return params.get(key) ?? defaultValue ?? null;
}
