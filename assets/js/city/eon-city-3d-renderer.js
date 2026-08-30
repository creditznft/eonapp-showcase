/**
 * W224 — optional WebGL renderer for the shared local CityWorldState.
 *
 * This is intentionally a small deterministic city renderer, not a second game,
 * multiplayer simulation, market, reward loop, or account surface. It receives
 * only the public-safe CityWorldState projection used by the 2D City.
 */
// Resolve Three.js from the declared npm dependency so Vite owns the production chunk.
// This keeps the optional renderer inside the Babylon City flow, not as a public Three.js route.
import * as THREE from 'three';
import { CITY_COLLIDERS } from './eon-city-2d-engine.js';
import { getAgentPresenceCollaboration, getAgentPresenceOutcome, readAgentPresencePreferences } from '../operator/agent-presence.js';
import { resolveCityAgentVisual } from './eon-city-agent-director.js';
import {
  CITY_3D_QUALITY_PRESETS,
  CITY_3D_RENDERER_SCHEMA,
  CITY_3D_WORLD_DEPTH,
  CITY_3D_WORLD_WIDTH,
  assessCity3dPerformance,
  buildCity3dSceneModel,
  cityToWorld,
  hashUnit,
  normalizeCity3dQuality
} from './eon-city-3d-model.js';
import { createCityAssetRuntime } from './eon-city-asset-runtime.js';
import { getCityMaterialPolicySummary } from './eon-city-material-policy.js';
import { getSpatialCommandCameraPose, normalizeSpatialCommandCameraPreset } from './eon-city-spatial-command-space.js';

export {
  CITY_3D_PREFERENCES_KEY,
  CITY_3D_QUALITY_PRESETS,
  CITY_3D_RENDERER_SCHEMA,
  buildCity3dSceneModel,
  getCity3dPreferences,
  normalizeCity3dQuality,
  saveCity3dPreferences
} from './eon-city-3d-model.js';

const MAX_FRAME_SAMPLES = 90;
const TELEMETRY_INTERVAL_MS = 3000;

function hexToColor(value = '#5eead4') {
  try { return new THREE.Color(String(value || '#5eead4')); } catch { return new THREE.Color('#5eead4'); }
}

function percentile(values = [], target = .95) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * target) - 1));
  return Number(sorted[index] || 0);
}

function disposeObject(object) {
  object?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => { material.map?.dispose?.(); material.dispose?.(); });
  });
}

function createDistrictLabel(district) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(3, 7, 18, .86)';
  context.fillRect(8, 8, 496, 112);
  context.strokeStyle = district.color;
  context.lineWidth = 4;
  context.strokeRect(12, 12, 488, 104);
  context.fillStyle = '#f8fafc';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText(district.shortName, 32, 57);
  context.fillStyle = '#cbd5e1';
  context.font = '500 20px system-ui, sans-serif';
  context.fillText(district.discovered ? 'Discovered locally' : 'Walk here in 2D to discover', 32, 92);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(4.2, 1.05, 1);
  sprite.position.set(district.x, district.height + 1.1, district.z);
  return sprite;
}

function createAgentLabel(cue) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 132;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(3, 7, 18, .9)';
  context.fillRect(8, 8, 496, 116);
  context.strokeStyle = cue.accent;
  context.lineWidth = 4;
  context.strokeRect(12, 12, 488, 108);
  context.fillStyle = '#f8fafc';
  context.font = '700 30px system-ui, sans-serif';
  context.fillText(cue.title, 28, 57);
  context.fillStyle = '#cbd5e1';
  context.font = '500 18px system-ui, sans-serif';
  context.fillText(cue.bubble, 28, 92);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(4.7, 1.21, 1);
  sprite.position.y = 2.55;
  return sprite;
}

function createCommandGuideLabel() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 132;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(3, 7, 18, .9)';
  context.fillRect(8, 8, 496, 116);
  context.strokeStyle = '#7cf9ff';
  context.lineWidth = 4;
  context.strokeRect(12, 12, 488, 108);
  context.fillStyle = '#f8fafc';
  context.font = '700 31px system-ui, sans-serif';
  context.fillText('EONBOT · CITY GUIDE', 28, 57);
  context.fillStyle = '#cbd5e1';
  context.font = '500 18px system-ui, sans-serif';
  context.fillText('Select a landmark to prepare a review.', 28, 92);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(4.8, 1.24, 1);
  sprite.position.y = 2.5;
  return sprite;
}

/** Original procedural guide presence. It is not a live-agent or provider status claim. */
function makeSpatialCommandEonbot(model) {
  const command = model.districts.find((district) => district.id === 'command') || model.districts[0];
  const accent = new THREE.Color('#7cf9ff');
  const group = new THREE.Group();
  group.name = 'spatial-command-eonbot-guide';
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(.42, 20, 16),
    new THREE.MeshStandardMaterial({ color: '#102540', emissive: accent, emissiveIntensity: .9, roughness: .22, metalness: .58 })
  );
  core.position.y = 1.24;
  group.add(core);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(.57, .055, 8, 28),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .86 })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.24;
  group.add(halo);
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(.33, .48, .16, 24),
    new THREE.MeshStandardMaterial({ color: '#0c1d33', emissive: accent, emissiveIntensity: .42, roughness: .35, metalness: .45 })
  );
  beacon.position.y = .08;
  group.add(beacon);
  const label = createCommandGuideLabel();
  if (label) group.add(label);
  group.position.set(Number(command?.x || -3.2) - .74, 0, Number(command?.z || -1.5) + .9);
  group.userData = Object.freeze({ guide: 'eonbot', localOnly: true, status: 'guide', claimsBackgroundWork: false });
  group.userData.motion = { core, halo, phase: .45 };
  return group;
}

