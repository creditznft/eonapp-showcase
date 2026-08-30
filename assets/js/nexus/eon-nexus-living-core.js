/**
 * W661C — Living Core renderer for productive EON NEXUS routes.
 *
 * The module is lazy imported only after an explicit Pulse action. It projects
 * the existing adapter snapshot into a bounded Babylon scene. It owns no AI,
 * project, task, approval or result state and is never installed in EONCITY.
 */
import { Ray } from '@babylonjs/core/Culling/ray.js';
import { Engine } from '@babylonjs/core/Engines/engine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer.js';
import { getEonNexusMorphicContract } from './eon-nexus-morphic-contract.js';
import { projectEonNexusW668FlagshipState } from './w668/eon-nexus-w668-flagship-state.js';
import { projectEonNexusW683MorphicRenderer } from './w683/eon-nexus-w683-morphic-field-renderer.js';
import { buildEonNexusW706SpatialScenePlan } from './w706/eon-nexus-w706-spatial-scene-plan.js';
import { beginEonNexusW707SpatialDrag, projectEonNexusW707SpatialDrag } from './w707/eon-nexus-w707-spatial-manipulation.js';
import { getEonNexusW719SpatialSurface } from './w719/eon-nexus-w719-spatial-surface.js';

export const EON_NEXUS_LIVING_CORE_SCHEMA = 'eon.nexus.living-core.w661c.v1';
export const EON_NEXUS_LIVING_CORE_MAX_NODES = 5;
export const EON_NEXUS_LIVING_CORE_MAX_WORK_OBJECTS = 10;
const freeze = Object.freeze;

const STATE_COLORS = freeze({
  ready: '#22d3ee', listening: '#67e8f9', processing: '#a78bfa', speaking: '#38bdf8',
  'waiting-approval': '#fb923c', complete: '#f8c761', error: '#fb7185', offline: '#94a3b8'
});

function cleanNode(node = {}, index = 0) {
  return freeze({
    id: String(node.id || `node-${index}`).slice(0, 80),
    label: String(node.label || node.kind || 'Available').replace(/\s+/g, ' ').trim().slice(0, 70),
    status: String(node.status || 'available').slice(0, 32),
    count: Math.max(0, Math.min(99, Number(node.count) || 0))
  });
}

export function getEonNexusLivingCorePlan(snapshot = {}, options = {}) {
  const contract = options.contract || getEonNexusMorphicContract({
    page: options.page,
    context: options.context,
    snapshot,
    environment: options.environment
  });
  const flagship = projectEonNexusW668FlagshipState(snapshot, { surface: 'spatial' });
  const nodes = flagship.nodes
    .map((node, index) => freeze({ ...cleanNode(node, index), ...node }))
    .slice(0, EON_NEXUS_LIVING_CORE_MAX_NODES);
  const state = flagship.state;
  const commandField = projectEonNexusW683MorphicRenderer(snapshot, {
    selectedObjectId: options.selectedObjectId,
    stableObjectOrder: options.stableObjectOrder,
    interactionState: options.interactionState
  });
  const spatialScene = buildEonNexusW706SpatialScenePlan(snapshot, {
    layoutMode: options.layoutMode || 'split',
    selectedObjectId: options.selectedObjectId,
    stableObjectOrder: options.stableObjectOrder,
    interactionState: options.interactionState
  });
  const workObjects = commandField.visibleObjects.slice(0, EON_NEXUS_LIVING_CORE_MAX_WORK_OBJECTS);
  return freeze({
    schema: EON_NEXUS_LIVING_CORE_SCHEMA,
    state,
    accent: flagship.accent || STATE_COLORS[state],
    secondaryAccent: flagship.secondaryAccent,
    shape: flagship.shape,
    topology: flagship.topology,
    energy: flagship.energy,
    pulseMs: flagship.pulseMs,
    orbitSpeed: flagship.orbitSpeed,
    halo: flagship.halo,
    continuityId: flagship.continuityId,
    morphSignature: flagship.morphSignature,
    nodes: freeze(nodes),
    nodeCount: nodes.length,
    maximumNodes: EON_NEXUS_LIVING_CORE_MAX_NODES,
    workObjects: freeze(workObjects),
    workObjectCount: workObjects.length,
    maximumWorkObjects: EON_NEXUS_LIVING_CORE_MAX_WORK_OBJECTS,
    connections: commandField.connections,
    commandField,
    spatialScene,
    primaryRenderer: spatialScene.primaryRenderer,
    maximumPrimaryControls: 3,
    renderer: contract.renderer,
    motionEnabled: contract.motionActive,
    paused: contract.rendererPaused,
    staticFallback: contract.staticFallback,
    productive: contract.productive,
    page: contract.page,
    privateRoute: snapshot?.route?.privateOnDevice === true,
    approvalPending: snapshot?.approval?.pending === true,
    startsAiWork: false,
    autoNavigation: false,
    autoApproval: false,
    flagship
  });
}

