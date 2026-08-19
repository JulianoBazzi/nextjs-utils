import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
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

  it('treats a stored null as a value, not as absence', () => {
    window.localStorage.setItem('maybe', 'null');
    const { result } = renderHook(() => useLocalStorage<number | null>('maybe', 1));
    expect(result.current[0]).toBeNull();

    act(() => result.current[1]((prev) => (prev === null ? 2 : 3)));
    expect(result.current[0]).toBe(2);
  });

  it('handles object values', () => {
    const { result } = renderHook(() => useLocalStorage('user', { id: 1 }));
    act(() => result.current[1]({ id: 2 }));
    expect(result.current[0]).toEqual({ id: 2 });
  });
  it('ignores storage events from other storage areas', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    window.localStorage.setItem('count', '7');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'count', storageArea: window.sessionStorage }),
      );
    });
    expect(result.current[0]).toBe(0);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'count', storageArea: window.localStorage }),
      );
    });
    expect(result.current[0]).toBe(7);
  });

  it('keeps object identity across unrelated re-renders and a stable setter', () => {
    window.localStorage.setItem('user', JSON.stringify({ id: 1 }));
    const { result, rerender } = renderHook(() => useLocalStorage('user', { id: 0 }));
    const [value, setValue] = result.current;

    rerender();

    expect(result.current[0]).toBe(value);
    expect(result.current[1]).toBe(setValue);
  });

  it('removes the key when set to undefined', () => {
    const { result } = renderHook(() => useLocalStorage<string | undefined>('name', 'x'));
    act(() => result.current[1]('y'));
    expect(window.localStorage.getItem('name')).toBe('"y"');

    act(() => result.current[1](undefined));
    expect(window.localStorage.getItem('name')).toBeNull();
    expect(result.current[0]).toBe('x');
  });

  it('supports custom serializer and deserializer', () => {
    const { result } = renderHook(() =>
      useLocalStorage('when', new Date(0), {
        serializer: (d) => String(d.getTime()),
        deserializer: (raw) => new Date(Number(raw)),
      }),
    );

    act(() => result.current[1](new Date(1000)));

    expect(window.localStorage.getItem('when')).toBe('1000');
    expect(result.current[0].getTime()).toBe(1000);
  });

  it('reports deserialization errors through onError', () => {
    const onError = vi.fn();
    window.localStorage.setItem('count', '{bad');
    const { result } = renderHook(() => useLocalStorage('count', 0, { onError }));
    expect(result.current[0]).toBe(0);
    expect(onError).toHaveBeenCalledWith(expect.any(SyntaxError));
  });

  it('survives a storage that throws on read and write', () => {
    const error = new DOMException('blocked', 'SecurityError');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw error;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw error;
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useLocalStorage('count', 0, { onError }));
    expect(result.current[0]).toBe(0);
    expect(onError).toHaveBeenCalledWith(error);

    onError.mockClear();
    act(() => result.current[1](1));
    expect(result.current[0]).toBe(0);
    expect(onError).toHaveBeenCalledWith(error);

    onError.mockClear();
    act(() => result.current[2]());
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('stays silent when storage throws and no onError is given', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useLocalStorage('count', 0));
    expect(result.current[0]).toBe(0);
    expect(() => act(() => result.current[1](1))).not.toThrow();
    expect(() => act(() => result.current[2]())).not.toThrow();
  });
});
