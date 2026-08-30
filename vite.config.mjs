import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { createDevRouteRewrites, RETIRED_REDIRECTS } from './config/route-contract.mjs';
import { A15_BUILD_HTML_ENTRY_FILES } from './config/a15-current-product-authority.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * W449 production cleanroom: build only the HTML documents explicitly declared
 * by the route contract plus the two system recovery pages. Repository walks
 * made historical handoff/docs folders an accidental future input surface.
 */
// Retained as a documented compatibility guard for W239. The explicit
// allowlist below is stronger: neither directory is ever discovered as input.
const RETIRED_ENTRY_DIRECTORIES = new Set(RETIRED_REDIRECTS
  .map((row) => String(row.from || '').match(/^\/([^/*]+)\/\*$/)?.[1])
  .filter(Boolean));
function isRetiredEntryDirectory(entry) {
  return RETIRED_ENTRY_DIRECTORIES.has(entry);
}
void isRetiredEntryDirectory;

// A15 I02: the current product authority owns deterministic build inputs.
// Redirect-only compatibility documents such as chat.html and support.html are
// represented by edge redirects and are never emitted as application entries.
const EXPLICIT_HTML_ENTRY_FILES = A15_BUILD_HTML_ENTRY_FILES;

function buildInputs() {
  const input = {};
  for (const file of EXPLICIT_HTML_ENTRY_FILES) {
    const absolute = path.join(__dirname, file);
    if (!existsSync(absolute)) {
      throw new Error(`Route-contract HTML entry is missing: ${file}`);
    }
    input[file.replace(/\.html$/i, '')] = absolute;
  }
  return input;
}

const CLEAN_ROUTE_REWRITES = createDevRouteRewrites();

function createCleanRouteRewritePlugin() {
  const rewriteRequest = (/** @type {any} */ req) => {
    if (!req?.url) return false;
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      return false;
    }

    const pathname = url.pathname.replace(/\/$/, '') || '/';
    if (pathname === '/r' || pathname === '/m' || pathname.startsWith('/r/') || pathname.startsWith('/m/')) {
      req.url = `/referral.html${url.search}${url.hash}`;
      return true;
    }
    if (pathname.startsWith('/u/')) {
      const handle = pathname.slice('/u/'.length);
      req.url = `/realm-profile.html?user=${encodeURIComponent(handle)}${url.hash}`;
      return true;
    }
    const target = CLEAN_ROUTE_REWRITES.get(pathname);
    if (!target) return false;

    req.url = `${target}${url.search}${url.hash}`;
    return true;
  };

  return {
    name: 'eon-clean-route-rewrites',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewriteRequest(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewriteRequest(req);
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    createCleanRouteRewritePlugin()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Vite/esbuild can retain a multi-page minifier handle in constrained CI.
    // Build deterministically, then minify emitted JS/CSS with scripts/minify-dist.mjs.
    minify: false,
    reportCompressedSize: false,
    sourcemap: process.env.EON_BUILD_SOURCEMAPS === '1',
    // W105: keep the browser from eager-fetching every shared/lazy chunk on large multi-page routes.
    // Modulepreload hints are performance hints only; filtered chunks are still fetched when imported.
    modulePreload: {
      polyfill: false,
      resolveDependencies(_url, deps) {
        const alwaysKeep = /(?:main|runtime-loader|localStorage-shim|storage|identity)/i;
        return deps.filter((dep) => {
          if (/\.css$/i.test(dep)) return true;
          if (alwaysKeep.test(dep)) return true;
          return false;
        });
      }
    },
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: buildInputs(),
      onwarn(warning, warn) {
        const message = String(warning?.message || '');
        const id = String(warning?.id || '');
        if (message.includes('Use of eval') && id.includes('node_modules/vm-browserify/index.js')) {
          return;
        }
        warn(warning);
      }
    }
  }
});
