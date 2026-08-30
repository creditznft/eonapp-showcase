/** RT92 shared art runtime — presentation policy only; never a render authority. */
import { buildEonCityRt92GrandArtPlan, validateEonCityRt92GrandArtPlan } from './eon-city-rt92-grand-art-bible.js';

export const EON_CITY_RT92_SHARED_ART_RUNTIME_SCHEMA = 'eon.city.shared-art-runtime.rt92.v1';
const freeze = Object.freeze;
const WORLD_IDS = freeze(['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']);

function worldId(value = '') {
  const id = String(value || '');
  return WORLD_IDS.includes(id) ? id : 'command-hub';
}

export function createEonCityRt92SharedArtRuntime({ quality = 'balanced', reducedMotion = false, coarsePointer = false, onChange = null } = {}) {
  let disposed = false;
  let activeWorldId = 'command-hub';
  let sequence = 0;
  const plan = buildEonCityRt92GrandArtPlan({ quality, reducedMotion, coarsePointer });
  const validation = validateEonCityRt92GrandArtPlan(plan);
  if (!validation.ok) throw new Error(`rt92-grand-art-plan-invalid:${validation.errors.join(',')}`);

  const snapshot = (reason = 'snapshot') => {
    const world = plan.worlds[activeWorldId];
    return freeze({
      schema: EON_CITY_RT92_SHARED_ART_RUNTIME_SCHEMA,
      sequence,
      disposed,
      reason,
      activeWorldId,
      world,
      quality: plan.quality,
      runtimeBudget: plan.runtimeBudget,
      streaming: plan.streaming,
      sharpness: plan.sharpness,
      firstFrameNewBinaryBytes: plan.binaryBudget.firstFrameNewBinaryBytes,
      ownsBabylonEngine: false,
      ownsScene: false,
      ownsRenderLoop: false,
      ownsProgression: false,
      networkRequestCreated: false
    });
  };

  const publish = (reason) => {
    const next = snapshot(reason);
    try { onChange?.(next); } catch {}
    return next;
  };

  return freeze({
    schema: EON_CITY_RT92_SHARED_ART_RUNTIME_SCHEMA,
    getPlan: () => plan,
    getSnapshot: () => snapshot(),
    setActiveWorld(nextWorldId, { reason = 'world-change' } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'disposed', snapshot: snapshot('disposed') });
      const next = worldId(nextWorldId);
      const changed = next !== activeWorldId;
      activeWorldId = next;
      if (changed) sequence += 1;
      return freeze({ ok: true, changed, snapshot: publish(reason) });
    },
    getWorldDirective(nextWorldId = activeWorldId) {
      const id = worldId(nextWorldId);
      const identity = plan.worlds[id];
      return freeze({
        schema: EON_CITY_RT92_SHARED_ART_RUNTIME_SCHEMA,
        worldId: id,
        identity,
        rings: plan.streaming,
        runtimeBudget: plan.runtimeBudget,
        visibleLayerIds: plan.layers,
        localOnly: true,
        sameOriginOnly: true,
        automaticAssetFetch: false
      });
    },
    dispose() {
      if (disposed) return snapshot('already-disposed');
      disposed = true;
      sequence += 1;
      return publish('disposed');
    }
  });
}

export default freeze({ EON_CITY_RT92_SHARED_ART_RUNTIME_SCHEMA, createEonCityRt92SharedArtRuntime });
