import { useCallback, useState } from 'react';

export interface UseHistoryStateOptions {
  /** Maximum number of past states kept for undo. Default `100`. */
  capacity?: number;
}

export interface UseHistoryStateReturn<T> {
  state: T;
  /** Set a new state (value or updater), clearing the redo stack. */
  set: (value: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Drop the undo/redo history, keeping the current state. */
  clear: () => void;
}

interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * State with undo/redo history. `set` pushes the previous state onto the undo
 * stack (bounded by `capacity`) and clears the redo stack; setting the same
 * value (by `Object.is`) records nothing.
 *
 * @param initialValue - the initial state
 * @param options - history behavior
 * @returns `{ state, set, undo, redo, canUndo, canRedo, clear }`
 */
export function useHistoryState<T>(
  initialValue: T,
  options: UseHistoryStateOptions = {},
): UseHistoryStateReturn<T> {
  const { capacity = 100 } = options;
  const [history, setHistory] = useState<History<T>>({
    past: [],
    present: initialValue,
    future: [],
  });

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setHistory((h) => {
        const resolved = value instanceof Function ? value(h.present) : value;
        if (Object.is(resolved, h.present)) {
          return h;
        }
        const past = [...h.past, h.present];
        if (past.length > capacity) {
          past.shift();
        }
        return { past, present: resolved, future: [] };
      });
    },
    [capacity],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) {
        return h;
      }
      const present = h.past[h.past.length - 1] as T;
      return {
        past: h.past.slice(0, -1),
        present,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) {
        return h;
      }
      const present = h.future[0] as T;
      return {
        past: [...h.past, h.present],
        present,
        future: h.future.slice(1),
      };
    });
  }, []);

  const clear = useCallback(() => {
    setHistory((h) => ({ past: [], present: h.present, future: [] }));
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
  };
}
