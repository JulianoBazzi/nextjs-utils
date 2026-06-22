import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type QueryParams, useUpdateQueryParams } from './useUpdateQueryParams';

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

describe('useUpdateQueryParams', () => {
  it('sets a string param (replace, no scroll, by default)', () => {
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ status: 'active' });
    expect(mocks.replace).toHaveBeenCalledWith('/items?status=active', { scroll: false });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('deletes a param for empty/null values', () => {
    setUrl('status=active');
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ status: '' });
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('appends repeated entries for arrays', () => {
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ tag: ['a', 'b'] });
    expect(mocks.replace).toHaveBeenCalledWith('/items?tag=a&tag=b', { scroll: false });
  });

  it('skips ignored params', () => {
    const { result } = renderHook(() =>
      useUpdateQueryParams<QueryParams>({ ignoredParams: ['withCount'] }),
    );
    result.current({ withCount: 'true', page: 2 });
    expect(mocks.replace).toHaveBeenCalledWith('/items?page=2', { scroll: false });
  });

  it('clears all params when called without arguments', () => {
    setUrl('status=active&page=2');
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current();
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('uses push and forwards scroll when configured', () => {
    const { result } = renderHook(() => useUpdateQueryParams({ history: 'push', scroll: true }));
    result.current({ q: 'x' });
    expect(mocks.push).toHaveBeenCalledWith('/items?q=x', { scroll: true });
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
