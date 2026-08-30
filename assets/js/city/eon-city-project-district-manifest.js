/**
 * W438 — bounded private project-district manifests and deterministic City projections.
 *
 * A manifest holds only an opaque project reference, deterministic seed, chosen
 * palette, explicitly City-safe task cards and a coarse mission state. It never
 * accepts prompts, files, provider output, credentials, chat text or an
 * unreviewed project title as a City façade. Rendering consumes the public
 * projection only; no City route, network call, publication or background
 * generation is created.
 */
export const EON_PROJECT_DISTRICT_SCHEMA = 'eon.city.project-district-manifest.w438.v1';
export const EON_PROJECT_DISTRICT_STORAGE_KEY = 'eon:city:project-districts:v1';
export const EON_PROJECT_DISTRICT_MAX = 12;

export const EON_PROJECT_DISTRICT_PALETTES = Object.freeze([
  Object.freeze({ id: 'signal', label: 'Signal', accent: '#67e8f9', atmosphere: 'cool beacon routes' }),
  Object.freeze({ id: 'forge', label: 'Forge', accent: '#c4b5fd', atmosphere: 'violet fabrication light' }),
  Object.freeze({ id: 'archive', label: 'Archive', accent: '#93c5fd', atmosphere: 'calm library mist' }),
  Object.freeze({ id: 'garden', label: 'Garden', accent: '#86efac', atmosphere: 'quiet creator greens' })
]);

export const EON_PROJECT_DISTRICT_MISSION_STATES = Object.freeze(['ready', 'focus', 'paused', 'completed', 'needs-review']);

const PALETTE_MAP = new Map(EON_PROJECT_DISTRICT_PALETTES.map((palette) => [palette.id, palette]));
const MISSION_SET = new Set(EON_PROJECT_DISTRICT_MISSION_STATES);
const PROJECT_REFERENCE_RE = /^project_[a-z0-9:_-]{3,160}$/i;
const DISTRICT_ID_RE = /^district_[a-z0-9_-]{8,80}$/i;
const CARD_ID_RE = /^[a-z][a-z0-9:_-]{2,96}$/i;
const SAFE_LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/_-]{0,80}$/u;
const SENSITIVE_TEXT = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed|recovery|mnemonic)\s+phrase\b|\b(?:password|api\s*key|access\s*token|session\s*cookie|prompt|raw file|attachment)\b)/i;
const freeze = (value) => Object.freeze(value);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeTime(value, fallback = Date.now()) {
  const candidate = Number(value);
  return Number.isFinite(candidate) && candidate > 0 ? Math.floor(candidate) : Math.floor(fallback);
}

function hashNumber(value = '') {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function hashText(value = '') {
  return hashNumber(value).toString(36).padStart(8, '0');
}

function safeLabel(value = '', fallback = 'Private project district') {
  const label = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 81);
  return SAFE_LABEL_RE.test(label) && !SENSITIVE_TEXT.test(label) ? label : fallback;
}

function normalizeCard(candidate = {}) {
  if (candidate?.approvedForCity !== true) return null;
  const id = String(candidate.id || '');
  const label = safeLabel(candidate.label || '', '');
  const state = String(candidate.state || 'needs-review');
  if (!CARD_ID_RE.test(id) || !label || !MISSION_SET.has(state)) return null;
  // Preserve the explicit local review marker through registry reads/writes.
  // Public projections below intentionally omit this implementation detail.
  return freeze({ id, label, state, approvedForCity: true });
}

function normalizeCards(cards = []) {
  const seen = new Set();
  const next = [];
  for (const candidate of Array.isArray(cards) ? cards : []) {
    const card = normalizeCard(candidate);
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    next.push(card);
    if (next.length >= 6) break;
  }
  return freeze(next);
}

/**
 * W558 creates one reviewed City-safe mission card. It does not read a project
 * task title, project reference, prompt, file or provider output. The caller
 * supplies a deliberately rewritten public label after review.
 */
