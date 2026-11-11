import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
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

afterEach(async () => {
  mocks.push.mockClear();
  mocks.replace.mockClear();
  mocks.searchParams = new URLSearchParams();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
  await Promise.resolve();
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

describe('useFilterQueryParams: mount, search ownership and resets', () => {
  it('navigates once on mount, after initialSearch reaches the search state', () => {
    const { result } = renderHook(() => {
      const [search, setSearch] = useState<string | undefined>();
      useFilterQueryParams({
        parameters: () => ({ status: 'active' }),
        deps: [],
        search,
        setSearch,
        initialSearch: 'abc',
      });
      return search;
    });

    expect(result.current).toBe('abc');
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith('/items?status=active&search=abc', {
      scroll: false,
    });
  });

  it('syncs right away when the search state already holds the seed', () => {
    renderHook(() => {
      const [search, setSearch] = useState<string | undefined>('abc');
      useFilterQueryParams({
        parameters: () => ({}),
        deps: [],
        search,
        setSearch,
        initialSearch: 'abc',
      });
    });

    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith('/items?search=abc', { scroll: false });
  });

  it('treats initialSearch: null as no initial term', () => {
    const setSearch = vi.fn();
    renderHook(() =>
      useFilterQueryParams({ parameters: () => ({}), deps: [], setSearch, initialSearch: null }),
    );
    expect(setSearch).not.toHaveBeenCalled();
  });

  it("leaves another component's search param alone when it manages no search", () => {
    mocks.searchParams = new URLSearchParams('search=other');
    renderHook(() => useFilterQueryParams({ parameters: () => ({ status: 'a' }), deps: [] }));
    expect(mocks.replace).toHaveBeenCalledWith('/items?search=other&status=a', { scroll: false });
  });

  it('deletes the search param when a managed search is undefined', () => {
    mocks.searchParams = new URLSearchParams('search=old');
    renderHook(() => useFilterQueryParams({ parameters: () => ({}), deps: [], search: undefined }));
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('manages the search param when only initialSearch is given', () => {
    mocks.searchParams = new URLSearchParams('search=old');
    renderHook(() =>
      useFilterQueryParams({ parameters: () => ({}), deps: [], initialSearch: 'x' }),
    );
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('skips the navigation when the URL already matches', () => {
    mocks.searchParams = new URLSearchParams('status=active');
    renderHook(() => useFilterQueryParams({ parameters: () => ({ status: 'active' }), deps: [] }));
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('applies resetKeys only when deps change after the first sync', async () => {
    mocks.searchParams = new URLSearchParams('page=3');
    let status = 'a';
    const { rerender } = renderHook(() =>
      useFilterQueryParams({ parameters: () => ({ status }), deps: [status], resetKeys: ['page'] }),
    );
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?page=3&status=a', { scroll: false });
    await Promise.resolve();

    rerender();
    expect(mocks.replace).toHaveBeenCalledTimes(1);

    status = 'b';
    rerender();
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?status=b', { scroll: false });
  });

  it('keeps a deep-linked page when the initial search lands', () => {
    mocks.searchParams = new URLSearchParams('page=3');
    renderHook(() => {
      const [search, setSearch] = useState<string | undefined>();
      useFilterQueryParams({
        parameters: () => ({}),
        deps: [],
        search,
        setSearch,
        initialSearch: 'abc',
        resetKeys: ['page'],
      });
    });
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith('/items?page=3&search=abc', { scroll: false });
  });

  it('forwards history and scroll', () => {
    renderHook(() =>
      useFilterQueryParams({
        parameters: () => ({ a: '1' }),
        deps: [],
        history: 'push',
        scroll: true,
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith('/items?a=1', { scroll: true });
  });

  it('writes through the History API with shallow, keeping the hash with preserveHash', () => {
    window.history.replaceState(null, '', '/items#top');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    renderHook(() =>
      useFilterQueryParams({
        parameters: () => ({ a: '1' }),
        deps: [],
        shallow: true,
        preserveHash: true,
      }),
    );
    expect(replaceState).toHaveBeenCalledWith(null, '', '/items?a=1#top');
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
