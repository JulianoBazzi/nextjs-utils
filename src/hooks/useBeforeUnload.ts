import { useEffect, useRef } from 'react';

/**
 * Ask the browser to confirm before the user leaves the page (close, reload,
 * or external navigation) while `enabled` is `true`. Typical use: warn about
 * unsaved form changes. The listener is removed automatically when `enabled`
 * turns `false` or the component unmounts.
 *
 * Note: modern browsers show a generic confirmation dialog and ignore custom
 * messages; `message` exists for the few environments that still honor it.
 * Client-side route changes (`next/link`) do not fire `beforeunload`.
 *
 * @param enabled - register the confirmation while `true`
 * @param message - legacy custom message (ignored by most browsers)
 */
export function useBeforeUnload(enabled: boolean, message?: string): void {
  const messageRef = useRef(message);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by older Chrome/Edge to actually show the dialog.
      event.returnValue = messageRef.current ?? '';
      return messageRef.current;
    };

    window.addEventListener('beforeunload', handler);

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [enabled]);
}