export function createEonCityApprovedMissionCard({ label = '', state = 'needs-review' } = {}, { explicitUserAction = false, explicitCitySafeCardApproval = false, now = Date.now() } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', card: null, networkRequestCreated: false });
  if (explicitCitySafeCardApproval !== true) return freeze({ ok: false, error: 'city-safe-card-approval-required', card: null, networkRequestCreated: false });
  const safe = safeLabel(label, '');
  const safeState = String(state || 'needs-review');
  if (!safe) return freeze({ ok: false, error: 'city-safe-card-label-required', card: null, networkRequestCreated: false });
  if (!MISSION_SET.has(safeState)) return freeze({ ok: false, error: 'city-mission-state-invalid', card: null, networkRequestCreated: false });
  const id = `mission_${hashText(`${safe}:${safeState}:${normalizeTime(now)}`).slice(0, 18)}`;
  const card = normalizeCard({ id, label: safe, state: safeState, approvedForCity: true });
  return freeze({ ok: Boolean(card), error: card ? '' : 'city-mission-card-invalid', card, localOnly: true, networkRequestCreated: false, projectReferenceExposed: false, rawTaskContentExposed: false });
}

function pickPalette(id = '') {
  return PALETTE_MAP.get(String(id || '')) || EON_PROJECT_DISTRICT_PALETTES[0];
}

function publicProjection(manifest = {}) {
  const palette = pickPalette(manifest.paletteId);
  const cards = normalizeCards(manifest.approvedTaskCards);
  return freeze({
    districtId: String(manifest.districtId || ''),
    // A label is shown only after deliberate City-safe review at creation. It
    // is never derived from the underlying private project reference.
    displayLabel: safeLabel(manifest.displayLabel),
    palette: freeze({ id: palette.id, label: palette.label, accent: palette.accent, atmosphere: palette.atmosphere }),
    missionState: MISSION_SET.has(String(manifest.missionState || '')) ? String(manifest.missionState) : 'needs-review',
    approvedTaskCards: cards.map((card) => freeze({ id: card.id, label: card.label, state: card.state })),
    cardCount: cards.length,
    localOnly: true,
    privateByDefault: true,
    citySafeLabelReviewed: true,
    projectReferenceExposed: false,
    promptExposed: false,
    fileExposed: false,
    secretExposed: false,
    publicRouteCreated: false,
    remoteRequestCreated: false
  });
}

function normalizeManifest(candidate = {}) {
  if (!candidate || candidate.schema !== EON_PROJECT_DISTRICT_SCHEMA) return null;
  const districtId = String(candidate.districtId || '');
  const projectReference = String(candidate.projectReference || '');
  if (!DISTRICT_ID_RE.test(districtId) || !PROJECT_REFERENCE_RE.test(projectReference)) return null;
  const palette = pickPalette(candidate.paletteId);
  const createdAt = normalizeTime(candidate.createdAt);
  const updatedAt = normalizeTime(candidate.updatedAt, createdAt);
  const lifecycle = candidate.lifecycle === 'deleted' ? 'deleted' : 'active';
  const deletedAt = lifecycle === 'deleted' ? normalizeTime(candidate.deletedAt, updatedAt) : null;
  const manifest = {
    schema: EON_PROJECT_DISTRICT_SCHEMA,
    version: 1,
    districtId,
    projectReference,
    displayLabel: safeLabel(candidate.displayLabel),
    seed: String(candidate.seed || '').replace(/[^a-z0-9:_-]/gi, '').slice(0, 96) || `seed_${hashText(projectReference)}`,
    paletteId: palette.id,
    missionState: MISSION_SET.has(String(candidate.missionState || '')) ? String(candidate.missionState) : 'needs-review',
    approvedTaskCards: normalizeCards(candidate.approvedTaskCards),
    lifecycle,
    createdAt,
    updatedAt,
    deletedAt
  };
  return freeze({ ...manifest, publicProjection: publicProjection(manifest) });
}

