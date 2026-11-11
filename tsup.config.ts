import { promises as fs } from 'node:fs';
import { defineConfig } from 'tsup';

const CLIENT_BUNDLES = ['dist/index.js', 'dist/index.cjs', 'dist/next.js', 'dist/next.cjs'];
// `from 'next/navigation'` / `require("next/compat/router")` (no extension yet).
const NEXT_SPECIFIER = /((?:from\s*|require\()['"])(next\/(?:navigation|compat\/router))(['"])/g;
// Any `next/*` import or require still lacking a `.js` extension after the rewrite.
const UNREWRITTEN_NEXT_SPECIFIER = /(?:from\s*|require\()['"]next\/[^'"]*(?<!\.js)['"]/;

export default defineConfig({
  entry: { index: 'src/index.ts', next: 'src/next/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  // Keep each entry self-contained so `next/navigation` lives only in the
  // `next` bundle and `'use client'` can be prepended to every emitted file.
  splitting: false,
  treeshake: true,
  sourcemap: true,
  minify: false,
  external: ['react', 'react-dom', 'next'],
  cjsInterop: true,
  // Two post-build rewrites on the emitted bundles:
  // 1. esbuild strips module-level `'use client'` while bundling; prepend it back
  //    so the directive survives for Next.js App Router consumers.
  // 2. `next` ships no `exports` field, so native Node ESM (used by `next build`
  //    page-data collection) can't resolve extensionless bare specifiers such
  //    as `next/navigation`. Rewrite them to the real files (`next/navigation.js`,
  //    `next/compat/router.js`), resolvable by both native Node ESM and Next's
  //    bundler. Source keeps the bare form so TS types keep resolving.
  async onSuccess() {
    await Promise.all(
      CLIENT_BUNDLES.map(async (file) => {
        let code = await fs.readFile(file, 'utf8');
        code = code.replace(NEXT_SPECIFIER, '$1$2.js$3');
        const leftover = code.match(UNREWRITTEN_NEXT_SPECIFIER);
        if (leftover) {
          throw new Error(`${file}: unrewritten Next.js import ${leftover[0]}`);
        }
        if (!code.startsWith("'use client'")) {
          code = `'use client';\n${code}`;
        }
        await fs.writeFile(file, code);
      }),
    );
  },
});
