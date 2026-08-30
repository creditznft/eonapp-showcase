#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W390_W391_COLLECTION_RELAY_CONTRACT, validateW390W391CollectionRelayContract } from '../config/w390-w391-collection-relay-contract.mjs';
import { getEonCollectionTruth, resolveDeterministicVaultReveal } from '../assets/js/collection/eon-collection-foundation.js';
import { getEonRelayPilotTruth } from '../assets/js/relay/eon-relay-pilot-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW390W391CollectionRelay() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const collection = getEonCollectionTruth();
  const relay = getEonRelayPilotTruth();
  const collectionSource = read('assets/js/collection/eon-collection-foundation.js');
  const relaySource = read('assets/js/relay/eon-relay-pilot-contract.js');
  const relayStatus = read('functions/api/relay/status.js');
  const relayClaim = read('functions/api/relay/claim.js');
  const migration = read('relay/migrations/0001_eon_relay_pilot.sql');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const reveal = resolveDeterministicVaultReveal({ missionId: 'share-pack-reviewed', evidenceKind: 'share-pack-review' });
  check('contract-valid', validateW390W391CollectionRelayContract().length === 0, 'Collection/Relay contract has no internal violations');
  check('collection-disabled', collection.enabled === false && collection.remoteGrantCreated === false && collection.localGrantCreated === false, 'Collection cannot grant locally or remotely');
  check('deterministic-reveal', reveal.ok && reveal.deterministic && reveal.randomChance === false && reveal.grantCreated === false, 'Vault Reveal maps a mission to a fixed locked artifact without chance or grant');
  check('no-financial-or-transfer', collection.cashValue === false && collection.transferable === false && collection.nft === false && collection.blockchain === false, 'Collection has no financial, NFT, blockchain or transfer model');
  check('relay-disabled', relay.enabled === false && relay.createsInviteLink === false && relay.createsGrant === false && relay.queriesDatabase === false, 'Relay cannot create links, grants or database effects');
  check('relay-hard-disabled-functions', /enabled:\s*false/.test(relayStatus) && /503/.test(relayClaim) && !/prepare\(/.test(`${relayStatus}\n${relayClaim}`), 'Relay Functions fail closed without database access');
  check('dedicated-relay-schema', /EON_RELAY_DB/.test(migration) && !/EON_IDENTITY_DB\s*;/.test(migration) && /eon_relay_grants/.test(migration), 'Relay migration is dedicated and stores a reversible non-financial ledger shape');
  check('no-random-or-storage-side-effect', !/\bMath\.random\s*\(|\bcrypto\.getRandomValues\s*\(|\bfetch\s*\(|\blocalStorage\s*\.|\bsessionStorage\s*\./.test(collectionSource), 'Collection implementation contains no random draw, network call or storage side effect');
  check('workspace-truth', /renderEonCollectionWorkspace/.test(workspace) && /renderEonRelayPilotWorkspace/.test(workspace), 'Workspace exposes transparent locked Collection and Relay status');
  return Object.freeze({ schema: 'eonapp.w390-w391.collection-relay-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No Collection grant, Vault Reveal animation, referral link, relay activation, D1 migration, legal approval or live account proof occurs in this source gate.']) });
}

export function runW390W391CollectionRelayGate({ writeArtifact = true } = {}) {
  const result = inspectW390W391CollectionRelay();
  if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w390-w391-collection-relay-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); }
  return result;
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW390W391CollectionRelayGate(); process.stdout.write(`W390/W391 Collection/Relay gate passed (${result.checkCount}/${result.checkCount}).\n`); }
