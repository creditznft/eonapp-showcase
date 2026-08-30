import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  W106_CANONICAL_DOMAINS,
  W106_LIVE_INTEGRATIONS,
  buildW106ContractMap,
  buildW106IntegrationMatrix,
  getW106Integration,
  isEvmAddress,
  validateW106Readiness
} from '../../assets/js/utils/w106-live-integration-registry.js';

const root = path.resolve(import.meta.dirname, '../..');
const deployedContracts = JSON.parse(fs.readFileSync(path.join(root, 'assets/config/deployed-contracts.json'), 'utf8'));
const fileExists = (file) => fs.existsSync(path.join(root, file));

test('W106 maps every live integration to proof files, env boundaries and side-effect limits', () => {
  const matrix = buildW106IntegrationMatrix({ fileExists });
  assert.equal(matrix.length, W106_LIVE_INTEGRATIONS.length);
  assert.ok(matrix.length >= 9);
  assert.equal(matrix.every((row) => row.ok), true);
  assert.ok(new Set(matrix.map((row) => row.category)).size >= 6);
  assert.equal(getW106Integration('read-only-exchange-connectors').liveOrderBlocked, undefined);
  const exchange = matrix.find((row) => row.id === 'read-only-exchange-connectors');
  assert.equal(exchange.liveOrderBlocked, true);
  assert.ok(exchange.blockedSideEffects.includes('place order'));
  const nowpayments = matrix.find((row) => row.id === 'nowpayments-subscriptions');
  assert.ok(nowpayments.requiredEnv.includes('NOWPAYMENTS_IPN_SECRET'));
  assert.equal(nowpayments.publicProofAvailableWithoutSecrets, false);
  assert.equal(matrix.some((row) => row.id === 'social-public-post-proof' && row.publicProofAvailableWithoutSecrets), true);
});

test('W106 contract map validates frontend addresses against deployed config', () => {
  const map = buildW106ContractMap({ deployedContracts, fileExists });
  assert.equal(map.length, 20);
  assert.equal(map.every((row) => row.ok), true);
  assert.equal(map.every((row) => row.addressMatchesDeployConfig), true);
  assert.equal(map.every((row) => isEvmAddress(row.frontendAddress)), true);
  assert.ok(map.find((row) => row.key === 'TOKEN').abiFragments >= 1);
  assert.ok(map.find((row) => row.key === 'NFT_MARKETPLACE').abiFragments >= 3);
  assert.equal(map.find((row) => row.key === 'REALM_LAND').sourceStatus, 'external-or-previous-deploy-source-not-included');
});

test('W106 readiness preserves honest credential and source boundaries', () => {
  const readiness = validateW106Readiness({ deployedContracts, fileExists });
  assert.equal(readiness.ok, true);
  assert.equal(readiness.liveTradingCompiled, false);
  assert.ok(readiness.credentialBoundCount >= 4);
  assert.ok(readiness.publicProofWithoutSecretsCount >= 4);
  assert.ok(readiness.warnings.some((warning) => warning.kind === 'credential-bound-live-proof'));
  assert.ok(readiness.warnings.some((warning) => warning.kind === 'source-not-included' && warning.key === 'NFT_MARKPLACE') === false);
  assert.ok(readiness.warnings.some((warning) => warning.kind === 'source-not-included' && warning.key === 'NFT_MARKETPLACE'));
});

test('W106 canonical domain policy separates public app, metadata host and web3 mirrors', () => {
  assert.equal(W106_CANONICAL_DOMAINS.publicSite, 'https://eonapp.ch');
  assert.ok(W106_CANONICAL_DOMAINS.metadataTemplate.includes('meta.eon.hub/loot/{id}.json'));
  assert.equal(W106_CANONICAL_DOMAINS.web3Mirror, 'eonlite.u');
  assert.match(W106_CANONICAL_DOMAINS.note, /not the universal wallet endpoint/i);
});

test('W106 contract mismatch detection fails closed', () => {
  const altered = structuredClone(deployedContracts);
  altered.deployment.contracts.EONLiteToken = '0x0000000000000000000000000000000000000000';
  const map = buildW106ContractMap({ deployedContracts: altered, fileExists });
  const token = map.find((row) => row.key === 'TOKEN');
  assert.equal(token.addressValid, true);
  assert.equal(token.addressMatchesDeployConfig, false);
  assert.equal(token.ok, false);
});
