import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEventListener } from './useEventListener';

describe('useEventListener', () => {
  it('listens on window by default', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler));

    window.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('always calls the latest handler', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ handler }) => useEventListener('click', handler), {
      initialProps: { handler: first },
    });

    rerender({ handler: second });
    window.dispatchEvent(new Event('click'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('listens on a DOM element', () => {
    const handler = vi.fn();
    const element = document.createElement('button');
    renderHook(() => useEventListener('click', handler, element));

    element.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('listens on a ref object', () => {
    const handler = vi.fn();
    const element = document.createElement('button');
    renderHook(() => useEventListener('click', handler, { current: element }));

    element.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('falls back to window when the element is null', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler, null));

    window.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a ref without a current element', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler, { current: null }));

    window.dispatchEvent(new Event('click'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener('click', handler));

    unmount();
    window.dispatchEvent(new Event('click'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('re-attaches when the event name changes', () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ eventName }: { eventName: 'focus' | 'blur' }) => useEventListener(eventName, handler),
      { initialProps: { eventName: 'focus' } },
    );

    rerender({ eventName: 'blur' });

    window.dispatchEvent(new Event('focus'));
    expect(handler).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('blur'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
