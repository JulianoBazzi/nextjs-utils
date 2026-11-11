import { describe, expect, it } from 'vitest';
import { buildQuery, isSameQuery, splitAsPath, toParamString, withQuery } from './query';

const none = new Set<string>();
const build = (base: string, params: object, ignored: Set<string> = none) =>
  buildQuery(new URLSearchParams(base), params, ignored).toString();

describe('toParamString', () => {
  it('keeps false and 0', () => {
    expect(toParamString(false)).toBe('false');
    expect(toParamString(0)).toBe('0');
  });

  it('drops empty values and non-finite numbers', () => {
    for (const value of ['', null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(toParamString(value)).toBeUndefined();
    }
  });

  it('serializes valid dates as ISO and drops invalid ones', () => {
    expect(toParamString(new Date('2026-01-02T03:04:05Z'))).toBe('2026-01-02T03:04:05.000Z');
    expect(toParamString(new Date('nope'))).toBeUndefined();
  });
});

// Shared test vectors with @julianobazzi/utils `buildQueryUrl` / `isSameQuery` (★).
describe('buildQuery', () => {
  it('adds new keys after the existing ones', () => {
    expect(build('x=1', { y: 2 })).toBe('x=1&y=2');
  });

  it('replaces every existing entry of a key', () => {
    expect(build('x=1&x=2', { x: 3 })).toBe('x=3');
  });

  it('deletes keys with empty values', () => {
    expect(build('x=1', { x: '' })).toBe('');
    expect(build('', { n: Number.NaN, b: false, z: 0 })).toBe('b=false&z=0');
  });

  it('expands arrays, skipping empty items, and deletes for empty arrays', () => {
    expect(build('', { ids: [1, '', 2] })).toBe('ids=1&ids=2');
    expect(build('ids=1', { ids: [] })).toBe('');
  });

  it('serializes dates, including inside arrays', () => {
    expect(build('', { d: new Date('2026-01-02T03:04:05Z') })).toBe(
      'd=2026-01-02T03%3A04%3A05.000Z',
    );
    expect(build('', { d: [new Date('2026-01-02T00:00:00Z'), new Date('nope')] })).toBe(
      'd=2026-01-02T00%3A00%3A00.000Z',
    );
  });

  it('leaves ignored keys untouched', () => {
    expect(build('with=u', { with: 'x' }, new Set(['with']))).toBe('with=u');
  });

  it('does not mutate the base', () => {
    const base = new URLSearchParams('x=1');
    buildQuery(base, { x: 2 }, none);
    expect(base.toString()).toBe('x=1');
  });
});

describe('isSameQuery', () => {
  const same = (a: string, b: string) =>
    isSameQuery(new URLSearchParams(a), new URLSearchParams(b));

  it('ignores key order', () => {
    expect(same('a=1&b=2', 'b=2&a=1')).toBe(true);
  });

  it('treats + and %20 as the same space', () => {
    expect(same('q=a+b', 'q=a%20b')).toBe(true);
  });

  it('respects the order of repeated values', () => {
    expect(same('id=1&id=2', 'id=2&id=1')).toBe(false);
  });

  it('detects different values', () => {
    expect(same('a=1', 'a=2')).toBe(false);
  });
});

describe('splitAsPath', () => {
  it('splits pathname and query', () => {
    expect(splitAsPath('/items?page=2')).toEqual(['/items', 'page=2']);
  });

  it('returns an empty query when there is none', () => {
    expect(splitAsPath('/items')).toEqual(['/items', '']);
  });

  it('drops the hash, even before a "?"', () => {
    expect(splitAsPath('/items?page=2#top')).toEqual(['/items', 'page=2']);
    expect(splitAsPath('/items#top?x=1')).toEqual(['/items', '']);
  });
});

describe('withQuery', () => {
  it('appends a non-empty query', () => {
    expect(withQuery('/items', 'a=1')).toBe('/items?a=1');
    expect(withQuery('/items', '')).toBe('/items');
  });
});
