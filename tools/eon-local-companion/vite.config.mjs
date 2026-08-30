import path from 'node:path';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

const root = path.resolve(import.meta.dirname, '../..');
const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

export default defineConfig({
  root,
  configFile: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    target: 'node22',
    // Keep ephemeral bundle output separate from preserved versioned test
    // artifacts. Vite clears outDir before every build.
    outDir: path.join(root, 'build-local-companion'),
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    lib: {
      entry: path.join(root, 'tools/eon-local-bridge/server.mjs'),
      formats: ['cjs'],
      fileName: () => 'eon-local-companion.cjs'
    },
    rollupOptions: {
      external: (id) => builtins.has(id) || id.startsWith('node:'),
      output: {
        exports: 'auto',
        inlineDynamicImports: true
      }
    }
  }
});
