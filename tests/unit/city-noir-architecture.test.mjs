import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import {
  EON_NOIR_ARCHITECTURE_SCHEMA,
  EON_NOIR_LANDMARK_CATALOG,
  getEonNoirArchitectureSummary,
  validateEonNoirArchitecture,
  createEonNoirLandmark,
  createEonNoirWorldDetailLayer,
  createEonNoirWorldLayer
} from '../../assets/js/city/eon-city-noir-architecture.js';

const rendererPath = new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url);

test('CITY-ART defines a complete original EON Noir architectural language', () => {
  const report = validateEonNoirArchitecture();
  const summary = getEonNoirArchitectureSummary();
  const ids = new Set(EON_NOIR_LANDMARK_CATALOG.map((entry) => entry.id));

  assert.equal(report.ok, true);
  assert.equal(report.schema, EON_NOIR_ARCHITECTURE_SCHEMA);
  assert.equal(summary.style, 'EON Noir');
  assert.equal(summary.plainBoxLandmarkLanguage, false);
  assert.equal(summary.originalProcedural, true);
  assert.equal(summary.remoteAssets, false);
  assert.equal(summary.finalBinaryArt, false);
  assert.equal(summary.finalVisualCertification, false);
  for (const required of ['command-loom', 'creator-atrium', 'forge-basilica', 'signal-sail', 'archive-canopy', 'automation-observatory', 'support-dock', 'device-observatory', 'project-district']) {
    assert.equal(ids.has(required), true, `missing EON Noir landmark: ${required}`);
  }
});

test('CITY-ART/CITY-WORLD renderer integration keeps private project districts local and safe', async () => {
  const source = await readFile(rendererPath, 'utf8');

  assert.match(source, /from '\.\/eon-city-noir-architecture\.js'/);
  assert.match(source, /createEonNoirWorldLayer\(scene, \{ quality, vectorArt: vectorArtRuntime, seed: citySeed \}\)/);
  assert.match(source, /createEonNoirWorldDetailLayer\(scene, \{ quality, vectorArt: vectorArtRuntime, seed: citySeed \}\)/);
  assert.match(source, /noirStreetDetail:/);
  assert.match(source, /type: 'command-loom'/);
  assert.match(source, /type: 'creator-atrium'/);
  assert.match(source, /type: 'forge-basilica'/);
  assert.match(source, /'signal-tower': 'signal-sail'/);
  assert.match(source, /'archive-gardens': 'archive-canopy'/);
  assert.match(source, /type: 'project-district'/);
  assert.match(source, /citySafeLabelOnly: true/);
  assert.match(source, /projectReferenceExposed: false/);
  assert.match(source, /promptExposed: false/);
  assert.match(source, /secretExposed: false/);
  assert.doesNotMatch(source, /district-skyline-\$\{index\}/);
});


test('CITY-ART renders every original landmark composition in a Babylon NullEngine scene', () => {
  const engine = new NullEngine({ renderWidth: 640, renderHeight: 360, textureSize: 512 });
  const scene = new Scene(engine);
  scene.metadata = { playPaused: true, playReducedEffects: true };
  const rendered = EON_NOIR_LANDMARK_CATALOG.map((entry, index) => createEonNoirLandmark(scene, {
    id: `test-${entry.id}`,
    type: entry.id,
    quality: index % 3 === 0 ? 'lite' : index % 3 === 1 ? 'balanced' : 'cinematic',
    position: { x: (index % 3) * 5, z: Math.floor(index / 3) * 5 },
    geometry: { towerHeight: 3, deckWidth: 1.8, spireCount: 3, ringRadius: .7 }
  }));
  const world = createEonNoirWorldLayer(scene, { quality: 'balanced', seed: 'test-eon-noir' });
  const detail = createEonNoirWorldDetailLayer(scene, { quality: 'balanced', seed: 'test-eon-noir' });
  const cinematicDetail = createEonNoirWorldDetailLayer(scene, { quality: 'cinematic', seed: 'test-eon-noir-cinematic' });

  assert.equal(rendered.length, EON_NOIR_LANDMARK_CATALOG.length);
  assert.ok(rendered.every((entry) => entry.root && entry.root.metadata?.kind === 'eon-noir-landmark'));
  assert.ok(rendered.every((entry) => entry.localOnly === true && entry.remoteAssets === false));
  assert.ok(world.root && world.ambientDroneCount >= 1);
  assert.ok(detail.root && detail.detailCount >= 4 && detail.reflectorCount >= 1 && detail.gardenCount >= 2);
  assert.equal(detail.remoteAssets, false);
  assert.ok(cinematicDetail.root && cinematicDetail.detailCount > detail.detailCount);
  assert.equal(cinematicDetail.reflectorCount, 4);
  assert.ok(scene.meshes.length > EON_NOIR_LANDMARK_CATALOG.length * 5);

  scene.dispose();
  engine.dispose();
});
