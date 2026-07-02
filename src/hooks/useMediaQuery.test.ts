import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

type ChangeListener = () => void;

// jsdom does not implement `window.matchMedia`; provide a controllable mock.
function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  const mql = {
    matches: initialMatches,
    addEventListener: (_type: 'change', listener: ChangeListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: 'change', listener: ChangeListener) => {
      listeners.delete(listener);
    },
  };
  const matchMedia = vi.fn(() => mql);
  vi.stubGlobal('matchMedia', matchMedia);

  return {
    matchMedia,
    listeners,
    setMatches(value: boolean) {
      mql.matches = value;
      for (const listener of [...listeners]) {
        listener();
      }
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQuery', () => {
  it('returns true when the query matches', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
    expect(result.current).toBe(false);
  });

  it('updates when the match state changes', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));

    act(() => media.setMatches(true));
    expect(result.current).toBe(true);

    act(() => media.setMatches(false));
    expect(result.current).toBe(false);
  });

  it('stops listening after unmount', () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 600px)'));

    expect(media.listeners.size).toBe(1);
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it('re-subscribes when the query changes', () => {
    const media = mockMatchMedia(false);
    const { rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(min-width: 600px)' },
    });

    rerender({ query: '(min-width: 900px)' });

    expect(media.matchMedia).toHaveBeenCalledWith('(min-width: 900px)');
  });

  it('returns false when matchMedia is unsupported', () => {
    expect(window.matchMedia).toBeUndefined();
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
    expect(result.current).toBe(false);
  });
});
