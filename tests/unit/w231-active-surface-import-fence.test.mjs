import test from 'node:test';
import assert from 'node:assert/strict';
import { auditActiveSurfaceImports } from '../../scripts/active-surface-import-fence.mjs';

test('W231 keeps live, optional, preview and local-only app routes outside the retired 3D and value-bearing legacy module families', () => {
  const result = auditActiveSurfaceImports();
  assert.ok(result.routeEntryCount >= 14, 'every primary route file should be part of the audited entry set');
  assert.ok(result.moduleCount > 20, 'the audit should traverse the real module graph rather than only HTML shells');
  assert.deepEqual(result.legacyPrefixHits, [], `retired module family reachable: ${result.legacyPrefixHits.join(', ')}`);
  assert.deepEqual(result.legacyValueHits, [], `legacy value-bearing module reachable: ${result.legacyValueHits.join(', ')}`);
  assert.equal(result.ok, true);
});