function makePresenceAnchor(model, role, index) {
  const districtByRole = {
    coordinator: 'command', researcher: 'trade', builder: 'workspace', reviewer: 'library', 'local-runner': 'trade', guide: 'command'
  };
  const district = model.districts.find((candidate) => candidate.id === districtByRole[role]) || model.districts.find((candidate) => candidate.id === 'command') || null;
  const baseX = Number(district?.x || 0);
  const baseZ = Number(district?.z || 0);
  const offsets = [[-.75, .55], [.8, .42], [-.52, -0.72], [.7, -.64]];
  const offset = offsets[index % offsets.length];
  return new THREE.Vector3(baseX + offset[0], 0, baseZ + offset[1]);
}

function makeAgentPresenceActor(model, entry, index, preferences) {
  const visual = resolveCityAgentVisual(entry, preferences);
  const cue = visual;
  const accent = hexToColor(cue.accent);
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#13223b', emissive: accent, emissiveIntensity: entry.status === 'waiting' ? .28 : .54, roughness: .32, metalness: .42 });
  const visorMaterial = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.08, roughness: .14, metalness: .28 });
  const companion = visual.silhouette === 'orbital-companion' || visual.silhouette === 'guide-light';
  const body = new THREE.Mesh(companion ? new THREE.SphereGeometry(.31, 14, 12) : new THREE.CapsuleGeometry(.22, .42, 4, 9), bodyMaterial);
  body.position.y = companion ? 1.06 : .55;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(visual.silhouette === 'guide-light' ? .14 : .22, 12, 10), visorMaterial);
  head.position.y = companion ? 1.25 : 1.12;
  group.add(head);
  const ring = new THREE.Mesh(new THREE.RingGeometry(companion ? .39 : .3, companion ? .5 : .4, 24), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .035;
  group.add(ring);
  if (visual.silhouette === 'workshop-builder') {
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(.15, .52, .17), bodyMaterial);
      arm.position.set(side * .36, .68, 0); arm.rotation.z = side * .32; group.add(arm);
    }
    const pack = new THREE.Mesh(new THREE.BoxGeometry(.40, .48, .15), visorMaterial);
    pack.position.set(0, .8, .28); group.add(pack);
  } else if (visual.silhouette === 'archive-scout') {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.28, .025, 6, 18), visorMaterial);
    halo.rotation.x = Math.PI / 2; halo.position.y = 1.4; group.add(halo);
  } else if (visual.silhouette === 'review-steward') {
    const mantle = new THREE.Mesh(new THREE.BoxGeometry(.7, .68, .09), bodyMaterial);
    mantle.position.set(0, .62, .23); group.add(mantle);
  } else if (visual.silhouette === 'local-engineer') {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.18, 0), visorMaterial);
    core.position.set(0, 1.42, 0); group.add(core);
  }
  const label = createAgentLabel(cue);
  if (label) group.add(label);
  group.position.copy(makePresenceAnchor(model, entry.role, index));
  group.name = `agent-presence:${entry.id}`;
  group.userData = { agentPresence: true, id: entry.id, role: entry.role, status: entry.status, cue, visual };
  group.userData.agentMotion = { ring, visual, phase: index * .83 };
  return group;
}


function makeAgentPresenceHuddle(model, entries, preferences) {
  const visible = Array.isArray(entries) ? entries.slice(0, 4) : [];
  const collaboration = getAgentPresenceCollaboration(visible);
  if (!preferences?.enabled || visible.length < 2 || collaboration.mode === 'idle') return null;
  const anchors = visible.map((entry, index) => makePresenceAnchor(model, entry.role, index));
  const centre = anchors.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / anchors.length);
  const group = new THREE.Group();
  group.name = 'city-agent-presence-huddle';
  const lineMaterial = new THREE.LineBasicMaterial({ color: hexToColor(collaboration.accent), transparent: true, opacity: .42, depthWrite: false });
  anchors.forEach((point) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([centre, point]);
    group.add(new THREE.Line(geometry, lineMaterial));
  });
  const beacon = new THREE.Mesh(
    new THREE.RingGeometry(.24, .34, 20),
    new THREE.MeshBasicMaterial({ color: hexToColor(collaboration.accent), transparent: true, opacity: .84, side: THREE.DoubleSide })
  );
  beacon.rotation.x = -Math.PI / 2;
  beacon.position.copy(centre);
  beacon.position.y = .05;
  beacon.name = 'city-agent-presence-huddle-beacon';
  group.add(beacon);
  const label = createAgentLabel(collaboration);
  if (label) {
    label.scale.set(4.25, 1.08, 1);
    label.position.copy(centre);
    label.position.y = 2.35;
    group.add(label);
  }
  group.userData = { agentPresenceHuddle: true, collaboration, localOnly: true, externalEffect: false };
  return group;
}

function makeAgentPresenceOutcomeBeacon(model, outcome, preferences) {
  if (!preferences?.enabled || !outcome?.visible) return null;
  const anchor = makePresenceAnchor(model, 'coordinator', 0);
  const group = new THREE.Group();
  group.name = 'city-agent-presence-outcome';
  const accent = hexToColor(outcome.accent);
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(.42, .58, .12, 20),
    new THREE.MeshStandardMaterial({ color: '#12223b', emissive: accent, emissiveIntensity: .52, roughness: .32, metalness: .34 })
  );
  pedestal.position.y = .06;
  group.add(pedestal);
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(.3, 0),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.08, roughness: .18, metalness: .18 })
  );
  beacon.name = 'city-agent-presence-outcome-beacon';
  beacon.position.y = .52;
  group.add(beacon);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.54, .045, 8, 24),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .78 })
  );
  ring.name = 'city-agent-presence-outcome-ring';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .11;
  group.add(ring);
  const label = createAgentLabel(outcome);
  if (label) {
    label.position.y = 1.65;
    group.add(label);
  }
  group.position.set(anchor.x - 1.1, 0, anchor.z - .72);
  group.userData = { agentPresenceOutcome: true, mode: outcome.mode, localOnly: true, externalEffect: false };
  return group;
}

