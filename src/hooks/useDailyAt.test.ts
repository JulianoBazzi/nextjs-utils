import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDailyAt } from './useDailyAt';

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 11, 4, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(document, 'visibilityState');
});

describe('useDailyAt', () => {
  it('runs at the given time today and again the next day', () => {
    const callback = vi.fn();
    renderHook(() => useDailyAt(5, 0, callback));

    act(() => vi.advanceTimersByTime(60 * 60 * 1000 - 1));
    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1000));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('schedules for tomorrow when the time has already passed today', () => {
    const callback = vi.fn();
    renderHook(() => useDailyAt(3, 30, callback));

    act(() => vi.advanceTimersByTime(23 * 60 * 60 * 1000 + 29 * 60 * 1000));
    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(60 * 1000));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('fires a run missed while asleep once the page is visible again', () => {
    const callback = vi.fn();
    renderHook(() => useDailyAt(5, 0, callback));

    // The clock jumps past 05:00 without the timer firing (device asleep).
    vi.setSystemTime(new Date(2026, 10, 11, 7, 0, 0));
    act(() => setVisibility('visible'));
    expect(callback).toHaveBeenCalledTimes(1);

    // Becoming visible again before the next run does nothing.
    act(() => setVisibility('visible'));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('ignores the page being hidden', () => {
    const callback = vi.fn();
    renderHook(() => useDailyAt(5, 0, callback));

    vi.setSystemTime(new Date(2026, 10, 11, 7, 0, 0));
    act(() => setVisibility('hidden'));

    expect(callback).not.toHaveBeenCalled();
  });

  it('stops on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useDailyAt(5, 0, callback));

    unmount();
    act(() => vi.advanceTimersByTime(2 * 60 * 60 * 1000));
    act(() => setVisibility('visible'));

    expect(callback).not.toHaveBeenCalled();
  });
});
