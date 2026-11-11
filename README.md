# @julianobazzi/nextjs-utils

<a href="https://www.npmjs.com/package/@julianobazzi/nextjs-utils">
  <img alt="npm version" src="https://img.shields.io/npm/v/@julianobazzi/nextjs-utils?color=01579b&style=for-the-badge&logo=npm">
</a>
<a href="https://www.npmjs.com/package/@julianobazzi/nextjs-utils">
  <img alt="npm downloads" src="https://img.shields.io/npm/dm/@julianobazzi/nextjs-utils?color=01579b&style=for-the-badge">
</a>
<a href="https://github.com/JulianoBazzi">
  <img alt="Author Juliano Bazzi" src="https://img.shields.io/badge/author-Juliano%20Bazzi-%23ffb84d?color=01579b&style=for-the-badge">
</a>
<a href="https://github.com/JulianoBazzi/nextjs-utils/blob/master/LICENSE">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-%2304D361?color=01579b&style=for-the-badge">
</a>

**English** | [Português](README.pt-br.md)

A collection of reusable hooks and utilities for **Next.js (App Router and Pages Router)**, written in TypeScript.

**Built for Next.js, compatible with React 18 and 19.** Client hooks ship with the
`'use client'` directive already applied, so you can import them directly into Server
Components without writing a wrapper. `react` and `next` are peer dependencies
(`next` is optional if you only use the root entry), so the library always uses your
app's own copies.

## Installation

```bash
pnpm add @julianobazzi/nextjs-utils
# or
npm install @julianobazzi/nextjs-utils
# or
yarn add @julianobazzi/nextjs-utils
```

Requires React 18 or 19 and, for the `/next` hooks, Next.js 14+ (App Router or Pages
Router). `shallow` URL updates in the App Router need Next.js 14.1+, and
`createRouteProgress` in the App Router needs Next.js 15.3+.

## Hooks

| Hook | Description |
| --- | --- |
| `useToggle` | Boolean state with a toggle and explicit setter |
| `usePrevious` | The value from the previous render |
| `useDebounce` | A debounced copy of a fast-changing value, or a debounced callback |
| `useThrottle` | A throttled copy of a fast-changing value, or a throttled callback |
| `useLocalStorage` | State persisted in `localStorage`, synced across tabs |
| `useCookie` | State persisted in a cookie, synced across components and tabs |
| `useMediaQuery` | Reactively track a CSS media query (SSR-safe) |
| `useEventListener` | Attach a window/document/element event listener with cleanup |
| `useInterval` | Run a callback on an interval (pausable with `null`) |
| `useOnlineStatus` | Track the browser connectivity status (SSR-safe) |
| `usePageVisibility` | Track whether the tab is visible (SSR-safe) |
| `useIdle` | Detect when the user has been inactive for a while |
| `useBeforeUnload` | Confirm before leaving the page (unsaved changes) |
| `useBroadcastChannel` | Send/receive messages between tabs of the same origin |
| `useHistoryState` | State with undo/redo history |
| `useLatestRequest` | Keep only the latest of overlapping async requests |
| `useDistinctTrigger` | Run a lookup only when its input really changed |
| `useInfiniteScroll` | Load more items when a sentinel scrolls into view |
| `useRefreshKey` | A counter `key` that remounts a subtree on demand |
| `useServiceWorkerUpdate` | React when a new service worker takes control |
| `useReloadWhen` | Defer a page reload until it is safe |
| `useDailyAt` | Run a callback every day at a given local time |
| `createCan` | Build a role-based access control pair (`useCan` + `Can`) |

### Next.js hooks (subpath `@julianobazzi/nextjs-utils/next`)

| Hook | Description |
| --- | --- |
| `useSearchParam` | Read a typed query string param |
| `useSearchParamState` | `useState` backed by one URL search param |
| `useUpdateQueryParams` | Write multiple URL search params from an object |
| `useUpdateSearchParam` | Write a single URL search param |
| `useFilterQueryParams` | Sync a filter form's state to the URL |
| `usePaginationParams` | Pagination state (`page`/`pageSize`) stored in the URL |
| `useSortParams` | Table sorting state stored in the URL |
| `useActiveRoute` | Whether the current route matches a link (active nav item) |
| `useHashParam` | Read/write the URL `#hash` fragment (SSR-safe) |
| `createRouteProgress` | Navigation state for a top progress bar, in both routers |
| `useRouterEvent` | Subscribe to a Pages Router event |
| `useStaleBuildReload` | Reload when the page runs code from an outdated build |

