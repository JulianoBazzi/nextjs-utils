import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type QueryParams, useUpdateQueryParams } from './useUpdateQueryParams';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/items' as string | null,
  searchParams: new URLSearchParams() as URLSearchParams | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.searchParams,
}));

function setUrl(query = '') {
  mocks.searchParams = new URLSearchParams(query);
}

afterEach(async () => {
  mocks.push.mockClear();
  mocks.replace.mockClear();
  mocks.pathname = '/items';
  setUrl('');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
  // Let the same-tick pending query expire between tests.
  await Promise.resolve();
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

  it('deletes a param for empty arrays', () => {
    setUrl('tag=a');
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ tag: [] });
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('skips empty array items', () => {
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ tag: ['a', '', 'b'] });
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
  it('treats non-finite numbers as empty', () => {
    setUrl('page=2');
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ page: Number.NaN, tag: [1, Number.POSITIVE_INFINITY] });
    expect(mocks.replace).toHaveBeenCalledWith('/items?tag=1', { scroll: false });
  });

  it('keeps ignored keys containing commas intact', () => {
    const { result } = renderHook(() =>
      useUpdateQueryParams<QueryParams>({ ignoredParams: ['a,b'] }),
    );
    result.current({ 'a,b': 'x', a: '1', b: '2' });
    expect(mocks.replace).toHaveBeenCalledWith('/items?a=1&b=2', { scroll: false });
  });

  it('falls back to a relative URL when the pathname is null', () => {
    mocks.pathname = null;
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ status: 'active' });
    expect(mocks.replace).toHaveBeenCalledWith('?status=active', { scroll: false });
  });

  it('skips the navigation for unchanged params with skipUnchanged', () => {
    setUrl('b=2&a=1');
    const { result } = renderHook(() => useUpdateQueryParams({ skipUnchanged: true }));

    result.current({ a: '1' });
    expect(mocks.replace).not.toHaveBeenCalled();

    result.current({ a: '3' });
    expect(mocks.replace).toHaveBeenCalledWith('/items?b=2&a=3', { scroll: false });
  });

  it('preserves the hash with preserveHash', () => {
    window.location.hash = '#details';
    const { result } = renderHook(() => useUpdateQueryParams({ preserveHash: true }));
    result.current({ status: 'active' });
    expect(mocks.replace).toHaveBeenCalledWith('/items?status=active#details', { scroll: false });
    window.history.replaceState(null, '', window.location.pathname);
  });

  it('ignores preserveHash when window is unavailable', () => {
    const { result } = renderHook(() => useUpdateQueryParams({ preserveHash: true }));
    vi.stubGlobal('window', undefined);
    result.current({ status: 'active' });
    expect(mocks.replace).toHaveBeenCalledWith('/items?status=active', { scroll: false });
  });

  it('serializes dates as ISO strings', () => {
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ from: new Date('2026-01-02T00:00:00Z'), to: new Date('invalid') });
    expect(mocks.replace).toHaveBeenCalledWith('/items?from=2026-01-02T00%3A00%3A00.000Z', {
      scroll: false,
    });
  });

  it('treats a null searchParams as an empty query', () => {
    mocks.searchParams = null;
    const { result } = renderHook(() => useUpdateQueryParams());
    result.current({ a: '1' });
    expect(mocks.replace).toHaveBeenCalledWith('/items?a=1', { scroll: false });
  });

  describe('consecutive calls in the same tick', () => {
    it('build on each other instead of on the same snapshot', () => {
      setUrl('page=3');
      const { result } = renderHook(() => useUpdateQueryParams());

      result.current({ sortBy: 'name', order: 'asc' });
      result.current({ page: undefined });

      expect(mocks.replace).toHaveBeenLastCalledWith('/items?sortBy=name&order=asc', {
        scroll: false,
      });
    });

    it('are shared across hook instances', () => {
      setUrl('page=3');
      const { result: sort } = renderHook(() => useUpdateQueryParams());
      const { result: page } = renderHook(() => useUpdateQueryParams());

      sort.current({ sortBy: 'name' });
      page.current({ page: 1 });

      expect(mocks.replace).toHaveBeenLastCalledWith('/items?sortBy=name&page=1', {
        scroll: false,
      });
    });

    it('stop composing once the tick ends', async () => {
      setUrl('page=3');
      const { result } = renderHook(() => useUpdateQueryParams());

      result.current({ sortBy: 'name' });
      await Promise.resolve();
      result.current({ order: 'asc' });

      expect(mocks.replace).toHaveBeenLastCalledWith('/items?page=3&order=asc', {
        scroll: false,
      });
    });

    it('compare skipUnchanged against the composed query', () => {
      const { result } = renderHook(() => useUpdateQueryParams({ skipUnchanged: true }));

      result.current({ a: '1' });
      result.current({ a: undefined });
      result.current({ a: undefined });

      expect(mocks.replace).toHaveBeenCalledTimes(2);
      expect(mocks.replace).toHaveBeenLastCalledWith('/items', { scroll: false });
    });
  });

  describe('shallow (App Router)', () => {
    it('replaces the URL through the History API, keeping basePath', () => {
      window.history.replaceState(null, '', '/base/items');
      const replaceState = vi.spyOn(window.history, 'replaceState');
      const { result } = renderHook(() => useUpdateQueryParams({ shallow: true }));

      result.current({ x: '1' });

      expect(replaceState).toHaveBeenCalledWith(null, '', '/base/items?x=1');
      expect(mocks.replace).not.toHaveBeenCalled();
    });

    it('clears the query through the History API', () => {
      window.history.replaceState(null, '', '/base/items?x=1');
      setUrl('x=1');
      const replaceState = vi.spyOn(window.history, 'replaceState');
      const { result } = renderHook(() => useUpdateQueryParams({ shallow: true }));

      result.current();

      expect(replaceState).toHaveBeenCalledWith(null, '', '/base/items');
    });

    it('pushes, keeps the hash and scrolls to top when configured', () => {
      window.history.replaceState(null, '', '/items#details');
      const pushState = vi.spyOn(window.history, 'pushState');
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const { result } = renderHook(() =>
        useUpdateQueryParams({ shallow: true, history: 'push', scroll: true, preserveHash: true }),
      );

      result.current({ x: '1' });

      expect(pushState).toHaveBeenCalledWith(null, '', '/items?x=1#details');
      expect(scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('does not scroll by default', () => {
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const { result } = renderHook(() => useUpdateQueryParams({ shallow: true }));

      result.current({ x: '1' });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('falls back to the router when window is unavailable', () => {
      const { result } = renderHook(() => useUpdateQueryParams({ shallow: true }));
      vi.stubGlobal('window', undefined);

      result.current({ x: '1' });

      expect(mocks.replace).toHaveBeenCalledWith('/items?x=1', { scroll: false });
    });
  });
});
