import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getEonWebPushConfig,
  getEonWebPushTruth,
  normalizeEonPushSubscription,
  openEonPushSubscription,
  sealEonPushSubscription,
  sendEonWebPush
} from '../../functions/_shared/eon-web-push.js';
import {
  EON_CORE_OUTCOME_POLICIES,
  recordEonCoreOutcome
} from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import { syncEonCoreOutcomesToCity } from '../../assets/js/contracts/city/eon-city-progress-bridge.js';
import { resolveEonCityPreparedRoute } from '../../assets/js/city/eon-city-eonbot-quick-work.js';
import { readEonCityProductiveRpgStore } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { buildEonShareCardPlan, getEonViralShareTruth, shareEonLocalMedia } from '../../assets/js/share/eon-viral-share-kit.js';
import { createEonSharePack, getEonSharePackTruth, shareEonSharePack } from '../../assets/js/share/eon-share-pack.js';
import { buildEonRemixShareText, createEonRemixCard, EON_REMIX_CARD_KINDS, getEonRemixCardTruth, shareEonRemixCard } from '../../assets/js/share/eon-remix-card.js';
import { buildEonRemixDeepLink, consumeEonRemixDeepLinkFromLocation, getEonRemixDeepLinkTruth, parseEonRemixDeepLinkHash } from '../../assets/js/share/eon-remix-deep-link.js';
import { createEonOutputShareHandoff, getEonOutputShareHandoffTruth } from '../../assets/js/share/eon-output-share-handoff.js';
import { getEonCreatorOutcomeActivityBridgeTruth, recordEonCreatorOutcomeActivity } from '../../assets/js/notifications/eon-creator-outcome-activity-bridge.js';
import { createEonNotificationCenter, renderEonNotificationCenterMarkup } from '../../assets/js/notifications/eon-notification-center.js';
import { getEonNotificationRouteTruth, normalizeEonNotificationRoute } from '../../config/eon-notification-route-authority.mjs';
import {
  getEonRetentionNotificationScaleTruth,
  runEonRetentionNotificationCycle,
  runEonRetentionNotificationQueueBatch
} from '../../workers/eon-retention-notifications/src/index.js';
import {
  EON_DEVICE_NOTIFICATION_SUBSCRIPTION_KEY,
  EON_RETURN_REMINDER_KEY,
  cancelEonReturnReminder,
  getEonReturnReminderStatus,
  scheduleEonReturnReminder
} from '../../assets/js/notifications/eon-device-notification-delivery.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const read = (relative) => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const b64 = (bytes) => Buffer.from(bytes).toString('base64url');

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