## Utilities

| Utility | Description |
| --- | --- |
| `allowNumericBeforeInput` | `beforeinput` handler keeping an input numeric (paste, virtual keyboards) |
| `allowNumericKeyDown` | `onKeyDown` handler restricting typing to numbers (physical keyboards) |
| `isStaleBuildNavigationError` | Whether an error comes from an outdated build (`/next`) |

## Usage

### `useToggle`

```tsx
import { useToggle } from '@julianobazzi/nextjs-utils';

const [isOpen, toggle, setOpen] = useToggle(false);
// toggle()        -> flips the value
// setOpen(true)   -> sets an explicit value
```

### `usePrevious`

```tsx
import { usePrevious } from '@julianobazzi/nextjs-utils';

const previousCount = usePrevious(count);
```

### `useDebounce`

```tsx
import { useDebounce } from '@julianobazzi/nextjs-utils';

// Value form — returns the value after it stops changing
const debouncedSearch = useDebounce(search, 300);

// `onChange` fires when the debounced value changes — never for the initial
// value, so no "first render" guard is needed
useDebounce(search, 300, { onChange: (value) => onSearch(value) });

// Function form — returns a stable debounced callback
const debouncedSave = useDebounce((value: string) => save(value), 300);
debouncedSave('hello');
debouncedSave.flush();  // run the pending call now
debouncedSave.cancel(); // drop it

// Autosave: run the pending call on unmount instead of dropping it
const autosave = useDebounce(saveDraft, 800, { flushOnUnmount: true });
```

### `useThrottle`

```tsx
import { useThrottle } from '@julianobazzi/nextjs-utils';

// Value form — updates at most once per interval, settling on the latest value
const throttledScroll = useThrottle(scrollY, 200);

// Function form — leading call runs immediately, extra calls collapse into one
// trailing call; also exposes flush()/cancel() and accepts { flushOnUnmount }
const throttledTrack = useThrottle((position: number) => track(position), 200);
```

### `useLocalStorage`

```tsx
import { useLocalStorage } from '@julianobazzi/nextjs-utils';

const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
setTheme('dark');
setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
```

Object values keep their identity until the stored value changes, so they are safe
in effect dependencies. Options:

- `serializer` / `deserializer` — custom (de)serialization (default JSON). Validate
  untrusted data in the deserializer; throwing falls back to `initialValue`.
- `onError(error)` — called when storage is unavailable (private mode, sandboxed
  iframe), full, or holds an unreadable value. The hook never throws.

### `useCookie`

Like `useLocalStorage`, backed by a cookie. Changes from other tabs or from the
server are picked up through the Cookie Store API where supported, and otherwise
when the tab regains focus or visibility.

```tsx
import { useCookie } from '@julianobazzi/nextjs-utils';

const [consent, setConsent, removeConsent] = useCookie('consent', 'pending', { days: 365 });
setConsent('accepted');

// Plain-text cookie written by the server (not JSON)
const [store] = useCookie('store', '', { deserializer: (raw) => raw });
```

Options: `days` or `maxAge` (seconds, takes precedence) — omit both for a session
cookie; `path` (default `'/'`); `domain`; `sameSite` (default `'lax'`); `secure`
(`true`, `false` or `'auto'` = only on HTTPS pages; default `false`);
`serializer` / `deserializer`. Cookies written from JavaScript are never `HttpOnly`:
don't store tokens or secrets in them.

### `useMediaQuery`

```tsx
import { useMediaQuery } from '@julianobazzi/nextjs-utils';

const isDesktop = useMediaQuery('(min-width: 1024px)');

// Mobile-first: render the mobile variant on the server and during hydration
const isMobile = useMediaQuery('(max-width: 767px)', { defaultValue: true });
```

### `useEventListener`

