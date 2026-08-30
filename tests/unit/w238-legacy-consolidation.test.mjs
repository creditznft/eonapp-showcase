import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from '../../scripts/active-surface-import-fence.mjs';
import { getW393ALeanHandoverStatus } from '../../config/w393a-lean-handover-integrity-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const exists = (relative) => fs.existsSync(path.join(root, relative));

test('W238 keeps retired value-system families outside the production source graph while retaining RT98 rewards', () => {
  const status = getW393ALeanHandoverStatus();
  assert.equal(status.historicArchiveVerification, 'not-certified-by-this-handover');
  for (const directory of ['assets/js/ads', 'assets/js/realm3d']) {
    assert.equal(exists(directory), false, `${directory} is not part of active source`);
  }
  for (const file of ['assets/js/rewards/eon-reward-policy.js', 'assets/js/rewards/eon-rewards-page.js']) assert.equal(exists(file), true, `${file} is the active RT98 Reward Center source`);
  for (const original of ['assets/js/ads/AdManager.js', 'assets/js/realm3d/eon-city-app.js', 'assets/js/utils/nowpayments-config.js']) {
    assert.equal(exists(original), false, `${original} must remain absent from active source`);
  }
});

test('W238 active-surface import fence excludes archived source and commercial/provider literals', () => {
  const result = auditActiveSurfaceImports({ root });
  assert.equal(result.ok, true);
  assert.ok(result.routeEntryCount >= 20);
  assert.ok(result.moduleCount >= 100);
  const activeSource = fs.readdirSync(path.join(root, 'assets/js'), { recursive: true })
    .filter((entry) => typeof entry === 'string' && entry.endsWith('.js'))
    .map((entry) => path.join(root, 'assets/js', entry));
  const hits = activeSource.filter((file) => /YOUR-MONETAG|omg10\.com|monetag-rewarded|ad-rewards\/postback|nowpayments\/ipn/i.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(hits, []);
});
