/**
 * W765R7 — large outer-wall display gallery.
 *
 * Replaces the small station-mounted monitors with readable, clickable wall
 * displays. Screens are placed on the outer ring, face the room centre and use
 * one pixel-orientation authority (DynamicTexture.update(true)).
 */
import {
  EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
  EON_CITY_W765R5_STATION_MONITOR_IDS,
  projectEonCityW765R5StationMonitor
} from './eon-city-w765r5-station-monitor.js';

export const EON_CITY_W765R7_WALL_DISPLAY_SCHEMA = 'eon.city.wall-display-gallery.w765r8.v1';
const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clean = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

export const EON_CITY_W765R7_WALL_DISPLAY_PROFILE = freeze({
  radius: 22.4,
  y: 4.25,
  width: 6.2,
  height: 3.48,
  textureWidth: 1536,
  textureHeight: 864,
  hitDepth: 0.7,
  minAngularSeparation: 0.42
});

export function resolveEonCityW765R7WallDisplayPose({ station = null, index = 0, count = 10, profile = EON_CITY_W765R7_WALL_DISPLAY_PROFILE } = {}) {
  if (!station?.position) return freeze({ ok: false, reason: 'station-position-required' });
  const sourceAngle = Math.atan2(finite(station.position.x), finite(station.position.z));
  const fallbackAngle = (Math.PI * 2 * finite(index)) / Math.max(1, finite(count, 10));
  const angle = Number.isFinite(sourceAngle) ? sourceAngle : fallbackAngle;
  const radius = finite(profile.radius, 22.4);
  const position = freeze({ x: Math.sin(angle) * radius, y: finite(profile.y, 4.25), z: Math.cos(angle) * radius });
  // Plane readable face is local -Z. Rotate that axis toward the room centre.
  const yaw = Math.atan2(position.x, position.z);
  return freeze({ ok: true, angle, position, yaw, focusPose: freeze({ x: 0, y: position.y * 0.8, z: 0 }) });
}

export function validateEonCityW765R7WallDisplayPose({ pose = null } = {}) {
  if (!pose?.ok) return freeze({ ok: false, reason: 'pose-required' });
  const toCentreLength = Math.max(0.001, Math.hypot(-pose.position.x, -pose.position.z));
  const toCentre = { x: -pose.position.x / toCentreLength, z: -pose.position.z / toCentreLength };
  const readableFront = { x: -Math.sin(pose.yaw), z: -Math.cos(pose.yaw) };
  const dot = readableFront.x * toCentre.x + readableFront.z * toCentre.z;
  return freeze({ ok: dot >= 0.995, dot: Number(dot.toFixed(6)), readableFront: freeze(readableFront), toCentre: freeze(toCentre) });
}

function createTexture(scene, DynamicTexture, name, profile) {
  if (typeof DynamicTexture !== 'function') return null;
  const texture = new DynamicTexture(name, { width: profile.textureWidth, height: profile.textureHeight }, scene, false);
  texture.hasAlpha = false;
  texture.wrapU = 0;
  texture.wrapV = 0;
  return texture;
}

