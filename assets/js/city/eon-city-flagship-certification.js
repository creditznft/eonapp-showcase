/**
 * W624L — performance plan and flagship certification evidence controller.
 *
 * The controller is local-only. It can collect bounded frame samples and human
 * case results, but it cannot infer thermal/battery behavior, compare target
 * frames visually, or award owner approval. A final pass requires all named
 * device and recovery cases plus explicit human visual approval.
 */
import { createCityQualityGovernor } from './eon-city-quality-governor.js';
import { createCityPerformanceObservation } from './eon-city-performance-observation.js';
import { getEonCityCellResidencyPlan } from './eon-city-cell-streamer.js';

export const EON_CITY_FLAGSHIP_CERTIFICATION_SCHEMA = 'eon.city.flagship-certification.w624l.v1';
export const EON_CITY_FLAGSHIP_PRESETS = Object.freeze({
  low: Object.freeze({ quality: 'lite', targetFps: 30, frameBudgetMs: 33.34, maxPixelRatio: 1, residentCells: 9, npcLod: 'off', optionalDetail: false, shadows: 'minimal', effects: 'minimal' }),
  mid: Object.freeze({ quality: 'balanced', targetFps: 45, frameBudgetMs: 22.23, maxPixelRatio: 1.5, residentCells: 9, npcLod: 'silhouette', optionalDetail: true, shadows: 'restrained', effects: 'restrained' }),
  high: Object.freeze({ quality: 'cinematic', targetFps: 60, frameBudgetMs: 16.67, maxPixelRatio: 2, residentCells: 9, npcLod: 'full', optionalDetail: true, shadows: 'standard', effects: 'standard' })
});
export const EON_CITY_FLAGSHIP_CASES = Object.freeze([
  Object.freeze({ id: 'low-device', label: 'Low device class', kind: 'device', humanRequired: true }),
  Object.freeze({ id: 'mid-device', label: 'Mid device class', kind: 'device', humanRequired: true }),
  Object.freeze({ id: 'high-device', label: 'High device class', kind: 'device', humanRequired: true }),
  Object.freeze({ id: 'sustained-play', label: 'Sustained play', kind: 'performance', humanRequired: true }),
  Object.freeze({ id: 'route-switching', label: 'Route switching and re-entry', kind: 'recovery', humanRequired: true }),
  Object.freeze({ id: 'background-foreground', label: 'Background / foreground', kind: 'recovery', humanRequired: true }),
  Object.freeze({ id: 'pwa-update', label: 'PWA update and reload', kind: 'recovery', humanRequired: true }),
  Object.freeze({ id: 'memory-pressure', label: 'Memory-pressure downgrade', kind: 'recovery', humanRequired: true }),
  Object.freeze({ id: 'webgl-loss', label: 'WebGL context loss', kind: 'recovery', humanRequired: true }),
  Object.freeze({ id: 'visual-parity', label: 'W624A target-frame visual comparison', kind: 'visual', humanRequired: true }),
  Object.freeze({ id: 'owner-approval', label: 'Owner visual/product approval', kind: 'visual', humanRequired: true })
]);
export const EON_CITY_FLAGSHIP_PERFORMANCE_PLAN = Object.freeze({
  lod: true,
  frustumCulling: true,
  occlusionAvoidance: true,
  instancing: true,
  compressedTextureBoundary: 'manifest-gated-when-assets-exist',
  assetStreaming: 'required-core-plus-optional-detail',
  prefetchBoundary: 'same-origin-versioned-manifest-only',
  residentCellWindow: 9,
  disposal: 'runtime-owner-plus-cell-resource-disposers',
  frameTimeGovernor: true,
  qualityPresets: Object.keys(EON_CITY_FLAGSHIP_PRESETS),
  remoteTelemetry: false,
  automaticCertification: false
});

const freeze = (value) => Object.freeze(value);
const CASE_BY_ID = new Map(EON_CITY_FLAGSHIP_CASES.map((entry) => [entry.id, entry]));
const STATUS_SET = new Set(['pending', 'pass', 'fail', 'blocked']);
const MAX_FRAME_SAMPLES = 3600;
const MAX_MEMORY_SAMPLES = 120;
const EVIDENCE_RE = /^[A-Za-z0-9][A-Za-z0-9 ._:/#-]{7,220}$/;

function percentile(values = [], fraction = .95) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}
function average(values = []) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function round(value, digits = 2) { if (!Number.isFinite(value)) return null; const factor = 10 ** digits; return Math.round(value * factor) / factor; }
function safeEvidence(value = '') { const text = String(value || '').trim().slice(0, 220); return EVIDENCE_RE.test(text) ? text : ''; }
function defaultCases() { return new Map(EON_CITY_FLAGSHIP_CASES.map((entry) => [entry.id, freeze({ ...entry, status: 'pending', evidenceRef: '', observedAt: '', humanReviewed: false })])); }

