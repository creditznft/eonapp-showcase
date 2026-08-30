#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W388B_W389_CONNECTORS_DEPLOYMENT_CONTRACT, validateW388BW389ConnectorsDeploymentContract } from '../config/w388b-w389-connectors-deployment-contract.mjs';
import { getEonSocialConnectorTruth, listEonSocialConnectors } from '../assets/js/connectors/eon-social-connector-registry.js';
import { buildForgeRemoteDeployPreflight, getEonForgeDeploymentPreflightTruth } from '../assets/js/forge/forge-remote-deploy-preflight.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);
const stripComments = (source = '') => String(source).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

export function inspectW388BW389ConnectorsDeployment() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const connectors = getEonSocialConnectorTruth();
  const deployment = getEonForgeDeploymentPreflightTruth();
  const registry = read('assets/js/connectors/eon-social-connector-registry.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const connectorStatus = read('functions/api/connectors/status.js');
  const deployStatus = read('functions/api/deployments/status.js');
  const migration = read('connector/migrations/0001_eon_connector_custody.sql');
  const preflight = buildForgeRemoteDeployPreflight({ title: 'Safe project', files: { 'index.html': '<main>Hello</main>', 'style.css': 'body{}', 'script.js': 'console.log(1)' }, sourceCheckPassed: true });
  check('contract-valid', validateW388BW389ConnectorsDeploymentContract().length === 0, 'Connector/deployment contract has no internal violations');
  check('connector-registry-complete', listEonSocialConnectors().length >= 13 && ['instagram', 'facebook-pages', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'x', 'telegram', 'discord', 'reddit', 'whatsapp', 'threads', 'snapchat'].every((id) => listEonSocialConnectors().some((item) => item.id === id)), 'All planned platforms are present as disabled architecture records');
  check('connector-disabled', connectors.enabled === false && connectors.oauthStarted === false && connectors.tokenStored === false && connectors.directPostCreated === false, 'No social OAuth, token custody or direct post is enabled');
  check('connector-status-disabled', /enabled:\s*false/.test(connectorStatus) && !/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(stripComments(connectorStatus)), 'Connector status route is public-safe and non-operative');
  check('no-legacy-publisher-import', !/social-publisher\.js/.test(workspace), 'Canonical Workspace does not revive the legacy browser-managed publisher');
  check('deployment-disabled', deployment.githubConnected === false && deployment.cloudflareConnected === false && deployment.deploymentCreated === false, 'Forge deployment stays disconnected');
  check('preflight-safe', preflight.readyForManualHandoff === true && preflight.remoteRequestCreated === false && preflight.deploymentCreated === false, 'Forge preflight evaluates local files without a network deployment');
  check('deploy-status-disabled', /enabled:\s*false/.test(deployStatus) && !/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(stripComments(deployStatus)), 'Deployment status route is non-operative');
  check('future-custody-schema', /EON_CONNECTORS_DB/.test(migration) && /eon_connector_accounts/.test(migration) && /DO NOT APPLY/.test(migration), 'Connector migration is dedicated and explicitly deferred');
  check('workspace-surfaces', /renderEonSocialConnectorsWorkspace/.test(workspace) && /renderForgeRemoteDeployWorkspace/.test(workspace), 'Workspace exposes connector and deployment preparation without live controls');
  return Object.freeze({ schema: 'eonapp.w388b-w389.connectors-deployment-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No connector OAuth, platform call, token custody, GitHub connection, repository, Cloudflare deployment or scheduling proof occurs.']) });
}
export function runW388BW389ConnectorsDeploymentGate({ writeArtifact = true } = {}) { const result = inspectW388BW389ConnectorsDeployment(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w388b-w389-connectors-deployment-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW388BW389ConnectorsDeploymentGate(); process.stdout.write(`W388B/W389 Connector/Deployment gate passed (${result.checkCount}/${result.checkCount}).\n`); }
