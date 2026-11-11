import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUpdateSearchParam } from './useUpdateSearchParam';

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

describe('useUpdateSearchParam', () => {
  it('sets the default "search" param', () => {
    const { result } = renderHook(() => useUpdateSearchParam());
    result.current('hello');
    expect(mocks.replace).toHaveBeenCalledWith('/items?search=hello', { scroll: false });
  });

  it('uses a custom key', () => {
    const { result } = renderHook(() => useUpdateSearchParam({ key: 'q' }));
    result.current('hello');
    expect(mocks.replace).toHaveBeenCalledWith('/items?q=hello', { scroll: false });
  });

  it('clears the param when given an empty value', () => {
    setUrl('search=hello');
    const { result } = renderHook(() => useUpdateSearchParam());
    result.current('');
    expect(mocks.replace).toHaveBeenCalledWith('/items', { scroll: false });
  });

  it('is a no-op when the value matches the current URL', () => {
    setUrl('search=hello');
    const { result } = renderHook(() => useUpdateSearchParam());
    result.current('hello');
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('collapses duplicated params even when the value is unchanged', () => {
    setUrl('search=a&search=a');
    const { result } = renderHook(() => useUpdateSearchParam());
    result.current('a');
    expect(mocks.replace).toHaveBeenCalledWith('/items?search=a', { scroll: false });
  });
});

describe('useUpdateSearchParam: trim', () => {
  afterEach(async () => {
    await Promise.resolve();
  });

  it('does not navigate when only surrounding whitespace changes', () => {
    setUrl('search=ana');
    const { result } = renderHook(() => useUpdateSearchParam({ trim: true }));

    result.current('ana ');

    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('removes the param for whitespace-only and missing values', () => {
    setUrl('search=ana');
    const { result } = renderHook(() => useUpdateSearchParam({ trim: true }));

    result.current('   ');
    expect(mocks.replace).toHaveBeenLastCalledWith('/items', { scroll: false });

    result.current();
    expect(mocks.replace).toHaveBeenCalledTimes(1);
  });

  it('keeps whitespace by default', () => {
    setUrl('search=ana');
    const { result } = renderHook(() => useUpdateSearchParam());

    result.current('ana ');

    expect(mocks.replace).toHaveBeenCalledWith('/items?search=ana+', { scroll: false });
  });
});
