import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('a', 500));
    expect(result.current).toBe('a');
  });

  it('updates only after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('cancels pending updates on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('c');
  });

  describe('function form', () => {
    it('delays invoking the callback until the delay elapses', () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 500));

      act(() => result.current());
      expect(fn).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(500));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('forwards arguments to the callback', () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 500));

      act(() => result.current('a', 1));
      act(() => vi.advanceTimersByTime(500));
      expect(fn).toHaveBeenCalledWith('a', 1);
    });

    it('only runs the last call on rapid fire', () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 500));

      act(() => result.current(1));
      act(() => vi.advanceTimersByTime(300));
      act(() => result.current(2));
      act(() => vi.advanceTimersByTime(300));
      expect(fn).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(200));
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(2);
    });

    it('keeps a stable identity across rerenders', () => {
      const { result, rerender } = renderHook(() => useDebounce(() => {}, 500));
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it('uses the latest callback without resetting the timer', () => {
      const a = vi.fn();
      const b = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useDebounce(fn, 500), {
        initialProps: { fn: a },
      });

      act(() => result.current());
      rerender({ fn: b });
      act(() => vi.advanceTimersByTime(500));

      expect(a).not.toHaveBeenCalled();
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('does not invoke the callback after unmount', () => {
      const fn = vi.fn();
      const { result, unmount } = renderHook(() => useDebounce(fn, 500));

      act(() => result.current());
      unmount();
      act(() => vi.advanceTimersByTime(500));

      expect(fn).not.toHaveBeenCalled();
    });
  });
});
