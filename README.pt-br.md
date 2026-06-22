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

[English](README.md) | **Português**

Uma coleção de hooks e utilitários reutilizáveis para **Next.js (App Router)**, escritos em TypeScript.

**Feito para Next.js, compatível com React 18 e 19.** Os hooks client já vêm com a
diretiva `'use client'` aplicada, então você importa direto em Server Components sem
precisar de wrapper. `next`, `react` e `react-dom` são peer dependencies — a lib
sempre usa as cópias do seu próprio projeto.

## Instalação

```bash
pnpm add @julianobazzi/nextjs-utils
# ou
npm install @julianobazzi/nextjs-utils
# ou
yarn add @julianobazzi/nextjs-utils
```

Requer Next.js 14+ (App Router) com React 18 ou 19 já instalado no projeto.

## Hooks

| Hook | Descrição |
| --- | --- |
| `useToggle` | Estado booleano com toggle e setter explícito |
| `usePrevious` | O valor do render anterior |
| `useDebounce` | Cópia com debounce de um valor que muda rápido |
| `useLocalStorage` | Estado persistido no `localStorage`, sincronizado entre abas |
| `useMediaQuery` | Acompanha reativamente uma media query CSS (SSR-safe) |
| `useEventListener` | Anexa um event listener DOM/window com limpeza automática |
| `useInterval` | Executa um callback em intervalo (pausável com `null`) |
| `createCan` | Cria um par de controle de acesso por papel (`useCan` + `Can`) |
| `useSearchParam` | Lê um query param tipado (`next/navigation`) |
| `useUpdateQueryParams` | Escreve vários search params da URL a partir de um objeto |
| `useUpdateSearchParam` | Escreve um único search param da URL |
| `useFilterQueryParams` | Sincroniza o estado de um form de filtro com a URL |

## Utilitários

| Utilitário | Descrição |
| --- | --- |
| `allowNumericKeyDown` | Handler `onKeyDown` que restringe um input a números |

## Uso

### `useToggle`

```tsx
import { useToggle } from '@julianobazzi/nextjs-utils';

const [isOpen, toggle, setOpen] = useToggle(false);
// toggle()        -> inverte o valor
// setOpen(true)   -> define um valor explícito
```

### `usePrevious`

```tsx
import { usePrevious } from '@julianobazzi/nextjs-utils';

const contagemAnterior = usePrevious(count);
```

### `useDebounce`

```tsx
import { useDebounce } from '@julianobazzi/nextjs-utils';

const buscaComDebounce = useDebounce(search, 300);
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
const [rodando, setRodando] = useState(true);

// Passe `null` como delay para pausar o intervalo.
useInterval(() => setCount((c) => c + 1), rodando ? 1000 : null);
```

### `allowNumericKeyDown` (utilitário)

Handler `onKeyDown` que restringe um `<input>` a digitação numérica. Teclas de
controle, navegação e atalhos passam sempre.

```tsx
import { allowNumericKeyDown } from '@julianobazzi/nextjs-utils';

<input onKeyDown={allowNumericKeyDown} />;
<input onKeyDown={(e) => allowNumericKeyDown(e, { allowDecimal: true })} />;
```

### `createCan` (controle de acesso por papel)

Desacoplado de qualquer provider de auth: passe um resolver que retorna o(s)
papel(éis) do usuário atual. Você recebe um hook `useCan` e um componente guard
`Can` que compartilham o mesmo resolver.

```tsx
import { createCan } from '@julianobazzi/nextjs-utils';
import { useAuth } from './auth';

// Conecte seu contexto de auth uma vez:
export const { useCan, Can } = createCan(() => useAuth().user?.role ?? null);

// Depois, em qualquer lugar:
const canEdit = useCan(['admin', 'editor']);

<Can allowed={['admin']} fallback={<p>Acesso negado</p>}>
  <AdminPanel />
</Can>;
```

- Não autenticado (resolver retorna `null`/`undefined`) → negado.
- `allowed` vazio/omitido → qualquer usuário autenticado é liberado.
- O resolver pode retornar um único papel ou um array (RBAC multi-papel).

### `useSearchParam` (Next.js)

Wrapper tipado do `useSearchParams` do `next/navigation` p/ ler um único query
param. Client-only — já marcado com `'use client'`.

```tsx
import { useSearchParam } from '@julianobazzi/nextjs-utils';

const tab = useSearchParam('tab', 'overview'); // string  (default aplicado)
const ref = useSearchParam('ref');             // string | null
```

### `useUpdateQueryParams` / `useUpdateSearchParam` (Next.js)

Escreve search params da URL a partir da sua UI de filtro/busca. Valores vazios
removem o param; arrays geram entradas repetidas. Default `router.replace` sem scroll.

```tsx
import { useUpdateQueryParams, useUpdateSearchParam } from '@julianobazzi/nextjs-utils';

const updateQuery = useUpdateQueryParams();
updateQuery({ status: 'active', tag: ['a', 'b'], page: undefined }); // ?status=active&tag=a&tag=b
updateQuery(); // limpa todos os params

const updateSearch = useUpdateSearchParam(); // key 'search' por default
updateSearch('hello'); // ?search=hello   (no-op se não mudou)
```

### `useFilterQueryParams` (Next.js)

Mantém o estado de um form de filtro em sincronia com a URL e expõe um `handleSearch`.

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

## Notas Next.js

- O pacote é p/ o **App Router**. Os hooks client já vêm com `'use client'` no entry
  do bundle, então importar em Server Component não exige wrapper.
- `useSearchParam` lê de `next/navigation`; use dentro do contexto do router do Next
  (e envolva em `<Suspense>` onde o Next exigir).

## Desenvolvimento

```bash
pnpm install
pnpm lint        # Lint + format check com Biome
pnpm typecheck   # tsc --noEmit
pnpm test        # Testes unitários com Vitest
pnpm build       # tsup -> dist (ESM + CJS + d.ts)
```

## Licença

MIT © Juliano Bazzi
