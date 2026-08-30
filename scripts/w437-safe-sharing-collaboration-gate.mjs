#!/usr/bin/env node
/** W437 static source gate. It validates local share/invite preparation only. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCollaborationInviteTruth } from '../assets/js/share/eon-collaboration-invites.js';
import { W437_SAFE_SHARING_COLLABORATION_CONTRACT, validateW437SafeSharingCollaborationContract } from '../config/w437-safe-sharing-collaboration-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW437SafeSharingCollaboration() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const implementation = read('assets/js/share/eon-collaboration-invites.js');
  const updateSafe = read('assets/js/utils/update-safe-user-data.js');
  const truth = getEonCollaborationInviteTruth();

  check('required-files', ['assets/js/share/eon-collaboration-invites.js', 'config/w437-safe-sharing-collaboration-contract.mjs', 'tests/unit/w437-safe-sharing-collaboration.test.mjs'].every((relative) => existsSync(path.join(root, relative))), 'implementation, contract and unit tests are present');
  check('contract-valid', validateW437SafeSharingCollaborationContract().length === 0 && W437_SAFE_SHARING_COLLABORATION_CONTRACT.wave === 'W437', 'contract keeps delivery, acceptance and tracking disabled');
  check('share-review-reuses-safe-handoff', /createEonOutputShareHandoff/.test(implementation) && /manualCopyOnly: true/.test(implementation) && /publicLinkCreated: false/.test(implementation), 'result share review reuses the established public-safe manual handoff');
  check('invite-required-fields', /resourceReference/.test(implementation) && /resourceReceiptHash/.test(implementation) && /resourceLabel/.test(implementation) && /recipientLabel/.test(implementation) && /expiresAt/.test(implementation) && /EON_COLLABORATION_ROLES/.test(implementation), 'local invite drafts bind a named resource, safe receipt reference, recipient label, role and expiry');
  check('explicit-review-and-revoke', /explicit-resource-share-approval-required/.test(implementation) && /explicit-user-action-required/.test(implementation) && /revocation-confirmation-required/.test(implementation), 'sharing and revocation require deliberate person actions');
  check('delivery-and-acceptance-fail-closed', /deliveryStatus: 'not-sent'/.test(implementation) && /acceptanceStatus: 'not-requested'/.test(implementation) && /external-delivery-and-verified-acceptance-not-released/.test(implementation), 'no local draft masquerades as an externally delivered or accepted invitation');
  check('no-network-or-publish-api', !/\bfetch\s*\(/.test(implementation) && !/XMLHttpRequest|WebSocket|window\.open|location\.(?:assign|href)|navigator\.share/i.test(implementation), 'module creates no network, outgoing link, publishing or native-share action');
  check('privacy-and-tracking-boundary', /resourceContentShared: false/.test(implementation) && /recipientIdentityVerified: false/.test(implementation) && /trackingCreated: false/.test(implementation) && /SENSITIVE_TEXT/.test(implementation), 'drafts exclude resource content, recipient verification and tracking');
  check('update-safe-registry', updateSafe.includes('eon:collaboration-invites:v1'), 'the local collaboration-draft key is covered by update-safe preservation');
  check('truth-boundary', truth.deliveryEnabled === false && truth.acceptanceEnabled === false && truth.tracking === false && truth.autoPosting === false && truth.productionCollaborationProof === false, 'source work does not claim delivered collaboration, tracking or production proof');
  return Object.freeze({
    schema: 'eonapp.w437.safe-sharing-collaboration-gate.v1', wave: 'W437', status: 'pass', sourceOnly: true,
    checkCount: checks.length, checks: Object.freeze(checks),
    limitations: Object.freeze(['No public share link, recipient lookup, email/message delivery, server role grant, acceptance, permission propagation, collaboration sync, analytics, social post or production proof was run.', 'Local invite drafts are revocable preparation records, not active invitations.'])
  });
}

export function runW437SafeSharingCollaborationGate({ writeArtifact = true } = {}) {
  const result = inspectW437SafeSharingCollaboration();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w437-safe-sharing-collaboration-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW437SafeSharingCollaborationGate();
  process.stdout.write(`W437 safe sharing/collaboration gate passed (${result.checkCount}/${result.checkCount}). No external invite was sent.\n`);
}