async function pushFixture() {
  const client = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const clientPublic = new Uint8Array(await crypto.subtle.exportKey('raw', client.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const vapid = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const vapidPublic = new Uint8Array(await crypto.subtle.exportKey('raw', vapid.publicKey));
  const vapidPrivateJwk = await crypto.subtle.exportKey('jwk', vapid.privateKey);
  const env = {
    EON_PUSH_ROLLOUT: 'testing',
    EON_PUSH_VAPID_PUBLIC_KEY: b64(vapidPublic),
    EON_PUSH_VAPID_PRIVATE_KEY: vapidPrivateJwk.d,
    EON_PUSH_VAPID_SUBJECT: 'mailto:security@example.com',
    EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY: 'test-only-encryption-key-at-least-thirty-two-bytes'
  };
  const subscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/institutional-test-endpoint',
    expirationTime: null,
    keys: { p256dh: b64(clientPublic), auth: b64(auth) }
  };
  return { env, subscription };
}

test('Institutional Web Push validates browser endpoints and encrypts subscription custody at rest', async () => {
  const { env, subscription } = await pushFixture();
  const normalized = normalizeEonPushSubscription(subscription);
  assert.equal(normalized.endpoint, subscription.endpoint);
  assert.throws(() => normalizeEonPushSubscription({ ...subscription, endpoint: 'https://attacker.example/push' }), /push_endpoint_not_allowed/);
  const sealed = await sealEonPushSubscription(subscription, env.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY);
  assert.ok(sealed.encryptedSubscription.length > 40);
  assert.ok(sealed.endpointHash.length > 20);
  assert.equal(Buffer.from(sealed.encryptedSubscription, 'base64url').byteLength, Buffer.byteLength(JSON.stringify(normalized)) + 16);
  const reopened = await openEonPushSubscription(sealed, env.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY);
  assert.deepEqual(reopened, normalized);
  const config = getEonWebPushConfig(env);
  assert.equal(config.configured, true);
  assert.equal(config.applicationServerKey, env.EON_PUSH_VAPID_PUBLIC_KEY);
  const truth = getEonWebPushTruth();
  assert.equal(truth.subscriptionEncryptedAtRest, true);
  assert.equal(truth.marketingConsentImplied, false);
});

test('Institutional Web Push emits VAPID + aes128gcm and never sends plaintext JSON', async () => {
  const { env, subscription } = await pushFixture();
  let observed = null;
  const result = await sendEonWebPush({
    subscription,
    env,
    payload: { title: 'Continue in EONAPP', body: 'Your requested reminder is ready.', route: '/create', tag: 'test' },
    fetchImpl: async (url, init) => { observed = { url, init }; return new Response('', { status: 201 }); }
  });
  assert.equal(result.ok, true);
  assert.equal(observed.url, subscription.endpoint);
  assert.equal(observed.init.headers['content-encoding'], 'aes128gcm');
  assert.match(observed.init.headers.authorization, /^vapid t=.+, k=.+/);
  const bytes = new Uint8Array(observed.init.body);
  assert.ok(bytes.byteLength > 100);
  assert.equal(Buffer.from(bytes).includes(Buffer.from('Continue in EONAPP')), false);
  await assert.rejects(() => sendEonWebPush({ subscription, env, payload: { title: 'api key: secret', route: '/' }, fetchImpl: async () => new Response('', { status: 201 }) }), /push_payload_sensitive_text_blocked/);
});

test('Creator Image, Video, Music and Radio outcomes all project into Create Forge without private content', () => {
  const kinds = new Set(EON_CORE_OUTCOME_POLICIES.map((entry) => entry.kind));
  for (const kind of ['creator-image-verified', 'creator-video-verified', 'creator-music-exported', 'creator-radio-station']) assert.equal(kinds.has(kind), true, kind);
  const storage = new MemoryStorage();
  const fixtures = [
    ['creator-image-verified', '/local-ai', 'comfyui-image-lab', 'image:abc'],
    ['creator-video-verified', '/local-ai', 'comfyui-video-lab', 'video:def'],
    ['creator-music-exported', '/create', 'eon-music-studio', 'music:browser'],
    ['creator-music-exported', '/create', 'eon-acestep-local', 'music:acestep'],
    ['creator-music-exported', '/create', 'eon-direct-byok-elevenlabs', 'music:hosted'],
    ['creator-radio-station', '/create', 'eon-radio-station', 'radio:jkl']
  ];
  for (const [kind, route, source, receiptId] of fixtures) {
    const result = recordEonCoreOutcome({ kind, route, source, receiptId, verified: true }, { storage, environment: null, now: 1000 + fixtures.indexOf(fixtures.find((row) => row[0] === kind)) });
    assert.equal(result.ok, true, kind);
    assert.equal(result.outcome.stationId, 'create-forge');
    assert.equal(result.outcome.containsPrivateContent, false);
  }
  const projected = syncEonCoreOutcomesToCity({ storage, environment: null, now: 5000 });
  assert.equal(projected.ok, true);
  assert.equal(projected.created.length, 6);
  assert.equal(projected.created.every((receipt) => receipt.stationId === 'create-forge' && receipt.explicitClaimRequired && !receipt.xpGranted), true);
  assert.doesNotMatch(JSON.stringify(projected.created), /prompt|mediaBlob|providerKey|fileContent/i);
});



test('Hosted Image and Video saves complete the legacy Productive RPG creator mission through the same redacted City bridge', () => {
  const fixtures = [
    ['creator-image-verified', '/create', 'eon-direct-byok-fal', 'hosted:image:fal'],
    ['creator-video-verified', '/create', 'eon-direct-byok-replicate', 'hosted:video:replicate']
  ];
  for (const [index, [kind, route, source, receiptId]] of fixtures.entries()) {
    const storage = new MemoryStorage();
    const recorded = recordEonCoreOutcome({ kind, route, source, receiptId, verified: true }, { storage, environment: null, now: 7100 + index });
    assert.equal(recorded.ok, true, source);
    assert.equal(recorded.outcome.containsPrivateContent, false);
    const projected = syncEonCoreOutcomesToCity({ storage, environment: null, now: 7200 + index });
    assert.equal(projected.ok, true, source);
    assert.equal(projected.created.length, 1, source);
    assert.equal(projected.created[0].stationId, 'create-forge', source);
    assert.equal(projected.created[0].explicitClaimRequired, true, source);
    assert.equal(projected.created[0].xpGranted, false, source);
    const productive = readEonCityProductiveRpgStore(storage);
    assert.equal(productive.missions.creator.state, 'completed', source);
    assert.equal(productive.missions.creator.outcome?.verified, true, source);
    assert.equal(productive.missions.creator.outcome?.source, source, source);
    assert.equal(productive.missions.creator.outcome?.route, '/create', source);
    assert.equal(productive.missions.creator.outcome?.paymentOrRewardClaimed, false, source);
    assert.doesNotMatch(JSON.stringify(productive.missions.creator.outcome), /prompt|providerKey|mediaBlob|fileContent/i);
  }
});

test('Image and Video receipts may truthfully originate inside EONCITY while staying on the same shared Creator authority', () => {
  const fixtures = [
    ['creator-image-verified', 'comfyui-image-lab', 'city:image:local'],
    ['creator-video-verified', 'comfyui-video-lab', 'city:video:local'],
    ['creator-image-verified', 'eon-direct-byok-fal', 'city:image:hosted'],
    ['creator-video-verified', 'eon-direct-byok-replicate', 'city:video:hosted']
  ];
  for (const [index, [kind, source, receiptId]] of fixtures.entries()) {
    const storage = new MemoryStorage();
    const result = recordEonCoreOutcome({ kind, route:'/eoncity', source, receiptId, verified:true }, { storage, environment:null, now:8000 + index });
    assert.equal(result.ok, true, `${kind}:${source}`);
    assert.equal(result.outcome.route, '/eoncity');
    const projected = syncEonCoreOutcomesToCity({ storage, environment:null, now:9000 + index });
    assert.equal(projected.created.length, 1);
    assert.equal(readEonCityProductiveRpgStore(storage).missions.creator.outcome?.route, '/eoncity');
  }
});

test('Music and Radio receipts may truthfully originate inside EONCITY on the shared Creator authority', () => {
  const fixtures = [
    ['creator-music-exported', 'eon-music-studio'],
    ['creator-music-exported', 'eon-acestep-local'],
    ['creator-music-exported', 'eon-direct-byok-elevenlabs'],
    ['creator-radio-station', 'eon-radio-station']
  ];
  for (const [index, [kind, source]] of fixtures.entries()) {
    const storage = new MemoryStorage();
    const result = recordEonCoreOutcome({ kind, route: '/eoncity', source, receiptId: `city-music:${index}`, verified: true }, { storage, environment: null, now: 2300 + index });
    assert.equal(result.ok, true, `${kind}:${source}`);
    assert.equal(result.outcome.route, '/eoncity');
    const projected = syncEonCoreOutcomesToCity({ storage, environment: null, now: 2400 + index });
    assert.equal(projected.created.length, 1);
  }
  const musicPolicy = EON_CORE_OUTCOME_POLICIES.find((entry) => entry.kind === 'creator-music-exported');
  const radioPolicy = EON_CORE_OUTCOME_POLICIES.find((entry) => entry.kind === 'creator-radio-station');
  assert.ok(musicPolicy.routes.includes('/eoncity'));
  assert.ok(radioPolicy.routes.includes('/eoncity'));
});

test('Music Core receipts preserve source-specific native authorities across browser, ACE-Step and hosted BYOK', () => {
  const storage = new MemoryStorage();
  const fixtures = [
    ['eon-music-studio', 'browser-music-wav-export'],
    ['eon-acestep-local', 'acestep-local-music-positive-path'],
    ['eon-direct-byok-elevenlabs', 'direct-byok-hosted-music-positive-path']
  ];
  for (const [index, [source, expectedAuthority]] of fixtures.entries()) {
    const result = recordEonCoreOutcome({
      kind: 'creator-music-exported', route: '/create', source,
      receiptId: `music:authority:${index}`, verified: true
    }, { storage, environment: null, now: 2100 + index });
    assert.equal(result.ok, true, source);
    assert.equal(result.outcome.nativeAuthority, expectedAuthority, source);
    assert.equal(result.outcome.containsPrivateContent, false);
  }
  const policy = EON_CORE_OUTCOME_POLICIES.find((entry) => entry.kind === 'creator-music-exported');
  assert.deepEqual(policy.sources, ['eon-music-studio', 'eon-acestep-local', 'eon-direct-byok-elevenlabs']);
  assert.equal(policy.sourceAuthorities['eon-music-studio'], 'browser-music-wav-export');
  assert.equal(policy.sourceAuthorities['eon-acestep-local'], 'acestep-local-music-positive-path');
  assert.equal(policy.sourceAuthorities['eon-direct-byok-elevenlabs'], 'direct-byok-hosted-music-positive-path');
});

test('Historical browser Music receipts remain readable after adding ACE-Step and hosted authorities', async () => {
  const { EON_CORE_OUTCOME_SCHEMA, EON_CORE_OUTCOME_STORAGE_KEY, readEonCoreOutcomeStore } = await import('../../assets/js/contracts/outcomes/eon-core-outcome-authority.js');
  const historical = {
    schema: EON_CORE_OUTCOME_SCHEMA,
    revision: 1,
    updatedAt: 1000,
    outcomes: [{
      schema: EON_CORE_OUTCOME_SCHEMA,
      outcomeId: 'creator-music-exported:music:historical',
      kind: 'creator-music-exported', stationId: 'create-forge', missionId: 'creator',
      route: '/create', source: 'eon-music-studio', nativeAuthority: 'browser-music-wav-export',
      evidenceReceiptId: 'music:historical', verified: true, verifiedAt: 1000,
      metadataDigest: 'fnv1a32:12345678'
    }]
  };
  const storage = new MemoryStorage({ [EON_CORE_OUTCOME_STORAGE_KEY]: JSON.stringify(historical) });
  const store = readEonCoreOutcomeStore({ storage });
  assert.equal(store.outcomes.length, 1);
  assert.equal(store.outcomes[0].nativeAuthority, 'browser-music-wav-export');
});

test('EONCITY uses maintained Chat and Creator Image/Video/Music surfaces instead of City-only AI forks', () => {
  const source = read('assets/js/work-surface/adapters/eon-productivity-panel.js');
  const quick = read('assets/js/city/eon-city-eonbot-quick-work.js');
  assert.match(source, /createAIReply/);
  assert.match(source, /loadAISettings/);
  assert.match(source, /buildEonbotCommandHubPlan/);
  assert.match(source, /const plan = buildEonbotCommandHubPlan\(prompt,[\s\S]*?if \(plan\.matched\)[\s\S]*?return;[\s\S]*?const result = await createAIReply/);
  assert.match(source, /data-eon-work-chat-prepared-create/);
  assert.match(source, /creatorMode/);
  assert.match(quick, /buildEonbotCommandHubPlan/);
  assert.match(quick, /const plan = buildEonbotCommandHubPlan\(text,[\s\S]*?if \(plan\.matched\)[\s\S]*?return;[\s\S]*?const reply = await createAIReply/);
  assert.match(source, /renderUnifiedCreatorWorkspace/);
  assert.match(source, /renderEonMusicStudio/);
  assert.match(source, /Image/);
  assert.match(source, /Video/);
  assert.match(source, /Music/);
});

test('EONCITY Creator embeds canonical local and hosted Image/Video execution and keeps prepared prompts transient', () => {
  const source = read('assets/js/work-surface/adapters/eon-productivity-panel.js');
  const html = read('eoncity.html');
  for (const token of ['renderComfyUiImageLab', 'bindComfyUiImageLab', 'renderComfyUiVideoLab', 'bindComfyUiVideoLab', 'renderDirectByokWorkspace', 'bindDirectByokWorkspace', 'renderEonMusicStudio']) assert.match(source, new RegExp(token));
  assert.match(source, /embedded:\s*true/);
  assert.match(source, /let pendingCityCreatorDraft = null/);
  assert.match(source, /pendingCityCreatorDraft = \{ mode: creatorMode, prompt: prompt\.slice\(0, 1200\) \}/);
  assert.match(source, /pendingCityCreatorDraft = null;[\s\S]*data-direct-media-prompt/);
  assert.equal(source.includes('localStorage.setItem') && source.includes('pendingCityCreatorDraft') && source.includes('localStorage.setItem(\"pendingCityCreatorDraft'), false);
  assert.match(source, /ensureCityCreatorStyles/);
  assert.match(source, /eon-create-hub\.css/);
  assert.match(source, /local-ai\.css/);
  assert.doesNotMatch(html, /eon-create-hub\.css/);
  assert.doesNotMatch(html, /local-ai\.css/);
});

test('Verified local media sharing is explicit and supports image, video and audio without publishing claims', async () => {
  const calls = [];
  const nav = { canShare: () => true, share: async (payload) => { calls.push(payload); } };
  const audio = new File([new Uint8Array([1, 2, 3])], 'track.wav', { type: 'audio/wav' });
  const denied = await shareEonLocalMedia({ file: audio }, { navigator: nav, userGesture: false });
  assert.equal(denied.reason, 'explicit-user-action-required');
  const shared = await shareEonLocalMedia({ file: audio, title: 'Made with EONAPP', text: 'My track' }, { navigator: nav, userGesture: true });
  assert.equal(shared.ok, true);
  assert.equal(shared.postingProof, false);
  assert.equal(calls.length, 1);
});

test('Remix in EONAPP deep links create a no-server-state creator loop with no tracking or auto-generation', async () => {
  const card = createEonRemixCard({
    title: 'Night Drive remix',
    kind: 'music-track',
    usefulOutcome: 'Make an original melodic techno track with a warm late-night mood.',
    firstRemixStep: 'Change the groove and vocal direction for your own version.'
  });
  const link = buildEonRemixDeepLink(card);
  assert.equal(link.ok, true);
  assert.equal(link.mode, 'music');
  const url = new URL(link.url);
  assert.equal(url.origin, 'https://eonapp.ch');
  assert.equal(url.pathname, '/create');
  assert.equal(url.searchParams.get('mode'), 'music');
  assert.match(url.hash, /^#eon-remix=/);
  assert.equal(url.searchParams.has('ref'), false);
  assert.equal(url.searchParams.has('utm_source'), false);
  assert.equal(link.boundary.fragmentIncludedInHttpRequest, false);
  assert.equal(link.boundary.trackingIdentifier, false);
  assert.equal(link.boundary.referralReward, false);
  assert.equal(link.boundary.providerCalled, false);
  assert.equal(link.boundary.automaticGeneration, false);

  const parsed = parseEonRemixDeepLinkHash(url.hash);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.starter.mode, 'music');
  assert.equal(parsed.starter.untrustedPublicData, true);
  assert.equal(parsed.starter.memoryWrite, false);
  assert.equal(parsed.starter.providerCalled, false);

  let replaced = '';
  const consumed = consumeEonRemixDeepLinkFromLocation({
    location: { hash: url.hash, pathname: url.pathname, search: url.search },
    history: { state: null, replaceState: (_state, _title, next) => { replaced = next; } }
  });
  assert.equal(consumed.ok, true);
  assert.equal(replaced, '/create?mode=music');

  const shares = [];
  const shared = await shareEonRemixCard(card, { remixUrl: link.url, nativeShare: async (payload) => shares.push(payload) });
  assert.equal(shared.ok, true);
  assert.equal(shares[0].url, link.url);
  const combined = buildEonRemixShareText(card, link.url);
  assert.match(combined, /EON Remix Card/);
  assert.match(combined, /Remix this in EONAPP:/);
  assert.ok(combined.includes(link.url));
  const unsafeCombined = buildEonRemixShareText(card, 'https://evil.example/create#eon-remix=fake');
  assert.doesNotMatch(unsafeCombined, /evil\.example/);
  assert.equal(getEonRemixCardTruth().combinedRemixShareCopy, true);

  const malicious = `#eon-remix=${encodeURIComponent(JSON.stringify({ v: 1, kind: 'music-track', title: 'Bad', usefulOutcome: 'api_key=super-secret-value-123456789', firstRemixStep: 'run it' }))}`;
  assert.equal(parseEonRemixDeepLinkHash(malicious).ok, false);
  const truth = getEonRemixDeepLinkTruth();
  assert.equal(truth.serverStateCreated, false);
  assert.equal(truth.fragmentIncludedInHttpRequest, false);
  assert.equal(truth.trackingIdentifier, false);
  assert.equal(truth.referralReward, false);
  assert.equal(truth.memoryWrite, false);
  assert.equal(truth.providerCalled, false);
  assert.equal(truth.automaticGeneration, false);
  assert.equal(truth.fragmentRemovedAfterConsumption, true);
});

test('Notification return routes are limited to public EONAPP surfaces and never API/arbitrary paths', () => {
  assert.equal(normalizeEonNotificationRoute('/create?mode=music#eon-music'), '/create?mode=music#eon-music');
  assert.equal(normalizeEonNotificationRoute('/eoncity?resume=1'), '/eoncity?resume=1');
  assert.equal(normalizeEonNotificationRoute('/api/notifications/self-test'), '/');
  assert.equal(normalizeEonNotificationRoute('/assets/private.json'), '/');
  assert.equal(normalizeEonNotificationRoute('//evil.example/path'), '/');
  assert.equal(normalizeEonNotificationRoute('https://evil.example/path'), '/');
  const truth = getEonNotificationRouteTruth();
  assert.equal(truth.sameOriginOnly, true);
  assert.equal(truth.apiPathsAllowed, false);
  assert.equal(truth.arbitraryPathsAllowed, false);
});

test('Activity category switches suppress disabled categories instead of retaining hidden events', () => {
  const storage = new MemoryStorage();
  const center = createEonNotificationCenter({ storage, now: () => 123456789, eventTarget: null });
  center.updatePreferences({ categories: { 'city-activity': false } }, { explicitUserAction: true });
  const suppressed = center.recordActivity({ eventId: 'city:preference-test', category: 'city-activity', title: 'City update', route: '/eoncity' }, { explicitSourceEvent: true });
  assert.equal(suppressed.ok, true);
  assert.equal(suppressed.suppressed, true);
  assert.equal(center.getSnapshot().items.length, 0);
});

test('Activity items expose one simple route-scoped return reminder only when background push is enabled', () => {
  const markup = renderEonNotificationCenterMarkup({
    unreadCount: 1,
    items: [{ id: 'activity_creator', eventId: 'creator:test', category: 'project-completion', title: 'Music ready', body: 'Continue your verified result.', route: '/create', createdAt: 1234, read: false }],
    preferences: { categories: {}, quietHours: { enabled: false, start: '22:00', end: '08:00' } },
    deviceDelivery: { enabled: true, backgroundPush: true },
    returnReminder: { scheduled: false, dueAt: 0 }
  });
  assert.match(markup, /data-eon-notification-item-reminder="1440"/);
  assert.match(markup, /data-eon-notification-reminder-route="\/create"/);
  assert.match(markup, />Remind me tomorrow</);
  const noPush = renderEonNotificationCenterMarkup({
    unreadCount: 1,
    items: [{ id: 'activity_creator', eventId: 'creator:test', category: 'project-completion', title: 'Music ready', body: '', route: '/create', createdAt: 1234, read: false }],
    preferences: { categories: {}, quietHours: { enabled: false, start: '22:00', end: '08:00' } },
    deviceDelivery: { enabled: false, backgroundPush: false },
    returnReminder: { scheduled: false, dueAt: 0 }
  });
  assert.doesNotMatch(noPush, /data-eon-notification-item-reminder/);
  const reminderSource = read('functions/api/notifications/reminder.js');
  const migration = read('identity/migrations/0004_notification_retention_reminders.sql');
  assert.match(reminderSource, /identity\.database\.batch\(\[/);
  assert.match(reminderSource, /WHERE account_id=\? AND delivered_at IS NULL AND cancelled_at IS NULL/);
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS idx_eon_push_reminders_one_pending_per_account/);
  assert.match(migration, /WHERE delivered_at IS NULL AND cancelled_at IS NULL/);
});

test('Return reminders are explicit, preset-bounded and content-free client requests', async () => {
  const storage = new MemoryStorage({ [EON_DEVICE_NOTIFICATION_SUBSCRIPTION_KEY]: JSON.stringify({ backgroundPush: true, subscriptionId: 'push_abcdefghijklmnopqrstuvwxyz123456', permission: 'granted' }) });
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init, body: JSON.parse(init.body) });
    if (init.method === 'POST') return new Response(JSON.stringify({ ok: true, reminderId: 'rem_abcdefghijklmnopqrstuvwxyz', dueAt: Date.now() + 3600000, route: '/create' }), { status: 200, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ ok: true, cancelled: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  assert.equal((await scheduleEonReturnReminder({ explicitUserAction: false, delayMinutes: 60, storage, fetchImpl })).reason, 'explicit-user-action-required');
  assert.equal((await scheduleEonReturnReminder({ explicitUserAction: true, delayMinutes: 17, storage, fetchImpl })).reason, 'return-reminder-preset-required');
  const scheduled = await scheduleEonReturnReminder({ explicitUserAction: true, delayMinutes: 60, route: '/create', storage, fetchImpl });
  assert.equal(scheduled.ok, true);
  assert.equal(requests[0].body.consent, 'service-return-reminder-v1');
  assert.deepEqual(Object.keys(requests[0].body).sort(), ['consent', 'dueAt', 'quietHours', 'route', 'timezoneOffsetMinutes']);
  assert.deepEqual(requests[0].body.quietHours, { enabled: false, start: '22:00', end: '08:00' });
  assert.equal(getEonReturnReminderStatus({ storage }).scheduled, true);
  const cancelled = await cancelEonReturnReminder({ explicitUserAction: true, storage, fetchImpl });
  assert.equal(cancelled.ok, true);
  assert.equal(storage.getItem(EON_RETURN_REMINDER_KEY), null);
});

test('Notification service worker and cron source are safe-route, no-marketing and deployment-proof gated', () => {
  const sw = read('service-worker/eonapp-service-worker.js');
  const cron = read('workers/eon-retention-notifications/src/index.js');
  const config = read('workers/eon-retention-notifications/wrangler.jsonc');
  assert.match(sw, /safePushRoute/);
  assert.match(sw, /EON_NOTIFICATION_SAFE_PATHS/);
  assert.match(sw, /raw\?\.route \|\| raw\?\.url/);
  assert.match(sw, /sameOrigin\?\.navigate/);
  assert.doesNotMatch(sw, /raw\?\.icon/);
  assert.doesNotMatch(sw, /event\.data\?\.text/);
  assert.match(cron, /scheduled\(controller, env, ctx\)/);
  assert.match(cron, /DELIVERY_LEASE_MS/);
  assert.match(cron, /skippedLeased/);
  assert.match(cron, /customBodiesLoaded: 0/);
  assert.match(cron, /marketingMessages: 0/);
  assert.match(config, /"crons"\s*:\s*\[\s*"\* \* \* \* \*"/);
  assert.match(config, /"binding"\s*:\s*"EON_RETENTION_QUEUE"/);
  assert.match(config, /"max_batch_size"\s*:\s*50/);
  assert.equal((config.match(/"max_concurrency"\s*:\s*10/g) || []).length, 3);
  assert.match(cron, /MAX_REMINDERS_PER_SCAN = 5000/);
  assert.match(cron, /EON_RETENTION_QUEUE\.sendBatch/);
  assert.match(cron, /async queue\(batch, env, ctx\)/);
  assert.match(config, /"EON_PUSH_ROLLOUT": "disabled"/);
  assert.match(config, /"preview"[\s\S]*"database_name": "eonapp-identity-preview"/);
  assert.match(config, /"production"[\s\S]*"database_name": "eonapp-identity-prod"/);
  const subscriptionApi = read('functions/api/notifications/subscription.js');
  const delivery = read('assets/js/notifications/eon-device-notification-delivery.js');
  assert.match(subscriptionApi, /fingerprintEonPushSubscriptionEndpoint/);
  assert.match(subscriptionApi, /endpointFallbackUsed/);
  assert.match(delivery, /sameApplicationServerKey/);
  assert.match(delivery, /replacedStaleApplicationKey/);
});


test('RT86 retention scheduler releases due reminders through Queue with million-user headroom and bounded D1 hot-path writes', async () => {
  const { env } = await pushFixture();
  const dueRows = [
    { reminder_id: 'rem_abcdefghijklmnopqrstuvwxyz0001', attempt_count: 0 },
    { reminder_id: 'rem_abcdefghijklmnopqrstuvwxyz0002', attempt_count: 1 }
  ];
  const queueBatches = [];
  const database = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async all() {
              if (/SELECT reminder_id, attempt_count[\s\S]*due_at<=\?/.test(sql)) return { results: dueRows };
              if (/WHERE reminder_id IN \([?,]+\)[\s\S]*last_attempt_at=\?/.test(sql)) return { results: dueRows };
              throw new Error(`unexpected-all:${sql}`);
            },
            async run() {
              if (/UPDATE eon_push_reminders SET last_attempt_at=\?/.test(sql)) return { meta: { changes: dueRows.length } };
              if (/DELETE FROM eon_push_/.test(sql)) return { meta: { changes: 0 } };
              throw new Error(`unexpected-run:${sql}:${args.length}`);
            }
          };
        }
      };
    }
  };
  const result = await runEonRetentionNotificationCycle({
    ...env,
    EON_IDENTITY_DB: database,
    EON_RETENTION_QUEUE: { async sendBatch(messages) { queueBatches.push(messages); } }
  }, { now: Date.UTC(2026, 7, 11, 2, 8, 0) });
  assert.equal(result.ok, true);
  assert.equal(result.queued, 2);
  assert.equal(queueBatches.length, 1);
  assert.deepEqual(queueBatches[0].map((entry) => entry.body.reminderId), dueRows.map((row) => row.reminder_id));
  const truth = getEonRetentionNotificationScaleTruth();
  assert.equal(truth.maxRemindersPerMinuteScan, 5000);
  assert.equal(truth.theoreticalReminderReleasePerDay, 7_200_000);
  assert.equal(truth.successHeartbeatWritePerPush, false);
  assert.equal(truth.automaticMarketing, false);
});

