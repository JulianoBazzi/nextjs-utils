import { useCallback, useState } from 'react';

export type UseToggleReturn = [boolean, () => void, (value?: boolean) => void];

/**
 * Manage a boolean state with a toggle and an explicit setter.
 *
 * @param initialValue - initial boolean value (default `false`)
 * @returns `[value, toggle, setValue]`
 */
export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const set = useCallback((next?: boolean) => {
    setValue((prev) => (typeof next === 'boolean' ? next : !prev));
  }, []);

  return [value, toggle, set];
}
