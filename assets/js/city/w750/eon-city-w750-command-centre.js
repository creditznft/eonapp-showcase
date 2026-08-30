/**
 * W750 — Command Centre live walls and genuine Agent Theatre projection.
 *
 * This presenter owns no projects, tasks, providers, jobs or results. It joins
 * the W749 privacy-projected Nexus view with the W624H truthful status cards and
 * W624I genuine receipt theatre, then renders five review-first City walls.
 */
import { EON_CITY_W749_VIEW_EVENT } from '../w749/eon-city-w749-living-nexus.js';

export const EON_CITY_W750_COMMAND_CENTRE_SCHEMA = 'eon.city.command-centre-live-walls.w750.v1';
export const EON_CITY_W750_VIEW_EVENT = 'eon:city-w750-command-centre-view-changed';
export const EON_CITY_W750_WALL_IDS = Object.freeze(['work', 'review', 'systems', 'atlas-transit', 'agent-theatre']);
export const EON_CITY_W750_WALL_LAYOUT = Object.freeze([
  Object.freeze({ id: 'work', x: 0, y: 3.25, z: -2.6, width: 5.55, height: 3.2, central: true, textureWidth: 1024, textureHeight: 576 }),
  Object.freeze({ id: 'review', x: -4.95, y: 4.58, z: -1.95, width: 4.05, height: 2.45, textureWidth: 896, textureHeight: 504 }),
  Object.freeze({ id: 'systems', x: -4.95, y: 1.98, z: -1.95, width: 4.05, height: 2.45, textureWidth: 896, textureHeight: 504 }),
  Object.freeze({ id: 'atlas-transit', x: 4.95, y: 4.58, z: -1.95, width: 4.05, height: 2.45, textureWidth: 896, textureHeight: 504 }),
  Object.freeze({ id: 'agent-theatre', x: 4.95, y: 1.98, z: -1.95, width: 4.05, height: 2.45, textureWidth: 896, textureHeight: 504 })
]);

const freeze = (value) => Object.freeze(value);
// This explicitly strips C0/DEL from display-safe text.
// eslint-disable-next-line no-control-regex
const cleanText = (value = '', max = 220) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanId = (value = '', fallback = '') => cleanText(value, 120).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 120) || fallback;
const bounded = (value, max = 9999) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
const safeRead = (reader, fallback) => {
  try { return (typeof reader === 'function' ? reader() : fallback) ?? fallback; }
  catch { return fallback; }
};

const WALL_DEFINITIONS = freeze({
  work: freeze({
    label: 'Projects & Tasks', shortLabel: 'Work', surface: 'projects', accent: 'cyan',
    purpose: 'Continue selected work and review the current foreground task.',
    truthBoundary: 'Only bounded counts, safe labels and finite task state are projected. Project contents and files remain on maintained surfaces.'
  }),
  review: freeze({
    label: 'Approvals & Results', shortLabel: 'Review', surface: 'automations', accent: 'amber',
    purpose: 'Review waiting decisions and verified result counts before any action.',
    truthBoundary: 'The wall cannot approve, retry, publish or execute. Every mutation remains an explicit native action.'
  }),
  systems: freeze({
    label: 'Providers & Systems', shortLabel: 'Systems', surface: 'local-ai', accent: 'mint',
    purpose: 'Inspect provider, device, billing and recovery truth without exposing secrets.',
    truthBoundary: 'Credentials, endpoints, payment records, account identifiers and backup contents are never projected into City.'
  }),
  'atlas-transit': freeze({
    label: 'Atlas & Transit', shortLabel: 'Atlas', surface: 'nexus', accent: 'violet',
    purpose: 'Orient selected work across the bounded City and review travel choices.',
    truthBoundary: 'The wall does not move the player, open the Expanse or navigate automatically. Travel remains an explicit reviewed choice.'
  }),
  'agent-theatre': freeze({
    label: 'Genuine Agent Theatre', shortLabel: 'Theatre', surface: 'automations', accent: 'magenta',
    purpose: 'Project genuine bounded job receipts and their real lifecycle only.',
    truthBoundary: 'No receipt means a still empty stage. No simulated workers, invented progress, hidden execution or provider call is allowed.'
  })
});

function byId(entries = []) {
  return new Map((Array.isArray(entries) ? entries : []).map((entry) => [String(entry?.id || ''), entry]));
}

function severity(entries = []) {
  const states = (entries || []).map((entry) => String(entry?.state || ''));
  if (states.some((state) => ['error', 'failed', 'offline'].includes(state))) return 'error';
  if (states.some((state) => ['stale', 'unavailable', 'waiting-for-user', 'paused'].includes(state))) return 'warning';
  if (states.some((state) => ['current', 'running', 'preparing', 'queued'].includes(state))) return 'active';
  return 'empty';
}

