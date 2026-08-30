import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_AI_COST_BOUNDARY,
  EON_KEY_UNLOCK_MENU,
  EON_LOCKED_FEATURE_UNLOCK_COPY,
  EON_REFERRAL_REWARD_MATRIX,
  EON_SUBSCRIPTION_TIERS,
  getEonUnlockMenu,
  getTierUnlockPaths,
  validateEonKeysCatalog
} from '../../assets/js/referrals/eon-keys-catalog.js';
import { EONAPP_PRODUCT_HIERARCHY } from '../../assets/js/shell/eon-shell-navigation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W616B EON Keys catalog validates as non-cash feature unlocks', () => {
  const result = validateEonKeysCatalog();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(EON_AI_COST_BOUNDARY.platformPaidHostedGeneration, false);
  assert.equal(EON_AI_COST_BOUNDARY.userLocalAiAllowed, true);
  assert.equal(EON_AI_COST_BOUNDARY.userProviderApiKeyAllowed, true);
});

test('W616B subscription tiers map premium capability to refer-to-unlock paths', () => {
  assert.deepEqual(EON_SUBSCRIPTION_TIERS.map((tier) => tier.id), ['free', 'plus', 'studio', 'power', 'max']);
  assert.equal(EON_SUBSCRIPTION_TIERS.find((tier) => tier.id === 'plus')?.trialPublic, true);
  for (const tierId of ['plus', 'studio', 'power', 'max']) {
    const tier = EON_SUBSCRIPTION_TIERS.find((item) => item.id === tierId);
    assert.equal(tier?.trialPublic, true, `${tierId} public trial`);
    assert.equal(tier?.trialDays, 7, `${tierId} trial days`);
  }
  for (const tierId of ['plus', 'studio', 'power', 'max']) {
    const paths = getTierUnlockPaths(tierId).unlocks;
    assert.ok(paths.length > 0, `${tierId} has no key unlock path`);
  }
});

test('W616B AI workflow unlocks require local AI or user-owned API keys', () => {
  const aiUnlocks = EON_KEY_UNLOCK_MENU.filter((unlock) => unlock.category === 'ai-workflow');
  assert.ok(aiUnlocks.length >= 4);
  for (const unlock of aiUnlocks) {
    assert.equal(unlock.platformPaidAiCost, false, unlock.id);
    assert.equal(unlock.requiresUserLocalOrOwnProviderKey, true, unlock.id);
  }
});

test('W616B key menus unlock real app capability beyond cosmetics', () => {
  assert.ok(getEonUnlockMenu({ keyType: 'signal' }).some((unlock) => unlock.category === 'ai-workflow'));
  assert.ok(getEonUnlockMenu({ keyType: 'builder' }).some((unlock) => ['workflow', 'creator-preset', 'limit'].includes(unlock.category)));
  assert.ok(getEonUnlockMenu({ keyType: 'power' }).some((unlock) => unlock.planEquivalent === 'max'));
  const categories = new Set(EON_KEY_UNLOCK_MENU.map((unlock) => unlock.category));
  for (const category of ['limit', 'template', 'workflow', 'ai-workflow', 'automation', 'showcase']) assert.equal(categories.has(category), true, category);
  assert.equal(categories.has('feature-pass'), false, 'EONKEYS must not unlock whole plan passes');
});

test('W616B referral matrix grants immediate feature keys, not renewal discounts', () => {
  const text = JSON.stringify(EON_REFERRAL_REWARD_MATRIX);
  assert.match(text, /Signal Key/);
  assert.match(text, /Builder Key/);
  assert.match(text, /Power Key/);
  assert.doesNotMatch(text, /free month|renewal discount|subscription extension|commission|cashback|wallet|crypto/i);
});

test('W616B locked feature copy presents pay trial or refer path', () => {
  assert.match(EON_LOCKED_FEATURE_UNLOCK_COPY.generic, /subscribe|trial|EON Keys/i);
  assert.match(EON_LOCKED_FEATURE_UNLOCK_COPY.ai, /local AI runtime|own provider\/API key/i);
});

test('W616B shell simplifies main navigation and moves account utilities to profile hub', () => {
  assert.deepEqual(EONAPP_PRODUCT_HIERARCHY.map((item) => item.id), ['chat', 'projects', 'library', 'forge', 'eoncity', 'vault']);
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(shell, /Invite & EON Keys/);
  assert.match(shell, /Billing status & plan/);
  assert.match(shell, /Backup Capsule/);
  assert.match(shell, /Automations \/ EON Flow/);
  assert.match(shell, /Studio \/ Collection/);
  assert.doesNotMatch(shell, /<a href="\/billing" data-eon-tooltip="Billing status"/);
});

test('W616B eon keys page presents live subscriptions with proof-gated key redemption', () => {
  const page = read('eon-keys.html');
  const routes = read('config/route-contract.mjs');
  assert.match(page, /EON Keys/);
  assert.match(page, /data-commercial-active="true"/);
  assert.match(page, /data-key-redemption-active="false"/);
  assert.match(page, /data-monetization="subscription"/);
  assert.match(routes, /id: 'eon-keys'/);
});
