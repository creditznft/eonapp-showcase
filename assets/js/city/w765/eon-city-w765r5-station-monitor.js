/**
 * W765R5 — shared live station-monitor foundation.
 *
 * Monitors are privacy-projected read-only views. They never render an iframe,
 * start work, read private content, expose credentials or claim completion.
 * Selection opens the maintained work surface through the owning City runtime.
 */
export const EON_CITY_W765R5_STATION_MONITOR_SCHEMA = 'eon.city.station-monitor.w765r5.v1';
export const EON_CITY_W765R5_STATION_MONITOR_IDS = Object.freeze([
  'eonbot-nexus', 'create-forge', 'project-atlas', 'library-vault', 'share-capture',
  'command-console', 'automation-theatre', 'local-ai-lab', 'my-realm-portal', 'plans-access'
]);

const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const bounded = (value, min, max) => Math.max(min, Math.min(max, finite(value, min)));
const truncate = (value = '', max = 72) => {
  const text = clean(value);
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1))}…`;
};
const stationById = (stations = [], stationId = '') => (stations || []).find((entry) => entry?.stationId === stationId) || null;
const ringById = (view = {}, ringId = '') => (view?.rings || []).find((entry) => entry?.id === ringId) || null;
const cardById = (snapshot = {}, cardId = '') => (snapshot?.cards || []).find((entry) => entry?.id === cardId) || null;

export const EON_CITY_W765R5_MONITOR_PROFILES = freeze({
  'eonbot-nexus': freeze({ title: 'LIVING EONBOT NEXUS', width: 4.45, height: 2.5, y: 3.05, setback: 2.75, textureWidth: 1152, textureHeight: 648, hero: true, accent: '#62e9ff' }),
  'create-forge': freeze({ title: 'CREATE FORGE', width: 2.9, height: 1.64, y: 2.55, setback: 2.15, textureWidth: 768, textureHeight: 432, accent: '#ffd37b' }),
  'project-atlas': freeze({ title: 'PROJECT ATLAS', width: 2.9, height: 1.64, y: 2.55, setback: 2.15, textureWidth: 768, textureHeight: 432, accent: '#62e9ff' }),
  'library-vault': freeze({ title: 'LIBRARY VAULT', width: 2.9, height: 1.64, y: 2.62, setback: 2.2, textureWidth: 768, textureHeight: 432, accent: '#72f2c6' }),
  'share-capture': freeze({ title: 'SHARE COMMAND CENTER', width: 3.0, height: 1.7, y: 2.65, setback: 2.25, textureWidth: 832, textureHeight: 468, accent: '#ff8ee8' }),
  'command-console': freeze({ title: 'COMMAND STATUS', width: 4.2, height: 2.42, y: 3.0, setback: 3.25, textureWidth: 1024, textureHeight: 576, accent: '#62e9ff' }),
  'automation-theatre': freeze({ title: 'AUTOMATION THEATRE', width: 3.0, height: 1.7, y: 2.68, setback: 2.35, textureWidth: 832, textureHeight: 468, accent: '#ffd37b' }),
  'local-ai-lab': freeze({ title: 'LOCAL AI LAB', width: 3.0, height: 1.7, y: 2.72, setback: 2.4, textureWidth: 832, textureHeight: 468, accent: '#62e9ff' }),
  'my-realm-portal': freeze({ title: 'MY REALM PORTAL', width: 2.95, height: 1.66, y: 2.9, setback: 2.45, textureWidth: 800, textureHeight: 450, accent: '#b79cff' }),
  'plans-access': freeze({ title: 'PLANS & ACCESS', width: 2.95, height: 1.66, y: 2.7, setback: 2.35, textureWidth: 800, textureHeight: 450, accent: '#ffd37b' })
});

export function resolveEonCityW765R5MonitorPose({ station = null, profile = null, lateral = 0 } = {}) {
  if (!station?.position || !station?.focus) return freeze({ ok: false, reason: 'station-pose-required' });
  const dx = finite(station.focus.x) - finite(station.position.x);
  const dz = finite(station.focus.z) - finite(station.position.z);
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const frontX = dx / length;
  const frontZ = dz / length;
  const rightX = frontZ;
  const rightZ = -frontX;
  const setback = bounded(profile?.setback, 0.8, 4.2);
  const position = freeze({
    x: -frontX * setback + rightX * finite(lateral),
    y: bounded(profile?.y, 1.4, 5.5),
    z: -frontZ * setback + rightZ * finite(lateral)
  });
  // Babylon's authored display plane presents its readable front on local -Z.
  // Point that axis toward the station approach/focus so users never see the
  // double-sided back face (which rendered the DynamicTexture inverted).
  const yaw = Math.atan2(-frontX, -frontZ);
  const worldPosition = freeze({
    x: finite(station.position.x) + position.x,
    y: finite(station.position.y) + position.y,
    z: finite(station.position.z) + position.z
  });
  return freeze({ ok: true, position, worldPosition, yaw, front: freeze({ x: frontX, z: frontZ }), focusPose: freeze({ x: finite(station.focus.x), y: Math.max(1.2, position.y * 0.82), z: finite(station.focus.z) }) });
}

export function validateEonCityW765R5MonitorFacing({ worldPosition = null, yaw = 0, focusPose = null } = {}) {
  if (!worldPosition || !focusPose) return freeze({ ok: false, dot: -1, reason: 'pose-required' });
  const dx = finite(focusPose.x) - finite(worldPosition.x);
  const dz = finite(focusPose.z) - finite(worldPosition.z);
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const toFocus = { x: dx / length, z: dz / length };
  // Keep validation aligned with the actual readable plane axis: local -Z.
  const front = { x: -Math.sin(finite(yaw)), z: -Math.cos(finite(yaw)) };
  const dot = front.x * toFocus.x + front.z * toFocus.z;
  return freeze({ ok: dot >= 0.985, dot: Number(dot.toFixed(6)), front: freeze(front), toFocus: freeze(toFocus) });
}

function stateLabel(state = '') {
  const normalized = clean(state).toLowerCase();
  if (['verified', 'active', 'current', 'ready'].includes(normalized)) return 'READY';
  if (['warning', 'waiting-approval', 'reviewed', 'opened', 'returned'].includes(normalized)) return 'REVIEW';
  if (['failed', 'error', 'blocked'].includes(normalized)) return 'ATTENTION';
  if (['loading', 'pending'].includes(normalized)) return 'LOADING';
  return 'READY';
}

function row(label, summary, state = 'ready') {
  return freeze({ label: truncate(label, 30), summary: truncate(summary, 72), state: clean(state) || 'ready' });
}

export function projectEonCityW765R5StationMonitor({ station = null, productiveView = null, nexusView = null, commandSnapshot = null, theatreSnapshot = null } = {}) {
  const stationId = clean(station?.id || station?.stationId);
  const profile = EON_CITY_W765R5_MONITOR_PROFILES[stationId] || null;
  const loop = stationById(productiveView?.stations, stationId);
  const currentStep = (loop?.steps || []).find((entry) => entry?.state === 'current') || loop?.steps?.[0] || null;
  const rows = [];
  let headline = loop?.status || station?.description || 'Ready for explicit review.';
  let state = loop?.state || 'ready';
  let truthBoundary = 'READ-ONLY PROJECTION · OPEN THE REAL WORKSPACE TO ACT';

  if (stationId === 'eonbot-nexus') {
    const project = ringById(nexusView, 'project');
    const task = ringById(nexusView, 'task');
    const systems = ringById(nexusView, 'systems');
    state = nexusView?.state || loop?.state || 'ready';
    headline = nexusView?.workObject?.present
      ? nexusView.workObject.placementReason || nexusView.workObject.label || 'Active work is ready to continue.'
      : 'EONBOT is ready to frame the next useful move.';
    rows.push(row('EONBOT readiness', nexusView?.freshness?.label || stateLabel(state), state));
    rows.push(row('Active project', project?.shortLabel || nexusView?.workObject?.label || 'No active project projected', project?.warning ? 'warning' : 'ready'));
    rows.push(row('Suggested next action', task?.shortLabel || currentStep?.label || 'Ask EONBOT or choose a maintained workspace', task?.warning ? 'warning' : 'ready'));
    rows.push(row('Provider / local state', systems?.shortLabel || 'Review provider and device state inside Nexus', systems?.warning ? 'warning' : 'ready'));
  } else if (stationId === 'automation-theatre') {
    const jobs = theatreSnapshot?.jobs || [];
    const counts = jobs.reduce((result, job) => {
      const jobState = clean(job?.state).toLowerCase();
      if (['running', 'preparing'].includes(jobState)) result.active += 1;
      else if (['waiting-for-user', 'approval-required'].includes(jobState)) result.approval += 1;
      else if (['completed', 'verified'].includes(jobState)) result.completed += 1;
      else result.queued += 1;
      return result;
    }, { queued: 0, active: 0, approval: 0, completed: 0 });
    headline = jobs.length ? `${jobs.length} genuine job receipt${jobs.length === 1 ? '' : 's'} projected.` : theatreSnapshot?.emptyMessage || 'No genuine automation receipt is present.';
    rows.push(row('Queued', `${counts.queued} genuine receipt${counts.queued === 1 ? '' : 's'}`));
    rows.push(row('Active', `${counts.active} authoritative running state${counts.active === 1 ? '' : 's'}`, counts.active ? 'active' : 'ready'));
    rows.push(row('Approval required', `${counts.approval} waiting for explicit review`, counts.approval ? 'warning' : 'ready'));
    rows.push(row('Completed', `${counts.completed} verified completion${counts.completed === 1 ? '' : 's'}`));
    truthBoundary = 'NO RECEIPT = STILL STAGE · NO SIMULATED WORKERS';
  } else if (stationId === 'create-forge') {
    const outcomes = cardById(commandSnapshot, 'outcomes');
    headline = loop?.status || 'Create is ready for an explicit brief and execution choice.';
    rows.push(row('Active draft', loop?.state === 'active' ? 'A native creation loop is active' : 'No active draft is projected', loop?.state || 'ready'));
    rows.push(row('Recent creation', outcomes?.summary || 'No verified creation outcome is projected', outcomes?.state || 'ready'));
    rows.push(row('Next creation action', currentStep?.label || 'Define the result'));
    rows.push(row('Execution boundary', 'Guide, Local or Direct BYOK only after review'));
  } else if (stationId === 'project-atlas') {
    const projects = cardById(commandSnapshot, 'projects');
    const outcomes = cardById(commandSnapshot, 'outcomes');
    headline = projects?.summary || loop?.status || 'Review active local project state without exposing private project content.';
    rows.push(row('Active projects', projects?.summary || 'No saved local project is projected', projects?.state || 'ready'));
    rows.push(row('Progress', stateLabel(loop?.state || 'ready'), loop?.state || 'ready'));
    rows.push(row('Next task', currentStep?.label || 'Choose one active outcome'));
    rows.push(row('Recent result', outcomes?.summary || 'No verified result receipt is projected', outcomes?.state || 'ready'));
    truthBoundary = 'COUNTS AND RECEIPTS ONLY · PROJECT CONTENT STAYS IN PROJECTS';
  } else if (stationId === 'library-vault') {
    const backup = cardById(commandSnapshot, 'backup');
    const outcomes = cardById(commandSnapshot, 'outcomes');
    headline = backup?.summary || loop?.status || 'Recover or reuse saved work through its maintained private authority.';
    rows.push(row('Saved work', loop?.status || 'Ready to search local Library records', loop?.state || 'ready'));
    rows.push(row('File boundary', 'Types and counts only; private contents remain hidden'));
    rows.push(row('Recovery state', backup?.summary || 'No verified backup or restore receipt projected', backup?.state || 'ready'));
    rows.push(row('Recent result', outcomes?.summary || currentStep?.label || 'Find the right saved item', outcomes?.state || 'ready'));
    truthBoundary = 'NO FILE CONTENT, PASSPHRASE, KEY OR SECRET IS PROJECTED';
  } else if (stationId === 'local-ai-lab') {
    const runtime = cardById(commandSnapshot, 'ai-runtime');
    headline = runtime?.summary || loop?.status || 'Review device, local runtime and provider readiness.';
    rows.push(row('Runtime readiness', runtime?.summary || 'No verified runtime receipt projected', runtime?.state || 'ready'));
    rows.push(row('Execution path', currentStep?.label || 'Choose Local, Direct BYOK or Guide'));
    rows.push(row('Secret boundary', 'Credentials are never rendered in the 3D City'));
    rows.push(row('Next action', loop?.proofLabel || 'Open Local AI'));
    truthBoundary = 'DEVICE / PROVIDER STATUS ONLY · NO SECRET VALUES';
  } else if (stationId === 'plans-access') {
    const billing = cardById(commandSnapshot, 'billing');
    headline = billing?.summary || 'Server-confirmed access must be reviewed in Plans & Access.';
    rows.push(row('Current access', billing?.summary || 'Explicit server refresh required', billing?.state || 'loading'));
    rows.push(row('Compare tiers', currentStep?.label || 'Review capability and monthly price'));
    rows.push(row('Checkout', 'Starts only after explicit confirmation'));
    rows.push(row('Authority', 'Signed billing webhook only'));
    truthBoundary = 'CITY CANNOT GRANT ACCESS · SERVER AUTHORITY REQUIRED';
  } else if (stationId === 'share-capture') {
    rows.push(row('Quick share', 'Signed link, copy and QR are ready for review'));
    rows.push(row('Referral state', 'Shown only from maintained Share authority'));
    rows.push(row('Creator Capture', 'Local recording is available inside Share Center'));
    rows.push(row('Next action', currentStep?.label || 'Preview before copying or recording'));
    truthBoundary = 'NOTHING POSTS OR UPLOADS AUTOMATICALLY';
  } else if (stationId === 'my-realm-portal') {
    rows.push(row('Private Realm', 'Ready for explicit review'));
    rows.push(row('Layout', 'Private content is not projected into public City space'));
    rows.push(row('Realm Card', 'Read-only sharing boundary'));
    rows.push(row('Next action', currentStep?.label || 'Open My Realm'));
    truthBoundary = 'PRIVATE CONTENT EXCLUDED FROM THE PUBLIC PROJECTION';
  } else {
    rows.push(row('Station state', loop?.status || 'Ready for explicit review', loop?.state || 'ready'));
    rows.push(row('Current step', currentStep?.label || 'Open the maintained workspace'));
    rows.push(row('Outcome', loop?.outcome || station?.description || 'A real native outcome'));
    rows.push(row('Authority', loop?.completionAuthority || 'Maintained native receipt required'));
  }

  return freeze({
    schema: EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
    stationId,
    title: profile?.title || clean(station?.label).toUpperCase() || 'LIVE STATION',
    headline: truncate(headline, 104),
    state: clean(state) || 'ready',
    stateLabel: stateLabel(state),
    rows: freeze(rows.slice(0, 4)),
    truthBoundary: truncate(truthBoundary, 92),
    openLabel: truncate(station?.npc?.action || loop?.proofLabel || 'Open workspace', 34),
    surface: clean(station?.surface),
    privateDataRead: false,
    automaticExecution: false,
    automaticNavigation: false,
    inventedActivity: false
  });
}

function createTexture(scene, DynamicTexture, name, width, height) {
  if (typeof DynamicTexture !== 'function') return null;
  try {
    const texture = new DynamicTexture(name, { width, height }, scene, false);
    texture.hasAlpha = false;
    texture.wrapU = 0;
    texture.wrapV = 0;
    return texture;
  } catch {
    return null;
  }
}

function createMaterial(scene, StandardMaterial, name, texture, fallbackMaterial) {
  if (!texture || typeof StandardMaterial !== 'function') return fallbackMaterial || null;
  try {
    const material = new StandardMaterial(name, scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.emissiveColor?.set?.(0.72, 0.82, 0.9);
    material.specularColor?.set?.(0.04, 0.06, 0.08);
    material.backFaceCulling = false;
    return material;
  } catch {
    return fallbackMaterial || null;
  }
}

function fingerprint(view = {}) {
  try { return JSON.stringify([view.stationId, view.headline, view.state, view.rows, view.truthBoundary]); }
  catch { return `${view.stationId}:${view.state}:${Date.now()}`; }
}

function paint(texture, view, profile) {
  const context = texture?.getContext?.();
  if (!context || !view) return false;
  const width = finite(texture.getSize?.().width, profile.textureWidth);
  const height = finite(texture.getSize?.().height, profile.textureHeight);
  const sx = width / 768;
  const sy = height / 432;
  const px = (value) => value * Math.min(sx, sy);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#06131b');
  gradient.addColorStop(0.58, '#0b1820');
  gradient.addColorStop(1, '#11171d');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = profile.accent;
  context.lineWidth = px(3);
  context.strokeRect(px(12), px(12), width - px(24), height - px(24));
  context.fillStyle = profile.accent;
  context.font = `800 ${px(profile.hero ? 29 : 24)}px system-ui, sans-serif`;
  context.fillText(truncate(view.title, profile.hero ? 42 : 34), px(32), px(54));
  context.fillStyle = '#8ea7b3';
  context.font = `700 ${px(12)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.textAlign = 'right';
  context.fillText(`▲ UPRIGHT · ${view.stateLabel}`, width - px(32), px(50));
  context.textAlign = 'left';
  context.fillStyle = '#edf6f9';
  context.font = `700 ${px(profile.hero ? 19 : 17)}px system-ui, sans-serif`;
  context.fillText(truncate(view.headline, profile.hero ? 84 : 64), px(32), px(88));
  const rowTop = px(118);
  const rowHeight = px(profile.hero ? 58 : 54);
  (view.rows || []).forEach((entry, index) => {
    const y = rowTop + index * rowHeight;
    context.fillStyle = index % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(98,233,255,0.045)';
    context.fillRect(px(28), y - px(24), width - px(56), rowHeight - px(5));
    context.fillStyle = entry.state === 'warning' || entry.state === 'error' ? '#ffd37b' : profile.accent;
    context.fillRect(px(34), y - px(16), px(5), px(31));
    context.fillStyle = '#edf6f9';
    context.font = `750 ${px(15)}px system-ui, sans-serif`;
    context.fillText(truncate(entry.label, 30), px(51), y);
    context.fillStyle = '#9fb4be';
    context.font = `600 ${px(13)}px system-ui, sans-serif`;
    context.fillText(truncate(entry.summary, profile.hero ? 68 : 54), px(51), y + px(20));
  });
  context.fillStyle = '#718c98';
  context.font = `700 ${px(11)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillText(truncate(view.truthBoundary, 88), px(32), height - px(31));
  context.fillStyle = profile.accent;
  context.textAlign = 'right';
  context.fillText(`SELECT · ${truncate(view.openLabel, 30).toUpperCase()}`, width - px(32), height - px(31));
  context.restore();
  texture.update?.(true);
  return true;
}

export function createEonCityW765R5StationMonitor({
  scene, station = null, stationRecord = null, MeshBuilder, TransformNode, DynamicTexture = null, StandardMaterial = null,
  materials = {}, projectionProvider = () => ({}), openSurface = () => ({ ok: false }), interactionMetadata = null,
  profile: profileOverride = null, lateral = 0, now = () => Date.now()
} = {}) {
  const stationId = clean(station?.id);
  const profile = freeze({ ...(EON_CITY_W765R5_MONITOR_PROFILES[stationId] || {}), ...(profileOverride || {}) });
  if (!scene || !stationRecord?.root || !stationId || !profile?.width || !MeshBuilder || !TransformNode) {
    return freeze({ ok: false, reason: 'w765r5-monitor-primitives-required', update() {}, refresh() {}, open() { return freeze({ ok: false }); }, dispose() {}, getSummary: () => null });
  }
  const pose = resolveEonCityW765R5MonitorPose({ station, profile, lateral });
  const facing = validateEonCityW765R5MonitorFacing({ worldPosition: pose.worldPosition, yaw: pose.yaw, focusPose: pose.focusPose });
  if (!pose.ok || !facing.ok) return freeze({ ok: false, reason: 'w765r5-monitor-facing-invalid', pose, facing, update() {}, refresh() {}, open() { return freeze({ ok: false }); }, dispose() {}, getSummary: () => null });

  const root = new TransformNode(`w765r5-monitor-${stationId}`, scene);
  root.parent = stationRecord.root;
  root.position.set(pose.position.x, pose.position.y, pose.position.z);
  root.rotation.y = pose.yaw;
  root.metadata = freeze({ kind: 'w765r5-live-station-monitor-root', stationId, schema: EON_CITY_W765R5_STATION_MONITOR_SCHEMA, facingDot: facing.dot, visibleBackingSlab: false });
  const frameMaterial = materials.structure || materials.graphite || materials.surface || null;
  const accentMaterial = materials.cyan || materials.signal || materials.warm || frameMaterial;
  if (!frameMaterial || !accentMaterial) {
    return freeze({ ok: false, reason: 'w765r5-explicit-monitor-materials-required', update() {}, refresh() {}, open() { return freeze({ ok: false }); }, dispose() {}, getSummary: () => null });
  }
  const rail = Math.max(0.075, Math.min(0.14, profile.height * 0.065));
  const depth = 0.085;
  const metadata = freeze({
    kind: 'w765r5-live-station-monitor', stationId, interactionRole: 'terminal', part: 'terminal',
    interactive: true, explicitUserActionRequired: true, automaticExecution: false, privateDataRead: false,
    accessibilityLabel: `Open ${station.label} from its live monitor`, ...(interactionMetadata || {})
  });
  const rails = [
    ['top', profile.width + rail * 2, rail, 0, profile.height / 2 + rail / 2],
    ['bottom', profile.width + rail * 2, rail, 0, -profile.height / 2 - rail / 2],
    ['left', rail, profile.height, -profile.width / 2 - rail / 2, 0],
    ['right', rail, profile.height, profile.width / 2 + rail / 2, 0]
  ].map(([id, width, height, x, y]) => {
    const mesh = MeshBuilder.CreateBox(`w765r5-monitor-${stationId}-rail-${id}`, { width, height, depth }, scene);
    mesh.parent = root;
    mesh.position.set(x, y, 0);
    mesh.material = id === 'bottom' ? accentMaterial : frameMaterial;
    mesh.isPickable = true;
    mesh.checkCollisions = false;
    mesh.metadata = metadata;
    return mesh;
  });
  const texture = createTexture(scene, DynamicTexture, `w765r5-monitor-${stationId}-texture`, profile.textureWidth, profile.textureHeight);
  const monitorMaterial = createMaterial(scene, StandardMaterial, `w765r5-monitor-${stationId}-material`, texture, accentMaterial);
  const screen = MeshBuilder.CreatePlane(`w765r5-monitor-${stationId}-screen`, { width: profile.width, height: profile.height, sideOrientation: 2 }, scene);
  screen.parent = root;
  screen.position.z = -depth * 0.58;
  screen.material = monitorMaterial;
  screen.isPickable = true;
  screen.checkCollisions = false;
  screen.metadata = metadata;
  const stand = MeshBuilder.CreateBox(`w765r5-monitor-${stationId}-stand`, { width: Math.max(0.16, profile.width * 0.055), height: 0.72, depth: 0.12 }, scene);
  stand.parent = root;
  stand.position.set(0, -profile.height / 2 - 0.46, -0.015);
  stand.material = frameMaterial;
  stand.isPickable = false;
  stand.checkCollisions = false;
  stand.metadata = freeze({ kind: 'w765r5-live-station-monitor-stand', stationId, visibleBackingSlab: false, interactive: false });

  let disposed = false;
  let lastFingerprint = '';
  let lastProjectionAt = -Infinity;
  let lastPaintAt = -Infinity;
  let redrawCount = 0;
  let skippedRedrawCount = 0;
  let view = null;
  const refresh = (reason = 'manual', force = false) => {
    if (disposed) return null;
    let projected = null;
    try { projected = projectionProvider(stationId, reason) || null; } catch { projected = null; }
    view = projected?.schema === EON_CITY_W765R5_STATION_MONITOR_SCHEMA
      ? projected
      : projectEonCityW765R5StationMonitor({ station, ...(projected || {}) });
    lastProjectionAt = finite(now(), Date.now());
    const nextFingerprint = fingerprint(view);
    if (!force && nextFingerprint === lastFingerprint) {
      skippedRedrawCount += 1;
      return view;
    }
    lastFingerprint = nextFingerprint;
    lastPaintAt = lastProjectionAt;
    if (texture && paint(texture, view, profile)) redrawCount += 1;
    return view;
  };
  refresh('mounted', true);

  return freeze({
    ok: true,
    schema: EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
    stationId,
    root,
    screen,
    rails: freeze(rails),
    stand,
    pose,
    facing,
    refresh,
    open(trigger = null) { return openSurface(stationId, trigger || screen); },
    update(timeMs = 0, cameraPosition = null) {
      if (disposed) return;
      const world = root.getAbsolutePosition?.() || pose.worldPosition;
      const distance = cameraPosition ? Math.hypot(finite(cameraPosition.x) - finite(world.x), finite(cameraPosition.y) - finite(world.y), finite(cameraPosition.z) - finite(world.z)) : 10;
      const interval = distance > 24 ? 3_600 : distance > 15 ? 2_200 : profile.hero ? 850 : 1_250;
      if (finite(timeMs) - lastProjectionAt >= interval) refresh('freshness-tick', false);
    },
    getView: () => view,
    getSummary: () => freeze({
      schema: EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
      stationId,
      title: view?.title || profile.title,
      surface: view?.surface || clean(station?.surface),
      facingDot: facing.dot,
      uprightMarker: true,
      readableFrontAxis: 'negative-z',
      textureOrientation: 'upright-front-face',
      negativeScale: false,
      visibleBackingSlab: false,
      explicitMaterials: Boolean(frameMaterial && accentMaterial && screen.material),
      redrawCount,
      skippedRedrawCount,
      lastProjectionAt,
      lastPaintAt,
      redrawOnStateChangeOnly: true,
      privateDataRead: false,
      automaticExecution: false,
      inventedActivity: false
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      try { texture?.dispose?.(); } catch {}
      try { if (monitorMaterial && monitorMaterial !== accentMaterial) monitorMaterial.dispose?.(); } catch {}
      try { root.dispose?.(false, false); } catch {}
    }
  });
}

export function validateEonCityW765R5StationMonitorContract() {
  const errors = [];
  if (EON_CITY_W765R5_STATION_MONITOR_IDS.length !== 10) errors.push('station-count');
  for (const stationId of EON_CITY_W765R5_STATION_MONITOR_IDS) {
    const profile = EON_CITY_W765R5_MONITOR_PROFILES[stationId];
    if (!profile?.title || !(profile.width > 2.5) || !(profile.height > 1.5)) errors.push(`profile:${stationId}`);
    if (!(profile.textureWidth >= 768) || !(profile.textureHeight >= 432)) errors.push(`resolution:${stationId}`);
  }
  if (!(EON_CITY_W765R5_MONITOR_PROFILES['eonbot-nexus'].width > EON_CITY_W765R5_MONITOR_PROFILES['share-capture'].width)) errors.push('hero-size');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_CITY_W765R5_STATION_MONITOR_SCHEMA, stationCount: EON_CITY_W765R5_STATION_MONITOR_IDS.length });
}

export default freeze({
  EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
  EON_CITY_W765R5_STATION_MONITOR_IDS,
  EON_CITY_W765R5_MONITOR_PROFILES,
  resolveEonCityW765R5MonitorPose,
  validateEonCityW765R5MonitorFacing,
  projectEonCityW765R5StationMonitor,
  createEonCityW765R5StationMonitor,
  validateEonCityW765R5StationMonitorContract
});
