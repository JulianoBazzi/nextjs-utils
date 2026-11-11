import { promises as fs } from 'node:fs';
import { defineConfig } from 'tsup';

const BUNDLES = ['dist/index.js', 'dist/index.cjs', 'dist/next.js', 'dist/next.cjs'];
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
  // `next` bundle.
  splitting: false,
  // esbuild already drops unused code; tsup's extra Rollup tree-shaking pass
  // would strip the `'use client'` banner and duplicate `sourceMappingURL`.
  // Consumers tree-shake further (`sideEffects: false`).
  treeshake: false,
  sourcemap: true,
  minify: false,
  external: ['react', 'react-dom', 'next'],
  cjsInterop: true,
  // esbuild strips module-level `'use client'` while bundling; the banner puts
  // it back as the first statement of every bundle, with sourcemaps aligned.
  banner: { js: "'use client';" },
  // `next` ships no `exports` field, so native Node ESM (used by `next build`
  // page-data collection) can't resolve extensionless bare specifiers such as
  // `next/navigation`. Rewrite them to the real files (`next/navigation.js`,
  // `next/compat/router.js`), resolvable by both native Node ESM and Next's
  // bundler. Source keeps the bare form so TS types keep resolving. Adding
  // `.js` inside an import string never moves code to another line, so the
  // sourcemaps stay valid.
  async onSuccess() {
    await Promise.all(
      BUNDLES.map(async (file) => {
        let code = await fs.readFile(file, 'utf8');
        code = code.replace(NEXT_SPECIFIER, '$1$2.js$3');
        const leftover = code.match(UNREWRITTEN_NEXT_SPECIFIER);
        if (leftover) {
          throw new Error(`${file}: unrewritten Next.js import ${leftover[0]}`);
        }
        await fs.writeFile(file, code);
      }),
    );
  },
});
