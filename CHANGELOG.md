# Changelog

Notes for 1.0.0–1.0.4 are on the
[GitHub releases page](https://github.com/JulianoBazzi/nextjs-utils/releases).

## 1.1.0

This release adds Pages Router support and server-free (`shallow`) URL updates
to the Next.js hooks, 11 new hooks, and a round of fixes. No export was removed;
a few behaviors changed, listed under **Upgrading** below.

### Highlights

- **Pages Router support.** The `/next` URL hooks now work in the Pages Router
  too. The router is detected automatically through `next/compat/router`, and
  nothing is written to the URL before `router.isReady`.
- **`shallow` URL updates.** A new `shallow` option on every URL-writing hook
  updates the URL without re-rendering the page on the server. The Pages Router
  uses shallow routing (`getServerSideProps` doesn't run); the App Router uses the
  History API (Next.js 14.1+).
- **Consecutive updates compose.** Updates made in the same handler, even from
  different hooks (`toggleSort('name'); setPage(1)`), now build on each other
  instead of overwriting each other.
- **Correct types for CommonJS consumers.** `require` now resolves its own
  `.d.cts` declarations, so CJS projects no longer get ESM types.

### New hooks

Root entry (`@julianobazzi/nextjs-utils`):

- `useLatestRequest` — keep only the latest of overlapping async requests
  (`AbortSignal` + `isCurrent()`), aborting on unmount.
- `useDistinctTrigger` — run a lookup (e.g. postal code) only when its input
  really changed.
- `useInfiniteScroll` — `IntersectionObserver` sentinel that calls `onLoadMore`.
- `useRefreshKey` — a counter `key` that remounts a subtree on demand.
- `useServiceWorkerUpdate` — react to a new service worker taking control.
- `useReloadWhen` — defer a page reload until `canReload()` allows it.
- `useDailyAt` — run a callback every day at a local time, catching up after sleep.
- `allowNumericBeforeInput` (utility) — a `beforeinput` handler that checks the
  resulting value, covering virtual keyboards, paste, repeated separators and
  misplaced minus signs.

Next.js entry (`@julianobazzi/nextjs-utils/next`):

- `useSearchParamState` — `useState` backed by one URL param, with
  `parse`/`serialize`, functional updates and `shallow`.
- `createRouteProgress` — navigation state for a top progress bar in both
  routers (`onRouterTransitionStart` in the App Router, Next.js 15.3+).
- `useRouterEvent` — Pages Router events with automatic cleanup.
- `useStaleBuildReload` + `isStaleBuildNavigationError` — reload when the page
  fails to load code from an outdated build after a deploy, with a loop guard.

### New options

URL hooks (`/next`):

- `shallow` on `useUpdateQueryParams`, `useUpdateSearchParam`,
  `useFilterQueryParams`, `usePaginationParams` and `useSortParams`.
- `useUpdateQueryParams`: `skipUnchanged`, `preserveHash`; `Date` values are
  written as ISO strings.
- `useFilterQueryParams`: `searchKey`, `resetKeys`, `history`, `scroll`,
  `preserveHash`; `initialSearch` accepts `null` (as sent by
  `getServerSideProps`).
- `useSortParams`: `allowedSorts`, `resetKeys`.
- `usePaginationParams`: `maxPageSize`, `lastPage`.
- `useUpdateSearchParam`: `trim`.
- `useHashParam`: the setter takes `{ history: 'push' | 'replace' }`.

Root entry:

- `useCookie`: `domain`, `maxAge`, `secure: 'auto'`, `serializer` /
  `deserializer` (e.g. `(raw) => raw` for plain-text cookies).
- `useLocalStorage`: `serializer` / `deserializer`, `onError`.
- `useBroadcastChannel`: `validate` (type guard for incoming messages), `onError`.
- `useEventListener`: listener options (`capture`, `once`, `passive`,
  `enabled`); `document` and any `EventTarget` as targets.
- `useDebounce` / `useThrottle`: `cancel()` / `flush()` on the returned
  function, `flushOnUnmount`; `onChange` for the debounced value (never called
  for the initial value).
- `useHistoryState`: `reset()`.
- `useMediaQuery`: `defaultValue` for the server and hydration.

### Fixes

- `useFilterQueryParams` navigated twice on mount when `initialSearch` was set.
  It now waits for the seed and navigates once.
- `useFilterQueryParams` always wrote its search key, wiping another
  component's `?search=`. It now only writes it when it manages a search.
- Updates in the same handler overwrote each other (see Highlights).
- `useLocalStorage` / `useCookie` returned a new object on every render, which
  could loop `useEffect`s. Storage errors (private mode, full quota) no longer throw.
- `useCookie`: cookies written without a space after `;` were not found; changes
  from other tabs are now picked up (Cookie Store API, or on focus/visibility).
- `useHashParam`: a malformed hash (`#%E0%A4%A`) crashed the render; it now
  updates on `popstate`, keeps the Pages Router's history state, and no longer
  emits a duplicate `hashchange` when setting a value.
- `usePaginationParams`: page and page size are parsed strictly (`'3abc'`,
  `'1e9'` and `'2.5'` are rejected); `setPage` ignores invalid numbers.
- `useUpdateQueryParams`: `NaN` / `Infinity` were written as text; they now
  delete the param.
- `useUpdateSearchParam`: duplicated entries (`?search=a&search=a`) are collapsed.
- `useActiveRoute`: an empty, query-only or hash-only `href` is never active.
- `useIdle`: no longer sets state on every activity event.
- `allowNumericKeyDown`: AltGr characters are filtered like plain keys.
- `createCan`: `<Can>` always returns an element, so it type-checks with older
  `@types/react` 18.
- `useDebounce` / `useThrottle`: the latest callback is stored after commit
  instead of during render.
- `useEventListener`: the latest handler is in place as soon as an update
  commits, so an event fired right after it never reaches the old handler.

### Packaging

- `exports` now has separate `types` for `import` (`.d.ts`) and `require`
  (`.d.cts`), and exposes `./package.json`. Checked with
  `@arethetypeswrong/cli`.
- `'use client'` is emitted through the bundler banner, so sourcemaps line up
  and each file has a single `sourceMappingURL`.
- The `next/compat/router` import is rewritten for native Node ESM, like
  `next/navigation`.
- Peer dependencies: `react` `^18.0.0 || ^19.0.0`; `react-dom` removed (never
  imported); `next` is optional for root-entry-only use. `engines.node` is `>=18`.

### Upgrading

Most apps need no changes. Check these if you rely on the old behavior:

- **`useFilterQueryParams`** skips syncs that would not change the URL. It also
  stops writing the search key when you pass none of `search`, `setSearch` or
  `initialSearch`.
- **`useCookie`** throws on a `path`, `sameSite` or `domain` that could inject
  extra cookie attributes (e.g. `path: '/; domain=evil.com'`).
- **`usePaginationParams`** falls back to the default for malformed values
  (`?page=3abc` is page 1, not 3).
- **`useUpdateQueryParams`** deletes the param for `NaN` / `Infinity` instead of
  writing `"NaN"`.
- **`allowNumericKeyDown`** returns a `boolean` (was `void`) and blocks
  AltGr-typed characters.
- **`useHashParam`** fires only the browser's own `hashchange` when setting a
  value, not an extra synthetic one.
- **Peer dependencies:** React 20 is outside the declared range, and `react-dom`
  is no longer a peer.
