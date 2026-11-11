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
  it('rejects lenient numeric strings and unsafe integers', () => {
    setUrl('page=3abc&pageSize=1e9');
    const { result } = renderHook(() => usePaginationParams());
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);

    setUrl('page=99999999999999999999&pageSize=3.5');
    const { result: huge } = renderHook(() => usePaginationParams());
    expect(huge.current.page).toBe(1);
    expect(huge.current.pageSize).toBe(10);
  });

  it('clamps the page size to maxPageSize', () => {
    setUrl('pageSize=100000000');
    const { result } = renderHook(() => usePaginationParams({ maxPageSize: 100 }));
    expect(result.current.pageSize).toBe(100);

    result.current.setPageSize(500);
    expect(mocks.replace).toHaveBeenCalledWith('/items?pageSize=100', { scroll: false });
  });

  it('drops the page size param when the clamped size equals the default', () => {
    const { result } = renderHook(() =>
      usePaginationParams({ defaultPageSize: 50, maxPageSize: 50 }),
    );
    result.current.setPageSize(500);
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('treats invalid setter input as a reset', () => {
    setUrl('page=3&pageSize=25');
    const { result } = renderHook(() => usePaginationParams());

    result.current.setPage(Number.NaN);
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?pageSize=25', { scroll: false });

    result.current.setPage(2.5);
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?pageSize=25', { scroll: false });

    result.current.setPageSize(0);
    expect(mocks.replace).toHaveBeenLastCalledWith('/items', { scroll: false });
  });
});

describe('usePaginationParams: lastPage', () => {
  afterEach(async () => {
    await Promise.resolve();
  });

  it('clamps a page above lastPage, on read and on write', () => {
    setUrl('page=9');
    const { result } = renderHook(() => usePaginationParams({ lastPage: 5 }));

    expect(result.current.page).toBe(5);
    expect(mocks.replace).not.toHaveBeenCalled();

    result.current.setPage(7);
    expect(mocks.replace).toHaveBeenCalledWith('/items?page=5', { scroll: false });
  });

  it('treats lastPage below 1 as a single page and floors fractions', () => {
    setUrl('page=3');
    const { result: empty } = renderHook(() => usePaginationParams({ lastPage: 0 }));
    const { result: fraction } = renderHook(() => usePaginationParams({ lastPage: 2.7 }));

    expect(empty.current.page).toBe(1);
    expect(fraction.current.page).toBe(2);

    empty.current.setPage(3);
    expect(mocks.replace).toHaveBeenLastCalledWith('/items', { scroll: false });
  });
});
