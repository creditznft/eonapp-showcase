import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectEonCityW660EmittedCandidate } from '../../scripts/w660-city-emitted-candidate-gate.mjs';

test('W660 emitted candidate contains every effective City asset variant and productive runtime contract', () => {
  const result = inspectEonCityW660EmittedCandidate();
  assert.equal(result.ok, true, result.failures.map((entry) => entry.id).join(','));
  assert.equal(result.effectiveAssetCount, 34);
  assert.equal(result.verifiedVariantCount, 68);
  assert.ok(result.distAssetBytes > 20_000_000);

  const runtimeTokens = result.checks
    .filter((entry) => entry.id.startsWith('runtime-token:'))
    .map((entry) => entry.id);
  // W759: W749 Living Nexus and the renamed Command Core are the maintained authority.
  assert.ok(runtimeTokens.includes('runtime-token:eon.city.living-nexus.w749.v1'));
  assert.ok(runtimeTokens.includes('runtime-token:Share Command Center'));
  assert.equal(runtimeTokens.includes('runtime-token:eon.city.w660.nexus-hologram.w660n.v2'), false);
  assert.equal(runtimeTokens.includes('runtime-token:Sharing Center'), false);
});
