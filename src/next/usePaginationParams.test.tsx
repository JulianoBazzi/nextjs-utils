import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePaginationParams } from './usePaginationParams';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/items',
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.searchParams,
}));

function setUrl(query = '') {
  mocks.searchParams = new URLSearchParams(query);
}

afterEach(() => {
  mocks.push.mockClear();
  mocks.replace.mockClear();
  setUrl('');
});

describe('usePaginationParams', () => {
  it('returns defaults when the URL has no params', () => {
    const { result } = renderHook(() => usePaginationParams());
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
  });

  it('reads page and pageSize from the URL', () => {
    setUrl('page=3&pageSize=25');
    const { result } = renderHook(() => usePaginationParams());
    expect(result.current.page).toBe(3);
    expect(result.current.pageSize).toBe(25);
  });

  it('falls back to defaults for invalid values', () => {
    setUrl('page=abc&pageSize=-5');
    const { result } = renderHook(() => usePaginationParams({ defaultPageSize: 20 }));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
  });

  it('writes the page to the URL', () => {
    const { result } = renderHook(() => usePaginationParams());
    result.current.setPage(3);
    expect(mocks.replace).toHaveBeenCalledWith('/items?page=3', { scroll: false });
  });

  it('removes the page param when going back to page 1', () => {
    setUrl('page=3');
    const { result } = renderHook(() => usePaginationParams());
    result.current.setPage(1);
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('resets to the first page when the page size changes', () => {
    setUrl('page=3');
    const { result } = renderHook(() => usePaginationParams());
    result.current.setPageSize(25);
    expect(mocks.replace).toHaveBeenCalledWith('/items?pageSize=25', { scroll: false });
  });

  it('keeps the default page size out of the URL', () => {
    setUrl('pageSize=25');
    const { result } = renderHook(() => usePaginationParams());
    result.current.setPageSize(10);
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('clears both params on reset, preserving other params', () => {
    setUrl('page=3&pageSize=25&status=active');
    const { result } = renderHook(() => usePaginationParams());
    result.current.reset();
    expect(mocks.replace).toHaveBeenCalledWith('/items?status=active', { scroll: false });
  });

  it('supports custom keys and navigation options', () => {
    setUrl('p=2');
    const { result } = renderHook(() =>
      usePaginationParams({ pageKey: 'p', pageSizeKey: 'limit', history: 'push', scroll: true }),
    );
    expect(result.current.page).toBe(2);

    result.current.setPage(4);
    expect(mocks.push).toHaveBeenCalledWith('/items?p=4', { scroll: true });
  });
});
