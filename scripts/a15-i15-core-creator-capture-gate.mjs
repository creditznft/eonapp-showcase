import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEonCreatorCaptureTruth } from '../assets/js/contracts/creator/eon-creator-capture.js';
import { saveEonCreatorCaptureToLibrary } from '../assets/js/work-surface/adapters/eon-creator-capture-panel.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const OUTPUT = path.join(EVIDENCE_DIR, 'A15_I15_CORE_CREATOR_CAPTURE_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];

const coreSource = read('assets/js/contracts/creator/eon-creator-capture.js');
const citySource = read('assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js');
const panelSource = read('assets/js/work-surface/adapters/eon-creator-capture-panel.js');
const registrySource = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
const catalogSource = read('assets/js/create/eon-create-catalog.js');

if (/\.\.\/city\/|progression-ledger|assets\/js\/city\//.test(coreSource)) errors.push('Core Creator Capture imports City implementation or progression.');
if (!/createEonCreatorCaptureController/.test(citySource) || !/dispatchEonCityW659gVerifiedAction/.test(citySource)) errors.push('City is not a thin progression adapter over Core Creator Capture.');
if (!/contracts\/creator\/eon-creator-capture\.js/.test(panelSource) || /contracts\/city\/w659g/.test(panelSource)) errors.push('Core work surface still imports the City capture adapter.');
for (const token of ['Download WebM', 'Save to Creator Library', 'Nothing uploads or posts automatically', 'I reviewed the video, caption and signed invite']) if (!panelSource.includes(token)) errors.push(`Creator Capture surface missing ${token}.`);
if (!/Local recording and review/.test(registrySource) || !/fallbackHref: '\/create'/.test(registrySource)) errors.push('Creator Capture work-surface ownership remains City-only.');
if (!/id: 'image'[\s\S]*status: 'Setup required'/.test(catalogSource) || !/id: 'video'[\s\S]*status: 'Setup required'/.test(catalogSource)) errors.push('Uncertified generation adapters are exposed as launch-ready.');

const file = new Blob(['a15-i15-gate-media'], { type: 'video/webm' });
Object.defineProperty(file, 'name', { value: 'a15-i15-capture.webm' });
let captured = null;
const saveResult = await saveEonCreatorCaptureToLibrary(file, { durationMs: 1800 }, {
  environment: { crypto: globalThis.crypto },
  now: Date.parse('2026-08-05T02:20:00.000+05:30'),
  saveAsset: async (input, options) => {
    captured = { input, explicitUserAction: options.explicitUserAction === true };
    return { ok: true, asset: { assetId: 'a15_i15_gate_asset' }, media: { ok: true, bytes: input.bytes } };
  }
});
if (!saveResult.ok || !/^[a-f0-9]{64}$/.test(saveResult.sha256) || captured?.input?.sha256 !== saveResult.sha256 || captured?.input?.mediaBlob !== file || !captured?.explicitUserAction) errors.push('Local WebM did not enter Creator Library through a digest-verified explicit write.');
if (saveResult.uploaded !== false || saveResult.posted !== false || saveResult.localOnly !== true) errors.push('Capture Library save overstates upload or publication.');

const truth = getEonCreatorCaptureTruth();
if (truth.owner !== 'core' || !truth.localOnly || !truth.explicitPermissionRequired || truth.automaticRecording || truth.automaticUpload || truth.automaticPublishing || truth.microphoneDefault !== 'off' || truth.cityRole !== 'adapter-only') errors.push('Creator Capture truth is weaker than I15.');

const core = {
  schema: 'eonapp.a15.i15.core-creator-capture-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I15',
  status: errors.length ? 'fail' : 'pass',
  authority: truth,
  simulation: saveResult.ok ? { sha256: saveResult.sha256, bytes: file.size, contentType: file.type, libraryAssetId: saveResult.asset?.assetId || '', uploaded: false, posted: false } : { error: saveResult.reason || 'save-failed' },
  inheritedDataSurvivalProof: {
    rawMediaBundle: 'tests/unit/a15-i07-data-survival-authority.test.mjs',
    metadataRestore: 'tests/unit/w627f-creator-data-survival.test.mjs',
    deletionAuthority: 'assets/js/create/creator-library-store.js#deleteCreatorAsset'
  },
  sourceFiles: [
    'assets/js/contracts/creator/eon-creator-capture.js',
    'assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js',
    'assets/js/work-surface/adapters/eon-creator-capture-panel.js',
    'assets/js/create/creator-library-store.js',
    'assets/js/data-survival/eon-creator-media-bundle.js',
    'tests/unit/a15-i15-core-creator-capture.test.mjs'
  ],
  claims: { browserRecordingPhysicallyCertified: false, rawMediaUploaded: false, socialPostCompleted: false, previewDeployed: false, productionDeployed: false },
  errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I15] ${receipt.status.toUpperCase()}: Core-owned local Creator Capture, City adapter and digest-verified media lifecycle checked.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I15] ${error}`);
  process.exitCode = 1;
}
