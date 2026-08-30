/**
 * W602 — original same-origin GLB rig runtime.
 *
 * Loads only catalog-provenanced City assets. It never downloads art from a
 * remote host, starts a microphone, infers AI capability, or hides a failed
 * load. Each imported rig attaches to an existing procedural anchor; the
 * original fallback remains visible until the real GLB container is ready.
 */
import '@babylonjs/loaders/glTF';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

export const EON_CITY_ORIGINAL_RIG_RUNTIME_SCHEMA = 'eon.city.original-rig-runtime.w602.v1';
const CITY_BOOT_AWAIT_TIMEOUT_MS = 10_000;

function freeze(value) {
  return Object.freeze(value);
}

function splitAssetPath(assetPath = '') {
  const normalized = String(assetPath || '');
  const slash = normalized.lastIndexOf('/');
  if (slash < 0) return { rootUrl: '/', fileName: normalized };
  return { rootUrl: normalized.slice(0, slash + 1), fileName: normalized.slice(slash + 1) };
}

function safeSetEnabled(node, enabled) {
  try { node?.setEnabled?.(enabled); } catch {}
}

function stopAll(groups = []) {
  for (const group of groups) {
    try { group.stop?.(); } catch {}
  }
}

function createAnimationDirector(container, namespace = '') {
  const groups = new Map((container?.animationGroups || []).map((group) => [String(group.name || ''), group]));
  let activeName = '';
  const fullName = (name) => `${namespace}::${name}`;
  const resolve = (name) => groups.get(fullName(name)) || groups.get(name) || null;
  return freeze({
    play(name, { loop = false, speed = 1, restart = false } = {}) {
      const group = resolve(name);
      if (!group) return false;
      const nextName = String(group.name || name);
      if (activeName === nextName && !restart && group.isPlaying) return true;
      stopAll([...groups.values()]);
      try { group.start(loop, speed, group.from, group.to, false); } catch { return false; }
      activeName = nextName;
      return true;
    },
    stop() { stopAll([...groups.values()]); activeName = ''; },
    getActiveName() { return activeName; },
    getNames() { return freeze([...groups.keys()]); }
  });
}

function hideProceduralFallback(anchor) {
  const fallback = anchor?.metadata?.proceduralFallbackRoot;
  safeSetEnabled(fallback, false);
  for (const node of anchor?.metadata?.proceduralFallbackExtras || []) safeSetEnabled(node, false);
}

function attachContainerToAnchor(container, anchor) {
  const roots = container?.rootNodes || [];
  for (const root of roots) {
    try { root.parent = anchor; } catch {}
  }
  return roots;
}

async function loadLocalContainer({ variant, scene, signal, onProgress }) {
  if (signal?.aborted) throw new Error('asset-load-aborted');
  const { rootUrl, fileName } = splitAssetPath(variant?.sourcePath);
  if (!fileName || !rootUrl.startsWith('/assets/city/')) throw new Error('asset-path-not-local-city');
  onProgress?.({ stage: 'loader-open', value: 0.25, sourcePath: variant.sourcePath, localOnly: true });
  const container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene, (event) => {
    const total = Number(event?.total || 0);
    const loaded = Number(event?.loaded || 0);
    onProgress?.({ stage: 'loader-progress', value: total > 0 ? Math.min(0.95, loaded / total) : null, sourcePath: variant.sourcePath, localOnly: true });
  });
  if (signal?.aborted) {
    try { container?.dispose?.(); } catch {}
    throw new Error('asset-load-aborted');
  }
  return container;
}

/**
 * Keeps Navigator and EONBOT art state deterministic. Animation names are
 * driven only by locally observable City motion/selection state; EONBOT has
 * no task, provider, account, or background-work semantics.
 */
