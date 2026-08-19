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
  it('does not touch the search state on mount without initialSearch', () => {
    const setSearch = vi.fn();
    renderHook(() => useFilterQueryParams({ parameters: () => ({}), deps: [], setSearch }));
    expect(setSearch).not.toHaveBeenCalled();
  });

  it('re-seeds when initialSearch changes, including back to undefined', () => {
    const setSearch = vi.fn();
    const { rerender } = renderHook(
      ({ initialSearch }: { initialSearch?: string }) =>
        useFilterQueryParams({ parameters: () => ({}), deps: [], setSearch, initialSearch }),
      { initialProps: { initialSearch: 'seed' } as { initialSearch?: string } },
    );
    expect(setSearch).toHaveBeenLastCalledWith('seed');

    rerender({ initialSearch: undefined });
    expect(setSearch).toHaveBeenLastCalledWith(undefined);
  });

  it('writes the search term under a custom searchKey', () => {
    renderHook(() =>
      useFilterQueryParams({ parameters: () => ({}), deps: [], search: 'abc', searchKey: 'q' }),
    );
    expect(mocks.replace).toHaveBeenCalledWith('/items?q=abc', { scroll: false });
  });

  it('re-syncs when deps or search change and keeps a stable return object', () => {
    let status = 'active';
    const { result, rerender } = renderHook(
      ({ search }: { search?: string }) =>
        useFilterQueryParams({ parameters: () => ({ status }), deps: [status], search }),
      { initialProps: { search: undefined } as { search?: string } },
    );
    const first = result.current;
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?status=active', { scroll: false });

    status = 'archived';
    rerender({ search: 'x' });
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?status=archived&search=x', {
      scroll: false,
    });
    expect(result.current).toBe(first);
  });
});
