import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastChannel } from './useBroadcastChannel';

type Listener = (event: { data: unknown }) => void;

class FakeBroadcastChannel {
  static instances = new Set<FakeBroadcastChannel>();

  private listeners = new Set<Listener>();
  private closed = false;

  constructor(readonly name: string) {
    FakeBroadcastChannel.instances.add(this);
  }

  addEventListener(_type: 'message', listener: Listener) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'message', listener: Listener) {
    this.listeners.delete(listener);
  }

  postMessage(data: unknown) {
    // Like the real API, messages are delivered to OTHER channels only.
    for (const instance of FakeBroadcastChannel.instances) {
      if (instance === this || instance.name !== this.name || instance.closed) {
        continue;
      }
      for (const listener of instance.listeners) {
        listener({ data });
      }
    }
  }

  close() {
    this.closed = true;
    FakeBroadcastChannel.instances.delete(this);
  }
}

beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
});

afterEach(() => {
  FakeBroadcastChannel.instances.clear();
  vi.unstubAllGlobals();
});

describe('useBroadcastChannel', () => {
  it('delivers messages to other hooks on the same channel', () => {
    const received = vi.fn();
    const sender = renderHook(() => useBroadcastChannel<string>('sync'));
    renderHook(() => useBroadcastChannel<string>('sync', received));

    act(() => sender.result.current.postMessage('hello'));

    expect(received).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenCalledWith('hello');
  });

  it('does not deliver messages to the sender itself', () => {
    const received = vi.fn();
    const sender = renderHook(() => useBroadcastChannel<string>('sync', received));

    act(() => sender.result.current.postMessage('hello'));

    expect(received).not.toHaveBeenCalled();
  });

  it('ignores messages from other channels', () => {
    const received = vi.fn();
    const sender = renderHook(() => useBroadcastChannel<string>('a'));
    renderHook(() => useBroadcastChannel<string>('b', received));

    act(() => sender.result.current.postMessage('hello'));

    expect(received).not.toHaveBeenCalled();
  });

  it('uses the latest onMessage handler', () => {
    const first = vi.fn();
    const second = vi.fn();
    const sender = renderHook(() => useBroadcastChannel<string>('sync'));
    const receiver = renderHook(({ handler }) => useBroadcastChannel<string>('sync', handler), {
      initialProps: { handler: first },
    });

    receiver.rerender({ handler: second });
    act(() => sender.result.current.postMessage('hello'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('hello');
  });

  it('ignores messages when no onMessage handler is provided', () => {
    const sender = renderHook(() => useBroadcastChannel<string>('sync'));
    renderHook(() => useBroadcastChannel<string>('sync'));

    expect(() => act(() => sender.result.current.postMessage('hello'))).not.toThrow();
  });

  it('is a no-op when BroadcastChannel is unsupported', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const received = vi.fn();
    const { result } = renderHook(() => useBroadcastChannel<string>('sync', received));

    expect(() => act(() => result.current.postMessage('hello'))).not.toThrow();
    expect(received).not.toHaveBeenCalled();
  });

  it('closes the channel on unmount', () => {
    const received = vi.fn();
    const sender = renderHook(() => useBroadcastChannel<string>('sync'));
    const receiver = renderHook(() => useBroadcastChannel<string>('sync', received));

    receiver.unmount();
    act(() => sender.result.current.postMessage('hello'));

    expect(received).not.toHaveBeenCalled();
  });
});