test('RT86 queue consumer stays idempotent and does not write a success heartbeat per accepted device push', async () => {
  const { env, subscription } = await pushFixture();
  const sealed = await sealEonPushSubscription(subscription, env.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY);
  const leaseAt = 1770000000000;
  const writes = [];
  const database = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (/FROM eon_push_reminders[\s\S]*attempt_count=\? AND last_attempt_at=\?/.test(sql)) {
                return { reminder_id: 'rem_abcdefghijklmnopqrstuvwxyz0003', account_id: 'acct_test', route: '/create', due_at: leaseAt, attempt_count: 0, last_attempt_at: leaseAt };
              }
              throw new Error(`unexpected-first:${sql}`);
            },
            async all() {
              if (/FROM eon_push_subscriptions/.test(sql)) return { results: [{ subscription_id: 'push_test_1', encrypted_subscription: sealed.encryptedSubscription, encryption_iv: sealed.encryptionIv }] };
              throw new Error(`unexpected-all:${sql}`);
            },
            async run() { writes.push({ sql, args }); return { meta: { changes: 1 } }; }
          };
        }
      };
    }
  };
  let acked = 0;
  let retried = 0;
  const batch = { messages: [{ body: { reminderId: 'rem_abcdefghijklmnopqrstuvwxyz0003', leaseAt, attemptCount: 0 }, attempts: 1, ack() { acked += 1; }, retry() { retried += 1; } }] };
  const result = await runEonRetentionNotificationQueueBatch({ ...env, EON_IDENTITY_DB: database }, batch, {
    now: leaseAt + 1000,
    fetchImpl: async () => new Response('', { status: 201 })
  });
  assert.equal(result.delivered, 1);
  assert.equal(acked, 1);
  assert.equal(retried, 0);
  assert.equal(writes.some((entry) => /SET last_success_at=/.test(entry.sql)), false);
  assert.equal(writes.some((entry) => /DELETE FROM eon_push_reminders/.test(entry.sql)), true);
  assert.equal(writes.some((entry) => /delivered_at=\?/.test(entry.sql)), false);
});

