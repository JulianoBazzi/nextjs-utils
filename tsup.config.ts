import { promises as fs } from 'node:fs';
import { defineConfig } from 'tsup';

const CLIENT_BUNDLES = ['dist/index.js', 'dist/index.cjs', 'dist/next.js', 'dist/next.cjs'];

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
  //    page-data collection) can't resolve the extensionless bare specifier
  //    `next/navigation`. Rewrite it to `next/navigation.js` (the real file),
  //    resolvable by both native Node ESM and Next's bundler. Source stays
  //    `next/navigation` so TS types keep resolving via `navigation.d.ts`.
  async onSuccess() {
    await Promise.all(
      CLIENT_BUNDLES.map(async (file) => {
        let code = await fs.readFile(file, 'utf8');
        code = code
          .replace(/(from\s+['"])next\/navigation(['"])/g, '$1next/navigation.js$2')
          .replace(/(require\(['"])next\/navigation(['"]\))/g, '$1next/navigation.js$2');
        if (!code.startsWith("'use client'")) {
          code = `'use client';\n${code}`;
        }
        await fs.writeFile(file, code);
      }),
    );
  },
});
