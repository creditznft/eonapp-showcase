import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_FIRST_RUN_PATHS,
  EON_CITY_FIRST_RUN_REVIEW_SCHEMA,
  createEonCityFirstRunPathReview,
  validateEonCityFirstRunPathReview
} from '../../assets/js/city/eon-city-first-run.js';
import {
  EON_COMMAND_DECK_CARDS,
  EON_COMMAND_DECK_PRIMARY_CARD_IDS,
  getCommandDeckPrimaryCards,
  getCommandDeckPrimarySummary
} from '../../assets/js/city/eon-city-command-deck.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W592 first-run path selection is a review, never a route command', () => {
  for (const path of EON_CITY_FIRST_RUN_PATHS) {
    const review = createEonCityFirstRunPathReview(path.id);
    assert.equal(review.schema, EON_CITY_FIRST_RUN_REVIEW_SCHEMA);
    assert.equal(review.ok, true);
    assert.equal(review.route, path.route);
    assert.equal(review.confirmationRequired, true);
    assert.equal(review.autoNavigation, false);
    assert.deepEqual(validateEonCityFirstRunPathReview(review), []);
  }
  const unknown = createEonCityFirstRunPathReview('not-a-real-path');
  assert.equal(unknown.ok, false);
  assert.equal(unknown.autoNavigation, false);
});

test('W592 Command Deck prioritises five core work stations without deleting the full contract', () => {
  assert.deepEqual(EON_COMMAND_DECK_PRIMARY_CARD_IDS, ['eonbot', 'forge', 'projects', 'library', 'vault']);
  const cards = getCommandDeckPrimaryCards();
  assert.equal(cards.length, 5);
  assert.deepEqual(cards.map((card) => card.id), EON_COMMAND_DECK_PRIMARY_CARD_IDS);
  assert.equal(EON_COMMAND_DECK_CARDS.length, 7);
  assert.equal(getCommandDeckPrimarySummary().cardCount, 5);
});

test('W592 source keeps the City menu grouped and native exits review-first', () => {
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /data-eon-play-first-run-choices/);
  assert.match(station, /data-eon-play-confirm-first-run-path/);
  assert.match(station, /data-eon-play-first-run-panel[^]*aria-modal="true"/);
  assert.doesNotMatch(station, /EON_CITY_FIRST_RUN_PATHS\.map\(\(path\) => `<a href=/);
  for (const section of ['explore', 'movement', 'work', 'appearance', 'trust']) assert.match(station, new RegExp(`data-eon-play-menu-section="${section}"`));
  assert.match(station, /getCommandDeckPrimaryCards\(\)/);
  assert.match(station, /getCommandDeckPrimarySummary\(\)/);
});

test('W592 operator evidence lane is secret-safe and local-media claims stay truthful', () => {
  const proof = read('scripts/gpt55-ai-agent-deep-proof.mjs');
  const benchmark = read('scripts/w592-local-ai-benchmark.mjs');
  const rehearsal = read('e2e/w592-eon-city-flagship-rehearsal.spec.js');
  const evidenceAudit = read('scripts/w592-evidence-secret-audit.mjs');
  const ignore = read('.gitignore');
  assert.match(proof, /keySamplesPersisted: false/);
  assert.match(proof, /rawSecretValuesPersisted: false/);
  assert.doesNotMatch(proof, /Redacted sample/);
  assert.match(benchmark, /EON_LOCAL_AI_BENCHMARK === '1' && has\('--confirm-local'\)/);
  assert.match(benchmark, /mediaAdaptersClaimedActive: false/);
  assert.match(benchmark, /downloadsPerformed: false/);
  assert.match(rehearsal, /automaticConfirmationUsed: false/);
  assert.match(evidenceAudit, /EON_EVIDENCE_SECRET_AUDIT === '1' && args\.includes\('--confirm-local'\)/);
  assert.match(evidenceAudit, /secretValuesPersisted: false/);
  assert.doesNotMatch(rehearsal, /locator\('\[data-eon-play-confirm-first-run-path\]'\)\.click/);
  assert.match(ignore, /reports\//);
  assert.match(ignore, /storage-state/);
});