test('Disabled retention worker is inert and never touches D1 before live proof configuration', async () => {
  let prepareCalls = 0;
  const result = await runEonRetentionNotificationCycle({
    EON_PUSH_ROLLOUT: 'disabled',
    EON_IDENTITY_DB: { prepare() { prepareCalls += 1; throw new Error('disabled worker must not query D1'); } }
  }, { now: 1, fetchImpl: async () => { throw new Error('disabled worker must not fetch'); } });
  assert.equal(result.ok, true);
  assert.equal(result.reason, 'push-disabled-or-unconfigured');
  assert.equal(result.processed, 0);
  assert.equal(prepareCalls, 0);
});


test('City Quick EONBOT keeps known maintained work routes inside EONCITY and preserves Creator mode', () => {
  assert.deepEqual(resolveEonCityPreparedRoute('/create?mode=image'), { ok: true, stationId: 'create-forge', surface: 'create', creatorMode: 'image', staysInCity: true });
  assert.deepEqual(resolveEonCityPreparedRoute('/create?mode=video'), { ok: true, stationId: 'create-forge', surface: 'create', creatorMode: 'video', staysInCity: true });
  assert.deepEqual(resolveEonCityPreparedRoute('/create?mode=music'), { ok: true, stationId: 'create-forge', surface: 'create', creatorMode: 'music', staysInCity: true });
  assert.equal(resolveEonCityPreparedRoute('/projects').stationId, 'project-atlas');
  assert.equal(resolveEonCityPreparedRoute('/library').stationId, 'library-vault');
  assert.equal(resolveEonCityPreparedRoute('/automations').stationId, 'automation-theatre');
  assert.equal(resolveEonCityPreparedRoute('/local-ai#eonbot-local-ai-setup').stationId, 'local-ai-lab');
  assert.equal(resolveEonCityPreparedRoute('/profile').ok, false);
});

