import assert from 'node:assert/strict';
import test from 'node:test';
import { W388A2_REMIX_CARDS_CONTRACT, validateW388A2RemixCardsContract } from '../../config/w388a2-remix-cards-contract.mjs';
import { buildEonRemixCardExport, buildEonRemixCardText, buildEonRemixShareText, createEonRemixCard, EON_REMIX_CARD_KINDS, getEonRemixCardTruth, shareEonRemixCard } from '../../assets/js/share/eon-remix-card.js';
import { inspectW388A2RemixCards } from '../../scripts/w388a2-remix-cards-gate.mjs';

test('W388A.2 creates a local, non-hosted Remix Card with a safe starter', () => {
  assert.deepEqual(validateW388A2RemixCardsContract(), []);
  assert.deepEqual(EON_REMIX_CARD_KINDS.map((entry) => entry.id), W388A2_REMIX_CARDS_CONTRACT.cardKinds);
  const card = createEonRemixCard({ title: 'Remix the launch hook', kind: 'video-storyboard', usefulOutcome: 'A short launch reel adapted to your own audience.', firstRemixStep: 'Rewrite the first two seconds for one specific audience.', publicLink: 'https://example.com/public-preview', creatorCredit: '@creator', creditRequested: true });
  assert.equal(card.execution.publicHosting, false);
  assert.equal(card.execution.referralReward, false);
  assert.equal(card.card.kind.id, 'video-storyboard');
  assert.match(buildEonRemixCardText(card), /Remix the launch hook/);
  assert.equal(getEonRemixCardTruth().privateProjectTransfer, false);
});

test('W388A.2 keeps export textual and blocks secrets or local/private links', () => {
  const card = createEonRemixCard({ title: 'Public starter', usefulOutcome: 'Make a simple campaign card.', firstRemixStep: 'Change the CTA for your own audience.' });
  const exported = buildEonRemixCardExport(card);
  assert.match(exported.text, /Copy, export, or native-share only/);
  assert.match(exported.limitations.join(' '), /no source files/i);
  assert.throws(() => createEonRemixCard({ title: 'Bad secret', usefulOutcome: 'api key: example-secret-123456789', firstRemixStep: 'Change something.' }), /secret/i);
  assert.throws(() => createEonRemixCard({ title: 'Private link', usefulOutcome: 'Make a card.', firstRemixStep: 'Change the hook.', publicLink: 'http://localhost:5173/private' }), /public link/i);
});

test('W388A.2 native share requires an explicit caller and source gate remains honest', async () => {
  const card = createEonRemixCard({ title: 'Native card', usefulOutcome: 'Make a useful starter.', firstRemixStep: 'Change the audience.' });
  const calls = [];
  const result = await shareEonRemixCard(card, { nativeShare: async (payload) => { calls.push(payload); } });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  const report = inspectW388A2RemixCards({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No public Remix Card hosting/i);
});

test('W388A.2 combined copy keeps public card context and only a canonical EONAPP Remix URL', () => {
  const card = createEonRemixCard({ title: 'Music remix', kind: 'music-track', usefulOutcome: 'Make a new authorized variation.', firstRemixStep: 'Change the arrangement.' });
  const safe = 'https://eonapp.ch/create?mode=music#eon-remix=%7B%22v%22%3A1%2C%22kind%22%3A%22music-track%22%2C%22title%22%3A%22Music%20remix%22%2C%22usefulOutcome%22%3A%22Make%20a%20new%20authorized%20variation.%22%2C%22firstRemixStep%22%3A%22Change%20the%20arrangement.%22%7D';
  const combined = buildEonRemixShareText(card, safe);
  assert.match(combined, /Music remix/);
  assert.match(combined, /Remix this in EONAPP:/);
  assert.ok(combined.includes(safe));
  assert.doesNotMatch(buildEonRemixShareText(card, 'https://example.com/create#eon-remix=fake'), /example\.com\/create/);
  assert.equal(getEonRemixCardTruth().combinedRemixShareCopy, true);
});
