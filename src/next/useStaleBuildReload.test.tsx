import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateTo, reloadPage } from '../internal/page';
import { createRouterEvents } from '../test-utils/routerEvents';
import { isStaleBuildNavigationError, useStaleBuildReload } from './useStaleBuildReload';

vi.mock('../internal/page', () => ({ reloadPage: vi.fn(), navigateTo: vi.fn() }));

const mocks = vi.hoisted(() => ({
  pages: null as { events: ReturnType<typeof createRouterEvents> } | null,
}));

vi.mock('next/compat/router', () => ({ useRouter: () => mocks.pages }));

const chunkError = Object.assign(new Error('Loading chunk 123 failed.'), {
  name: 'ChunkLoadError',
});

function fireError(error: unknown) {
  window.dispatchEvent(new ErrorEvent('error', { error }));
}

function fireRejection(reason: unknown) {
  window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason }));
}

afterEach(() => {
  mocks.pages = null;
  window.sessionStorage.clear();
  vi.mocked(reloadPage).mockClear();
  vi.mocked(navigateTo).mockClear();
  vi.restoreAllMocks();
});

describe('isStaleBuildNavigationError', () => {
  it.each([
    ['ChunkLoadError', chunkError],
    ['CSS chunk', new Error('Loading CSS chunk app-layout failed.')],
    ['Chrome dynamic import', new TypeError('Failed to fetch dynamically imported module: /x.js')],
    ['Firefox dynamic import', new TypeError('error loading dynamically imported module')],
    ['Safari dynamic import', new TypeError('Importing a module script failed.')],
    ['Pages script', new Error('Failed to load script: /_next/static/chunks/pages/a.js')],
  ])('detects %s', (_label, error) => {
    expect(isStaleBuildNavigationError(error)).toBe(true);
  });

  it.each([
    ['a regular error', new Error('boom')],
    ['a string', 'Loading chunk 1 failed'],
    ['null', null],
    ['an object without message', { name: 'Error' }],
  ])('ignores %s', (_label, error) => {
    expect(isStaleBuildNavigationError(error)).toBe(false);
  });
});

describe('useStaleBuildReload', () => {
  it('reloads on an uncaught stale-build error or rejection', () => {
    renderHook(() => useStaleBuildReload({ minIntervalMs: 0 }));

    fireError(chunkError);
    fireRejection(new TypeError('Failed to fetch dynamically imported module'));

    expect(reloadPage).toHaveBeenCalledTimes(2);
  });

  it('ignores unrelated errors', () => {
    renderHook(() => useStaleBuildReload());

    fireError(new Error('boom'));
    fireRejection('nope');

    expect(reloadPage).not.toHaveBeenCalled();
  });

  it('does not reload twice within minIntervalMs', () => {
    vi.useFakeTimers();
    renderHook(() => useStaleBuildReload());

    fireError(chunkError);
    fireError(chunkError);
    expect(reloadPage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(10000);
    fireError(chunkError);
    expect(reloadPage).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('uses a custom guard key', () => {
    renderHook(() => useStaleBuildReload({ guardKey: 'custom' }));

    fireError(chunkError);

    expect(window.sessionStorage.getItem('custom')).not.toBeNull();
  });

  it('reloads anyway when sessionStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    renderHook(() => useStaleBuildReload());

    fireError(chunkError);

    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it('goes to the target URL on a Pages Router routeChangeError', () => {
    const events = createRouterEvents();
    mocks.pages = { events };
    renderHook(() => useStaleBuildReload());

    events.emit('routeChangeError', chunkError, '/next-page', { shallow: false });

    expect(navigateTo).toHaveBeenCalledWith('/next-page');
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it('stops listening on unmount', () => {
    const events = createRouterEvents();
    mocks.pages = { events };
    const { unmount } = renderHook(() => useStaleBuildReload());

    unmount();
    // Vitest reports window errors nobody listens to as uncaught exceptions.
    const swallow = () => {};
    window.addEventListener('error', swallow);
    fireError(chunkError);
    window.removeEventListener('error', swallow);

    expect(reloadPage).not.toHaveBeenCalled();
    expect(events.count('routeChangeError')).toBe(0);
  });
});