test('EON Radio session plays only explicit user-authorized or EON-generated audio without persistence/upload', async () => {
  const { createEonRadioSession, getEonRadioSessionTruth } = await import('../../assets/js/creator/music/eon-radio-session.js');
  const created = [];
  const revoked = [];
  const urlApi = { createObjectURL: (media) => { const url = `blob:test-${created.length + 1}`; created.push([url, media]); return url; }, revokeObjectURL: (url) => revoked.push(url) };
  const session = createEonRadioSession({ urlApi });
  const track = new File([new Uint8Array([1, 2, 3, 4])], 'owned-track.wav', { type: 'audio/wav' });
  assert.equal(session.addFiles([track], { explicitUserAction: false }).reason, 'explicit-user-action-required');
  const added = session.addFiles([track], { explicitUserAction: true });
  assert.equal(added.ok, true);
  assert.equal(added.snapshot.itemCount, 1);
  assert.equal(added.snapshot.items[0].source, 'user-authorized');
  assert.equal(added.snapshot.persisted, false);
  assert.equal(added.snapshot.uploaded, false);
  const generated = new Blob([new Uint8Array([5, 6, 7])], { type: 'audio/wav' });
  assert.equal(session.addGeneratedBlob(generated, { fileName: 'eon.wav' }, { explicitUserAction: true }).ok, true);
  assert.equal(session.snapshot().itemCount, 2);
  assert.equal(session.next().current.source, 'eon-generated');
  assert.equal(session.clear({ explicitUserAction: true }).ok, true);
  assert.equal(revoked.length, 2);
  assert.deepEqual(getEonRadioSessionTruth(), {
    schema: 'eonapp.creator.radio-session.v1',
    sessionOnly: true,
    userAuthorizedAudioOnly: true,
    eonGeneratedAudioAllowed: true,
    commercialCatalogueAccess: false,
    upload: false,
    backgroundStreaming: false,
    persistentMediaStorage: false,
    explicitAddAndClearActions: true
  });
});

