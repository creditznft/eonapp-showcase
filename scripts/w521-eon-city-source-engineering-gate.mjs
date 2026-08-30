#!/usr/bin/env node
/**
 * W521 source gate — City lifecycle ownership, stale-boot cancellation and
 * retired-renderer reachability. It is intentionally source/build only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectLocalImportGraph } from './w519-legacy-transport-quarantine-gate.mjs';
import {
  W521_ACTIVE_CITY_ENTRYPOINTS,
  W521_BUILD_DENYLIST,
  W521_CITY_SOURCE_FILES,
  W521_EON_CITY_SOURCE_ENGINEERING_SCHEMA,
  W521_RETIRED_RENDERER_MARKERS,
  W521_TRUTH,
  validateW521EonCitySourceEngineeringContract
} from '../config/w521-eon-city-source-engineering-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toPosix = (value) => String(value || '').replaceAll('\\', '/');
const relativePath = (root, target) => toPosix(path.relative(root, target));
const exists = (target) => fs.existsSync(target);
const read = (target) => fs.readFileSync(target, 'utf8');

function walkFiles(directory, output = []) {
  if (!exists(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(absolute, output);
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

export function inspectW521EonCitySourceEngineering({
  root = ROOT,
  requireDist = false,
  distDirectory = null,
  extraActiveEntrypoints = []
} = {}) {
  const issues = [...validateW521EonCitySourceEngineeringContract()];
  for (const relative of W521_CITY_SOURCE_FILES) {
    if (!exists(path.join(root, relative))) issues.push(`required-source-missing:${relative}`);
  }

  const station = read(path.join(root, 'assets/js/eon-city-play-station.js'));
  const babylon = read(path.join(root, 'assets/js/city/eon-city-play-babylon.js'));
  const lifecycle = read(path.join(root, 'assets/js/city/eon-city-runtime-lifecycle.js'));
  const performance = read(path.join(root, 'assets/js/city/eon-city-performance-observation.js'));

  if (!/createEonCityRuntimeLifecycle/.test(station) || !/isCurrentBoot/.test(station) || !/attachRuntime\(boot\.token, runtime\)/.test(station)) issues.push('station-lifecycle-binding-missing');
  if (!/ownResource\('babylon-runtime'/.test(lifecycle) || !/stale-runtime-rejected/.test(lifecycle) || !/markContextLoss/.test(lifecycle)) issues.push('lifecycle-owner-incomplete');
  if (!/onContextLoss/.test(babylon) || !/onContextLoss\?\.\(\{ reason: 'webgl-context-lost'/.test(babylon) || !/scene\.dispose\(\)/.test(babylon) || !/engine\.dispose\(\)/.test(babylon)) issues.push('renderer-cleanup-context-loss-incomplete');
  if (!/EON_CITY_PERFORMANCE_OBSERVATION_SCHEMA/.test(performance) || !/remoteTelemetry: false/.test(performance) || !/manualReviewRequired/.test(performance)) issues.push('local-performance-observation-incomplete');

  const activeGraph = collectLocalImportGraph({ root, entrypoints: [...W521_ACTIVE_CITY_ENTRYPOINTS, ...extraActiveEntrypoints] });
  for (const marker of W521_RETIRED_RENDERER_MARKERS) {
    const hits = activeGraph.filter((entry) => entry.includes(marker));
    if (hits.length) issues.push(...hits.map((entry) => `active-import-reaches-retired-renderer:${entry}`));
  }

  const dist = distDirectory
    ? (path.isAbsolute(distDirectory) ? distDirectory : path.join(root, distDirectory))
    : path.join(root, 'dist');
  const builtOutputChecked = exists(dist);
  if (requireDist && !builtOutputChecked) issues.push(`dist-required-but-missing:${relativePath(root, dist)}`);
  if (builtOutputChecked) {
    for (const absolute of walkFiles(dist)) {
      const content = read(absolute);
      for (const marker of W521_BUILD_DENYLIST) {
        if (content.includes(marker)) issues.push(`built-output-reaches-retired-renderer:${relativePath(root, absolute)}:${marker}`);
      }
    }
  }

  return Object.freeze({
    schema: `${W521_EON_CITY_SOURCE_ENGINEERING_SCHEMA}.gate`,
    wave: 'W521',
    sourceOnly: true,
    ok: issues.length === 0,
    activeGraphModuleCount: activeGraph.length,
    builtOutputChecked,
    truth: W521_TRUTH,
    codeOnlyRescore: Object.freeze({ eligibleForIndependentAudit: true, scoreAssigned: false, deviceEvidenceRequired: true }),
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const result = inspectW521EonCitySourceEngineering({ requireDist: process.argv.includes('--require-dist') });
  const target = path.join(ROOT, 'tmp', 'w521-eon-city-source-engineering-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W521 EON City source engineering failed:\n${result.issues.map((entry) => `- ${entry}`).join('\n')}`);
  process.stdout.write(`W521 EON City source engineering passed (${result.activeGraphModuleCount} active City modules; built output ${result.builtOutputChecked ? 'checked' : 'not requested'}). Source proof only.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
