import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCookie } from './hooks/useCookie';
import { useEventListener } from './hooks/useEventListener';
import { useIdle } from './hooks/useIdle';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePageVisibility } from './hooks/usePageVisibility';
import { useHashParam } from './next/useHashParam';

type Subscribe = (onChange: () => void) => () => void;
type Snapshot = () => unknown;
type Effect = () => undefined | (() => void);

const captured = vi.hoisted(() => ({
  subscribes: [] as ((onChange: () => void) => () => void)[],
  getSnapshots: [] as (() => unknown)[],
  getServerSnapshots: [] as (() => unknown)[],
  effects: [] as (() => undefined | (() => void))[],
}));

// react-dom cannot render at all while `window` is undefined (its dev build
// reads `window.event` on every update), so the SSR guards inside these hooks
// can never run under a real jsdom render. Instead, capture the store/effect
// callbacks the hooks hand to React and invoke them directly with the
// relevant global stubbed out.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useSyncExternalStore: (
      subscribe: Subscribe,
      getSnapshot: Snapshot,
      getServerSnapshot: Snapshot,
    ) => {
      captured.subscribes.push(subscribe);
      captured.getSnapshots.push(getSnapshot);
      captured.getServerSnapshots.push(getServerSnapshot);
      return getSnapshot();
    },
    useEffect: (effect: Effect) => {
      captured.effects.push(effect);
    },
  };
});

function pick<T>(items: T[], index = 0): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`no captured callback at index ${index}`);
  }
  return item;
}

beforeEach(() => {
  captured.subscribes.length = 0;
  captured.getSnapshots.length = 0;
  captured.getServerSnapshots.length = 0;
  captured.effects.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SSR guards', () => {
  it('useOnlineStatus falls back to online on the server', () => {
    renderHook(() => useOnlineStatus());

    expect(pick(captured.getServerSnapshots)()).toBe(true);

    vi.stubGlobal('window', undefined);
    vi.stubGlobal('navigator', undefined);
    const unsubscribe = pick(captured.subscribes)(() => {});
    expect(unsubscribe()).toBeUndefined();
    expect(pick(captured.getSnapshots)()).toBe(true);
  });

  it('usePageVisibility falls back to visible on the server', () => {
    renderHook(() => usePageVisibility());

    expect(pick(captured.getServerSnapshots)()).toBe(true);

    vi.stubGlobal('document', undefined);
    const unsubscribe = pick(captured.subscribes)(() => {});
    expect(unsubscribe()).toBeUndefined();
    expect(pick(captured.getSnapshots)()).toBe(true);
  });

  it('useMediaQuery reports no match on the server', () => {
    renderHook(() => useMediaQuery('(min-width: 600px)'));

    expect(pick(captured.getServerSnapshots)()).toBe(false);

    vi.stubGlobal('window', undefined);
    const unsubscribe = pick(captured.subscribes)(() => {});
    expect(unsubscribe()).toBeUndefined();
    expect(pick(captured.getSnapshots)()).toBe(false);
  });

  it('useHashParam falls back to the default and ignores writes on the server', () => {
    const { result } = renderHook(() => useHashParam('fallback'));

    expect(pick(captured.getServerSnapshots)()).toBeUndefined();

    vi.stubGlobal('window', undefined);
    const unsubscribe = pick(captured.subscribes)(() => {});
    expect(unsubscribe()).toBeUndefined();
    expect(pick(captured.getSnapshots)()).toBeUndefined();
    expect(() => result.current[1]('details')).not.toThrow();
  });

  it('useLocalStorage falls back to the initial value and ignores writes on the server', () => {
    const { result } = renderHook(() => useLocalStorage('ssr-key', 'fallback'));

    expect(pick(captured.getServerSnapshots)()).toBeNull();

    vi.stubGlobal('window', undefined);
    const unsubscribe = pick(captured.subscribes)(() => {});
    expect(unsubscribe()).toBeUndefined();
    expect(pick(captured.getSnapshots)()).toBeNull();
    expect(() => result.current[1]('next')).not.toThrow();
    expect(() => result.current[2]()).not.toThrow();
  });

  it('useCookie falls back to the initial value and ignores writes on the server', () => {
    const { result } = renderHook(() => useCookie('ssr-cookie', 'fallback'));

    expect(pick(captured.getServerSnapshots)()).toBeNull();

    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    const unsubscribe = pick(captured.subscribes)(() => {});
    expect(unsubscribe()).toBeUndefined();
    expect(pick(captured.getSnapshots)()).toBeNull();
    expect(() => result.current[1]('next')).not.toThrow();
    expect(() => result.current[2]()).not.toThrow();
  });

  it('useIdle does not track activity on the server', () => {
    renderHook(() => useIdle(1000));

    vi.stubGlobal('window', undefined);
    expect(pick(captured.effects)()).toBeUndefined();
  });

  it('useEventListener does not attach when no target can be resolved', () => {
    renderHook(() => useEventListener('click', () => {}));

    vi.stubGlobal('window', undefined);
    // effects[0] syncs the handler ref; effects[1] attaches the listener.
    expect(pick(captured.effects, 1)()).toBeUndefined();
  });
});
