#!/usr/bin/env node
/** Share-2 source gate: attach local Share/Remix starters to useful outputs only. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARE2_COMPLETED_OUTPUT_CONTRACT, validateShare2CompletedOutputContract } from '../config/share2-completed-output-contract.mjs';
import { getEonOutputShareHandoffTruth } from '../assets/js/share/eon-output-share-handoff.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectShare2CompletedOutput() {
  const handoff = read('assets/js/share/eon-output-share-handoff.js');
  const creator = read('assets/js/creator-suite-2/creator-suite-2-workspace.js');
  const forge = read('assets/js/forge/eon-forge-quick-build.js');
  const sharePack = read('assets/js/share/eon-share-pack-workspace.js');
  const remix = read('assets/js/share/eon-remix-card-workspace.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };

  check('contract-valid', validateShare2CompletedOutputContract().length === 0, 'Share-2 contract has no internal violations');
  check('session-only-handoff', /sessionStorage/.test(handoff) && /EON_OUTPUT_SHARE_HANDOFF_MAX_AGE_MS/.test(handoff) && /explicitUserAction/.test(handoff), 'handoff is short-lived browser-session data behind explicit action');
  check('safe-boundary', /sourceFiles: false/.test(handoff) && /mediaBodies: false/.test(handoff) && /privateChat: false/.test(handoff) && /credentials: false/.test(handoff) && /publicLinkIncluded: false/.test(handoff), 'handoff refuses source, media, private chat, credentials and links');
  check('no-transport', !/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(handoff), 'handoff creates no network transport');
  check('creator-output-actions', /data-creator-suite-share-pack/.test(creator) && /data-creator-suite-remix-card/.test(creator) && /writeEonOutputShareHandoff/.test(creator), 'Creator local drafts can start explicit Share/Remix handoffs');
  check('forge-output-actions', /data-eon-forge-share-pack/.test(forge) && /data-eon-forge-remix-card/.test(forge) && /writeEonOutputShareHandoff/.test(forge), 'Forge local projects can start explicit Share/Remix handoffs');
  check('pack-prefill', /readEonOutputShareHandoff/.test(sharePack) && /data-eon-share-pack-clear-output/.test(sharePack), 'Share Pack can consume and clear only the safe output handoff');
  check('remix-prefill', /readEonOutputShareHandoff/.test(remix) && /data-eon-remix-clear-output/.test(remix), 'Remix Card can consume and clear only the safe output handoff');
  check('locked-boundaries', SHARE2_COMPLETED_OUTPUT_CONTRACT.directPublishing === false && SHARE2_COMPLETED_OUTPUT_CONTRACT.socialOAuth === false && SHARE2_COMPLETED_OUTPUT_CONTRACT.tracking === false && SHARE2_COMPLETED_OUTPUT_CONTRACT.referralReward === false, 'publishing, OAuth, tracking and rewards stay inactive');
  const truth = getEonOutputShareHandoffTruth();
  check('runtime-truth', truth.browserSessionOnly === true && truth.sourceFiles === false && truth.directPublishing === false && truth.tracking === false && truth.referralReward === false, 'runtime truth remains local and non-commercial');

  return Object.freeze({ schema: 'eonapp.share2.completed-output-gate.v1', wave: 'Share-2', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static/source verification only.', 'No post, external remix, collaboration, reach, tracking, referral or reward proof exists.']) });
}

export function runShare2CompletedOutputGate({ writeArtifact = true } = {}) {
  const result = inspectShare2CompletedOutput();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'share2-completed-output-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runShare2CompletedOutputGate();
  process.stdout.write(`Share-2 completed-output gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
