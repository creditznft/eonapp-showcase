import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluateW275PwaAssetPolicy, verifyW275PwaAssetPolicy } from '../../scripts/w275-pwa-asset-policy-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const source = () => ({
  sw: read('sw.js'),
  manifest: JSON.parse(read('manifest.webmanifest')),
  pwaManager: read('assets/js/eon-pwa-manager.js'),
  plan: read('docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md')
});

test('W275-A0 validates bounded cache, protected navigation, and explicit update activation', () => {
  const report = verifyW275PwaAssetPolicy(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.sourceOnly, true);
  assert.ok(report.precacheEntryCount > 0);
  assert.ok(report.noStorePaths.includes('/vault'));
  assert.ok(report.noStorePaths.includes('/capsule'));
});

test('W275-A0 rejects auto activation and protected precache routes', () => {
  const current = source();
  const broken = {
    ...current,
    sw: current.sw
      .replace(
        /await notifyClients\(\{ type: 'EONAPP_SW_UPDATE_WAITING',[^;]+requiresUserReloadChoice: true \}\);/,
        'await sw.skipWaiting();'
      )
      .replace("'/market', '/insights', '/profile'", "'/market', '/insights', '/vault', '/profile'")
  };
  const report = evaluateW275PwaAssetPolicy(broken);
  assert.equal(report.ok, false);
  assert.ok(report.errors.some((message) => /auto-activates|Protected navigation appears/.test(message)));
});
