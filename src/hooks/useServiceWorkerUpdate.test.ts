import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useServiceWorkerUpdate } from './useServiceWorkerUpdate';

function stubServiceWorker(controller: object | null) {
  const container = Object.assign(new EventTarget(), { controller });
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  return container;
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('useServiceWorkerUpdate', () => {
  it('fires on controller changes when the page already had a controller', () => {
    const container = stubServiceWorker({});
    const onUpdate = vi.fn();
    renderHook(() => useServiceWorkerUpdate(onUpdate));

    container.dispatchEvent(new Event('controllerchange'));

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('ignores the first install, then reports later updates', () => {
    const container = stubServiceWorker(null);
    const onUpdate = vi.fn();
    renderHook(() => useServiceWorkerUpdate(onUpdate));

    container.dispatchEvent(new Event('controllerchange'));
    expect(onUpdate).not.toHaveBeenCalled();

    container.dispatchEvent(new Event('controllerchange'));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('stops listening on unmount', () => {
    const container = stubServiceWorker({});
    const onUpdate = vi.fn();
    const { unmount } = renderHook(() => useServiceWorkerUpdate(onUpdate));

    unmount();
    container.dispatchEvent(new Event('controllerchange'));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does nothing without service worker support', () => {
    expect(navigator.serviceWorker).toBeUndefined();
    expect(() => renderHook(() => useServiceWorkerUpdate(vi.fn()))).not.toThrow();
  });

  it('does nothing without navigator', () => {
    vi.stubGlobal('navigator', undefined);
    expect(() => renderHook(() => useServiceWorkerUpdate(vi.fn()))).not.toThrow();
  });
});
