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

Uma coleção de hooks e utilitários reutilizáveis para **Next.js (App Router e Pages Router)**, escritos em TypeScript.

**Feito para Next.js, compatível com React 18 e 19.** Os hooks client já vêm com a
diretiva `'use client'` aplicada, então você importa direto em Server Components sem
precisar de wrapper. `react` e `next` são peer dependencies (`next` é opcional se você
usa só o entry raiz), então a lib sempre usa as cópias do seu próprio projeto.

## Instalação

```bash
pnpm add @julianobazzi/nextjs-utils
# ou
npm install @julianobazzi/nextjs-utils
# ou
yarn add @julianobazzi/nextjs-utils
```

Requer React 18 ou 19 e, para os hooks do `/next`, Next.js 14+ (App Router ou Pages
Router). Atualizações de URL com `shallow` no App Router exigem Next.js 14.1+, e o
`createRouteProgress` no App Router exige Next.js 15.3+.

## Hooks

| Hook | Descrição |
| --- | --- |
| `useToggle` | Estado booleano com toggle e setter explícito |
| `usePrevious` | O valor do render anterior |
| `useDebounce` | Cópia com debounce de um valor que muda rápido, ou um callback com debounce |
| `useThrottle` | Cópia com throttle de um valor que muda rápido, ou um callback com throttle |
| `useLocalStorage` | Estado persistido no `localStorage`, sincronizado entre abas |
| `useCookie` | Estado persistido em cookie, sincronizado entre componentes e abas |
| `useMediaQuery` | Acompanha uma media query CSS de forma reativa (SSR-safe) |
| `useEventListener` | Listener de evento em window/document/elemento, com limpeza automática |
| `useInterval` | Executa um callback em intervalo (pausável com `null`) |
| `useOnlineStatus` | Acompanha a conectividade do navegador (SSR-safe) |
| `usePageVisibility` | Acompanha se a aba está visível (SSR-safe) |
| `useIdle` | Detecta quando o usuário está inativo há um tempo |
| `useBeforeUnload` | Pede confirmação antes de sair da página (alterações não salvas) |
| `useBroadcastChannel` | Envia/recebe mensagens entre abas da mesma origem |
| `useHistoryState` | Estado com histórico de desfazer/refazer |
| `useLatestRequest` | Mantém só a mais recente de várias requisições assíncronas |
| `useDistinctTrigger` | Executa uma busca só quando a entrada realmente mudou |
| `useInfiniteScroll` | Carrega mais itens quando um sentinela entra na tela |
| `useRefreshKey` | Um contador para `key` que remonta uma subárvore sob demanda |
| `useServiceWorkerUpdate` | Reage quando um novo service worker assume a página |
| `useReloadWhen` | Adia o reload da página até ser seguro |
| `useDailyAt` | Executa um callback todo dia num horário local |
| `createCan` | Cria o par de controle de acesso por papel (`useCan` + `Can`) |

### Hooks Next.js (subpath `@julianobazzi/nextjs-utils/next`)

| Hook | Descrição |
| --- | --- |
| `useSearchParam` | Lê um parâmetro da query string, tipado |
| `useSearchParamState` | `useState` guardado em um parâmetro da URL |
| `useUpdateQueryParams` | Grava vários parâmetros da URL a partir de um objeto |
| `useUpdateSearchParam` | Grava um único parâmetro da URL |
| `useFilterQueryParams` | Sincroniza o estado de um formulário de filtros com a URL |
| `usePaginationParams` | Estado de paginação (`page`/`pageSize`) na URL |
| `useSortParams` | Estado de ordenação de tabela na URL |
| `useActiveRoute` | Se a rota atual corresponde a um link (item de menu ativo) |
| `useHashParam` | Lê/grava o fragmento `#hash` da URL (SSR-safe) |
| `createRouteProgress` | Estado de navegação para uma barra de progresso, nos dois routers |
| `useRouterEvent` | Assina um evento do Pages Router |
| `useStaleBuildReload` | Recarrega quando a página roda código de um build antigo |

## Utilitários

