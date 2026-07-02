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

A collection of reusable hooks and utilities for **Next.js (App Router)**, written in TypeScript.

**Built for Next.js, compatible with React 18 and 19.** Client hooks ship with the
`'use client'` directive already applied, so you can import them directly into Server
Components without writing a wrapper. `next`, `react`, and `react-dom` are peer
dependencies, so the library always uses your app's own copies.

## Installation

```bash
pnpm add @julianobazzi/nextjs-utils
# or
npm install @julianobazzi/nextjs-utils
# or
yarn add @julianobazzi/nextjs-utils
```

Requires Next.js 14+ (App Router) with React 18 or 19, already installed in your project.

## Hooks

| Hook | Description |
| --- | --- |
| `useToggle` | Boolean state with a toggle and explicit setter |
| `usePrevious` | The value from the previous render |
| `useDebounce` | A debounced copy of a fast-changing value, or a debounced callback |
| `useThrottle` | A throttled copy of a fast-changing value, or a throttled callback |
| `useLocalStorage` | State persisted in `localStorage`, synced across tabs |
| `useCookie` | State persisted in a cookie, synced across components |
| `useMediaQuery` | Reactively track a CSS media query (SSR-safe) |
| `useEventListener` | Attach a DOM/window event listener with cleanup |
| `useInterval` | Run a callback on an interval (pausable with `null`) |
| `useOnlineStatus` | Track the browser connectivity status (SSR-safe) |
| `usePageVisibility` | Track whether the tab is visible (SSR-safe) |
| `useIdle` | Detect when the user has been inactive for a while |
| `useBeforeUnload` | Confirm before leaving the page (unsaved changes) |
| `useBroadcastChannel` | Send/receive messages between tabs of the same origin |
| `useHistoryState` | State with undo/redo history |
| `createCan` | Build a role-based access control pair (`useCan` + `Can`) |

### Next.js hooks (subpath `@julianobazzi/nextjs-utils/next`)

| Hook | Description |
| --- | --- |
| `useSearchParam` | Read a typed query string param (`next/navigation`) |
| `useUpdateQueryParams` | Write multiple URL search params from an object |
| `useUpdateSearchParam` | Write a single URL search param |
| `useFilterQueryParams` | Sync a filter form's state to the URL |
| `useActiveRoute` | Whether the current route matches a link (active nav item) |
| `usePaginationParams` | Pagination state (`page`/`pageSize`) stored in the URL |
| `useSortParams` | Table sorting state stored in the URL |
| `useHashParam` | Read/write the URL `#hash` fragment (SSR-safe) |

## Utilities

| Utility | Description |
| --- | --- |
| `allowNumericKeyDown` | `onKeyDown` handler restricting an input to numbers |

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

// Function form — returns a stable debounced callback
const debouncedSave = useDebounce((value: string) => save(value), 300);
debouncedSave('hello');
```

### `useLocalStorage`

```tsx
import { useLocalStorage } from '@julianobazzi/nextjs-utils';

const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
setTheme('dark');
setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
```

### `useMediaQuery`

```tsx
import { useMediaQuery } from '@julianobazzi/nextjs-utils';

const isDesktop = useMediaQuery('(min-width: 1024px)');
```

### `useEventListener`

```tsx
import { useEventListener } from '@julianobazzi/nextjs-utils';

useEventListener('keydown', (event) => {
  if (event.key === 'Escape') close();
});
```

### `useInterval`

```tsx
import { useInterval } from '@julianobazzi/nextjs-utils';

const [count, setCount] = useState(0);
const [running, setRunning] = useState(true);

// Pass `null` as the delay to pause the interval.
useInterval(() => setCount((c) => c + 1), running ? 1000 : null);
```

### `useThrottle`

```tsx
import { useThrottle } from '@julianobazzi/nextjs-utils';

// Value form — updates at most once per interval, settling on the latest value
const throttledScroll = useThrottle(scrollY, 200);

// Function form — leading call runs immediately, extra calls collapse into one
const throttledTrack = useThrottle((position: number) => track(position), 200);
```

### `useCookie`

Same API as `useLocalStorage`, backed by a cookie (JSON-serialized).

```tsx
import { useCookie } from '@julianobazzi/nextjs-utils';

const [consent, setConsent, removeConsent] = useCookie('consent', 'pending', { days: 365 });
setConsent('accepted');
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

const { postMessage } = useBroadcastChannel<'logout'>('auth', (message) => {
  if (message === 'logout') signOut(); // fired by other tabs
});
postMessage('logout'); // notify every other tab
```

### `useHistoryState`

```tsx
import { useHistoryState } from '@julianobazzi/nextjs-utils';

