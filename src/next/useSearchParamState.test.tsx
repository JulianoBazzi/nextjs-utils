import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSearchParamState } from './useSearchParamState';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => '/items',
  useSearchParams: () => mocks.searchParams,
}));

function setUrl(query = '') {
  mocks.searchParams = new URLSearchParams(query);
}

afterEach(async () => {
  mocks.push.mockClear();
  mocks.replace.mockClear();
  setUrl('');
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
  await Promise.resolve();
});

const pageOptions = {
  parse: (raw: string | null) => Number(raw) || 1,
  serialize: (value: number) => (value > 1 ? String(value) : undefined),
};

describe('useSearchParamState', () => {
  it('reads the raw param, undefined when absent', () => {
    setUrl('search=abc');
    const { result: present } = renderHook(() => useSearchParamState('search'));
    const { result: absent } = renderHook(() => useSearchParamState('missing'));

    expect(present.current[0]).toBe('abc');
    expect(absent.current[0]).toBeUndefined();
  });

  it('writes the value and removes the param for empty values', () => {
    setUrl('search=abc&page=2');
    const { result } = renderHook(() => useSearchParamState('search'));

    result.current[1]('xyz');
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?page=2&search=xyz', { scroll: false });
  });

  it('removes the param for undefined', () => {
    setUrl('search=abc');
    const { result } = renderHook(() => useSearchParamState('search'));

    result.current[1](undefined);
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('does not navigate for an equal value', () => {
    setUrl('search=abc');
    const { result } = renderHook(() => useSearchParamState('search'));

    result.current[1]('abc');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('parses and serializes typed values, with functional updates', () => {
    setUrl('page=2');
    const { result } = renderHook(() => useSearchParamState('page', pageOptions));
    expect(result.current[0]).toBe(2);

    result.current[1]((page) => page + 1);
    expect(mocks.replace).toHaveBeenLastCalledWith('/items?page=3', { scroll: false });
  });

  it('builds functional updates on a pending change from the same tick', () => {
    setUrl('page=2');
    const { result } = renderHook(() => useSearchParamState('page', pageOptions));

    result.current[1]((page) => page + 1);
    result.current[1]((page) => page + 1);

    expect(mocks.replace).toHaveBeenLastCalledWith('/items?page=4', { scroll: false });
  });

  it('keeps the parsed value identity across re-renders', () => {
    setUrl('filter=a');
    const { result, rerender } = renderHook(() =>
      useSearchParamState('filter', { parse: (raw) => ({ raw }) }),
    );
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });

  it('keeps the hash and forwards push and scroll', () => {
    window.history.replaceState(null, '', '/items#top');
    const { result } = renderHook(() =>
      useSearchParamState('search', { history: 'push', scroll: true }),
    );

    result.current[1]('a');
    expect(mocks.push).toHaveBeenCalledWith('/items?search=a#top', { scroll: true });
  });

  it('writes through the History API with shallow', () => {
    window.history.replaceState(null, '', '/items');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useSearchParamState('search', { shallow: true }));

    result.current[1]('a');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/items?search=a');
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
