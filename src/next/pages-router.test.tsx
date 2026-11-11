import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUpdateQueryParams } from './useUpdateQueryParams';

// Pages Router: `next/compat/router` returns the router instance. The
// `next/navigation` hooks still exist (Next adapts them) but must not be used
// for writing, because the adapter's `replace` drops `shallow`.
const mocks = vi.hoisted(() => ({
  pages: {
    asPath: '/items',
    isReady: true,
    push: vi.fn(() => Promise.resolve(true)),
    replace: vi.fn(() => Promise.resolve(true)),
  },
  appReplace: vi.fn(),
}));

vi.mock('next/compat/router', () => ({
  useRouter: () => mocks.pages,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.appReplace, replace: mocks.appReplace }),
  usePathname: () => '/should-not-be-used',
  useSearchParams: () => new URLSearchParams('ignored=1'),
}));

afterEach(async () => {
  mocks.pages.asPath = '/items';
  mocks.pages.isReady = true;
  mocks.pages.push.mockClear();
  mocks.pages.replace.mockClear();
  mocks.appReplace.mockClear();
  window.history.replaceState(null, '', '/');
  await Promise.resolve();
});

describe('Pages Router', () => {
  it('navigates with the Pages router, building on asPath', () => {
    mocks.pages.asPath = '/items?page=2';
    const { result } = renderHook(() => useUpdateQueryParams());

    result.current({ status: 'active' });

    expect(mocks.pages.replace).toHaveBeenCalledWith('/items?page=2&status=active', undefined, {
      shallow: false,
      scroll: false,
    });
    expect(mocks.appReplace).not.toHaveBeenCalled();
  });

  it('forwards shallow, scroll and push', () => {
    const { result } = renderHook(() =>
      useUpdateQueryParams({ shallow: true, scroll: true, history: 'push' }),
    );

    result.current({ q: 'x' });

    expect(mocks.pages.push).toHaveBeenCalledWith('/items?q=x', undefined, {
      shallow: true,
      scroll: true,
    });
  });

  it('strips the hash from asPath unless preserveHash is set', () => {
    mocks.pages.asPath = '/items?page=2#top';
    window.history.replaceState(null, '', '/items?page=2#top');
    const { result: plain } = renderHook(() => useUpdateQueryParams());
    const { result: keep } = renderHook(() => useUpdateQueryParams({ preserveHash: true }));

    plain.current({ page: 3 });
    expect(mocks.pages.replace).toHaveBeenLastCalledWith('/items?page=3', undefined, {
      shallow: false,
      scroll: false,
    });

    keep.current({ page: 4 });
    expect(mocks.pages.replace).toHaveBeenLastCalledWith('/items?page=4#top', undefined, {
      shallow: false,
      scroll: false,
    });
  });

  it('writes nothing before the router is ready', () => {
    mocks.pages.isReady = false;
    mocks.pages.asPath = '/items/[id]';
    const { result, rerender } = renderHook(() => useUpdateQueryParams());

    result.current({ status: 'active' });
    expect(mocks.pages.replace).not.toHaveBeenCalled();

    mocks.pages.isReady = true;
    mocks.pages.asPath = '/items/42?tab=info';
    rerender();
    result.current({ status: 'active' });

    expect(mocks.pages.replace).toHaveBeenCalledWith(
      '/items/42?tab=info&status=active',
      undefined,
      { shallow: false, scroll: false },
    );
  });
});
