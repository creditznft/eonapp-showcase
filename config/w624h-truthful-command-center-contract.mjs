import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES,
  EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES,
  createEonCityTruthfulCommandCenterController,
  getEonCityTruthfulCommandCenterSnapshot,
  loadEonCityTruthfulCommandCenterSnapshot,
  validateEonCityTruthfulCommandCenterSnapshot
} from '../assets/js/city/eon-city-truthful-command-center.js';
import { EON_PROJECTS_STORAGE_KEY } from '../assets/js/utils/eon-workspace-store.js';
import { EONBOT_JOB_FABRIC_STORAGE_KEY } from '../assets/js/chat/eonbot-job-fabric.js';
import { EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY } from '../assets/js/city/eon-city-productive-rpg-loop.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const freeze = (value) => Object.freeze(value);
const memoryStorage = (seed = {}) => {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
  return { getItem: (key) => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
};

export const W624H_TRUTHFUL_COMMAND_CENTER_CONTRACT = freeze({
  schema: 'eonapp.w624h-truthful-command-center-contract.2026-07-11.v1',
  canonicalRoute: '/eoncity',
  statusModule: 'assets/js/city/eon-city-truthful-command-center.js',
  stationModule: 'assets/js/eon-city-play-station.js',
  cssModule: 'assets/css/eon-city-play.css',
  familyCount: 6,
  stateCount: 7,
  stablePredeployCommand: 'npm run verify:codex-predeploy',
  browserProofPending: true,
  ownerVisualApprovalPending: true
});

export async function validateW624hTruthfulCommandCenterContract() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const now = 1_770_000_000_000;
  const storage = memoryStorage({
    [EON_PROJECTS_STORAGE_KEY]: { updatedAt: now - 10_000, projects: [{ id: 'p1', name: 'PRIVATE PROJECT NAME', content: 'PRIVATE CONTENT', updatedAt: now - 10_000 }] },
    [EONBOT_JOB_FABRIC_STORAGE_KEY]: { updatedAt: now - 20_000, jobs: [{ id: 'j1', state: 'ready-for-review', label: 'PRIVATE JOB LABEL', prompt: 'PRIVATE PROMPT', updatedAt: now - 20_000 }] },
    [EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY]: { missions: {
      'local-ai-byok': { outcome: { verified: true, kind: 'local-ai-self-test', verifiedAt: now - 30_000, prompt: 'PRIVATE PROMPT' } },
      'vault-recovery': { outcome: { verified: true, kind: 'backup-readiness-receipt', verifiedAt: now - 40_000, passphrase: 'PRIVATE' } }
    } }
  });
  const snapshot = getEonCityTruthfulCommandCenterSnapshot({ storage, now });
  const validation = validateEonCityTruthfulCommandCenterSnapshot(snapshot);
  const station = read(W624H_TRUTHFUL_COMMAND_CENTER_CONTRACT.stationModule);
  const moduleSource = read(W624H_TRUTHFUL_COMMAND_CENTER_CONTRACT.statusModule);
  const css = read(W624H_TRUTHFUL_COMMAND_CENTER_CONTRACT.cssModule);
  const owner = read('assets/js/city/eon-city-runtime-owner.js');
  const compatibility = ['eoncity-play.html', 'eoncity-3d.html', 'eoncity-lite.html'].map(read).join('\n');

  add('snapshot-valid', validation.ok, validation.errors.join(', ') || 'truthful snapshot valid');
  add('six-status-families', EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES.length === 6 && new Set(EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES.map((entry) => entry.id)).size === 6, EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES.map((entry) => entry.id).join(', '));
  add('required-family-order', JSON.stringify(EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES.map((entry) => entry.id)) === JSON.stringify(['projects', 'ai-runtime', 'jobs', 'billing', 'backup', 'outcomes']), 'projects → AI → jobs → billing → backup → outcomes');
  add('seven-honest-states', EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES.length === 7 && new Set(EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES).size === 7, EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES.join(', '));
  add('traceability-on-every-card', snapshot.cards.every((entry) => entry.source && entry.authority && entry.observedAt && entry.freshness?.label), 'source, authority, observed time and freshness present');
  add('read-only-boundary', snapshot.cards.every((entry) => !entry.readsPrivateWork && !entry.mutationAllowed && !entry.autoNavigation) && !snapshot.readsPrivateWork && !snapshot.mutationAllowed && !snapshot.autoNavigation, 'no private work, mutation or auto-navigation');
  add('bounded-project-count', snapshot.cards.find((entry) => entry.id === 'projects')?.count === 1 && !JSON.stringify(snapshot).includes('PRIVATE PROJECT NAME'), 'project count retained; project name absent');
  add('bounded-job-count', snapshot.cards.find((entry) => entry.id === 'jobs')?.count === 1 && !JSON.stringify(snapshot).includes('PRIVATE JOB LABEL') && !JSON.stringify(snapshot).includes('PRIVATE PROMPT'), 'job count/state retained; label and prompt absent');
  add('bounded-ai-receipt', snapshot.cards.find((entry) => entry.id === 'ai-runtime')?.state === 'current' && !JSON.stringify(snapshot).includes('PRIVATE PROMPT'), 'verified receipt only');
  add('bounded-backup-receipt', snapshot.cards.find((entry) => entry.id === 'backup')?.state === 'current' && !JSON.stringify(snapshot).includes('PRIVATE'), 'backup receipt only');
  add('billing-starts-loading', snapshot.cards.find((entry) => entry.id === 'billing')?.state === 'loading', 'explicit server refresh required');

  const signedOut = await loadEonCityTruthfulCommandCenterSnapshot({ storage, now: () => now, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, account: { signedIn: false, entitlement: null } }) }) });
  add('billing-server-authoritative-empty', signedOut.cards.find((entry) => entry.id === 'billing')?.state === 'empty' && /Signed out/.test(signedOut.cards.find((entry) => entry.id === 'billing')?.summary || ''), 'server reports signed-out empty entitlement');
  const paid = await loadEonCityTruthfulCommandCenterSnapshot({ storage, now: () => now, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, account: { signedIn: true, accountId: 'PRIVATE-ID', entitlement: { tier_id: 'studio', status: 'active', updated_at: new Date(now - 1000).toISOString(), payment_record: 'PRIVATE' } } }) }) });
  const paidBilling = paid.cards.find((entry) => entry.id === 'billing');
  add('billing-server-authoritative-current', paidBilling?.state === 'current' && /studio/.test(paidBilling?.summary || ''), paidBilling?.summary || 'missing');
  add('billing-private-identifiers-absent', !JSON.stringify(paid).includes('PRIVATE-ID') && !JSON.stringify(paid).includes('payment_record'), 'account/payment identifiers excluded');
  const offline = await loadEonCityTruthfulCommandCenterSnapshot({ storage, now: () => now, fetchImpl: async () => { throw new TypeError('offline'); } });
  add('billing-offline-truth', offline.cards.find((entry) => entry.id === 'billing')?.state === 'offline', 'offline is explicit and grants nothing');
  const malformed = await loadEonCityTruthfulCommandCenterSnapshot({ storage, now: () => now, fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ ok: false }) }) });
  add('billing-error-truth', malformed.cards.find((entry) => entry.id === 'billing')?.state === 'error', 'invalid server response is error');

  const controller = createEonCityTruthfulCommandCenterController({ storage, now: () => now, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, account: { signedIn: false, entitlement: null } }) }) });
  add('review-requires-explicit-action', controller.review('projects').reason === 'explicit-valid-review-required', 'review cannot be implicit');
  const reviewed = controller.review('projects', { explicitUserAction: true });
  add('explicit-review-selects-one-card', reviewed.ok && reviewed.snapshot.selectedId === 'projects', reviewed.snapshot.selectedId || reviewed.reason);
  const refusedRefresh = await controller.refresh();
  add('refresh-requires-explicit-action', refusedRefresh.reason === 'explicit-refresh-required', refusedRefresh.reason);
  const refreshed = await controller.refresh({ explicitUserAction: true });
  add('explicit-refresh-loads-server-status', refreshed.ok && refreshed.snapshot.cards.find((entry) => entry.id === 'billing')?.state === 'empty', 'billing refreshed from server');
  controller.dispose();

  add('no-private-field-projection', !/entry\?\.(?:name|title|prompt|content|file|passphrase)|projectsRaw\?\.(?:name|title|content)|jobsRaw\?\.(?:label|prompt|output)|account\?\.accountId|payment_record/.test(moduleSource), 'module never projects private-work fields');
  add('only-one-network-read', (moduleSource.match(/fetchImpl\('/g) || []).length === 1 && /\/api\/billing\/status/.test(moduleSource), 'single same-origin billing read only');
  add('no-state-or-commerce-mutation', !/setItem\s*\(|removeItem\s*\(|checkout|purchase|grantReward|referralMutation|billingMutation|location\.(?:assign|replace)/.test(moduleSource), 'status module cannot mutate work or commerce');
  add('station-binds-read-only-center', /eon-city-truthful-command-center\.js/.test(station) && /bindTruthfulCommandCenter/.test(station) && /w624h-truthful-command-center/.test(station), 'City lifecycle owns Truthful Command Center');
  add('visible-refresh-and-review-controls', /data-eon-truth-refresh/.test(station) && /data-eon-truth-review-button/.test(station) && /data-eon-truth-review/.test(station), 'refresh and review controls visible');
  add('route-is-second-action', /data-eon-truth-route/.test(station) && /separate review step/.test(station), 'native route appears only in reviewed detail');
  add('source-authority-freshness-visible', /<dt>Source<\/dt>/.test(station) && /<dt>Authority<\/dt>/.test(station) && /<dt>Observed<\/dt>/.test(station) && /<dt>Freshness<\/dt>/.test(station), 'traceability rendered on cards');
  add('accessible-status-ui', /aria-live=\\?"polite\\?"/.test(station) && /eon-command-room-truth/.test(css) && /prefers-reduced-motion:reduce/.test(css), 'live regions, keyboard controls and reduced-motion CSS');
  add('w624g-loop-preserved', /bindProductiveRpgLoop/.test(station) && /w624g-productive-rpg-loop/.test(station), 'productive mission loop preserved');
  add('w624f-npcs-preserved', /bindCommandDistrictNpcSystem/.test(station), 'bounded NPCs preserved');
  add('w624e-orbit-preserved', /bindEonbotOrbitCompanion/.test(station), 'Orbit preserved');
  add('single-runtime-owner-preserved', /mountEonCityPlayStation/.test(owner) && !/eon-city-play-station\.js/.test(compatibility), 'single W624B owner and retired compatibility routes preserved');
  add('no-browser-or-owner-approval-claim', W624H_TRUTHFUL_COMMAND_CENTER_CONTRACT.browserProofPending && W624H_TRUTHFUL_COMMAND_CENTER_CONTRACT.ownerVisualApprovalPending, 'runtime evidence remains pending');

  return freeze({ schema: W624H_TRUTHFUL_COMMAND_CENTER_CONTRACT.schema, ok: checks.every((entry) => entry.pass), checks: freeze(checks), passed: checks.filter((entry) => entry.pass).length, total: checks.length });
}
