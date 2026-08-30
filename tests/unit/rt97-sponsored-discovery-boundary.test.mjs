import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EON_SPONSORED_DISCOVERY_PROVIDER,
  sanitizeSponsoredDiscoveryIntent,
  getSponsoredDiscoveryRuntimeConfig
} from '../../config/rt97-sponsored-discovery-contract.mjs';
import { buildVexrailSponsoredDiscoveryInput } from '../../functions/_shared/eon-sponsored-discovery-runtime.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('RT97 Sponsored Discovery rejects private context, missing review and secret-like outbound text', () => {
  assert.equal(sanitizeSponsoredDiscoveryIntent({ query: 'find a CRM', explicitReview: false }).reason, 'explicit_review_required');
  assert.equal(sanitizeSponsoredDiscoveryIntent({ query: 'find a CRM', explicitReview: true, messages: [] }).reason, 'private_context_field_rejected');
  assert.equal(sanitizeSponsoredDiscoveryIntent({ query: 'find a CRM', explicitReview: true, localAnswer: 'private local answer' }).reason, 'private_context_field_rejected');
  assert.equal(sanitizeSponsoredDiscoveryIntent({ query: 'use api key sk-abcdefghijklmnop', explicitReview: true }).reason, 'secret_like_intent_rejected');
  const safe = sanitizeSponsoredDiscoveryIntent({ query: ' lightweight CRM for a studio ', category: 'software', maxResults: 99, explicitReview: true });
  assert.equal(safe.ok, true);
  assert.deepEqual(safe.intent, { query: 'lightweight CRM for a studio', category: 'software', maxResults: 5 });
  assert.deepEqual(safe.outboundFields, ['query', 'category', 'maxResults']);
  assert.equal(safe.fullConversationForwarded, false);
  assert.equal(safe.localAnswerForwarded, false);
  assert.equal(safe.privateMemoryForwarded, false);
  assert.equal(safe.providerKeysForwarded, false);
  assert.equal(safe.guestOneShotUsed, false);
});

test('RT97 Sponsored Discovery is explicitly Vexrail one-turn and reuses Vexrail authority instead of a second provider', () => {
  const config = getSponsoredDiscoveryRuntimeConfig();
  assert.equal(EON_SPONSORED_DISCOVERY_PROVIDER, 'vexrail-one-turn');
  assert.equal(config.provider, 'vexrail-one-turn');
  assert.equal(config.requiresSignedIn, true);
  assert.equal(config.requiresExplicitReview, true);
  assert.equal(config.usesVexrailAuthority, true);
  assert.equal(config.usesSeparateProviderCredential, false);
  assert.equal(config.usesSeparateProviderEndpoint, false);
});

test('RT97 Sponsored Discovery builds only a bounded reviewed one-turn Vexrail request', () => {
  const sanitized = sanitizeSponsoredDiscoveryIntent({ query: 'best lightweight CRM for a two-person studio', category: 'software', maxResults: 4, explicitReview: true });
  const input = buildVexrailSponsoredDiscoveryInput(sanitized, 'turnstile-proof-token');
  assert.equal(input.messages.length, 2);
  assert.equal(input.messages[0].role, 'system');
  assert.match(input.messages[0].content, /Sponsored Discovery/);
  assert.equal(input.messages[1].role, 'user');
  assert.match(input.messages[1].content, /lightweight CRM/);
  assert.equal(input.sponsoredOptIn, true);
  assert.equal(input.guestOneShot, false);
  assert.equal(input.stream, false);
  assert.equal(input.max_tokens, 512);
  assert.equal(input.turnstileToken, 'turnstile-proof-token');
  const serialized = JSON.stringify(input);
  assert.doesNotMatch(serialized, /private local answer|apiKey|providerKey|attachments|saved memory/i);
});

test('RT97 Sponsored Discovery runtime delegates to the same Vexrail geo, Turnstile, economics and rate-limit authority', () => {
  const runtime = read('functions/_shared/eon-sponsored-discovery-runtime.js');
  const vexrail = read('functions/api/ai/vexrail.js');
  assert.match(runtime, /executeVexrailRequest/);
  assert.match(runtime, /requireSignedIn:\s*true/);
  assert.match(runtime, /profitabilityCohort:\s*'local_byok_discovery'/);
  assert.match(runtime, /sponsored_discovery_account_hour/);
  assert.match(vexrail, /verifyVexrailHuman/);
  assert.match(vexrail, /selectVexrailModelRoute/);
  assert.match(vexrail, /readVexrailProfitabilityGovernor/);
  assert.match(vexrail, /vexrail_country_token_daily/);
  assert.match(vexrail, /vexrail_global_token_daily/);
  assert.match(vexrail, /inputOverride/);
});

test('RT97 Local AI UI keeps Sponsored Discovery separate, signed-in, reviewed, Turnstile verified and safely linked', () => {
  const client = read('assets/js/sponsored-discovery/eon-sponsored-discovery.js');
  const page = read('assets/js/local-ai/local-ai-page.js');
  const route = read('functions/api/discovery/sponsored.js');
  assert.match(client, /Review outbound intent/);
  assert.match(client, /Send this reviewed intent/);
  assert.match(client, /Signed-in users only/);
  assert.match(client, /guest one-shot/);
  assert.match(client, /acquireVexrailTurnstileToken/);
  assert.match(client, /action:\s*'sponsored_gemini'/);
  assert.match(client, /rel = 'sponsored noopener noreferrer'/);
  assert.match(client, /Local AI or BYOK answer stays private and ad-free/);
  assert.match(client, /fetch\('\/api\/discovery\/sponsored'/);
  assert.match(page, /renderSponsoredDiscoveryPanel\(state\.sponsoredDiscovery\)/);
  assert.match(page, /bindSponsoredDiscoveryPanel\(root, state\.sponsoredDiscovery/);
  assert.match(route, /enforceTrustSameOrigin/);
  assert.match(route, /readBoundedJson/);
  assert.match(route, /answer: result\.answer/);
});

test('RT97 reconciles the W237 legacy fence: automatic injection stays disabled while explicit Vexrail discovery is available', async () => {
  const legacy = await import('../../config/sponsored-discovery-policy.mjs');
  const status = legacy.getSponsoredDiscoveryStatus();
  assert.equal(legacy.SPONSORED_DISCOVERY_ACTIVE, false);
  assert.equal(legacy.SPONSORED_DISCOVERY_EXPLICIT_TOOL_AVAILABLE, true);
  assert.equal(status.automaticInsertionActive, false);
  assert.equal(status.explicitToolAvailable, true);
  assert.equal(status.explicitToolSurface, '/local-ai');
  assert.equal(legacy.canRenderSponsoredDiscovery('/local-ai').ok, false);
  assert.match(status.reason, /Vexrail authority/);
});
