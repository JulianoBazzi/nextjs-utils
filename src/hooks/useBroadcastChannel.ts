import { useCallback, useEffect, useRef } from 'react';

export interface UseBroadcastChannelReturn<T> {
  /** Send a message to every other tab/window subscribed to the same channel. */
  postMessage: (data: T) => void;
}

/**
 * Communicate between tabs/windows of the same origin via `BroadcastChannel`.
 * The channel is closed automatically on unmount, and the latest `onMessage`
 * is always used. SSR-safe: `postMessage` is a no-op on the server (and in
 * browsers without `BroadcastChannel` support).
 *
 * @param channelName - the channel to join
 * @param onMessage - called with the data of every message posted by other tabs
 * @returns `{ postMessage }`
 */
export function useBroadcastChannel<T>(
  channelName: string,
  onMessage?: (data: T) => void,
): UseBroadcastChannelReturn<T> {
  const savedHandler = useRef(onMessage);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    savedHandler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    const listener = (event: MessageEvent) => {
      savedHandler.current?.(event.data as T);
    };

    channel.addEventListener('message', listener);

    return () => {
      channel.removeEventListener('message', listener);
      channel.close();
      channelRef.current = null;
    };
  }, [channelName]);

  const postMessage = useCallback((data: T) => {
    channelRef.current?.postMessage(data);
  }, []);

  return { postMessage };
}
