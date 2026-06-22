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
});
