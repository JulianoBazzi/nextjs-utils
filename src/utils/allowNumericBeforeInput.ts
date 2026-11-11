import type { AllowNumericKeyDownOptions } from './allowNumericKeyDown';

/** The parts of a `beforeinput` event this handler reads — React's or the native one. */
export interface BeforeInputEventLike {
  /** Text about to be inserted; `null`/absent for deletions and formatting. */
  data?: string | null;
  currentTarget: EventTarget | null;
  preventDefault(): void;
}

function numericPattern({ allowDecimal, allowNegative }: AllowNumericKeyDownOptions): RegExp {
  const sign = allowNegative ? '-?' : '';
  const fraction = allowDecimal ? '(?:[.,]\\d*)?' : '';
  return new RegExp(`^${sign}\\d*${fraction}$`);
}

/**
 * `beforeinput` handler that keeps an `<input>`/`<textarea>` numeric by
 * checking the value the insertion would produce — so, unlike
 * `allowNumericKeyDown`, it also covers virtual keyboards, paste and
 * drag-and-drop, and rejects a second separator (`1.2,3`) or a minus sign
 * anywhere but the start (`12-3`). Deletions always pass.
 *
 * Use it with `type="text"` (plus `inputMode="numeric"` / `"decimal"`):
 * `type="number"` hides the selection and partial values such as `"1."`.
 * React's `onBeforeInput` is built on `textInput`/`keypress`, which some
 * browsers don't fire for paste; to cover paste everywhere, attach it to the
 * native `beforeinput` event (e.g. with `useEventListener`). Always validate
 * on submit as well.
 *
 * @returns `true` when the insertion was allowed, `false` when it was prevented
 * @example <input inputMode="decimal" onBeforeInput={(e) => allowNumericBeforeInput(e, { allowDecimal: true })} />
 */
export function allowNumericBeforeInput(
  event: BeforeInputEventLike,
  options: AllowNumericKeyDownOptions = {},
): boolean {
  const { data, currentTarget: field } = event;
  if (
    data == null ||
    !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
  ) {
    return true;
  }

  const { value } = field;
  const start = field.selectionStart ?? value.length;
  const end = field.selectionEnd ?? value.length;
  const next = value.slice(0, start) + data + value.slice(end);

  if (numericPattern(options).test(next)) {
    return true;
  }

  event.preventDefault();
  return false;
}
