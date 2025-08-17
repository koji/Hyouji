import { defineConfig } from 'vite';
import { resolve } from 'path';

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
        'prompts',
        'chalk',
        'figlet',
        'oh-my-logo',
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
        interop: 'auto',
      },
    },
    target: 'node14',
    outDir: 'dist',
    ssr: true,
  },
  ssr: {
    noExternal: [],
  },
});
