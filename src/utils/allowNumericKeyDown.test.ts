import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { type AllowNumericKeyDownOptions, allowNumericKeyDown } from './allowNumericKeyDown';

function fireKey(
  key: string,
  modifiers: Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey'>> = {},
  options?: AllowNumericKeyDownOptions,
) {
  const preventDefault = vi.fn();
  const event = {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...modifiers,
    preventDefault,
  } as unknown as KeyboardEvent<HTMLInputElement>;
  const allowed = allowNumericKeyDown(event, options);
  // The return value mirrors whether preventDefault was called.
  expect(allowed).toBe(!preventDefault.mock.calls.length);
  return preventDefault;
}

describe('allowNumericKeyDown', () => {
  it('allows digit keys', () => {
    expect(fireKey('0')).not.toHaveBeenCalled();
    expect(fireKey('9')).not.toHaveBeenCalled();
  });

  it('blocks letters and spaces', () => {
    expect(fireKey('a')).toHaveBeenCalledOnce();
    expect(fireKey(' ')).toHaveBeenCalledOnce();
  });

  it('allows control and navigation keys', () => {
    for (const key of ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'Home', 'F5']) {
      expect(fireKey(key)).not.toHaveBeenCalled();
    }
  });

  it('allows keyboard shortcuts', () => {
    expect(fireKey('a', { ctrlKey: true })).not.toHaveBeenCalled();
    expect(fireKey('v', { metaKey: true })).not.toHaveBeenCalled();
  });

  it('respects allowDecimal', () => {
    expect(fireKey('.')).toHaveBeenCalledOnce();
    expect(fireKey('.', {}, { allowDecimal: true })).not.toHaveBeenCalled();
    expect(fireKey(',', {}, { allowDecimal: true })).not.toHaveBeenCalled();
  });

  it('respects allowNegative', () => {
    expect(fireKey('-')).toHaveBeenCalledOnce();
    expect(fireKey('-', {}, { allowNegative: true })).not.toHaveBeenCalled();
  });
  it('filters AltGr characters instead of treating them as shortcuts', () => {
    expect(fireKey('€', { ctrlKey: true, altKey: true })).toHaveBeenCalledOnce();
    expect(fireKey('5', { ctrlKey: true, altKey: true })).not.toHaveBeenCalled();
    expect(fireKey('a', { altKey: true })).not.toHaveBeenCalled();
  });

  it('blocks scientific-notation and sign characters by default', () => {
    expect(fireKey('e')).toHaveBeenCalledOnce();
    expect(fireKey('+')).toHaveBeenCalledOnce();
    expect(fireKey(',', {}, { allowNegative: true })).toHaveBeenCalledOnce();
  });
});
