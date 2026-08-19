import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThrottle } from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('a', 500));
    expect(result.current).toBe('a');
  });

  it('applies the first change immediately (leading)', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottle(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('b');
  });

  it('collapses rapid changes into one trailing update with the latest value', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottle(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('b');

    act(() => vi.advanceTimersByTime(100));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: 'd' });
    expect(result.current).toBe('b');

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('d');
  });

  it('applies a change immediately after the interval has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottle(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(500));
    rerender({ value: 'c' });
    expect(result.current).toBe('c');
  });

  describe('function form', () => {
    it('invokes immediately on the first call (leading)', () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottle(fn, 500));

      act(() => result.current(1));
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(1);
    });

    it('collapses calls within the interval into one trailing call with the latest args', () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottle(fn, 500));

      act(() => result.current(1));
      act(() => result.current(2));
      act(() => result.current(3));
      expect(fn).toHaveBeenCalledTimes(1);

      act(() => vi.advanceTimersByTime(500));
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith(3);
    });

    it('keeps a stable identity across rerenders', () => {
      const { result, rerender } = renderHook(() => useThrottle(() => {}, 500));
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it('uses the latest callback', () => {
      const a = vi.fn();
      const b = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useThrottle(fn, 500), {
        initialProps: { fn: a },
      });

      act(() => result.current());
      expect(a).toHaveBeenCalledTimes(1);

      act(() => result.current());
      rerender({ fn: b });
      act(() => vi.advanceTimersByTime(500));

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('does not invoke a pending trailing call after unmount', () => {
      const fn = vi.fn();
      const { result, unmount } = renderHook(() => useThrottle(fn, 500));

      act(() => result.current(1));
      act(() => result.current(2));
      unmount();
      act(() => vi.advanceTimersByTime(500));

      expect(fn).toHaveBeenCalledTimes(1);
    });
    it('cancel drops the pending trailing call', () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottle(fn, 500));

      act(() => result.current('a'));
      act(() => result.current('b'));
      act(() => result.current.cancel());
      act(() => vi.advanceTimersByTime(500));

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
    });

    it('flush runs the pending trailing call immediately, once', () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottle(fn, 500));

      act(() => result.current.flush());
      expect(fn).not.toHaveBeenCalled();

      act(() => result.current('a'));
      act(() => result.current('b'));
      act(() => result.current.flush());
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('b');

      act(() => vi.advanceTimersByTime(500));
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
