/** W659 — optional loopback-only EON Local Bridge contract. */
export const EON_LOCAL_BRIDGE_SCHEMA = 'eon.local-ai.bridge.v1';
export const EON_LOCAL_BRIDGE_HOST = '127.0.0.1';
export const EON_LOCAL_BRIDGE_PORT = 17565;
export const EON_LOCAL_BRIDGE_ENDPOINT = `http://${EON_LOCAL_BRIDGE_HOST}:${EON_LOCAL_BRIDGE_PORT}`;
export const EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS = 60 * 60 * 1000;

export const EON_LOCAL_BRIDGE_DEFAULT_ORIGINS = Object.freeze([
  'https://eonapp.ch',
  'https://www.eonapp.ch',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://localhost:4173'
]);

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export const EON_LOCAL_BRIDGE_TARGETS = freezeRows([
  { runtimeId: 'ollama', ports: Object.freeze([11434]), methods: Object.freeze(['GET', 'POST']), paths: Object.freeze(['/api/tags', '/api/generate', '/api/chat']) },
  { runtimeId: 'lmstudio', ports: Object.freeze([1234]), methods: Object.freeze(['GET', 'POST']), paths: Object.freeze(['/api/v1/models', '/v1/models', '/v1/chat/completions']) },
  { runtimeId: 'jan', ports: Object.freeze([1337, 6767]), methods: Object.freeze(['GET', 'POST']), paths: Object.freeze(['/v1/models', '/v1/chat/completions']) },
  { runtimeId: 'comfyui', ports: Object.freeze([8000, 8188, 8189]), methods: Object.freeze(['GET', 'POST']), paths: Object.freeze(['/system_stats', '/object_info/CheckpointLoaderSimple', '/queue', '/prompt', '/interrupt', '/history/:id', '/view', '/upload/image']) },
  { runtimeId: 'acestep', ports: Object.freeze([8001]), methods: Object.freeze(['GET', 'POST']), paths: Object.freeze(['/health', '/v1/models', '/v1/stats', '/release_task', '/query_result', '/v1/audio']) }
]);

function cleanHost(value = '') {
  return String(value || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
}

function pathAllowed(pathname, target) {
  if (target.paths.includes(pathname)) return true;
  if (target.paths.includes('/history/:id') && /^\/history\/[A-Za-z0-9_-]{1,160}$/.test(pathname)) return true;
  return false;
}

export function classifyEonLocalBridgeTarget(value = '', method = 'GET') {
  try {
    const url = new URL(String(value || ''));
    const host = cleanHost(url.hostname);
    const port = Number(url.port || 0);
    const requestMethod = String(method || 'GET').toUpperCase();
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(host) || url.username || url.password) return null;
    const target = EON_LOCAL_BRIDGE_TARGETS.find((row) => row.ports.includes(port) && row.methods.includes(requestMethod) && pathAllowed(url.pathname, row));
    if (!target) return null;
    if (url.pathname === '/view') {
      const keys = [...url.searchParams.keys()];
      if (keys.some((key) => !['filename', 'subfolder', 'type'].includes(key))) return null;
      const filename = String(url.searchParams.get('filename') || '');
      const subfolder = String(url.searchParams.get('subfolder') || '');
      const type = String(url.searchParams.get('type') || 'output');
      if (!filename || filename.length > 260 || /[\/\\\u0000-\u001f\u007f]/.test(filename) || filename === '.' || filename === '..') return null;
      if (subfolder.length > 220 || subfolder.startsWith('/') || subfolder.startsWith('\\') || /[\u0000-\u001f\u007f]/.test(subfolder) || /(?:^|[\/\\])\.\.(?:[\/\\]|$)/.test(subfolder)) return null;
      if (!['input', 'output', 'temp'].includes(type)) return null;
    } else if (target.runtimeId === 'acestep' && url.pathname === '/v1/audio') {
      const keys = [...url.searchParams.keys()];
      const outputPath = String(url.searchParams.get('path') || '');
      if (keys.length !== 1 || keys[0] !== 'path' || !outputPath || outputPath.length > 520) return null;
      if (/\0/.test(outputPath) || /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(outputPath)) return null;
      if (!/(?:^|[\\/])api_audio[\\/][A-Za-z0-9][A-Za-z0-9._-]{0,240}\.(?:wav|mp3|flac|opus|aac)$/i.test(outputPath)) return null;
    } else if (url.search) {
      return null;
    }
    return Object.freeze({ runtimeId: target.runtimeId, url: url.toString(), method: requestMethod, port, pathname: url.pathname });
  } catch {
    return null;
  }
}

export function getEonLocalBridgeCspSources() {
  return Object.freeze([
    `http://127.0.0.1:${EON_LOCAL_BRIDGE_PORT}`,
    `http://localhost:${EON_LOCAL_BRIDGE_PORT}`
  ]);
}
