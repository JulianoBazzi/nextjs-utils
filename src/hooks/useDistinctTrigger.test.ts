import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDistinctTrigger } from './useDistinctTrigger';

describe('useDistinctTrigger', () => {
  it('runs for new values and skips remembered ones', () => {
    const { result } = renderHook(() => useDistinctTrigger<string>());
    const trigger = result.current;

    expect(trigger.shouldRun('01001000')).toBe(true);
    trigger.remember();
    expect(trigger.shouldRun('01001000')).toBe(false);
    expect(trigger.shouldRun('20040002')).toBe(true);
  });

  it('remembers an explicit value', () => {
    const { result } = renderHook(() => useDistinctTrigger<string | undefined>());

    result.current.remember(undefined);

    expect(result.current.shouldRun(undefined)).toBe(false);
    expect(result.current.shouldRun('a')).toBe(true);
  });

  it('ignores remember() before any check', () => {
    const { result } = renderHook(() => useDistinctTrigger<string>());
    result.current.remember();
    expect(result.current.shouldRun('a')).toBe(true);
  });

  it('runs again after reset', () => {
    const { result } = renderHook(() => useDistinctTrigger<string>());
    result.current.shouldRun('a');
    result.current.remember();

    result.current.reset();

    expect(result.current.shouldRun('a')).toBe(true);
  });

  it('uses a custom equality', () => {
    const { result } = renderHook(() =>
      useDistinctTrigger<{ id: number }>({ isEqual: (a, b) => a.id === b.id }),
    );

    result.current.remember({ id: 1 });

    expect(result.current.shouldRun({ id: 1 })).toBe(false);
    expect(result.current.shouldRun({ id: 2 })).toBe(true);
  });

  it('returns a stable api', () => {
    const { result, rerender } = renderHook(() => useDistinctTrigger());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
