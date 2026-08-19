import type { KeyboardEvent } from 'react';

export interface AllowNumericKeyDownOptions {
  /** Allow the decimal separators `.` and `,`. */
  allowDecimal?: boolean;
  /** Allow the minus sign `-`. */
  allowNegative?: boolean;
}

/**
 * `onKeyDown` handler that restricts an `<input>` to numeric typing by calling
 * `preventDefault()` on non-numeric character keys.
 *
 * Control and navigation keys (Backspace, Tab, Enter, Delete, arrows, Home, End,
 * F-keys, …) and keyboard shortcuts (Ctrl/Cmd/Alt + key, e.g. copy/paste) always
 * pass through. AltGr combinations (reported as Ctrl+Alt on Windows/Linux) are
 * filtered like plain keys.
 *
 * This is a typing convenience, not validation: paste, drag-and-drop, IME
 * composition, autofill and programmatic changes bypass `keydown` entirely, and
 * repeated separators (`1.2.3`) are not prevented. Always validate the value in
 * `onChange`/on submit.
 *
 * @returns `true` when the key was allowed, `false` when it was prevented
 * @example <input onKeyDown={allowNumericKeyDown} />
 * @example <input onKeyDown={(e) => allowNumericKeyDown(e, { allowDecimal: true })} />
 */
export function allowNumericKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  options: AllowNumericKeyDownOptions = {},
): boolean {
  // AltGr shows up as Ctrl+Alt and produces regular characters, so it is not a shortcut.
  const isAltGr = event.ctrlKey && event.altKey;
  const isShortcut = !isAltGr && (event.ctrlKey || event.metaKey || event.altKey);

  // Control/navigation keys report multi-character `key` values; shortcuts carry
  // a modifier. Let both through untouched.
  if (event.key.length > 1 || isShortcut) {
    return true;
  }

  if (/\d/.test(event.key)) {
    return true;
  }
  if (options.allowDecimal && (event.key === '.' || event.key === ',')) {
    return true;
  }
  if (options.allowNegative && event.key === '-') {
    return true;
  }

  event.preventDefault();
  return false;
}
