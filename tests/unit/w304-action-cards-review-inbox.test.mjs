import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EONBOT_ACTION_CARD_STORAGE_KEY,
  EONBOT_ACTION_CARD_TTL_MS,
  buildEonbotLocalActionCardPlan,
  clearEonbotLocalActionCardsForTest,
  createEonbotLocalActionCards,
  dismissEonbotLocalActionCard,
  listEonbotLocalReviewInbox,
  markEonbotLocalActionCardReviewed
} from '../../assets/js/chat/eonbot-action-cards.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W304 turns a publishing request into non-executable local requirements, never a publish action', () => {
  const plan = buildEonbotLocalActionCardPlan('Make a video and schedule it to YouTube');
  assert.equal(plan.matched, true);
  assert.ok(plan.cards.some((card) => card.kind === 'connection-required'));
  const preview = plan.cards.find((card) => card.kind === 'approval-packet-preview');
  assert.ok(preview);
  assert.match(preview.summary, /non-executable/i);
});

test('W304 Review Inbox stores no raw prompt or secret-shaped content and supports local review/dismissal only', () => {
  const storage = memoryStorage();
  const plan = buildEonbotLocalActionCardPlan('Upload and schedule to YouTube using password=should-not-be-stored');
  const created = createEonbotLocalActionCards(plan, { storage, now: 1000 });
  assert.equal(created.ok, true);
  assert.ok(created.cards.length >= 3);
  const raw = storage.getItem(EONBOT_ACTION_CARD_STORAGE_KEY);
  assert.doesNotMatch(raw, /password=should-not-be-stored|youtube using/i);
  assert.doesNotMatch(raw, /access[_-]?token|refresh[_-]?token|authorization[_-]?code|cookie\s*[:=]|client[_-]?secret/i);
  const preview = created.cards.find((card) => card.packetPreview);
  assert.equal(preview?.externalEffect, false);
  assert.equal(preview?.packetPreview?.executable, false);
  const reviewed = markEonbotLocalActionCardReviewed(created.cards[0].id, { storage, now: 1001 });
  assert.equal(reviewed.ok, true);
  const dismissed = dismissEonbotLocalActionCard(created.cards[1].id, { storage, now: 1002 });
  assert.equal(dismissed.ok, true);
  const inbox = listEonbotLocalReviewInbox({ storage, now: 1003 });
  assert.equal(inbox.find((card) => card.id === created.cards[0].id)?.status, 'reviewed');
  assert.equal(inbox.find((card) => card.id === created.cards[1].id)?.status, 'dismissed');
  clearEonbotLocalActionCardsForTest({ storage });
});

test('W304 cards expire instead of becoming a durable execution permit', () => {
  const storage = memoryStorage();
  const plan = buildEonbotLocalActionCardPlan('Create a campaign');
  const created = createEonbotLocalActionCards(plan, { storage, now: 1000 });
  const inbox = listEonbotLocalReviewInbox({ storage, now: 1000 + EONBOT_ACTION_CARD_TTL_MS + 1 });
  assert.ok(inbox.every((card) => card.status === 'expired'));
  assert.equal(markEonbotLocalActionCardReviewed(created.cards[0].id, { storage, now: 1000 + EONBOT_ACTION_CARD_TTL_MS + 2 }).ok, false);
});

test('W304 separates rollout-controlled referral/EONKEY status from blocked financial value systems', () => {
  const referral = buildEonbotLocalActionCardPlan('How do EONKEY referrals work?');
  assert.equal(referral.matched, true);
  assert.equal(referral.intent, 'referral-eonkeys');
  assert.equal(referral.cards[0]?.capabilityId, 'server-referral-eonkeys');
  assert.equal(referral.cards[0]?.route, '/eon-keys');
  assert.match(referral.cards[0]?.summary || '', /server-verified milestone/i);
  assert.match(referral.cards[0]?.summary || '', /share alone does not grant|share.*does not grant/i);

  const financial = buildEonbotLocalActionCardPlan('Can a referral pay me cash or crypto?');
  assert.equal(financial.intent, 'blocked-value');
  assert.equal(financial.cards[0]?.capabilityId, 'reward-wallet-referral');
});
