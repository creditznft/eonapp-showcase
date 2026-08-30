/** W659F — mutable canonical collision registry with fixed/core residency. */
import { normalizeEonCityCollisionVolumes } from '../eon-city-third-person-controller.js';

export const EON_CITY_W659F_COLLISION_REGISTRY_SCHEMA = 'eon.city.w659f.collision-residency.v1';
const freeze = (value) => Object.freeze(value);

export function createEonCityW659fCollisionRegistry({ fixedVolumes = [] } = {}) {
  const fixed = new Map();
  const resident = new Map();
  let revision = 0;
  let cachedRevision = -1;
  let cached = freeze([]);
  const add = (map, volume) => {
    const normalized = normalizeEonCityCollisionVolumes([volume])[0];
    if (!normalized) return false;
    const previous = map.get(normalized.id);
    map.set(normalized.id, normalized);
    if (JSON.stringify(previous) !== JSON.stringify(normalized)) revision += 1;
    return normalized;
  };
  for (const volume of fixedVolumes) add(fixed, volume);
  const getVolumes = () => {
    if (cachedRevision === revision) return cached;
    const merged = new Map([...fixed, ...resident]);
    cached = freeze([...merged.values()]);
    cachedRevision = revision;
    return cached;
  };
  return freeze({
    schema: EON_CITY_W659F_COLLISION_REGISTRY_SCHEMA,
    registerFixed(volume) { return add(fixed, volume); },
    registerResident(assetId = '', volumes = []) {
      const owner = String(assetId || '').trim();
      if (!owner) return freeze({ ok: false, reason: 'asset-id-required' });
      let count = 0;
      for (const volume of volumes) {
        const value = add(resident, { ...volume, id: `${owner}:${String(volume?.id || count + 1)}` });
        if (value) count += 1;
      }
      return freeze({ ok: true, owner, count, revision });
    },
    unregisterResident(assetId = '') {
      const prefix = `${String(assetId || '').trim()}:`;
      let count = 0;
      for (const id of [...resident.keys()]) {
        if (!id.startsWith(prefix)) continue;
        resident.delete(id);
        count += 1;
      }
      if (count) revision += 1;
      return count;
    },
    getVolumes,
    getSummary() {
      return freeze({
        schema: EON_CITY_W659F_COLLISION_REGISTRY_SCHEMA,
        revision,
        fixedCount: fixed.size,
        residentCount: resident.size,
        totalCount: getVolumes().length,
        visualMeshCollision: false,
        physicsEngine: false,
        canonicalTransformAuthority: true
      });
    },
    clearResident() {
      const count = resident.size;
      resident.clear();
      if (count) revision += 1;
      return count;
    }
  });
}