function makeWindowBand(width, height, depth, color, quality) {
  const group = new THREE.Group();
  const columns = Math.max(2, Math.min(8, Math.floor(width / .46)));
  const rows = Math.max(2, Math.min(7, Math.floor(height / .52)));
  const windowGeometry = new THREE.BoxGeometry(Math.min(.22, width / columns * .46), .14, .035);
  const warm = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: quality.detail > 0 ? .65 : .3, roughness: .44, metalness: .18 });
  const quiet = new THREE.MeshStandardMaterial({ color: '#1e293b', emissive: '#0f172a', emissiveIntensity: .12, roughness: .62, metalness: .18 });
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const lit = (row * 3 + column * 5 + Math.round(height * 10)) % 4 !== 0;
      const front = new THREE.Mesh(windowGeometry, lit ? warm : quiet);
      front.position.set(-width / 2 + (column + .5) * (width / columns), .45 + (row + .5) * Math.max(.32, (height - .8) / rows), depth / 2 + .018);
      group.add(front);
      if (quality.detail > 1) {
        const side = front.clone();
        side.position.set(width / 2 + .018, front.position.y, -depth / 2 + (column + .5) * (depth / columns));
        side.rotation.y = Math.PI / 2;
        group.add(side);
      }
    }
  }
  return group;
}

function addDistrictArchitecture(group, district, quality) {
  const accent = hexToColor(district.color);
  const accentMaterial = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: district.active ? .7 : .34, roughness: .36, metalness: .48 });
  const structureMaterial = new THREE.MeshStandardMaterial({ color: '#111c31', roughness: .42, metalness: .46 });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: district.discovered ? .46 : .18, depthWrite: false });
  const deckY = district.height + .46;
  const makeBox = (width, height, depth, x = 0, y = deckY, z = 0, material = structureMaterial) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = quality.shadows; mesh.receiveShadow = quality.shadows;
    mesh.userData = { districtId: district.id, route: district.route };
    group.add(mesh);
    return mesh;
  };
  const landmark = String(district.landmark || district.id);
  if (landmark === 'command-spire') {
    const core = makeBox(district.width * .28, district.height * .55, district.depth * .28, 0, deckY, 0, accentMaterial);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(Math.max(.42, district.width * .12), Math.max(.8, district.height * .48), 6), accentMaterial);
    crown.position.set(0, deckY + district.height * .74, 0); crown.userData = { districtId: district.id, route: district.route }; group.add(crown);
    group.add(makeWindowBand(district.width * .5, district.height * .7, district.depth * .5, district.color, quality));
    core.userData.kind = 'command-core';
  } else if (landmark === 'twin-workshop') {
    makeBox(district.width * .2, district.height * .62, district.depth * .32, -district.width * .17, deckY, 0, accentMaterial);
    makeBox(district.width * .22, district.height * .82, district.depth * .28, district.width * .18, deckY, 0, structureMaterial);
    const bridge = makeBox(district.width * .42, .18, district.depth * .18, 0, deckY + district.height * .4, 0, accentMaterial);
    bridge.userData.kind = 'workshop-bridge';
    group.add(makeWindowBand(district.width * .54, district.height * .72, district.depth * .52, district.color, quality));
  } else if (landmark === 'gallery-arcade') {
    makeBox(district.width * .72, district.height * .28, district.depth * .56, 0, deckY, 0, structureMaterial);
    for (let index = -1; index <= 1; index += 1) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.34, district.width * .11), .055, 8, 20, Math.PI), accentMaterial);
      arch.rotation.z = Math.PI; arch.position.set(index * district.width * .2, deckY + district.height * .34, district.depth * .29); arch.userData = { districtId: district.id, route: district.route }; group.add(arch);
    }
    group.add(makeWindowBand(district.width * .62, district.height * .38, district.depth * .56, district.color, quality));
  } else if (landmark === 'realm-gate') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(Math.max(.58, district.width * .18), 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), structureMaterial);
    dome.position.set(0, deckY + .05, 0); dome.userData = { districtId: district.id, route: district.route }; group.add(dome);
    const portal = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.48, district.width * .15), .07, 10, 28), accentMaterial);
    portal.position.set(0, deckY + Math.max(.72, district.height * .35), district.depth * .22); portal.userData = { districtId: district.id, route: district.route }; group.add(portal);
  } else if (landmark === 'archive-stacks') {
    for (let index = 0; index < 4; index += 1) {
      const height = district.height * (.26 + index * .12);
      makeBox(district.width * .1, height, district.depth * .38, (-.27 + index * .18) * district.width, deckY, 0, index % 2 ? structureMaterial : accentMaterial);
    }
    group.add(makeWindowBand(district.width * .58, district.height * .56, district.depth * .54, district.color, quality));
  } else if (landmark === 'research-observatory') {
    const body = makeBox(district.width * .46, district.height * .28, district.depth * .46, 0, deckY, 0, structureMaterial);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(Math.max(.48, district.width * .15), 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), accentMaterial);
    dome.position.set(0, deckY + district.height * .31, 0); dome.userData = { districtId: district.id, route: district.route }; group.add(dome);
    body.userData.kind = 'observatory-base';
  } else if (landmark === 'vault-bastion') {
    const core = makeBox(district.width * .48, district.height * .48, district.depth * .48, 0, deckY, 0, structureMaterial);
    const door = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(.25, district.width * .09), Math.max(.25, district.width * .09), .08, 16), accentMaterial);
    door.rotation.x = Math.PI / 2; door.position.set(0, deckY + district.height * .28, district.depth * .25); door.userData = { districtId: district.id, route: district.route }; group.add(door);
    core.userData.kind = 'vault-core';
  } else if (landmark === 'orientation-atrium') {
    const plinth = makeBox(district.width * .58, district.height * .14, district.depth * .52, 0, deckY, 0, structureMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.42, district.width * .13), .07, 8, 28), accentMaterial);
    ring.rotation.x = Math.PI / 2; ring.position.set(0, deckY + district.height * .32, 0); ring.userData = { districtId: district.id, route: null }; group.add(ring);
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(Math.max(.22, district.width * .07), 0), glowMaterial);
    marker.position.set(0, deckY + district.height * .5, 0); marker.userData = { districtId: district.id, route: null }; group.add(marker);
    plinth.userData.kind = 'orientation-atrium';
  }
  const roofGlow = new THREE.Mesh(new THREE.CircleGeometry(Math.max(.38, Math.min(district.width, district.depth) * .13), 24), glowMaterial);
  roofGlow.rotation.x = -Math.PI / 2; roofGlow.position.y = deckY + .02; roofGlow.userData = { districtId: district.id, route: district.route }; group.add(roofGlow);
}

