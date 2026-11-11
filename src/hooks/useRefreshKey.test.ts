import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRefreshKey } from './useRefreshKey';

describe('useRefreshKey', () => {
  it('starts at 0 and changes on every refresh', () => {
    const { result } = renderHook(() => useRefreshKey());
    expect(result.current[0]).toBe(0);

    act(() => result.current[1]());
    act(() => result.current[1]());

    expect(result.current[0]).toBe(2);
  });

  it('keeps refresh stable', () => {
    const { result } = renderHook(() => useRefreshKey());
    const refresh = result.current[1];
    act(() => refresh());
    expect(result.current[1]).toBe(refresh);
  });
});