test('Creator mission authority accepts verified Image, Video, Music, Radio and Forge receipts consistently', async () => {
  const { EON_CITY_PRODUCTIVE_RPG_MISSIONS, getEonCityProductiveRpgPlan, recordEonCityProductiveRpgOutcome } = await import('../../assets/js/contracts/city/eon-city-productive-rpg-loop.js');
  const creator = EON_CITY_PRODUCTIVE_RPG_MISSIONS.find((mission) => mission.id === 'creator');
  for (const kind of ['creator-image-verified', 'creator-video-verified', 'creator-music-exported', 'creator-radio-station', 'forge-source-applied']) assert.equal(creator.outcomeKinds.includes(kind), true, kind);
  for (const [index, source] of ['eon-music-studio', 'eon-acestep-local', 'eon-direct-byok-elevenlabs'].entries()) {
    const storage = new MemoryStorage();
    const result = recordEonCityProductiveRpgOutcome({ kind: 'creator-music-exported', route: '/create', source, receiptId: `music:mission-proof:${index}`, verified: true, verifiedAt: 1234 + index }, { storage, now: 1234 + index });
    assert.equal(result.ok, true, source);
    const mission = getEonCityProductiveRpgPlan({ storage }).missions.find((entry) => entry.id === 'creator');
    assert.equal(mission.id, 'creator');
    assert.equal(mission.state, 'completed');
    assert.equal(mission.outcome.source, source);
    assert.equal(mission.outcome.privateContentStored, false);
  }
});

