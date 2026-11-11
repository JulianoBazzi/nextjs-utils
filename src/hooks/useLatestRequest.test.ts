import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLatestRequest } from './useLatestRequest';

describe('useLatestRequest', () => {
  it('keeps only the latest request current and aborts the previous one', () => {
    const { result } = renderHook(() => useLatestRequest());

    const first = result.current.start();
    expect(first.isCurrent()).toBe(true);

    const second = result.current.start();
    expect(first.isCurrent()).toBe(false);
    expect(first.signal.aborted).toBe(true);
    expect(second.isCurrent()).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it('cancels the current request', () => {
    const { result } = renderHook(() => useLatestRequest());
    const request = result.current.start();

    result.current.cancel();

    expect(request.isCurrent()).toBe(false);
    expect(request.signal.aborted).toBe(true);
  });

  it('cancel is a no-op without a request', () => {
    const { result } = renderHook(() => useLatestRequest());
    expect(() => result.current.cancel()).not.toThrow();
  });

  it('aborts the pending request on unmount', () => {
    const { result, unmount } = renderHook(() => useLatestRequest());
    const request = result.current.start();

    unmount();

    expect(request.signal.aborted).toBe(true);
    expect(request.isCurrent()).toBe(false);
  });

  it('returns a stable api', () => {
    const { result, rerender } = renderHook(() => useLatestRequest());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