function wall(id, options = {}) {
  const definition = WALL_DEFINITIONS[id];
  const cards = freeze((Array.isArray(options.cards) ? options.cards : []).map((entry) => freeze({
    id: cleanId(entry?.id, 'status'),
    label: cleanText(entry?.label || entry?.id || 'Status', 100),
    state: cleanId(entry?.state, 'empty'),
    summary: cleanText(entry?.summary || '', 220),
    count: bounded(entry?.count),
    source: cleanText(entry?.source || '', 140),
    authority: cleanText(entry?.authority || '', 100),
    freshness: entry?.freshness ? freeze({ state: cleanId(entry.freshness.state, 'unknown'), label: cleanText(entry.freshness.label || '', 100), ageMs: Number.isFinite(Number(entry.freshness.ageMs)) ? Math.max(0, Number(entry.freshness.ageMs)) : null }) : null
  })));
  return freeze({
    id,
    ...definition,
    state: options.state || severity(cards),
    headline: cleanText(options.headline || definition.purpose, 160),
    detail: cleanText(options.detail || '', 260),
    count: bounded(options.count),
    cards,
    jobs: freeze((Array.isArray(options.jobs) ? options.jobs : []).slice(0, 8).map((job) => freeze({
      jobId: cleanId(job?.jobId, 'job'),
      state: cleanId(job?.state, 'queued'),
      jobType: cleanText(job?.jobType || 'Job', 100),
      sourceSurface: cleanText(job?.sourceSurface || 'unknown', 80),
      railLabel: cleanText(job?.railLabel || job?.rail || 'Unavailable', 80),
      updatedAt: cleanText(job?.updatedAt || '', 64),
      authoritativeProgress: job?.authoritativeProgress === true,
      progress: job?.authoritativeProgress === true && Number.isFinite(Number(job?.progress)) ? Math.max(0, Math.min(100, Number(job.progress))) : null,
      resultReceiptId: cleanId(job?.resultReceiptId || '', ''),
      failureCode: cleanId(job?.failureCode || '', '')
    }))),
    selectedJobId: cleanId(options.selectedJobId || '', ''),
    explicitUserActionRequired: true,
    autoNavigate: false,
    autoExecute: false,
    readsPrivateWork: false
  });
}

