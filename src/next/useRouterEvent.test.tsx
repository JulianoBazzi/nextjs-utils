import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRouterEvents } from '../test-utils/routerEvents';
import { useRouterEvent } from './useRouterEvent';

const mocks = vi.hoisted(() => ({
  pages: null as { events: ReturnType<typeof createRouterEvents> } | null,
}));

vi.mock('next/compat/router', () => ({ useRouter: () => mocks.pages }));

afterEach(() => {
  mocks.pages = null;
});

describe('useRouterEvent', () => {
  it('passes the url and the shallow flag', () => {
    const events = createRouterEvents();
    mocks.pages = { events };
    const handler = vi.fn();
    renderHook(() => useRouterEvent('routeChangeStart', handler));

    events.emit('routeChangeStart', '/a', { shallow: true });
    events.emit('routeChangeStart', '/b');

    expect(handler).toHaveBeenNthCalledWith(1, '/a', { shallow: true });
    expect(handler).toHaveBeenNthCalledWith(2, '/b', { shallow: false });
  });

  it('reorders routeChangeError arguments and exposes the error', () => {
    const events = createRouterEvents();
    mocks.pages = { events };
    const handler = vi.fn();
    const error = Object.assign(new Error('Route Cancelled'), { cancelled: true });
    renderHook(() => useRouterEvent('routeChangeError', handler));

    events.emit('routeChangeError', error, '/a', { shallow: true });
    events.emit('routeChangeError', error, '/b');

    expect(handler).toHaveBeenNthCalledWith(1, '/a', { shallow: true, error });
    expect(handler).toHaveBeenNthCalledWith(2, '/b', { shallow: false, error });
  });

  it('always calls the latest handler and unsubscribes on unmount', () => {
    const events = createRouterEvents();
    mocks.pages = { events };
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ handler }) => useRouterEvent('routeChangeComplete', handler),
      { initialProps: { handler: first } },
    );

    rerender({ handler: second });
    events.emit('routeChangeComplete', '/a', { shallow: false });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    unmount();
    expect(events.count('routeChangeComplete')).toBe(0);
  });

  it('does nothing in the App Router', () => {
    expect(() => renderHook(() => useRouterEvent('routeChangeStart', vi.fn()))).not.toThrow();
  });
});