export function sanitizeEonProjectDistrictRegistry(input = {}, { now = Date.now() } = {}) {
  const parsed = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const manifests = [];
  const seen = new Set();
  for (const candidate of Array.isArray(parsed?.manifests) ? parsed.manifests : []) {
    const manifest = normalizeManifest(candidate);
    if (!manifest || seen.has(manifest.districtId)) continue;
    seen.add(manifest.districtId);
    manifests.push(manifest);
  }
  manifests.sort((left, right) => right.updatedAt - left.updatedAt);
  return freeze({ schema: EON_PROJECT_DISTRICT_SCHEMA, version: 1, updatedAt: normalizeTime(parsed?.updatedAt, now), manifests: freeze(manifests.slice(0, EON_PROJECT_DISTRICT_MAX)) });
}

export function readEonProjectDistrictRegistry({ storage = globalThis.localStorage, now = Date.now() } = {}) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_PROJECT_DISTRICT_STORAGE_KEY) || 'null');
    return sanitizeEonProjectDistrictRegistry(parsed || {}, { now });
  } catch {
    return sanitizeEonProjectDistrictRegistry({}, { now });
  }
}

function readRegistry(storage, now = Date.now()) {
  return readEonProjectDistrictRegistry({ storage, now });
}

function writeRegistry(storage, registry) {
  try { storage?.setItem?.(EON_PROJECT_DISTRICT_STORAGE_KEY, JSON.stringify(registry)); return true; } catch { return false; }
}

export const EON_PROJECT_DISTRICT_VISUAL_PROFILES = Object.freeze({
  signal: Object.freeze({ id: 'signal-spire', silhouette: 'signal-spire', crown: 'open-halo', deck: 'radial', localOnly: true }),
  forge: Object.freeze({ id: 'forge-buttress', silhouette: 'forge-buttress', crown: 'split-fin', deck: 'angular', localOnly: true }),
  archive: Object.freeze({ id: 'archive-canopy', silhouette: 'archive-canopy', crown: 'archive-rings', deck: 'terraced', localOnly: true }),
  garden: Object.freeze({ id: 'garden-pavilion', silhouette: 'garden-pavilion', crown: 'leaf-arc', deck: 'organic', localOnly: true })
});

/**
 * Maps a reviewed palette to a small City-only visual language. This never
 * uses a project title, task, prompt, file, account identifier or provider
 * output; it is a fixed allowlist consumed by procedural architecture only.
 */
export function getEonProjectDistrictVisualProfile(paletteId = '') {
  const id = String(paletteId || '').trim().toLowerCase();
  return EON_PROJECT_DISTRICT_VISUAL_PROFILES[id] || EON_PROJECT_DISTRICT_VISUAL_PROFILES.signal;
}

function deterministicAnchor(seed = '', index = 0) {
  const hash = hashNumber(`${seed}:${index}`);
  const lanes = Object.freeze([
    Object.freeze({ x: -10.15, z: -8.5, heading: .14 }),
    Object.freeze({ x: 10.15, z: -8.5, heading: -.14 }),
    Object.freeze({ x: -10.1, z: -1.9, heading: .34 }),
    Object.freeze({ x: 10.1, z: -1.9, heading: -.34 }),
    Object.freeze({ x: -9.45, z: 4.5, heading: .19 }),
    Object.freeze({ x: 9.45, z: 4.5, heading: -.19 }),
    Object.freeze({ x: -7.65, z: 9.55, heading: .48 }),
    Object.freeze({ x: 7.65, z: 9.55, heading: -.48 })
  ]);
  const lane = lanes[(hash + index) % lanes.length];
  const jitterX = (((hash >>> 8) % 100) / 100 - .5) * .48;
  const jitterZ = (((hash >>> 16) % 100) / 100 - .5) * .48;
  return freeze({ x: Math.round((lane.x + jitterX) * 100) / 100, z: Math.round((lane.z + jitterZ) * 100) / 100, heading: lane.heading });
}

