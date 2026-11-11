import { useCallback, useState } from 'react';

/**
 * A counter to use as a React `key`: calling `refresh()` remounts whatever
 * the key is on (e.g. to reload a select's options or reset a form section).
 * Unlike a random key, every refresh is guaranteed to differ.
 *
 * @returns `[key, refresh]`
 * @example
 * const [key, refresh] = useRefreshKey();
 * return <CitySelect key={key} />;
 */
export function useRefreshKey(): [key: number, refresh: () => void] {
  const [key, setKey] = useState(0);
  const refresh = useCallback(() => setKey((current) => current + 1), []);
  return [key, refresh];
}
