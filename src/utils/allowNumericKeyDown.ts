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
 * pass through.
 *
 * @example <input onKeyDown={allowNumericKeyDown} />
 * @example <input onKeyDown={(e) => allowNumericKeyDown(e, { allowDecimal: true })} />
 */
export function allowNumericKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  options: AllowNumericKeyDownOptions = {},
): void {
  // Control/navigation keys report multi-character `key` values; shortcuts carry
  // a modifier. Let both through untouched.
  if (event.key.length > 1 || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (/\d/.test(event.key)) {
    return;
  }
  if (options.allowDecimal && (event.key === '.' || event.key === ',')) {
    return;
  }
  if (options.allowNegative && event.key === '-') {
    return;
  }

  event.preventDefault();
}
