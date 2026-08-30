/** W778B — canonical-scene presenter for verified side-mission world memories. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { deriveEonExpanseW778ASideMissionTransformations } from './eon-expanse-w778a-side-mission-transformations.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W778B_SIDE_PRESENTER_SCHEMA = 'eon.expanse.side-transformation-presenter.w778b.v1';

const palette = freeze({ signal: '#65e4ff', rescue: '#ffcf7a', archive: '#b58cff', transit: '#79f0b6', companion: '#70a9ff' });

export function mountEonExpanseW778BSideTransformationPresenter({ scene, parent = null, quality = 'balanced', reducedMotion = false, initialState = {} } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w778b-side-transformation-root', scene);
  if (parent) root.parent = parent;
  const profile = quality === 'lite' ? freeze({ tessellation: 18, markerHeight: 0.9 }) : quality === 'cinematic' ? freeze({ tessellation: 42, markerHeight: 1.5 }) : freeze({ tessellation: 30, markerHeight: 1.2 });
  const entries = new Map();
  const materials = [];
  let projection = deriveEonExpanseW778ASideMissionTransformations(initialState);

  for (const row of projection.rows) {
    const material = new StandardMaterial(`w778b-${row.missionId}-material`, scene);
    const tint = Color3.FromHexString(palette[row.family] || '#65e4ff');
    material.diffuseColor = tint.scale(0.08);
    material.emissiveColor = tint.scale(0.78);
    material.specularColor = Color3.Black();
    material.alpha = 0.78;
    materials.push(material);
    const node = new TransformNode(`w778b-${row.missionId}-node`, scene);
    node.parent = root;
    node.position.set(row.position.x, row.position.y, row.position.z);
    const ring = MeshBuilder.CreateTorus(`w778b-${row.missionId}-ring`, { diameter: 1.7, thickness: 0.065, tessellation: profile.tessellation }, scene);
    ring.parent = node; ring.rotation.x = Math.PI / 2; ring.material = material; ring.isPickable = false; ring.checkCollisions = false;
    const marker = MeshBuilder.CreatePolyhedron(`w778b-${row.missionId}-marker`, { type: 1, size: 0.24 }, scene);
    marker.parent = node; marker.position.y = profile.markerHeight; marker.material = material; marker.isPickable = false; marker.checkCollisions = false;
    node.setEnabled(row.active);
    entries.set(row.missionId, { row, node, ring, marker });
  }

  const applyState = (livingContentState = {}) => {
    projection = deriveEonExpanseW778ASideMissionTransformations(livingContentState);
    for (const row of projection.rows) {
      const entry = entries.get(row.missionId);
      if (!entry) continue;
      entry.row = row;
      entry.node.setEnabled(row.active);
      entry.node.scaling.setAll(Math.min(1.18, 0.96 + Math.log2(Math.max(1, row.completionCount)) * 0.04));
    }
    return getSummary();
  };

  const update = (seconds = 0) => {
    if (reducedMotion) return freeze({ ok: true, reducedMotion: true, activeCount: projection.activeCount });
    for (const entry of entries.values()) {
      if (!entry.node.isEnabled?.()) continue;
      entry.ring.rotation.z = Number(seconds || 0) * 0.24;
      entry.marker.position.y = profile.markerHeight + Math.sin(Number(seconds || 0) * 1.25 + entry.row.position.z) * 0.08;
      entry.marker.rotation.y = Number(seconds || 0) * 0.36;
    }
    return freeze({ ok: true, activeCount: projection.activeCount });
  };

  const getSummary = () => freeze({
    schema: EON_EXPANSE_W778B_SIDE_PRESENTER_SCHEMA,
    mounted: true,
    activeCount: projection.activeCount,
    total: projection.total,
    completionTotal: projection.completionTotal,
    rows: freeze(projection.rows.map((row) => freeze({ missionId: row.missionId, zoneId: row.zoneId, active: row.active, completionCount: row.completionCount, status: row.status }))),
    canonicalScene: root.getScene?.() === scene,
    interactive: false,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    reducedMotion: Boolean(reducedMotion)
  });

  applyState(initialState);
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W778B_SIDE_PRESENTER_SCHEMA,
    root,
    applyState,
    update,
    getSummary,
    dispose() {
      for (const material of materials) try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W778B_SIDE_PRESENTER_SCHEMA, mountEonExpanseW778BSideTransformationPresenter });
