/**
 * realmworld-renderer.js
 * Browser-only visual helpers for EON RealmWorld.
 *
 * The module is intentionally pure/lightweight: no fetch, no /api calls, no
 * Cloudflare Worker dependency, and no required Three.js/WebXR bundle. It gives
 * the page a staged upgrade path from 2.5D CSS to canvas/WebGL-style rendering,
 * ghost avatars, portal transitions, and optional WebXR detection.
 */

const SAFE_EMOTES = Object.freeze(['wave', 'spark', 'bow', 'cheer', 'trade', 'thanks']);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function asPoint(item = {}, fallbackIndex = 0) {
  const angle = (Math.PI * 2 * fallbackIndex) / 8;
  const fallbackAltitude = Number(item.rarityTier || 0) * 8;
  return {
    x: clamp(item.x ?? 50 + Math.cos(angle) * 30, 4, 96),
    y: clamp(item.y ?? 50 + Math.sin(angle) * 30, 4, 96),
    z: clamp(item.altitude ?? (Number.isFinite(fallbackAltitude) && fallbackAltitude > 0 ? fallbackAltitude : 12), 0, 64)
  };
}

function terrainHue(terrain = '') {
  const key = String(terrain || '').toLowerCase();
  if (key.includes('forest')) return { base: '#052e16', accent: '#34d399', glow: '#bbf7d0' };
  if (key.includes('desert')) return { base: '#1c1917', accent: '#f59e0b', glow: '#fde68a' };
  if (key.includes('aurora')) return { base: '#164e63', accent: '#2dd4bf', glow: '#a7f3d0' };
  if (key.includes('crystal')) return { base: '#082f49', accent: '#38bdf8', glow: '#bae6fd' };
  return { base: '#020617', accent: '#818cf8', glow: '#e0e7ff' };
}

export function createRealmCameraState(input = {}) {
  return {
    x: clamp(input.x ?? 50, 0, 100),
    y: clamp(input.y ?? 50, 0, 100),
    zoom: clamp(input.zoom ?? 1, 0.72, 1.85),
    rotation: clamp(input.rotation ?? 0, -18, 18),
    pitch: clamp(input.pitch ?? 58, 36, 70),
    mode: input.mode === '3d' ? '3d' : input.mode === 'canvas' ? 'canvas' : 'css'
  };
}

export function nudgeRealmCamera(camera = {}, delta = {}) {
  const current = createRealmCameraState(camera);
  return createRealmCameraState({
    ...current,
    x: current.x + Number(delta.x || 0),
    y: current.y + Number(delta.y || 0),
    zoom: current.zoom + Number(delta.zoom || 0),
    rotation: current.rotation + Number(delta.rotation || 0),
    pitch: current.pitch + Number(delta.pitch || 0),
    mode: delta.mode || current.mode
  });
}

export function getRealmCameraCssVars(camera = {}) {
  const normalized = createRealmCameraState(camera);
  return {
    '--rw-camera-x': `${(50 - normalized.x) * normalized.zoom}%`,
    '--rw-camera-y': `${(50 - normalized.y) * normalized.zoom}%`,
    '--rw-camera-zoom': normalized.zoom.toFixed(3),
    '--rw-camera-rotation': `${normalized.rotation.toFixed(2)}deg`,
    '--rw-camera-pitch': `${normalized.pitch.toFixed(2)}deg`
  };
}

export function buildRealmParallaxLayers(snapshot = {}) {
  const palette = Array.isArray(snapshot.palette) ? snapshot.palette : [];
  const colors = terrainHue(snapshot.terrain);
  return [
    {
      id: 'sky-rift',
      depth: 0.14,
      label: 'Aurora sky rift',
      gradient: `radial-gradient(circle at 18% 18%, ${palette[1] || colors.accent}44, transparent 22%), radial-gradient(circle at 80% 22%, ${palette[2] || colors.glow}33, transparent 26%)`
    },
    {
      id: 'distant-ridges',
      depth: 0.34,
      label: 'Distant terrain ridges',
      gradient: `linear-gradient(110deg, transparent 0 14%, ${colors.accent}22 15% 19%, transparent 20% 42%, ${colors.glow}18 43% 48%, transparent 49%)`
    },
    {
      id: 'energy-grid',
      depth: 0.62,
      label: 'Realm energy grid',
      gradient: `linear-gradient(90deg, ${colors.accent}20 1px, transparent 1px), linear-gradient(0deg, ${colors.accent}14 1px, transparent 1px)`
    }
  ];
}

