import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHashParam } from './useHashParam';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new Event('hashchange'));
}

afterEach(() => {
  act(() => {
    window.history.replaceState(null, '', window.location.pathname);
    window.dispatchEvent(new Event('hashchange'));
  });
});

describe('useHashParam', () => {
  it('returns undefined when the URL has no hash', () => {
    const { result } = renderHook(() => useHashParam());
    expect(result.current[0]).toBeUndefined();
  });

  it('returns the default value when the URL has no hash', () => {
    const { result } = renderHook(() => useHashParam('overview'));
    expect(result.current[0]).toBe('overview');
  });

  it('reads an existing hash', () => {
    act(() => setHash('details'));
    const { result } = renderHook(() => useHashParam());
    expect(result.current[0]).toBe('details');
  });

  it('updates the hash and the returned value', () => {
    const { result } = renderHook(() => useHashParam());

    act(() => result.current[1]('details'));

    expect(window.location.hash).toBe('#details');
    expect(result.current[0]).toBe('details');
  });

  it('reacts to external hash changes', () => {
    const { result } = renderHook(() => useHashParam());

    act(() => setHash('external'));

    expect(result.current[0]).toBe('external');
  });

  it('clears the hash when called without a value', () => {
    const { result } = renderHook(() => useHashParam('overview'));

    act(() => result.current[1]('details'));
    act(() => result.current[1]());

    expect(window.location.hash).toBe('');
    expect(result.current[0]).toBe('overview');
  });

  it('clears the hash when called with an empty string', () => {
    const { result } = renderHook(() => useHashParam('overview'));

    act(() => result.current[1]('details'));
    act(() => result.current[1](''));

    expect(window.location.hash).toBe('');
    expect(result.current[0]).toBe('overview');
  });

  it('encodes special characters', () => {
    const { result } = renderHook(() => useHashParam());

    act(() => result.current[1]('a b/c'));

    expect(window.location.hash).toBe(`#${encodeURIComponent('a b/c')}`);
    expect(result.current[0]).toBe('a b/c');
  });

  it('falls back to the raw hash when it is not decodable', () => {
    act(() => setHash('%E0%A4%A'));
    const { result } = renderHook(() => useHashParam());
    expect(result.current[0]).toBe('%E0%A4%A');
  });

  it('re-reads the hash on popstate (history API navigations)', () => {
    const { result } = renderHook(() => useHashParam());

    act(() => {
      window.history.replaceState(null, '', '#via-history');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current[0]).toBe('via-history');
  });

  it("replaces the current history entry with history: 'replace'", () => {
    const spy = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useHashParam());

    act(() => result.current[1]('quiet tab', { history: 'replace' }));

    expect(spy).toHaveBeenCalledWith(null, '', expect.stringMatching(/#quiet%20tab$/));
    expect(window.location.hash).toBe('#quiet%20tab');
    expect(result.current[0]).toBe('quiet tab');
    spy.mockRestore();
  });
});

describe('useHashParam: history handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears with a new history entry when asked to push', () => {
    const { result } = renderHook(() => useHashParam());
    act(() => result.current[1]('details'));
    const pushState = vi.spyOn(window.history, 'pushState');

    act(() => result.current[1](undefined, { history: 'push' }));

    expect(pushState).toHaveBeenCalledWith(null, '', window.location.pathname);
    expect(result.current[0]).toBeUndefined();
  });

  it("keeps the Pages Router's history state on History API updates", () => {
    const state = { __N: true, as: '/' };
    window.history.replaceState(state, '', window.location.pathname);
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useHashParam());

    act(() => result.current[1]('tab', { history: 'replace' }));

    expect(replaceState).toHaveBeenCalledWith(state, '', expect.stringMatching(/#tab$/));
  });

  it('passes null for any other history state', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useHashParam());

    for (const state of ['plain', { other: true }]) {
      window.history.pushState(state, '', window.location.pathname);
      act(() => result.current[1]('tab', { history: 'replace' }));
      expect(replaceState).toHaveBeenLastCalledWith(null, '', expect.stringMatching(/#tab$/));
    }
  });

  it('updates synchronously without a duplicate hashchange when pushing', () => {
    const onHashChange = vi.fn();
    window.addEventListener('hashchange', onHashChange);
    const { result } = renderHook(() => useHashParam());

    act(() => result.current[1]('sync'));

    expect(result.current[0]).toBe('sync');
    expect(onHashChange).not.toHaveBeenCalled();
    window.removeEventListener('hashchange', onHashChange);
  });

  it('emits hashchange for History API updates', () => {
    const onHashChange = vi.fn();
    window.addEventListener('hashchange', onHashChange);
    const { result } = renderHook(() => useHashParam());

    act(() => result.current[1]('quiet', { history: 'replace' }));

    expect(onHashChange).toHaveBeenCalledTimes(1);
    window.removeEventListener('hashchange', onHashChange);
  });
});