function makeRoadDeck(width, depth, x, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, .07, depth), material);
  mesh.position.set(x, .045, z);
  mesh.receiveShadow = true;
  return mesh;
}

function addRoadNetwork(scene, model, quality) {
  const pavement = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: .82, metalness: .14 });
  const edge = new THREE.MeshStandardMaterial({ color: '#334155', emissive: model.paletteColors.accent, emissiveIntensity: quality.detail > 0 ? .1 : .04, roughness: .58, metalness: .28 });
  scene.add(makeRoadDeck(2.35, CITY_3D_WORLD_DEPTH - 1, 0, 0, pavement));
  scene.add(makeRoadDeck(CITY_3D_WORLD_WIDTH - 1, 2.35, 0, 0, pavement));
  if (quality.detail > 0) {
    for (let index = -8; index <= 8; index += 1) {
      const light = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .75, 6), edge);
      light.position.set(index * 1.65, .42, index % 2 ? 1.35 : -1.35);
      scene.add(light);
      const cap = new THREE.PointLight(model.paletteColors.accent, quality.detail > 1 ? .28 : .16, 2.4, 2);
      cap.position.set(light.position.x, .86, light.position.z); scene.add(cap);
    }
  }
}

function addCityFoliage(scene, model, quality) {
  const count = quality.detail > 1 ? 45 : quality.detail > 0 ? 24 : 10;
  const trunk = new THREE.MeshStandardMaterial({ color: '#3f2a1d', roughness: .92, metalness: .02 });
  const leaf = new THREE.MeshStandardMaterial({ color: '#166534', emissive: '#0f5132', emissiveIntensity: quality.detail > 0 ? .16 : .05, roughness: .9, metalness: .02 });
  for (let index = 0; index < count; index += 1) {
    const unitX = hashUnit(`${model.citySeed}:foliage:${index}:x`);
    const unitZ = hashUnit(`${model.citySeed}:foliage:${index}:z`);
    const x = (unitX - .5) * (CITY_3D_WORLD_WIDTH - 3);
    const z = (unitZ - .5) * (CITY_3D_WORLD_DEPTH - 3);
    if (Math.abs(x) < 2.1 || Math.abs(z) < 2.1) continue;
    const tree = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .58, 6), trunk); stem.position.y = .29; tree.add(stem);
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(.32 + hashUnit(`${model.citySeed}:foliage:${index}:s`) * .22, 0), leaf); crown.position.y = .78; tree.add(crown);
    tree.position.set(x, 0, z); scene.add(tree);
  }
}

function addDistrictLandmark(group, district, quality) {
  const color = hexToColor(district.color);
  const metal = new THREE.MeshStandardMaterial({ color: '#172033', emissive: color, emissiveIntensity: district.discovered ? .24 : .08, metalness: .62, roughness: .28 });
  const glow = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: district.active ? .72 : .38 });
  const height = Math.max(1.1, district.height * .22);
  const add = (mesh, y = .5) => { mesh.position.y = y; mesh.userData = { districtId: district.id, route: district.route }; group.add(mesh); };
  switch (district.id) {
    case 'command': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.44, district.width * .13), .09, 8, 20), glow); ring.rotation.x = Math.PI / 2; add(ring, district.height + .38);
      const mast = new THREE.Mesh(new THREE.ConeGeometry(.22, height * 2, 8), metal); add(mast, district.height + height); break;
    }
    case 'workspace': {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.38, district.width * .11), .12, 10, 18, Math.PI), metal); arch.rotation.z = Math.PI; add(arch, district.height + .36); break;
    }
    case 'market': {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(Math.max(.38, district.width * .12), 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), metal); add(dome, district.height + .25); break;
    }
    case 'realm': {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(Math.max(.3, district.width * .11), 0), glow); add(crystal, district.height + .48); break;
    }
    case 'library': {
      const prism = new THREE.Mesh(new THREE.CylinderGeometry(.26, .36, height * 1.8, 6), metal); add(prism, district.height + height * .8); break;
    }
    case 'trade': {
      const dial = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.3, district.width * .1), .08, 8, 18), glow); dial.rotation.x = Math.PI / 2; add(dial, district.height + .32); break;
    }
    case 'vault': {
      const safe = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), metal); safe.rotation.y = Math.PI / 4; add(safe, district.height + .42); break;
    }
    case 'orientation': {
      const compass = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.32, district.width * .1), .055, 8, 24), glow); compass.rotation.x = Math.PI / 2; add(compass, district.height + .34); break;
    }
    default: {
      if (quality.detail > 0) { const fin = new THREE.Mesh(new THREE.ConeGeometry(.18, height, 6), metal); add(fin, district.height + height * .5); }
    }
  }
}

function addCityAtmosphere(scene, model, quality) {
  if (quality.detail < 1) return;
  const accent = hexToColor(model.paletteColors.accent);
  const horizon = new THREE.Mesh(new THREE.RingGeometry(12, 18, 64), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: quality.detail > 1 ? .08 : .045, side: THREE.DoubleSide }));
  horizon.rotation.x = -Math.PI / 2;
  horizon.position.y = .018;
  scene.add(horizon);
  if (quality.detail > 1) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(10.5, .018, 6, 64, Math.PI), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .25 }));
    arc.rotation.x = Math.PI / 2;
    arc.position.y = 4.6;
    scene.add(arc);
  }
}

