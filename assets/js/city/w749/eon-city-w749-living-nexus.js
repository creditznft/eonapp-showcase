/**
 * W749 — central Living Nexus projection and Babylon presenter.
 *
 * This module owns no product state. It consumes the existing privacy-projected
 * Nexus snapshot, local mission view and bounded W686 continuity receipt, then
 * projects one immutable view to the 3D hero, City Dock and later wall screens.
 */
export const EON_CITY_W749_LIVING_NEXUS_SCHEMA = 'eon.city.living-nexus.w749.v1';
export const EON_CITY_W749_VIEW_EVENT = 'eon:city-w749-nexus-view-changed';
export const EON_CITY_W749_RING_IDS = Object.freeze(['project', 'task', 'approval', 'systems', 'mission', 'results']);

const freeze = (value) => Object.freeze(value);
const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
};
// This explicitly strips C0/DEL from display-safe text.
// eslint-disable-next-line no-control-regex
const cleanText = (value = '', max = 180) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanId = (value = '', fallback = '') => cleanText(value, 120).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 120) || fallback;
const bounded = (value, max = 9999) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
const safeRead = (reader, fallback) => {
  try {
    const value = typeof reader === 'function' ? reader() : fallback;
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const RING_COPY = freeze({
  project: freeze({ label: 'Project & work object', source: 'Selected project and explicit W686 handoff', truth: 'Shows bounded labels, counts and placement only. Raw project contents and file names remain private.', surface: 'projects' }),
  task: freeze({ label: 'Current task', source: 'Foreground task contract', truth: 'Shows finite state and stage only. No fabricated completion percentage is displayed.', surface: 'command-status' }),
  approval: freeze({ label: 'Approvals', source: 'Review inbox and action proposals', truth: 'Approval remains an explicit native action. The Nexus never approves automatically.', surface: 'automations' }),
  systems: freeze({ label: 'Provider & local readiness', source: 'Privacy-projected route, connection and product nodes', truth: 'Credentials, endpoints and provider secrets are never projected into City.', surface: 'local-ai' }),
  mission: freeze({ label: 'Mission progress', source: 'W737 local mission receipts', truth: 'Only reviewed, opened and returned states are shown. XP and Vault Reveals remain inactive until their certified wave.', surface: 'command-status' }),
  results: freeze({ label: 'Verified results', source: 'Existing result-count projection', truth: 'Only counts and safe status labels appear. Result contents stay on maintained native surfaces.', surface: 'command-status' })
});

function isoMs(value = '') {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function projectFreshness(snapshot = {}, now = Date.now()) {
  const updatedAt = cleanText(snapshot.updatedAt || '', 64);
  const timestamp = isoMs(updatedAt);
  if (!timestamp) return freeze({ state: 'unknown', label: 'Freshness unavailable', updatedAt: '', ageMs: null, stale: true });
  const ageMs = Math.max(0, Number(now) - timestamp);
  if (ageMs <= 120_000) return freeze({ state: 'fresh', label: 'Live state', updatedAt, ageMs, stale: false });
  if (ageMs <= 900_000) return freeze({ state: 'stale', label: 'State is older than two minutes', updatedAt, ageMs, stale: true });
  return freeze({ state: 'expired', label: 'State needs refresh', updatedAt, ageMs, stale: true });
}

function ring(id, { count = 0, total = 0, active = false, warning = false, failed = false, label = '', detail = '' } = {}) {
  const copy = RING_COPY[id];
  const normalizedCount = bounded(count);
  const normalizedTotal = bounded(total);
  return freeze({
    id,
    label: copy.label,
    shortLabel: cleanText(label || copy.label, 120),
    detail: cleanText(detail, 220),
    source: copy.source,
    truthBoundary: copy.truth,
    surface: copy.surface,
    count: normalizedCount,
    total: normalizedTotal,
    active: Boolean(active),
    warning: Boolean(warning),
    failed: Boolean(failed),
    explicitUserActionRequired: true,
    autoNavigate: false,
    autoExecute: false
  });
}

export function projectEonCityW749LivingNexusView({ snapshot = {}, continuity = null, missions = [], now = Date.now() } = {}) {
  const eonbot = snapshot.eonbot || {};
  const project = snapshot.project || {};
  const task = snapshot.task || {};
  const approval = snapshot.approval || {};
  const results = snapshot.results || {};
  const route = snapshot.route || {};
  const connection = snapshot.connection || {};
  const nodes = Array.isArray(snapshot.nodes) ? snapshot.nodes : [];
  const missionRows = Array.isArray(missions) ? missions : [];
  const progressedMissions = missionRows.filter((entry) => ['reviewed', 'opened', 'returned'].includes(String(entry?.localState || ''))).length;
  const availableNodes = nodes.filter((entry) => ['available', 'selected', 'active', 'complete'].includes(String(entry?.status || ''))).length;
  const failedNodes = nodes.filter((entry) => ['failed', 'blocked'].includes(String(entry?.status || ''))).length;
  const handoff = continuity?.workObjectHandoff || null;
  const workObject = handoff?.workObject || null;
  const freshness = projectFreshness(snapshot, now);
  const offline = eonbot.state === 'offline' || ['disconnected', 'unavailable', 'error'].includes(String(connection.state || ''));
  const state = offline ? 'offline' : ['ready', 'listening', 'processing', 'speaking', 'waiting-approval', 'complete', 'error'].includes(String(eonbot.state || '')) ? String(eonbot.state) : 'ready';

  const rings = freeze([
    ring('project', {
      count: bounded(project.taskCount) + bounded(project.artefactCount ?? project.artifactCount),
      total: 0,
      active: project.selected === true || Boolean(workObject?.id),
      label: workObject?.label || project.label || 'No project selected',
      detail: workObject?.id
        ? `${cleanText(workObject.kind || 'work object', 60)} · proposed for ${cleanText(workObject.stationId || 'a City station', 100)}`
        : project.selected === true ? `${bounded(project.taskCount)} tasks · ${bounded(project.artefactCount ?? project.artifactCount)} artefacts` : 'Select work outside City to carry a bounded continuity receipt here.'
    }),
    ring('task', {
      count: task.id ? 1 : 0,
      total: 0,
      active: Boolean(task.id),
      warning: task.state === 'review-needed' || task.state === 'paused',
      failed: task.state === 'failed',
      label: task.label || 'No active task',
      detail: task.id ? task.stageLabel || task.state || 'Ready' : 'No foreground task is currently projected.'
    }),
    ring('approval', {
      count: approval.count,
      total: 0,
      active: approval.pending === true,
      warning: approval.pending === true,
      label: approval.label || 'No approval waiting',
      detail: approval.pending === true ? 'Review is required before any change.' : 'No review item is waiting.'
    }),
    ring('systems', {
      count: availableNodes,
      total: nodes.length,
      active: connection.state === 'available' || route.verified === true,
      warning: connection.state === 'checking' || freshness.stale,
      failed: offline || failedNodes > 0,
      label: route.providerLabel || connection.label || 'Guide mode',
      detail: `${cleanText(connection.label || connection.state || 'Connection state unavailable', 140)}${nodes.length ? ` · ${availableNodes}/${nodes.length} bounded nodes ready` : ''}`
    }),
    ring('mission', {
      count: progressedMissions,
      total: missionRows.length,
      active: progressedMissions > 0,
      label: missionRows.length ? `${progressedMissions} of ${missionRows.length} missions touched` : 'Mission view unavailable',
      detail: 'Progress reflects local review/open/return receipts only; completion and rewards require later verified authorities.'
    }),
    ring('results', {
      count: results.count,
      total: 0,
      active: bounded(results.count) > 0,
      warning: bounded(results.unread) > 0,
      label: results.label || 'No new results',
      detail: bounded(results.unread) > 0 ? `${bounded(results.unread)} unread result${bounded(results.unread) === 1 ? '' : 's'}` : 'No unread result count is projected.'
    })
  ]);

  const selectedRingId = rings.find((entry) => entry.failed)?.id
    || rings.find((entry) => entry.warning)?.id
    || rings.find((entry) => entry.active)?.id
    || 'project';
  const summary = state === 'offline'
    ? 'The Nexus is offline or disconnected. Local City inspection remains available.'
    : state === 'waiting-approval'
      ? cleanText(approval.label || 'An approval is waiting for review.', 180)
      : state === 'processing'
        ? cleanText(task.stageLabel || 'A real foreground task is processing.', 180)
        : state === 'complete'
          ? cleanText(results.label || 'A verified result is available.', 180)
          : project.selected === true
            ? cleanText(`Ready to continue ${project.label || 'the selected project'}.`, 180)
            : 'EONBOT is ready. Choose a real project, task, mission or next action.';

  return deepFreeze({
    schema: EON_CITY_W749_LIVING_NEXUS_SCHEMA,
    state,
    stateLabel: cleanText(eonbot.statusLabel || state.replace(/-/g, ' '), 120),
    summary,
    freshness,
    connection: freeze({ state: cleanId(connection.state, 'unavailable'), label: cleanText(connection.label || connection.state || 'Unavailable', 150), offline }),
    project: freeze({ selected: project.selected === true, id: cleanId(project.id), label: cleanText(project.label || 'No project selected', 160), taskCount: bounded(project.taskCount), artefactCount: bounded(project.artefactCount ?? project.artifactCount) }),
    task: freeze({ active: Boolean(task.id), id: cleanId(task.id), label: cleanText(task.label || 'No active task', 160), state: cleanId(task.state, 'ready'), stageLabel: cleanText(task.stageLabel || 'Ready', 140) }),
    approval: freeze({ pending: approval.pending === true, count: bounded(approval.count), label: cleanText(approval.label || 'No approval waiting', 160) }),
    results: freeze({ count: bounded(results.count), unread: bounded(results.unread), label: cleanText(results.label || 'No new results', 160) }),
    systems: freeze({ providerLabel: cleanText(route.providerLabel || 'Guide mode', 140), mode: cleanId(route.mode, 'guide'), verified: route.verified === true, availableNodes, totalNodes: nodes.length, failedNodes }),
    missions: freeze({ progressed: progressedMissions, total: missionRows.length, completionClaimed: false, xpActive: false, vaultRevealActive: false }),
    workObject: workObject?.id ? freeze({
      present: true,
      handoffId: cleanId(handoff?.handoffId),
      id: cleanId(workObject.id),
      kind: cleanId(workObject.kind, 'tool'),
      label: cleanText(workObject.label || 'Work object', 150),
      status: cleanId(workObject.status, 'available'),
      stationId: cleanId(workObject.stationId),
      placementRole: cleanId(workObject.placementRole),
      placementReason: cleanText(workObject.placementReason || handoff?.placement?.reason || '', 220),
      explicitUserActionRequired: true,
      autoNavigate: false,
      autoExecute: false
    }) : freeze({ present: false }),
    rings,
    selectedRingId,
    privacy: freeze({ privacyProjected: true, rawPrompts: false, rawMessageBodies: false, rawProjectContents: false, rawFiles: false, providerCredentials: false, paymentRecords: false, identityTokens: false }),
    truth: freeze({ ownsProductState: false, ownsConversation: false, ownsProjectStore: false, ownsTaskStore: false, ownsMissionStore: false, ownsRenderLoop: false, fakePercentages: false, automaticWork: false, automaticNavigation: false })
  });
}

export function getEonCityW749Ring(view = {}, id = '') {
  return (Array.isArray(view?.rings) ? view.rings : []).find((entry) => entry.id === String(id || '')) || null;
}

export function validateEonCityW749LivingNexusContract() {
  const sample = projectEonCityW749LivingNexusView({
    snapshot: {
      updatedAt: new Date(749).toISOString(),
      eonbot: { state: 'waiting-approval', statusLabel: 'Waiting for approval' },
      project: { id: 'project:1', label: 'Project', selected: true, taskCount: 2, artefactCount: 1 },
      task: { id: 'task:1', label: 'Task', state: 'review-needed', stageLabel: 'Review needed' },
      approval: { pending: true, count: 1, label: 'One approval waiting' },
      results: { count: 2, unread: 1, label: 'Two results available' },
      route: { mode: 'local', providerLabel: 'Local runtime', verified: true },
      connection: { state: 'available', label: 'Connected' },
      nodes: [{ id: 'local', status: 'available' }]
    },
    missions: [{ localState: 'opened' }],
    now: 749
  });
  const errors = [];
  if (sample.schema !== EON_CITY_W749_LIVING_NEXUS_SCHEMA) errors.push('schema');
  if (sample.rings.length !== EON_CITY_W749_RING_IDS.length) errors.push('ring-count');
  if (!EON_CITY_W749_RING_IDS.every((id) => sample.rings.some((entry) => entry.id === id))) errors.push('ring-coverage');
  if (!sample.privacy.privacyProjected || sample.truth.ownsProductState || sample.truth.fakePercentages) errors.push('truth-boundary');
  if (!sample.approval.pending || sample.state !== 'waiting-approval') errors.push('state-projection');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), ringCount: sample.rings.length, schema: sample.schema });
}

