/** W794B — authored Storm Sector gateway inside the canonical Signal Frontier scene. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { evaluateEonExpanseW767AAssetPresentation } from '../w766/eon-expanse-w767a-asset-truth.js';
import { sanitizeEonExpanseW793AActivation } from '../w793/eon-expanse-w793a-future-region-activation.js';
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W794B_STORM_GATEWAY_SCHEMA = 'eon.expanse.storm-sector-gateway-presenter.w794b.v1';
export const EON_EXPANSE_W794B_SIGNAL_FRONTIER_GATEWAY_POSE = freeze({ x: 43, y: 0, z: -150, heading: Math.PI });

function splitAssetPath(assetPath = '') {
  const value = String(assetPath || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
}

function bounds(meshes = []) {
  let minX = Infinity; let minY = Infinity; let minZ = Infinity;
  let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo?.().boundingBox;
      if (!box) continue;
      minX = Math.min(minX, box.minimumWorld.x); minY = Math.min(minY, box.minimumWorld.y); minZ = Math.min(minZ, box.minimumWorld.z);
      maxX = Math.max(maxX, box.maximumWorld.x); maxY = Math.max(maxY, box.maximumWorld.y); maxZ = Math.max(maxZ, box.maximumWorld.z);
    } catch {}
  }
  if (![minX, minY, minZ, maxX, maxY, maxZ].every(Number.isFinite)) return null;
  return freeze({ minX, minY, minZ, maxX, maxY, maxZ, width: maxX - minX, height: maxY - minY, depth: maxZ - minZ });
}

function disposeLoaded(entry = {}) {
  try { entry.container?.dispose?.(); } catch {}
  try { entry.wrapper?.dispose?.(false, true); } catch {}
}

export function mountEonExpanseW794BStormSectorGatewayPresenter({ scene, parent = null, reducedMotion = false } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w794b-storm-sector-gateway-root', scene);
  if (parent) root.parent = parent;
  root.position.set(EON_EXPANSE_W794B_SIGNAL_FRONTIER_GATEWAY_POSE.x, EON_EXPANSE_W794B_SIGNAL_FRONTIER_GATEWAY_POSE.y, EON_EXPANSE_W794B_SIGNAL_FRONTIER_GATEWAY_POSE.z);
  root.rotation.y = EON_EXPANSE_W794B_SIGNAL_FRONTIER_GATEWAY_POSE.heading;
  root.setEnabled?.(false);
  root.metadata = freeze({ kind: 'future-region-gateway-root', regionId: 'storm-sector', canonicalScene: true });

  const padMaterial = new StandardMaterial('w794b-storm-gateway-pad-material', scene);
  padMaterial.diffuseColor = Color3.FromHexString('#101a29').scale(0.42);
  padMaterial.emissiveColor = Color3.FromHexString('#2cbcff').scale(0.18);
  padMaterial.specularColor = Color3.Black();
  const ringMaterial = new StandardMaterial('w794b-storm-gateway-ring-material', scene);
  ringMaterial.diffuseColor = Color3.FromHexString('#261d44').scale(0.36);
  ringMaterial.emissiveColor = Color3.FromHexString('#8d7dff').scale(0.7);
  ringMaterial.specularColor = Color3.Black();
  const pad = MeshBuilder.CreateCylinder('w794b-storm-gateway-pad', { diameter: 15, height: 0.45, tessellation: 48 }, scene);
  pad.parent = root; pad.position.y = 0.1; pad.material = padMaterial; pad.checkCollisions = true; pad.isPickable = false;
  pad.metadata = freeze({ kind: 'future-region-gateway-connector', regionId: 'storm-sector', developmentProxy: false, finishedHero: false });
  const ring = MeshBuilder.CreateTorus('w794b-storm-gateway-signal-ring', { diameter: 10.8, thickness: 0.14, tessellation: 64 }, scene);
  ring.parent = root; ring.position.y = 0.42; ring.rotation.x = Math.PI / 2; ring.material = ringMaterial; ring.checkCollisions = false; ring.isPickable = false;
  ring.metadata = freeze({ kind: 'future-region-gateway-signal', regionId: 'storm-sector', developmentProxy: false, finishedHero: false });

  const asset = EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.heroAssets.find((entry) => entry.id === 'charged-transit-gate')?.lods?.find((entry) => entry.level === 2) || null;
  let activation = null;
  let presentation = null;
  let pending = null;
  let revision = 0;
  let disposed = false;

  const clearPresentation = () => {
    revision += 1;
    if (presentation) disposeLoaded(presentation);
    presentation = null;
    pending = null;
    root.setEnabled?.(false);
  };

  const load = async (expectedRevision) => {
    let container = null;
    let wrapper = null;
    try {
      const { rootUrl, fileName } = splitAssetPath(asset?.url || '');
      container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
      if (disposed || revision !== expectedRevision || !activation) {
        try { container.dispose?.(); } catch {}
        return freeze({ ok: false, reason: 'stale-gateway-load' });
      }
      container.addAllToScene?.();
      wrapper = new TransformNode('w794b-storm-gateway-authored-wrapper', scene);
      wrapper.parent = root;
      for (const node of container.rootNodes || []) node.parent = wrapper;
      for (const mesh of container.meshes || []) {
        mesh.isPickable = false;
        mesh.checkCollisions = true;
        mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'future-region-authored-gateway', regionId: 'storm-sector', developmentProxy: false, finishedHeroPrimitive: false });
      }
      const meshes = container.meshes || [];
      const sourceBounds = bounds(meshes);
      let appliedScale = 1;
      if (sourceBounds?.height > 0.001) {
        appliedScale = 13 / sourceBounds.height;
        wrapper.scaling.setAll(appliedScale);
        wrapper.computeWorldMatrix?.(true);
      }
      const scaledBounds = bounds(meshes);
      let groundOffset = 0;
      if (scaledBounds) {
        groundOffset = 0.35 - scaledBounds.minY;
        wrapper.position.y += groundOffset;
        wrapper.computeWorldMatrix?.(true);
      }
      const finalBounds = bounds(meshes);
      const renderable = meshes.filter((mesh) => Number(mesh.getTotalVertices?.() || 0) > 0 || mesh.geometry);
      const visible = renderable.filter((mesh) => mesh.isEnabled?.() !== false && mesh.isVisible !== false && Number(mesh.visibility ?? 1) > 0.01);
      const materialCount = new Set([...(container.materials || []), ...renderable.map((mesh) => mesh.material).filter(Boolean)]).size;
      const truth = evaluateEonExpanseW767AAssetPresentation({
        placement: { id: 'storm-sector-gateway', zoneId: 'horizon-vault', assetId: 'charged-transit-gate', position: EON_EXPANSE_W794B_SIGNAL_FRONTIER_GATEWAY_POSE, targetHeight: 13 },
        assetId: 'charged-transit-gate',
        requestedPath: asset.url,
        variant: 'lod2',
        loadStatus: 'loaded',
        meshCount: meshes.length,
        renderableMeshCount: renderable.length,
        visibleMeshCount: visible.length,
        materialCount,
        animationGroupCount: container.animationGroups?.length || 0,
        sourceBounds,
        worldBounds: finalBounds,
        appliedScale,
        finalPosition: wrapper.getAbsolutePosition?.() || wrapper.position,
        groundOffset,
        lodState: 'lod2',
        drawCallContribution: visible.length
      });
      if (!truth.ok) {
        disposeLoaded({ container, wrapper });
        presentation = freeze({ ok: false, status: 'rejected-authored-gateway', reason: truth.failureReason || 'visible-validation-failed', truth });
        return presentation;
      }
      for (const mesh of meshes) {
        mesh.isPickable = true;
        mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'future-region-authored-gateway', action: 'enter-storm-sector', label: 'Enter Storm Sector', regionId: 'storm-sector', gatewayId: activation.gatewayId, activationId: activation.activationId, packageDigest: activation.packageDigest, interactive: true, developmentProxy: false });
      }
      presentation = freeze({ ok: true, status: 'presented-authored-gateway', container, wrapper, truth });
      root.setEnabled?.(true);
      return presentation;
    } catch (error) {
      disposeLoaded({ container, wrapper });
      presentation = freeze({ ok: false, status: 'rejected-authored-gateway', reason: String(error?.message || error || 'gateway-load-failed').slice(0, 160), truth: null });
      return presentation;
    }
  };

  const applyActivation = (candidate = null) => {
    if (disposed) return freeze({ ok: false, reason: 'gateway-presenter-disposed' });
    const next = sanitizeEonExpanseW793AActivation(candidate);
    if (!next || next.regionId !== 'storm-sector' || next.gatewayActivated !== true) {
      activation = null;
      clearPresentation();
      return freeze({ ok: true, visible: false, reason: 'exact-storm-sector-activation-required' });
    }
    if (activation?.activationId === next.activationId && presentation?.status === 'presented-authored-gateway') return freeze({ ok: true, visible: true, status: presentation.status });
    activation = next;
    clearPresentation();
    activation = next;
    root.setEnabled?.(true);
    const expectedRevision = ++revision;
    pending = load(expectedRevision).finally(() => { pending = null; });
    return freeze({ ok: true, visible: true, status: 'loading-authored-gateway', automaticActivation: false });
  };

  const getSummary = () => freeze({
    schema: EON_EXPANSE_W794B_STORM_GATEWAY_SCHEMA,
    visible: root.isEnabled?.() === true,
    regionId: 'storm-sector',
    activationId: activation?.activationId || '',
    packageDigest: activation?.packageDigest || '',
    status: presentation?.status || (pending ? 'loading-authored-gateway' : 'gateway-locked'),
    interactive: presentation?.status === 'presented-authored-gateway',
    truth: presentation?.truth || null,
    rejectedReason: presentation?.reason || '',
    reducedMotion: Boolean(reducedMotion),
    authoredHeroRequired: true,
    proceduralGatewayFallbackShown: false,
    automaticActivation: false,
    oneCanonicalScene: true,
    secondEngineCreated: false,
    secondSceneCreated: false,
    secondRenderLoopCreated: false,
    privateContentStored: false
  });

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W794B_STORM_GATEWAY_SCHEMA,
    root,
    applyActivation,
    ready() { return pending || Promise.resolve(presentation); },
    getSummary,
    update(seconds = 0) {
      if (root.isEnabled?.() && !reducedMotion) ring.rotation.z = Number(seconds || 0) * 0.18;
      return getSummary();
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      clearPresentation();
      try { pad.dispose?.(); ring.dispose?.(); } catch {}
      try { padMaterial.dispose?.(); ringMaterial.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W794B_STORM_GATEWAY_SCHEMA, EON_EXPANSE_W794B_SIGNAL_FRONTIER_GATEWAY_POSE, mountEonExpanseW794BStormSectorGatewayPresenter });
