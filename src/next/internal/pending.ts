interface PendingQuery {
  /** `pathname?query` of the committed URL the navigation started from. */
  from: string;
  /** The query that navigation is heading to. */
  to: string;
}

// Shared by every URL hook on the page: consecutive updates in the same tick
// (e.g. `toggleSort(); setPage(1)`) build on each other instead of on the
// same, not-yet-updated snapshot.
let pending: PendingQuery | null = null;

/** The query to build on: the pending one when it started from `key`, else `committed`. */
export function resolveBase(key: string, committed: string): string {
  return pending !== null && pending.from === key ? pending.to : committed;
}

/** Remember a navigation for the rest of the current tick. */
export function recordPending(key: string, to: string): void {
  const entry: PendingQuery = { from: key, to };
  pending = entry;
  queueMicrotask(() => {
    if (pending === entry) {
      pending = null;
    }
  });
}
