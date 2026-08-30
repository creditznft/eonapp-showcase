import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from '../../scripts/active-surface-import-fence.mjs';
import { auditW393ALeanHandoverIntegrity } from '../../scripts/w393a-lean-handover-integrity-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W242 keeps active routes outside legacy value modules, runtime wallet configuration, and EVM address literals', () => {
  const result = auditActiveSurfaceImports({ root });
  assert.equal(result.ok, true);
  assert.deepEqual(result.legacyPrefixHits, []);
  assert.deepEqual(result.legacyValueHits, []);
  assert.deepEqual(result.forbiddenLiteralHits, []);
  assert.deepEqual(result.evmAddressLiteralHits, []);
  assert.ok(result.routeEntryCount >= 20);
  assert.ok(result.moduleCount >= 100);
});

test('W242 keeps retired wallet/payment authority outside the active source tree in a lean handover', () => {
  const activeWalletConfig = path.join(root, 'assets/js/utils/admin-wallets.js');
  assert.equal(fs.existsSync(activeWalletConfig), false, 'active admin wallet configuration must remain absent');
  const handover = auditW393ALeanHandoverIntegrity({ root });
  assert.equal(handover.ok, true, handover.errors.join('\n'));
  assert.equal(handover.historicEvidence.verified, false);
  assert.doesNotMatch(read('vite.config.mjs'), /EON_ADMIN_WALLET|__EON_ADMIN_WALLETS__/);
  assert.doesNotMatch(read('assets/js/utils/profile.js'), /__EON_ADMIN_WALLETS__|getDefaultAdminWallets\(\)/);
  assert.match(read('PRODUCT_MAP.md'), /W242/i);
});
