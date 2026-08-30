#!/usr/bin/env node
/** W403 source gate: lean media lifecycle is metadata-only and explicit about saving/deletion limits. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W403_LEAN_MEDIA_LIFECYCLE_CONTRACT, validateW403LeanMediaLifecycleContract } from '../config/w403-lean-media-lifecycle-contract.mjs';
import { CREATOR_MEDIA_ROLES, getCreatorMediaLifecycleTruth } from '../assets/js/creator/media-lifecycle.js';
import { getCreatorMediaLifecycleSessionTruth } from '../assets/js/creator/media-lifecycle-workspace.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW403LeanMediaLifecycle() {
  const registry = read('assets/js/creator/media-lifecycle.js');
  const surface = read('assets/js/creator/media-lifecycle-workspace.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getCreatorMediaLifecycleTruth();
  const session = getCreatorMediaLifecycleSessionTruth();
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(`${registry}\n${surface}`);

  check('contract-valid', validateW403LeanMediaLifecycleContract().length === 0, 'W403 contract has no internal violations');
  check('role-set', JSON.stringify(CREATOR_MEDIA_ROLES.map((entry) => entry.id)) === JSON.stringify(W403_LEAN_MEDIA_LIFECYCLE_CONTRACT.roles), 'lifecycle covers source, proxy, cache, final, and export receipt');
  check('workspace-integrated', /renderCreatorMediaLifecycleWorkspace/.test(workspace) && /bindCreatorMediaLifecycleWorkspace/.test(workspace), 'lifecycle desk is integrated in Workspace');
  check('metadata-only', truth.mediaBodyStored === false && session.mediaBodyStored === false && /metadata only/i.test(surface), 'lifecycle entries do not hold files, blobs, data URLs, or media bodies');
  check('no-hidden-app-store', truth.localStorage === false && truth.indexedDb === false && truth.automaticCloudBackup === false && noTransport, 'no hidden browser or cloud media storage is introduced');
  check('final-is-explicit', truth.finalOutputRequiresExplicitUserSave === true && /userSaveRequired/.test(registry) && /(?:explicit final save|saved explicitly|explicitly choose)/i.test(surface), 'final output requires user-selected saving');
  check('no-false-deletion-proof', truth.remoteDeletionProof === false && session.externalDeletionProof === false && /does not claim external deletion/i.test(surface), 'surface does not pretend it deleted provider or user files');
  check('secret-protection', /SECRET_LIKE/.test(registry) && /Do not put a key/i.test(registry), 'metadata rejects obvious secret-looking text');
  return Object.freeze({ schema: 'eonapp.w403.lean-media-lifecycle-gate.v1', wave: 'W403', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Metadata lifecycle foundation only.', 'No real media renderer, provider job, filesystem save, provider storage cleanup, or cloud lifecycle rule is enabled in this wave.']) });
}

export function runW403LeanMediaLifecycleGate({ writeArtifact = true } = {}) {
  const result = inspectW403LeanMediaLifecycle();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w403-lean-media-lifecycle-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW403LeanMediaLifecycleGate();
  process.stdout.write(`W403 lean media lifecycle gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
