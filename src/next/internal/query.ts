/**
 * Serialize one query value. Returns `undefined` for values that delete the
 * param: `''`, `null`, `undefined`, non-finite numbers and invalid dates.
 * Dates become ISO strings; `false` and `0` are kept.
 */
export function toParamString(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (value == null || value === '' || (typeof value === 'number' && !Number.isFinite(value))) {
    return undefined;
  }
  return String(value);
}

/**
 * Apply `params` on top of `base` (which is not mutated). Each key replaces
 * every existing entry; arrays become repeated entries; empty values delete.
 */
export function buildQuery(
  base: URLSearchParams,
  params: object,
  ignored: ReadonlySet<string>,
): URLSearchParams {
  const next = new URLSearchParams(base);

  for (const [key, value] of Object.entries(params)) {
    if (ignored.has(key)) {
      continue;
    }
    next.delete(key);
    const items: unknown[] = Array.isArray(value) ? value : [value];
    for (const item of items) {
      const serialized = toParamString(item);
      if (serialized !== undefined) {
        next.append(key, serialized);
      }
    }
  }

  return next;
}

/** Key-order-insensitive comparison; the order of repeated values still matters. */
export function isSameQuery(a: URLSearchParams, b: URLSearchParams): boolean {
  const left = new URLSearchParams(a);
  const right = new URLSearchParams(b);
  left.sort();
  right.sort();
  return left.toString() === right.toString();
}

/** Split a Pages Router `asPath` into `[pathname, query]`, dropping the `#hash`. */
export function splitAsPath(asPath: string): [pathname: string, query: string] {
  const hashIndex = asPath.indexOf('#');
  const withoutHash = hashIndex === -1 ? asPath : asPath.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  if (queryIndex === -1) {
    return [withoutHash, ''];
  }
  return [withoutHash.slice(0, queryIndex), withoutHash.slice(queryIndex + 1)];
}

export function withQuery(pathname: string, query: string): string {
  return query ? `${pathname}?${query}` : pathname;
}
