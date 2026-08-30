import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8']
]);

export function safeJoin(base, target) {
  const usePosix = /^\/(?!\/)/.test(base);
  const pathImpl = usePosix ? path.posix : path;
  const joined = pathImpl.resolve(base, target);
  const relative = pathImpl.relative(base, joined);
  if (relative.startsWith('..') || pathImpl.isAbsolute(relative)) return null;
  return joined;
}

export function parseRedirectRules(value = '') {
  const rows = [];
  for (const rawLine of String(value || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to, statusText] = line.split(/\s+/);
    const status = Number(statusText || 0);
    if (!from || !to || !Number.isInteger(status)) continue;
    // W260-R3 A2 only emulates exact redirects. Wildcard rewrites are outside the
    // Lighthouse canonical route matrix and must not accidentally alter paths.
    if (from.includes('*') || to.includes(':splat') || status === 200) continue;
    if (![301, 302, 307, 308].includes(status)) continue;
    rows.push(Object.freeze({ from, to, status }));
  }
  return Object.freeze(rows);
}

export function resolveStaticRedirect(requestUrl = '/', redirectRules = []) {
  const url = new URL(String(requestUrl || '/'), 'http://127.0.0.1');
  const rule = redirectRules.find((candidate) => candidate.from === url.pathname);
  if (!rule) return null;
  const target = new URL(rule.to, 'http://127.0.0.1');
  if (!target.search && url.search) target.search = url.search;
  return { status: rule.status, location: `${target.pathname}${target.search}${target.hash}` };
}

async function loadRedirectRules(root) {
  try {
    const content = await fs.readFile(path.join(root, '_redirects'), 'utf8');
    return parseRedirectRules(content);
  } catch {
    return Object.freeze([]);
  }
}

async function resolveFile(root, urlPath) {
  const normalized = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');
  const candidates = [];
  if (normalized === '/' || normalized === '') {
    candidates.push('index.html');
  } else {
    const trimmed = normalized.replace(/^\/+/, '');
    candidates.push(trimmed);
    if (!path.extname(trimmed)) {
      candidates.push(`${trimmed}.html`);
      candidates.push(path.join(trimmed, 'index.html'));
    }
  }
  for (const candidate of candidates) {
    const absolute = safeJoin(root, candidate);
    if (!absolute) continue;
    try {
      const stat = await fs.stat(absolute);
      if (stat.isFile()) return absolute;
    } catch {}
  }
  return null;
}

export async function createStaticServer({ root }) {
  const redirectRules = await loadRedirectRules(root);
  return http.createServer(async (req, res) => {
    try {
      const requestUrl = req.url || '/';
      const redirect = resolveStaticRedirect(requestUrl, redirectRules);
      if (redirect) {
        res.writeHead(redirect.status, { location: redirect.location, 'cache-control': 'no-store' });
        res.end();
        return;
      }
      const filePath = await resolveFile(root, requestUrl);
      if (!filePath) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES.get(ext) || 'application/octet-stream';
      const content = await fs.readFile(filePath);
      res.writeHead(200, { 'content-type': mimeType, 'cache-control': 'no-store' });
      res.end(content);
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`Server error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg.startsWith('--')) {
      args.set(arg.slice(2), next && !next.startsWith('--') ? next : 'true');
      if (next && !next.startsWith('--')) i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const port = Number(args.get('port') || 4180);
  const root = path.resolve(__dirname, '..', args.get('root') || 'dist');
  const server = await createStaticServer({ root });
  server.listen(port, '127.0.0.1', () => {
    console.log(`LHCI server ready on http://127.0.0.1:${port} from ${root}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