```tsx
import { useEventListener } from '@julianobazzi/nextjs-utils';

useEventListener('keydown', (event) => {
  if (event.key === 'Escape') close();
});

// Element or ref, listener options, and a conditional listener
useEventListener('scroll', onScroll, containerRef, { passive: true, enabled: isOpen });
useEventListener('visibilitychange', onVisibility, document);
```

The target may be `window` (default), `document`, an element, a ref, or any
`EventTarget`. Options: `capture`, `once`, `passive`, `enabled` (default `true`).
An explicit `null` target falls back to `window`; pass a ref (`{ current: null }`)
to attach nothing until the element exists.

### `useInterval`

```tsx
import { useInterval } from '@julianobazzi/nextjs-utils';

const [count, setCount] = useState(0);
const [running, setRunning] = useState(true);

// Pass `null` as the delay to pause the interval.
useInterval(() => setCount((c) => c + 1), running ? 1000 : null);
```

### `useOnlineStatus` / `usePageVisibility`

```tsx
import { useOnlineStatus, usePageVisibility } from '@julianobazzi/nextjs-utils';

const isOnline = useOnlineStatus();   // false while the browser is offline
const isVisible = usePageVisibility(); // false while the tab is in background
```

### `useIdle`

```tsx
import { useIdle } from '@julianobazzi/nextjs-utils';

const isIdle = useIdle(5 * 60 * 1000); // true after 5 minutes without activity
```

### `useBeforeUnload`

```tsx
import { useBeforeUnload } from '@julianobazzi/nextjs-utils';

useBeforeUnload(form.isDirty); // browser confirms before closing/reloading
```

### `useBroadcastChannel`

```tsx
import { useBroadcastChannel } from '@julianobazzi/nextjs-utils';

const { postMessage } = useBroadcastChannel<'logout'>(
  'auth',
  (message) => {
    if (message === 'logout') signOut(); // fired by other tabs
  },
  { validate: (data): data is 'logout' => data === 'logout' },
);
postMessage('logout'); // notify every other tab
```

Options: `validate` (type guard; any same-origin script can post to the channel,
so messages failing it are dropped) and `onError` (non-cloneable messages).

### `useHistoryState`

```tsx
import { useHistoryState } from '@julianobazzi/nextjs-utils';

const { state, set, undo, redo, canUndo, canRedo, clear, reset } = useHistoryState('', {
  capacity: 50, // undo steps kept (default 100)
});
set('draft 1');
set('draft 2');
undo();  // -> 'draft 1'
redo();  // -> 'draft 2'
clear(); // drop the history, keep the current state
reset(); // drop the history and go back to the initial value
```

### `useLatestRequest`

Keeps only the latest of overlapping requests, so a slow, stale response never
overwrites a newer one. Every request is aborted on unmount.

```tsx
import { useLatestRequest } from '@julianobazzi/nextjs-utils';

const { start, cancel } = useLatestRequest();

async function load(id: number) {
  const request = start(); // aborts the previous request
  const data = await fetch(`/api/items/${id}`, { signal: request.signal }).then((r) => r.json());
  if (request.isCurrent()) setItem(data);
}
```

### `useDistinctTrigger`

```tsx
import { useDistinctTrigger } from '@julianobazzi/nextjs-utils';

const lookup = useDistinctTrigger<string>(); // { isEqual } is optional

async function onCepChange(cep: string) {
  if (cep.length !== 8 || !lookup.shouldRun(cep)) return; // same CEP: skip
  const address = await fetchAddress(cep);
  lookup.remember(); // remember after success, so a failure can be retried
  setAddress(address);
}
```

### `useInfiniteScroll`

```tsx
import { useInfiniteScroll } from '@julianobazzi/nextjs-utils';

const { sentinelRef } = useInfiniteScroll({
  onLoadMore: fetchNextPage,
  hasMore,
  enabled: !isLoading, // re-enabling re-checks a sentinel that is still visible
  rootMargin: '200px', // default
});

return (
  <>
    {items.map(renderItem)}
    <div ref={sentinelRef} />
  </>
);
```

### `useRefreshKey`

