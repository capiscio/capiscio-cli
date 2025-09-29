import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI binary
  {
    entry: { cli: 'src/cli.ts' },
    format: ['cjs'],
    target: 'node16',
    clean: true,
    dts: false,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: ['commander', 'chalk', 'ora', 'inquirer', 'glob', 'jose'],
    esbuildOptions(options) {
      options.banner = {
        js: '#!/usr/bin/env node'
      };
    }
  },
  // Library exports
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs'],
    target: 'node16',
    clean: false,
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: ['commander', 'chalk', 'ora', 'inquirer', 'glob', 'jose']
  }
]);