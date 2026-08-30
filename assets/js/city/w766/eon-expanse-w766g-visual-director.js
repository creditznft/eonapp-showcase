import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Scene } from '@babylonjs/core/scene.js';
import { deriveEonExpanseW767QEventAtmosphere } from './eon-expanse-w767q-event-atmosphere.js';

const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value || 0)));
const QUALITY_COUNTS = freeze({ lite: 16, balanced: 36, cinematic: 64 });
const QUALITY_UPDATE_INTERVAL_SECONDS = freeze({ lite: 0.08, balanced: 0.045, cinematic: 0.033 });
const ZONE_VISUALS = freeze({
  'gateway-overlook': freeze({ fog: '#0e2038', clear: '#030711', accent: '#25b6ff' }),
  'beacon-fields': freeze({ fog: '#102b3a', clear: '#020812', accent: '#58e6b2' }),
  'archive-ruins': freeze({ fog: '#21183a', clear: '#070511', accent: '#9d72ff' }),
  'transit-scar': freeze({ fog: '#2c1a16', clear: '#09060a', accent: '#ffbc62' }),
  'horizon-vault': freeze({ fog: '#201b38', clear: '#080612', accent: '#d5b6ff' })
});

export const EON_EXPANSE_W766G_VISUAL_SCHEMA = 'eon.city.expanse.visual-director.w766g.v1';

