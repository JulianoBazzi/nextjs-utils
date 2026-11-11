// Full-page navigations, isolated so hooks can be tested with `vi.mock`:
// jsdom cannot navigate (it only logs "Not implemented"), and
// `window.location.reload` is non-configurable, so it cannot be spied on.

/* v8 ignore start */
export function reloadPage(): void {
  window.location.reload();
}

export function navigateTo(url: string): void {
  window.location.assign(url);
}
/* v8 ignore stop */