function makeDistrictMesh(district, palette, quality) {
  const group = new THREE.Group();
  group.name = `city-district:${district.id}`;
  group.userData = { districtId: district.id, route: district.route };
  const baseGeometry = new THREE.BoxGeometry(district.width, 0.34, district.depth);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.ground).lerp(hexToColor(district.color), 0.14),
    roughness: 0.76,
    metalness: 0.18
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.17;
  base.receiveShadow = quality.shadows;
  group.add(base);

  const buildingGeometry = new THREE.BoxGeometry(district.width * 0.58, district.height, district.depth * 0.58);
  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#172033').lerp(hexToColor(district.color), district.discovered ? 0.36 : 0.16),
    emissive: hexToColor(district.color),
    emissiveIntensity: district.active ? 0.55 : (district.discovered ? 0.16 : 0.05),
    roughness: 0.46,
    metalness: 0.42
  });
  const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
  building.position.y = district.height / 2 + 0.34;
  building.castShadow = quality.shadows;
  building.receiveShadow = quality.shadows;
  building.userData = { districtId: district.id, route: district.route };
  group.add(building);
  group.add(makeWindowBand(district.width * 0.55, district.height * 0.68, district.depth * 0.56, district.color, quality));
  addDistrictArchitecture(group, district, quality);
  addDistrictLandmark(group, district, quality);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, Math.max(0.7, district.height * 0.34), 10),
    new THREE.MeshStandardMaterial({ color: district.color, emissive: district.color, emissiveIntensity: district.active ? 1.1 : 0.42, roughness: 0.38, metalness: 0.28 })
  );
  beacon.position.set(0, district.height + 0.72, 0);
  beacon.userData = { districtId: district.id, route: district.route };
  group.add(beacon);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(0.7, district.width * 0.23), Math.max(0.95, district.width * 0.32), 36),
    new THREE.MeshBasicMaterial({ color: district.color, transparent: true, opacity: district.active ? 0.7 : (district.discovered ? 0.28 : 0.1), side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.37;
  halo.userData = { districtId: district.id, route: district.route };
  group.add(halo);

  const label = createDistrictLabel(district);
  if (label) group.add(label);
  group.position.set(district.x, 0, district.z);
  return group;
}

function addStaticWorld(scene, model, quality) {
  const palette = model.paletteColors;
  scene.background = new THREE.Color(palette.sky);
  scene.fog = new THREE.Fog(new THREE.Color(palette.fog), 20, 44);
  const ambient = new THREE.HemisphereLight(0xc7d2fe, 0x07111f, quality.detail > 0 ? 1.45 : 1.1);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, quality.detail > 1 ? 1.4 : 1.0);
  key.position.set(8, 16, 11);
  key.castShadow = quality.shadows;
  if (quality.shadows) {
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 42;
  }
  scene.add(key);
  const rim = new THREE.PointLight(new THREE.Color(palette.accent), quality.detail > 0 ? 4.5 : 2.7, 34, 2);
  rim.position.set(0, 7, 0);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_3D_WORLD_WIDTH + 4, CITY_3D_WORLD_DEPTH + 4),
    new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.9, metalness: 0.08 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = quality.shadows;
  scene.add(ground);

  const grid = new THREE.GridHelper(Math.max(CITY_3D_WORLD_WIDTH, CITY_3D_WORLD_DEPTH) + 6, quality.detail > 0 ? 26 : 16, new THREE.Color(palette.accent), new THREE.Color('#334155'));
  grid.material.transparent = true;
  grid.material.opacity = quality.detail > 0 ? 0.2 : 0.12;
  grid.position.y = 0.012;
  scene.add(grid);
  addRoadNetwork(scene, model, quality);
  addCityFoliage(scene, model, quality);
  addCityAtmosphere(scene, model, quality);

  for (const collider of CITY_COLLIDERS) {
    const center = cityToWorld({ x: collider.x + collider.width / 2, y: collider.y + collider.height / 2 });
    const water = collider.label === 'canal';
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(collider.width * CITY_3D_WORLD_WIDTH, water ? 0.08 : 0.2, collider.height * CITY_3D_WORLD_DEPTH),
      new THREE.MeshStandardMaterial({ color: water ? '#2563eb' : '#166534', transparent: true, opacity: water ? 0.48 : 0.38, roughness: 0.75, metalness: water ? 0.32 : 0.08 })
    );
    mesh.position.set(center.x, water ? 0.06 : 0.1, center.z);
    mesh.receiveShadow = quality.shadows;
    scene.add(mesh);
    if (water) {
      const bridgeMaterial = new THREE.MeshStandardMaterial({ color: '#475569', roughness: .62, metalness: .34 });
      for (const factor of [.3, .7]) {
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(collider.width * CITY_3D_WORLD_WIDTH + .6, .16, .5), bridgeMaterial);
        bridge.position.set(center.x, .17, center.z - collider.height * CITY_3D_WORLD_DEPTH * .5 + collider.height * CITY_3D_WORLD_DEPTH * factor);
        bridge.receiveShadow = quality.shadows; scene.add(bridge);
      }
    }
  }

  if (quality.detail > 0) {
    const starGeometry = new THREE.BufferGeometry();
    const count = quality.detail > 1 ? 180 : 72;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const x = (hashUnit(`${model.citySeed}:star:${index}:x`) - 0.5) * 46;
      const y = 6 + hashUnit(`${model.citySeed}:star:${index}:y`) * 18;
      const z = (hashUnit(`${model.citySeed}:star:${index}:z`) - 0.5) * 34;
      positions.set([x, y, z], index * 3);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#dbeafe', size: quality.detail > 1 ? 0.075 : 0.05, transparent: true, opacity: 0.7 }));
    scene.add(stars);
  }
}

