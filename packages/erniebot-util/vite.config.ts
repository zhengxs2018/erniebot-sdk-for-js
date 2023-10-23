import { defineConfig } from 'vite'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import dts from 'vite-plugin-dts'

/**
 * vite config
 * @see https://vitejs.dev/
 *
 * vitest config
 * @see https://vitest.dev/
 */
export default defineConfig({
  plugins: [
    externalizeDeps(),
    dts({
      outDir: './dist-types',
    }),
  ],
  build: {
    sourcemap: true,
    copyPublicDir: false,
    reportCompressedSize: false,
    lib: {
      entry: ['src/index.ts', 'src/cli.ts'],
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