export function projectEonCityW750CommandCentreView({ nexusView = {}, commandSnapshot = {}, theatreSnapshot = {}, districtCount = 9 } = {}) {
  const rings = byId(nexusView?.rings);
  const cards = byId(commandSnapshot?.cards);
  const jobs = Array.isArray(theatreSnapshot?.jobs) ? theatreSnapshot.jobs : [];
  const activeJobs = jobs.filter((job) => ['queued', 'preparing', 'waiting-for-user', 'running', 'paused'].includes(String(job?.state || '')));
  const completedJobs = jobs.filter((job) => String(job?.state || '') === 'completed');
  const failedJobs = jobs.filter((job) => String(job?.state || '') === 'failed');
  const projectRing = rings.get('project') || {};
  const taskRing = rings.get('task') || {};
  const approvalRing = rings.get('approval') || {};
  const systemsRing = rings.get('systems') || {};
  const resultsRing = rings.get('results') || {};
  const projectCard = cards.get('projects') || null;
  const jobsCard = cards.get('jobs') || null;
  const outcomeCard = cards.get('outcomes') || null;
  const systemCards = ['ai-runtime', 'billing', 'backup'].map((id) => cards.get(id)).filter(Boolean);

  const walls = freeze([
    wall('work', {
      state: taskRing.failed ? 'error' : taskRing.warning ? 'warning' : (projectRing.active || taskRing.active ? 'active' : 'empty'),
      count: bounded(projectCard?.count) + bounded(taskRing.count),
      headline: projectRing.shortLabel || 'No project selected',
      detail: taskRing.detail || 'No foreground task is currently projected.',
      cards: [projectCard, { id: 'foreground-task', label: taskRing.label || 'Current task', state: taskRing.failed ? 'error' : taskRing.warning ? 'stale' : taskRing.active ? 'current' : 'empty', summary: taskRing.detail || 'No foreground task is projected.', count: taskRing.count, source: taskRing.source, authority: 'w749-privacy-projection' }].filter(Boolean)
    }),
    wall('review', {
      state: approvalRing.warning ? 'warning' : resultsRing.warning ? 'warning' : (approvalRing.active || resultsRing.active ? 'active' : 'empty'),
      count: bounded(approvalRing.count) + bounded(resultsRing.count),
      headline: approvalRing.shortLabel || 'No approval waiting',
      detail: resultsRing.detail || 'No verified result count is projected.',
      cards: [
        { id: 'approvals', label: approvalRing.label || 'Approvals', state: approvalRing.warning ? 'stale' : approvalRing.active ? 'current' : 'empty', summary: approvalRing.detail || '', count: approvalRing.count, source: approvalRing.source, authority: 'w749-privacy-projection' },
        { id: 'results', label: resultsRing.label || 'Results', state: resultsRing.warning ? 'stale' : resultsRing.active ? 'current' : 'empty', summary: resultsRing.detail || '', count: resultsRing.count, source: resultsRing.source, authority: 'w749-privacy-projection' },
        outcomeCard
      ].filter(Boolean)
    }),
    wall('systems', {
      state: systemsRing.failed ? 'error' : systemsRing.warning ? 'warning' : systemsRing.active ? 'active' : severity(systemCards),
      count: systemCards.reduce((sum, entry) => sum + bounded(entry?.count), 0),
      headline: systemsRing.shortLabel || 'Guide mode',
      detail: systemsRing.detail || 'System readiness is unavailable.',
      cards: systemCards
    }),
    wall('atlas-transit', {
      state: nexusView?.workObject?.present ? 'active' : 'empty',
      count: Math.max(0, Number(districtCount) || 0),
      headline: nexusView?.workObject?.present ? nexusView.workObject.label : 'No selected work object',
      detail: nexusView?.workObject?.present ? nexusView.workObject.placementReason : `${Math.max(0, Number(districtCount) || 0)} bounded City destinations are available; Expanse remains closed.`,
      cards: [{ id: 'city-destinations', label: 'Bounded City destinations', state: 'current', summary: 'Atlas and transit remain review-first. The wider Expanse is visible but inactive.', count: Math.max(0, Number(districtCount) || 0), source: 'w731-command-hub-contract', authority: 'local-static-contract' }]
    }),
    wall('agent-theatre', {
      state: failedJobs.length ? 'error' : activeJobs.length ? 'active' : completedJobs.length ? 'active' : 'empty',
      count: jobs.length,
      headline: jobs.length ? `${jobs.length} genuine job receipt${jobs.length === 1 ? '' : 's'}` : 'The stage is still',
      detail: jobs.length ? `${activeJobs.length} active or waiting · ${completedJobs.length} completed · ${failedJobs.length} failed` : theatreSnapshot?.emptyMessage || 'No genuine job receipt is present. The Theatre remains still.',
      cards: [jobsCard].filter(Boolean),
      jobs,
      selectedJobId: theatreSnapshot?.selectedJobId || ''
    })
  ]);

  return freeze({
    schema: EON_CITY_W750_COMMAND_CENTRE_SCHEMA,
    title: 'Living Command Centre',
    summary: 'Five real walls, one central Nexus and one maintained City Dock.',
    walls,
    selectedWallId: walls.find((entry) => entry.state === 'error')?.id || walls.find((entry) => entry.state === 'warning')?.id || walls.find((entry) => entry.state === 'active')?.id || 'work',
    nexusState: cleanId(nexusView?.state, 'ready'),
    nexusFreshness: nexusView?.freshness || null,
    commandSchema: cleanText(commandSnapshot?.schema || '', 100),
    theatreSchema: cleanText(theatreSnapshot?.schema || '', 100),
    privacy: freeze({ rawPrompts: false, rawOutputs: false, rawProjectContents: false, rawFiles: false, providerCredentials: false, paymentRecords: false, accountIdentifiers: false }),
    truth: freeze({ ownsProductState: false, ownsJobFabric: false, startsWork: false, startsProvider: false, mutatesBilling: false, autoNavigate: false, fakeWorkers: false, inventedProgress: false })
  });
}

export function getEonCityW750Wall(view = {}, id = '') {
  return (Array.isArray(view?.walls) ? view.walls : []).find((entry) => entry.id === String(id || '')) || null;
}

