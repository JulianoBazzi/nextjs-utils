import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSortParams } from './useSortParams';

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

describe('useSortParams', () => {
  it('is unsorted by default', () => {
    const { result } = renderHook(() => useSortParams());
    expect(result.current.sortBy).toBeUndefined();
    expect(result.current.order).toBe('asc');
  });

  it('reads sort state from the URL', () => {
    setUrl('sortBy=name&order=desc');
    const { result } = renderHook(() => useSortParams());
    expect(result.current.sortBy).toBe('name');
    expect(result.current.order).toBe('desc');
  });

  it('sorts a new column with the default order', () => {
    const { result } = renderHook(() => useSortParams());
    result.current.toggleSort('name');
    expect(mocks.replace).toHaveBeenCalledWith('/items?sortBy=name&order=asc', { scroll: false });
  });

  it('flips the order when toggling the same column', () => {
    setUrl('sortBy=name&order=asc');
    const { result } = renderHook(() => useSortParams());
    result.current.toggleSort('name');
    expect(mocks.replace).toHaveBeenCalledWith('/items?sortBy=name&order=desc', { scroll: false });
  });

  it('clears the sort when toggling a flipped column', () => {
    setUrl('sortBy=name&order=desc');
    const { result } = renderHook(() => useSortParams());
    result.current.toggleSort('name');
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('switches columns starting over at the default order', () => {
    setUrl('sortBy=name&order=desc');
    const { result } = renderHook(() => useSortParams());
    result.current.toggleSort('createdAt');
    expect(mocks.replace).toHaveBeenCalledWith('/items?sortBy=createdAt&order=asc', {
      scroll: false,
    });
  });

  it('respects defaultSort and defaultOrder', () => {
    const { result } = renderHook(() =>
      useSortParams({ defaultSort: 'createdAt', defaultOrder: 'desc' }),
    );
    expect(result.current.sortBy).toBe('createdAt');
    expect(result.current.order).toBe('desc');

    result.current.toggleSort('createdAt');
    expect(mocks.replace).toHaveBeenCalledWith('/items?sortBy=createdAt&order=asc', {
      scroll: false,
    });
  });

  it('clears the sort params with clearSort, preserving other params', () => {
    setUrl('sortBy=name&order=desc&page=2');
    const { result } = renderHook(() => useSortParams());
    result.current.clearSort();
    expect(mocks.replace).toHaveBeenCalledWith('/items?page=2', { scroll: false });
  });

  it('supports custom keys', () => {
    setUrl('sort=name&dir=desc');
    const { result } = renderHook(() => useSortParams({ sortKey: 'sort', orderKey: 'dir' }));
    expect(result.current.sortBy).toBe('name');
    expect(result.current.order).toBe('desc');
  });
});