export const getEonNexusLivingCoreSpatialSurface = getEonNexusW719SpatialSurface;

function cleanSpatialLabel(value = '', fallback = 'Work object') {
  const label = String(value || fallback).replace(/\s+/g, ' ').trim();
  return (label || fallback).slice(0, 54);
}

function hex(value) {
  try { return Color3.FromHexString(value); } catch { return Color3.FromHexString('#22d3ee'); }
}

function ensureStyles(documentRef) {
  if (documentRef.querySelector?.('link[data-eon-nexus-living-core-style]')) return;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/eon-nexus-living-core.css';
  link.dataset.eonNexusLivingCoreStyle = '1';
  documentRef.head?.appendChild?.(link);
}

export function mountEonNexusLivingCore({
  adapter,
  liveNexus,
  page = '',
  context = {},
  environment = globalThis,
  document: documentRef = environment?.document || globalThis.document
} = {}) {
  if (typeof Ray !== 'function') throw new Error('eon-nexus-babylon-ray-side-effect-unavailable');
  const liveRoot = liveNexus?.element;
  const visual = liveRoot?.querySelector?.('.eon-nexus-live__visual');
  if (!adapter?.getSnapshot || !adapter?.subscribe || !visual || !documentRef?.createElement) {
    return freeze({ ok: false, reason: 'living-core-environment-unavailable', dispose() {} });
  }
  if (documentRef.querySelector?.('[data-eon-nexus-living-core]')) {
    return freeze({ ok: false, reason: 'living-core-already-mounted', dispose() {} });
  }

  const initial = adapter.getSnapshot();
  let contract = getEonNexusMorphicContract({ page, context, snapshot: initial, environment });
  if (!contract.productive || page === 'eoncity') {
    return freeze({ ok: false, reason: 'living-core-not-allowed-for-route', contract, dispose() {} });
  }

  ensureStyles(documentRef);
  const shell = documentRef.createElement('div');
  shell.className = 'eon-nexus-living-core';
  shell.dataset.eonNexusLivingCore = '1';
  shell.dataset.renderer = contract.renderer;
  shell.setAttribute('aria-hidden', 'true');
  const canvas = documentRef.createElement('canvas');
  canvas.className = 'eon-nexus-living-core__canvas';
  canvas.dataset.eonNexusLivingCoreCanvas = '1';
  shell.appendChild(canvas);
  visual.prepend(shell);
  liveRoot.dataset.livingCore = 'true';

  let engine = null;
  let scene = null;
  let camera = null;
  let root = null;
  let core = null;
  let ringA = null;
  let ringB = null;
  let ringC = null;
  let glow = null;
  let platform = null;
  let horizonRing = null;
  let keyLight = null;
  let rimLight = null;
  let satellites = [];
  let connectionMeshes = [];
  let labelMeshes = [];
  let unsubscribeInteraction = null;
  let unsubscribeSpatialSurface = null;
  let unsubscribeAtlasSpatial = null;
  let disposed = false;
  let lastCameraAuthorityKey = '';
  let activeSpatialDrag = null;
  let plan = getEonNexusLivingCorePlan(initial, { page, context, environment, contract, layoutMode: liveNexus?.getMode?.() || 'split' });
  let surface = getEonNexusLivingCoreSpatialSurface(plan, {
    activeTab: liveNexus?.getActiveTab?.() || 'conversation',
    atlasSpatialModel: liveNexus?.projectAtlas?.getSpatialModel?.() || null
  });

  const createScene = () => {
    if (contract.renderer !== 'babylon-living-core' || typeof canvas.getContext !== 'function') return false;
    try {
      engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, alpha: true, antialias: true }, true);
      scene = new Scene(engine);
      scene.clearColor = new Color4(0, 0, 0, 0);
      const sceneCamera = surface.camera;
      camera = new ArcRotateCamera('eon-nexus-living-core-camera', sceneCamera.alpha, sceneCamera.beta, sceneCamera.radius, new Vector3(sceneCamera.target.x, sceneCamera.target.y, sceneCamera.target.z), scene);
      camera.lowerRadiusLimit = sceneCamera.minRadius;
      camera.upperRadiusLimit = sceneCamera.maxRadius;
      camera.lowerBetaLimit = sceneCamera.lowerBetaLimit;
      camera.upperBetaLimit = sceneCamera.upperBetaLimit;
      camera.wheelPrecision = 45;
      camera.pinchPrecision = 80;
      camera.attachControl(canvas, true);
      const light = new HemisphericLight('eon-nexus-living-core-light', new Vector3(0.2, 1, -0.3), scene);
      light.intensity = 0.64;
      glow = new GlowLayer('eon-nexus-living-core-glow', scene, { blurKernelSize: 32 });
      glow.intensity = 0.82;
      keyLight = new PointLight('eon-nexus-living-core-key-light', new Vector3(4.5, 5.8, -4.2), scene);
      keyLight.intensity = 0.72;
      keyLight.diffuse = hex(plan.accent);
      rimLight = new PointLight('eon-nexus-living-core-rim-light', new Vector3(-4.8, 1.6, 4.6), scene);
      rimLight.intensity = 0.55;
      rimLight.diffuse = hex(plan.secondaryAccent || plan.accent);
      root = new TransformNode('eon-nexus-living-core-root', scene);
      root.metadata = { schema: plan.spatialScene.schema, primaryRenderer: true, automaticOrbit: false };
      core = MeshBuilder.CreateSphere('eon-nexus-living-core-orb', { diameter: 2.05, segments: 40 }, scene);
      core.parent = root;
      const coreMat = new StandardMaterial('eon-nexus-living-core-orb-material', scene);
      coreMat.diffuseColor = hex(plan.accent).scale(0.22);
      coreMat.emissiveColor = hex(plan.accent);
      coreMat.specularColor = Color3.White();
      coreMat.specularPower = 96;
      core.material = coreMat;
      ringA = MeshBuilder.CreateTorus('eon-nexus-living-core-ring-a', { diameter: 3.45, thickness: 0.045, tessellation: 96 }, scene);
      ringA.parent = root;
      ringA.rotation.x = Math.PI / 2.7;
      ringB = MeshBuilder.CreateTorus('eon-nexus-living-core-ring-b', { diameter: 4.25, thickness: 0.035, tessellation: 96 }, scene);
      ringB.parent = root;
      ringB.rotation.z = Math.PI / 2.4;
      ringC = MeshBuilder.CreateTorus('eon-nexus-living-core-ring-c', { diameter: 5.25, thickness: 0.022, tessellation: 112 }, scene);
      ringC.parent = root;
      ringC.rotation.x = Math.PI / 2;
      ringC.rotation.z = Math.PI / 5;
      for (const [mesh, alpha] of [[ringA, 0.86], [ringB, 0.6], [ringC, 0.38]]) {
        const mat = new StandardMaterial(`${mesh.name}-material`, scene);
        mat.diffuseColor = Color3.Black();
        mat.emissiveColor = hex(mesh === ringB ? surface.secondaryAccent : surface.accent).scale(alpha);
        mat.alpha = alpha;
        mesh.material = mat;
      }
      platform = MeshBuilder.CreateCylinder('eon-nexus-living-core-platform', { diameter: 12.4, height: 0.08, tessellation: 96 }, scene);
      platform.parent = root;
      platform.position.y = -2.32;
      const platformMaterial = new StandardMaterial('eon-nexus-living-core-platform-material', scene);
      platformMaterial.diffuseColor = Color3.Black();
      platformMaterial.emissiveColor = hex(plan.secondaryAccent || plan.accent).scale(0.14);
      platformMaterial.alpha = 0.42;
      platform.material = platformMaterial;
      platform.isPickable = false;
      horizonRing = MeshBuilder.CreateTorus('eon-nexus-living-core-horizon-ring', { diameter: 10.6, thickness: 0.025, tessellation: 128 }, scene);
      horizonRing.parent = root;
      horizonRing.position.y = -2.24;
      const horizonMaterial = new StandardMaterial('eon-nexus-living-core-horizon-material', scene);
      horizonMaterial.diffuseColor = Color3.Black();
      horizonMaterial.emissiveColor = hex(plan.accent).scale(0.72);
      horizonMaterial.alpha = 0.78;
      horizonRing.material = horizonMaterial;
      horizonRing.isPickable = false;
      const viewport = () => {
        const rect = canvas.getBoundingClientRect?.() || {};
        return { width: Math.max(1, Number(rect.width) || canvas.clientWidth || 1), height: Math.max(1, Number(rect.height) || canvas.clientHeight || 1) };
      };
      const finishSpatialDrag = (event = null) => {
        if (!activeSpatialDrag) return;
        const pointerId = activeSpatialDrag.pointerId;
        try { liveNexus?.interactionController?.endMove?.(); } catch {}
        try { if (pointerId !== null) canvas.releasePointerCapture?.(pointerId); } catch {}
        activeSpatialDrag = null;
        try { camera?.attachControl?.(canvas, true); } catch {}
        event?.preventDefault?.();
      };
      scene.onPointerObservable.add((pointerInfo) => {
        const event = pointerInfo?.event || {};
        if (pointerInfo?.type === PointerEventTypes.POINTERDOWN) {
          const pickedMetadata = pointerInfo?.pickInfo?.pickedMesh?.metadata || {};
          const atlasId = pickedMetadata.eonAtlasNodeId;
          if (atlasId) {
            liveNexus?.projectAtlas?.selectSpatialNode?.(atlasId);
            event.preventDefault?.();
            return;
          }
          const id = pickedMetadata.eonWorkObjectId;
          if (!id) return;
          liveNexus?.selectWorkObject?.(id);
          const object = surface.objects.find((entry) => entry.id === id);
          if (!object?.draggable) {
            event.preventDefault?.();
            return;
          }
          const controller = liveNexus?.interactionController;
          const started = controller?.beginMove?.(id);
          const drag = beginEonNexusW707SpatialDrag({ object, pointer: event, viewport: viewport(), layoutMode: plan.spatialScene.mode });
          if (!drag.ok || started?.ok === false) return;
          const mesh = satellites.find((entry) => entry.metadata?.eonWorkObjectId === id) || pointerInfo?.pickInfo?.pickedMesh || null;
          activeSpatialDrag = { ...drag, mesh, pointerId: Number.isFinite(Number(event.pointerId)) ? Number(event.pointerId) : null };
          try { if (activeSpatialDrag.pointerId !== null) canvas.setPointerCapture?.(activeSpatialDrag.pointerId); } catch {}
          try { camera?.detachControl?.(canvas); } catch {}
          event.preventDefault?.();
          return;
        }
        if (pointerInfo?.type === PointerEventTypes.POINTERMOVE && activeSpatialDrag) {
          if (activeSpatialDrag.pointerId !== null && Number.isFinite(Number(event.pointerId)) && Number(event.pointerId) !== activeSpatialDrag.pointerId) return;
          const projected = projectEonNexusW707SpatialDrag(activeSpatialDrag, event, { depthMode: event.altKey === true || event.shiftKey === true });
          if (!projected.ok) return;
          liveNexus?.interactionController?.moveTo?.(
            projected.objectId,
            projected.fieldPosition.x,
            projected.fieldPosition.y,
            projected.fieldPosition.z,
            { commit: false }
          );
          activeSpatialDrag.mesh?.position?.copyFromFloats?.(projected.worldPosition.x, projected.worldPosition.y, projected.worldPosition.z);
          event.preventDefault?.();
          return;
        }
        if (pointerInfo?.type === PointerEventTypes.POINTERUP && activeSpatialDrag) finishSpatialDrag(event);
      });
      canvas.addEventListener?.('pointercancel', finishSpatialDrag);
      return true;
    } catch {
      try { scene?.dispose(); } catch {}
      try { engine?.dispose(); } catch {}
      engine = scene = null;
      shell.dataset.renderer = 'dom-static';
      return false;
    }
  };

  const syncSatellites = () => {
    if (!scene || !root) return;
    for (const mesh of [...satellites, ...connectionMeshes, ...labelMeshes]) mesh.dispose(false, true);
    satellites = [];
    connectionMeshes = [];
    labelMeshes = [];
    const positions = new Map([[surface.centre.id, new Vector3(0, 0, 0)]]);
    const createLabel = ({ id, label, meta = '', position, accent = surface.accent, centre = false }) => {
      const width = centre ? 3.4 : 2.7;
      const height = centre ? 0.86 : 0.66;
      const texture = new DynamicTexture(`eon-nexus-label-texture-${id}`, { width: 768, height: 192 }, scene, false);
      texture.hasAlpha = true;
      const context2d = texture.getContext();
      context2d.clearRect(0, 0, 768, 192);
      context2d.fillStyle = 'rgba(2, 8, 23, .86)';
      context2d.fillRect(8, 8, 752, 176);
      context2d.strokeStyle = accent;
      context2d.lineWidth = centre ? 5 : 3;
      context2d.strokeRect(10, 10, 748, 172);
      context2d.fillStyle = '#f8fafc';
      context2d.font = `${centre ? '700 46px' : '700 39px'} system-ui, sans-serif`;
      context2d.textAlign = 'center';
      context2d.textBaseline = 'middle';
      context2d.fillText(cleanSpatialLabel(label).slice(0, centre ? 28 : 24), 384, centre ? 78 : 72, 700);
      if (meta) {
        context2d.fillStyle = '#a9c8db';
        context2d.font = `${centre ? '500 25px' : '500 23px'} system-ui, sans-serif`;
        context2d.fillText(cleanSpatialLabel(meta).slice(0, 34), 384, centre ? 130 : 124, 700);
      }
      texture.update(false);
      const plane = MeshBuilder.CreatePlane(`eon-nexus-label-${id}`, { width, height }, scene);
      plane.parent = root;
      plane.position.copyFrom(position);
      plane.position.y += centre ? 1.62 : 0.64;
      plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
      plane.isPickable = false;
      const material = new StandardMaterial(`${plane.name}-material`, scene);
      material.diffuseTexture = texture;
      material.emissiveTexture = texture;
      material.opacityTexture = texture;
      material.disableLighting = true;
      material.backFaceCulling = false;
      plane.material = material;
      labelMeshes.push(plane);
    };
    const makeObjectMesh = (object, index) => {
      const size = 0.38 * Number(object.scale || 1);
      if (object.kind === 'project') return MeshBuilder.CreateSphere(`eon-nexus-work-${index}`, { diameter: size * 1.65, segments: 20 }, scene);
      if (object.kind === 'approval') return MeshBuilder.CreateBox(`eon-nexus-work-${index}`, { width: size * 1.55, height: size * 1.55, depth: size * 0.5 }, scene);
      if (object.kind === 'result') return MeshBuilder.CreateCylinder(`eon-nexus-work-${index}`, { height: size * 1.45, diameterTop: size * 0.75, diameterBottom: size * 1.28, tessellation: 6 }, scene);
      if (object.kind === 'conversation') return MeshBuilder.CreateTorus(`eon-nexus-work-${index}`, { diameter: size * 1.34, thickness: size * 0.22, tessellation: 28 }, scene);
      if (object.kind === 'route') return MeshBuilder.CreateCylinder(`eon-nexus-work-${index}`, { height: size * 1.55, diameter: size * 0.65, tessellation: 3 }, scene);
      return MeshBuilder.CreateBox(`eon-nexus-work-${index}`, { width: size * 1.6, height: size, depth: size * 0.48 }, scene);
    };
    createLabel({ id: surface.centre.id, label: surface.centre.label, meta: surface.centre.meta, position: new Vector3(0, 0, 0), accent: surface.accent, centre: true });
    surface.objects.forEach((object, index) => {
      const mesh = makeObjectMesh(object, index);
      mesh.parent = root;
      const position = new Vector3(object.position.x, object.position.y, object.position.z);
      mesh.position.copyFrom(position);
      mesh.rotation.set(object.rotation.x, object.rotation.y, object.rotation.z);
      const mat = new StandardMaterial(`${mesh.name}-material`, scene);
      const nodeColor = object.sourceObject?.accent || (object.urgent ? '#fb923c' : object.status === 'failed' ? '#fb7185' : object.status === 'complete' ? '#f8c761' : surface.accent);
      mat.diffuseColor = hex(nodeColor).scale(object.selected ? 0.34 : 0.16);
      mat.emissiveColor = hex(nodeColor).scale(object.selected ? 1 : object.compared ? 0.78 : 0.56);
      mat.alpha = 0.96;
      mesh.material = mat;
      mesh.isPickable = true;
      mesh.metadata = object.atlasNode
        ? { eonAtlasNodeId: object.id, kind: object.kind, status: object.status }
        : { eonWorkObjectId: object.id, kind: object.kind, status: object.status };
      positions.set(object.id, position.clone());
      satellites.push(mesh);
      createLabel({ id: object.id, label: object.label, meta: object.meta || object.status, position, accent: nodeColor });
    });
    for (const [index, relation] of surface.relations.entries()) {
      const from = positions.get(relation.fromId);
      const to = positions.get(relation.toId);
      if (!from || !to) continue;
      const line = MeshBuilder.CreateLines(`eon-nexus-relation-${index}`, { points: [from, to] }, scene);
      line.parent = root;
      line.color = relation.attention ? hex('#fb923c') : hex(surface.secondaryAccent || surface.accent).scale(Math.max(0.28, Number(relation.strength || 0.5)));
      line.alpha = Math.min(0.9, 0.22 + Number(relation.strength || 0.5) * 0.62);
      line.isPickable = false;
      connectionMeshes.push(line);
    }
  };

  const renderSnapshot = (snapshot) => {
    contract = getEonNexusMorphicContract({ page, context, snapshot, environment });
    plan = getEonNexusLivingCorePlan(snapshot, {
      page, context, environment, contract,
      selectedObjectId: liveNexus?.getSelectedWorkObject?.()?.id,
      interactionState: liveNexus?.getInteractionState?.(),
      layoutMode: liveNexus?.getMode?.() || 'split'
    });
    surface = getEonNexusLivingCoreSpatialSurface(plan, {
      activeTab: liveNexus?.getActiveTab?.() || 'conversation',
      atlasSpatialModel: liveNexus?.projectAtlas?.getSpatialModel?.() || null
    });
    shell.dataset.state = plan.state;
    shell.dataset.layout = plan.spatialScene.mode;
    shell.dataset.surface = surface.surface;
    shell.dataset.primaryRenderer = String(plan.primaryRenderer === 'babylon-spatial-command-field');
    liveRoot.dataset.spatialPrimary = String(rendererReady === true);
    liveRoot.dataset.spatialRenderer = rendererReady === true ? 'ready' : 'fallback';
    liveRoot.dataset.spatialSurface = surface.surface;
    if (camera && surface.camera.authorityKey !== lastCameraAuthorityKey) {
      const authority = surface.camera;
      camera.alpha = authority.alpha;
      camera.beta = authority.beta;
      camera.radius = authority.radius;
      camera.lowerRadiusLimit = authority.minRadius;
      camera.upperRadiusLimit = authority.maxRadius;
      camera.lowerBetaLimit = authority.lowerBetaLimit;
      camera.upperBetaLimit = authority.upperBetaLimit;
      camera.target.copyFromFloats(authority.target.x, authority.target.y, authority.target.z);
      lastCameraAuthorityKey = authority.authorityKey;
    }
    shell.dataset.motion = plan.motionEnabled ? 'active' : 'static';
    shell.dataset.paused = String(plan.paused);
    shell.dataset.shape = plan.shape;
    shell.dataset.topology = plan.topology;
    shell.dataset.continuity = plan.continuityId;
    shell.style?.setProperty?.('--eon-nexus-accent', surface.accent);
    shell.style?.setProperty?.('--eon-nexus-secondary', surface.secondaryAccent);
    shell.style?.setProperty?.('--eon-nexus-energy', String(plan.energy));
    if (core?.material) {
      core.material.emissiveColor = hex(surface.accent);
      core.material.diffuseColor = hex(surface.accent).scale(0.22);
    }
    if (ringA?.material) ringA.material.emissiveColor = hex(surface.accent).scale(0.86);
    if (ringB?.material) ringB.material.emissiveColor = hex(surface.secondaryAccent).scale(0.6);
    if (ringC?.material) ringC.material.emissiveColor = hex(surface.accent).scale(0.38);
    if (platform?.material) platform.material.emissiveColor = hex(surface.secondaryAccent || surface.accent).scale(0.14);
    if (horizonRing?.material) horizonRing.material.emissiveColor = hex(surface.accent).scale(0.72);
    if (keyLight) keyLight.diffuse = hex(surface.accent);
    if (rimLight) rimLight.diffuse = hex(surface.secondaryAccent || surface.accent);
    syncSatellites();
    if (!plan.motionEnabled && scene) scene.render();
  };

  const resize = () => engine?.resize?.();
  const visibility = () => {
    const paused = documentRef.hidden === true || liveRoot.hidden === true;
    shell.dataset.paused = String(paused);
    if (paused || !plan.motionEnabled) {
      engine?.stopRenderLoop?.();
    } else if (engine && scene) {
      engine.runRenderLoop(() => {
      if (disposed || documentRef.hidden || liveRoot.hidden) { return; }
      const t = performance.now() * 0.00035 * Math.max(0.15, Number(plan.orbitSpeed || 0.2) * 2.4);
      if (root) root.rotation.y = 0;
      if (core) {
        const pulse = 1 + Math.sin(performance.now() / Math.max(420, Number(plan.pulseMs || 2200))) * 0.045 * Number(plan.energy || 0.4);
        core.scaling.setAll(pulse);
      }
      if (ringA) ringA.rotation.y = t * 0.72;
      if (ringB) ringB.rotation.x = t * 0.48;
      if (ringC) ringC.rotation.z = -t * 0.34;
      if (horizonRing) horizonRing.rotation.y = -t * 0.22;
      scene.render();
      });
    }
  };

  const rendererReady = createScene();
  renderSnapshot(initial);
  const unsubscribe = adapter.subscribe(renderSnapshot);
  unsubscribeInteraction = liveNexus?.interactionController?.subscribe?.(() => renderSnapshot(adapter.getSnapshot())) || null;
  unsubscribeSpatialSurface = liveNexus?.subscribeSpatialSurface?.(() => renderSnapshot(adapter.getSnapshot())) || null;
  unsubscribeAtlasSpatial = liveNexus?.projectAtlas?.subscribeSpatialModel?.(() => renderSnapshot(adapter.getSnapshot())) || null;
  environment.addEventListener?.('resize', resize, { passive: true });
  documentRef.addEventListener?.('visibilitychange', visibility);
  const observer = typeof environment.MutationObserver === 'function'
    ? new environment.MutationObserver(visibility)
    : null;
  observer?.observe?.(liveRoot, { attributes: true, attributeFilter: ['hidden'] });
  visibility();

  return freeze({
    ok: true,
    reason: rendererReady ? null : 'babylon-renderer-unavailable',
    schema: EON_NEXUS_LIVING_CORE_SCHEMA,
    element: shell,
    canvas,
    rendererReady,
    getPlan: () => plan,
    getSurface: () => surface,
    pause: () => { engine?.stopRenderLoop?.(); shell.dataset.paused = 'true'; },
    resume: visibility,
    render: renderSnapshot,
    dispose() {
      if (disposed) return;
      disposed = true;
      try { unsubscribe?.(); } catch {}
      try { unsubscribeInteraction?.(); } catch {}
      try { unsubscribeSpatialSurface?.(); } catch {}
      try { unsubscribeAtlasSpatial?.(); } catch {}
      try { if (activeSpatialDrag) liveNexus?.interactionController?.endMove?.(); } catch {}
      activeSpatialDrag = null;
      observer?.disconnect?.();
      environment.removeEventListener?.('resize', resize);
      documentRef.removeEventListener?.('visibilitychange', visibility);
      try { engine?.stopRenderLoop?.(); } catch {}
      try { scene?.dispose?.(); } catch {}
      try { engine?.dispose?.(); } catch {}
      shell.remove?.();
      if (liveRoot?.dataset) { delete liveRoot.dataset.livingCore; delete liveRoot.dataset.spatialPrimary; delete liveRoot.dataset.spatialRenderer; delete liveRoot.dataset.spatialRendererReason; delete liveRoot.dataset.spatialSurface; }
    }
  });
}

