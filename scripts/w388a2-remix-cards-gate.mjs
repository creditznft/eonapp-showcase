#!/usr/bin/env node
/** W388A.2 source gate: Remix Cards stay local, public-safe, and non-financial. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W388A2_REMIX_CARDS_CONTRACT, validateW388A2RemixCardsContract } from '../config/w388a2-remix-cards-contract.mjs';
import { EON_REMIX_CARD_KINDS, getEonRemixCardTruth } from '../assets/js/share/eon-remix-card.js';
import { getEonRemixCardWorkspaceTruth } from '../assets/js/share/eon-remix-card-workspace.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW388A2RemixCards() {
  const engine = read('assets/js/share/eon-remix-card.js');
  const workspaceSurface = read('assets/js/share/eon-remix-card-workspace.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getEonRemixCardTruth();
  const surface = getEonRemixCardWorkspaceTruth();
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(`${engine}\n${workspaceSurface}`);

  check('contract-valid', validateW388A2RemixCardsContract().length === 0, 'W388A.2 contract has no internal violations');
  check('kind-set', JSON.stringify(EON_REMIX_CARD_KINDS.map((entry) => entry.id)) === JSON.stringify(W388A2_REMIX_CARDS_CONTRACT.cardKinds), 'Remix Cards offer the approved starter kinds');
  check('workspace-integrated', /renderEonRemixCardWorkspace/.test(workspace) && /bindEonRemixCardWorkspace/.test(workspace), 'Remix Cards are integrated in canonical Workspace');
  check('copy-export-native-only', /Copy card/.test(workspaceSurface) && /Native share/.test(workspaceSurface) && /Export card/.test(workspaceSurface) && /navigator\?\.share/.test(engine), 'surface provides explicit copy, export and optional native share');
  check('no-hosting-or-transfer', truth.publicHosting === false && truth.privateProjectTransfer === false && truth.fileTransfer === false && truth.collaborationPresence === false && noTransport, 'no public host, private project/file transfer, live collaboration, or transport is introduced');
  check('no-growth-value-claim', truth.tracking === false && truth.referralReward === false && /does not host a card, transfer a project, grant access, create a collaboration room, track remixes, make a referral, or publish anything/i.test(workspaceSurface), 'Remix Cards do not create tracking, referral value, collaboration, publishing, or access claims');
  check('rights-honesty', truth.legalLicenseClaim === false && /not a legal license/i.test(workspaceSurface) && /not a legal license/i.test(engine), 'creator credit remains a courtesy request, not a rights claim');
  check('public-link-safety', /private-network|device-only links/i.test(engine) && /public http\(s\) link/i.test(engine), 'local/private links are rejected');
  check('secret-protection', /SECRET_LIKE/.test(engine) && /Do not include keys/i.test(engine), 'secret-looking inputs are rejected');
  check('session-boundary', surface.pageSessionOnly === true && surface.browserSessionPrefillOnly === true && !/localStorage|indexedDB/i.test(`${engine}\n${workspaceSurface}`), 'generated card stays page-only; short chat handoff is browser-session only');
  return Object.freeze({ schema: 'eonapp.w388a2.remix-cards-gate.v1', wave: W388A2_REMIX_CARDS_CONTRACT.wave, status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'No public Remix Card hosting, recipient identity, automatic attribution, collaboration presence, tracking, referral reward, rights clearance, or publishing proof is enabled in this wave.']) });
}

export function runW388A2RemixCardsGate({ writeArtifact = true } = {}) {
  const result = inspectW388A2RemixCards();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w388a2-remix-cards-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW388A2RemixCardsGate();
  process.stdout.write(`W388A.2 Remix Cards gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
