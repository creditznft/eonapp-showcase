#!/usr/bin/env node
/** W436 static source gate. It validates local visual eligibility, never a grant. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCollectionEligibilityTruth } from '../assets/js/collection/eon-collection-eligibility.js';
import { W436_COLLECTION_ELIGIBILITY_CONTRACT, validateW436CollectionEligibilityContract } from '../config/w436-collection-eligibility-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW436CollectionEligibility() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const implementation = read('assets/js/collection/eon-collection-eligibility.js');
  const workspace = read('assets/js/collection/eon-collection-workspace.js');
  const updateSafe = read('assets/js/utils/update-safe-user-data.js');
  const truth = getEonCollectionEligibilityTruth();

  check('required-files', ['assets/js/collection/eon-collection-eligibility.js', 'config/w436-collection-eligibility-contract.mjs', 'tests/unit/w436-collection-eligibility.test.mjs'].every((relative) => existsSync(path.join(root, relative))), 'implementation, contract and tests are present');
  check('contract-valid', validateW436CollectionEligibilityContract().length === 0 && W436_COLLECTION_ELIGIBILITY_CONTRACT.wave === 'W436', 'contract keeps Collection disabled and non-financial');
  check('separate-from-vault', !/api-key|credential|password|seed phrase|private key/i.test(implementation) || /vaultSecretRead: false/.test(implementation), 'Collection eligibility exposes no Vault secret path');
  check('deterministic-evidence-only', /resolveDeterministicVaultReveal/.test(implementation) && /approvedLocalEvidence/.test(implementation) && /evidence-hash-required/.test(implementation), 'records require approved local evidence and fixed mission mapping');
  check('no-grant', /grantCreated: false/.test(implementation) && /entitlementCreated: false/.test(implementation) && /claimCreated: false/.test(implementation), 'eligibility cannot create a grant, entitlement or ownership claim');
  check('no-network-or-financial-surface', !/\bfetch\s*\(/.test(implementation) && !/XMLHttpRequest|WebSocket|window\.open|location\.(?:assign|href)|navigator\.share/i.test(implementation) && /financialValue: false/.test(implementation) && /transferable: false/.test(implementation) && /marketplace: false/.test(implementation) && /tokenOrNft: false/.test(implementation), 'module creates no transport, publishing, market, token or transfer path');
  check('vault-surface-is-display-only', /createEonCollectionEligibilityRegistry/.test(workspace) && /Eligibility is not a grant/.test(workspace) && /bindEonCollectionWorkspace/.test(workspace), 'Vault/Collection surface exposes only the bounded local review summary');
  check('update-safe-registry', updateSafe.includes('eon:collection:eligibility:v1'), 'the local visual-eligibility key is covered by update-safe preservation');
  check('truth-boundary', truth.collectionRolloutEnabled === false && truth.grantCreated === false && truth.marketplace === false && truth.tokenOrNft === false && truth.remoteRequestCreated === false, 'source work does not claim a Collection release or remote grant');
  return Object.freeze({
    schema: 'eonapp.w436.collection-eligibility-gate.v1', wave: 'W436', status: 'pass', sourceOnly: true,
    checkCount: checks.length, checks: Object.freeze(checks),
    limitations: Object.freeze(['No account-bound Collection, server evidence verification, transaction, trade, transfer, market, NFT/token, payment, reveal animation or production release proof was run.', 'A local eligibility record is not an earned item or account entitlement.'])
  });
}

export function runW436CollectionEligibilityGate({ writeArtifact = true } = {}) {
  const result = inspectW436CollectionEligibility();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w436-collection-eligibility-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW436CollectionEligibilityGate();
  process.stdout.write(`W436 Collection eligibility gate passed (${result.checkCount}/${result.checkCount}). No reveal grant was activated.\n`);
}
