#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_W715_BUDGETS,
  buildEonAppW715PerformancePlan,
  getEonAppW715PerformanceAssetTruth,
  validateEonAppW715PerformancePlan
} from '../assets/js/runtime/w715/eonapp-w715-performance-asset-engineering.js';
import { validateEonCityRuntimeAssetManifest } from '../assets/js/city/eon-city-runtime-asset-manifest.js';
import { validateW635PerformanceCacheUpdateSafetyContract } from '../config/w635-performance-cache-update-safety-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const binaryExtensions = new Set(['.glb', '.gltf', '.bin', '.png', '.webp', '.ktx2', '.ogg', '.mp3']);
const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inventory = (base) => fs.readdirSync(base, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && binaryExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => {
    const full = path.join(entry.parentPath || entry.path, entry.name);
    return { relative: path.relative(base, full).replaceAll('\\', '/'), full, bytes: fs.statSync(full).size, sha256: digest(full) };
  });
const sourceRoot = path.join(root, 'assets/city/w649');
const publicRoot = path.join(root, 'public/assets/city/w649');
const source = inventory(sourceRoot);
const publicFiles = inventory(publicRoot);
const publicByRelative = new Map(publicFiles.map((entry) => [entry.relative, entry]));
const publicDigestCounts = new Map();
for (const entry of publicFiles) publicDigestCounts.set(entry.sha256, (publicDigestCounts.get(entry.sha256) || 0) + 1);
const mirrorExact = source.length === publicFiles.length && source.every((entry) => publicByRelative.get(entry.relative)?.sha256 === entry.sha256);
const maxAssetBytes = Math.max(...publicFiles.map((entry) => entry.bytes));
const profiles = ['low', 'balanced', 'high'].map((quality) => buildEonAppW715PerformancePlan({ quality }));
const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
const truth = getEonAppW715PerformanceAssetTruth();
const checks = [
  ['three-safe-quality-profiles', profiles.every((plan) => validateEonAppW715PerformancePlan(plan).ok) && profiles.map((plan) => plan.cityQuality).join(',') === 'lite,balanced,cinematic'],
  ['per-asset-budget', maxAssetBytes <= EONAPP_W715_BUDGETS.perBinaryAssetBytesMax],
  ['canonical-mirror-byte-parity', source.length === 76 && mirrorExact],
  ['no-duplicate-binary-in-build', [...publicDigestCounts.values()].every((count) => count === 1)],
  ['runtime-manifest-bounded', validateEonCityRuntimeAssetManifest().ok && profiles.every((plan) => !plan.runtime.preloadAll && !plan.runtime.remoteAssetDependency)],
  ['cache-update-explicit', validateW635PerformanceCacheUpdateSafetyContract().ok && /EONAPP_APPLY_UPDATE/.test(sw) && /explicitUserAction === true/.test(sw) && /eonapp-city-assets-v1/.test(sw)],
  ['measurement-truth', profiles.every((plan) => plan.observation.localOnly && plan.observation.memoryOnly && !plan.observation.automaticCertification && plan.observation.manualReviewRequired)],
  ['truth-boundaries', truth.buildShipsOneBinaryCopy && truth.realDeviceProofRequired && truth.browserProofRequired && !truth.automaticCertification && !truth.performsNetworkRequest && !truth.mutatesCache]
];
for (const [id, pass] of checks) console.log(`[W715] ${pass ? 'PASS' : 'FAIL'} ${id}`);
console.log(`[W715] INFO source/public binaries ${source.length}/${publicFiles.length}; max asset ${maxAssetBytes} bytes`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W715] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
