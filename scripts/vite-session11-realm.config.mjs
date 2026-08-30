import path from 'node:path';
import { defineConfig } from 'vite';
export default defineConfig({
  define: {
    __EON_ADMIN_WALLETS__: JSON.stringify(''),
    __EON_ADMIN_WALLET_LIMIT__: JSON.stringify(10)
  },
  build: {
    outDir: 'dist-session11-realm',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: { input: { realm: path.resolve(process.cwd(), 'realm.html') } }
  }
});
