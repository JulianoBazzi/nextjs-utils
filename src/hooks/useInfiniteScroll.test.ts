import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type UseInfiniteScrollOptions, useInfiniteScroll } from './useInfiniteScroll';

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

const observers: Array<{
  callback: Callback;
  options: IntersectionObserverInit | undefined;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}> = [];

function stubIntersectionObserver() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: Callback, options?: IntersectionObserverInit) {
        observers.push({
          callback,
          options,
          observe: this.observe,
          disconnect: this.disconnect,
        });
      }
    },
  );
}

afterEach(() => {
  observers.length = 0;
  vi.unstubAllGlobals();
});

function setup(initial: Partial<UseInfiniteScrollOptions> = {}) {
  const onLoadMore = vi.fn();
  const hook = renderHook(
    (props: Partial<UseInfiniteScrollOptions>) =>
      useInfiniteScroll({ onLoadMore, hasMore: true, ...props }),
    { initialProps: initial },
  );
  const sentinel = document.createElement('div');
  act(() => hook.result.current.sentinelRef(sentinel));
  return { ...hook, onLoadMore, sentinel };
}

describe('useInfiniteScroll', () => {
  it('loads more when the sentinel intersects', () => {
    stubIntersectionObserver();
    const { onLoadMore, sentinel } = setup();

    expect(observers).toHaveLength(1);
    expect(observers[0]?.observe).toHaveBeenCalledWith(sentinel);
    expect(observers[0]?.options).toEqual({ root: null, rootMargin: '200px' });

    observers[0]?.callback([{ isIntersecting: false }]);
    expect(onLoadMore).not.toHaveBeenCalled();

    observers[0]?.callback([{ isIntersecting: true }]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not observe without more items or while disabled', () => {
    stubIntersectionObserver();
    const { rerender } = setup({ hasMore: false });
    expect(observers).toHaveLength(0);

    rerender({ hasMore: true, enabled: false });
    expect(observers).toHaveLength(0);
  });

  it('re-observes when re-enabled and disconnects the old observer', () => {
    stubIntersectionObserver();
    const { rerender } = setup();

    rerender({ enabled: false });
    expect(observers[0]?.disconnect).toHaveBeenCalled();

    rerender({ enabled: true });
    expect(observers).toHaveLength(2);
  });

  it('forwards root and rootMargin', () => {
    stubIntersectionObserver();
    const root = document.createElement('section');
    setup({ root, rootMargin: '0px' });
    expect(observers[0]?.options).toEqual({ root, rootMargin: '0px' });
  });

  it('waits for the sentinel element', () => {
    stubIntersectionObserver();
    const onLoadMore = vi.fn();
    renderHook(() => useInfiniteScroll({ onLoadMore, hasMore: true }));
    expect(observers).toHaveLength(0);
  });

  it('does nothing without IntersectionObserver', () => {
    expect(typeof IntersectionObserver).toBe('undefined');
    const { onLoadMore } = setup();
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