export function buildRealmPortalNodes(snapshot = {}) {
  const portals = Array.isArray(snapshot.portals) ? snapshot.portals : [];
  const fallback = [
    { x: 50, y: 8 },
    { x: 86, y: 50 },
    { x: 50, y: 88 },
    { x: 14, y: 50 }
  ];
  return portals.slice(0, 6).map((portal, index) => ({
    ...portal,
    x: clamp(portal.x ?? fallback[index % fallback.length].x, 5, 95),
    y: clamp(portal.y ?? fallback[index % fallback.length].y, 5, 95),
    altitude: clamp(portal.altitude ?? 30 + index * 4, 10, 58),
    transition: portal.type === 'ai' ? 'neural-rift' : portal.type === 'market' ? 'showroom-warp' : 'vault-gate'
  }));
}

export function buildRealmGhostAvatars(snapshot = {}, options = {}) {
  const safety = snapshot.safety || {};
  const requested = Number(options.count ?? (safety.presenceMode === 'solo' ? 1 : safety.maxPeers || 4));
  const count = clamp(requested, 1, 4);
  const seedText = String(snapshot.seed || 'realmworld');
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  const next = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return ((seed >>> 0) % 1000) / 1000;
  };
  return Array.from({ length: count }, (_, index) => ({
    id: index === 0 ? 'ghost-owner' : `ghost-visitor-${index}`,
    label: index === 0 ? 'Owner ghost' : `Visitor ghost ${index}`,
    x: Math.round(22 + next() * 56),
    y: Math.round(22 + next() * 56),
    altitude: Math.round(18 + next() * 34),
    emote: SAFE_EMOTES[index % SAFE_EMOTES.length],
    ownerControlled: index === 0,
    opacity: index === 0 ? 0.92 : 0.58
  }));
}

export function buildRealmMinimapModel(snapshot = {}) {
  const districts = Array.isArray(snapshot.districts) ? snapshot.districts : [];
  const monuments = Array.isArray(snapshot.monuments) ? snapshot.monuments : [];
  const npcs = Array.isArray(snapshot.npcs) ? snapshot.npcs : [];
  const portals = buildRealmPortalNodes(snapshot);
  return {
    terrain: snapshot.terrain || 'unknown',
    points: [
      ...districts.map((item, index) => ({ ...asPoint(item, index), kind: 'district', label: item.label || item.type || 'District' })),
      ...monuments.slice(0, 14).map((item, index) => ({ ...asPoint(item, index), kind: 'monument', label: item.building || item.title || 'Monument' })),
      ...npcs.map((item, index) => ({ ...asPoint(item, index), kind: 'npc', label: item.name || 'NPC' })),
      ...portals.map((item, index) => ({ ...asPoint(item, index), kind: 'portal', label: item.label || 'Portal' }))
    ]
  };
}

export function getRealmFocusSummary(_snapshot = {}, target = {}) {
  const label = target.label || target.title || target.name || target.building || target.id || 'Realm node';
  const kind = target.kind || target.type || target.collectionType || 'node';
  const action = kind === 'portal'
    ? 'Portal transition ready. Owner can open this route without server-side game state.'
    : kind === 'loot'
      ? 'Loot event is local-first and cooldown-gated.'
      : kind === 'npc'
        ? 'NPC uses preset safe cards, not public free-form chat.'
        : 'World object is deterministic from the owner snapshot.';
  return `${label} · ${action}`;
}

export function getRealmWebXRSupportInfo(environment = {}) {
  const nav = environment.navigator || (typeof navigator !== 'undefined' ? navigator : undefined);
  const doc = environment.document || (typeof document !== 'undefined' ? document : undefined);
  const secure = environment.isSecureContext ?? (typeof globalThis !== 'undefined' && typeof globalThis.isSecureContext === 'boolean' ? globalThis.isSecureContext : false);
  const xrApiPresent = Boolean(nav && nav.xr);
  return {
    apiPresent: xrApiPresent,
    secureContext: Boolean(secure),
    immersiveSupportedHint: xrApiPresent && Boolean(secure),
    buttonLabel: xrApiPresent && secure ? 'WebXR viewer available' : 'WebXR optional / not available here',
    note: 'WebXR is optional viewing only. RealmWorld must remain playable as HTML/CSS/canvas first.',
    documentReady: Boolean(doc)
  };
}

