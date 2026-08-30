/**
 * EONAPP W375 — local-first Research Lab workspace state.
 *
 * This module intentionally stores only user-entered/imported research data.
 * It has no network client, broker connector, credential field, order path or
 * economic incentive state.
 */
export const MARKET_INTELLIGENCE_STORAGE_KEY = 'eon:market-intelligence:v1';
export const MARKET_INTELLIGENCE_SCHEMA = 'eon.market-intelligence.local-workspace.v1';

const LIMITS = Object.freeze({ datasets: 16, pointsPerDataset: 10000, theses: 120, evidence: 240, forecasts: 180, audit: 360 });
const clone = (value) => JSON.parse(JSON.stringify(value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const stripControls = (value) => [...String(value ?? '')].filter((character) => { const code = character.codePointAt(0) || 0; return code >= 32 && code !== 127; }).join('');
const cleanText = (value, max = 280) => stripControls(value).replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const nowIso = () => new Date().toISOString();
const makeId = (prefix) => {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 14)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}`;
};

function normalizeTime(value) {
  const raw = cleanText(value, 80);
  if (!raw) return null;
  const numeric = Number(raw);
  const date = Number.isFinite(numeric) && numeric > 1000000000
    ? new Date(numeric < 100000000000 ? numeric * 1000 : numeric)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function normalizeSeries(points = []) {
  const deduped = new Map();
  for (const point of Array.isArray(points) ? points.slice(0, LIMITS.pointsPerDataset) : []) {
    const time = normalizeTime(point?.time ?? point?.date ?? point?.timestamp);
    const value = finite(point?.value ?? point?.close ?? point?.price, NaN);
    if (time && Number.isFinite(value) && value > 0) deduped.set(time, { time, value: Number(value.toFixed(10)) });
  }
  return [...deduped.values()].sort((left, right) => left.time.localeCompare(right.time));
}

function normalizeDataset(value = {}) {
  return {
    id: cleanText(value.id, 72) || makeId('dataset'),
    name: cleanText(value.name, 80) || 'Untitled local dataset',
    symbol: cleanText(value.symbol, 30).toUpperCase() || 'REFERENCE',
    sourceKind: value.sourceKind === 'csv' ? 'csv' : 'manual',
    sourceLabel: cleanText(value.sourceLabel, 120) || 'User-entered local data',
    importedAt: normalizeTime(value.importedAt) || nowIso(),
    points: normalizeSeries(value.points)
  };
}

function normalizeThesis(value = {}) {
  return {
    id: cleanText(value.id, 72) || makeId('thesis'),
    title: cleanText(value.title, 120),
    claim: cleanText(value.claim, 1000),
    invalidation: cleanText(value.invalidation, 700),
    horizon: cleanText(value.horizon, 80),
    domain: ['market', 'business', 'ecommerce'].includes(value.domain) ? value.domain : 'market',
    createdAt: normalizeTime(value.createdAt) || nowIso()
  };
}

function normalizeEvidence(value = {}) {
  return {
    id: cleanText(value.id, 72) || makeId('evidence'),
    label: cleanText(value.label, 120),
    note: cleanText(value.note, 1200),
    sourceType: ['user-note', 'document', 'dataset', 'external-link'].includes(value.sourceType) ? value.sourceType : 'user-note',
    createdAt: normalizeTime(value.createdAt) || nowIso()
  };
}

function normalizeForecast(value = {}) {
  const probability = Math.min(99, Math.max(1, Math.round(finite(value.probability, 50))));
  const outcome = value.outcome === 'yes' || value.outcome === 'no' ? value.outcome : null;
  return {
    id: cleanText(value.id, 72) || makeId('forecast'),
    title: cleanText(value.title, 160),
    resolutionCriteria: cleanText(value.resolutionCriteria, 900),
    probability,
    domain: ['market', 'business', 'ecommerce', 'general'].includes(value.domain) ? value.domain : 'general',
    dueAt: normalizeTime(value.dueAt) || null,
    createdAt: normalizeTime(value.createdAt) || nowIso(),
    resolvedAt: outcome ? (normalizeTime(value.resolvedAt) || nowIso()) : null,
    outcome,
    brierScore: outcome ? Number(Math.pow(probability / 100 - (outcome === 'yes' ? 1 : 0), 2).toFixed(4)) : null
  };
}

function normalizeAudit(value = {}) {
  return {
    id: cleanText(value.id, 72) || makeId('audit'),
    type: cleanText(value.type, 80) || 'local-update',
    message: cleanText(value.message, 240),
    at: normalizeTime(value.at) || nowIso()
  };
}

export function createDefaultMarketIntelligenceState() {
  return {
    schema: MARKET_INTELLIGENCE_SCHEMA,
    version: 1,
    updatedAt: nowIso(),
    settings: { mode: 'guided', selectedDatasetId: null },
    datasets: [],
    theses: [],
    evidence: [],
    forecasts: [],
    audit: [normalizeAudit({ type: 'workspace-created', message: 'Local Research Lab workspace created.' })]
  };
}

export function sanitizeMarketIntelligenceState(candidate) {
  const base = createDefaultMarketIntelligenceState();
  const raw = candidate && typeof candidate === 'object' ? candidate : {};
  const datasets = (Array.isArray(raw.datasets) ? raw.datasets : []).slice(0, LIMITS.datasets).map(normalizeDataset);
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const selected = cleanText(settings.selectedDatasetId, 72);
  return {
    schema: MARKET_INTELLIGENCE_SCHEMA,
    version: 1,
    updatedAt: normalizeTime(raw.updatedAt) || nowIso(),
    settings: {
      mode: settings.mode === 'pro' ? 'pro' : 'guided',
      selectedDatasetId: datasets.some((dataset) => dataset.id === selected) ? selected : (datasets[0]?.id || null)
    },
    datasets,
    theses: (Array.isArray(raw.theses) ? raw.theses : []).slice(0, LIMITS.theses).map(normalizeThesis).filter((item) => item.title || item.claim),
    evidence: (Array.isArray(raw.evidence) ? raw.evidence : []).slice(0, LIMITS.evidence).map(normalizeEvidence).filter((item) => item.label || item.note),
    forecasts: (Array.isArray(raw.forecasts) ? raw.forecasts : []).slice(0, LIMITS.forecasts).map(normalizeForecast).filter((item) => item.title && item.resolutionCriteria),
    audit: (Array.isArray(raw.audit) ? raw.audit : base.audit).slice(-LIMITS.audit).map(normalizeAudit)
  };
}

export function loadMarketIntelligenceState(storage = globalThis.localStorage) {
  try {
    return sanitizeMarketIntelligenceState(JSON.parse(storage?.getItem(MARKET_INTELLIGENCE_STORAGE_KEY) || 'null'));
  } catch {
    return createDefaultMarketIntelligenceState();
  }
}

export function saveMarketIntelligenceState(state, storage = globalThis.localStorage) {
  const safe = sanitizeMarketIntelligenceState({ ...state, updatedAt: nowIso() });
  try { storage?.setItem(MARKET_INTELLIGENCE_STORAGE_KEY, JSON.stringify(safe)); } catch {}
  return safe;
}

export function updateMarketIntelligenceState(mutator, storage = globalThis.localStorage) {
  const current = loadMarketIntelligenceState(storage);
  const draft = clone(current);
  const changed = typeof mutator === 'function' ? (mutator(draft) || draft) : draft;
  return saveMarketIntelligenceState(changed, storage);
}

export function addLocalDataset(state, input = {}) {
  const next = clone(state);
  const dataset = normalizeDataset({ ...input, id: input.id || makeId('dataset') });
  next.datasets = [...next.datasets.filter((item) => item.id !== dataset.id), dataset].slice(-LIMITS.datasets);
  next.settings.selectedDatasetId = dataset.id;
  next.audit.push(normalizeAudit({ type: 'dataset-added', message: `${dataset.name} saved as local ${dataset.sourceKind} research data.` }));
  return sanitizeMarketIntelligenceState(next);
}

export function appendManualPoint(state, datasetId, point) {
  const next = clone(state);
  const dataset = next.datasets.find((item) => item.id === datasetId);
  if (!dataset) return sanitizeMarketIntelligenceState(next);
  dataset.sourceKind = 'manual';
  dataset.sourceLabel = 'User-entered manual reference data';
  dataset.points = normalizeSeries([...dataset.points, point]);
  next.audit.push(normalizeAudit({ type: 'manual-point-added', message: `Manual reference added to ${dataset.name}.` }));
  return sanitizeMarketIntelligenceState(next);
}

export function ensureManualDataset(state, input = {}) {
  const existing = state.datasets.find((dataset) => dataset.sourceKind === 'manual');
  if (existing) return { state, datasetId: existing.id };
  const next = addLocalDataset(state, {
    id: makeId('manual'),
    name: cleanText(input.name, 80) || 'Manual reference series',
    symbol: cleanText(input.symbol, 30).toUpperCase() || 'REFERENCE',
    sourceKind: 'manual',
    sourceLabel: 'User-entered manual reference data',
    points: []
  });
  return { state: next, datasetId: next.settings.selectedDatasetId };
}

export function addLocalThesis(state, input = {}) {
  const next = clone(state);
  next.theses.push(normalizeThesis({ ...input, id: makeId('thesis') }));
  next.audit.push(normalizeAudit({ type: 'thesis-recorded', message: 'Research thesis recorded locally.' }));
  return sanitizeMarketIntelligenceState(next);
}

export function addLocalEvidence(state, input = {}) {
  const next = clone(state);
  next.evidence.push(normalizeEvidence({ ...input, id: makeId('evidence') }));
  next.audit.push(normalizeAudit({ type: 'evidence-recorded', message: 'Evidence note recorded locally.' }));
  return sanitizeMarketIntelligenceState(next);
}

export function addLocalForecast(state, forecast) {
  const next = clone(state);
  next.forecasts.push(normalizeForecast({ ...forecast, id: forecast.id || makeId('forecast') }));
  next.audit.push(normalizeAudit({ type: 'forecast-recorded', message: 'Non-monetary forecast recorded locally.' }));
  return sanitizeMarketIntelligenceState(next);
}

export function resolveLocalForecast(state, forecastId, outcome) {
  const next = clone(state);
  const forecast = next.forecasts.find((item) => item.id === forecastId);
  if (!forecast || !['yes', 'no'].includes(outcome)) return sanitizeMarketIntelligenceState(next);
  forecast.outcome = outcome;
  forecast.resolvedAt = nowIso();
  forecast.brierScore = Number(Math.pow(forecast.probability / 100 - (outcome === 'yes' ? 1 : 0), 2).toFixed(4));
  next.audit.push(normalizeAudit({ type: 'forecast-resolved', message: 'Forecast outcome was manually recorded for calibration review.' }));
  return sanitizeMarketIntelligenceState(next);
}

export function exportMarketIntelligenceWorkspace(state) {
  return sanitizeMarketIntelligenceState(state);
}