| Utilitário | Descrição |
| --- | --- |
| `allowNumericBeforeInput` | Handler de `beforeinput` que mantém o input numérico (colagem, teclado virtual) |
| `allowNumericKeyDown` | Handler de `onKeyDown` que restringe a digitação a números (teclado físico) |
| `isStaleBuildNavigationError` | Se um erro vem de um build desatualizado (`/next`) |

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

const previousCount = usePrevious(count);
```

### `useDebounce`

```tsx
import { useDebounce } from '@julianobazzi/nextjs-utils';

// Forma de valor — retorna o valor depois que ele para de mudar
const debouncedSearch = useDebounce(search, 300);

// `onChange` dispara quando o valor com debounce muda — nunca para o valor
// inicial, então não precisa de guarda de "primeiro render"
useDebounce(search, 300, { onChange: (value) => onSearch(value) });

// Forma de função — retorna um callback estável com debounce
const debouncedSave = useDebounce((value: string) => save(value), 300);
debouncedSave('hello');
debouncedSave.flush();  // executa a chamada pendente agora
debouncedSave.cancel(); // descarta a chamada pendente

// Autosave: executa a chamada pendente no unmount em vez de descartar
const autosave = useDebounce(saveDraft, 800, { flushOnUnmount: true });
```

### `useThrottle`

```tsx
import { useThrottle } from '@julianobazzi/nextjs-utils';

// Forma de valor — atualiza no máximo uma vez por intervalo, terminando no último valor
const throttledScroll = useThrottle(scrollY, 200);

// Forma de função — a primeira chamada roda na hora, as extras viram uma chamada
// final; também expõe flush()/cancel() e aceita { flushOnUnmount }
const throttledTrack = useThrottle((position: number) => track(position), 200);
```

### `useLocalStorage`

```tsx
import { useLocalStorage } from '@julianobazzi/nextjs-utils';

const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
setTheme('dark');
setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
```

Valores objeto mantêm a identidade até o valor guardado mudar, então podem ir em
dependências de efeito. Opções:

- `serializer` / `deserializer` — (de)serialização própria (padrão JSON). Valide
  dados não confiáveis no deserializer; se ele lançar erro, volta o `initialValue`.
- `onError(error)` — chamado quando o storage está indisponível (modo privado,
  iframe com sandbox), cheio, ou guarda um valor ilegível. O hook nunca lança erro.

### `useCookie`

Como o `useLocalStorage`, mas guardado em cookie. Mudanças feitas por outras abas
ou pelo servidor são lidas pela Cookie Store API onde ela existe e, nos outros
navegadores, quando a aba volta a ter foco ou ficar visível.

```tsx
import { useCookie } from '@julianobazzi/nextjs-utils';

const [consent, setConsent, removeConsent] = useCookie('consent', 'pending', { days: 365 });
setConsent('accepted');

// Cookie de texto puro gravado pelo servidor (não JSON)
const [store] = useCookie('store', '', { deserializer: (raw) => raw });
```

Opções: `days` ou `maxAge` (segundos, tem precedência) — sem nenhum dos dois, vira
cookie de sessão; `path` (padrão `'/'`); `domain`; `sameSite` (padrão `'lax'`);
`secure` (`true`, `false` ou `'auto'` = só em páginas HTTPS; padrão `false`);
`serializer` / `deserializer`. Cookies gravados por JavaScript nunca são `HttpOnly`:
não guarde tokens nem segredos neles.

### `useMediaQuery`

```tsx
import { useMediaQuery } from '@julianobazzi/nextjs-utils';

const isDesktop = useMediaQuery('(min-width: 1024px)');

// Mobile-first: renderiza a variante mobile no servidor e na hidratação
const isMobile = useMediaQuery('(max-width: 767px)', { defaultValue: true });
```

### `useEventListener`

```tsx
import { useEventListener } from '@julianobazzi/nextjs-utils';

useEventListener('keydown', (event) => {
  if (event.key === 'Escape') close();
});

