#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT, validateW481ManualReadyToPostBridgeContract } from '../config/w481-manual-ready-to-post-bridge-contract.mjs';
import { buildEonSharePackExport, buildEonSharePackText, createEonSharePack, EON_PLATFORM_VARIANT_GUIDANCE, EON_UNIVERSAL_POST_DESTINATIONS, getEonSharePackTruth, shareEonSharePack } from '../assets/js/share/eon-share-pack.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (file) => existsSync(path.join(root, file));
const read = (file) => readFileSync(path.join(root, file), 'utf8');

export async function inspectW481ManualReadyToPostBridge({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const pkg = JSON.parse(read('package.json'));
  const engine = read('assets/js/share/eon-share-pack.js');
  const workspace = read('assets/js/share/eon-share-pack-workspace.js');
  const pack = createEonSharePack({
    title: 'Creator launch reel',
    destination: 'tiktok',
    goal: 'Show one clear creator workflow result.',
    cta: 'Save this and make your own version.',
    altText: 'Vertical creator reel showing before and after workflow screens.',
    firstComment: 'Tools used, credits, and disclosure notes go here after review.',
    formatNotes: 'Use 9:16, big text, and one readable result frame.'
  });
  const text = buildEonSharePackText(pack);
  const exported = buildEonSharePackExport(pack);
  const truth = getEonSharePackTruth();
  const nativeBlocked = await shareEonSharePack(pack, { nativeShare: async () => undefined });
  const serialized = JSON.stringify(exported);

  check('required-files', [
    'config/w481-manual-ready-to-post-bridge-contract.mjs',
    'scripts/w481-manual-ready-to-post-bridge-gate.mjs',
    'tests/unit/w481-manual-ready-to-post-bridge.test.mjs',
    'assets/js/share/eon-share-pack.js',
    'assets/js/share/eon-share-pack-workspace.js'
  ].every(exists), 'W481 contract, gate, test and share-pack runtime exist');
  check('contract-valid', validateW481ManualReadyToPostBridgeContract().length === 0, 'W481 contract validates');
  check('script-wired', pkg.scripts['qa:w481-manual-ready-to-post-bridge'] === 'node scripts/w481-manual-ready-to-post-bridge-gate.mjs && node --test tests/unit/w481-manual-ready-to-post-bridge.test.mjs', 'package.json exposes W481 gate');
  check('destination-catalogue', JSON.stringify(EON_UNIVERSAL_POST_DESTINATIONS.map((item) => item.id)) === JSON.stringify(W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT.requiredDestinationIds), 'destination catalogue matches W481 contract');
  check('platform-variants-complete', W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT.requiredDestinationIds.every((id) => EON_PLATFORM_VARIANT_GUIDANCE[id]), 'every manual destination has platform-variant guidance');
  check('pack-sections', /Alt text \/ accessibility description/.test(text) && /First comment/.test(text) && /Format notes/.test(text) && /Platform variant/.test(text), 'export text includes alt text, first comment, format notes and platform variant');
  check('manual-only-truth', truth.platformVariants === true && truth.directPublishing === false && truth.oauthConnections === false && truth.hostedMedia === false && truth.storedPlatformTokens === false && truth.automatedScheduling === false, 'truth remains manual-only with no direct connector state');
  check('native-share-user-gesture', nativeBlocked.ok === false && nativeBlocked.reason === 'explicit-user-action-required', 'native share still requires visible user action');
  check('asset-handoff-safe', pack.assetHandoff.persistentMediaBody === false && pack.assetHandoff.cloudMediaHost === false && pack.execution.transientUserSelectedFileShare === true, 'asset handoff is user-selected and non-persistent');
  check('blocked-fields-absent', !/(?:"file"|"blob"|"dataUrl"|"base64"|"bytes"|"binary"|"buffer"|"mediaBody"|"accessToken"|"refreshToken"|"token"|"apiKey"|"secret"|"password"|"remotePostId"|"connectorJobId"|"scheduleAt"|"trackingPixel"|"referralCode")/i.test(serialized), 'exported pack contains no blocked media, token, tracking or remote receipt fields');
  check('workspace-fallback-visible', /Copy post text/.test(workspace) && /Download post kit/.test(workspace) && /Share via device/.test(workspace) && /upload manually/i.test(workspace), 'workspace keeps copy/download/native-share/manual-upload fallback visible');
  check('no-network-publish-code', !/fetch\(|XMLHttpRequest|Authorization/i.test(engine), 'share-pack engine has no network publish, OAuth token or scheduling path');

  const result = Object.freeze({
    schema: 'eon.social.manual-ready-to-post-bridge-gate.w481.v1',
    wave: 'W481',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    samplePack: pack,
    limitations: Object.freeze(['W481 is a manual-first Ready-to-Post bridge only. It does not connect accounts, upload raw media, host files, schedule posts, auto-publish, track reach, or prove a platform post happened.'])
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w481-manual-ready-to-post-bridge');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await inspectW481ManualReadyToPostBridge({ writeArtifact: true });
  process.stdout.write(`W481 manual Ready-to-Post bridge gate passed (${result.checkCount}/${result.checkCount}). Direct connectors remain inactive.\n`);
}