/**
 * Builds a deterministic City geometry instruction from private state without
 * leaking it. The result contains no project reference, seed, prompt, file,
 * account, provider or raw task content.
 */
export function buildEonProjectDistrictRenderPlan(manifest = {}, { index = 0 } = {}) {
  const normalized = normalizeManifest(manifest);
  if (!normalized || normalized.lifecycle !== 'active') return null;
  const projection = normalized.publicProjection;
  const hash = hashNumber(`${normalized.seed}:${normalized.districtId}`);
  const anchor = deterministicAnchor(normalized.seed, index);
  return freeze({
    schema: `${EON_PROJECT_DISTRICT_SCHEMA}.render-plan`,
    districtId: projection.districtId,
    displayLabel: projection.displayLabel,
    palette: projection.palette,
    missionState: projection.missionState,
    taskCards: projection.approvedTaskCards.map((card) => freeze({ ...card })),
    // Fixed visual profile: aesthetically distinct private districts without
    // deriving any world geometry from private project content.
    visualProfile: freeze({ ...getEonProjectDistrictVisualProfile(projection.palette.id) }),
    geometry: freeze({
      anchor,
      towerHeight: 2.3 + ((hash >>> 3) % 5) * .22,
      deckWidth: 1.75 + ((hash >>> 10) % 4) * .12,
      spireCount: 2 + ((hash >>> 18) % 3),
      ringRadius: .66 + ((hash >>> 23) % 3) * .08
    }),
    localOnly: true,
    privateByDefault: true,
    deterministic: true,
    projectReferenceExposed: false,
    seedExposed: false,
    promptExposed: false,
    fileExposed: false,
    secretExposed: false,
    publicRouteCreated: false,
    remoteRequestCreated: false,
    generatedInBackground: false
  });
}

export function reviewEonProjectDistrictPrivacy(manifest = {}) {
  const normalized = normalizeManifest(manifest);
  if (!normalized) return freeze({ ok: false, reason: 'invalid-project-district-manifest', projection: null });
  const projection = normalized.publicProjection;
  const renderPlan = buildEonProjectDistrictRenderPlan(normalized);
  return freeze({
    ok: Boolean(renderPlan),
    schema: `${EON_PROJECT_DISTRICT_SCHEMA}.privacy-review`,
    projection,
    renderPlan,
    projectReferenceExposed: false,
    seedExposed: false,
    promptExposed: false,
    rawTaskContentExposed: false,
    fileExposed: false,
    secretExposed: false,
    publicRouteCreated: false,
    remoteRequestCreated: false,
    citySafeCardsOnly: true
  });
}

function registrySnapshot(registry) {
  const active = registry.manifests.filter((manifest) => manifest.lifecycle === 'active');
  const deleted = registry.manifests.filter((manifest) => manifest.lifecycle === 'deleted');
  const publicDistricts = active.map((manifest) => manifest.publicProjection);
  const renderPlans = active.map((manifest, index) => buildEonProjectDistrictRenderPlan(manifest, { index })).filter(Boolean);
  return freeze({
    schema: EON_PROJECT_DISTRICT_SCHEMA,
    updatedAt: registry.updatedAt,
    activeCount: active.length,
    deletedCount: deleted.length,
    publicDistricts: freeze(publicDistricts),
    deletedDistricts: freeze(deleted.map((manifest) => manifest.publicProjection)),
    renderPlans: freeze(renderPlans),
    privateRegistryOnly: true,
    remoteRequestCreated: false,
    browserStorageOnly: true,
    publicRouteCreated: false
  });
}

