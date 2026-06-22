import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFilterQueryParams } from './useFilterQueryParams';

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

afterEach(() => {
  mocks.push.mockClear();
  mocks.replace.mockClear();
});

describe('useFilterQueryParams', () => {
  it('syncs parameters to the URL on mount', () => {
    renderHook(() =>
      useFilterQueryParams({
        parameters: () => ({ status: 'active' }),
        deps: [],
        search: 'abc',
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith('/items?status=active&search=abc', {
      scroll: false,
    });
  });

  it('seeds the search term from initialSearch', () => {
    const setSearch = vi.fn();
    renderHook(() =>
      useFilterQueryParams({
        parameters: () => ({}),
        deps: [],
        setSearch,
        initialSearch: 'seed',
      }),
    );
    expect(setSearch).toHaveBeenCalledWith('seed');
  });

  it('handleSearch forwards to setSearch (empty -> undefined)', () => {
    const setSearch = vi.fn();
    const { result } = renderHook(() =>
      useFilterQueryParams({ parameters: () => ({}), deps: [], setSearch }),
    );

    act(() => result.current.handleSearch('hello'));
    expect(setSearch).toHaveBeenCalledWith('hello');

    act(() => result.current.handleSearch(''));
    expect(setSearch).toHaveBeenCalledWith(undefined);
  });

  it('applies overrides on top of parameters()', () => {
    renderHook(() =>
      useFilterQueryParams({
        parameters: () => ({ status: 'active' }),
        deps: [],
        overrides: { status: 'archived' } as Partial<{ status: string }>,
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith('/items?status=archived', { scroll: false });
  });
});
