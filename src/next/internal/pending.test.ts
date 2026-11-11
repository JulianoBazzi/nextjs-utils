import { describe, expect, it } from 'vitest';
import { recordPending, resolveBase } from './pending';

const flushMicrotasks = () => Promise.resolve();

describe('pending query', () => {
  it('returns the committed query when nothing is pending', () => {
    expect(resolveBase('/a?x=1', 'x=1')).toBe('x=1');
  });

  it('builds on the pending query within the same tick', async () => {
    recordPending('/a?x=1', 'x=1&y=2');
    expect(resolveBase('/a?x=1', 'x=1')).toBe('x=1&y=2');
    await flushMicrotasks();
    expect(resolveBase('/a?x=1', 'x=1')).toBe('x=1');
  });

  it('ignores a pending query that started from another URL', async () => {
    recordPending('/a?x=1', 'x=2');
    expect(resolveBase('/b?x=1', 'x=1')).toBe('x=1');
    await flushMicrotasks();
  });

  it('keeps the latest entry when an older one is cleared', async () => {
    recordPending('/a?', 'x=1');
    recordPending('/a?', 'x=1&y=2');
    expect(resolveBase('/a?', '')).toBe('x=1&y=2');
    await flushMicrotasks();
    expect(resolveBase('/a?', '')).toBe('');
  });
});
