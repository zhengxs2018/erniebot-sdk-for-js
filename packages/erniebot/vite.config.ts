import { defineConfig } from 'vite'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

export default defineConfig({
  plugins: [
    externalizeDeps(),
    dts({
      outDir: './dist-types',
    }),
  ],
  define: {
    'process.env.PKG_VERSION': JSON.stringify(pkg.version),
  },
  build: {
    sourcemap: false,
    copyPublicDir: false,
    reportCompressedSize: false,
    lib: {
      entry: ['src/index.ts'],
    },
    rollupOptions: {
      output: [
        {
          format: 'esm',
          dir: 'dist',
          exports: 'named',
          entryFileNames: '[name].mjs',
          chunkFileNames: '[name].mjs',
        },
        {
          format: 'cjs',
          dir: 'dist',
          exports: 'named',
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name].cjs',
        },
      ],
    },
  },
})
