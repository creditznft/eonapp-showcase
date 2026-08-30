const AI_ARTIFACT_ANALYTICS_KEY = 'eon:ai-artifact-analytics:v1';
const MAX_ROWS = 600;

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(AI_ARTIFACT_ANALYTICS_KEY) || 'null');
    if (raw && typeof raw === 'object' && Array.isArray(raw.rows)) {
      return raw;
    }
  } catch {}
  return { version: 1, rows: [] };
}

function writeStore(/** @type {any} */ store) {
  try {
    localStorage.setItem(AI_ARTIFACT_ANALYTICS_KEY, JSON.stringify(store));
  } catch {}
}

export function recordAIArtifactTelemetry(/** @type {any} */ payload = {}) {
  const store = readStore();
  const /** @type {any} */
row = {
    ts: Date.now(),
    surface: String(payload.surface || 'unknown').slice(0, 80),
    artifactType: String(payload.artifactType || 'unknown').slice(0, 80),
    providerId: String(payload.providerId || payload.provider || 'unknown').slice(0, 80),
    providerLabel: String(payload.providerLabel || '').slice(0, 120),
    model: String(payload.model || '').slice(0, 140),
    mode: String(payload.mode || '').slice(0, 40),
    local: Boolean(payload.local),
    outputLength: Number(payload.outputLength || 0),
    sourceUrl: String(payload.sourceUrl || '').slice(0, 500)
  };
  store.rows.push(row);
  if (store.rows.length > MAX_ROWS) {
    store.rows = store.rows.slice(-MAX_ROWS);
  }
  writeStore(store);
  return row;
}

export function getAIArtifactTelemetryReport() {
  const store = readStore();
  const rows = Array.isArray(store.rows) ? store.rows : [];
  const /** @type {any} */
byProvider = {};
  const /** @type {any} */
byType = {};
  for (const /** @type {any} */
row of rows) {
    byProvider[row.providerId] = (byProvider[row.providerId] || 0) + 1;
    byType[row.artifactType] = (byType[row.artifactType] || 0) + 1;
  }
  return {
    total: rows.length,
    byProvider,
    byType,
    latest: rows.slice(-50).reverse()
  };
}
