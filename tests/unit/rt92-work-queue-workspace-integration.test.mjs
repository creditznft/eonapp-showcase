import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('RT92 Workspace reuses the existing EONBOT and Automation stores for one Work Queue view', () => {
  const page = read('assets/js/eon-workspace-pages.js');
  assert.match(page, /readEonbotJobFabricState/);
  assert.match(page, /loadAutomationState/);
  assert.match(page, /projectEonWorkQueue/);
  assert.match(page, /EONBOT Work Queue/);
  assert.match(page, /does not create a second task database/i);
  assert.match(page, /basic Work Queue visibility is part of core EONAPP/i);
});

test('RT92 Work Queue module does not define storage, Dodo, checkout or external execution', () => {
  const source = read('assets/js/workspace/eon-work-queue-projection.js');
  assert.doesNotMatch(source, /localStorage\.setItem|sessionStorage\.setItem|fetch\(|XMLHttpRequest|DODO_PRODUCT_|checkout|create.*subscription/i);
  assert.match(source, /createsStorage:\s*false/);
  assert.match(source, /durableRuntimeClaimed:\s*false/);
  assert.match(source, /projectTasksIncluded:\s*false/);
});

test('RT92 canonical commercial catalogue includes every live paid product without changing the core Work Queue', () => {
  const catalog = read('assets/js/commerce/eon-commercial-catalog.js');
  for (const id of ['pro', 'ultra', 'ultimate']) assert.match(catalog, new RegExp(`id:\\s*['"]${id}['"]`, 'i'));
  assert.match(catalog, /monthlyUsd:\s*4\.99/);
  assert.match(catalog, /monthlyUsd:\s*14\.99/);
  assert.match(catalog, /monthlyUsd:\s*29\.99/);
  assert.match(catalog, /monthlyUsd:\s*49\.99/);
  assert.match(catalog, /monthlyUsd:\s*99/);
  assert.match(catalog, /monthlyUsd:\s*199/);
  assert.match(catalog, /oneTimeUsd:\s*1299/);
});
