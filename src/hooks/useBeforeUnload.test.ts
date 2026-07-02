import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBeforeUnload } from './useBeforeUnload';

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('useBeforeUnload', () => {
  it('blocks unload while enabled', () => {
    renderHook(() => useBeforeUnload(true));
    const event = dispatchBeforeUnload();
    expect(event.defaultPrevented).toBe(true);
  });

  it('does nothing while disabled', () => {
    renderHook(() => useBeforeUnload(false));
    const event = dispatchBeforeUnload();
    expect(event.defaultPrevented).toBe(false);
  });

  it('reacts to the enabled flag changing', () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: true },
    });

    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    rerender({ enabled: false });
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('removes the listener on unmount', () => {
    const { unmount } = renderHook(() => useBeforeUnload(true));
    unmount();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });
});
