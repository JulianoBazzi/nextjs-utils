import { useEffect, useRef } from 'react';

type Handler<E> = (event: E) => void;

/**
 * Attach an event listener to `window` with automatic cleanup.
 * The handler is kept in a ref so it never needs to be in a dependency array.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: Handler<WindowEventMap[K]>,
): void;

/**
 * Attach an event listener to a DOM element (or its ref) with automatic cleanup.
 */
export function useEventListener<K extends keyof HTMLElementEventMap, T extends HTMLElement>(
  eventName: K,
  handler: Handler<HTMLElementEventMap[K]>,
  element: T | { current: T | null } | null,
): void;

export function useEventListener(
  eventName: string,
  handler: Handler<Event>,
  element?: EventTarget | { current: EventTarget | null } | null,
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const target: EventTarget | null =
      element && 'current' in element ? element.current : (element ?? globalThis.window ?? null);

    if (!target?.addEventListener) {
      return;
    }

    const listener: EventListener = (event) => {
      savedHandler.current(event);
    };

    target.addEventListener(eventName, listener);

    return () => {
      target.removeEventListener(eventName, listener);
    };
  }, [eventName, element]);
}
