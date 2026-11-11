import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouterEvents } from '../test-utils/routerEvents';
import { createRouteProgress } from './createRouteProgress';

const mocks = vi.hoisted(() => ({
  pages: null as { events: ReturnType<typeof createRouterEvents> } | null,
  pathname: '/' as string | null,
  searchParams: new URLSearchParams() as URLSearchParams | null,
}));

vi.mock('next/compat/router', () => ({ useRouter: () => mocks.pages }));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.searchParams,
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  mocks.pages = null;
  mocks.pathname = '/';
  mocks.searchParams = new URLSearchParams();
});

describe('createRouteProgress (App Router)', () => {
  it('loads from onRouterTransitionStart until the pathname commits', () => {
    const progress = createRouteProgress();
    const { result, rerender } = renderHook(() => progress.useRouteProgress({ doneMs: 100 }));
    expect(result.current).toBe('idle');

    act(() => progress.onRouterTransitionStart('/other', 'push'));
    expect(result.current).toBe('loading');

    mocks.pathname = '/other';
    rerender();
    expect(result.current).toBe('done');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('idle');
  });

  it('ignores navigations that keep the pathname by default', () => {
    const progress = createRouteProgress();
    const { result } = renderHook(() => progress.useRouteProgress());

    act(() => progress.onRouterTransitionStart('/?page=2'));

    expect(result.current).toBe('idle');
  });

  it('tracks query-only navigations with ignoreSamePathname: false', () => {
    const progress = createRouteProgress({ ignoreSamePathname: false });
    const { result, rerender } = renderHook(() => progress.useRouteProgress());

    act(() => progress.onRouterTransitionStart('/?page=2'));
    expect(result.current).toBe('loading');

    mocks.searchParams = new URLSearchParams('page=2');
    rerender();
    expect(result.current).toBe('done');
  });

  it('handles a null pathname and searchParams', () => {
    mocks.pathname = null;
    mocks.searchParams = null;
    for (const ignoreSamePathname of [true, false]) {
      const progress = createRouteProgress({ ignoreSamePathname });
      const { result } = renderHook(() => progress.useRouteProgress());
      expect(result.current).toBe('idle');
    }
  });

  it('finishes after timeoutMs when the URL never commits', () => {
    const progress = createRouteProgress();
    const { result } = renderHook(() => progress.useRouteProgress({ timeoutMs: 1000 }));

    act(() => progress.onRouterTransitionStart('/slow'));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe('done');

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('idle');
  });

  it('does not report done for a URL change it was not loading for', () => {
    const progress = createRouteProgress();
    const { result, rerender } = renderHook(() => progress.useRouteProgress());

    mocks.pathname = '/elsewhere';
    rerender();

    expect(result.current).toBe('idle');
  });

  it('stops listening on unmount', () => {
    const progress = createRouteProgress();
    const { result, unmount } = renderHook(() => progress.useRouteProgress());

    unmount();
    act(() => progress.onRouterTransitionStart('/other'));

    expect(result.current).toBe('idle');
  });
});

describe('createRouteProgress (Pages Router)', () => {
  function setup(
    options?: Parameters<ReturnType<typeof createRouteProgress>['useRouteProgress']>[0],
  ) {
    const events = createRouterEvents();
    mocks.pages = { events };
    const progress = createRouteProgress();
    const hook = renderHook(() => progress.useRouteProgress(options));
    return { events, progress, ...hook };
  }

  it('follows routeChangeStart and routeChangeComplete', () => {
    const { events, result } = setup();

    act(() => events.emit('routeChangeStart', '/other', { shallow: false }));
    expect(result.current).toBe('loading');

    act(() => events.emit('routeChangeComplete', '/other', { shallow: false }));
    expect(result.current).toBe('done');
  });

  it('finishes on routeChangeError', () => {
    const { events, result } = setup();

    act(() => events.emit('routeChangeStart', '/other', { shallow: false }));
    act(() => events.emit('routeChangeError', new Error('x'), '/other'));

    expect(result.current).toBe('done');
  });

  it('ignores shallow and same-pathname navigations by default', () => {
    const { events, result } = setup();

    act(() => events.emit('routeChangeStart', '/other', { shallow: true }));
    act(() => events.emit('routeChangeStart', '/?x=1'));
    act(() => events.emit('routeChangeComplete', '/other'));

    expect(result.current).toBe('idle');
  });

  it('tracks shallow navigations with ignoreShallow: false', () => {
    const { events, result } = setup({ ignoreShallow: false });

    act(() => events.emit('routeChangeStart', '/other', { shallow: true }));

    expect(result.current).toBe('loading');
  });

  it('ignores onRouterTransitionStart and unsubscribes on unmount', () => {
    const { events, progress, result, unmount } = setup();

    act(() => progress.onRouterTransitionStart('/other'));
    expect(result.current).toBe('idle');

    unmount();
    expect(events.count('routeChangeStart')).toBe(0);
    expect(events.count('routeChangeComplete')).toBe(0);
    expect(events.count('routeChangeError')).toBe(0);
  });
});
