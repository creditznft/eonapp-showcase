import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildEonAiMemoryGrounding, rememberEonAiMemory } from '../../assets/js/ai-kernel/eon-ai-memory-ledger.js';
import { writeEonAiMemoryPolicy } from '../../assets/js/ai-kernel/eon-ai-memory-policy.js';
import { buildEonbotTurnContext } from '../../assets/js/chat/eonbot-context-pack.js';
import { buildEonbotRecentOutcomeContext } from '../../assets/js/chat/eonbot-recent-outcome-context.js';
import { recordEonCoreOutcome } from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import { buildEonClientResearchPacket } from '../../config/eon-client-research-contract.mjs';
import { inspectVexrailSensitiveData } from '../../functions/api/ai/vexrail.js';
import {
  getEonSponsoredAiContextTruth,
  inspectEonSponsoredAiMemoryCard,
  isEonSponsoredAiMemoryCardEligible,
  readEonSponsoredAiContextPolicy,
  resolveEonSponsoredAiContext,
  resolveEonSponsoredAiResearchPacket,
  projectEonSponsoredAiMemoryCardForPrompt,
  writeEonSponsoredAiContextPolicy
} from '../../assets/js/ai-kernel/eon-sponsored-ai-context-policy.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

function enableSponsoredMemory(storage, now = 100) {
  assert.equal(writeEonAiMemoryPolicy('ask', { storage, explicitUserAction: true, now }).ok, true);
  assert.equal(writeEonSponsoredAiContextPolicy(true, { storage, explicitUserAction: true, now: now + 1 }).ok, true);
}

test('Sponsored AI context is off by default and can change only from an explicit user action', () => {
  const storage = new MemoryStorage();
  assert.equal(readEonSponsoredAiContextPolicy({ storage }).enabled, false);
  const implicit = writeEonSponsoredAiContextPolicy(true, { storage, now: 1 });
  assert.equal(implicit.ok, false);
  assert.equal(implicit.reason, 'explicit-user-action-required');
  assert.equal(readEonSponsoredAiContextPolicy({ storage }).enabled, false);
  const explicit = writeEonSponsoredAiContextPolicy(true, { storage, explicitUserAction: true, now: 2 });
  assert.equal(explicit.ok, true);
  assert.equal(readEonSponsoredAiContextPolicy({ storage }).enabled, true);
});

test('Memory Off and guest Sponsored bootstrap always suppress saved EONBOT context', () => {
  const storage = new MemoryStorage();
  enableSponsoredMemory(storage);
  assert.equal(resolveEonSponsoredAiContext('Continue my website project', { storage, taskType: 'code', budgetMemoryLimit: 4 }).memoryLimit, 3);
  writeEonAiMemoryPolicy('off', { storage, explicitUserAction: true, now: 103 });
  const memoryOff = resolveEonSponsoredAiContext('Continue my website project', { storage, taskType: 'code', budgetMemoryLimit: 4 });
  assert.equal(memoryOff.memoryLimit, 0);
  assert.equal(memoryOff.recentOutcomeContext, false);
  assert.equal(memoryOff.reason, 'eon-memory-off');

  writeEonAiMemoryPolicy('ask', { storage, explicitUserAction: true, now: 104 });
  const guest = resolveEonSponsoredAiContext('Continue my website project', { storage, taskType: 'code', budgetMemoryLimit: 4, guestSponsoredBootstrap: true });
  assert.equal(guest.memoryLimit, 0);
  assert.equal(guest.recentOutcomeContext, false);
  assert.equal(guest.reason, 'guest-sponsored-bootstrap-isolated');
});

test('Sponsored context caps normal chat at two cards and coding/reasoning/project continuation at three while respecting model budget', () => {
  const storage = new MemoryStorage();
  enableSponsoredMemory(storage);
  assert.equal(resolveEonSponsoredAiContext('Tell me about EONAPP', { storage, taskType: 'chat', budgetMemoryLimit: 4 }).memoryLimit, 2);
  assert.equal(resolveEonSponsoredAiContext('Debug this JavaScript project', { storage, taskType: 'code', budgetMemoryLimit: 4 }).memoryLimit, 3);
  assert.equal(resolveEonSponsoredAiContext('Analyze this architecture', { storage, taskType: 'reasoning', budgetMemoryLimit: 4 }).memoryLimit, 3);
  assert.equal(resolveEonSponsoredAiContext('Continue my website from earlier', { storage, taskType: 'chat', budgetMemoryLimit: 4 }).memoryLimit, 3);
  assert.equal(resolveEonSponsoredAiContext('Debug this JavaScript project', { storage, taskType: 'code', budgetMemoryLimit: 1 }).memoryLimit, 1);
});

