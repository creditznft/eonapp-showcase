import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_PRODUCTIVE_RPG_MISSIONS,
  EON_CITY_PRODUCTIVE_RPG_STATES,
  createEonCityProductiveRpgController,
  getEonCityProductiveRpgPlan,
  recordEonCityProductiveRpgOutcome,
  validateEonCityProductiveRpgPlan
} from '../assets/js/city/eon-city-productive-rpg-loop.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const freeze = (value) => Object.freeze(value);
const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
};

export const W624G_PRODUCTIVE_RPG_CONTRACT = freeze({
  schema: 'eonapp.w624g-productive-rpg-contract.2026-07-11.v1',
  canonicalRoute: '/eoncity',
  missionModule: 'assets/js/city/eon-city-productive-rpg-loop.js',
  stationModule: 'assets/js/eon-city-play-station.js',
  cssModule: 'assets/css/eon-city-play.css',
  missionCount: 6,
  stateCount: 9,
  stablePredeployCommand: 'npm run verify:codex-predeploy',
  finalQualityExpansionAllowed: false,
  browserProofPending: true,
  ownerVisualApprovalPending: true
});

export function validateW624gProductiveRpgContract() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const storage = memoryStorage();
  const plan = getEonCityProductiveRpgPlan({ storage });
  const validation = validateEonCityProductiveRpgPlan(plan);
  const controller = createEonCityProductiveRpgController({ storage, now: () => 1770000000000 });
  const station = read(W624G_PRODUCTIVE_RPG_CONTRACT.stationModule);
  const moduleSource = read(W624G_PRODUCTIVE_RPG_CONTRACT.missionModule);
  const css = read(W624G_PRODUCTIVE_RPG_CONTRACT.cssModule);
  const projects = read('assets/js/projects/eon-projects-page.js');
  const localAi = read('assets/js/local-ai/local-ai-page.js');
  const vault = read('assets/js/vault/eon-vault-page.js');
  const create = read('assets/js/create/eon-create-hub.js');
  const automations = read('assets/js/eon-automations-page.js');
  const capsule = read('assets/js/local-first/eon-workspace-capsule-page.js');
  const owner = read('assets/js/city/eon-city-runtime-owner.js');
  const compatibility = ['eoncity-play.html', 'eoncity-3d.html', 'eoncity-lite.html'].map(read).join('\n');

  add('plan-valid', validation.ok, validation.errors.join(', ') || 'six-family plan valid');
  add('six-mission-families', EON_CITY_PRODUCTIVE_RPG_MISSIONS.length === 6 && new Set(EON_CITY_PRODUCTIVE_RPG_MISSIONS.map((entry) => entry.id)).size === 6, EON_CITY_PRODUCTIVE_RPG_MISSIONS.map((entry) => entry.id).join(', '));
  add('nine-honest-states', EON_CITY_PRODUCTIVE_RPG_STATES.length === 9 && new Set(EON_CITY_PRODUCTIVE_RPG_STATES).size === 9, EON_CITY_PRODUCTIVE_RPG_STATES.join(', '));
  add('required-family-order', JSON.stringify(EON_CITY_PRODUCTIVE_RPG_MISSIONS.map((entry) => entry.id)) === JSON.stringify(['orientation', 'project', 'local-ai-byok', 'creator', 'automation', 'vault-recovery']), 'orientation → project → AI → creator → automation → recovery');
  add('canonical-outcome-routes', EON_CITY_PRODUCTIVE_RPG_MISSIONS.every((entry) => ['/eoncity', '/projects', '/local-ai', '/create', '/automations', '/capsule'].includes(entry.route)), 'all primary routes are current surfaces');
  add('review-first-no-auto-navigation', plan.missions.every((entry) => entry.requiresVisibleReview && !entry.autoNavigation && !entry.automaticExecution), 'every mission requires visible review and explicit route choice');
  add('privacy-boundaries-present', plan.missions.every((entry) => entry.privacyBoundary && entry.requiredAction && !entry.privateDataRead), 'all missions name required action and privacy boundary');
  add('no-financial-or-eonkey-rewards', plan.missions.every((entry) => entry.reward === null && entry.economyReward === null && entry.eonkeyReward === null) && !plan.economyEnabled && !plan.rewardIssued, 'no money, token, discount or EONKEY reward');

  const noReview = controller.start('project', { explicitUserAction: true });
  add('start-requires-review', noReview.reason === 'visible-review-required', noReview.reason);
  controller.review('project', { explicitUserAction: true });
  const started = controller.start('project', { explicitUserAction: true });
  add('review-then-start', started.ok && ['active', 'resumed'].includes(started.mission.state), started.mission?.state || started.reason);
  const cancelled = controller.cancel('project', { explicitUserAction: true });
  const resumed = controller.resume('project', { explicitUserAction: true });
  add('cancel-and-resume', cancelled.ok && cancelled.mission.state === 'cancelled' && resumed.ok && resumed.mission.state === 'resumed', `${cancelled.mission?.state} → ${resumed.mission?.state}`);
  const failed = controller.fail('creator', 'outcome-not-proven', { explicitUserAction: true });
  add('failed-state-honest', failed.ok && failed.mission.state === 'failed' && failed.mission.failureCode === 'outcome-not-proven', failed.mission?.failureCode || failed.reason);
  const invalid = recordEonCityProductiveRpgOutcome({ kind: 'creator-guide-artifact', route: '/create', source: 'wrong-source', receiptId: 'bad', verified: true }, { storage });
  add('invalid-receipt-cannot-complete', !invalid.ok && controller.refresh().missions.find((entry) => entry.id === 'creator').state !== 'completed', invalid.reason);
  controller.review('orientation', { explicitUserAction: true });
  const orientation = controller.completeOrientation({ explicitUserAction: true, controlsReviewed: true });
  add('orientation-local-receipt', orientation.ok && controller.refresh().missions.find((entry) => entry.id === 'orientation').state === 'completed', orientation.reason || 'verified local orientation');
  const projectOutcome = recordEonCityProductiveRpgOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project-shell:proof', verified: true }, { storage });
  add('real-outcome-completion', projectOutcome.ok && controller.refresh().missions.find((entry) => entry.id === 'project').outcome?.verified, projectOutcome.outcome?.kind || projectOutcome.reason);
  add('only-bounded-storage', !/\b(projectTitle|promptText|providerKey|passphrase|fileContent|walletAddress|emailAddress|userName)\s*:/.test(moduleSource), 'mission store contains no private-work fields');
  add('no-network-or-commercial-execution', !/fetch\s*\(|XMLHttpRequest|new\s+WebSocket|location\.(?:assign|replace)|checkoutSession|billingMutation|referralMutation/.test(moduleSource), 'mission module cannot call networks or mutate commerce');

  add('projects-write-real-receipts', /project-shell/.test(projects) && /project-resume/.test(projects) && /recordEonCoreOutcome/.test(projects), 'create/open project actions write bounded receipts');
  add('local-ai-writes-after-pass', /if \(result\.ok\) recordEonCoreOutcome/.test(localAi) && /local-ai-self-test/.test(localAi), 'only a passed self-test records completion');
  add('byok-writes-after-verification', /byok-provider-verification/.test(vault) && /health\.model/.test(vault), 'verified direct provider rail writes bounded receipt');
  add('creator-saves-review-artifact', /CREATE_REVIEW_GUIDE_KEY/.test(create) && /proposal-only/.test(create) && /generationClaimed: false/.test(create), 'image/video guide is a real local proposal artifact');
  add('automation-writes-draft-receipt', /automation-proposal/.test(automations) && /workflow-draft-created/.test(automations), 'real local workflow drafts write receipts');
  add('capsule-writes-backup-recovery-receipts', /backup-readiness-receipt/.test(capsule) && /recovery-restore-receipt/.test(capsule), 'real encrypted backup/restore actions write receipts');

  add('station-binds-mission-loop', /eon-city-productive-rpg-loop\.js/.test(station) && /bindProductiveRpgLoop/.test(station) && /w624g-productive-rpg-loop/.test(station), 'City station owns and disposes mission UI');
  add('visible-mission-controls', /data-eon-play-rpg-toggle/.test(station) && /data-eon-play-rpg-review/.test(station) && /data-eon-play-rpg-refresh/.test(station) && /data-eon-play-rpg-cancel/.test(station), 'review, refresh, cancel and stay controls are visible');
  add('route-choice-is-second-action', /No completion is claimed until a bounded receipt/.test(station) && /data-eon-play-rpg-route/.test(station), 'route links appear only after mission review');
  add('accessible-reduced-motion-ui', /aria-live="polite"/.test(station) && /eon-play-productive-rpg/.test(css) && /prefers-reduced-motion:reduce/.test(css), 'captions, keyboard buttons and reduced-motion CSS present');
  add('w624f-npcs-preserved', /bindCommandDistrictNpcSystem/.test(station) && /data-eon-play-npc-toggle/.test(station), 'four-guide system remains separate');
  add('w624e-orbit-preserved', /bindEonbotOrbitCompanion/.test(station), 'Orbit remains available');
  add('single-runtime-owner-preserved', /mountEonCityPlayStation/.test(owner) && !/eon-city-play-station\.js/.test(compatibility), 'W624B owner and compatibility retirement preserved');
  add('no-visual-or-device-claim', !W624G_PRODUCTIVE_RPG_CONTRACT.finalQualityExpansionAllowed && W624G_PRODUCTIVE_RPG_CONTRACT.browserProofPending && W624G_PRODUCTIVE_RPG_CONTRACT.ownerVisualApprovalPending, 'source does not certify runtime visuals or devices');

  return freeze({ schema: W624G_PRODUCTIVE_RPG_CONTRACT.schema, ok: checks.every((entry) => entry.pass), checks: freeze(checks), passed: checks.filter((entry) => entry.pass).length, total: checks.length });
}
