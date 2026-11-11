import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

type Handler<E> = (event: E) => void;

/**
 * `capture`, `once` and `passive` are supported; `signal` is not. `enabled:
 * false` detaches the listener (default `true`) — handy for conditional
 * listeners without breaking the rules of hooks.
 */
export type EventListenerOptions =
  | boolean
  | (Pick<AddEventListenerOptions, 'capture' | 'once' | 'passive'> & { enabled?: boolean });

/**
 * Attach an event listener to `window` with automatic cleanup.
 * The handler is kept in a ref so it never needs to be in a dependency array.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: Handler<WindowEventMap[K]>,
  element?: undefined,
  options?: EventListenerOptions,
): void;

/**
 * Attach an event listener to `document` with automatic cleanup.
 */
export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: Handler<DocumentEventMap[K]>,
  element: Document,
  options?: EventListenerOptions,
): void;

/**
 * Attach an event listener to a DOM element (or its ref) with automatic cleanup.
 * Note: an explicit `null` element falls back to `window`; pass a ref object
 * (`{ current: null }`) to attach nothing until an element is available.
 */
export function useEventListener<K extends keyof HTMLElementEventMap, T extends HTMLElement>(
  eventName: K,
  handler: Handler<HTMLElementEventMap[K]>,
  element: T | { current: T | null } | null,
  options?: EventListenerOptions,
): void;

/**
 * Attach an event listener to any `EventTarget` (e.g. `MediaQueryList`,
 * `BroadcastChannel`, a custom emitter) with automatic cleanup.
 */
export function useEventListener<E extends Event = Event>(
  eventName: string,
  handler: Handler<E>,
  element: EventTarget | { current: EventTarget | null } | null,
  options?: EventListenerOptions,
): void;

export function useEventListener(
  eventName: string,
  handler: Handler<Event>,
  element?: EventTarget | { current: EventTarget | null } | null,
  options?: EventListenerOptions,
): void {
  const savedHandler = useRef(handler);

  // Layout effect so an event fired right after commit sees the latest handler.
  useIsomorphicLayoutEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  // Depend on primitives so an inline options object doesn't re-attach every render.
  const normalized: Exclude<EventListenerOptions, boolean> =
    typeof options === 'object' ? options : { capture: options };
  const { capture, once, passive, enabled = true } = normalized;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const target: EventTarget | null =
      element && 'current' in element ? element.current : (element ?? globalThis.window ?? null);

    if (!target?.addEventListener) {
      return;
    }

    const listener: EventListener = (event) => {
      savedHandler.current(event);
    };
    const listenerOptions: AddEventListenerOptions = { capture, once, passive };

    target.addEventListener(eventName, listener, listenerOptions);

    return () => {
      target.removeEventListener(eventName, listener, listenerOptions);
    };
  }, [eventName, element, capture, once, passive, enabled]);
}