function paint(texture, view, profile, accent = '#62e9ff') {
  const context = texture?.getContext?.();
  if (!context || !view) return false;
  const { width, height } = texture.getSize?.() || profile;
  const s = Math.min(width / 1536, height / 864);
  const px = (value) => value * s;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#07131a');
  gradient.addColorStop(0.55, '#0b1d26');
  gradient.addColorStop(1, '#071017');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = accent;
  context.lineWidth = px(7);
  context.strokeRect(px(24), px(24), width - px(48), height - px(48));

  // Asymmetric calibration marks make vertical inversion/mirroring visible in
  // real browser evidence and cannot pass merely from transform assertions.
  context.fillStyle = '#ffffff';
  context.font = `800 ${px(22)}px ui-monospace, monospace`;
  context.textAlign = 'left';
  context.fillText('TOP LEFT', px(42), px(56));
  context.fillStyle = accent;
  context.font = `900 ${px(44)}px system-ui, sans-serif`;
  context.fillText('↑', px(46), px(108));
  context.textAlign = 'right';
  context.font = `800 ${px(22)}px ui-monospace, monospace`;
  context.fillText(view.stateLabel || 'READY', width - px(42), px(58));

  context.textAlign = 'left';
  context.fillStyle = accent;
  context.font = `900 ${px(54)}px system-ui, sans-serif`;
  context.fillText(clean(view.title).slice(0, 42), px(70), px(160));
  context.fillStyle = '#eef8fb';
  context.font = `750 ${px(30)}px system-ui, sans-serif`;
  context.fillText(clean(view.headline).slice(0, 82), px(70), px(218));

  const rows = (view.rows || []).slice(0, 4);
  rows.forEach((entry, rowIndex) => {
    const y = px(310 + rowIndex * 112);
    context.fillStyle = rowIndex % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(98,233,255,0.055)';
    context.fillRect(px(62), y - px(48), width - px(124), px(92));
    context.fillStyle = accent;
    context.fillRect(px(78), y - px(30), px(8), px(55));
    context.fillStyle = '#f4fbfd';
    context.font = `800 ${px(25)}px system-ui, sans-serif`;
    context.fillText(clean(entry.label).slice(0, 34), px(108), y - px(4));
    context.fillStyle = '#a8bec8';
    context.font = `650 ${px(21)}px system-ui, sans-serif`;
    context.fillText(clean(entry.summary).slice(0, 78), px(108), y + px(28));
  });

  context.fillStyle = '#7d9aa6';
  context.font = `700 ${px(18)}px ui-monospace, monospace`;
  context.fillText(clean(view.truthBoundary).slice(0, 92), px(70), height - px(58));
  context.fillStyle = accent;
  context.textAlign = 'right';
  context.fillText(`CLICK · ${clean(view.openLabel).toUpperCase().slice(0, 34)}`, width - px(70), height - px(58));
  context.restore();
  // Babylon DynamicTexture's invertY authority. true keeps canvas top at the
  // visual top of the readable face; false caused the live upside-down screens.
  texture.update?.(true);
  return true;
}