export class EonCityWebglRenderer {
  constructor(options = {}) {
    this.host = options.host || null;
    this.model = buildCity3dSceneModel(options.state || {}, { now: options.now });
    this.qualityId = normalizeCity3dQuality(options.quality, 'balanced');
    this.quality = CITY_3D_QUALITY_PRESETS[this.qualityId];
    const assetQuality = this.qualityId === 'high' ? 'cinematic' : (this.qualityId === 'low' ? 'lite' : 'balanced');
    this.assetRuntime = createCityAssetRuntime({ engine: 'three', quality: assetQuality });
    this.onStatus = typeof options.onStatus === 'function' ? options.onStatus : () => {};
    this.onFallback = typeof options.onFallback === 'function' ? options.onFallback : () => {};
    this.onDistrictSelect = typeof options.onDistrictSelect === 'function' ? options.onDistrictSelect : () => {};
    this.onTelemetry = typeof options.onTelemetry === 'function' ? options.onTelemetry : () => {};
    this.running = false;
    this.destroyed = false;
    this.raf = 0;
    this.lastFrameAt = 0;
    this.lastRenderAt = 0;
    this.frameSamples = [];
    this.performanceSteps = 0;
    this.fallbackIssued = false;
    this.resolutionScale = 1;
    this.sessionStartedAt = 0;
    this.lastTelemetryAt = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.districtGroups = new Map();
    this.agentPresence = Array.isArray(options.agentPresence) ? options.agentPresence : [];
    this.agentPresencePreferences = options.agentPresencePreferences || readAgentPresencePreferences();
    this.agentOutcome = options.agentOutcome || getAgentPresenceOutcome({ latest: null });
    this.agentPresenceGroup = null;
    this.agentVisuals = new Map();
    this.agentHuddle = null;
    this.agentOutcomeBeacon = null;
    this.commandGuide = null;
    this.cameraPresetId = normalizeSpatialCommandCameraPreset(options.cameraPreset, 'arrival');
    this.cameraGoalPosition = new THREE.Vector3();
    this.cameraGoalTarget = new THREE.Vector3();
    this.cleanup = [];
  }

  start() {
    if (!this.host || this.destroyed) return null;
    this.host.replaceChildren();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: this.quality.antialias, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = Boolean(this.quality.shadows);
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'eon3-webgl-canvas';
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute('aria-label', 'Optional EON City 3D view. Click a district to select its native route.');
    this.host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
    this.setCameraPreset(this.cameraPresetId, { immediate: true, announce: false });
    addStaticWorld(this.scene, this.model, this.quality);
    this.model.districts.forEach((district) => {
      const group = makeDistrictMesh(district, this.model.paletteColors, this.quality);
      this.scene.add(group);
      this.districtGroups.set(district.id, group);
    });
    this.avatar = this.createAvatar();
    this.scene.add(this.avatar);
    this.agentPresenceGroup = new THREE.Group();
    this.agentPresenceGroup.name = 'city-agent-presence';
    this.scene.add(this.agentPresenceGroup);
    this.commandGuide = makeSpatialCommandEonbot(this.model);
    this.scene.add(this.commandGuide);
    this.setAgentPresence(this.agentPresence, this.agentPresencePreferences, this.agentOutcome);
    this.resize();
    this.bindEvents();
    this.running = true;
    this.sessionStartedAt = performance.now();
    this.onStatus(`3D ${this.quality.label.toLowerCase()} view opened from the same local CityWorldState. No background simulation started.`);
    this.loop(performance.now());
    return this;
  }