export function getEonNexusLivingCoreTruth() {
  return freeze({
    lazyImportedAfterExplicitAction: true,
    excludedFromEonCity: true,
    sameStateAdapter: true,
    maximumPrimaryControls: 3,
    maximumVisualNodes: EON_NEXUS_LIVING_CORE_MAX_NODES,
    maximumVisualWorkObjects: EON_NEXUS_LIVING_CORE_MAX_WORK_OBJECTS,
    workObjectsUseSamePrivacyProjection: true,
    meshSelectionUsesSameInteractionController: true,
    babylonIsPrimaryVisual: true,
    expandedChatUsesSameBabylonScene: true,
    atlasUsesSameBabylonScene: true,
    atlasDomIsSemanticDetailProjection: true,
    worldSpaceLabels: true,
    automaticSceneOrbit: false,
    pointerDragUsesExistingInteractionController: true,
    pointerDragMutatesProjectState: false,
    responsiveSpatialLayouts: true,
    hiddenRenderingPaused: true,
    reducedMotionStaticFallback: true,
    disposesEngineSceneCanvas: true,
    secondAssistant: false,
    secondProjectStore: false,
    automaticWork: false,
    automaticNavigation: false,
    automaticApproval: false
  });
}

export default freeze({
  EON_NEXUS_LIVING_CORE_SCHEMA,
  EON_NEXUS_LIVING_CORE_MAX_NODES,
  EON_NEXUS_LIVING_CORE_MAX_WORK_OBJECTS,
  getEonNexusLivingCorePlan,
  getEonNexusLivingCoreSpatialSurface,
  mountEonNexusLivingCore,
  getEonNexusLivingCoreTruth
});
