import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastChannel } from './useBroadcastChannel';

type Listener = (event: { data: unknown }) => void;

class FakeBroadcastChannel {
  static instances = new Set<FakeBroadcastChannel>();

  private listeners = new Map<string, Set<Listener>>();
  private closed = false;

  constructor(readonly name: string) {
    FakeBroadcastChannel.instances.add(this);
  }

  addEventListener(type: string, listener: Listener) {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, data: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ data });
    }
  }

  postMessage(data: unknown) {
    // Like the real API, messages are delivered to OTHER channels only.
    for (const instance of FakeBroadcastChannel.instances) {
      if (instance === this || instance.name !== this.name || instance.closed) {
        continue;
      }
      instance.dispatch('message', data);
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
  vi.restoreAllMocks();
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
  it('drops messages rejected by validate', () => {
    const received = vi.fn();
    const isString = (data: unknown): data is string => typeof data === 'string';
    const sender = renderHook(() => useBroadcastChannel<string>('sync'));
    renderHook(() => useBroadcastChannel<string>('sync', received, { validate: isString }));

    act(() => sender.result.current.postMessage(42 as unknown as string));
    expect(received).not.toHaveBeenCalled();

    act(() => sender.result.current.postMessage('ok'));
    expect(received).toHaveBeenCalledWith('ok');
  });

  it('reports messageerror events through onError', () => {
    const onError = vi.fn();
    renderHook(() => useBroadcastChannel<string>('sync', undefined, { onError }));

    const [instance] = FakeBroadcastChannel.instances;
    act(() => instance?.dispatch('messageerror', 'bad'));

    expect(onError).toHaveBeenCalledWith({ data: 'bad' });
  });

  it('reports postMessage failures through onError instead of throwing', () => {
    const error = new Error('DataCloneError');
    vi.spyOn(FakeBroadcastChannel.prototype, 'postMessage').mockImplementation(() => {
      throw error;
    });
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useBroadcastChannel<string>('sync', undefined, { onError }),
    );

    expect(() => act(() => result.current.postMessage('x'))).not.toThrow();
    expect(onError).toHaveBeenCalledWith(error);

    const silent = renderHook(() => useBroadcastChannel<string>('sync'));
    expect(() => act(() => silent.result.current.postMessage('x'))).not.toThrow();
  });

  it('still posts after unmount through a throwaway channel', () => {
    const received = vi.fn();
    renderHook(() => useBroadcastChannel<string>('sync', received));
    const sender = renderHook(() => useBroadcastChannel<string>('sync'));

    sender.unmount();
    act(() => sender.result.current.postMessage('late'));

    expect(received).toHaveBeenCalledWith('late');
    // The temporary channel does not linger.
    expect(FakeBroadcastChannel.instances.size).toBe(1);
  });

  it('re-subscribes when the channel name changes', () => {
    const received = vi.fn();
    const sender = renderHook(() => useBroadcastChannel<string>('b'));
    const receiver = renderHook(({ name }) => useBroadcastChannel<string>(name, received), {
      initialProps: { name: 'a' },
    });

    receiver.rerender({ name: 'b' });
    act(() => sender.result.current.postMessage('hello'));

    expect(received).toHaveBeenCalledWith('hello');
    expect(FakeBroadcastChannel.instances.size).toBe(2);
  });
});