export function getEonCityFlagshipPerformancePlan(deviceClass = 'mid') {
  const id = Object.hasOwn(EON_CITY_FLAGSHIP_PRESETS, deviceClass) ? deviceClass : 'mid';
  const preset = EON_CITY_FLAGSHIP_PRESETS[id];
  const cells = getEonCityCellResidencyPlan({ quality: preset.quality === 'high' ? 'cinematic' : preset.quality });
  return freeze({ schema: EON_CITY_FLAGSHIP_CERTIFICATION_SCHEMA, deviceClass: id, preset, plan: EON_CITY_FLAGSHIP_PERFORMANCE_PLAN, residentCells: cells.residentCellCount, staticAssetsLoaded: cells.staticAssetsLoaded, finalPerformanceClaim: false });
}

function buildMetrics(frames, memorySamples, startedAt, now) {
  const durationMs = Math.max(0, Number(now) - Number(startedAt));
  const averageFrameMs = average(frames);
  return freeze({
    durationMs,
    frameSamples: frames.length,
    averageFrameMs: round(averageFrameMs),
    p95FrameMs: round(percentile(frames, .95)),
    approximateAverageFps: averageFrameMs ? round(1000 / averageFrameMs) : null,
    memorySamples: memorySamples.length,
    peakUsedBytes: memorySamples.length ? Math.max(...memorySamples.map((entry) => entry.usedBytes || 0)) : null,
    localOnly: true,
    remoteTelemetry: false,
    thermalMeasured: false,
    batteryMeasured: false
  });
}