// Elemento ou ref, opções do listener e listener condicional
useEventListener('scroll', onScroll, containerRef, { passive: true, enabled: isOpen });
useEventListener('visibilitychange', onVisibility, document);
```

O alvo pode ser `window` (padrão), `document`, um elemento, uma ref ou qualquer
`EventTarget`. Opções: `capture`, `once`, `passive`, `enabled` (padrão `true`).
Um alvo `null` explícito cai no `window`; passe uma ref (`{ current: null }`) para
não registrar nada até o elemento existir.

### `useInterval`

```tsx
import { useInterval } from '@julianobazzi/nextjs-utils';

const [count, setCount] = useState(0);
const [running, setRunning] = useState(true);

// Passe `null` como delay para pausar o intervalo.
useInterval(() => setCount((c) => c + 1), running ? 1000 : null);
```

### `useOnlineStatus` / `usePageVisibility`

```tsx
import { useOnlineStatus, usePageVisibility } from '@julianobazzi/nextjs-utils';

const isOnline = useOnlineStatus();   // false enquanto o navegador está offline
const isVisible = usePageVisibility(); // false enquanto a aba está em segundo plano
```

### `useIdle`

```tsx
import { useIdle } from '@julianobazzi/nextjs-utils';

const isIdle = useIdle(5 * 60 * 1000); // true depois de 5 minutos sem atividade
```

### `useBeforeUnload`

```tsx
import { useBeforeUnload } from '@julianobazzi/nextjs-utils';

useBeforeUnload(form.isDirty); // o navegador pede confirmação antes de fechar/recarregar
```

### `useBroadcastChannel`

```tsx
import { useBroadcastChannel } from '@julianobazzi/nextjs-utils';

const { postMessage } = useBroadcastChannel<'logout'>(
  'auth',
  (message) => {
    if (message === 'logout') signOut(); // disparado por outras abas
  },
  { validate: (data): data is 'logout' => data === 'logout' },
);
postMessage('logout'); // avisa todas as outras abas
```

Opções: `validate` (type guard; qualquer script da mesma origem pode postar no
canal, então mensagens que falham são descartadas) e `onError` (mensagens que não
podem ser clonadas).

### `useHistoryState`

```tsx
import { useHistoryState } from '@julianobazzi/nextjs-utils';

const { state, set, undo, redo, canUndo, canRedo, clear, reset } = useHistoryState('', {
  capacity: 50, // passos de desfazer guardados (padrão 100)
});
set('draft 1');
set('draft 2');
undo();  // -> 'draft 1'
redo();  // -> 'draft 2'
clear(); // descarta o histórico, mantém o estado atual
reset(); // descarta o histórico e volta ao valor inicial
```

### `useLatestRequest`

Mantém só a mais recente de várias requisições sobrepostas, para que uma resposta
lenta e antiga nunca sobrescreva uma mais nova. Toda requisição é abortada no
unmount.

```tsx
import { useLatestRequest } from '@julianobazzi/nextjs-utils';

const { start, cancel } = useLatestRequest();

async function load(id: number) {
  const request = start(); // aborta a requisição anterior
  const data = await fetch(`/api/items/${id}`, { signal: request.signal }).then((r) => r.json());
  if (request.isCurrent()) setItem(data);
}
```

### `useDistinctTrigger`

```tsx
import { useDistinctTrigger } from '@julianobazzi/nextjs-utils';

const lookup = useDistinctTrigger<string>(); // { isEqual } é opcional

async function onCepChange(cep: string) {
  if (cep.length !== 8 || !lookup.shouldRun(cep)) return; // mesmo CEP: pula
  const address = await fetchAddress(cep);
  lookup.remember(); // lembra depois do sucesso, para poder tentar de novo se falhar
  setAddress(address);
}
```

### `useInfiniteScroll`

```tsx
import { useInfiniteScroll } from '@julianobazzi/nextjs-utils';

