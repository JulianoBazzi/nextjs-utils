import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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
});
