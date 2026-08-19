import { useEffect, useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('useIsomorphicLayoutEffect', () => {
  it('uses useLayoutEffect in the browser', async () => {
    const mod = await import('./useIsomorphicLayoutEffect');
    expect(mod.useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });

  it('falls back to useEffect when window is undefined', async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    const mod = await import('./useIsomorphicLayoutEffect');
    expect(mod.useIsomorphicLayoutEffect).toBe(useEffect);
  });
});
