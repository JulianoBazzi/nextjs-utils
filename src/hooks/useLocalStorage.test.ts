import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns the initial value when the key is absent', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    expect(result.current[0]).toBe(0);
  });

  it('reads an existing value from storage', () => {
    window.localStorage.setItem('name', JSON.stringify('bazzi'));
    const { result } = renderHook(() => useLocalStorage('name', ''));
    expect(result.current[0]).toBe('bazzi');
  });

  it('persists updates and supports updater functions', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(window.localStorage.getItem('count')).toBe('5');

    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(6);
  });

  it('removes the key and falls back to initial value', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => result.current[1](9));
    expect(result.current[0]).toBe(9);

    act(() => result.current[2]());
    expect(result.current[0]).toBe(0);
    expect(window.localStorage.getItem('count')).toBeNull();
  });

  it('re-reads storage for plain local-storage events', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    window.localStorage.setItem('count', '7');

    act(() => {
      window.dispatchEvent(new Event('local-storage'));
    });

    expect(result.current[0]).toBe(7);
  });

  it('re-reads storage when a storage event clears every key', () => {
    window.localStorage.setItem('count', '7');
    const { result } = renderHook(() => useLocalStorage('count', 0));
    expect(result.current[0]).toBe(7);

    window.localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });

    expect(result.current[0]).toBe(0);
  });

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    window.localStorage.setItem('count', '7');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other' }));
    });

    expect(result.current[0]).toBe(0);
  });

  it('falls back to the initial value for malformed stored values', () => {
    window.localStorage.setItem('count', '{bad');
    const { result } = renderHook(() => useLocalStorage('count', 0));
    expect(result.current[0]).toBe(0);
  });

  it('handles object values', () => {
    const { result } = renderHook(() => useLocalStorage('user', { id: 1 }));
    act(() => result.current[1]({ id: 2 }));
    expect(result.current[0]).toEqual({ id: 2 });
  });
});