```tsx
import { useRefreshKey } from '@julianobazzi/nextjs-utils';

const [key, refresh] = useRefreshKey();
<CitySelect key={key} />; // refresh() remounts it (e.g. to reload its options)
```

### `useServiceWorkerUpdate` / `useReloadWhen` / `useDailyAt`

Building blocks for long-running screens (kiosks, dashboards): reload when a new
version is deployed or at a fixed time, but never while a dialog is open.

```tsx
import { useDailyAt, useReloadWhen, useServiceWorkerUpdate } from '@julianobazzi/nextjs-utils';

const { requestReload } = useReloadWhen({
  canReload: () => !document.querySelector('[role="dialog"]'),
  retryMs: 1000, // default
});

useServiceWorkerUpdate(requestReload); // ignores the very first install
useDailyAt(5, 0, requestReload);       // every day at 05:00, catches up after sleep
```

`useReloadWhen` keeps a request made while `canReload()` is `false` and retries it;
pass `reload` to replace the full page reload (e.g. with `router.refresh()`).

### `allowNumericBeforeInput` / `allowNumericKeyDown` (utilities)

`allowNumericBeforeInput` checks the value an insertion would produce, so it also
covers virtual keyboards, paste and drag-and-drop, and rejects a second separator
or a misplaced minus sign. Use it with `type="text"` and `inputMode`.

```tsx
import { allowNumericBeforeInput, allowNumericKeyDown } from '@julianobazzi/nextjs-utils';

<input
  inputMode="decimal"
  onBeforeInput={(e) => allowNumericBeforeInput(e, { allowDecimal: true })}
/>;

// Physical keyboards only: Android virtual keyboards, paste and autofill bypass it
<input onKeyDown={allowNumericKeyDown} />;
<input onKeyDown={(e) => allowNumericKeyDown(e, { allowDecimal: true, allowNegative: true })} />;
```

Both return `true` when the input was allowed. React's `onBeforeInput` is built on
`textInput`/`keypress`, which some browsers don't fire for paste; to cover paste
everywhere, attach `allowNumericBeforeInput` to the native `beforeinput` event
(e.g. with `useEventListener`). Always validate on submit as well.

### `createCan` (role-based access control)

Decoupled from any auth provider: pass a resolver that returns the current
user's role(s). You get a `useCan` hook and a `Can` guard component sharing it.

```tsx
import { createCan } from '@julianobazzi/nextjs-utils';
import { useAuth } from './auth';

// Wire your auth context once:
export const { useCan, Can } = createCan(() => useAuth().user?.role ?? null);

// Then anywhere:
const canEdit = useCan(['admin', 'editor']);

<Can allowed={['admin']} fallback={<p>Access denied</p>}>
  <AdminPanel />
</Can>;
```

- Unauthenticated (resolver returns `null`/`undefined`) → denied.
- Empty/omitted `allowed` → any authenticated user is granted.
- The resolver may return a single role or an array (multi-role RBAC).
- This only hides UI: enforce every permission again on the server.

## Next.js URL hooks

### How they write the URL

These rules apply to `useUpdateQueryParams` and every hook built on it
(`useUpdateSearchParam`, `useFilterQueryParams`, `usePaginationParams`,
`useSortParams`, `useSearchParamState`):

- **Server round-trips.** By default each write is a router navigation, which
  re-renders the page on the server (RSC in the App Router, `getServerSideProps` in
  the Pages Router). For client-only state (filters, search, pagination of data
  fetched on the client), pass **`shallow: true`**: the Pages Router uses shallow
  routing, the App Router uses the History API (Next.js 14.1+ keeps
  `useSearchParams` in sync).
- **Consecutive updates compose.** Calls made in the same tick — even from
  different hooks, e.g. `toggleSort('name'); setPage(1)` — build on each other
  instead of on the same, not-yet-updated URL.
- **Values.** `''`, `null`, `undefined`, `NaN`/`Infinity`, invalid dates and empty
  arrays delete the param. `false` and `0` are written. Dates are written as ISO
  strings. Arrays become repeated entries (`?tag=a&tag=b`).
- **Clearing.** `useUpdateQueryParams()` called with no argument removes every
  param — including `ignoredParams` — and, unless `preserveHash` is set, the hash.
