import fs from 'node:fs';
import path from 'node:path';
import { RT92_GRAND_MASTER_ART_CONTRACT, validateRt92GrandMasterArtContract } from '../config/rt92-grand-master-art-contract.mjs';
import { buildEonCityRt92GrandArtPlan, validateEonCityRt92GrandArtPlan } from '../assets/js/city/rt92/eon-city-rt92-grand-art-bible.js';
import { createEonCityRt92SharedArtRuntime } from '../assets/js/city/rt92/eon-city-rt92-shared-art-runtime.js';

const root = path.resolve(import.meta.dirname, '..');
const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail: String(detail || '') });

const contractValidation = validateRt92GrandMasterArtContract();
check('contract-valid', contractValidation.ok, contractValidation.errors.join(','));
for (const file of RT92_GRAND_MASTER_ART_CONTRACT.requiredFiles) check(`required-file:${file}`, fs.existsSync(path.join(root, file)));

for (const quality of ['lite', 'balanced', 'cinematic']) {
  const plan = buildEonCityRt92GrandArtPlan({ quality, reducedMotion: quality === 'lite', coarsePointer: quality === 'lite' });
  const validation = validateEonCityRt92GrandArtPlan(plan);
  check(`plan:${quality}`, validation.ok, validation.errors.join(','));
  check(`layers:${quality}`, plan.layerCount === 15);
  check(`materials:${quality}`, plan.materialFamilyCount === 12);
  check(`first-frame:${quality}`, plan.binaryBudget.firstFrameNewBinaryBytes === 0);
}

const runtime = createEonCityRt92SharedArtRuntime({ quality: 'balanced' });
for (const id of RT92_GRAND_MASTER_ART_CONTRACT.worlds) {
  const result = runtime.setActiveWorld(id, { reason: 'gate' });
  check(`runtime-world:${id}`, result.ok && result.snapshot.activeWorldId === id && result.snapshot.world.requiredLayers.length === 15);
}
check('no-render-authority', runtime.getSnapshot().ownsBabylonEngine === false && runtime.getSnapshot().ownsScene === false && runtime.getSnapshot().ownsRenderLoop === false);
check('no-network-authority', runtime.getSnapshot().networkRequestCreated === false);
runtime.dispose();

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) console.log(`${entry.ok ? 'PASS' : 'FAIL'} ${entry.name}${entry.detail ? ` — ${entry.detail}` : ''}`);
console.log(`RT92 Grand Art Foundation: ${checks.length - failed.length}/${checks.length} PASS`);
if (failed.length) process.exitCode = 1;
