/**
 * W233 — private local 3D evidence recorder.
 *
 * This never sends telemetry. A user can save or export a small local record
 * after an optional 3D session to help device troubleshooting and release QA.
 */
export const CITY_3D_PROOF_SCHEMA = 'eon.city.webgl-proof.v1';
export const CITY_3D_PROOF_KEY = 'eon:city:3d:local-proof:v1';
const MAX_REPORTS = 12;

function getStorage(storage = null) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 200) {
  return Array.from(String(value || ''), (char) => {
    const code = char.codePointAt(0) || 0;
    return code < 32 || code === 127 ? '' : char;
  }).join('').trim().slice(0, max);
}

function num(value, fallback = 0, min = 0, max = 1_000_000) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function normaliseSummary(summary = {}) {
  return Object.freeze({
    quality: cleanText(summary.quality || 'unknown', 24),
    averageFrameMs: num(summary.averageFrameMs, 0, 0, 10_000),
    p95FrameMs: num(summary.p95FrameMs, 0, 0, 10_000),
    estimatedFps: num(summary.estimatedFps, 0, 0, 240),
    elapsedMs: num(summary.elapsedMs, 0, 0, 86_400_000),
    resolutionScale: num(summary.resolutionScale, 1, 0.1, 2),
    performanceState: cleanText(summary.performanceState || 'insufficient-samples', 48),
    fallbackIssued: summary.fallbackIssued === true,
    worldId: cleanText(summary.worldId || '', 120),
    districtCount: num(summary.districtCount, 0, 0, 100)
  });
}

export function classifyCity3dRuntime(summary = {}) {
  const value = normaliseSummary(summary);
  if (value.elapsedMs < 8_000 || value.averageFrameMs <= 0) {
    return Object.freeze({ state: 'insufficient-samples', label: 'Keep the 3D view open a little longer before saving evidence.', recommendedAction: 'continue-or-use-2d' });
  }
  if (value.fallbackIssued) {
    return Object.freeze({ state: 'fallback', label: '3D requested the safe 2D fallback.', recommendedAction: 'use-2d' });
  }
  if (value.averageFrameMs <= 22 && value.p95FrameMs <= 34) {
    return Object.freeze({ state: 'stable', label: 'Stable for the selected quality on this device.', recommendedAction: 'keep-quality' });
  }
  if (value.averageFrameMs <= 34 && value.p95FrameMs <= 55) {
    return Object.freeze({ state: 'cautious', label: 'Usable, but Balanced or Low is safer for longer sessions.', recommendedAction: 'lower-quality' });
  }
  return Object.freeze({ state: 'unsafe', label: 'Performance is not comfortable for this quality. Use the 2D City or lower 3D quality.', recommendedAction: 'use-2d-or-lower-quality' });
}

function readRaw(storage = getStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_3D_PROOF_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function normaliseReport(value = {}) {
  const summary = normaliseSummary(value.summary || value);
  const classification = classifyCity3dRuntime(summary);
  return Object.freeze({
    schema: CITY_3D_PROOF_SCHEMA,
    id: cleanText(value.id || '', 80),
    savedAt: cleanText(value.savedAt || '', 80),
    source: 'user-saved-local-3d-proof',
    summary,
    classification,
    device: Object.freeze({
      webgl2: value.device?.webgl2 === true,
      memoryGb: num(value.device?.memoryGb, 0, 0, 512),
      cores: num(value.device?.cores, 0, 0, 512),
      qualityRecommendation: cleanText(value.device?.qualityRecommendation || '', 24)
    })
  });
}

export function readCity3dLocalProofs(options = {}) {
  return Object.freeze(readRaw(getStorage(options.storage)).map(normaliseReport).filter((row) => row.id));
}

export function saveCity3dLocalProof({ summary = {}, device = {} } = {}, options = {}) {
  const now = Number(options.now || Date.now());
  const report = normaliseReport({
    id: `eon3_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date(now).toISOString(),
    summary,
    device: {
      webgl2: device.webgl2 === true,
      memoryGb: device.memoryGb,
      cores: device.cores,
      qualityRecommendation: device.recommendedQuality || device.qualityRecommendation
    }
  });
  const existing = readRaw(getStorage(options.storage));
  const next = [report, ...existing.map(normaliseReport)].slice(0, MAX_REPORTS);
  try { getStorage(options.storage)?.setItem(CITY_3D_PROOF_KEY, JSON.stringify(next)); } catch { return Object.freeze({ ok: false, report, reports: Object.freeze(next) }); }
  return Object.freeze({ ok: true, report, reports: Object.freeze(next) });
}

export function buildCity3dLocalProofExport(report = {}) {
  const normalised = normaliseReport(report);
  return `${JSON.stringify({
    schema: CITY_3D_PROOF_SCHEMA,
    exportedAt: new Date().toISOString(),
    note: 'Local user-exported optional-3D evidence. It contains performance summaries only; it does not contain chat text, account details, invite data, rewards, balances, or remote telemetry.',
    report: normalised
  }, null, 2)}\n`;
}
