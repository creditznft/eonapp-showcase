#!/usr/bin/env node
/** W400/W402 source gate: canonical Creator Engine plus conservative local/BYOK capability boundary. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W400_W402_CREATOR_ADAPTER_FOUNDATION_CONTRACT, validateW400W402CreatorAdapterFoundationContract } from '../config/w400-w402-creator-adapter-foundation-contract.mjs';
import { buildCreatorEngineOverview, CREATOR_EXECUTION_MODES, CREATOR_TASKS } from '../assets/js/creator/creator-engine-registry.js';
import { getCreatorEngineWorkspaceTruth } from '../assets/js/creator/creator-engine-workspace.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW400W402CreatorAdapterFoundation() {
  const registry = read('assets/js/creator/creator-engine-registry.js');
  const workspace = read('assets/js/creator/creator-engine-workspace.js');
  const workspacePage = read('assets/js/eon-workspace-pages.js');
  const localCatalog = read('assets/js/local-ai/creator-media-catalog.js');
  const localPage = read('assets/js/local-ai/local-ai-page.js');
  const legacyCreator = read('assets/js/creator-suite-2/creator-suite-2-workspace.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const contract = W400_W402_CREATOR_ADAPTER_FOUNDATION_CONTRACT;
  const overview = buildCreatorEngineOverview({ profile: { label: 'Mobile browser', computeClass: 'mobile', acceleration: 'cpu-only', summary: 'Use a conservative route.' } });
  const truth = getCreatorEngineWorkspaceTruth();
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(`${registry}\n${workspace}\n${localCatalog}`);

  check('contract-valid', validateW400W402CreatorAdapterFoundationContract().length === 0, 'W400/W402 contract has no internal violations');
  check('execution-modes', JSON.stringify(CREATOR_EXECUTION_MODES.map((entry) => entry.id)) === JSON.stringify(contract.executionModes), 'registry exposes only draft, local runtime, and BYOK modes');
  check('task-set', JSON.stringify(CREATOR_TASKS.map((entry) => entry.id)) === JSON.stringify(contract.requiredTasks), 'registry includes image, video, and creator package tasks');
  check('canonical-workspace', /renderCreatorEngineWorkspace/.test(workspacePage) && /bindCreatorEngineWorkspace/.test(workspacePage) && truth.canonicalSurface === 'Workspace', 'Creator Engine is rendered and bound in Workspace');
  check('local-media-guidance', /renderCreatorMediaCatalog/.test(localPage) && /ComfyUI-style/.test(registry) && /creator-media/.test(localCatalog), 'Local AI surface exposes conservative image/video guidance');
  check('no-creator-provider-call', noTransport && truth.mediaProviderCalls === false, 'Creator foundation has no provider transport');
  check('vault-only-keys', /provider credentials (?:belong only in Vault|stay outside this Workspace surface)/i.test(workspace) && truth.credentialsCollectedHere === false && truth.vaultOnlyCredentialBoundary === true && !/type=["']password/.test(workspace), 'Workspace planner accepts no provider key and keeps credential custody outside the planning surface');
  check('no-installer-download', !/install\s*\(/i.test(registry) && !/download\s*\(/i.test(registry) && truth.localModelInstallation === false, 'Creator registry cannot install runtimes or download models');
  check('mobile-conservative', overview.taskPlans.find((item) => item.task.id === 'video')?.modes.find((mode) => mode.id === 'local-runtime')?.available === false, 'mobile profile never receives a local full-video promise');
  check('legacy-stays-local-draft', !/fetch\(/.test(legacyCreator) && !/providerCall:\s*true/.test(legacyCreator), 'existing Creator Suite remains a local draft surface');

  return Object.freeze({ schema: 'eonapp.w400-w402.creator-adapter-foundation-gate.v1', wave: 'W400/W402', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Source-level architecture proof only.', 'No provider media generation, ComfyUI adapter, media upload, rendering, social publishing, or credential verification is enabled by this wave.', 'Real local/runtime and provider integration require later compatibility, rights, lifecycle, identity, and action-gateway proof.']) });
}

export function runW400W402CreatorAdapterFoundationGate({ writeArtifact = true } = {}) {
  const result = inspectW400W402CreatorAdapterFoundation();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w400-w402-creator-adapter-foundation-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW400W402CreatorAdapterFoundationGate();
  process.stdout.write(`W400/W402 Creator adapter foundation gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
