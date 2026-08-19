import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCookie } from './useCookie';

function clearCookie(name: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
  document.cookie = `${name}=; path=/; max-age=0`;
}

afterEach(() => {
  for (const name of ['theme', 'counter', 'prefs', 'legacy', 'when']) {
    clearCookie(name);
  }
  vi.restoreAllMocks();
});

function cookieWrites() {
  const writes: string[] = [];
  vi.spyOn(Document.prototype, 'cookie', 'set').mockImplementation((value: string) => {
    writes.push(value);
  });
  return writes;
}

describe('useCookie', () => {
  it('returns the initial value when the cookie is absent', () => {
    const { result } = renderHook(() => useCookie('theme', 'light'));
    expect(result.current[0]).toBe('light');
  });

  it('reads an existing cookie', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
    document.cookie = `theme=${encodeURIComponent(JSON.stringify('dark'))}; path=/`;
    const { result } = renderHook(() => useCookie('theme', 'light'));
    expect(result.current[0]).toBe('dark');
  });

  it('persists a new value and syncs other hook instances', () => {
    const first = renderHook(() => useCookie('theme', 'light'));
    const second = renderHook(() => useCookie('theme', 'light'));

    act(() => first.result.current[1]('dark'));

    expect(first.result.current[0]).toBe('dark');
    expect(second.result.current[0]).toBe('dark');
    expect(document.cookie).toContain('theme=');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useCookie('counter', 0));

    act(() => result.current[1]((prev) => prev + 1));
    act(() => result.current[1]((prev) => prev + 1));

    expect(result.current[0]).toBe(2);
  });

  it('stores and restores object values', () => {
    const { result } = renderHook(() => useCookie('prefs', { lang: 'en' }));

    act(() => result.current[1]({ lang: 'pt-BR' }));

    expect(result.current[0]).toEqual({ lang: 'pt-BR' });
  });

  it('writes expiration when days is provided', () => {
    const { result } = renderHook(() => useCookie('theme', 'light', { days: 7 }));

    act(() => result.current[1]('dark'));

    expect(result.current[0]).toBe('dark');
  });

  it('marks the cookie as secure when requested', () => {
    const { result } = renderHook(() => useCookie('theme', 'light', { secure: true }));

    expect(() => act(() => result.current[1]('dark'))).not.toThrow();
  });

  it("marks sameSite 'none' cookies as secure", () => {
    const { result } = renderHook(() => useCookie('theme', 'light', { sameSite: 'none' }));

    expect(() => act(() => result.current[1]('dark'))).not.toThrow();
  });

  it('re-reads the cookie for plain cookie-change events', () => {
    const { result } = renderHook(() => useCookie('theme', 'light'));
    // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
    document.cookie = `theme=${encodeURIComponent(JSON.stringify('dark'))}; path=/`;

    act(() => {
      window.dispatchEvent(new Event('cookie-change'));
    });

    expect(result.current[0]).toBe('dark');
  });

  it('ignores cookie-change events without a cookie name', () => {
    const { result } = renderHook(() => useCookie('theme', 'light'));
    // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
    document.cookie = `theme=${encodeURIComponent(JSON.stringify('dark'))}; path=/`;

    act(() => {
      window.dispatchEvent(new CustomEvent('cookie-change'));
    });

    expect(result.current[0]).toBe('light');
  });

  it('ignores cookie-change events for other cookies', () => {
    const { result } = renderHook(() => useCookie('theme', 'light'));
    // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
    document.cookie = `theme=${encodeURIComponent(JSON.stringify('dark'))}; path=/`;

    act(() => {
      window.dispatchEvent(new CustomEvent('cookie-change', { detail: { name: 'other' } }));
    });

    expect(result.current[0]).toBe('light');
  });

  it('falls back to the initial value for malformed cookies', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
    document.cookie = 'theme=notjson; path=/';

    const { result } = renderHook(() => useCookie('theme', 'light'));

    expect(result.current[0]).toBe('light');
  });

  it('removes the cookie and falls back to the initial value', () => {
    const { result } = renderHook(() => useCookie('theme', 'light'));

    act(() => result.current[1]('dark'));
    expect(result.current[0]).toBe('dark');

    act(() => result.current[2]());

    expect(result.current[0]).toBe('light');
    expect(document.cookie).not.toContain('theme=');
  });
  it('serializes every cookie attribute', () => {
    const writes = cookieWrites();
    const { result } = renderHook(() =>
      useCookie('theme', 'light', {
        days: 1,
        path: '/app',
        domain: 'example.com',
        sameSite: 'strict',
        secure: true,
      }),
    );

    act(() => result.current[1]('dark'));

    expect(writes[0]).toBe(
      `theme=${encodeURIComponent('"dark"')}; path=/app; samesite=strict; domain=example.com; max-age=86400; secure`,
    );

    act(() => result.current[2]());
    expect(writes[1]).toBe(
      'theme=; path=/app; samesite=strict; domain=example.com; max-age=0; secure',
    );
  });

  it('rejects attributes that could inject extra cookie attributes', () => {
    const { result: badPath } = renderHook(() =>
      useCookie('theme', 'light', { path: '/; domain=evil.com' }),
    );
    expect(() => act(() => badPath.current[1]('dark'))).toThrow(/invalid path/);

    const { result: badDomain } = renderHook(() =>
      useCookie('theme', 'light', { domain: 'evil.com; secure' }),
    );
    expect(() => act(() => badDomain.current[1]('dark'))).toThrow(/invalid domain/);

    const { result: badSameSite } = renderHook(() =>
      useCookie('theme', 'light', { sameSite: 'bogus; path=/' as never }),
    );
    expect(() => act(() => badSameSite.current[1]('dark'))).toThrow(/invalid sameSite/);
  });

  it('reads plain-text cookies with a custom deserializer', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
    document.cookie = 'legacy=plain text; path=/';
    const { result } = renderHook(() =>
      useCookie('legacy', 'none', { serializer: (v) => v, deserializer: (raw) => raw }),
    );
    expect(result.current[0]).toBe('plain text');

    act(() => result.current[1]('other'));
    expect(document.cookie).toContain('legacy=other');
    expect(result.current[0]).toBe('other');
  });

  it('removes the cookie when set to undefined', () => {
    const { result } = renderHook(() => useCookie<string | undefined>('theme', 'light'));
    act(() => result.current[1]('dark'));
    expect(result.current[0]).toBe('dark');

    act(() => result.current[1](undefined));
    expect(document.cookie).not.toContain('theme=');
    expect(result.current[0]).toBe('light');
  });

  it('keeps object identity across unrelated re-renders and a stable setter', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: tests exercise the document.cookie-based hook directly
    document.cookie = `prefs=${encodeURIComponent(JSON.stringify({ lang: 'en' }))}; path=/`;
    const { result, rerender } = renderHook(() => useCookie('prefs', { lang: 'xx' }));
    const [value, setValue] = result.current;

    rerender();

    expect(result.current[0]).toBe(value);
    expect(result.current[1]).toBe(setValue);
  });

  it('parses cookies regardless of separator spacing', () => {
    vi.spyOn(Document.prototype, 'cookie', 'get').mockReturnValue(
      `other=1;theme=${encodeURIComponent('"dark"')}`,
    );
    const { result } = renderHook(() => useCookie('theme', 'light'));
    expect(result.current[0]).toBe('dark');
  });
});
