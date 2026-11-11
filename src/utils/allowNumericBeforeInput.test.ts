import { describe, expect, it, vi } from 'vitest';
import { allowNumericBeforeInput } from './allowNumericBeforeInput';
import type { AllowNumericKeyDownOptions } from './allowNumericKeyDown';

function field(value: string, selection?: [number, number], tag: 'input' | 'textarea' = 'input') {
  const element = document.createElement(tag);
  element.value = value;
  const [start, end] = selection ?? [value.length, value.length];
  element.setSelectionRange(start, end);
  return element;
}

function insert(
  target: EventTarget | null,
  data: string | null | undefined,
  options?: AllowNumericKeyDownOptions,
) {
  const preventDefault = vi.fn();
  const allowed = allowNumericBeforeInput({ data, currentTarget: target, preventDefault }, options);
  expect(preventDefault).toHaveBeenCalledTimes(allowed ? 0 : 1);
  return allowed;
}

describe('allowNumericBeforeInput', () => {
  it('allows digits and blocks other characters', () => {
    expect(insert(field('12'), '3')).toBe(true);
    expect(insert(field('12'), 'a')).toBe(false);
  });

  it('checks pasted text as a whole, replacing the selection', () => {
    expect(insert(field('1234', [1, 3]), '99')).toBe(true);
    expect(insert(field('1234', [1, 3]), '9a')).toBe(false);
  });

  it('allows a single decimal separator only with allowDecimal', () => {
    expect(insert(field('1'), '.')).toBe(false);
    expect(insert(field('1'), ',', { allowDecimal: true })).toBe(true);
    expect(insert(field('1.2'), ',', { allowDecimal: true })).toBe(false);
  });

  it('allows the minus sign only at the start with allowNegative', () => {
    expect(insert(field('12', [0, 0]), '-')).toBe(false);
    expect(insert(field('12', [0, 0]), '-', { allowNegative: true })).toBe(true);
    expect(insert(field('12'), '-', { allowNegative: true })).toBe(false);
  });

  it('lets deletions and formatting (no data) through', () => {
    expect(insert(field('12'), null)).toBe(true);
    expect(insert(field('12'), undefined)).toBe(true);
  });

  it('ignores targets that are not text fields', () => {
    expect(insert(document.createElement('div'), 'a')).toBe(true);
    expect(insert(null, 'a')).toBe(true);
  });

  it('works on textareas', () => {
    expect(insert(field('1', undefined, 'textarea'), 'x')).toBe(false);
  });

  it('appends at the end when the field exposes no selection', () => {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = '12';
    expect(input.selectionStart).toBeNull();
    expect(insert(input, '3')).toBe(true);
  });
});
