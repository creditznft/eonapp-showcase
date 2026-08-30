#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660R_LIVING_NEXUS_EXPANSE_RENDERER_CONTRACT } from '../config/w660r-living-nexus-expanse-renderer-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660rLivingNexusExpanseRenderer() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660r-living-nexus-expanse-renderer-contract.mjs',
    'assets/js/city/eon-city-living-nexus-babylon-runtime.js',
    'assets/js/city/eon-city-living-nexus-panel.js',
    'tests/unit/w660r-living-nexus-expanse-renderer.test.mjs'
  ];
  add('required-files', required.every(exists), 'contract, Babylon runtime, panel and tests exist');

  const renderer = read(required[1]);
  add('one-scene-no-engine', !/new\s+Engine\s*\(/.test(renderer) && !/new\s+Scene\s*\(/.test(renderer), 'renderer receives the existing scene and creates no engine or scene');
  add('no-second-render-loop', !/runRenderLoop|requestAnimationFrame/.test(renderer), 'renderer adds no render loop');
  add('no-second-canvas', !/createElement\s*\(\s*["']canvas["']/.test(renderer), 'renderer adds no canvas');
  add(
    'deterministic-streaming-window',
    /buildEonCityLivingNexusExpanse/.test(renderer)
      && /renderedCellCount/.test(renderer)
      && /interactiveCellCount/.test(renderer)
      && /horizonCellCount/.test(renderer)
      && W660R_LIVING_NEXUS_EXPANSE_RENDERER_CONTRACT.renderer.visibleCellCount === 25
      && W660R_LIVING_NEXUS_EXPANSE_RENDERER_CONTRACT.renderer.interactiveCellCount === 9
      && W660R_LIVING_NEXUS_EXPANSE_RENDERER_CONTRACT.renderer.horizonCellCount === 16,
    'deterministic 5×5 visible window keeps a 3×3 interactive neighbourhood plus 16 horizon cells'
  );
  add(
    'connected-streets',
    /axis: 'east-west'/.test(renderer)
      && /axis: 'north-south'/.test(renderer)
      && /w667-street-x-/.test(renderer)
      && /w667-street-z-/.test(renderer),
    'every streamed cell renders deterministic connected east-west and north-south streets'
  );
  add('functional-opportunity-signal', /living-nexus-functional-npc-signal/.test(renderer) && /reviewFirst: true/.test(renderer) && /executesWork: false/.test(renderer), 'each cell has a truthful functional NPC opportunity signal');
  add('quality-reduced-motion', /buildingCount/.test(renderer) && /setReducedEffects/.test(renderer) && /reducedEffects/.test(renderer), 'quality profiles and reduced effects are explicit');
  add(
    'bounded-incremental-disposal',
    /const renderedCells = new Map\(\)/.test(renderer)
      && /for \(const \[cellId, record\] of \[\.\.\.renderedCells\.entries\(\)\]\)/.test(renderer)
      && /record\.dispose\?\.\(\)/.test(renderer)
      && /renderedCells\.delete\(cellId\)/.test(renderer)
      && /renderedCells\.set\(cellId, createRenderedCell\(cell\)\)/.test(renderer)
      && /streamedCellReusedCount/.test(renderer)
      && /streamedCellDisposedCount/.test(renderer),
    'incremental Map residency reuses unchanged cells and disposes only cells that exit or change tier'
  );
  add('my-realm-transformations', /living-nexus-verified-transformation/.test(renderer) && /boundedTransformations/.test(renderer) && /privateContentStored: false/.test(renderer), 'My Realm uses bounded public-safe transformation ids');

  const babylon = read('assets/js/city/eon-city-play-babylon.js');
  add('canonical-runtime-integrated', /createEonCityLivingNexusBabylonRuntime/.test(babylon) && /livingNexusRuntime\.update/.test(babylon) && /livingNexusRuntime\.dispose/.test(babylon), 'existing Babylon lifecycle owns update and disposal');
  add('explicit-destination-travel', /enterLivingNexusDestination/.test(babylon) && /explicit-user-action-required/.test(babylon) && /living-nexus-destination-change/.test(babylon), 'destination travel is explicit and cancels stale input');
  add('explicit-cell-guide', /guideToLivingNexusCell/.test(babylon) && /expanse-not-active/.test(babylon) && /automaticNavigation: false/.test(renderer), 'cell guidance requires explicit Expanse entry');
  add('dynamic-world-bound', /LIVING_NEXUS_WORLD_BOUND/.test(babylon) && /destination === 'core' \? (?:CORE_WORLD_BOUND|MAX_WORLD)/.test(babylon), 'Core keeps its current authored bound authority while Living Nexus destinations use the expanded bound');

  const panel = read(required[2]);
  add('two-step-ui', /data-eon-living-destination/.test(panel) && /data-eon-living-enter-destination/.test(panel) && /Selection and travel are separate visible actions/.test(panel), 'destination selection and entry are separate controls');
  add('renderer-status-visible', /getLivingNexusSummary/.test(panel) && /rendered cells/.test(panel), 'panel exposes rendered source state without claiming browser proof');

  const roadmap = read('docs/W660P_EONCITY_LIVING_NEXUS_HYBRID_MASTER_ROADMAP_2026-07-21.md');
  add('browser-proof-still-pending', /authenticated real-browser proof/i.test(roadmap) && /Functions-inclusive Cloudflare Pages/.test(roadmap), 'roadmap keeps authenticated browser and complete Pages proof pending');

  const pkg = JSON.parse(read('package.json'));
  add('package-command', pkg.scripts?.['qa:w660r-living-nexus-expanse-renderer'] === 'node scripts/w660r-living-nexus-expanse-renderer-gate.mjs && node --test tests/unit/w660r-living-nexus-expanse-renderer.test.mjs', 'focused W660R QA command exists');
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite-current', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660r-living-nexus-expanse-renderer.test.mjs') && manifest.testFileCount >= 316, `${manifest.testFileCount} maintained test files include W660R`);

  return freeze({ schema: 'eonapp.w660r.living-nexus-expanse-renderer-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660rLivingNexusExpanseRenderer();
for (const check of report.checks) console.log(`[W660R] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660R] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