test('Every maintained City EONBOT panel emits the bounded real-reply progression event after a genuine model response', () => {
  const quick = read('assets/js/city/eon-city-eonbot-quick-work.js');
  const workSurface = read('assets/js/work-surface/adapters/eon-productivity-panel.js');
  for (const source of [quick, workSurface]) {
    assert.match(source, /createAIReply/);
    assert.match(source, /eonbot\.real-reply/);
    assert.match(source, /dispatchEonCityW659gVerifiedAction/);
  }
});


test('Share Pack and viral card system treat Music/audio as a first-class reviewed share artifact', async () => {
  const pack = createEonSharePack({ title: 'Night Drive mix', goal: 'A local EON Music track ready for review.', destination: 'any-app' });
  const calls = [];
  const audio = new File([new Uint8Array([1, 2, 3, 4])], 'night-drive.wav', { type: 'audio/wav' });
  const shared = await shareEonSharePack(pack, {
    file: audio,
    userGesture: true,
    nativeCanShare: () => true,
    nativeShare: async (payload) => { calls.push(payload); }
  });
  assert.equal(shared.ok, true);
  assert.equal(shared.fileShared, true);
  assert.equal(shared.payload.fileType, 'audio/wav');
  assert.equal(calls[0].files[0], audio);
  assert.equal(getEonSharePackTruth().transientAudioShare, true);
  const musicCard = buildEonShareCardPlan({ preset: 'music' });
  assert.equal(musicCard.preset, 'music');
  assert.match(musicCard.kicker, /EON MUSIC/i);
  assert.equal(getEonViralShareTruth().localAudioNativeShare, true);
});

