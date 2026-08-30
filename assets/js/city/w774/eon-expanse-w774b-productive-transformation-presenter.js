/** W774B — canonical-scene presenter for verified productive world transformations. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { deriveEonExpanseW774AProductiveTransformations } from './eon-expanse-w774a-productive-world-transformations.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W774B_PRODUCTIVE_PRESENTER_SCHEMA = 'eon.expanse.productive-transformation-presenter.w774b.v1';

const palette = freeze({ creator: '#ffbd68', ai: '#42d8ff', systems: '#74f5bc', knowledge: '#b38cff', status: '#f3f7ff' });

export function mountEonExpanseW774BProductiveTransformationPresenter({ scene, parent = null, quality = 'balanced', reducedMotion = false, initialState = {} } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w774b-productive-transformation-root', scene);
  if (parent) root.parent = parent;
  const entries = new Map();
  const materials = [];
  const profile = quality === 'lite' ? freeze({ tessellation: 20, beamHeight: 1.8 }) : quality === 'cinematic' ? freeze({ tessellation: 48, beamHeight: 3.1 }) : freeze({ tessellation: 32, beamHeight: 2.4 });
  const initial = deriveEonExpanseW774AProductiveTransformations(initialState);
  for (const row of initial.rows) {
    const material = new StandardMaterial(`w774b-${row.missionId}-material`, scene);
    const tint = Color3.FromHexString(palette[row.family] || '#42d8ff');
    material.diffuseColor = tint.scale(0.12);
    material.emissiveColor = tint.scale(0.82);
    material.specularColor = Color3.Black();
    material.alpha = 0.86;
    materials.push(material);
    const node = new TransformNode(`w774b-${row.missionId}-node`, scene);
    node.parent = root;
    node.position.set(row.position.x, row.position.y, row.position.z);
    const ring = MeshBuilder.CreateTorus(`w774b-${row.missionId}-ring`, { diameter: 2.75, thickness: 0.09, tessellation: profile.tessellation }, scene);
    ring.parent = node; ring.rotation.x = Math.PI / 2; ring.material = material; ring.isPickable = false; ring.checkCollisions = false;
    const beacon = MeshBuilder.CreateCylinder(`w774b-${row.missionId}-beacon`, { diameter: 0.11, height: profile.beamHeight, tessellation: 10 }, scene);
    beacon.parent = node; beacon.position.y = profile.beamHeight / 2; beacon.material = material; beacon.isPickable = false; beacon.checkCollisions = false;
    node.setEnabled(row.active);
    entries.set(row.missionId, { row, node, ring, beacon });
  }
  let projection = initial;
  const applyState = (livingContentState = {}) => {
    projection = deriveEonExpanseW774AProductiveTransformations(livingContentState);
    for (const row of projection.rows) {
      const entry = entries.get(row.missionId);
      if (!entry) continue;
      entry.row = row;
      entry.node.setEnabled(row.active);
    }
    return getSummary();
  };
  const update = (seconds = 0) => {
    if (reducedMotion) return freeze({ ok: true, reducedMotion: true, activeCount: projection.activeCount });
    for (const entry of entries.values()) {
      if (!entry.node.isEnabled?.()) continue;
      entry.ring.rotation.z = Number(seconds || 0) * 0.32;
      entry.beacon.scaling.y = 0.88 + Math.sin(Number(seconds || 0) * 1.7 + entry.row.position.x) * 0.12;
    }
    return freeze({ ok: true, activeCount: projection.activeCount });
  };
  const getSummary = () => freeze({
    schema: EON_EXPANSE_W774B_PRODUCTIVE_PRESENTER_SCHEMA,
    mounted: true,
    activeCount: projection.activeCount,
    total: projection.total,
    rows: freeze(projection.rows.map((row) => freeze({ missionId: row.missionId, zoneId: row.zoneId, active: row.active, status: row.status }))),
    canonicalScene: root.getScene?.() === scene,
    interactive: false,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    reducedMotion: Boolean(reducedMotion)
  });
  return freeze({ ok: true, schema: EON_EXPANSE_W774B_PRODUCTIVE_PRESENTER_SCHEMA, root, applyState, update, getSummary, dispose() { for (const material of materials) try { material.dispose?.(); } catch {} try { root.dispose?.(false, true); } catch {} return freeze({ ok: true }); } });
}

export default freeze({ EON_EXPANSE_W774B_PRODUCTIVE_PRESENTER_SCHEMA, mountEonExpanseW774BProductiveTransformationPresenter });