test('Sponsored memory uses a stricter sensitive-data filter before context leaves the browser', () => {
  for (const content of [
    'Contact email is alice.private@example.com',
    'Phone is +91 98765 43210',
    'Bank account is DE89370400440532013000',
    'My medical report says this diagnosis is private',
    'api_key=demo-value-requires-redaction',
    'Card 4111 1111 1111 1111'
  ]) {
    assert.equal(inspectEonSponsoredAiMemoryCard(content).ok, false, content);
  }
  assert.equal(inspectEonSponsoredAiMemoryCard({ content: 'Project Alpha website uses Cloudflare Workers and D1.', tags: ['alice.private@example.com'] }).ok, false);
  assert.equal(inspectEonSponsoredAiMemoryCard('Project Alpha website uses Cloudflare Workers and D1.').ok, true);
});

test('Sponsored memory requires prompt relevance so unrelated recent/pinned cards do not consume paid context tokens', () => {
  assert.equal(isEonSponsoredAiMemoryCardEligible({ kind: 'project', tags: ['cloudflare'], content: 'Project Alpha website uses Cloudflare Workers.' }, 'Continue the Cloudflare website project'), true);
  assert.equal(isEonSponsoredAiMemoryCardEligible({ kind: 'creator', tags: ['radio'], content: 'Preferred radio genre is techno.' }, 'Debug my Cloudflare website project'), false);
});

test('Sponsored grounding reuses provider-neutral memory retrieval with hard project isolation, bounded relevance and redaction', () => {
  const storage = new MemoryStorage();
  const now = 10_000;
  enableSponsoredMemory(storage, now);
  rememberEonAiMemory({ kind: 'project', projectId: 'alpha', content: 'Project Alpha website uses Cloudflare Workers and D1.', tags: ['website', 'cloudflare'] }, { storage, consent: true, now: now + 2 });
  rememberEonAiMemory({ kind: 'project', projectId: 'beta', content: 'Project Beta website uses a different private deployment path.', tags: ['website'] }, { storage, consent: true, now: now + 3 });
  rememberEonAiMemory({ kind: 'context', content: 'Contact email is alice.private@example.com', tags: ['email'] }, { storage, consent: true, now: now + 4 });
  rememberEonAiMemory({ kind: 'creator', content: 'Preferred radio genre is techno.', tags: ['radio'] }, { storage, consent: true, now: now + 5 });

  const resolved = resolveEonSponsoredAiContext('Continue the Alpha Cloudflare website project', { storage, taskType: 'code', budgetMemoryLimit: 4 });
  const grounding = buildEonAiMemoryGrounding('Continue the Alpha Cloudflare website project', {
    storage,
    projectId: 'alpha',
    limit: resolved.memoryLimit,
    cardFilter: resolved.memoryCardFilter,
    promptCardProjector: resolved.memoryPromptCardProjector,
    now: now + 6
  });
  assert.ok(grounding.cards.length >= 1);
  assert.ok(grounding.cards.length <= 3);
  assert.ok(grounding.cards.some((card) => card.projectId === 'alpha'));
  assert.equal(grounding.cards.some((card) => card.projectId === 'beta'), false);
  assert.equal(grounding.cards.some((card) => /alice\.private@example\.com/i.test(card.content)), false);
  assert.equal(grounding.cards.some((card) => /radio genre/i.test(card.content)), false);
  assert.match(grounding.prompt, /untrusted USER MEMORY DATA/i);
  assert.match(grounding.prompt, /"scope":"project"/);
  assert.doesNotMatch(grounding.prompt, /"scope":"project:alpha"|"tags":/);
  assert.deepEqual(projectEonSponsoredAiMemoryCardForPrompt(grounding.cards[0]).tags, undefined);
});

test('Sponsored recent-outcome projection keeps continuation help but strips route metadata', () => {
  const storage = new MemoryStorage();
  const recorded = recordEonCoreOutcome({
    kind: 'project-resume', route: '/projects', source: 'projects-local', receiptId: 'hidden-project-receipt', verified: true, verifiedAt: 20_000
  }, { storage, now: 20_000 });
  assert.equal(recorded.ok, true);
  const localProjection = buildEonbotRecentOutcomeContext('Continue my last project', { storage });
  assert.equal(localProjection.outcomes[0].route, '/projects');
  const sponsoredProjection = buildEonbotRecentOutcomeContext('Continue my last project', { storage, includeRoute: false });
  assert.equal(sponsoredProjection.count, 1);
  assert.equal('route' in sponsoredProjection.outcomes[0], false);
  assert.match(sponsoredProjection.prompt, /resumed Project/);
  assert.doesNotMatch(sponsoredProjection.prompt, /hidden-project-receipt/);
});

