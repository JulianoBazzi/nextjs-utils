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
| `useLocalStorage` | State persisted in `localStorage`, synced across tabs |
| `useMediaQuery` | Reactively track a CSS media query (SSR-safe) |
| `useEventListener` | Attach a DOM/window event listener with cleanup |
| `useInterval` | Run a callback on an interval (pausable with `null`) |
| `createCan` | Build a role-based access control pair (`useCan` + `Can`) |
| `useSearchParam` | Read a typed query string param (`next/navigation`) |
| `useUpdateQueryParams` | Write multiple URL search params from an object |
| `useUpdateSearchParam` | Write a single URL search param |
| `useFilterQueryParams` | Sync a filter form's state to the URL |

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
import { useSearchParam } from '@julianobazzi/nextjs-utils';

const tab = useSearchParam('tab', 'overview'); // string  (default applied)
const ref = useSearchParam('ref');             // string | null
```

### `useUpdateQueryParams` / `useUpdateSearchParam` (Next.js)

Write URL search params from your filter/search UI. Empty values delete the param;
arrays produce repeated entries. Defaults to `router.replace` without scrolling.

```tsx
import { useUpdateQueryParams, useUpdateSearchParam } from '@julianobazzi/nextjs-utils';

const updateQuery = useUpdateQueryParams();
updateQuery({ status: 'active', tag: ['a', 'b'], page: undefined }); // ?status=active&tag=a&tag=b
updateQuery(); // clears all params

const updateSearch = useUpdateSearchParam(); // key 'search' by default
updateSearch('hello'); // ?search=hello   (no-op if unchanged)
```

### `useFilterQueryParams` (Next.js)

Keeps a filter form's state in sync with the URL and exposes a `handleSearch` setter.

```tsx
import { useFilterQueryParams } from '@julianobazzi/nextjs-utils';

const [search, setSearch] = useState<string>();
const { handleSearch } = useFilterQueryParams({
  parameters: () => ({ status, category }),
  deps: [status, category],
  search,
  setSearch,
});
```

## Next.js notes

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