export function createEonCityW765R7WallDisplay({
  scene, parent, station = null, index = 0, count = 10, MeshBuilder, TransformNode,
  DynamicTexture = null, StandardMaterial = null, materials = {}, projectionProvider = () => ({}),
  openSurface = () => ({ ok: false }), interactionMetadata = null, now = () => Date.now()
} = {}) {
  if (!scene || !parent || !station?.id || !MeshBuilder || !TransformNode) return freeze({ ok: false, reason: 'wall-display-primitives-required', dispose() {} });
  const profile = EON_CITY_W765R7_WALL_DISPLAY_PROFILE;
  const pose = resolveEonCityW765R7WallDisplayPose({ station, index, count, profile });
  const facing = validateEonCityW765R7WallDisplayPose({ pose });
  if (!facing.ok) return freeze({ ok: false, reason: 'wall-display-facing-invalid', pose, facing, dispose() {} });

  const root = new TransformNode(`w765r7-wall-display-${station.id}`, scene);
  root.parent = parent;
  root.position.set(pose.position.x, pose.position.y, pose.position.z);
  root.rotation.y = pose.yaw;
  const metadata = freeze({
    kind: 'w765r7-wall-display', stationId: station.id, interactionRole: 'wall-display', part: 'wall-display',
    interactive: true, explicitUserActionRequired: true, accessibilityLabel: `Open ${station.label} from the outer-wall display`,
    wallDisplaySchema: EON_CITY_W765R7_WALL_DISPLAY_SCHEMA, ...(interactionMetadata || {})
  });
  root.metadata = metadata;

  const frameMaterial = materials.structure || materials.graphite || materials.surface;
  const accentMaterial = materials.cyan || materials.signal || materials.warm || frameMaterial;
  const interiorTexture = createTexture(scene, DynamicTexture, `w765r8-wall-display-${station.id}-interior-texture`, profile);
  const exteriorTexture = createTexture(scene, DynamicTexture, `w765r8-wall-display-${station.id}-exterior-texture`, profile);
  const createScreenMaterial = (side, texture) => {
    if (!texture || typeof StandardMaterial !== 'function') return accentMaterial;
    const material = new StandardMaterial(`w765r8-wall-display-${station.id}-${side}-material`, scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.backFaceCulling = true;
    material.specularColor?.set?.(0.02, 0.03, 0.04);
    return material;
  };
  const interiorMaterial = createScreenMaterial('interior', interiorTexture);
  const exteriorMaterial = createScreenMaterial('exterior', exteriorTexture);

  const depth = 0.14;
  const rail = 0.16;
  const rails = [
    ['top', profile.width + rail * 2, rail, 0, profile.height / 2 + rail / 2],
    ['bottom', profile.width + rail * 2, rail, 0, -profile.height / 2 - rail / 2],
    ['left', rail, profile.height, -profile.width / 2 - rail / 2, 0],
    ['right', rail, profile.height, profile.width / 2 + rail / 2, 0]
  ].map(([name, width, height, x, y]) => {
    const mesh = MeshBuilder.CreateBox(`w765r7-wall-display-${station.id}-${name}`, { width, height, depth }, scene);
    mesh.parent = root; mesh.position.set(x, y, 0); mesh.material = name === 'bottom' ? accentMaterial : frameMaterial;
    mesh.isPickable = false; mesh.checkCollisions = false; mesh.metadata = freeze({ ...metadata, interactive: false, decorativeOnly: true });
    return mesh;
  });
  const backing = MeshBuilder.CreateBox(`w765r8-wall-display-${station.id}-backing`, { width: profile.width, height: profile.height, depth }, scene);
  backing.parent = root; backing.material = frameMaterial; backing.isPickable = false; backing.checkCollisions = false;
  backing.metadata = freeze({ ...metadata, interactive: false, decorativeOnly: true, part: 'physical-backing' });

  const interiorScreen = MeshBuilder.CreatePlane(`w765r8-wall-display-${station.id}-interior-screen`, { width: profile.width, height: profile.height, sideOrientation: 0 }, scene);
  interiorScreen.parent = root; interiorScreen.position.z = -depth * 0.58; interiorScreen.material = interiorMaterial; interiorScreen.isPickable = true; interiorScreen.checkCollisions = false;
  interiorScreen.metadata = freeze({ ...metadata, displaySide: 'interior', accessibilityLabel: `Open ${station.label} from the interior display face` });

  const exteriorScreen = MeshBuilder.CreatePlane(`w765r8-wall-display-${station.id}-exterior-screen`, { width: profile.width, height: profile.height, sideOrientation: 0 }, scene);
  exteriorScreen.parent = root; exteriorScreen.position.z = depth * 0.58; exteriorScreen.rotation.y = Math.PI; exteriorScreen.material = exteriorMaterial; exteriorScreen.isPickable = true; exteriorScreen.checkCollisions = false;
  exteriorScreen.metadata = freeze({ ...metadata, displaySide: 'exterior', accessibilityLabel: `Open ${station.label} from the exterior display face` });

  const createHitProxy = (side, z) => {
    const proxy = MeshBuilder.CreateBox(`w765r8-wall-display-${station.id}-${side}-hit-proxy`, { width: profile.width + 0.55, height: profile.height + 0.55, depth: profile.hitDepth * 0.45 }, scene);
    proxy.parent = root; proxy.position.z = z; proxy.visibility = 0.001; proxy.isPickable = true; proxy.checkCollisions = false;
    proxy.metadata = freeze({ ...metadata, displaySide: side, part: `${side}-hit-proxy` });
    return proxy;
  };
  const interiorHitProxy = createHitProxy('interior', -profile.hitDepth * 0.28);
  const exteriorHitProxy = createHitProxy('exterior', profile.hitDepth * 0.28);

  let view = null;
  let lastFingerprint = '';
  let lastProjectionAt = -Infinity;
  let redrawCount = 0;
  let disposed = false;
  const refresh = (reason = 'manual', force = false) => {
    if (disposed) return null;
    const projected = projectionProvider(station.id, reason) || {};
    view = projected?.schema === EON_CITY_W765R5_STATION_MONITOR_SCHEMA ? projected : projectEonCityW765R5StationMonitor({ station, ...(projected || {}) });
    const fingerprint = JSON.stringify([view.title, view.headline, view.state, view.rows, view.truthBoundary]);
    lastProjectionAt = finite(now(), Date.now());
    if (force || fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      const accent = station.id === 'share-capture' ? '#ff8ee8' : station.id === 'plans-access' ? '#ffd37b' : '#62e9ff';
      const interiorPainted = interiorTexture && paint(interiorTexture, view, profile, accent);
      const exteriorPainted = exteriorTexture && paint(exteriorTexture, view, profile, accent);
      if (interiorPainted || exteriorPainted) redrawCount += 1;
    }
    return view;
  };
  refresh('mounted', true);

  return freeze({
    ok: true, schema: EON_CITY_W765R7_WALL_DISPLAY_SCHEMA, stationId: station.id, root, interiorScreen, exteriorScreen, backing, interiorHitProxy, exteriorHitProxy, rails: freeze(rails), pose, facing,
    open(trigger = null) { return openSurface(station.id, trigger || interiorHitProxy); },
    refresh,
    update(timeMs = 0) { if (!disposed && finite(timeMs) - lastProjectionAt > 1600) refresh('freshness-tick'); },
    getSummary: () => freeze({ stationId: station.id, title: view?.title || station.label, surface: view?.surface || station.surface, width: profile.width, height: profile.height, textureInvertY: true, calibrationPattern: true, readableFrontAxis: 'negative-z', exteriorRotationY: Math.PI, facingDot: facing.dot, faceCount: 2, separateFrontFaces: true, physicalBacking: true, clickableHitProxy: true, hitProxyCount: 2, redrawCount }),
    dispose() { if (disposed) return; disposed = true; try { interiorTexture?.dispose?.(); } catch {} try { exteriorTexture?.dispose?.(); } catch {} try { if (interiorMaterial && interiorMaterial !== accentMaterial) interiorMaterial.dispose?.(); } catch {} try { if (exteriorMaterial && exteriorMaterial !== accentMaterial) exteriorMaterial.dispose?.(); } catch {} try { root.dispose?.(false, false); } catch {} }
  });
}

export function validateEonCityW765R7WallDisplayContract({ stations = [] } = {}) {
  const errors = [];
  if (EON_CITY_W765R5_STATION_MONITOR_IDS.length !== 10) errors.push('display-count');
  if (!(EON_CITY_W765R7_WALL_DISPLAY_PROFILE.width >= 6)) errors.push('display-width');
  if (!(EON_CITY_W765R7_WALL_DISPLAY_PROFILE.height >= 3.3)) errors.push('display-height');
  if (!(EON_CITY_W765R7_WALL_DISPLAY_PROFILE.radius >= 21)) errors.push('outer-wall-radius');
  for (const station of stations) {
    const pose = resolveEonCityW765R7WallDisplayPose({ station });
    const facing = validateEonCityW765R7WallDisplayPose({ pose });
    if (!pose.ok || !facing.ok) errors.push(`pose:${station?.id || 'unknown'}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_CITY_W765R7_WALL_DISPLAY_SCHEMA, stationCount: stations.length || 10 });
}

export default freeze({ EON_CITY_W765R7_WALL_DISPLAY_SCHEMA, EON_CITY_W765R7_WALL_DISPLAY_PROFILE, resolveEonCityW765R7WallDisplayPose, validateEonCityW765R7WallDisplayPose, createEonCityW765R7WallDisplay, validateEonCityW765R7WallDisplayContract });