test('Remix Cards preserve Image, Video, Music, DJ and Radio starter kinds without inventing referral proof', () => {
  const kinds = EON_REMIX_CARD_KINDS.map((row) => row.id);
  for (const kind of ['image-concept', 'video-storyboard', 'music-track', 'dj-set', 'radio-station']) assert.ok(kinds.includes(kind), kind);
  const music = createEonRemixCard({
    title: 'Night drive variation',
    kind: 'music-track',
    usefulOutcome: 'A new local music direction using the same late-night mood.',
    firstRemixStep: 'Change the tempo and instrumentation while using music you are allowed to use.'
  });
  assert.equal(music.kind, 'music-track');
  assert.equal(music.execution.referralReward, false);
  assert.equal(music.execution.tracking, false);
  const handoff = createEonOutputShareHandoff({
    explicitUserAction: true,
    origin: 'creator-music',
    title: 'My EON Radio',
    usefulOutcome: 'A private station concept.',
    firstRemixStep: 'Build your own mood from authorized audio.',
    remixKind: 'radio-station'
  }, { now: 123 });
  assert.equal(handoff.remixKind, 'radio-station');
  assert.ok(getEonOutputShareHandoffTruth().supportedRemixKinds.includes('music-track'));
  const truth = getEonRemixCardTruth();
  assert.equal(truth.imageStarter, true);
  assert.equal(truth.musicTrackStarter, true);
  assert.equal(truth.radioStationStarter, true);
  assert.equal(truth.referralReward, false);
  assert.equal(truth.externalRemixProof, false);
});

test('Verified Creator outcomes create only fixed redacted local return-loop activity', () => {
  const storage = new MemoryStorage();
  const created = recordEonCoreOutcome({ kind: 'creator-music-exported', route: '/create', source: 'eon-music-studio', receiptId: 'music:retention-proof', verified: true }, { storage, environment: null, now: 1700 });
  assert.equal(created.ok, true);
  const activityCalls = [];
  const recordActivity = (event, options) => {
    activityCalls.push({ event, options });
    return { ok: true, deduped: false, item: { ...event, id: 'activity_test' } };
  };
  const denied = recordEonCreatorOutcomeActivity(created.outcome, { explicitCurrentOutcome: false, storage, recordActivity });
  assert.equal(denied.error, 'current-core-outcome-required');
  const accepted = recordEonCreatorOutcomeActivity(created.outcome, { explicitCurrentOutcome: true, storage, recordActivity });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.networkRequestCreated, false);
  assert.equal(accepted.browserPermissionRequested, false);
  assert.equal(accepted.returnReminderScheduled, false);
  assert.equal(activityCalls.length, 1);
  assert.equal(activityCalls[0].options.explicitSourceEvent, true);
  assert.equal(activityCalls[0].event.route, '/create');
  assert.doesNotMatch(JSON.stringify(activityCalls[0]), /retention-proof|prompt|mediaBlob|apiKey|fileContent/i);
  const forged = { ...created.outcome, metadataDigest: 'forged123' };
  assert.equal(recordEonCreatorOutcomeActivity(forged, { explicitCurrentOutcome: true, storage, recordActivity }).ok, false);
  const truth = getEonCreatorOutcomeActivityBridgeTruth();
  assert.equal(truth.persistedOutcomeVerificationRequired, true);
  assert.equal(truth.persistedHistoryScanned, false);
  assert.equal(truth.pushSubscriptionCreated, false);
});

test('Web Push abuse controls bound active devices and rate-limit self-test attempts after failures too', () => {
  const subscriptionSource=read('functions/api/notifications/subscription.js');
  const selfTestSource=read('functions/api/notifications/self-test.js');
  const devicePolicySource=read('functions/_shared/eon-push-device-policy.js');
  assert.match(devicePolicySource,/free:\s*1/);
  assert.match(devicePolicySource,/max:\s*5/);
  assert.match(subscriptionSource,/pruneEonPushSubscriptionsToPolicy/);
  assert.match(subscriptionSource,/olderDevicesDisabled/);
  assert.match(devicePolicySource,/ORDER BY updated_at DESC LIMIT \?/);
  assert.match(selfTestSource,/COALESCE\(last_failure_at, 0\)/);
  assert.match(selfTestSource,/last_attempt_at/);
  assert.match(selfTestSource,/push_test_rate_limited/);
});