  createAvatar() {
    const avatar = new THREE.Group();
    const color = this.model.avatar.appearance === 'graphite' ? '#cbd5e1' : this.model.paletteColors.accent;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.58, 5, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.26, roughness: 0.38, metalness: 0.18 }));
    body.position.y = 0.67;
    avatar.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 12), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.46, metalness: 0.05 }));
    head.position.y = 1.3;
    avatar.add(head);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.48, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    avatar.add(ring);
    const point = cityToWorld(this.model.avatar);
    avatar.position.set(point.x, 0, point.z);
    avatar.name = 'city-avatar';
    return avatar;
  }

  setCameraPreset(value, { immediate = false, announce = true } = {}) {
    const pose = getSpatialCommandCameraPose(value, 'arrival');
    this.cameraPresetId = pose.id;
    this.cameraGoalPosition.set(...pose.position);
    this.cameraGoalTarget.set(...pose.target);
    if (this.camera && immediate) {
      this.camera.position.copy(this.cameraGoalPosition);
      this.camera.lookAt(this.cameraGoalTarget);
    }
    if (announce) this.onStatus(`Camera moved to ${pose.id.replace(/-/g, ' ')} view. This changes only your local visual view.`);
    return pose.id;
  }

  getCameraPreset() {
    return this.cameraPresetId;
  }

  setAgentPresence(entries = [], preferences = this.agentPresencePreferences, outcome = this.agentOutcome) {
    this.agentPresence = Array.isArray(entries) ? entries.slice(0, 4) : [];
    this.agentPresencePreferences = preferences || readAgentPresencePreferences();
    this.agentOutcome = outcome || getAgentPresenceOutcome({ latest: null });
    if (!this.agentPresenceGroup) return;
    this.agentPresenceGroup.children.slice().forEach((child) => {
      this.agentPresenceGroup.remove(child);
      disposeObject(child);
    });
    this.agentVisuals.clear();
    this.agentHuddle = null;
    this.agentOutcomeBeacon = null;
    if (!this.agentPresencePreferences.enabled) return;
    this.agentPresence.forEach((entry, index) => {
      const actor = makeAgentPresenceActor(this.model, entry, index, this.agentPresencePreferences);
      this.agentPresenceGroup.add(actor);
      this.agentVisuals.set(entry.id, actor);
    });
    const huddle = makeAgentPresenceHuddle(this.model, this.agentPresence, this.agentPresencePreferences);
    if (huddle) {
      this.agentPresenceGroup.add(huddle);
      this.agentHuddle = huddle;
    }
    const beacon = makeAgentPresenceOutcomeBeacon(this.model, this.agentOutcome, this.agentPresencePreferences);
    if (beacon) {
      this.agentPresenceGroup.add(beacon);
      this.agentOutcomeBeacon = beacon;
    }
  }

  bindEvents() {
    const canvas = this.renderer.domElement;
    const onPointerUp = (event) => this.pickDistrict(event);
    const onKeyDown = (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && this.selectedDistrictId) {
        event.preventDefault();
        const district = this.model.districts.find((item) => item.id === this.selectedDistrictId);
        if (district) this.onDistrictSelect(district, { open: true });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') this.pause();
      else this.resume();
    };
    const onContextLost = (event) => {
      event.preventDefault();
      this.emitFallback('webgl-context-lost');
    };
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    document.addEventListener('visibilitychange', onVisibility);
    this.cleanup.push(() => canvas.removeEventListener('pointerup', onPointerUp));
    this.cleanup.push(() => canvas.removeEventListener('keydown', onKeyDown));
    this.cleanup.push(() => canvas.removeEventListener('webglcontextlost', onContextLost));
    this.cleanup.push(() => document.removeEventListener('visibilitychange', onVisibility));
    if (globalThis.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host);
      this.cleanup.push(() => this.resizeObserver?.disconnect());
    } else {
      const onResize = () => this.resize();
      globalThis.addEventListener?.('resize', onResize, { passive: true });
      this.cleanup.push(() => globalThis.removeEventListener?.('resize', onResize));
    }
  }

  pickDistrict(event) {
    if (!this.renderer || !this.camera) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.districtGroups.values()], true);
    const districtId = hits.map((hit) => hit.object.parent?.userData?.districtId || hit.object.userData?.districtId).find(Boolean);
    const district = this.model.districts.find((item) => item.id === districtId);
    if (!district) return;
    this.selectedDistrictId = district.id;
    this.onDistrictSelect(district, { open: false });
  }

  resize() {
    if (!this.renderer || !this.camera || !this.host) return;
    const width = Math.max(280, Math.floor(this.host.clientWidth || 960));
    const height = Math.max(320, Math.floor(this.host.clientHeight || 620));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(this.quality.pixelRatio * this.resolutionScale, globalThis.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
  }

  loop(now) {
    if (!this.running || this.destroyed) return;
    const delta = this.lastFrameAt ? Math.max(1, now - this.lastFrameAt) : 16;
    this.lastFrameAt = now;
    const minimumInterval = 1000 / this.quality.maxFps;
    if (!this.lastRenderAt || now - this.lastRenderAt >= minimumInterval) {
      this.lastRenderAt = now;
      this.animate(now, delta);
      this.renderer.render(this.scene, this.camera);
      this.recordFrame(delta);
      this.maybeEmitTelemetry(now);
    }
    this.raf = globalThis.requestAnimationFrame?.((time) => this.loop(time)) || 0;
  }

  animate(now) {
    const pulse = 0.5 + Math.sin(now / 750) * 0.5;
    if (this.camera) {
      const blend = this.quality.detail > 0 ? .072 : .11;
      this.camera.position.lerp(this.cameraGoalPosition, blend);
      this.camera.lookAt(this.cameraGoalTarget);
    }
    const guideMotion = this.commandGuide?.userData?.motion;
    if (guideMotion?.core) {
      guideMotion.core.position.y = 1.24 + (this.quality.detail > 0 ? Math.sin(now / 460 + guideMotion.phase) * .09 : 0);
      guideMotion.halo.rotation.z = this.quality.detail > 0 ? now / 680 : 0;
      guideMotion.halo.material.opacity = this.quality.detail > 0 ? .66 + pulse * .2 : .78;
    }
    this.districtGroups.forEach((group, id) => {
      const active = id === this.modelProgressLastDistrictId;
      const beacon = group.children.find((child) => child.geometry?.type === 'CylinderGeometry');
      if (beacon?.material?.emissiveIntensity !== undefined) beacon.material.emissiveIntensity = active ? 0.75 + pulse * 0.4 : 0.24 + pulse * 0.12;
      const halo = group.children.find((child) => child.geometry?.type === 'RingGeometry');
      if (halo?.material?.opacity !== undefined) {
        halo.material.opacity = id === this.selectedDistrictId ? 0.85 : (active ? 0.5 + pulse * 0.14 : 0.16);
        if (this.quality.detail > 0) halo.rotation.z = now / 2600;
      }
    });
    this.agentVisuals.forEach((actor, id) => {
      const index = [...this.agentVisuals.keys()].indexOf(id);
      const motion = actor.userData?.agentMotion || {};
      const ring = motion.ring || actor.children.find((child) => child.geometry?.type === 'RingGeometry');
      const profile = motion.visual || actor.userData?.visual || {};
      const phase = Number(motion.phase || index);
      const speed = profile.motion === 'focus' ? 2.45 : profile.motion === 'handoff' ? 2.1 : 1.25;
      const bob = profile.motion === 'focus' ? .082 : profile.motion === 'handoff' ? .11 : .05;
      if (ring) ring.rotation.z = this.quality.detail > 0 ? (now / 720) * speed + phase : 0;
      actor.position.y = this.quality.detail > 0 ? Math.sin(now / 470 * speed + phase) * bob : 0;
      actor.rotation.y = this.quality.detail > 0 && profile.motion === 'handoff' ? Math.sin(now / 780 + phase) * .32 : Math.sin(now / 2100 + phase) * .08;
    });
    const huddleBeacon = this.agentHuddle?.children?.find((child) => child.name === 'city-agent-presence-huddle-beacon');
    if (huddleBeacon) {
      huddleBeacon.rotation.z = this.quality.detail > 0 ? now / 880 : 0;
      huddleBeacon.material.opacity = this.quality.detail > 0 ? .58 + pulse * .26 : .72;
    }
    const outcomeBeacon = this.agentOutcomeBeacon?.children?.find((child) => child.name === 'city-agent-presence-outcome-beacon');
    const outcomeRing = this.agentOutcomeBeacon?.children?.find((child) => child.name === 'city-agent-presence-outcome-ring');
    if (outcomeBeacon) outcomeBeacon.rotation.y = this.quality.detail > 0 ? now / 900 : 0;
    if (outcomeRing) {
      outcomeRing.rotation.z = this.quality.detail > 0 ? now / 980 : 0;
      outcomeRing.material.opacity = this.quality.detail > 0 ? .54 + pulse * .24 : .7;
    }
    if (this.avatar) this.avatar.position.y = this.quality.detail > 0 ? Math.sin(now / 430) * 0.035 : 0;
  }

  get modelProgressLastDistrictId() {
    return this.model.districts.find((district) => district.active)?.id || '';
  }

  recordFrame(delta) {
    this.frameSamples.push(delta);
    if (this.frameSamples.length > MAX_FRAME_SAMPLES) this.frameSamples.shift();
    if (this.frameSamples.length < MAX_FRAME_SAMPLES) return;
    const average = this.frameSamples.reduce((sum, value) => sum + value, 0) / this.frameSamples.length;
    const currentMinScale = Number(this.quality.minPixelRatio || this.quality.pixelRatio || 1) / Number(this.quality.pixelRatio || 1);
    if (average > this.quality.frameBudgetMs * 1.15 && this.resolutionScale > currentMinScale + .02) {
      this.resolutionScale = Math.max(currentMinScale, Number((this.resolutionScale - .12).toFixed(2)));
      this.frameSamples.length = 0;
      this.onStatus(`Frame governor reduced render resolution to ${Math.round(this.resolutionScale * 100)}% before changing visual quality.`);
      this.resize();
      return;
    }
    if (average <= this.quality.frameBudgetMs * 1.45) return;
    this.frameSamples.length = 0;
    if (this.qualityId === 'high') return this.applyQuality('balanced', `Frame governor selected Balanced after ${Math.round(average)} ms frames.`);
    if (this.qualityId === 'balanced') return this.applyQuality('low', `Frame governor selected Low after ${Math.round(average)} ms frames.`);
    this.emitFallback(`sustained-frame-time-${Math.round(average)}ms`);
  }

  maybeEmitTelemetry(now) {
    if (now - this.lastTelemetryAt < TELEMETRY_INTERVAL_MS) return;
    this.lastTelemetryAt = now;
    this.onTelemetry(this.getRuntimeSummary());
  }

  applyQuality(nextQuality, message = '') {
    const normalized = normalizeCity3dQuality(nextQuality, this.qualityId);
    if (normalized === this.qualityId) return;
    this.qualityId = normalized;
    this.quality = CITY_3D_QUALITY_PRESETS[normalized];
    this.resolutionScale = 1;
    this.performanceSteps += 1;
    this.onStatus(message || `3D quality changed to ${this.quality.label}.`);
    this.resize();
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    if (this.raf) globalThis.cancelAnimationFrame?.(this.raf);
    this.raf = 0;
  }

  resume() {
    if (this.destroyed || this.running || document.visibilityState === 'hidden') return;
    this.running = true;
    this.lastFrameAt = 0;
    this.lastRenderAt = 0;
    this.raf = globalThis.requestAnimationFrame?.((time) => this.loop(time)) || 0;
  }

  emitFallback(reason = 'performance') {
    if (this.fallbackIssued) return;
    this.fallbackIssued = true;
    this.onFallback({ reason, quality: this.qualityId, model: this.model });
  }

  getRuntimeSummary() {
    const averageFrameMs = this.frameSamples.length
      ? this.frameSamples.reduce((sum, value) => sum + value, 0) / this.frameSamples.length
      : 0;
    const p95FrameMs = percentile(this.frameSamples, .95);
    const elapsedMs = this.sessionStartedAt ? Math.max(0, performance.now() - this.sessionStartedAt) : 0;
    const base = {
      schema: CITY_3D_RENDERER_SCHEMA,
      quality: this.qualityId,
      running: this.running,
      averageFrameMs: Number(averageFrameMs.toFixed(2)),
      p95FrameMs: Number(p95FrameMs.toFixed(2)),
      estimatedFps: averageFrameMs ? Number(Math.min(240, 1000 / averageFrameMs).toFixed(1)) : 0,
      elapsedMs: Number(elapsedMs.toFixed(0)),
      resolutionScale: this.resolutionScale,
      automaticFallbackTo2d: true,
      fallbackIssued: this.fallbackIssued,
      worldId: this.model.worldId,
      districtCount: this.model.districts.length,
      agentPresenceVisible: this.agentVisuals.size,
      agentPresenceHuddleVisible: Boolean(this.agentHuddle),
      agentPresenceOutcomeVisible: Boolean(this.agentOutcomeBeacon),
      agentPresenceLocalOnly: true,
      commandGuideVisible: Boolean(this.commandGuide),
      commandGuideStatus: 'guide',
      cameraPresetId: this.cameraPresetId,
      assetPipeline: this.assetRuntime.getSummary(),
      materialPolicy: getCityMaterialPolicySummary(this.qualityId === 'high' ? 'cinematic' : (this.qualityId === 'low' ? 'lite' : 'balanced'))
    };
    const assessment = assessCity3dPerformance(base, this.quality);
    return Object.freeze({ ...base, performanceState: assessment.state, recommendedAction: assessment.action });
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pause();
    this.cleanup.splice(0).forEach((callback) => {
      try { callback(); } catch {}
    });
    this.districtGroups.forEach((group) => disposeObject(group));
    disposeObject(this.scene);
    this.renderer?.dispose?.();
    this.renderer?.forceContextLoss?.();
    this.renderer?.domElement?.remove?.();
    this.assetRuntime?.dispose?.();
    this.districtGroups.clear();
    this.agentVisuals.clear();
    this.agentOutcomeBeacon = null;
    this.commandGuide = null;
    this.camera = null;
  }
}

export function mountEonCityWebglRenderer(options = {}) {
  const renderer = new EonCityWebglRenderer(options);
  return renderer.start();
}
