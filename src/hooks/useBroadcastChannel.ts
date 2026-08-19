import { useCallback, useEffect, useRef } from 'react';

export interface UseBroadcastChannelOptions<T> {
  /**
   * Type guard applied to every incoming message. Any same-origin script can
   * post to the channel, so validate the shape before trusting it; messages
   * that fail are dropped.
   */
  validate?: (data: unknown) => data is T;
  /**
   * Called when a message cannot be (de)serialized — `postMessage` with a
   * non-cloneable value (`DataCloneError`) or a `messageerror` event.
   */
  onError?: (error: unknown) => void;
}

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
 * @param options - message validation and error reporting
 * @returns `{ postMessage }`
 */
export function useBroadcastChannel<T>(
  channelName: string,
  onMessage?: (data: T) => void,
  options: UseBroadcastChannelOptions<T> = {},
): UseBroadcastChannelReturn<T> {
  const { validate, onError } = options;
  const savedHandler = useRef(onMessage);
  const validateRef = useRef(validate);
  const onErrorRef = useRef(onError);
  const nameRef = useRef(channelName);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    savedHandler.current = onMessage;
    validateRef.current = validate;
    onErrorRef.current = onError;
    nameRef.current = channelName;
  }, [onMessage, validate, onError, channelName]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    const listener = (event: MessageEvent) => {
      const guard = validateRef.current;
      if (guard && !guard(event.data)) {
        return;
      }
      savedHandler.current?.(event.data as T);
    };
    const errorListener = (event: MessageEvent) => {
      onErrorRef.current?.(event);
    };

    channel.addEventListener('message', listener);
    channel.addEventListener('messageerror', errorListener);

    return () => {
      channel.removeEventListener('message', listener);
      channel.removeEventListener('messageerror', errorListener);
      channel.close();
      channelRef.current = null;
    };
  }, [channelName]);

  const postMessage = useCallback((data: T) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage(data);
        return;
      }
      // Not subscribed (yet, or anymore): post through a throwaway channel so
      // calls made before effects flush — or after unmount — are not lost.
      if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
        return;
      }
      const channel = new BroadcastChannel(nameRef.current);
      channel.postMessage(data);
      channel.close();
    } catch (error) {
      onErrorRef.current?.(error);
    }
  }, []);

  return { postMessage };
}