export function validateEonCityW750CommandCentreContract() {
  const sample = projectEonCityW750CommandCentreView({
    nexusView: {
      state: 'waiting-approval',
      workObject: { present: true, label: 'Selected brief', placementReason: 'Continue in Project Atlas.' },
      rings: [
        { id: 'project', label: 'Project', shortLabel: 'Project selected', active: true, count: 2, source: 'nexus', detail: 'Two bounded items.' },
        { id: 'task', label: 'Task', shortLabel: 'Review task', warning: true, count: 1, source: 'nexus', detail: 'Review needed.' },
        { id: 'approval', label: 'Approvals', shortLabel: 'One approval', warning: true, active: true, count: 1, source: 'nexus', detail: 'Review required.' },
        { id: 'systems', label: 'Systems', shortLabel: 'Local runtime', active: true, count: 1, source: 'nexus', detail: 'Available.' },
        { id: 'results', label: 'Results', shortLabel: 'One result', active: true, count: 1, source: 'nexus', detail: 'One unread.' }
      ]
    },
    commandSnapshot: { schema: 'command', cards: [
      { id: 'projects', label: 'Projects', state: 'current', count: 1, summary: 'One project.', source: 'local', authority: 'local-browser' },
      { id: 'jobs', label: 'Jobs', state: 'current', count: 1, summary: 'One receipt.', source: 'local', authority: 'bounded-local-job-receipts' },
      { id: 'outcomes', label: 'Outcomes', state: 'current', count: 1, summary: 'One outcome.', source: 'local', authority: 'bounded-local-receipts' },
      { id: 'ai-runtime', label: 'AI runtime', state: 'current', count: 1, summary: 'Verified.', source: 'local', authority: 'bounded-local-receipt' },
      { id: 'billing', label: 'Billing', state: 'loading', count: 0, summary: 'Refresh required.', source: 'server', authority: 'server-authoritative' },
      { id: 'backup', label: 'Backup', state: 'empty', count: 0, summary: 'No receipt.', source: 'local', authority: 'bounded-local-receipt' }
    ] },
    theatreSnapshot: { schema: 'theatre', jobs: [{ jobId: 'job:1', state: 'running', jobType: 'Local task', railLabel: 'Local', authoritativeProgress: false }], selectedJobId: '' },
    districtCount: 9
  });
  const errors = [];
  if (sample.schema !== EON_CITY_W750_COMMAND_CENTRE_SCHEMA) errors.push('schema');
  if (sample.walls.length !== EON_CITY_W750_WALL_IDS.length) errors.push('wall-count');
  if (!EON_CITY_W750_WALL_IDS.every((id) => sample.walls.some((wallEntry) => wallEntry.id === id))) errors.push('wall-coverage');
  if (sample.walls.find((entry) => entry.id === 'agent-theatre')?.jobs?.length !== 1) errors.push('theatre-receipts');
  if (sample.privacy.providerCredentials || sample.truth.ownsProductState || sample.truth.fakeWorkers || sample.truth.inventedProgress) errors.push('truth-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), wallCount: sample.walls.length, schema: sample.schema });
}

function pickMetadata(id) {
  return freeze({
    kind: 'w750-command-centre-wall', stationId: 'command-console', commandWallId: id,
    interactionRole: 'command-wall', interactionPart: `command-wall:${id}`,
    explicitUserActionRequired: true, automaticNavigation: false, automaticExecution: false, privateDataRead: false
  });
}

function createSafeMonitorTexture(scene, DynamicTexture, name, width = 768, height = 432) {
  if (!scene || typeof DynamicTexture !== 'function') return null;
  try {
    const texture = new DynamicTexture(String(name), { width, height }, scene, false);
    const context = texture.getContext?.();
    if (!context || typeof context.fillRect !== 'function') {
      texture.dispose?.();
      return null;
    }
    texture.hasAlpha = false;
    return texture;
  } catch {
    return null;
  }
}

function createMonitorMaterial(scene, StandardMaterial, name, texture, fallbackMaterial) {
  if (!texture || typeof StandardMaterial !== 'function') return fallbackMaterial || null;
  try {
    const material = new StandardMaterial(String(name), scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.disableLighting = true;
    material.backFaceCulling = true;
    material.twoSidedLighting = false;
    material.specularColor?.set?.(0, 0, 0);
    return material;
  } catch {
    return fallbackMaterial || null;
  }
}

function truncate(value = '', max = 88) {
  const text = cleanText(value, max + 8);
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1)).trim()}…` : text;
}

function stateLabel(state = 'empty') {
  return ({ active: 'LIVE', warning: 'REVIEW', error: 'ATTENTION', empty: 'QUIET' })[String(state || '')] || 'READY';
}

function stateColor(state = 'empty') {
  return ({ active: '#62f5d6', warning: '#ffd37b', error: '#ff8fa3', empty: '#8ea6b2' })[String(state || '')] || '#89efff';
}

function resolveWallFacing(station = {}, layout = {}) {
  const stationX = Number(station?.position?.x) || 0;
  const stationZ = Number(station?.position?.z) || 0;
  const worldX = stationX + (Number(layout?.x) || 0);
  const worldZ = stationZ + (Number(layout?.z) || 0);
  const focusX = Number(station?.focus?.x);
  const focusZ = Number(station?.focus?.z);
  const targetX = Number.isFinite(focusX) ? focusX : stationX;
  const targetZ = Number.isFinite(focusZ) ? focusZ : stationZ + 1;
  const dx = targetX - worldX;
  const dz = targetZ - worldZ;
  const distance = Math.max(0.001, Math.hypot(dx, dz));
  const yaw = Math.atan2(dx, dz);
  const frontX = Math.sin(yaw);
  const frontZ = Math.cos(yaw);
  const dot = frontX * (dx / distance) + frontZ * (dz / distance);
  return freeze({
    yaw,
    dot: Number(dot.toFixed(6)),
    worldPosition: freeze({ x: worldX, y: (Number(station?.position?.y) || 0) + (Number(layout?.y) || 0), z: worldZ }),
    focusPose: freeze({ x: targetX, y: Math.max(1.2, (Number(layout?.y) || 0) * 0.82), z: targetZ })
  });
}

export function validateEonCityW750WallPresentation({ station = {}, layout = EON_CITY_W750_WALL_LAYOUT } = {}) {
  const entries = (Array.isArray(layout) ? layout : []).map((entry) => {
    const facing = resolveWallFacing(station, entry);
    return freeze({ id: entry.id, width: entry.width, height: entry.height, central: entry.central === true, facingDot: facing.dot, yaw: facing.yaw });
  });
  const central = entries.find((entry) => entry.central);
  const sideEntries = entries.filter((entry) => !entry.central);
  const sideHeightRatios = sideEntries.map((entry) => central?.height ? entry.height / central.height : 0);
  const errors = [];
  if (entries.length !== 5) errors.push('five-wall-layout-required');
  if (!central) errors.push('central-wall-required');
  if (sideHeightRatios.some((ratio) => ratio < 0.7 || ratio > 0.8)) errors.push('side-wall-height-ratio');
  if (entries.some((entry) => entry.facingDot < 0.985)) errors.push('wall-facing');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    wallCount: entries.length,
    minimumFacingDot: entries.length ? Math.min(...entries.map((entry) => entry.facingDot)) : -1,
    sideHeightRatios: freeze(sideHeightRatios.map((ratio) => Number(ratio.toFixed(4)))),
    visibleBackingSlab: false,
    negativeScale: false,
    uprightMarker: true,
    entries: freeze(entries)
  });
}

function paintMonitorTexture(record, projected = {}, face = {}) {
  const texture = face?.texture;
  const context = texture?.getContext?.();
  if (!context) return false;
  const width = Number(record.textureWidth || 768);
  const height = Number(record.textureHeight || 432);
  const accent = record.accent || '#89efff';
  const state = String(projected?.state || 'empty');
  const scale = width / 768;
  const px = (value) => Math.round(Number(value) * scale);
  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient?.(0, 0, width, height);
  if (gradient?.addColorStop) {
    gradient.addColorStop(0, '#07121b');
    gradient.addColorStop(0.58, '#0a1821');
    gradient.addColorStop(1, '#080d13');
    context.fillStyle = gradient;
  } else context.fillStyle = '#07121b';
  context.fillRect(0, 0, width, height);
  context.fillStyle = 'rgba(255,255,255,.025)';
  for (let x = 0; x < width; x += px(38)) context.fillRect(x, 0, 1, height);
  for (let y = 0; y < height; y += px(38)) context.fillRect(0, y, width, 1);
  context.strokeStyle = accent;
  context.lineWidth = Math.max(2, px(3));
  context.strokeRect(px(12), px(12), width - px(24), height - px(24));

  context.fillStyle = accent;
  context.font = `800 ${px(24)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillText(truncate(projected?.label || record.id, 42).toUpperCase(), px(34), px(58));
  context.fillStyle = stateColor(state);
  context.font = `800 ${px(17)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const status = `▲ UPRIGHT · ${stateLabel(state)} · ${bounded(projected?.count)}`;
  context.fillText(status, width - context.measureText(status).width - px(34), px(58));

  context.fillStyle = '#f2f8fb';
  context.font = `800 ${px(record.central ? 34 : 29)}px system-ui, sans-serif`;
  context.fillText(truncate(projected?.headline || projected?.purpose || 'No active state', record.central ? 46 : 39), px(34), px(112));
  context.fillStyle = '#adc2cc';
  context.font = `600 ${px(18)}px system-ui, sans-serif`;
  context.fillText(truncate(projected?.detail || projected?.purpose || 'Bounded command information only.', record.central ? 72 : 58), px(34), px(150));

  const cards = Array.isArray(projected?.cards) ? projected.cards.slice(0, record.central ? 3 : 2) : [];
  const jobs = Array.isArray(projected?.jobs) ? projected.jobs.slice(0, 3) : [];
  const rows = jobs.length ? jobs.map((job) => ({
    label: job.jobType || 'Agent job',
    summary: `${job.state || 'queued'}${job.railLabel ? ` · ${job.railLabel}` : ''}`,
    state: job.state || 'queued'
  })) : cards;
  const rowTop = px(188);
  const rowHeight = px(record.central ? 66 : 76);
  if (!rows.length) {
    context.fillStyle = 'rgba(255,255,255,.055)';
    context.fillRect(px(34), rowTop, width - px(68), rowHeight);
    context.fillStyle = '#c5d3d9';
    context.font = `700 ${px(20)}px system-ui, sans-serif`;
    context.fillText('No verified activity to display', px(54), rowTop + px(39));
  } else {
    rows.forEach((row, index) => {
      const y = rowTop + index * rowHeight;
      context.fillStyle = index % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.055)';
      context.fillRect(px(34), y, width - px(68), rowHeight - px(8));
      context.fillStyle = stateColor(row.state || 'empty');
      context.fillRect(px(34), y, px(6), rowHeight - px(8));
      context.fillStyle = '#edf6f9';
      context.font = `750 ${px(18)}px system-ui, sans-serif`;
      context.fillText(truncate(row.label || 'Status', record.central ? 44 : 34), px(54), y + px(27));
      context.fillStyle = '#9fb4be';
      context.font = `600 ${px(15)}px system-ui, sans-serif`;
      context.fillText(truncate(row.summary || `${bounded(row.count)} item${bounded(row.count) === 1 ? '' : 's'}`, record.central ? 58 : 43), px(54), y + px(50));
    });
  }
  context.fillStyle = '#718c98';
  context.font = `700 ${px(13)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillText(`REVIEW FIRST · ${truncate(projected?.truthBoundary || 'NO AUTOMATIC WORK', 74).toUpperCase()}`, px(34), height - px(34));
  context.fillStyle = accent;
  context.font = `800 ${px(11)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const leftCalibration = '◀ LEFT';
  const rightCalibration = `RIGHT ▶ · ${String(face?.id || 'face').toUpperCase()}`;
  context.fillText(leftCalibration, px(34), height - px(13));
  context.fillText(rightCalibration, width - context.measureText(rightCalibration).width - px(34), height - px(13));
  texture.update?.(true);
  return true;
}

function paintMonitor(record, projected = {}) {
  const faces = Array.isArray(record?.faces) ? record.faces : [];
  if (!faces.length) return false;
  return faces.map((face) => paintMonitorTexture(record, projected, face)).every(Boolean);
}

export function createEonCityW750CommandCentre({
  scene, stationRecord, MeshBuilder, TransformNode, Vector3, DynamicTexture = null, StandardMaterial = null, materials = {}, environment = globalThis,
  getNexusView = () => ({}), getCommandSnapshot = () => ({}), getTheatreSnapshot = () => ({}),
  subscribeCommand = null, subscribeTheatre = null, districtCount = 9, reducedMotion = () => false,
  onView = () => {}, onStatus = () => {}
} = {}) {
  if (!scene || !stationRecord?.root || !MeshBuilder || !TransformNode || !Vector3) {
    return freeze({ ok: false, reason: 'w750-render-primitives-required', update() {}, refresh() {}, dispose() {}, getView: () => null });
  }
  const structureMaterial = materials.structure || materials.graphite || null;
  const signalMaterial = materials.signal || materials.cyan || materials.warm || null;
  const root = new TransformNode('w750-command-centre-live-walls', scene);
  root.parent = stationRecord.root;
  root.position.set(0, 0.12, 0);
  // One large primary screen with four side screens at 76.6% of its height.
  // Every wall uses four narrow rails rather than a full opaque backing box.
  const wallLayout = EON_CITY_W750_WALL_LAYOUT;
  const materialByAccent = { cyan: materials.cyan || signalMaterial, amber: materials.amber || materials.warm || signalMaterial, mint: materials.mint || materials.accent2 || signalMaterial, violet: materials.violet || signalMaterial, magenta: materials.magenta || materials.warm || signalMaterial };
  const accentHex = { cyan: '#62e9ff', amber: '#ffd37b', mint: '#72f2c6', violet: '#b79cff', magenta: '#ff8ee8' };
  const records = [];
  for (const layout of wallLayout) {
    const { id, x, y, z, width, height, central = false, textureWidth, textureHeight } = layout;
    const facing = resolveWallFacing(stationRecord.station, layout);
    const anchor = new TransformNode(`w750-wall-anchor-${id}`, scene);
    anchor.parent = root; anchor.position.set(x, y, z); anchor.rotation.y = facing.yaw;
    anchor.metadata = freeze({ kind: 'w750-command-wall-anchor', commandWallId: id, facingDot: facing.dot, visibleBackingSlab: false, negativeScale: false });
    const frame = new TransformNode(`w750-wall-frame-${id}`, scene);
    frame.parent = anchor;
    frame.metadata = freeze({ kind: 'w750-command-wall-thin-frame', commandWallId: id, visibleBackingSlab: false });
    const frameRail = Math.max(0.09, Math.min(0.15, height * 0.055));
    const frameDepth = 0.085;
    const frameRails = [
      ['top', width + frameRail * 2, frameRail, 0, height / 2 + frameRail / 2],
      ['bottom', width + frameRail * 2, frameRail, 0, -height / 2 - frameRail / 2],
      ['left', frameRail, height, -width / 2 - frameRail / 2, 0],
      ['right', frameRail, height, width / 2 + frameRail / 2, 0]
    ].map(([railId, railWidth, railHeight, railX, railY]) => {
      const rail = MeshBuilder.CreateBox(`w750-wall-frame-${id}-rail-${railId}`, { width: railWidth, height: railHeight, depth: frameDepth }, scene);
      rail.parent = frame;
      rail.position.set(railX, railY, 0);
      rail.material = railId === 'bottom' ? (materialByAccent[WALL_DEFINITIONS[id].accent] || signalMaterial) : structureMaterial;
      rail.isPickable = true;
      rail.checkCollisions = false;
      rail.metadata = pickMetadata(id);
      return rail;
    });
    const fallbackMaterial = materialByAccent[WALL_DEFINITIONS[id].accent] || materials.signal;
    const faceOffset = frameDepth * 0.58;
    const faces = [
      freeze({ id: 'front', positionZ: faceOffset, rotationY: 0, expectedNormal: 'anchor-forward' }),
      freeze({ id: 'rear', positionZ: -faceOffset, rotationY: Math.PI, expectedNormal: 'anchor-rearward' })
    ].map((faceSpec) => {
      const texture = createSafeMonitorTexture(scene, DynamicTexture, `w750-command-wall-${id}-${faceSpec.id}-texture`, textureWidth, textureHeight);
      if (texture) {
        texture.uScale = 1;
        texture.vScale = 1;
        texture.uOffset = 0;
        texture.vOffset = 0;
        texture.wAng = 0;
      }
      const monitorMaterial = createMonitorMaterial(scene, StandardMaterial, `w750-command-wall-${id}-${faceSpec.id}-material`, texture, fallbackMaterial);
      const screen = MeshBuilder.CreatePlane(`w750-wall-screen-${id}-${faceSpec.id}`, { width, height, sideOrientation: 0 }, scene);
      screen.parent = anchor;
      screen.position.z = faceSpec.positionZ;
      screen.rotation.y = faceSpec.rotationY;
      screen.material = monitorMaterial;
      screen.visibility = texture ? 1 : 0.52;
      screen.isPickable = true;
      screen.checkCollisions = false;
      screen.metadata = freeze({
        ...pickMetadata(id),
        monitorFace: faceSpec.id,
        readableFrontFace: true,
        frontFaceOnly: true,
        expectedNormal: faceSpec.expectedNormal,
        independentTexture: Boolean(texture)
      });
      return freeze({ ...faceSpec, screen, texture, monitorMaterial });
    });
    const bars = [];
    for (let index = 0; index < 4; index += 1) {
      const bar = MeshBuilder.CreateBox(`w750-wall-${id}-signal-${index}`, { width: Math.max(0.36, width * 0.13), height: 0.065, depth: 0.028 }, scene);
      bar.parent = anchor; bar.position.set((-1.5 + index) * width * 0.16, -(height / 2) - 0.25, 0.13); bar.material = fallbackMaterial; bar.isPickable = false;
      bars.push(bar);
    }
    records.push({
      id, anchor, frame, frameRails, faces, screens: freeze(faces.map((face) => face.screen)), bars,
      central, textureWidth, textureHeight, accent: accentHex[WALL_DEFINITIONS[id].accent], facing,
      state: 'empty', phase: records.length * 0.8
    });
  }

  const theatreStage = new TransformNode('w750-agent-theatre-receipt-stage', scene);
  theatreStage.parent = records.find((entry) => entry.id === 'agent-theatre')?.anchor || root;
  theatreStage.position.set(0, 0.04, 0.11);
  const theatreActors = [];
  for (let index = 0; index < 4; index += 1) {
    const actor = MeshBuilder.CreatePolyhedron(`w750-agent-receipt-${index}`, { type: 2, size: 0.13 }, scene);
    actor.parent = theatreStage; actor.position.set(-0.62 + index * 0.42, 0.12 + (index % 2) * 0.16, 0); actor.material = materials.magenta || materials.warm; actor.isPickable = false; actor.setEnabled(false);
    theatreActors.push(actor);
  }

  let disposed = false;
  let selectedWallId = '';
  let view = projectEonCityW750CommandCentreView({ nexusView: safeRead(getNexusView, {}), commandSnapshot: safeRead(getCommandSnapshot, {}), theatreSnapshot: safeRead(getTheatreSnapshot, {}), districtCount });
  const emit = (reason = 'refresh') => {
    if (disposed) return;
    const detail = freeze({ schema: EON_CITY_W750_COMMAND_CENTRE_SCHEMA, reason: cleanId(reason, 'refresh'), view });
    try { onView(view, reason); } catch {}
    try { environment.dispatchEvent?.(new environment.CustomEvent(EON_CITY_W750_VIEW_EVENT, { detail })); } catch {}
  };
  const applyView = (reason = 'refresh') => {
    view = projectEonCityW750CommandCentreView({ nexusView: safeRead(getNexusView, {}), commandSnapshot: safeRead(getCommandSnapshot, {}), theatreSnapshot: safeRead(getTheatreSnapshot, {}), districtCount });
    for (const record of records) {
      const projected = getEonCityW750Wall(view, record.id);
      record.state = projected?.state || 'empty';
      const fallbackVisibility = record.state === 'error' ? 0.86 : record.state === 'warning' ? 0.68 : record.state === 'active' ? 0.58 : 0.25;
      record.faces.forEach((face) => { face.screen.visibility = face.texture ? 1 : fallbackVisibility; });
      record.bars.forEach((bar, index) => bar.setEnabled(index < Math.min(4, Math.max(1, projected?.count || 0))));
      paintMonitor(record, projected);
    }
    const theatre = getEonCityW750Wall(view, 'agent-theatre');
    theatreActors.forEach((actor, index) => actor.setEnabled(Boolean(theatre?.jobs?.[index])));
    emit(reason);
    return view;
  };
  const unsubscribers = [];
  try { if (typeof subscribeCommand === 'function') unsubscribers.push(subscribeCommand(() => applyView('command-status'))); } catch {}
  try { if (typeof subscribeTheatre === 'function') unsubscribers.push(subscribeTheatre(() => applyView('agent-theatre'))); } catch {}
  const onNexus = () => applyView('nexus-state');
  try { environment.addEventListener?.(EON_CITY_W749_VIEW_EVENT, onNexus); } catch {}
  applyView('mounted');

  return freeze({
    ok: true, schema: EON_CITY_W750_COMMAND_CENTRE_SCHEMA, root, getView: () => view,
    getPresentationSummary: () => freeze({
      ...validateEonCityW750WallPresentation({ station: stationRecord.station, layout: wallLayout }),
      explicitMaterials: records.every((record) => record.faces.every((face) => Boolean(face.screen?.material)) && record.frameRails.every((rail) => Boolean(rail.material))),
      dualReadableFaces: records.every((record) => record.faces.length === 2 && record.faces.every((face) => face.screen?.metadata?.readableFrontFace === true)),
      faceCount: records.reduce((count, record) => count + record.faces.length, 0),
      frontFaceOnly: records.every((record) => record.faces.every((face) => face.screen?.metadata?.frontFaceOnly === true)),
      independentTextures: records.every((record) => record.faces.length === 2 && Boolean(record.faces[0].texture) && Boolean(record.faces[1].texture) && record.faces[0].texture !== record.faces[1].texture),
      independentMaterials: records.every((record) => record.faces.length === 2 && Boolean(record.faces[0].monitorMaterial) && Boolean(record.faces[1].monitorMaterial) && record.faces[0].monitorMaterial !== record.faces[1].monitorMaterial),
      sameWorkspaceInteraction: records.every((record) => record.faces.every((face) => face.screen?.metadata?.commandWallId === record.id)),
      asymmetricCalibration: true,
      faces: freeze(records.map((record) => freeze({
        id: record.id,
        faces: freeze(record.faces.map((face) => freeze({
          id: face.id,
          meshName: face.screen?.name || '',
          positionZ: face.positionZ,
          rotationY: face.rotationY,
          expectedNormal: face.expectedNormal,
          commandWallId: face.screen?.metadata?.commandWallId || '',
          textureName: face.texture?.name || '',
          materialName: face.monitorMaterial?.name || ''
        })))
      })))
    }),
    refresh(reason = 'manual') { return applyView(reason); },
    inspectWall(id = '') {
      const wallView = getEonCityW750Wall(view, id);
      if (!wallView) return freeze({ ok: false, reason: 'command-wall-not-found' });
      selectedWallId = wallView.id;
      onStatus?.(`${wallView.label}: ${wallView.detail} ${wallView.truthBoundary}`);
      emit(`inspect-${wallView.id}`);
      return freeze({ ok: true, wall: wallView, explicitUserAction: true, autoNavigate: false, autoExecute: false });
    },
    getSelectedWall: () => selectedWallId,
    update(timeMs = 0) {
      if (disposed) return;
      const seconds = Number(timeMs || 0) * 0.001;
      const still = reducedMotion();
      for (const record of records) {
        const active = ['active', 'warning', 'error'].includes(record.state);
        const pulse = still || !active ? 1 : 1 + Math.sin(seconds * (record.state === 'error' ? 4.4 : 1.7) + record.phase) * 0.012;
        record.anchor.scaling.setAll(pulse * (selectedWallId === record.id ? 1.025 : 1));
      }
      const jobs = getEonCityW750Wall(view, 'agent-theatre')?.jobs || [];
      theatreActors.forEach((actor, index) => {
        const job = jobs[index];
        if (!job || still) return;
        if (['running', 'preparing', 'queued'].includes(job.state)) actor.rotation.y += 0.012 + index * 0.002;
        actor.position.y = 0.12 + (index % 2) * 0.16 + (['running', 'preparing'].includes(job.state) ? Math.sin(seconds * 1.8 + index) * 0.035 : 0);
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const unsubscribe of unsubscribers) { try { unsubscribe?.(); } catch {} }
      try { environment.removeEventListener?.(EON_CITY_W749_VIEW_EVENT, onNexus); } catch {}
      for (const record of records) {
        for (const face of record.faces) {
          try { face.texture?.dispose?.(); } catch {}
          try { if (face.monitorMaterial && face.monitorMaterial !== materialByAccent[WALL_DEFINITIONS[record.id].accent]) face.monitorMaterial.dispose?.(); } catch {}
        }
      }
      try { root.dispose?.(false, false); } catch {}
    }
  });
}

export default freeze({
  EON_CITY_W750_COMMAND_CENTRE_SCHEMA,
  EON_CITY_W750_VIEW_EVENT,
  EON_CITY_W750_WALL_IDS,
  EON_CITY_W750_WALL_LAYOUT,
  projectEonCityW750CommandCentreView,
  getEonCityW750Wall,
  createEonCityW750CommandCentre,
  validateEonCityW750CommandCentreContract,
  validateEonCityW750WallPresentation
});
