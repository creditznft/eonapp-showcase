/** W799B — non-interactive mission-led Storm Sector visual transformations. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { deriveEonExpanseW799AStormTransformations } from './eon-expanse-w799a-storm-sector-transformations.js';
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W799B_STORM_TRANSFORMATION_PRESENTER_SCHEMA = 'eon.expanse.storm-sector.transformation-presenter.w799b.v1';

export function mountEonExpanseW799BStormTransformationPresenter({ scene, parent = null, reducedMotion = false } = {}) {
  if (!scene || !TransformNode || !MeshBuilder) return freeze({ ok: false, reason: 'storm-transformation-scene-required' });
  const root = new TransformNode('w799b-storm-sector-transformations-root', scene);
  if (parent) root.parent = parent;
  root.setEnabled(false);
  const states = new Map();
  let active = false;
  let activationId = '';
  let packageDigest = '';
  let projection = deriveEonExpanseW799AStormTransformations();
  let disposed = false;

  for (const row of projection.rows) {
    const anchor = new TransformNode(`w799b-${row.familyId}-anchor`, scene);
    anchor.parent = root;
    anchor.position.set(row.position.x, row.position.y + 0.18, row.position.z);
    const lower = MeshBuilder.CreateTorus(`w799b-${row.familyId}-lower`, { diameter: 3.8, thickness: 0.11, tessellation: 36 }, scene);
    lower.parent = anchor;
    lower.rotation.x = Math.PI / 2;
    lower.isPickable = false;
    lower.checkCollisions = false;
    const upper = MeshBuilder.CreateTorus(`w799b-${row.familyId}-upper`, { diameter: 2.5, thickness: 0.08, tessellation: 32 }, scene);
    upper.parent = anchor;
    upper.position.y = 1.05;
    upper.rotation.x = Math.PI / 2;
    upper.isPickable = false;
    upper.checkCollisions = false;
    const core = MeshBuilder.CreateSphere(`w799b-${row.familyId}-core`, { diameter: 0.54, segments: 18 }, scene);
    core.parent = anchor;
    core.position.y = 1.05;
    core.isPickable = false;
    core.checkCollisions = false;
    const material = new StandardMaterial(`w799b-${row.familyId}-material`, scene);
    material.alpha = 0.62;
    material.disableLighting = false;
    lower.material = material;
    upper.material = material;
    core.material = material;
    const light = new PointLight(`w799b-${row.familyId}-light`, anchor.position.clone(), scene);
    light.parent = anchor;
    light.position.set(0, 1.2, 0);
    light.range = 11;
    light.intensity = 0.18;
    lower.metadata = upper.metadata = core.metadata = freeze({
      kind: 'storm-sector-transformation-signal',
      familyId: row.familyId,
      interactive: false,
      grantsXp: false,
      automaticProgression: false,
      developmentHeroProxy: false,
      visualSignalOnly: true
    });
    states.set(row.familyId, { row, anchor, lower, upper, core, material, light });
  }

  const apply = ({ regionActive = false, missionState = null, expectedActivationId = '', expectedPackageDigest = '' } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'storm-transformation-presenter-disposed' });
    const identityOk = regionActive === true && Boolean(expectedActivationId) && String(expectedPackageDigest || '').toLowerCase() === EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST;
    if (!identityOk) {
      active = false;
      activationId = '';
      packageDigest = '';
      root.setEnabled(false);
      return freeze({ ok: true, active: false, grantsXp: false, automaticProgression: false });
    }
    active = true;
    activationId = String(expectedActivationId);
    packageDigest = String(expectedPackageDigest).toLowerCase();
    projection = deriveEonExpanseW799AStormTransformations(missionState);
    root.setEnabled(true);
    for (const row of projection.rows) {
      const state = states.get(row.familyId);
      if (!state) continue;
      state.row = row;
      const color = Color3.FromHexString(row.color);
      state.material.diffuseColor = color.scale(0.11);
      state.material.emissiveColor = color.scale(row.stage === 'restored' ? 0.9 : row.stage === 'active' ? 0.58 : 0.24);
      state.material.alpha = row.stage === 'restored' ? 0.88 : row.stage === 'active' ? 0.68 : 0.36;
      state.light.diffuse = color;
      state.light.specular = color.scale(0.45);
      state.light.intensity = row.stage === 'restored' ? 1.1 : row.stage === 'active' ? 0.62 : 0.18;
      state.light.range = row.stage === 'restored' ? 22 : row.stage === 'active' ? 15 : 9;
      state.anchor.metadata = freeze({
        kind: 'storm-sector-transformation-root',
        familyId: row.familyId,
        stage: row.stage,
        stageLabel: row.stageLabel,
        activationId,
        packageDigest,
        interactive: false,
        grantsXp: false,
        automaticProgression: false
      });
    }
    return freeze({ ok: true, active: true, restoredCount: projection.restoredCount, activeCount: projection.activeCount, damagedCount: projection.damagedCount, grantsXp: false, automaticProgression: false });
  };

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W799B_STORM_TRANSFORMATION_PRESENTER_SCHEMA,
    root,
    apply,
    update(seconds = 0) {
      if (!active) return freeze({ ok: true, active: false });
      const time = Number(seconds || 0);
      for (const state of states.values()) {
        const stage = state.row.stage;
        const speed = stage === 'restored' ? 0.8 : stage === 'active' ? 1.2 : 0.24;
        const pulse = reducedMotion ? 1 : 1 + Math.sin(time * (stage === 'active' ? 3.4 : 1.8) + state.anchor.position.x * 0.01) * (stage === 'restored' ? 0.09 : stage === 'active' ? 0.14 : 0.03);
        state.anchor.scaling.setAll(pulse);
        state.lower.rotation.z = reducedMotion ? 0 : time * speed;
        state.upper.rotation.z = reducedMotion ? 0 : -time * speed * 1.3;
        state.core.position.y = 1.05 + (reducedMotion ? 0 : Math.sin(time * 2.1) * 0.12);
      }
      return freeze({ ok: true, active: true });
    },
    getSummary() {
      return freeze({
        schema: EON_EXPANSE_W799B_STORM_TRANSFORMATION_PRESENTER_SCHEMA,
        active,
        activationId,
        packageDigest,
        damagedCount: projection.damagedCount,
        activeCount: projection.activeCount,
        restoredCount: projection.restoredCount,
        totalCount: projection.totalCount,
        regionRestored: projection.regionRestored,
        interactiveSignalCount: 0,
        developmentHeroProxyCount: 0,
        grantsXp: false,
        automaticProgression: false,
        ownsEngine: false,
        ownsScene: false,
        ownsRenderLoop: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      active = false;
      for (const state of states.values()) {
        try { state.light.dispose?.(); } catch {}
        try { state.material.dispose?.(); } catch {}
      }
      states.clear();
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W799B_STORM_TRANSFORMATION_PRESENTER_SCHEMA, mountEonExpanseW799BStormTransformationPresenter });
