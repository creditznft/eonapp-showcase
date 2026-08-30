import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  W534_HISTORICAL_DOCUMENTATION_CONTRACT,
  validateW534HistoricalDocumentationContract
} from '../../config/w534-historical-documentation-contract.mjs';
import { buildW534HistoricalDocumentIndex } from '../../scripts/w534-historical-document-index.mjs';
import { inspectW534HistoricalDocumentation } from '../../scripts/w534-historical-documentation-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W534 gives maintainers one current entrypoint and labels legacy W524 material historical', () => {
  assert.deepEqual(validateW534HistoricalDocumentationContract(), []);
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const current = fs.readFileSync(path.join(ROOT, 'CURRENT_PRODUCT_START_HERE.md'), 'utf8');
  const oldW524 = fs.readFileSync(path.join(ROOT, '00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md'), 'utf8');
  assert.match(readme, /CURRENT_PRODUCT_START_HERE\.md/);
  assert.match(current, /Google Login is identity-only/);
  assert.match(current, /EON\.HUB is a separately packaged/);
  assert.match(oldW524, /Historical only/);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W534 generated index is deterministic and preserves historical material without treating it as a release instruction', () => {
  const expected = buildW534HistoricalDocumentIndex({ root: ROOT });
  const current = fs.readFileSync(path.join(ROOT, W534_HISTORICAL_DOCUMENTATION_CONTRACT.generatedIndex), 'utf8');
  assert.equal(current, expected);
  assert.match(current, /Archaeology\/evidence only/);
  assert.match(current, /Retired runnable diagnostic/);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W534 physically quarantines the obsolete P2P e2e diagnostic', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'e2e/flows.spec.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'archive/w519-legacy-transport-control/e2e/flows.spec.js')), true);
  assert.equal(inspectW534HistoricalDocumentation({ root: ROOT }).ok, true);
});