function createPickMetadata(id, stationId = 'eonbot-nexus') {
  return freeze({
    kind: 'w749-living-nexus-interaction',
    stationId,
    interactionRole: id === 'core' ? 'structure' : 'nexus-ring',
    interactionPart: id === 'core' ? 'structure' : `nexus-ring:${id}`,
    nexusRingId: id === 'core' ? '' : id,
    explicitUserActionRequired: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false
  });
}

export function createEonCityW749LivingNexus({
  scene,
  stationRecord,
  MeshBuilder,
  TransformNode,
  Vector3,
  materials = {},
  eventAdapter = null,
  readContinuity = () => null,
  getMissions = () => [],
  environment = globalThis,
  now = Date.now,
  reducedMotion = () => false,
  onView = () => {},
  onStatus = () => {}
} = {}) {
  if (!scene || !stationRecord?.root || !MeshBuilder || !TransformNode || !Vector3) {
    return freeze({ ok: false, reason: 'w749-render-primitives-required', dispose() {}, update() {}, getView: () => null });
  }
  const root = new TransformNode('w749-living-nexus-root', scene);
  root.parent = stationRecord.root;
  root.metadata = freeze({ kind: 'w749-central-living-nexus', schema: EON_CITY_W749_LIVING_NEXUS_SCHEMA, ownsRenderLoop: false, ownsState: false });

  const socket = MeshBuilder.CreateCylinder('w749-nexus-processor-socket', { diameterTop: 3.9, diameterBottom: 4.5, height: 0.34, tessellation: 72 }, scene);
  socket.parent = root; socket.position.y = 0.2; socket.material = materials.stationBase || materials.structure; socket.isPickable = true; socket.metadata = createPickMetadata('core');
  const socketTrace = MeshBuilder.CreateTorus('w749-nexus-processor-trace', { diameter: 3.45, thickness: 0.075, tessellation: 72 }, scene);
  socketTrace.parent = root; socketTrace.position.y = 0.39; socketTrace.rotation.x = Math.PI / 2; socketTrace.material = materials.signal || materials.cyan; socketTrace.isPickable = false;

  const hero = new TransformNode('w749-nexus-hero', scene);
  hero.parent = root;
  hero.position.set(0, 2.32, 0);
  const core = MeshBuilder.CreateSphere('w749-nexus-intelligence-core', { diameter: 1.42, segments: 32 }, scene);
  core.parent = hero; core.material = materials.signal || materials.cyan; core.isPickable = true; core.metadata = createPickMetadata('core');
  const inner = MeshBuilder.CreatePolyhedron('w749-nexus-inner-intelligence', { type: 2, size: 0.58 }, scene);
  inner.parent = hero; inner.material = materials.warm || materials.accent2; inner.isPickable = false;
  const privacyShield = MeshBuilder.CreateSphere('w749-nexus-privacy-shield', { diameter: 3.65, segments: 32 }, scene);
  privacyShield.parent = hero; privacyShield.material = materials.glass || materials.structure; privacyShield.visibility = 0.28; privacyShield.isPickable = true; privacyShield.metadata = createPickMetadata('core');

  const ringRecords = [];
  const ringMaterials = [materials.cyan, materials.mint, materials.amber, materials.violet, materials.magenta, materials.warm];
  EON_CITY_W749_RING_IDS.forEach((id, index) => {
    const ringMesh = MeshBuilder.CreateTorus(`w749-nexus-ring-${id}`, { diameter: 2.05 + index * 0.31, thickness: index === 2 ? 0.085 : 0.055, tessellation: 72 }, scene);
    ringMesh.parent = hero;
    ringMesh.rotation.set(Math.PI / 2.25 + (index % 2) * 0.22, index * 0.26, index % 3 === 0 ? 0.22 : -0.18);
    ringMesh.material = ringMaterials[index] || materials.cyan;
    ringMesh.isPickable = true;
    ringMesh.metadata = createPickMetadata(id);
    ringRecords.push({ id, mesh: ringMesh, baseScale: 1, phase: index * 0.73, speed: 0.12 + index * 0.025 });
  });

  const workObject = MeshBuilder.CreatePolyhedron('w749-nexus-selected-work-object', { type: 1, size: 0.28 }, scene);
  workObject.parent = hero; workObject.position.set(1.36, 0.22, 0); workObject.material = materials.warm || materials.signal; workObject.isPickable = true; workObject.metadata = createPickMetadata('project'); workObject.setEnabled(false);
  const particles = [];
  for (let index = 0; index < 12; index += 1) {
    const particle = MeshBuilder.CreateSphere(`w749-nexus-event-particle-${index}`, { diameter: index % 3 === 0 ? 0.09 : 0.055, segments: 8 }, scene);
    particle.parent = hero; particle.material = index % 2 ? (materials.cyan || materials.signal) : (materials.warm || materials.accent2); particle.isPickable = false;
    particles.push(particle);
  }

  let disposed = false;
  let presentationEnabled = true;
  let selectedRingId = '';
  let sourceEmissions = 0;
  const readSourceSnapshot = () => safeRead(() => eventAdapter?.getSnapshot?.(), {});
  const readContinuityReceipt = () => safeRead(readContinuity, null);
  const readMissionView = () => safeRead(getMissions, []);
  const readNow = () => safeRead(now, Date.now());
  let view = projectEonCityW749LivingNexusView({
    snapshot: readSourceSnapshot(),
    continuity: readContinuityReceipt(),
    missions: readMissionView(),
    now: readNow()
  });
  const emit = (reason = 'refresh') => {
    if (disposed) return;
    const detail = freeze({ schema: EON_CITY_W749_LIVING_NEXUS_SCHEMA, reason: cleanId(reason, 'refresh'), view });
    try { onView(view, reason); } catch {}
    try {
      if (typeof environment?.dispatchEvent === 'function' && typeof environment?.CustomEvent === 'function') {
        environment.dispatchEvent(new environment.CustomEvent(EON_CITY_W749_VIEW_EVENT, { detail }));
      }
    } catch {}
  };
  const applyView = (nextSnapshot = undefined, reason = 'refresh') => {
    const sourceSnapshot = nextSnapshot && typeof nextSnapshot === 'object' ? nextSnapshot : readSourceSnapshot();
    view = projectEonCityW749LivingNexusView({
      snapshot: sourceSnapshot,
      continuity: readContinuityReceipt(),
      missions: readMissionView(),
      now: readNow()
    });
    core.material = view.state === 'error' || view.state === 'offline' ? (materials.amber || materials.warm) : (materials.signal || materials.cyan);
    privacyShield.visibility = view.state === 'offline' ? 0.13 : view.approval.pending ? 0.38 : 0.25;
    workObject.setEnabled(Boolean(view.workObject.present));
    ringRecords.forEach((record) => {
      const projected = getEonCityW749Ring(view, record.id);
      const scale = projected?.failed ? 1.08 : projected?.warning ? 1.045 : projected?.active ? 1.025 : 0.96;
      record.baseScale = scale;
      record.mesh.visibility = projected?.active || projected?.warning || projected?.failed ? 1 : 0.58;
    });
    emit(reason);
    return view;
  };
  let unsubscribe = () => {};
  try {
    const candidate = eventAdapter?.subscribe?.((snapshot) => {
      sourceEmissions += 1;
      applyView(snapshot, 'source-state');
    });
    if (typeof candidate === 'function') unsubscribe = candidate;
  } catch {
    onStatus?.('Living Nexus source subscription is unavailable; bounded guide mode remains active.');
  }
  if (eventAdapter?.start) {
    try { eventAdapter.start(); }
    catch { onStatus?.('Living Nexus source start failed; bounded guide mode remains active.'); }
  }
  if (sourceEmissions === 0) applyView(readSourceSnapshot(), 'mounted');

  return freeze({
    ok: true,
    schema: EON_CITY_W749_LIVING_NEXUS_SCHEMA,
    root,
    core,
    privacyShield,
    setPresentationEnabled(enabled = true) {
      presentationEnabled = Boolean(enabled);
      root.setEnabled?.(presentationEnabled);
      return presentationEnabled;
    },
    isPresentationEnabled: () => presentationEnabled,
    getView: () => view,
    refresh(reason = 'manual') {
      if (eventAdapter?.refresh) {
        const emissionCountBeforeRefresh = sourceEmissions;
        let result = null;
        try { result = eventAdapter.refresh(reason); }
        catch { onStatus?.('Living Nexus refresh failed; the last bounded state remains visible.'); }
        if (sourceEmissions === emissionCountBeforeRefresh) {
          return applyView(result?.state || readSourceSnapshot(), reason);
        }
        return view;
      }
      return applyView(readSourceSnapshot(), reason);
    },
    inspectRing(id = '') {
      const ringView = getEonCityW749Ring(view, id);
      if (!ringView) return freeze({ ok: false, reason: 'nexus-ring-not-found' });
      selectedRingId = ringView.id;
      onStatus?.(`${ringView.label}: ${ringView.detail} ${ringView.truthBoundary}`);
      emit(`inspect-${ringView.id}`);
      return freeze({ ok: true, ring: ringView, explicitUserAction: true, autoNavigate: false });
    },
    setSelectedRing(id = '') {
      selectedRingId = EON_CITY_W749_RING_IDS.includes(String(id || '')) ? String(id) : '';
      return selectedRingId;
    },
    getSelectedRing: () => selectedRingId,
    getCompanionOrbitTarget(seconds = 0) {
      const radius = view.state === 'processing' ? 2.25 : view.state === 'listening' ? 1.82 : 2.05;
      const speed = view.state === 'processing' ? 1.35 : view.state === 'waiting-approval' ? 0.55 : 0.82;
      return freeze({
        x: stationRecord.root.position.x + Math.sin(Number(seconds) * speed) * radius,
        y: 1.32 + (reducedMotion() ? 0 : Math.sin(Number(seconds) * 1.45) * 0.24),
        z: stationRecord.root.position.z + Math.cos(Number(seconds) * speed) * radius,
        state: view.state
      });
    },
    update(timeMs = 0) {
      if (disposed || !presentationEnabled) return;
      const seconds = Number(timeMs || 0) * 0.001;
      const staticMotion = reducedMotion();
      const stateSpeed = view.state === 'processing' ? 2.2 : view.state === 'listening' ? 0.7 : view.state === 'waiting-approval' ? 0.45 : view.state === 'error' ? 0.2 : 1;
      hero.position.y = 2.32 + (staticMotion ? 0 : Math.sin(seconds * 1.15) * 0.085);
      inner.rotation.y += staticMotion ? 0 : 0.008 * stateSpeed;
      inner.rotation.x += staticMotion ? 0 : 0.004 * stateSpeed;
      ringRecords.forEach((record, index) => {
        if (!staticMotion) record.mesh.rotation.y += record.speed * 0.016 * stateSpeed * (index % 2 ? -1 : 1);
        const pulse = staticMotion ? 1 : 1 + Math.sin(seconds * (view.state === 'error' ? 4.5 : 1.55) + record.phase) * (view.state === 'error' ? 0.035 : 0.012);
        record.mesh.scaling.setAll(record.baseScale * pulse * (selectedRingId === record.id ? 1.035 : 1));
      });
      particles.forEach((particle, index) => {
        const angle = seconds * (0.45 + (index % 4) * 0.08) + index * 0.52;
        const radius = 1.15 + (index % 3) * 0.42;
        particle.position.set(Math.sin(angle) * radius, Math.sin(seconds * 0.9 + index) * 0.72, Math.cos(angle) * radius);
        particle.visibility = view.state === 'offline' ? 0.08 : view.state === 'processing' ? 0.9 : 0.42;
      });
      if (view.workObject.present) {
        const angle = staticMotion ? 0.35 : seconds * 0.72;
        workObject.position.set(Math.sin(angle) * 1.42, 0.18 + (staticMotion ? 0 : Math.sin(seconds * 1.2) * 0.16), Math.cos(angle) * 1.42);
        workObject.rotation.y += staticMotion ? 0 : 0.012;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try { unsubscribe?.(); } catch {}
      try { eventAdapter?.dispose?.(); } catch {}
      try { root.dispose?.(false, false); } catch {}
    }
  });
}

export default freeze({
  EON_CITY_W749_LIVING_NEXUS_SCHEMA,
  EON_CITY_W749_VIEW_EVENT,
  EON_CITY_W749_RING_IDS,
  projectEonCityW749LivingNexusView,
  getEonCityW749Ring,
  createEonCityW749LivingNexus,
  validateEonCityW749LivingNexusContract
});
