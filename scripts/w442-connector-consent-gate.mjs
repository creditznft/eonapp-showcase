#!/usr/bin/env node
import assert from 'node:assert/strict'; import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { getEonConnectorConsentTruth } from '../assets/js/connectors/eon-connector-consent-registry.js';
import { W442_CONNECTOR_CONSENT_CONTRACT, validateW442ConnectorConsentContract } from '../config/w442-connector-consent-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const read = (file) => readFileSync(path.join(root, file), 'utf8'); const ensure = (value, message) => assert.equal(Boolean(value), true, message);
export function inspectW442ConnectorConsent() {
  const checks = []; const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const registry = read('assets/js/connectors/eon-connector-consent-registry.js'); const workspace = read('assets/js/connectors/eon-social-connectors-workspace.js'); const updateSafe = read('assets/js/utils/update-safe-user-data.js'); const truth = getEonConnectorConsentTruth();
  check('required-files', ['assets/js/connectors/eon-connector-consent-registry.js', 'config/w442-connector-consent-contract.mjs', 'tests/unit/w442-connector-consent.test.mjs'].every((file) => existsSync(path.join(root, file))), 'consent registry, contract and test exist');
  check('contract-valid', validateW442ConnectorConsentContract().length === 0 && W442_CONNECTOR_CONSENT_CONTRACT.wave === 'W442', 'contract keeps OAuth and remote access disabled');
  check('consent-expiry-revoke', /explicitPurposeApproval/.test(registry) && /expiresAt/.test(registry) && /revokeConsent/.test(registry) && /explicitRevocationConfirmation/.test(registry), 'records require purpose review, expiry and confirmed revoke');
  check('connector-registry-only', /getEonSocialConnector/.test(registry) && /connector-not-recognized/.test(registry), 'only known connector definitions can be prepared');
  check('oauth-fail-closed', /oauth-and-connector-custody-not-released/.test(registry) && /tokenStored: false/.test(registry) && /remoteActionCreated: false/.test(registry), 'OAuth and external action paths are deliberately unavailable');
  check('no-network', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|window\.open|navigator\.share/.test(registry), 'no network, native share or external link is created');
  check('workspace-truth', /getEonConnectorConsentTruth/.test(workspace) && /OAuth, tokens and platform actions remain unavailable/.test(workspace), 'connector surface uses truthful W442 language');
  check('update-safe-key', updateSafe.includes('eon:connector-consent:v1'), 'local consent records are W145 protected');
  check('truth-boundary', truth.oauthStarted === false && truth.tokenStored === false && truth.remoteAccessGranted === false && truth.externalPublishCreated === false && truth.productionConnectorProof === false, 'source does not claim a connected account or collaboration grant');
  return Object.freeze({ schema: 'eonapp.w442.connector-consent-gate.v1', wave: 'W442', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No OAuth, token custody, connector action, post, message, share delivery, collaboration role grant or production provider proof was run.']) });
}
export function runW442ConnectorConsentGate({ writeArtifact = true } = {}) { const result = inspectW442ConnectorConsent(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w442-connector-consent-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW442ConnectorConsentGate(); process.stdout.write(`W442 connector consent gate passed (${result.checkCount}/${result.checkCount}). No account was connected.\n`); }