function seedUnit(seed, index, channel = 0) {
  let value = (Number(seed || 1) ^ Math.imul(index + 17, 0x45d9f3b) ^ Math.imul(channel + 31, 0x27d4eb2d)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  return (value >>> 0) / 4294967295;
}

function copyColor4(value, fallback = new Color4(0.01, 0.02, 0.04, 1)) {
  try { return value?.clone?.() || new Color4(value.r, value.g, value.b, value.a); } catch { return fallback.clone(); }
}

function copyColor3(value, fallback = new Color3(0.05, 0.1, 0.18)) {
  try { return value?.clone?.() || new Color3(value.r, value.g, value.b); } catch { return fallback.clone(); }
}

export function mountEonExpanseW766GVisualDirector({ scene, quality = 'balanced', reducedMotion = false, worldSeed = 1 } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const resolvedQuality = QUALITY_COUNTS[quality] ? quality : 'balanced';
  const root = new TransformNode('w766g-expanse-atmosphere-root', scene);
  root.setEnabled(false);
  const material = new StandardMaterial('w766g-expanse-atmosphere-material', scene);
  material.diffuseColor = Color3.Black();
  material.emissiveColor = Color3.FromHexString('#25b6ff').scale(0.9);
  material.alpha = 0.58;
  material.disableLighting = true;
  const count = reducedMotion ? 0 : QUALITY_COUNTS[resolvedQuality];
  const motes = [];
  for (let index = 0; index < count; index += 1) {
    const mote = MeshBuilder.CreateBox(`w766g-atmosphere-mote-${index}`, { width: 0.035, height: 0.42 + seedUnit(worldSeed, index, 1) * 0.62, depth: 0.035 }, scene);
    mote.parent = root;
    mote.material = material;
    mote.isPickable = false;
    mote.checkCollisions = false;
    mote.visibility = 0.28 + seedUnit(worldSeed, index, 2) * 0.48;
    motes.push(mote);
  }
  let active = false;
  let disposed = false;
  let zoneId = 'gateway-overlook';
  let density = 0.5;
  let restorationPercent = 0;
  let eventAtmosphere = deriveEonExpanseW767QEventAtmosphere(null, { reducedMotion });
  let eventAtmosphereKey = 'none';
  let lastMoteUpdateAt = -Infinity;
  let lastAppliedSceneKey = '';
  const updateIntervalSeconds = QUALITY_UPDATE_INTERVAL_SECONDS[resolvedQuality];
  let snapshot = null;

  function captureScene() {
    if (snapshot) return snapshot;
    snapshot = freeze({
      fogMode: scene.fogMode,
      fogDensity: Number(scene.fogDensity || 0),
      fogColor: copyColor3(scene.fogColor),
      clearColor: copyColor4(scene.clearColor)
    });
    return snapshot;
  }

  function applyScene({ force = false } = {}) {
    if (!active || disposed) return false;
    const visual = ZONE_VISUALS[zoneId] || ZONE_VISUALS['gateway-overlook'];
    const zoneFog = clamp(density, 0.08, 0.7);
    const accent = eventAtmosphere.active && eventAtmosphere.accent ? eventAtmosphere.accent : visual.accent;
    const nextKey = `${zoneId}|${zoneFog.toFixed(4)}|${restorationPercent.toFixed(2)}|${eventAtmosphereKey}|${accent}`;
    if (!force && nextKey === lastAppliedSceneKey) return false;
    lastAppliedSceneKey = nextKey;
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = (0.0028 + zoneFog * 0.0065) * eventAtmosphere.fogMultiplier;
    scene.fogColor = Color3.FromHexString(visual.fog);
    scene.clearColor = Color4.FromHexString(`${visual.clear}ff`);
    material.emissiveColor = Color3.FromHexString(accent).scale(0.82 + restorationPercent * 0.0018);
    return true;
  }

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W766G_VISUAL_SCHEMA,
    activate(presentation = null) {
      if (disposed) return freeze({ ok: false, reason: 'visual-director-disposed' });
      captureScene();
      active = true;
      root.setEnabled(count > 0);
      if (presentation) this.apply(presentation);
      else applyScene({ force: true });
      return freeze({ ok: true, canonicalScene: root.getScene?.() === scene });
    },
    apply(presentation = {}) {
      zoneId = String(presentation.currentZone || zoneId || 'gateway-overlook');
      const zone = presentation.zones?.[zoneId] || {};
      density = Number(zone.fog ?? presentation.profile?.weatherDensity ?? density);
      restorationPercent = clamp(presentation.global?.restorationPercent, 0, 100);
      const sceneChanged = applyScene();
      return freeze({ ok: true, zoneId, density, restorationPercent, active, sceneChanged });
    },
    applyDynamicEvent(event = null, { eventActive = true } = {}) {
      const nextKey = eventActive && event
        ? `${String(event.id || event.eventId || event.type || 'event')}|${String(event.updatedAt || event.at || event.expiresAt || '')}`
        : 'none';
      if (nextKey === eventAtmosphereKey) return freeze({ ok: true, eventAtmosphere, changed: false });
      eventAtmosphereKey = nextKey;
      eventAtmosphere = deriveEonExpanseW767QEventAtmosphere(event, { active: eventActive, reducedMotion });
      const sceneChanged = applyScene({ force: true });
      return freeze({ ok: true, eventAtmosphere, changed: true, sceneChanged });
    },
    update(seconds = 0, playerPosition = {}) {
      if (!active || disposed || count === 0) return freeze({ ok: true, active, moteCount: count, eventAtmosphere, ownsRenderLoop: false });
      const rawSeconds = Number(seconds || 0);
      if (Number.isFinite(lastMoteUpdateAt) && rawSeconds - lastMoteUpdateAt < updateIntervalSeconds) {
        return freeze({ ok: true, active: true, moteCount: motes.length, throttled: true, updateIntervalSeconds, ownsRenderLoop: false });
      }
      lastMoteUpdateAt = rawSeconds;
      const t = rawSeconds * eventAtmosphere.moteSpeedMultiplier;
      const px = Number(playerPosition.x || 0);
      const pz = Number(playerPosition.z || 0);
      const spread = resolvedQuality === 'lite' ? 18 : resolvedQuality === 'cinematic' ? 32 : 25;
      for (let index = 0; index < motes.length; index += 1) {
        const phase = seedUnit(worldSeed, index, 3) * Math.PI * 2;
        const radius = 4 + seedUnit(worldSeed, index, 4) * spread;
        const speed = 0.045 + seedUnit(worldSeed, index, 5) * 0.11;
        motes[index].position.x = px + Math.sin(phase + t * speed) * radius;
        motes[index].position.z = pz + Math.cos(phase + t * speed * 0.8) * radius;
        motes[index].position.y = 0.7 + ((seedUnit(worldSeed, index, 6) * 11 + t * (0.18 + speed)) % 11);
        motes[index].rotation.y = phase + t * 0.12;
      }
      return freeze({ ok: true, active: true, moteCount: motes.length, throttled: false, updateIntervalSeconds, ownsRenderLoop: false });
    },
    deactivate() {
      active = false;
      root.setEnabled(false);
      if (snapshot) {
        scene.fogMode = snapshot.fogMode;
        scene.fogDensity = snapshot.fogDensity;
        scene.fogColor = copyColor3(snapshot.fogColor);
        scene.clearColor = copyColor4(snapshot.clearColor);
      }
      snapshot = null;
      eventAtmosphere = deriveEonExpanseW767QEventAtmosphere(null, { reducedMotion });
      eventAtmosphereKey = 'none';
      lastAppliedSceneKey = '';
      lastMoteUpdateAt = -Infinity;
      return freeze({ ok: true, hubVisualStateRestored: true });
    },
    getSummary() {
      return freeze({
        schema: EON_EXPANSE_W766G_VISUAL_SCHEMA,
        active,
        zoneId,
        quality: resolvedQuality,
        reducedMotion,
        moteCount: motes.length,
        updateIntervalSeconds,
        changeDrivenSceneApplication: true,
        restorationPercent,
        eventAtmosphere,
        canonicalScene: root.getScene?.() === scene,
        externalWeatherData: false,
        visualAtmosphereOnly: true
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      this.deactivate();
      disposed = true;
      try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}
