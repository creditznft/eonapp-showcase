#!/usr/bin/env node
/** W388A.1 source gate: EON Share Pack has local drafts/exports/native share only. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W388A1_EON_SHARE_PACK_CONTRACT, validateW388A1EonSharePackContract } from '../config/w388a1-eon-share-pack-contract.mjs';
import { EON_SHARE_PACK_FORMATS, getEonSharePackTruth } from '../assets/js/share/eon-share-pack.js';
import { getEonSharePackWorkspaceTruth } from '../assets/js/share/eon-share-pack-workspace.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW388A1EonSharePack() {
  const engine = read('assets/js/share/eon-share-pack.js');
  const workspaceSurface = read('assets/js/share/eon-share-pack-workspace.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getEonSharePackTruth();
  const surface = getEonSharePackWorkspaceTruth();
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(`${engine}\n${workspaceSurface}`);

  check('contract-valid', validateW388A1EonSharePackContract().length === 0, 'W388A.1 contract has no internal violations');
  check('format-set', JSON.stringify(EON_SHARE_PACK_FORMATS.map((format) => format.id)) === JSON.stringify(W388A1_EON_SHARE_PACK_CONTRACT.formats), 'Share Pack offers the approved video/post/story formats');
  check('workspace-integrated', /renderEonSharePackWorkspace/.test(workspace) && /bindEonSharePackWorkspace/.test(workspace), 'Share Pack is integrated in canonical Workspace');
  check('copy-export-native-only', /Copy post text/.test(workspaceSurface) && /Share via device/.test(workspaceSurface) && /Download post kit/.test(workspaceSurface) && /navigator\?\.share/.test(engine), 'surface provides explicit copy, export and optional native share');
  check('no-provider-or-publishing', truth.providerCalls === false && truth.directPublishing === false && truth.oauthConnections === false && truth.storedPlatformTokens === false && noTransport, 'no provider call, OAuth, stored platform token, direct publishing or transport is introduced');
  check('no-growth-value-claim', truth.referralReward === false && truth.tracking === false && /does not connect an account, generate media, publish, schedule, track clicks, award a referral/i.test(workspaceSurface), 'Share Pack does not create referral value, tracking, posting or media claims');
  check('disclosure-helper', /Disclosure reminder/.test(workspaceSurface) && /material benefit/i.test(engine), 'surface gives a non-legal disclosure reminder for creator review');
  check('page-session-boundary', surface.pageSessionOnly === true && /const session = \{ pack: null, intent: null(?:, output: null)? \}/.test(workspaceSurface) && !/localStorage|indexedDB/i.test(`${engine}\n${workspaceSurface}`), 'Share Pack stays in page memory and does not make hidden persistence claims');
  check('secret-protection', /SECRET_LIKE/.test(engine) && /Do not include keys/i.test(engine), 'Share Pack rejects obvious secret-looking inputs');
  return Object.freeze({ schema: 'eonapp.w388a1.eon-share-pack-gate.v1', wave: W388A1_EON_SHARE_PACK_CONTRACT.wave, status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'No direct platform publishing, account connection, media generation, remix collaboration, audience measurement, referral reward, or posting proof is enabled in this wave.']) });
}

export function runW388A1EonSharePackGate({ writeArtifact = true } = {}) {
  const result = inspectW388A1EonSharePack();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w388a1-eon-share-pack-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW388A1EonSharePackGate();
  process.stdout.write(`W388A.1 EON Share Pack gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
