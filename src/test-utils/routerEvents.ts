import { vi } from 'vitest';

// biome-ignore lint/suspicious/noExplicitAny: mirrors Next's untyped mitt emitter
type Handler = (...args: any[]) => void;

/** Minimal stand-in for the Pages Router `router.events` (mitt) emitter. */
export function createRouterEvents() {
  const handlers = new Map<string, Set<Handler>>();
  return {
    on: vi.fn((type: string, handler: Handler) => {
      const set = handlers.get(type) ?? new Set<Handler>();
      set.add(handler);
      handlers.set(type, set);
    }),
    off: vi.fn((type: string, handler: Handler) => {
      handlers.get(type)?.delete(handler);
    }),
    emit(type: string, ...args: unknown[]) {
      for (const handler of handlers.get(type) ?? []) {
        handler(...args);
      }
    },
    count(type: string) {
      return handlers.get(type)?.size ?? 0;
    },
  };
}