const { state, set, undo, redo, canUndo, canRedo } = useHistoryState('');
set('draft 1');
set('draft 2');
undo(); // -> 'draft 1'
redo(); // -> 'draft 2'
```

### `allowNumericKeyDown` (utility)

`onKeyDown` handler that restricts an `<input>` to numeric typing. Control,
navigation, and shortcut keys always pass through.

```tsx
import { allowNumericKeyDown } from '@julianobazzi/nextjs-utils';

<input onKeyDown={allowNumericKeyDown} />;
<input onKeyDown={(e) => allowNumericKeyDown(e, { allowDecimal: true })} />;
```

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

### `useSearchParam` (Next.js)

Typed wrapper around `next/navigation`'s `useSearchParams` for reading a single
query param. Client-only — already marked with `'use client'`.

```tsx
import { useSearchParam } from '@julianobazzi/nextjs-utils/next';

const tab = useSearchParam('tab', 'overview'); // string  (default applied)
const ref = useSearchParam('ref');             // string | null
```

### `useUpdateQueryParams` / `useUpdateSearchParam` (Next.js)

Write URL search params from your filter/search UI. Empty values delete the param;
arrays produce repeated entries. Defaults to `router.replace` without scrolling.

```tsx
import { useUpdateQueryParams, useUpdateSearchParam } from '@julianobazzi/nextjs-utils/next';

const updateQuery = useUpdateQueryParams();
updateQuery({ status: 'active', tag: ['a', 'b'], page: undefined }); // ?status=active&tag=a&tag=b
updateQuery(); // clears all params

const updateSearch = useUpdateSearchParam(); // key 'search' by default
updateSearch('hello'); // ?search=hello   (no-op if unchanged)
```

### `useFilterQueryParams` (Next.js)

Keeps a filter form's state in sync with the URL and exposes a `handleSearch` setter.

```tsx
import { useFilterQueryParams } from '@julianobazzi/nextjs-utils/next';

const [search, setSearch] = useState<string>();
const { handleSearch } = useFilterQueryParams({
  parameters: () => ({ status, category }),
  deps: [status, category],
  search,
  setSearch,
});
```

### `useActiveRoute` (Next.js)

```tsx
import { useActiveRoute } from '@julianobazzi/nextjs-utils/next';

const isActive = useActiveRoute('/settings'); // true on /settings and /settings/profile
const isHome = useActiveRoute('/', { exact: true });

<Link href="/settings" data-active={isActive} />;
```

### `usePaginationParams` (Next.js)

Pagination state in the URL, so pages are shareable and survive reloads.
Defaults stay out of the URL (page 1 and the default page size remove the params).

```tsx
import { usePaginationParams } from '@julianobazzi/nextjs-utils/next';

const { page, pageSize, setPage, setPageSize, reset } = usePaginationParams({
  defaultPageSize: 25,
});
setPage(3);      // ?page=3
setPageSize(50); // ?pageSize=50 (and back to page 1)
```

### `useSortParams` (Next.js)

```tsx
import { useSortParams } from '@julianobazzi/nextjs-utils/next';

const { sortBy, order, toggleSort, clearSort } = useSortParams();
toggleSort('name'); // ?sortBy=name&order=asc -> desc -> cleared
```

### `useHashParam` (Next.js)

```tsx
import { useHashParam } from '@julianobazzi/nextjs-utils/next';

const [tab, setTab] = useHashParam('overview');
setTab('billing'); // -> #billing, no Next.js navigation
setTab();          // clears the hash
```

## Next.js notes

- The Next.js hooks (`useSearchParam`, `useUpdateQueryParams`, `useUpdateSearchParam`,
  `useFilterQueryParams`, `useActiveRoute`, `usePaginationParams`, `useSortParams`,
  `useHashParam`) are exported from the `@julianobazzi/nextjs-utils/next` subpath.
  The main entry stays free of `next/navigation` so importing core hooks/utilities
  from a server-evaluated module (e.g. during `next build` page-data collection)
  never pulls it in.
- This package targets the **App Router**. Client hooks ship with the `'use client'`
  directive applied at the bundle entry, so importing them into a Server Component
  does not require a wrapper.
- `useSearchParam` reads from `next/navigation`; render it within the Next.js
  router context (and wrap in `<Suspense>` where Next requires it).

## Development

```bash
pnpm install
pnpm lint        # Biome lint + format check
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest unit tests
pnpm build       # tsup -> dist (ESM + CJS + d.ts)
```

## License

MIT © Juliano Bazzi
