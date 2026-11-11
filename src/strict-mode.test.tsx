import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastChannel } from './hooks/useBroadcastChannel';
import { useDebounce } from './hooks/useDebounce';
import { useEventListener } from './hooks/useEventListener';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFilterQueryParams } from './next/useFilterQueryParams';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => '/items',
  useSearchParams: () => mocks.searchParams,
}));

afterEach(() => {
  mocks.replace.mockClear();
  window.localStorage.clear();
  vi.useRealTimers();
});

// StrictMode double-invokes renders and mounts/unmounts effects once; these
// hooks must survive that without leaking listeners or duplicating work.
describe('StrictMode', () => {
  it('useEventListener attaches exactly one listener', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler), { wrapper: StrictMode });

    window.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('useBroadcastChannel ends up with a single open channel', () => {
    const closed: BroadcastChannel[] = [];
    const Real = BroadcastChannel;
    class Tracking extends Real {
      override close() {
        closed.push(this);
        super.close();
      }
    }
    vi.stubGlobal('BroadcastChannel', Tracking);

    const { unmount } = renderHook(() => useBroadcastChannel('strict'), { wrapper: StrictMode });
    expect(closed).toHaveLength(1);

    unmount();
    expect(closed).toHaveLength(2);
    vi.unstubAllGlobals();
  });

  it('useDebounce invokes the latest callback once', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 100), { wrapper: StrictMode });

    act(() => result.current('x'));
    act(() => vi.advanceTimersByTime(100));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('x');
  });

  it('useLocalStorage reads and writes consistently', () => {
    const { result } = renderHook(() => useLocalStorage('strict', 0), { wrapper: StrictMode });

    act(() => result.current[1]((prev) => prev + 1));

    expect(result.current[0]).toBe(1);
    expect(window.localStorage.getItem('strict')).toBe('1');
  });

  it('useFilterQueryParams does not wipe the search state on mount', () => {
    const setSearch = vi.fn();
    renderHook(
      () => useFilterQueryParams({ parameters: () => ({ a: '1' }), deps: [], setSearch }),
      { wrapper: StrictMode },
    );

    expect(setSearch).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith('/items?a=1', { scroll: false });
  });
});