export function createEonCityOriginalRigRuntime({ scene, assetRuntime, quality = 'balanced', navigatorAnchor, companionAnchor, onStatus = null, enabled = true } = {}) {
  const records = new Map();
  const transientAnimations = new Map();
  let disposed = false;

  const now = () => globalThis.performance?.now?.() || Date.now();
  const playTransient = (assetId, name, durationMs = 900) => {
    const record = records.get(assetId);
    if (!record || !name) return false;
    const played = record.director.play(name, { loop: false, restart: true });
    if (played) transientAnimations.set(assetId, { name: String(name), until: now() + Math.max(180, Number(durationMs) || 900) });
    return played;
  };
  const transientActive = (assetId) => {
    const transient = transientAnimations.get(assetId);
    if (!transient) return false;
    if (now() < transient.until) return true;
    transientAnimations.delete(assetId);
    return false;
  };

  const loadOne = async ({ assetId, anchor, namespace }) => {
    if (disposed || !anchor) return freeze({ ok: false, assetId, reason: disposed ? 'rig-runtime-disposed' : 'anchor-missing' });
    const result = await assetRuntime.loadBabylonAsset(assetId, {
      scene,
      quality,
      cacheKey: `original-rig:${assetId}:${quality}`,
      timeoutMs: CITY_BOOT_AWAIT_TIMEOUT_MS,
      loadAssetContainer: loadLocalContainer,
      onProgress: (progress) => onStatus?.(`Loading local ${assetId} art: ${progress.stage}.`)
    });
    if (!result.ok) return result;
    const handle = assetRuntime.handles.get(`original-rig:${assetId}:${quality}`)?.handle;
    if (!handle) return freeze({ ok: false, assetId, reason: 'loaded-handle-unavailable' });
    attachContainerToAnchor(handle, anchor);
    hideProceduralFallback(anchor);
    const director = createAnimationDirector(handle, namespace);
    const initial = assetId === 'operator-hero' ? 'Idle' : 'HoverIdle';
    director.play(initial, { loop: true, speed: 1 });
    records.set(assetId, { assetId, anchor, handle, director, sourcePath: result.sourcePath, quality: result.quality, loaded: true });
    return freeze({ ...result, animationNames: director.getNames() });
  };

  return freeze({
    async start() {
      if (!enabled) {
        onStatus?.('Legacy W602 rig candidates are superseded by the W649 controllable core; procedural anchors remain available as fail-safe fallbacks.');
        return freeze({ disabled: true, reason: 'superseded-by-w649-controllable-core', navigator: freeze({ ok: false, reason: 'disabled' }), companion: freeze({ ok: false, reason: 'disabled' }) });
      }
      const [navigator, companion] = await Promise.all([
        loadOne({ assetId: 'operator-hero', anchor: navigatorAnchor, namespace: 'navigator' }),
        loadOne({ assetId: 'eonbot-companion', anchor: companionAnchor, namespace: 'eonbot' })
      ]);
      onStatus?.(navigator.ok && companion.ok
        ? 'Original Navigator and EONBOT art loaded locally. Visual review remains pending.'
        : 'One or more original City rig candidates could not load; the source-controlled fallback remains active.');
      return freeze({ navigator, companion });
    },
    updateNavigator({ moving = false, speed = 0, turn = 0, emote = '', emoteDurationMs = 900 } = {}) {
      const record = records.get('operator-hero');
      if (!record) return false;
      if (emote) return playTransient('operator-hero', emote, emoteDurationMs);
      if (transientActive('operator-hero')) return true;
      if (Math.abs(turn) > 0.45 && !moving) return record.director.play(turn < 0 ? 'TurnLeft' : 'TurnRight', { loop: false });
      return record.director.play(moving ? (speed > 5.1 ? 'Run' : 'Walk') : 'Idle', { loop: true, speed: moving ? Math.min(1.35, Math.max(0.72, speed / 4.8)) : 1 });
    },
    updateCompanion({ mode = 'idle', emote = '', emoteDurationMs = 900 } = {}) {
      const record = records.get('eonbot-companion');
      if (!record) return false;
      if (emote) return playTransient('eonbot-companion', emote, emoteDurationMs);
      if (transientActive('eonbot-companion')) return true;
      const clip = ({ follow: 'Follow', observe: 'Observe', scan: 'Scan', guide: 'Guide', listen: 'Listen', speak: 'Speak', orbit: 'Orbit', perch: 'Perch', return: 'Return' })[mode] || 'HoverIdle';
      return record.director.play(clip, { loop: ['Follow', 'Observe', 'Scan', 'Guide', 'Listen', 'HoverIdle', 'Orbit'].includes(clip) });
    },
    playNavigatorEmote(name, options = {}) { return this.updateNavigator({ emote: name, emoteDurationMs: options.durationMs }); },
    playCompanionEmote(name, options = {}) { return this.updateCompanion({ emote: name, emoteDurationMs: options.durationMs }); },
    getSummary() {
      const entry = (assetId) => {
        const record = records.get(assetId);
        return freeze({ loaded: Boolean(record), quality: record?.quality || null, sourcePath: record?.sourcePath || null, activeAnimation: record?.director?.getActiveName?.() || null, animationNames: record?.director?.getNames?.() || freeze([]) });
      };
      return freeze({ schema: EON_CITY_ORIGINAL_RIG_RUNTIME_SCHEMA, enabled: Boolean(enabled), supersededByW649: !enabled, navigator: entry('operator-hero'), eonbot: entry('eonbot-companion'), activeTransientAnimations: freeze([...transientAnimations.entries()].map(([assetId, value]) => freeze({ assetId, name: value.name }))), localOnly: true, remoteNetwork: false, ownerVisualApprovalPending: true, voiceCapabilityClaimed: false, autonomousAgent: false });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const record of records.values()) record.director?.stop?.();
      transientAnimations.clear();
      records.clear();
    }
  });
}
