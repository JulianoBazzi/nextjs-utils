import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePageVisibility } from './usePageVisibility';

function setVisibility(state: DocumentVisibilityState) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePageVisibility', () => {
  it('returns true while the page is visible', () => {
    setVisibility('visible');
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it('returns false when the page becomes hidden', () => {
    setVisibility('visible');
    const { result } = renderHook(() => usePageVisibility());

    setVisibility('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(false);
  });

  it('returns true when the page becomes visible again', () => {
    setVisibility('hidden');
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);

    setVisibility('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(true);
  });
});
