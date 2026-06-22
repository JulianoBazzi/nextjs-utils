import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSearchParam } from './useSearchParam';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('?tab=profile'),
}));

describe('useSearchParam', () => {
  it('returns the value of an existing param', () => {
    const { result } = renderHook(() => useSearchParam('tab'));
    expect(result.current).toBe('profile');
  });

  it('returns the default value when the param is absent', () => {
    const { result } = renderHook(() => useSearchParam('missing', 'fallback'));
    expect(result.current).toBe('fallback');
  });

  it('returns null when the param is absent and no default is given', () => {
    const { result } = renderHook(() => useSearchParam('missing'));
    expect(result.current).toBeNull();
  });
});