- **Pages Router.** The router is detected automatically through
  `next/compat/router`. Nothing is written before `router.isReady` (until then the
  query is not known yet), and `useFilterQueryParams` waits for it before its
  first sync.
- **`<Suspense>`.** In the App Router, `useSearchParam`, `useSearchParamState`,
  `useUpdateQueryParams`, `useUpdateSearchParam`, `useFilterQueryParams`,
  `usePaginationParams` and `useSortParams` call `useSearchParams`, which requires a
  `<Suspense>` boundary on statically rendered routes. Alternatively, read the
  params on the server and pass them down (e.g. as `initialSearch`).

Shared options: `history` (`'replace'` by default, or `'push'`), `scroll` (default
`false`), `shallow` (default `false`).

### `useSearchParam`

```tsx
import { useSearchParam } from '@julianobazzi/nextjs-utils/next';

const tab = useSearchParam('tab', 'overview'); // string  (default applied)
const ref = useSearchParam('ref');             // string | null
```

### `useSearchParamState`

`useState` backed by one URL param: shareable, survives reloads, and setting an
equal value is a no-op. Keeps the `#hash`.

```tsx
import { useSearchParamState } from '@julianobazzi/nextjs-utils/next';

const [search, setSearch] = useSearchParamState('search', { shallow: true });

const [page, setPage] = useSearchParamState('page', {
  parse: (raw) => Number(raw) || 1,
  serialize: (value) => (value > 1 ? String(value) : undefined),
});
setPage((current) => current + 1);
```

### `useUpdateQueryParams` / `useUpdateSearchParam`

```tsx
import { useUpdateQueryParams, useUpdateSearchParam } from '@julianobazzi/nextjs-utils/next';

const updateQuery = useUpdateQueryParams({ shallow: true });
updateQuery({ status: 'active', tag: ['a', 'b'], page: undefined }); // ?status=active&tag=a&tag=b
updateQuery(); // clears all params

const updateSearch = useUpdateSearchParam({ trim: true }); // key 'search' by default
updateSearch('hello'); // ?search=hello   (no-op if unchanged)
```

`useUpdateQueryParams` options: `ignoredParams` (keys never written),
`skipUnchanged` (skip the navigation when the params would not change),
`preserveHash` (keep the `#hash`), plus the shared ones.
`useUpdateSearchParam` options: `key` (default `'search'`), `trim`, plus the shared
ones; an unchanged value never navigates.

### `useFilterQueryParams`

Keeps a filter form's state in sync with the URL and exposes a `handleSearch` setter.

```tsx
import { useFilterQueryParams } from '@julianobazzi/nextjs-utils/next';

// `initialSearch` usually comes from the server: a page's `searchParams` in the
// App Router, or `getServerSideProps` props (`null` when absent) in the Pages Router.
function Filters({ initialSearch }: { initialSearch: string | null }) {
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState<string>();

  const { handleSearch } = useFilterQueryParams({
    parameters: () => ({ status }),
    deps: [status],             // everything parameters()/overrides read
    search,
    setSearch,
    initialSearch,              // seeds `search`; mounting navigates only once
    searchKey: 'q',             // default 'search'
    resetKeys: ['page'],        // back to page 1 when a filter changes
    ignoredParams: ['with'],
    overrides: { with: undefined },
    shallow: true,
  });

  return <input defaultValue={initialSearch ?? ''} onChange={(e) => handleSearch(e.target.value)} />;
}
```

- The URL is re-synced whenever `deps` or `search` change; a sync that would not
  change the URL is skipped.
- The search key is only written when the hook manages a search (`search`,
  `setSearch` or `initialSearch` passed), so another component's `?search=` is
  never wiped.
- `deps` must be a fixed-length list of primitives.

### `usePaginationParams`

Pagination state in the URL. Defaults stay out of the URL (page 1 and the default
page size remove the params).

```tsx
import { usePaginationParams } from '@julianobazzi/nextjs-utils/next';

const { page, pageSize, setPage, setPageSize, reset } = usePaginationParams({
  defaultPageSize: 25,
  maxPageSize: 100,  // clamp ?pageSize= (recommended when it feeds a LIMIT)
  lastPage: totalPages, // clamp the page; leave undefined while unknown
});
setPage(3);      // ?page=3
setPageSize(50); // ?pageSize=50 (and back to page 1)
```