export function createPortalTransitionState(portal = {}, now = '') {
  return {
    schema: 'eon.realmworld.portal-transition.v1',
    portalId: String(portal.id || 'portal'),
    label: String(portal.label || 'Realm portal'),
    href: String(portal.href || '#'),
    transition: String(portal.transition || portal.type || 'realm-warp'),
    createdAt: now || new Date().toISOString(),
    requiresCloudflareWorker: false,
    serverGameState: false
  };
}

export function drawRealmCanvas(ctx, snapshot = {}, camera = {}, options = {}) {
  if (!ctx || !ctx.canvas) return { ok: false, reason: 'missing-canvas' };
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const colors = terrainHue(snapshot.terrain);
  const normalized = createRealmCameraState(camera);
  ctx.clearRect(0, 0, width, height);
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, colors.base);
  bg.addColorStop(0.55, '#0f172a');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(normalized.zoom, normalized.zoom);
  ctx.rotate((normalized.rotation * Math.PI) / 180);
  ctx.translate((50 - normalized.x) * width / 100, (50 - normalized.y) * height / 100);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  const step = Math.max(24, Math.min(width, height) / 10);
  for (let x = -width; x <= width * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, -height);
    ctx.lineTo(x - height * 0.45, height * 2);
    ctx.stroke();
  }
  for (let y = -height; y <= height * 2; y += step) {
    ctx.beginPath();
    ctx.moveTo(-width, y);
    ctx.lineTo(width * 2, y - width * 0.25);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const miniModel = buildRealmMinimapModel(snapshot);
  miniModel.points.forEach((point) => {
    const px = (point.x / 100) * width;
    const py = (point.y / 100) * height;
    const radius = point.kind === 'portal' ? 7 : point.kind === 'monument' ? 5 : 3.5;
    ctx.beginPath();
    ctx.arc(px, py - point.z * 0.18, radius, 0, Math.PI * 2);
    ctx.fillStyle = point.kind === 'portal' ? colors.glow : point.kind === 'npc' ? '#67e8f9' : point.kind === 'monument' ? '#c4b5fd' : colors.accent;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = point.kind === 'portal' ? 18 : 9;
    ctx.fill();
  });
  ctx.restore();
  ctx.shadowBlur = 0;

  if (options.drawLabel !== false) {
    ctx.fillStyle = 'rgba(226,232,240,.86)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`${snapshot.terrain || 'Realm'} · canvas renderer · no server polling`, 14, height - 16);
  }
  return { ok: true, points: buildRealmMinimapModel(snapshot).points.length };
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function drawRealmWebGlPreview(gl, snapshot = {}, camera = {}) {
  if (!gl || !gl.canvas) return { ok: false, reason: 'missing-webgl' };
  const points = buildRealmMinimapModel(snapshot).points.slice(0, 80);
  const normalized = createRealmCameraState(camera);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  const colors = terrainHue(snapshot.terrain);
  const hex = colors.base.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  gl.clearColor(r * 0.55, g * 0.55, b * 0.55, 0.96);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vertexSource = `
    attribute vec2 a_position;
    attribute float a_size;
    uniform float u_zoom;
    uniform vec2 u_camera;
    void main() {
      vec2 centered = (a_position - u_camera) * u_zoom;
      gl_Position = vec4(centered, 0.0, 1.0);
      gl_PointSize = a_size;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = dot(uv, uv);
      if (d > 0.25) discard;
      gl_FragColor = vec4(0.74, 0.89, 1.0, 0.86);
    }
  `;
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return { ok: false, reason: 'shader-init' };
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return { ok: false, reason: 'program-link' };
  gl.useProgram(program);

  const vertices = new Float32Array(points.flatMap((point) => [
    (point.x / 50) - 1,
    1 - (point.y / 50),
    point.kind === 'portal' ? 10 : point.kind === 'monument' ? 8 : 5
  ]));
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const stride = 3 * Float32Array.BYTES_PER_ELEMENT;
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const sizeLocation = gl.getAttribLocation(program, 'a_size');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(sizeLocation);
  gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
  const zoomLocation = gl.getUniformLocation(program, 'u_zoom');
  const cameraLocation = gl.getUniformLocation(program, 'u_camera');
  gl.uniform1f(zoomLocation, Math.max(0.7, Math.min(1.8, normalized.zoom)));
  gl.uniform2f(cameraLocation, (normalized.x / 50) - 1, 1 - (normalized.y / 50));
  gl.drawArrays(gl.POINTS, 0, points.length);
  return { ok: true, points: points.length, renderer: 'webgl-points-preview' };
}
