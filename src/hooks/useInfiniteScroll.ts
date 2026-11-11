import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export interface UseInfiniteScrollOptions {
  /** Called when the sentinel scrolls into view. */
  onLoadMore: () => void;
  /** Whether there is anything left to load; `false` stops observing. */
  hasMore: boolean;
  /**
   * Observe only while `true`. Pass `!isLoading`: re-enabling re-checks the
   * sentinel, so a sentinel that is still visible after a page loads triggers
   * the next one. Default `true`.
   */
  enabled?: boolean;
  /** Scroll container; `null`/omitted means the viewport. */
  root?: Element | null;
  /** Load ahead of time by growing the root's box. Default `'200px'`. */
  rootMargin?: string;
}

export interface UseInfiniteScrollReturn {
  /** Callback ref for the sentinel element placed after the last item. */
  sentinelRef: (node: Element | null) => void;
}

/**
 * Infinite scrolling with an `IntersectionObserver`: put the returned
 * `sentinelRef` on an element after the list and `onLoadMore` runs whenever it
 * becomes visible. SSR-safe; does nothing where `IntersectionObserver` is
 * unavailable.
 *
 * @example
 * const { sentinelRef } = useInfiniteScroll({ onLoadMore: fetchNext, hasMore, enabled: !isLoading });
 * return <>{items.map(renderItem)}<div ref={sentinelRef} /></>;
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const { onLoadMore, hasMore, enabled = true, root = null, rootMargin = '200px' } = options;
  const [node, setNode] = useState<Element | null>(null);

  const onLoadMoreRef = useRef(onLoadMore);
  useIsomorphicLayoutEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    if (!node || !hasMore || !enabled || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, hasMore, enabled, root, rootMargin]);

  const sentinelRef = useCallback((element: Element | null) => {
    setNode(element);
  }, []);

  return { sentinelRef };
}
