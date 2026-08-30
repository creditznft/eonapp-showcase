#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W399_PRELAUNCH_AUDIT_CONTRACT, validateW399PrelaunchAuditContract } from '../config/w399-prelaunch-audit-contract.mjs';
import { getEonCollectionTruth } from '../assets/js/collection/eon-collection-foundation.js';
import { inspectW519LegacyTransportQuarantine } from './w519-legacy-transport-quarantine-gate.mjs';
import { getEonActionGatewayTruth } from '../assets/js/action-gateway/eon-action-gateway-contract.js';
import { getEonSocialConnectorTruth } from '../assets/js/connectors/eon-social-connector-registry.js';
import { getEonForgeDeploymentPreflightTruth } from '../assets/js/forge/forge-remote-deploy-preflight.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW399PrelaunchAudit() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const pkg = JSON.parse(read('package.json'));
  check('contract-valid', validateW399PrelaunchAuditContract().length === 0, 'W399 contract has no internal violations');
  for (const script of W399_PRELAUNCH_AUDIT_CONTRACT.requiredScripts) check(`script:${script}`, Boolean(pkg.scripts?.[script]), `required script exists: ${script}`);
  check('collection-locked', getEonCollectionTruth().enabled === false && getEonCollectionTruth().remoteGrantCreated === false, 'Collection remains locked');
  const w519 = inspectW519LegacyTransportQuarantine({ root });
  check('legacy-transport-quarantined', w519.ok === true, 'Legacy transport/control families remain outside active routes, Functions and bundles');
  check('actions-locked', getEonActionGatewayTruth().enabled === false && getEonActionGatewayTruth().externalEffectCreated === false, 'Action Gateway remains locked');
  check('connectors-locked', getEonSocialConnectorTruth().enabled === false && getEonSocialConnectorTruth().directPostCreated === false, 'Connectors remain locked');
  check('forge-locked', getEonForgeDeploymentPreflightTruth().deploymentCreated === false && getEonForgeDeploymentPreflightTruth().remoteRequestCreated === false, 'Forge remote deployment remains locked');
  return Object.freeze({ schema: 'eonapp.w399.prelaunch-audit-gate.v1', status: 'pass', sourceOnly: true, productionCertified: false, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['This source audit does not prove Cloudflare configuration, D1 migrations, Google OAuth login, recovery, platform eligibility, legal review, social connection, repository or deploy.']) });
}
export function runW399PrelaunchAuditGate({ writeArtifact = true } = {}) { const result = inspectW399PrelaunchAudit(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w399-prelaunch-audit-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW399PrelaunchAuditGate(); process.stdout.write(`W399 pre-launch audit gate passed (${result.checkCount}/${result.checkCount}).\n`); }