export function createEonCityFlagshipCertificationController({ deviceClass = 'mid', now = () => Date.now(), performanceNow = () => globalThis.performance?.now?.() ?? Date.now(), memoryReader = () => globalThis.performance?.memory || null } = {}) {
  const plan = getEonCityFlagshipPerformancePlan(deviceClass);
  const governor = createCityQualityGovernor({ quality: plan.preset.quality, now });
  const observation = createCityPerformanceObservation({ now: performanceNow, readMemory: memoryReader });
  const cases = defaultCases();
  const frames = [];
  const memorySamples = [];
  let startedAt = Number(now());
  let disposed = false;
  let selectedCaseId = '';

  const snapshot = () => {
    const caseList = freeze([...cases.values()]);
    const passCount = caseList.filter((entry) => entry.status === 'pass').length;
    const failCount = caseList.filter((entry) => entry.status === 'fail').length;
    const blockedCount = caseList.filter((entry) => entry.status === 'blocked').length;
    const metrics = buildMetrics(frames, memorySamples, startedAt, now());
    const allPassed = passCount === caseList.length && caseList.every((entry) => entry.humanReviewed === true && entry.evidenceRef);
    const ownerApproved = cases.get('owner-approval')?.status === 'pass' && cases.get('owner-approval')?.humanReviewed === true;
    const visualApproved = cases.get('visual-parity')?.status === 'pass' && cases.get('visual-parity')?.humanReviewed === true;
    return freeze({
      schema: EON_CITY_FLAGSHIP_CERTIFICATION_SCHEMA,
      deviceClass: plan.deviceClass,
      preset: plan.preset,
      performancePlan: EON_CITY_FLAGSHIP_PERFORMANCE_PLAN,
      cases: caseList,
      selectedCaseId,
      metrics,
      governor: governor.getSnapshot(),
      observation: observation.getSnapshot(),
      passCount,
      failCount,
      blockedCount,
      status: allPassed && ownerApproved && visualApproved ? 'passed' : failCount ? 'failed' : blockedCount ? 'blocked' : 'pending',
      finalPerformanceClaim: allPassed && ownerApproved && visualApproved,
      ownerVisualApproval: ownerApproved,
      targetFrameParity: visualApproved,
      remoteTelemetry: false,
      automaticCertification: false,
      disposed
    });
  };

  return freeze({
    getSnapshot: snapshot,
    recordFrame(frameMs) {
      if (disposed) return freeze({ ok: false, reason: 'controller-disposed' });
      const value = Number(frameMs);
      if (!Number.isFinite(value) || value <= 0 || value > 1000) return freeze({ ok: false, reason: 'invalid-frame-sample' });
      frames.push(value);
      if (frames.length > MAX_FRAME_SAMPLES) frames.shift();
      const decision = governor.recordFrame(value);
      observation.recordFrame?.(value);
      return freeze({ ok: true, decision: decision.decision, metrics: buildMetrics(frames, memorySamples, startedAt, now()), networkRequestCreated: false });
    },
    sampleMemory() {
      if (disposed) return freeze({ ok: false, reason: 'controller-disposed' });
      const memory = memoryReader?.();
      const usedBytes = Number(memory?.usedJSHeapSize || memory?.usedBytes || 0);
      if (!Number.isFinite(usedBytes) || usedBytes <= 0) return freeze({ ok: false, reason: 'memory-api-unavailable' });
      memorySamples.push(freeze({ usedBytes, at: Number(now()) }));
      if (memorySamples.length > MAX_MEMORY_SAMPLES) memorySamples.shift();
      observation.captureMemory();
      return freeze({ ok: true, usedBytes, networkRequestCreated: false });
    },
    selectCase(caseId = '', { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-review-required' });
      if (!CASE_BY_ID.has(caseId)) return freeze({ ok: false, reason: 'case-not-found' });
      selectedCaseId = caseId;
      return freeze({ ok: true, case: cases.get(caseId), networkRequestCreated: false });
    },
    recordCase(caseId = '', status = 'pending', { explicitUserAction = false, explicitHumanReview = false, evidenceRef = '' } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'controller-disposed' });
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!CASE_BY_ID.has(caseId) || !STATUS_SET.has(status) || status === 'pending') return freeze({ ok: false, reason: 'invalid-case-result' });
      if (explicitHumanReview !== true) return freeze({ ok: false, reason: 'explicit-human-review-required' });
      const reference = safeEvidence(evidenceRef);
      if (!reference) return freeze({ ok: false, reason: 'bounded-evidence-reference-required' });
      const base = CASE_BY_ID.get(caseId);
      cases.set(caseId, freeze({ ...base, status, evidenceRef: reference, observedAt: new Date(now()).toISOString(), humanReviewed: true }));
      selectedCaseId = caseId;
      return freeze({ ok: true, case: cases.get(caseId), snapshot: snapshot(), networkRequestCreated: false, automaticCertification: false });
    },
    requestProtection({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const current = governor.getSnapshot();
      if (!['protection-recommended', 'safe-mode-recommended'].includes(current.state)) return freeze({ ok: false, reason: 'no-protection-recommendation', snapshot: current });
      return freeze({ ok: true, recommendation: current.state === 'safe-mode-recommended' ? 'review-safe-mode' : 'review-lower-quality', automaticQualityChange: false, automaticNavigation: false, snapshot: current });
    },
    exportEvidence({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return freeze({ ok: true, evidence: snapshot(), filename: `eon-city-w624l-${plan.deviceClass}-evidence.json`, privateContentIncluded: false, networkRequestCreated: false });
    },
    resetSession({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      frames.splice(0); memorySamples.splice(0); startedAt = Number(now()); governor.clearSession();
      return freeze({ ok: true, snapshot: snapshot() });
    },
    dispose() { disposed = true; return freeze({ disposed: true, snapshot: snapshot() }); }
  });
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function downloadEvidence(result) {
  const blob = new Blob([`${JSON.stringify(result.evidence, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function bindEonCityFlagshipCertification(root, { onStatus = () => {}, deviceClass = 'mid', getRuntime = () => null } = {}) {
  const controller = createEonCityFlagshipCertificationController({ deviceClass });
  const menuActions = root.querySelector('[data-eon-play-menu-section="environment"] .eon-play-controls-card-actions') || root.querySelector('[data-eon-play-menu-section="work"] .eon-play-controls-card-actions');
  if (!menuActions) return () => controller.dispose();
  const open = document.createElement('button'); open.type = 'button'; open.dataset.eonPlayOpenFlagshipCertification = ''; open.textContent = 'Performance evidence'; menuActions.append(open);
  const panel = document.createElement('section'); panel.className = 'eon-city-flagship-certification-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'eon-city-flagship-title'); root.append(panel);
  let frameHandle = 0; let lastFrame = 0; let observing = false;
  const stopObservation = () => { observing = false; if (frameHandle) cancelAnimationFrame(frameHandle); frameHandle = 0; lastFrame = 0; };
  const tick = (time) => { if (!observing) return; if (lastFrame) controller.recordFrame(time - lastFrame); lastFrame = time; frameHandle = requestAnimationFrame(tick); };
  const render = () => {
    const snapshot = controller.getSnapshot();
    panel.innerHTML = `<div class="eon-city-flagship-card"><header><div><p class="eon-play-kicker">W624L · evidence-gated performance</p><h2 id="eon-city-flagship-title">Performance & flagship certification</h2><p>Local diagnostics can be exported. Device, recovery, visual-parity and owner-approval cases require real human evidence.</p></div><button type="button" data-eon-flagship-close>Close</button></header><section class="eon-city-flagship-summary"><strong>Status: ${escapeHtml(snapshot.status)}</strong><span>${snapshot.passCount}/${snapshot.cases.length} cases passed</span><span>${escapeHtml(snapshot.metrics.frameSamples)} frame samples</span><span>${escapeHtml(snapshot.metrics.approximateAverageFps ?? '—')} average FPS estimate</span></section><div class="eon-city-flagship-actions"><button type="button" data-eon-flagship-observe>${observing ? 'Stop local frame observation' : 'Start local frame observation'}</button><button type="button" data-eon-flagship-memory>Sample browser memory</button><button type="button" data-eon-flagship-export>Export local evidence</button><button type="button" data-eon-flagship-protection>Review performance recommendation</button></div><div class="eon-city-flagship-grid">${snapshot.cases.map((entry) => `<article data-state="${escapeHtml(entry.status)}"><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.status)}</span><small>${escapeHtml(entry.kind)} · human evidence required</small><button type="button" data-eon-flagship-case="${escapeHtml(entry.id)}">Review case</button></article>`).join('')}</div><div class="eon-city-flagship-review" data-eon-flagship-review><p>Select a case to review its evidence boundary. This panel never marks a pass automatically.</p></div><footer><p>Quality plan: LOD, culling, instancing, versioned streaming, bounded prefetch, disposal and frame-time governance. Compressed textures remain manifest-gated until real assets exist.</p></footer></div>`;
  };
  const show = () => { render(); panel.hidden = false; panel.querySelector('button')?.focus?.({ preventScroll: true }); };
  const hide = () => { stopObservation(); panel.hidden = true; open.focus?.({ preventScroll: true }); };
  const onOpen = () => { show(); onStatus('Performance evidence opened. No device or flagship pass is created automatically.'); };
  open.addEventListener('click', onOpen);
  panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); hide(); } });
  panel.addEventListener('click', (event) => {
    if (event.target === panel || event.target.closest('[data-eon-flagship-close]')) { hide(); return; }
    if (event.target.closest('[data-eon-flagship-observe]')) {
      observing = !observing;
      if (observing) { lastFrame = 0; frameHandle = requestAnimationFrame(tick); onStatus('Local frame observation started. It stays in memory and is not a device certification.'); }
      else { stopObservation(); onStatus('Local frame observation stopped. Export it for manual review.'); }
      render(); return;
    }
    if (event.target.closest('[data-eon-flagship-memory]')) { const result = controller.sampleMemory(); onStatus(result.ok ? 'One local browser-memory sample recorded.' : 'Browser memory API is unavailable; no estimate was invented.'); render(); return; }
    if (event.target.closest('[data-eon-flagship-export]')) { const result = controller.exportEvidence({ explicitUserAction: true }); if (result.ok) downloadEvidence(result); onStatus(result.ok ? 'Local performance evidence exported. It is not a certification pass.' : `Evidence export failed: ${result.reason}.`); return; }
    if (event.target.closest('[data-eon-flagship-protection]')) { const result = controller.requestProtection({ explicitUserAction: true }); onStatus(result.ok ? `Recommendation ready: ${result.recommendation}. Apply it only through normal City controls.` : 'No lower-quality or safe-mode recommendation is currently justified.'); return; }
    const caseButton = event.target.closest('[data-eon-flagship-case]');
    if (!caseButton) return;
    const result = controller.selectCase(caseButton.dataset.eonFlagshipCase, { explicitUserAction: true });
    const review = panel.querySelector('[data-eon-flagship-review]');
    if (!result.ok || !review) return;
    review.innerHTML = `<article><p class="eon-play-kicker">Reviewed evidence case</p><h3>${escapeHtml(result.case.label)}</h3><p>This case remains <strong>${escapeHtml(result.case.status)}</strong>. Record pass/fail only in the owner/Codex evidence lane with a bounded evidence reference and explicit human review.</p><p>City cannot infer thermal behavior, visual parity, PWA recovery or owner approval from source code.</p><button type="button" data-eon-flagship-open-device-lab>Open Device Lab after closing</button></article>`;
    review.querySelector('[data-eon-flagship-open-device-lab]')?.addEventListener('click', () => { hide(); root.querySelector('[data-eon-play-open-validation-device-lab]')?.click?.(); });
  });
  return () => { stopObservation(); open.removeEventListener('click', onOpen); open.remove(); panel.remove(); controller.dispose(); void getRuntime; };
}
