#!/usr/bin/env node
/** W479-P0 static gate: universal manual-first sharing stays local and user-triggered. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_UNIVERSAL_POST_DESTINATIONS, createEonSharePack, getEonSharePackTruth } from '../assets/js/share/eon-share-pack.js';
import { getEonSharePackWorkspaceTruth } from '../assets/js/share/eon-share-pack-workspace.js';
import { W479P_BLOCKED_PACK_FIELDS, W479P_REQUIRED_DESTINATIONS, W479P_TRUTH, validateW479PUniversalManualPostContract } from '../config/w479p-universal-manual-post-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW479PUniversalManualPost({ writeArtifact = true } = {}) {
  const engine = read('assets/js/share/eon-share-pack.js');
  const workspace = read('assets/js/share/eon-share-pack-workspace.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getEonSharePackTruth();
  const surface = getEonSharePackWorkspaceTruth();
  const pack = createEonSharePack({ title: 'Universal post kit', destination: 'tiktok', goal: 'Prepare a creator-ready local handoff.' });
  const packSerialized = JSON.stringify(pack);
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(`${engine}\n${workspace}`);

  check('contract-valid', validateW479PUniversalManualPostContract().length === 0, 'W479-P0 contract has no internal violations');
  check('universal-destination-set', JSON.stringify(EON_UNIVERSAL_POST_DESTINATIONS.map((item) => item.id)) === JSON.stringify(W479P_REQUIRED_DESTINATIONS), 'post kit exposes the approved universal destination catalogue');
  check('app-agnostic-route', pack.destination.id === 'tiktok' && EON_UNIVERSAL_POST_DESTINATIONS.some((item) => item.id === 'any-app'), 'a selected destination is a local label and Any app remains available');
  check('explicit-native-click', /options\.userGesture !== true/.test(engine) && /userGesture: true/.test(workspace), 'native sharing needs an explicit user click');
  check('local-transient-file-only', /shareableMediaFile/.test(engine) && /fileKeptLocal: true/.test(engine) && /type="file"/.test(workspace), 'a selected image/video is only considered for the one explicit device-share attempt');
  check('no-saved-media-or-credentials', W479P_BLOCKED_PACK_FIELDS.every((field) => !Object.prototype.hasOwnProperty.call(pack, field)) && !/localStorage|indexedDB/i.test(`${engine}\n${workspace}`), 'saved packs never contain media bodies, credentials or hidden persistence');
  check('no-host-or-proxy-or-post', truth.hostedMedia === false && truth.directPublishing === false && truth.oauthConnections === false && truth.storedPlatformTokens === false && truth.tracking === false && noTransport, 'no hosting, proxying, OAuth, direct posting, tracking or network transport is added');
  check('manual-fallback-visible', /Copy post text/.test(workspace) && /Download post kit/.test(workspace) && /upload manually/i.test(workspace), 'copy/download/manual-upload fallback is visible');
  check('no-automatic-public-link', /A link is optional and never generated automatically/.test(workspace) && W479P_TRUTH.automaticPublicLinkLive === false, 'the product does not create referral or public links automatically');
  check('pack-text-boundary', !/\"(?:file|blob|dataUrl|base64|bytes|binary|buffer|mediaBody|accessToken|refreshToken|token|apiKey|secret|password|remotePostId|connectorJobId|scheduleAt|trackingPixel|referralCode)\"/i.test(packSerialized) && /No direct publishing/.test(engine), 'exported post kit stays metadata/text only and contains no remote-post state');
  check('truth-aligned', surface.transientSelectedFileOnly === true && surface.externalPostingProof === false && W479P_TRUTH.postingReceiptLive === false, 'source truth does not mistake a share sheet for a post receipt');

  const report = Object.freeze({
    schema: 'eonapp.w479p.universal-manual-post-gate.v1',
    status: 'pass',
    checkCount: checks.length,
    truth: W479P_TRUTH,
    checks,
    limitations: Object.freeze([
      'Static/source proof only.',
      'A browser/device share sheet is not proof that a platform posted, accepted, viewed or distributed content.',
      'Platform-specific direct publishing remains a separate W481 connector programme with official approval and real-account evidence.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w479p-universal-manual-post-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return Object.freeze(report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW479PUniversalManualPost();
  process.stdout.write(`W479-P0 universal manual-post gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
