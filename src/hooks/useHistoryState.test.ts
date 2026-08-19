import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useHistoryState } from './useHistoryState';

describe('useHistoryState', () => {
  it('starts with the initial value and empty history', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    expect(result.current.state).toBe('a');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('sets values and undoes/redoes them', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    expect(result.current.state).toBe('c');
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.state).toBe('b');
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.state).toBe('a');
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.redo());
    expect(result.current.state).toBe('b');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useHistoryState(0));

    act(() => result.current.set((prev) => prev + 1));
    act(() => result.current.set((prev) => prev + 1));

    expect(result.current.state).toBe(2);
  });

  it('clears the redo stack on a new set', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.undo());
    act(() => result.current.set('c'));

    expect(result.current.state).toBe('c');
    expect(result.current.canRedo).toBe(false);
  });

  it('records nothing when setting the same value', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('a'));

    expect(result.current.canUndo).toBe(false);
  });

  it('is a no-op to undo/redo with empty stacks', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.undo());
    act(() => result.current.redo());

    expect(result.current.state).toBe('a');
  });

  it('bounds the undo stack by capacity', () => {
    const { result } = renderHook(() => useHistoryState(0, { capacity: 2 }));

    act(() => result.current.set(1));
    act(() => result.current.set(2));
    act(() => result.current.set(3));

    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(false);
  });

  it('clears the history but keeps the current state', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.clear());

    expect(result.current.state).toBe('b');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
  it('re-trims the undo stack when capacity is lowered at runtime', () => {
    const { result, rerender } = renderHook(
      ({ capacity }: { capacity: number }) => useHistoryState(0, { capacity }),
      { initialProps: { capacity: 10 } },
    );
    for (const n of [1, 2, 3, 4, 5]) {
      act(() => result.current.set(n));
    }

    rerender({ capacity: 2 });
    act(() => result.current.set(6));

    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.state).toBe(4);
    expect(result.current.canUndo).toBe(false);
  });

  it('keeps no history with capacity 0', () => {
    const { result } = renderHook(() => useHistoryState(0, { capacity: 0 }));
    act(() => result.current.set(1));
    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(false);
  });

  it('resets to the initial value or to an explicit value', () => {
    const { result } = renderHook(() => useHistoryState('a'));
    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    act(() => result.current.undo());

    act(() => result.current.reset());
    expect(result.current.state).toBe('a');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => result.current.set('d'));
    act(() => result.current.reset('z'));
    expect(result.current.state).toBe('z');
    expect(result.current.canUndo).toBe(false);
  });
});
