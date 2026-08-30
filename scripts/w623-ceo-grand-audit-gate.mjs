#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W623_CEO_AUDIT, validateW623CeoAudit } from '../config/w623-ceo-grand-audit-contract.mjs';
import { validateEonMasterProgrammeLedger } from '../config/eon-master-launch-ledger.mjs';
import { EON_CITY_DIRECT_HUD_ACTIONS, validateEonCityGameplayContract } from '../assets/js/city/eon-city-gameplay-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

export function inspectW623CeoGrandAudit({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
  check('audit-contract-valid', validateW623CeoAudit().length === 0, validateW623CeoAudit().join(','));
  check('master-ledger-valid', validateEonMasterProgrammeLedger().length === 0, validateEonMasterProgrammeLedger().join(','));
  const image = read('assets/js/local-ai/comfyui-local-media.js');
  const imageUi = read('assets/js/local-ai/comfyui-image-lab.js');
  check('image-adapter-source-integrated', /discoverComfyUiCapabilities/.test(image) && /generateComfyUiImage/.test(image) && /fetchComfyUiOutputBlob/.test(image), 'discover, generate, history/output path');
  check('compact-device-truthful', /data-comfy-compact-guide/.test(imageUi) && /connected rail pending proof/.test(imageUi), 'no impossible Comfy Desktop controls on compact devices');
  const city = read('assets/js/eon-city-play-station.js');
  const cityRoom = read('assets/js/city/eon-city-command-room.js');
  const cityActionIds = EON_CITY_DIRECT_HUD_ACTIONS.map((action) => action.id);
  const expectedCityActionIds = ['command-room', 'eonbot', 'districts', 'menu'];
  const cityContract = validateEonCityGameplayContract();
  const directHudMarkupPresent = [
    'data-eon-play-open-command-room',
    'data-eon-play-open-eonbot',
    'data-eon-play-open-travel-map',
    'data-eon-play-open-controls'
  ].every((token) => city.includes(token));
  check(
    'city-four-primary-actions',
    cityContract.ok && cityActionIds.length === 4 && cityActionIds.every((id, index) => id === expectedCityActionIds[index]) && directHudMarkupPresent,
    'Command Room, EONBOT, Districts, Menu'
  );
  check('city-review-first-navigation', !/window\.location\.assign/.test(cityRoom) && /<a /.test(cityRoom), 'semantic same-origin links replace imperative route jumps');
  const shell = read('assets/js/shell/eon-shell-navigation.js');
  check('shell-tools-and-vault', /label: 'Tools'/.test(shell) && /label: 'Vault'/.test(shell), 'canonical hierarchy');
  const sw = read('sw.js');
  check('service-worker-release-bumped', /w623-2026-07-11-creator-image-city-safety/.test(sw), 'new release identity');
  const providerGate = read('scripts/r3a1-ai-api-contract-gate.mjs');
  check('provider-gate-reads-runtime-catalog', /import \{ PROVIDERS \}/.test(providerGate) && /provider\.defaultEndpoint !== contract\.baseUrl/.test(providerGate), 'canonical catalog comparison');
  const passed = checks.every((row) => row.pass);
  const report = Object.freeze({ ...W623_CEO_AUDIT, gate: Object.freeze({ status: passed ? 'pass' : 'fail', sourceOnly: true, checks: Object.freeze(checks) }) });
  if (writeArtifact) {
    const target = path.join(ROOT, 'artifacts', 'w623-ceo-grand-audit');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW623CeoGrandAudit({ writeArtifact: true });
  console.log(JSON.stringify({ ok: report.gate.status === 'pass', verdict: report.verdict, checks: report.gate.checks.length, overallLaunchScore: report.scores.find((row) => row.id === 'overall-launch')?.value }, null, 2));
  if (report.gate.status !== 'pass') process.exitCode = 1;
}