### `useSortParams`

```tsx
import { useSortParams } from '@julianobazzi/nextjs-utils/next';

const { sortBy, order, toggleSort, clearSort } = useSortParams({
  allowedSorts: ['name', 'createdAt'], // ignore anything else in the URL
  resetKeys: ['page'],                 // back to page 1 on every sort change
});
toggleSort('name'); // ?sortBy=name&order=asc -> desc -> cleared
```

With `defaultSort`, clearing falls back to that column, so it only alternates
between the two directions. Other options: `sortKey`, `orderKey`, `defaultOrder`.

### `useActiveRoute`

```tsx
import { useActiveRoute } from '@julianobazzi/nextjs-utils/next';

const isActive = useActiveRoute('/settings'); // true on /settings and /settings/profile
const isHome = useActiveRoute('/', { exact: true });

<Link href="/settings" data-active={isActive} />;
```

### `useHashParam`

```tsx
import { useHashParam } from '@julianobazzi/nextjs-utils/next';

const [tab, setTab] = useHashParam('overview');
setTab('billing');                         // -> #billing (new history entry), no Next.js navigation
setTab('billing', { history: 'replace' }); // rewrite the current entry instead
setTab();                                  // clears the hash
```

### `createRouteProgress`

Navigation state for a top loading bar. Create it once and share it.

```tsx
// lib/progress.ts
import { createRouteProgress } from '@julianobazzi/nextjs-utils/next';
export const progress = createRouteProgress(); // { ignoreSamePathname: true } by default

// instrumentation-client.ts (App Router, Next.js 15.3+)
import { progress } from './lib/progress';
export const { onRouterTransitionStart } = progress;

// components/TopBar.tsx
const state = progress.useRouteProgress({ timeoutMs: 10000, doneMs: 300 });
// 'idle' | 'loading' | 'done'
```

In the Pages Router `useRouteProgress` follows `router.events` by itself (shallow
navigations are ignored unless `ignoreShallow: false`). Query-only navigations are
ignored by default; with `ignoreSamePathname: false` the hook also watches
`useSearchParams` (wrap it in `<Suspense>` in the App Router).

### `useRouterEvent` (Pages Router)

```tsx
import { useRouterEvent } from '@julianobazzi/nextjs-utils/next';

useRouterEvent('routeChangeComplete', (url, { shallow }) => trackPageView(url));
useRouterEvent('routeChangeError', (url, { error }) => report(error));
```

Does nothing in the App Router, which has no router events.

### `useStaleBuildReload` / `isStaleBuildNavigationError`

After a deploy, a page still running the old build fails to load chunks that no
longer exist. This hook reloads instead — on uncaught `ChunkLoadError`s and failed
dynamic imports, and on Pages Router `routeChangeError` (going straight to the
target URL). A `sessionStorage` guard (`minIntervalMs`, default 10 s) prevents
reload loops.

```tsx
import { isStaleBuildNavigationError, useStaleBuildReload } from '@julianobazzi/nextjs-utils/next';

useStaleBuildReload(); // e.g. in the root layout / _app

// app/error.tsx
useEffect(() => {
  if (isStaleBuildNavigationError(error)) window.location.reload();
}, [error]);
```

## Notes

- The Next.js hooks are exported from the `@julianobazzi/nextjs-utils/next`
  subpath. The main entry never imports `next`, so importing core hooks/utilities
  from a server-evaluated module (e.g. during `next build` page-data collection)
  never pulls it in.
- Client hooks ship with the `'use client'` directive applied at the bundle entry,
  so importing them into a Server Component does not require a wrapper.
- Ships as ESM + CJS, each with its own type declarations.

## Development

```bash
pnpm install
pnpm lint           # Biome lint + format check
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest unit tests
pnpm test:coverage  # with the 100% coverage gate
pnpm build          # tsup -> dist (ESM + CJS + d.ts)
pnpm check:exports  # are-the-types-wrong on the packed package
```

## License

MIT © Juliano Bazzi
