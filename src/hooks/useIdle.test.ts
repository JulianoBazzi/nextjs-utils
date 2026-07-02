import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdle } from './useIdle';

describe('useIdle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts as not idle', () => {
    const { result } = renderHook(() => useIdle(1000));
    expect(result.current).toBe(false);
  });

  it('becomes idle after the timeout with no activity', () => {
    const { result } = renderHook(() => useIdle(1000));

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toBe(true);
  });

  it('resets on user activity', () => {
    const { result } = renderHook(() => useIdle(1000));

    act(() => vi.advanceTimersByTime(900));
    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    act(() => vi.advanceTimersByTime(900));

    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe(true);
  });

  it('leaves the idle state as soon as activity resumes', () => {
    const { result } = renderHook(() => useIdle(1000));

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    expect(result.current).toBe(false);
  });

  it('coalesces activity bursts within the throttle window', () => {
    const { result } = renderHook(() => useIdle(1000));

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });
    act(() => vi.advanceTimersByTime(100));
    act(() => {
      // Within 200ms of the previous reset: throttled, timer is not re-armed.
      window.dispatchEvent(new Event('mousemove'));
    });
    act(() => vi.advanceTimersByTime(900));

    expect(result.current).toBe(true);
  });

  it('stops tracking after unmount', () => {
    const { result, unmount } = renderHook(() => useIdle(1000));

    unmount();
    act(() => vi.advanceTimersByTime(2000));

    expect(result.current).toBe(false);
  });
});
