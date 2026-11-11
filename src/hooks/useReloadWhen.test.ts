import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reloadPage } from '../internal/page';
import { useReloadWhen } from './useReloadWhen';

vi.mock('../internal/page', () => ({ reloadPage: vi.fn(), navigateTo: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(reloadPage).mockClear();
});

describe('useReloadWhen', () => {
  it('reloads the page right away by default', () => {
    const { result } = renderHook(() => useReloadWhen());
    result.current.requestReload();
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it('waits until canReload allows it, retrying every retryMs', () => {
    let canReload = false;
    const reload = vi.fn();
    const { result } = renderHook(() =>
      useReloadWhen({ canReload: () => canReload, retryMs: 500, reload }),
    );

    result.current.requestReload();
    result.current.requestReload();
    vi.advanceTimersByTime(1000);
    expect(reload).not.toHaveBeenCalled();

    canReload = true;
    vi.advanceTimersByTime(500);
    expect(reload).toHaveBeenCalledTimes(1);

    // A new request after the reload is honored again.
    result.current.requestReload();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('uses the default retry delay of one second', () => {
    let canReload = false;
    const reload = vi.fn();
    const { result } = renderHook(() => useReloadWhen({ canReload: () => canReload, reload }));

    result.current.requestReload();
    canReload = true;
    vi.advanceTimersByTime(999);
    expect(reload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('drops a deferred request on unmount', () => {
    let canReload = false;
    const reload = vi.fn();
    const { result, unmount } = renderHook(() =>
      useReloadWhen({ canReload: () => canReload, reload }),
    );

    result.current.requestReload();
    unmount();
    canReload = true;
    vi.advanceTimersByTime(5000);

    expect(reload).not.toHaveBeenCalled();
  });
});
