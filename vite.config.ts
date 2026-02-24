import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GitHubLabelManager',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@octokit/core',
        '@opentui/core',
        'chalk',
        'oh-my-logo',
        'yaml',
        'fs',
        'path',
        'os',
        'util',
        'crypto',
        'node:process',
        'node:stream',
        'node:buffer',
        'node:events',
        'node:fs',
        'assert',
        'events',
        'child_process',
        'tty',
        'module',
      ],
      output: {
        banner: '#!/usr/bin/env node',
        entryFileNames: 'index.js',
        interop: 'auto',
      },
    },
    target: 'node22',
    outDir: 'dist',
    ssr: true,
  },
  ssr: {
    noExternal: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      charset: 'utf8',
      platform: 'node',
    },
  },
})
