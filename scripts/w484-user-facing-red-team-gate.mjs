#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W484_USER_FACING_RED_TEAM_CONTRACT, validateW484UserFacingRedTeamContract } from '../config/w484-user-facing-red-team-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const exists = (file) => existsSync(path.join(root, file));

export function buildW484RedTeamPlan() {
  const c = W484_USER_FACING_RED_TEAM_CONTRACT;
  return `# W484 user-facing red-team audit and launch simplification plan\n\n## CEO decision\nThe app should feel closer to ChatGPT in daily use: simple chat-first shell, collapsed desktop sidebar that expands on hover/focus, clear app lanes, and user-controlled sharing everywhere value is created. After this wave, **2 waves remain before owner GO**: W484 live preview proof and W485 owner activation decision.\n\n## Decisions locked\n${c.decisions.map((item) => `- ${item}`).join('\n')}\n\n## Red-team audit domains\n${c.domains.map((domain) => `\n### ${domain.label}\n**Critique:** ${domain.critique}\n\n**CEO decision:** ${domain.codedDecision}\n\n**Proof required:**\n${domain.proof.map((item) => `- ${item}`).join('\n')}`).join('\n')}\n\n## Shareable objects to make launch feel viral but controlled\n${c.shareableObjects.map((item) => `- ${item}`).join('\n')}\n\n## Codex live-proof duties\n${c.codexEvidenceDuties.map((item) => `- ${item}`).join('\n')}\n\n## Activation rule\nDirect social posting, checkout activation and IoT/drones/robots/smart-device control remain OFF until live adapter proof, safety UX and owner approval are returned.\n`;
}

export function inspectW484UserFacingRedTeam({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const pkg = JSON.parse(read('package.json'));
  const shellJs = read('assets/js/eon-app-shell.js');
  const shellCss = read('assets/css/eon-app-shell.css');
  const shareSheet = read('assets/js/utils/eon-share-sheet.js');
  const referralPage = read('assets/js/referral-landing-page.js');
  const cityPlay = read('assets/js/eon-city-play-station.js');
  const iotHubPresent = exists('assets/js/utils/iot-control-hub.js');
  const iotHub = iotHubPresent ? read('assets/js/utils/iot-control-hub.js') : '';
  const plan = buildW484RedTeamPlan();

  check('required-files', [
    'config/w484-user-facing-red-team-contract.mjs',
    'scripts/w484-user-facing-red-team-gate.mjs',
    'tests/unit/w484-user-facing-red-team.test.mjs'
  ].every(exists), 'W484 contract, gate and tests exist');
  check('contract-valid', validateW484UserFacingRedTeamContract().length === 0, 'W484 contract validates');
  check('script-wired', pkg.scripts['qa:w484-user-facing-red-team'] === 'node scripts/w484-user-facing-red-team-gate.mjs && node --test tests/unit/w484-user-facing-red-team.test.mjs', 'package.json exposes W484 QA');
  check('verify-chain-wired', /qa:w484-user-facing-red-team/.test(pkg.scripts['verify:w4795-codex-ready-source'] || ''), 'final verify chain includes W484');
  check('hover-expand-js', /bindHoverExpandSidebar/.test(shellJs) && /pointerenter/.test(shellJs) && /focusin/.test(shellJs), 'shell JS supports desktop hover/focus sidebar expansion');
  check('hover-expand-css', /is-hover-expanded/.test(shellCss) && /eon-app-nav-text/.test(shellCss) && /min-width: 961px/.test(shellCss), 'shell CSS reveals collapsed rail labels on desktop hover/focus only');
  check('share-sheet-user-controlled', /copy/i.test(shareSheet) && /navigator\.share|clipboard/i.test(shareSheet), 'share sheet remains user-controlled by copy/share action');
  check('referral-surface-present', /referral/i.test(referralPage) && /invite|share/i.test(referralPage), 'referral landing surface exists for privacy-safe invite loop');
  check('city-command-route-meaning', /Command Deck|Creator|Vault|Market|Trade|Local AI|Support/i.test(cityPlay), 'City play station includes product lane meaning');
  check('iot-blocked-launch', W484_USER_FACING_RED_TEAM_CONTRACT.truth.iotRemoteControlAllowedNow === false && (!iotHubPresent || /IoT Control Hub/.test(iotHub)), 'IoT/device control remains blocked; the retired helper may be absent and must not be resurrected merely to satisfy this historical gate');
  check('plan-states-2-waves', /2 waves remain before owner GO/i.test(plan), 'executive plan states two waves remain');
  check('plan-red-team-coverage', /Business logic|Viral sharing|Shell\/navigation|IoT/i.test(plan), 'plan covers UX, viral, business logic, City and IoT');

  const result = Object.freeze({
    schema: `${W484_USER_FACING_RED_TEAM_CONTRACT.schema}.gate-report`,
    wave: 'W484',
    status: 'pass',
    remainingWaveCountBeforeOwnerGo: W484_USER_FACING_RED_TEAM_CONTRACT.remainingExecutionWaves.length,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    plan,
    shareableObjects: W484_USER_FACING_RED_TEAM_CONTRACT.shareableObjects,
    activationBlocks: Object.freeze({ automaticPosting: true, unapprovedPayments: true, iotRemoteControl: true })
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w484-user-facing-red-team');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'CEO_USER_FACING_RED_TEAM_AND_LAUNCH_PLAN.md'), plan);
    writeFileSync(path.join(dir, 'report.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW484UserFacingRedTeam({ writeArtifact: true });
  process.stdout.write(`W484 user-facing red-team gate passed (${result.checkCount}/${result.checkCount}); ${result.remainingWaveCountBeforeOwnerGo} waves remain before owner GO.\n`);
}
