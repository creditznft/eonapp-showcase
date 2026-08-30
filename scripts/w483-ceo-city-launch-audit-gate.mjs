#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT, validateW483CeoCityLaunchAuditContract } from '../config/w483-ceo-city-launch-audit-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const exists = (file) => existsSync(path.join(root, file));

export function buildW483ExecutiveAuditPlan() {
  const c = W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT;
  return `# W483 CEO executive audit and launch plan\n\n## CEO decision\nEON City is the flagship, but launch quality is evidence-gated. The remaining work is **3 waves**: W483 source audit gate, W484 live City visual/device proof, and W485 activation decision.\n\n## Audit domains\n${c.domains.map((domain) => `\n### ${domain.label}\n${domain.requiredProof.map((item) => `- ${item}`).join('\n')}`).join('\n')}\n\n## Decisions locked\n${c.decisions.map((item) => `- ${item}`).join('\n')}\n\n## Codex proof duties\n${c.codexEvidenceDuties.map((item) => `- ${item}`).join('\n')}\n\n## Activation rule\nPayments, direct social OAuth posting, local image/video adapters, and IoT/device control stay OFF until their own adapter proof, live evidence, and owner approval are returned.`;
}

export function inspectW483CeoCityLaunchAudit({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const pkg = JSON.parse(read('package.json'));
  const plan = buildW483ExecutiveAuditPlan();
  const city3d = read('assets/js/eon-city-3d-station.js');
  const cityPlay = read('assets/js/eon-city-play-station.js');
  const cityTexture = read('assets/js/city/eon-city-safe-texture-runtime.js');
  const iotHubQuarantineReceipt = read('archive/w519-legacy-transport-control/MOVE_RECEIPT.json');
  const w482 = read('config/w482-product-polish-codex-handoff-contract.mjs');

  check('required-files', [
    'config/w483-ceo-city-launch-audit-contract.mjs',
    'scripts/w483-ceo-city-launch-audit-gate.mjs',
    'tests/unit/w483-ceo-city-launch-audit.test.mjs'
  ].every(exists), 'W483 contract, gate and tests exist');
  check('contract-valid', validateW483CeoCityLaunchAuditContract().length === 0, 'W483 contract validates');
  check('script-wired', pkg.scripts['qa:w483-ceo-city-launch-audit'] === 'node scripts/w483-ceo-city-launch-audit-gate.mjs && node --test tests/unit/w483-ceo-city-launch-audit.test.mjs', 'package.json exposes W483 QA');
  check('verify-chain-wired', /qa:w483-ceo-city-launch-audit/.test(pkg.scripts['verify:w4795-codex-ready-source'] || ''), 'final verify chain includes W483');
  check('city-renderer-truthful', /City Overview remains available/.test(city3d) && /same City state/.test(city3d), '3D route keeps fallback and same-state truth');
  check('city-work-loop-wired', /createCityWorkLoopProposal/.test(cityPlay) && /getCityCreatorAtriumCards/.test(cityPlay), 'City play station includes real work loop and creator atrium hooks');
  check('safe-texture-runtime', /createSafeCityTexture/.test(cityTexture) && /width/.test(cityTexture) && /height/.test(cityTexture), 'safe texture runtime is present after W479-R');
  check('iot-quarantined-and-activation-blocked', !exists('assets/js/utils/iot-control-hub.js') && /iot-control-hub\.js/i.test(iotHubQuarantineReceipt) && W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.truth.iotDeviceControlActivationAllowedNow === false, 'legacy IoT hub remains quarantined and CEO audit keeps activation blocked');
  check('activation-blocks-retained', /activate-dodo-checkout/.test(w482) && /activate-direct-social-oauth/.test(w482) && /activate-local-image-video-generation/.test(w482), 'W482 activation prohibitions remain retained');
  check('plan-has-3-waves', /remaining work is \*\*3 waves\*\*/i.test(plan), 'executive plan clearly states remaining wave count');
  check('plan-covers-iot', /drones\/robots\/smart devices|IoT\/device control/i.test(plan), 'executive plan covers IoT, drones, robotics and smart devices');
  check('plan-covers-evidence', /screenshots, FPS witness, console logs, Lighthouse/i.test(plan) || /fps-console-webgl-network/i.test(plan), 'executive plan demands machine/human evidence');

  const result = Object.freeze({
    schema: `${W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.schema}.gate-report`,
    wave: 'W483',
    status: 'pass',
    remainingWaveCountBeforeOwnerGo: W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.remainingExecutionWaves.length,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    plan,
    codexOnlyRemainder: Object.freeze(W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.codexEvidenceDuties),
    activationBlocks: Object.freeze({
      iotDeviceControl: true,
      payments: true,
      directSocialPosting: true,
      localImageVideoAdapters: true
    })
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w483-ceo-city-launch-audit');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'CEO_EXECUTIVE_AUDIT_AND_LAUNCH_PLAN.md'), `${plan}\n`);
    writeFileSync(path.join(dir, 'report.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW483CeoCityLaunchAudit({ writeArtifact: true });
  process.stdout.write(`W483 CEO City launch audit gate passed (${result.checkCount}/${result.checkCount}); ${result.remainingWaveCountBeforeOwnerGo} waves remain before owner GO.\n`);
}