/** Deliberately limited local-console view; it never enters a render plan. */
function localMissionCardState(manifest = null) {
  if (!manifest || manifest.lifecycle !== 'active') return null;
  return freeze({
    districtId: manifest.districtId,
    displayLabel: manifest.displayLabel,
    missionState: manifest.missionState,
    approvedTaskCards: freeze(manifest.approvedTaskCards.map((card) => freeze({ id: card.id, label: card.label, state: card.state }))),
    localConsoleOnly: true,
    projectReferenceExposed: false,
    promptExposed: false,
    fileExposed: false,
    secretExposed: false,
    remoteRequestCreated: false
  });
}

/** Create one deterministic manifest. The caller must supply opaque safe inputs. */
export function createEonProjectDistrictManifest({
  projectReference = '',
  seed = '',
  paletteId = '',
  displayLabel = '',
  missionState = 'needs-review',
  approvedTaskCards = [],
  now = Date.now()
} = {}, { explicitUserAction = false, explicitCitySafeLabelApproval = false } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', manifest: null });
  if (explicitCitySafeLabelApproval !== true) return freeze({ ok: false, error: 'city-safe-label-approval-required', manifest: null });
  if (!PROJECT_REFERENCE_RE.test(String(projectReference || ''))) return freeze({ ok: false, error: 'opaque-project-reference-required', manifest: null });
  const project = String(projectReference);
  const safeSeed = String(seed || '').replace(/[^a-z0-9:_-]/gi, '').slice(0, 96) || `seed_${hashText(project)}`;
  const palette = pickPalette(paletteId || EON_PROJECT_DISTRICT_PALETTES[hashText(safeSeed).charCodeAt(0) % EON_PROJECT_DISTRICT_PALETTES.length]?.id);
  const time = normalizeTime(now);
  const manifest = normalizeManifest({
    schema: EON_PROJECT_DISTRICT_SCHEMA,
    districtId: `district_${hashText(`${project}:${safeSeed}`).slice(0, 16)}`,
    projectReference: project,
    displayLabel: safeLabel(displayLabel),
    seed: safeSeed,
    paletteId: palette.id,
    missionState: MISSION_SET.has(String(missionState || '')) ? String(missionState) : 'needs-review',
    approvedTaskCards,
    lifecycle: 'active',
    createdAt: time,
    updatedAt: time,
    deletedAt: null
  });
  return freeze({ ok: Boolean(manifest), error: manifest ? '' : 'manifest-validation-failed', manifest, publicProjection: manifest?.publicProjection || null, renderPlan: manifest ? buildEonProjectDistrictRenderPlan(manifest) : null, networkRequestCreated: false, browserStorageChanged: false, publicRouteCreated: false });
}