test('Sponsored Vexrail accepts only an explicit one-turn bounded client research packet and never gains browser/tool authority', () => {
  const packet = buildEonClientResearchPacket({
    query: 'Research the current launch options',
    sources: [
      { id: 'eonrs_source0001', title: 'Source 1', url: 'https://example.com/one', excerpt: 'Public launch evidence one. '.repeat(140), method: 'manual-paste', capturedAt: '2026-08-22T00:00:00.000Z' },
      { id: 'eonrs_source0002', title: 'Source 2', url: 'https://example.com/two', excerpt: 'Public launch evidence two. '.repeat(140), method: 'manual-paste', capturedAt: '2026-08-22T00:00:00.000Z' },
      { id: 'eonrs_source0003', title: 'Private contact', url: 'https://example.com/private', excerpt: 'Contact email is alice.private@example.com', method: 'manual-paste', capturedAt: '2026-08-22T00:00:00.000Z' },
      { id: 'eonrs_source0004', title: 'Source 4', url: 'https://example.com/four', excerpt: 'Public launch evidence four.', method: 'manual-paste', capturedAt: '2026-08-22T00:00:00.000Z' }
    ]
  });
  const sponsored = resolveEonSponsoredAiResearchPacket(packet);
  assert.equal(sponsored.clientOnly, true);
  assert.equal(sponsored.sourceCount, 3);
  assert.equal(sponsored.sources.some((source) => /alice\.private@example\.com/i.test(source.excerpt)), false);
  assert.ok(sponsored.sources.every((source) => source.excerpt.length <= 2400));
  assert.ok(sponsored.sources.reduce((sum, source) => sum + source.excerpt.length, 0) <= 6000);
  assert.match(sponsored.prompt, /untrusted SOURCE DATA/i);
  assert.match(sponsored.prompt, /do not claim live browsing/i);

  const guest = resolveEonSponsoredAiResearchPacket(packet, { guestSponsoredBootstrap: true });
  assert.equal(guest.sourceCount, 0);

  const runtime = fs.readFileSync('assets/js/chat/ai-runtime.js', 'utf8');
  assert.match(runtime, /resolveEonSponsoredAiContext/);
  assert.match(runtime, /resolveEonSponsoredAiResearchPacket/);
  assert.equal((runtime.match(/memoryLimit: isSponsoredVexrail \? sponsoredContext\.memoryLimit : cappedBudget\.memoryLimit/g) || []).length, 2);
  assert.equal((runtime.match(/recentOutcomeContext: isSponsoredVexrail \? sponsoredContext\.recentOutcomeContext : undefined/g) || []).length, 2);
  assert.equal((runtime.match(/memoryCardFilter: isSponsoredVexrail \? sponsoredContext\.memoryCardFilter : undefined/g) || []).length, 2);
  assert.equal((runtime.match(/memoryPromptCardProjector: isSponsoredVexrail \? sponsoredContext\.memoryPromptCardProjector : undefined/g) || []).length, 2);
  assert.equal((runtime.match(/recentOutcomeIncludeRoute: isSponsoredVexrail \? sponsoredContext\.recentOutcomeIncludeRoute : undefined/g) || []).length, 2);
  assert.equal((runtime.match(/const queuedClientResearchPacket = isForgeCodeTask \? null : consumeEonClientResearchPacket/g) || []).length, 2);
  assert.equal((runtime.match(/resolveEonSponsoredAiResearchPacket\(queuedClientResearchPacket, \{ guestSponsoredBootstrap \}\)/g) || []).length, 2);
  assert.match(runtime, /never claim autonomous browsing, hidden web access/i);
});


test('Vexrail server sensitive-data defense accepts normal source-controlled EONBOT system grounding', () => {
  for (const prompt of [
    'What can EONAPP do?',
    'Help me debug a JavaScript project',
    'Explain EONAPP privacy and Local AI'
  ]) {
    const system = buildEonbotTurnContext(prompt, {
      memoryLimit: 0,
      recentOutcomeContext: false,
      maxKnowledgeChars: 2200
    });
    const inspection = inspectVexrailSensitiveData([
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ]);
    assert.equal(inspection.ok, true, `${prompt}: ${inspection.reason || inspection.signal || 'unexpected rejection'}`);
  }
});

test('Sponsored context truth documents the cheap/privacy-safe boundary and never claims training', () => {
  const truth = getEonSponsoredAiContextTruth();
  assert.equal(truth.defaultEnabled, false);
  assert.equal(truth.eonMemoryOffOverrides, true);
  assert.equal(truth.maximumChatMemoryCards, 2);
  assert.equal(truth.maximumDeepMemoryCards, 3);
  assert.equal(truth.relevanceRequired, true);
  assert.equal(truth.sponsoredMemoryMetadataMinimized, true);
  assert.equal(truth.sponsoredRecentOutcomeRouteIncluded, false);
  assert.equal(truth.clientResearchAutomaticSharing, false);
  assert.equal(truth.clientResearchExplicitOneTurnSharing, true);
  assert.equal(truth.clientCapturedWebEvidence, true);
  assert.equal(truth.providerNativeSearchThroughVexrail, false);
  assert.equal(truth.maximumResearchSources, 3);
  assert.equal(truth.autonomousBrowserControl, false);
  assert.equal(truth.wholeLedgerSharing, false);
  assert.equal(truth.actionAuthority, false);
  assert.equal(truth.foundationModelTraining, false);
});
