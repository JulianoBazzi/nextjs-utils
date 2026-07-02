import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useActiveRoute } from './useActiveRoute';

const mocks = vi.hoisted(() => ({
  pathname: '/' as string | null,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

function setPathname(pathname: string) {
  mocks.pathname = pathname;
}

describe('useActiveRoute', () => {
  it('matches the exact pathname', () => {
    setPathname('/settings');
    const { result } = renderHook(() => useActiveRoute('/settings'));
    expect(result.current).toBe(true);
  });

  it('matches child segments by default', () => {
    setPathname('/settings/profile');
    const { result } = renderHook(() => useActiveRoute('/settings'));
    expect(result.current).toBe(true);
  });

  it('does not match a partial segment', () => {
    setPathname('/settings-old');
    const { result } = renderHook(() => useActiveRoute('/settings'));
    expect(result.current).toBe(false);
  });

  it('does not match child segments with exact matching', () => {
    setPathname('/settings/profile');
    const { result } = renderHook(() => useActiveRoute('/settings', { exact: true }));
    expect(result.current).toBe(false);
  });

  it('only matches the root href exactly', () => {
    setPathname('/settings');
    const { result } = renderHook(() => useActiveRoute('/'));
    expect(result.current).toBe(false);

    setPathname('/');
    const { result: root } = renderHook(() => useActiveRoute('/'));
    expect(root.current).toBe(true);
  });

  it('treats a null pathname as inactive', () => {
    mocks.pathname = null;
    const { result } = renderHook(() => useActiveRoute('/'));
    expect(result.current).toBe(false);
  });

  it('ignores trailing slashes, query strings, and hashes in href', () => {
    setPathname('/settings');
    const { result } = renderHook(() => useActiveRoute('/settings/?tab=1#top'));
    expect(result.current).toBe(true);
  });
});