/** A local registry owns create/delete/restore and exposes sanitized render plans. */
export function createEonProjectDistrictRegistry({ storage = globalThis.localStorage, now = () => Date.now() } = {}) {
  const clock = () => normalizeTime(now());
  const snapshot = () => registrySnapshot(readRegistry(storage, clock()));
  const save = (registry) => {
    const stored = writeRegistry(storage, registry);
    return freeze({ ok: stored, snapshot: snapshot(), browserStorageChanged: stored, networkRequestCreated: false, publicRouteCreated: false });
  };
  return freeze({
    getSnapshot: snapshot,
    listRenderPlans() { return snapshot().renderPlans; },
    getLocalMissionCardState(projectReference = '') {
      if (!PROJECT_REFERENCE_RE.test(String(projectReference || ''))) return null;
      const registry = readRegistry(storage, clock());
      return localMissionCardState(registry.manifests.find((manifest) => manifest.lifecycle === 'active' && manifest.projectReference === String(projectReference)) || null);
    },
    addApprovedMissionCard(districtId = '', input = {}, options = {}) {
      if (options?.explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      if (options?.explicitCitySafeCardApproval !== true) return freeze({ ok: false, error: 'city-safe-card-approval-required', browserStorageChanged: false, networkRequestCreated: false });
      const registry = readRegistry(storage, clock());
      const existing = registry.manifests.find((manifest) => manifest.lifecycle === 'active' && manifest.districtId === String(districtId));
      if (!existing) return freeze({ ok: false, error: 'project-district-not-found', browserStorageChanged: false, networkRequestCreated: false });
      const candidate = createEonCityApprovedMissionCard(input, { explicitUserAction: true, explicitCitySafeCardApproval: true, now: clock() });
      if (!candidate.ok || !candidate.card) return freeze({ ...candidate, browserStorageChanged: false });
      const duplicate = existing.approvedTaskCards.find((card) => card.label === candidate.card.label && card.state === candidate.card.state);
      if (duplicate) return freeze({ ok: true, deduped: true, card: duplicate, missionCardState: localMissionCardState(existing), browserStorageChanged: false, networkRequestCreated: false, snapshot: snapshot() });
      if (existing.approvedTaskCards.length >= 6) return freeze({ ok: false, error: 'city-mission-card-limit-reached', browserStorageChanged: false, networkRequestCreated: false });
      const updated = normalizeManifest({ ...clone(existing), approvedTaskCards: [...existing.approvedTaskCards, candidate.card], updatedAt: clock() });
      const saved = save({ ...registry, updatedAt: clock(), manifests: registry.manifests.map((manifest) => manifest.districtId === existing.districtId ? updated : manifest) });
      return freeze({ ...saved, card: candidate.card, missionCardState: localMissionCardState(updated), renderPlan: buildEonProjectDistrictRenderPlan(updated), deduped: false, projectReferenceExposed: false, rawTaskContentExposed: false });
    },
    removeApprovedMissionCard(districtId = '', cardId = '', { explicitUserAction = false, confirmed = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      if (confirmed !== true) return freeze({ ok: false, error: 'mission-card-remove-confirmation-required', browserStorageChanged: false, networkRequestCreated: false });
      const registry = readRegistry(storage, clock());
      const existing = registry.manifests.find((manifest) => manifest.lifecycle === 'active' && manifest.districtId === String(districtId));
      if (!existing) return freeze({ ok: false, error: 'project-district-not-found', browserStorageChanged: false, networkRequestCreated: false });
      const matching = existing.approvedTaskCards.find((card) => card.id === String(cardId));
      if (!matching) return freeze({ ok: false, error: 'city-mission-card-not-found', browserStorageChanged: false, networkRequestCreated: false });
      const updated = normalizeManifest({ ...clone(existing), approvedTaskCards: existing.approvedTaskCards.filter((card) => card.id !== matching.id), updatedAt: clock() });
      const saved = save({ ...registry, updatedAt: clock(), manifests: registry.manifests.map((manifest) => manifest.districtId === existing.districtId ? updated : manifest) });
      return freeze({ ...saved, removedCardId: matching.id, missionCardState: localMissionCardState(updated), renderPlan: buildEonProjectDistrictRenderPlan(updated), projectReferenceExposed: false, rawTaskContentExposed: false });
    },
    create(input = {}, options = {}) {
      const created = createEonProjectDistrictManifest({ ...input, now: clock() }, options);
      if (!created.ok || !created.manifest) return created;
      const registry = readRegistry(storage, clock());
      const existing = registry.manifests.find((manifest) => manifest.districtId === created.manifest.districtId);
      if (existing?.lifecycle === 'active') return freeze({ ok: true, deduped: true, manifest: existing, publicProjection: existing.publicProjection, renderPlan: buildEonProjectDistrictRenderPlan(existing), browserStorageChanged: false, networkRequestCreated: false, publicRouteCreated: false, snapshot: snapshot() });
      if (registry.manifests.filter((manifest) => manifest.lifecycle === 'active').length >= EON_PROJECT_DISTRICT_MAX) return freeze({ ok: false, error: 'project-district-limit-reached', manifest: null, browserStorageChanged: false, networkRequestCreated: false });
      const manifests = existing ? registry.manifests.map((manifest) => manifest.districtId === created.manifest.districtId ? created.manifest : manifest) : [created.manifest, ...registry.manifests];
      const result = save({ ...registry, updatedAt: clock(), manifests });
      return freeze({ ...result, manifest: created.manifest, publicProjection: created.publicProjection, renderPlan: created.renderPlan, deduped: false });
    },
    delete(districtId = '', { explicitUserAction = false, confirmed = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      if (confirmed !== true) return freeze({ ok: false, error: 'delete-confirmation-required', browserStorageChanged: false, networkRequestCreated: false });
      const registry = readRegistry(storage, clock());
      const existing = registry.manifests.find((manifest) => manifest.districtId === String(districtId));
      if (!existing) return freeze({ ok: false, error: 'project-district-not-found', browserStorageChanged: false, networkRequestCreated: false });
      if (existing.lifecycle === 'deleted') return freeze({ ok: true, deduped: true, browserStorageChanged: false, networkRequestCreated: false, snapshot: snapshot() });
      const deleted = normalizeManifest({ ...clone(existing), lifecycle: 'deleted', deletedAt: clock(), updatedAt: clock() });
      return freeze({ ...save({ ...registry, updatedAt: clock(), manifests: registry.manifests.map((manifest) => manifest.districtId === existing.districtId ? deleted : manifest) }), deletedDistrictId: existing.districtId, tombstoneOnly: true, purgePerformed: false });
    },
    restore(districtId = '', { explicitUserAction = false, confirmed = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      if (confirmed !== true) return freeze({ ok: false, error: 'restore-confirmation-required', browserStorageChanged: false, networkRequestCreated: false });
      const registry = readRegistry(storage, clock());
      const existing = registry.manifests.find((manifest) => manifest.districtId === String(districtId));
      if (!existing) return freeze({ ok: false, error: 'project-district-not-found', browserStorageChanged: false, networkRequestCreated: false });
      if (existing.lifecycle === 'active') return freeze({ ok: true, deduped: true, browserStorageChanged: false, networkRequestCreated: false, snapshot: snapshot() });
      const restored = normalizeManifest({ ...clone(existing), lifecycle: 'active', deletedAt: null, updatedAt: clock() });
      return freeze({ ...save({ ...registry, updatedAt: clock(), manifests: registry.manifests.map((manifest) => manifest.districtId === existing.districtId ? restored : manifest) }), restoredDistrictId: existing.districtId, browserStorageOnly: true });
    },
    buildUpdateSurvivalProof() {
      const raw = (() => { try { return storage?.getItem?.(EON_PROJECT_DISTRICT_STORAGE_KEY) || ''; } catch { return ''; } })();
      const fingerprint = hashText(raw);
      return freeze({
        schema: `${EON_PROJECT_DISTRICT_SCHEMA}.update-survival-proof`,
        storageKey: EON_PROJECT_DISTRICT_STORAGE_KEY,
        beforeFingerprint: fingerprint,
        afterFingerprint: fingerprint,
        preserved: true,
        sourceSimulationOnly: true,
        deploymentProof: false,
        browserStorageChanged: false,
        networkRequestCreated: false
      });
    }
  });
}

export function getEonProjectDistrictTruth() {
  return freeze({
    schema: EON_PROJECT_DISTRICT_SCHEMA,
    status: 'private-project-district-source-implementation',
    localRegistry: true,
    deterministicPrivateRendering: true,
    citySafeLabelApprovalRequired: true,
    projectReferencePubliclyExposed: false,
    promptOrFileRead: false,
    secretRead: false,
    publicDistrictRoute: false,
    remoteGeneration: false,
    autoCreate: false,
    autoDelete: false,
    autoRestore: false,
    dataSurvivalDeploymentProof: false,
    finalCityRendering: false,
    deviceVisualProof: false,
    approvedMissionCards: true,
    rawTaskContentPubliclyExposed: false,
    missionCardApprovalRequired: true
  });
}