const { sentinelRef } = useInfiniteScroll({
  onLoadMore: fetchNextPage,
  hasMore,
  enabled: !isLoading, // reativar confere de novo um sentinela que continua visível
  rootMargin: '200px', // padrão
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
<CitySelect key={key} />; // refresh() remonta o componente (ex.: para recarregar as opções)
```

### `useServiceWorkerUpdate` / `useReloadWhen` / `useDailyAt`

Peças para telas que ficam abertas muito tempo (totens, painéis): recarregar quando
sai uma versão nova ou num horário fixo, mas nunca com um modal aberto.

```tsx
import { useDailyAt, useReloadWhen, useServiceWorkerUpdate } from '@julianobazzi/nextjs-utils';

const { requestReload } = useReloadWhen({
  canReload: () => !document.querySelector('[role="dialog"]'),
  retryMs: 1000, // padrão
});

useServiceWorkerUpdate(requestReload); // ignora a primeira instalação
useDailyAt(5, 0, requestReload);       // todo dia às 05:00, recupera depois de suspensão
```

O `useReloadWhen` guarda um pedido feito enquanto `canReload()` é `false` e tenta
de novo; passe `reload` para trocar o reload completo da página (ex.:
`router.refresh()`).

### `allowNumericBeforeInput` / `allowNumericKeyDown` (utilitários)

O `allowNumericBeforeInput` confere o valor que a inserção vai produzir, então
cobre também teclado virtual, colagem e arrastar-e-soltar, e recusa um segundo
separador ou um sinal de menos fora do lugar. Use com `type="text"` e `inputMode`.

```tsx
import { allowNumericBeforeInput, allowNumericKeyDown } from '@julianobazzi/nextjs-utils';

<input
  inputMode="decimal"
  onBeforeInput={(e) => allowNumericBeforeInput(e, { allowDecimal: true })}
/>;

// Só teclado físico: teclado virtual do Android, colagem e autofill escapam dele
<input onKeyDown={allowNumericKeyDown} />;
<input onKeyDown={(e) => allowNumericKeyDown(e, { allowDecimal: true, allowNegative: true })} />;
```

Os dois retornam `true` quando a entrada foi aceita. O `onBeforeInput` do React é
montado sobre `textInput`/`keypress`, que alguns navegadores não disparam na
colagem; para cobrir colagem em todos, registre o `allowNumericBeforeInput` no
evento nativo `beforeinput` (ex.: com `useEventListener`). Valide também no submit.

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
- Isso só esconde a interface: valide toda permissão de novo no servidor.

## Hooks de URL do Next.js

### Como eles gravam a URL

Estas regras valem para o `useUpdateQueryParams` e todos os hooks montados sobre
ele (`useUpdateSearchParam`, `useFilterQueryParams`, `usePaginationParams`,
`useSortParams`, `useSearchParamState`):

- **Idas ao servidor.** Por padrão cada gravação é uma navegação do router, que
  renderiza a página de novo no servidor (RSC no App Router, `getServerSideProps`
  no Pages Router). Para estado que só existe no cliente (filtros, busca, paginação
  de dados buscados no cliente), passe **`shallow: true`**: o Pages Router usa
  shallow routing e o App Router usa a History API (o Next.js 14.1+ mantém o
  `useSearchParams` sincronizado).
- **Atualizações seguidas se compõem.** Chamadas no mesmo tick — mesmo de hooks
  diferentes, como `toggleSort('name'); setPage(1)` — partem uma da outra, e não da
  mesma URL ainda não atualizada.
- **Valores.** `''`, `null`, `undefined`, `NaN`/`Infinity`, datas inválidas e arrays
  vazios apagam o parâmetro. `false` e `0` são gravados. Datas viram strings ISO.
  Arrays viram entradas repetidas (`?tag=a&tag=b`).
- **Limpar.** `useUpdateQueryParams()` chamado sem argumento remove todos os
  parâmetros — inclusive os `ignoredParams` — e, sem `preserveHash`, o hash.
- **Pages Router.** O router é detectado sozinho pelo `next/compat/router`. Nada é
  gravado antes do `router.isReady` (até lá a query ainda não é conhecida), e o
  `useFilterQueryParams` espera por ele antes da primeira sincronização.
- **`<Suspense>`.** No App Router, `useSearchParam`, `useSearchParamState`,
  `useUpdateQueryParams`, `useUpdateSearchParam`, `useFilterQueryParams`,
  `usePaginationParams` e `useSortParams` chamam `useSearchParams`, que exige um
  `<Suspense>` em rotas renderizadas estaticamente. Como alternativa, leia os
  parâmetros no servidor e passe adiante (ex.: como `initialSearch`).

Opções comuns: `history` (`'replace'` por padrão, ou `'push'`), `scroll` (padrão
`false`), `shallow` (padrão `false`).

### `useSearchParam`

```tsx
import { useSearchParam } from '@julianobazzi/nextjs-utils/next';

const tab = useSearchParam('tab', 'overview'); // string  (padrão aplicado)
const ref = useSearchParam('ref');             // string | null
```

### `useSearchParamState`

`useState` guardado em um parâmetro da URL: compartilhável, sobrevive ao reload, e
definir um valor igual não faz nada. Mantém o `#hash`.

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
updateQuery(); // limpa todos os parâmetros

const updateSearch = useUpdateSearchParam({ trim: true }); // chave 'search' por padrão
updateSearch('hello'); // ?search=hello   (não faz nada se não mudou)
```

Opções do `useUpdateQueryParams`: `ignoredParams` (chaves nunca gravadas),
`skipUnchanged` (pula a navegação quando os parâmetros não mudariam),
`preserveHash` (mantém o `#hash`), mais as comuns. Opções do
`useUpdateSearchParam`: `key` (padrão `'search'`), `trim`, mais as comuns; um valor
igual ao atual nunca navega.

### `useFilterQueryParams`

Mantém o estado de um formulário de filtros sincronizado com a URL e expõe um
setter `handleSearch`.

```tsx
import { useFilterQueryParams } from '@julianobazzi/nextjs-utils/next';

// `initialSearch` normalmente vem do servidor: o `searchParams` da página no App
// Router, ou as props do `getServerSideProps` (`null` quando ausente) no Pages Router.
function Filters({ initialSearch }: { initialSearch: string | null }) {
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState<string>();

  const { handleSearch } = useFilterQueryParams({
    parameters: () => ({ status }),
    deps: [status],             // tudo o que parameters()/overrides leem
    search,
    setSearch,
    initialSearch,              // semeia o `search`; a montagem navega uma vez só
    searchKey: 'q',             // padrão 'search'
    resetKeys: ['page'],        // volta para a página 1 quando um filtro muda
    ignoredParams: ['with'],
    overrides: { with: undefined },
    shallow: true,
  });

  return <input defaultValue={initialSearch ?? ''} onChange={(e) => handleSearch(e.target.value)} />;
}
```

- A URL é sincronizada de novo sempre que `deps` ou `search` mudam; uma
  sincronização que não mudaria a URL é pulada.
- A chave da busca só é gravada quando o hook gerencia uma busca (foi passado
  `search`, `setSearch` ou `initialSearch`), então o `?search=` de outro componente
  nunca é apagado.
- `deps` precisa ser uma lista de primitivos com tamanho fixo.

### `usePaginationParams`

Estado de paginação na URL. Os padrões ficam fora da URL (página 1 e o tamanho de
página padrão removem os parâmetros).

```tsx
import { usePaginationParams } from '@julianobazzi/nextjs-utils/next';

const { page, pageSize, setPage, setPageSize, reset } = usePaginationParams({
  defaultPageSize: 25,
  maxPageSize: 100,  // limita o ?pageSize= (recomendado quando ele vira um LIMIT)
  lastPage: totalPages, // limita a página; deixe undefined enquanto não se sabe o total
});
setPage(3);      // ?page=3
setPageSize(50); // ?pageSize=50 (e volta para a página 1)
```

### `useSortParams`

```tsx
import { useSortParams } from '@julianobazzi/nextjs-utils/next';

const { sortBy, order, toggleSort, clearSort } = useSortParams({
  allowedSorts: ['name', 'createdAt'], // ignora qualquer outro valor da URL
  resetKeys: ['page'],                 // volta para a página 1 a cada troca de ordenação
});
toggleSort('name'); // ?sortBy=name&order=asc -> desc -> sem ordenação
```

Com `defaultSort`, limpar volta para essa coluna, então ela só alterna entre as duas
direções. Outras opções: `sortKey`, `orderKey`, `defaultOrder`.

### `useActiveRoute`

```tsx
import { useActiveRoute } from '@julianobazzi/nextjs-utils/next';

const isActive = useActiveRoute('/settings'); // true em /settings e /settings/profile
const isHome = useActiveRoute('/', { exact: true });

<Link href="/settings" data-active={isActive} />;
```

### `useHashParam`

```tsx
import { useHashParam } from '@julianobazzi/nextjs-utils/next';

const [tab, setTab] = useHashParam('overview');
setTab('billing');                         // -> #billing (nova entrada no histórico), sem navegação do Next.js
setTab('billing', { history: 'replace' }); // reescreve a entrada atual
setTab();                                  // limpa o hash
```

### `createRouteProgress`

Estado de navegação para uma barra de carregamento no topo. Crie uma vez e
compartilhe.

```tsx
// lib/progress.ts
import { createRouteProgress } from '@julianobazzi/nextjs-utils/next';
export const progress = createRouteProgress(); // { ignoreSamePathname: true } por padrão

// instrumentation-client.ts (App Router, Next.js 15.3+)
import { progress } from './lib/progress';
export const { onRouterTransitionStart } = progress;

// components/TopBar.tsx
const state = progress.useRouteProgress({ timeoutMs: 10000, doneMs: 300 });
// 'idle' | 'loading' | 'done'
```

No Pages Router o `useRouteProgress` segue o `router.events` sozinho (navegações
shallow são ignoradas, a não ser com `ignoreShallow: false`). Navegações que só
mudam a query são ignoradas por padrão; com `ignoreSamePathname: false` o hook
também observa o `useSearchParams` (envolva em `<Suspense>` no App Router).

### `useRouterEvent` (Pages Router)

```tsx
import { useRouterEvent } from '@julianobazzi/nextjs-utils/next';

useRouterEvent('routeChangeComplete', (url, { shallow }) => trackPageView(url));
useRouterEvent('routeChangeError', (url, { error }) => report(error));
```

Não faz nada no App Router, que não tem eventos de router.

### `useStaleBuildReload` / `isStaleBuildNavigationError`

Depois de um deploy, uma página que ainda roda o build antigo falha ao carregar
chunks que não existem mais. Este hook recarrega em vez de quebrar — em
`ChunkLoadError` e imports dinâmicos que falham sem tratamento, e no
`routeChangeError` do Pages Router (indo direto para a URL de destino). Uma guarda
em `sessionStorage` (`minIntervalMs`, padrão 10 s) evita loop de reload.

```tsx
import { isStaleBuildNavigationError, useStaleBuildReload } from '@julianobazzi/nextjs-utils/next';

useStaleBuildReload(); // ex.: no layout raiz / _app

// app/error.tsx
useEffect(() => {
  if (isStaleBuildNavigationError(error)) window.location.reload();
}, [error]);
```

## Notas

- Os hooks Next.js são exportados pelo subpath `@julianobazzi/nextjs-utils/next`.
  O entry principal nunca importa `next`, então importar hooks/utilitários do core
  em um módulo avaliado no servidor (ex.: na coleta de page-data do `next build`)
  nunca o puxa.
- Os hooks client já saem com a diretiva `'use client'` aplicada no entry do bundle,
  então importá-los em um Server Component não exige wrapper.
- Publicado como ESM + CJS, cada um com suas próprias declarações de tipo.

## Desenvolvimento

```bash
pnpm install
pnpm lint           # lint + checagem de formatação (Biome)
pnpm typecheck      # tsc --noEmit
pnpm test           # testes unitários (Vitest)
pnpm test:coverage  # com a exigência de 100% de cobertura
pnpm build          # tsup -> dist (ESM + CJS + d.ts)
pnpm check:exports  # are-the-types-wrong no pacote empacotado
```

## Licença

MIT © Juliano Bazzi
