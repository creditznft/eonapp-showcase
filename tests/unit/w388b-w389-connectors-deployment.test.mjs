import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonSocialConnectorTruth, listEonSocialConnectors } from '../../assets/js/connectors/eon-social-connector-registry.js';
import { buildForgeRemoteDeployPreflight } from '../../assets/js/forge/forge-remote-deploy-preflight.js';
import { inspectW388BW389ConnectorsDeployment } from '../../scripts/w388b-w389-connectors-deployment-gate.mjs';

test('W388B lists global creator connector plans without enabling OAuth or posting', () => {
  const truth = getEonSocialConnectorTruth();
  const ids = listEonSocialConnectors().map((item) => item.id);
  assert.equal(truth.enabled, false);
  assert.equal(truth.directPostCreated, false);
  for (const id of ['instagram', 'facebook-pages', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'x', 'telegram', 'discord', 'reddit', 'whatsapp', 'threads', 'snapchat']) assert.ok(ids.includes(id));
});

test('W389 local Forge preflight cannot connect or deploy', () => {
  const result = buildForgeRemoteDeployPreflight({ title: 'Demo', files: { 'index.html': '<main>Demo</main>', 'style.css': '', 'script.js': '' }, sourceCheckPassed: true });
  assert.equal(result.readyForManualHandoff, true);
  assert.equal(result.githubConnected, false);
  assert.equal(result.deploymentCreated, false);
});

test('W388B/W389 static architecture gate passes without OAuth or deploy', () => {
  const report = inspectW388BW389ConnectorsDeployment({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No connector OAuth/i);
});
