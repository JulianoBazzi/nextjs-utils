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
  external: ['react', 'react-dom', 'next', 'next/navigation'],
  cjsInterop: true,
  // esbuild strips module-level `'use client'` while bundling (and re-strips it
  // from `banner`/`renderChunk`). Prepend it to the written bundles instead, so
  // the directive survives for Next.js App Router consumers.
  async onSuccess() {
    await Promise.all(
      CLIENT_BUNDLES.map(async (file) => {
        const code = await fs.readFile(file, 'utf8');
        if (!code.startsWith("'use client'")) {
          await fs.writeFile(file, `'use client';\n${code}`);
        }
      }),
    );
  },
});
