/**
 * W304 — local-only EONBOT Action Cards and Review Inbox.
 *
 * This module intentionally stores only inferred capability identifiers and
 * safe labels. It never stores raw Chat text, provider credentials, account
 * identity, OAuth material, browser cookies, media, prompt output, or a
 * server-signed action packet. Every card is non-executable in W304.
 */

import { getCapabilityTruth } from '../capabilities/capability-truth-registry.js';

export const EONBOT_ACTION_CARD_SCHEMA = 'eon.eonbot.local-action-card.v1';
export const EONBOT_ACTION_CARD_STORAGE_KEY = 'eon:eonbot:local-review-inbox:v1';
export const EONBOT_ACTION_CARD_TTL_MS = 24 * 60 * 60 * 1000;

const MAX_CARDS = 36;
const CARD_KINDS = new Set([
  'mission-draft',
  'connection-required',
  'provider-required',
  'review-required',
  'approval-packet-preview',
  'blocked-capability',
  'retired-capability'
]);
const CARD_STATUSES = new Set(['awaiting-review', 'reviewed', 'dismissed', 'expired']);
const ID_PATTERN = /^eoncard_[a-z0-9_-]{8,96}$/i;

function storageFor(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function iso(now = Date.now()) {
  return new Date(Number.isFinite(Number(now)) ? Number(now) : Date.now()).toISOString();
}

function safeRoute(value = '') {
  try {
    const url = new URL(String(value || ''), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '';
  }
}

function makeId(now = Date.now()) {
  let entropy = '';
  try {
    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(bytes);
    entropy = `${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  } catch {}
  if (!entropy) entropy = `${Math.floor(Math.random() * 0x7fffffff).toString(36)}${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;
  return `eoncard_${Number(now).toString(36)}_${entropy}`.slice(0, 96);
}

function freezePreview(capabilityId = '') {
  const capability = getCapabilityTruth(capabilityId);
  return Object.freeze({
    schema: 'eon.action-packet.preview.v1',
    issuer: 'local-draft-not-server-issued',
    executable: false,
    capabilityId: capability?.id || 'unknown',
    connection: capability?.requiresConnection ? 'not-connected' : 'not-required',
    scope: 'not-requested',
    approval: capability?.requiresApproval ? 'not-approved' : 'not-required',
    contentHash: 'not-created',
    mediaHashes: Object.freeze([]),
    target: 'not-selected',
    schedule: 'not-created',
    expiry: 'not-created',
    receipt: 'not-created'
  });
}

function cleanText(value = '', max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeCard(value = {}, { now = Date.now() } = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const id = cleanText(source.id, 96);
  const kind = cleanText(source.kind, 48);
  const capabilityId = cleanText(source.capabilityId, 96);
  const capability = getCapabilityTruth(capabilityId);
  const createdAt = String(source.createdAt || '');
  const expiresAt = String(source.expiresAt || '');
  const status = CARD_STATUSES.has(source.status) ? source.status : 'awaiting-review';
  if (!ID_PATTERN.test(id) || !CARD_KINDS.has(kind) || !capability || !/^\d{4}-\d{2}-\d{2}T/.test(createdAt) || !/^\d{4}-\d{2}-\d{2}T/.test(expiresAt)) return null;
  const expired = Date.parse(expiresAt) <= Number(now);
  const normalizedStatus = status === 'awaiting-review' && expired ? 'expired' : status;
  const route = safeRoute(source.route) || (capability.routes[0] || '/workspace');
  return Object.freeze({
    schema: EONBOT_ACTION_CARD_SCHEMA,
    id,
    kind,
    status: normalizedStatus,
    capabilityId: capability.id,
    title: cleanText(source.title, 120) || capability.label,
    summary: cleanText(source.summary, 300) || capability.truthfulUserFacingNote,
    route,
    createdAt,
    expiresAt,
    updatedAt: /^\d{4}-\d{2}-\d{2}T/.test(String(source.updatedAt || '')) ? String(source.updatedAt) : createdAt,
    requiresConnection: capability.requiresConnection,
    requiresApproval: capability.requiresApproval,
    externalEffect: false,
    packetPreview: kind === 'approval-packet-preview' ? freezePreview(capability.id) : null
  });
}

function parseCards(raw = '', options = {}) {
  try {
    const values = JSON.parse(raw || '[]');
    return Array.isArray(values) ? values.map((item) => normalizeCard(item, options)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function readCards({ storage, now = Date.now() } = {}) {
  const resolved = storageFor(storage);
  const cutoff = Number(now) - (7 * EONBOT_ACTION_CARD_TTL_MS);
  return parseCards(resolved?.getItem(EONBOT_ACTION_CARD_STORAGE_KEY), { now })
    .filter((card) => Date.parse(card.createdAt) >= cutoff)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, MAX_CARDS);
}

function writeCards(cards, { storage } = {}) {
  try {
    storageFor(storage)?.setItem(EONBOT_ACTION_CARD_STORAGE_KEY, JSON.stringify(cards.slice(0, MAX_CARDS)));
    return true;
  } catch {
    return false;
  }
}

function inferOutcomeKitId(source = '') {
  const text = String(source || '').toLowerCase();
  if (/campaign(?:\s+launch)?\s+kit|launch\s+campaign|campaign\s+brief/.test(text)) return 'campaign-launch';
  if (/brand\s+(?:system|kit)|brand\s+brief/.test(text)) return 'brand-system';
  if (/build\s+(?:brief|kit)|website\s+brief|app\s+brief/.test(text)) return 'build-brief';
  if (/creator\s+(?:export|kit)|video\s+brief|export\s+package/.test(text)) return 'creator-export';
  if (/realm\s+(?:style|kit)|city\s+style/.test(text)) return 'realm-style';
  return '';
}

function inferIntent(input = '') {
  const source = String(input || '').toLowerCase();
  const outcomeKitId = inferOutcomeKitId(source);
  if (outcomeKitId) return `outcome-kit:${outcomeKitId}`;
  // Referral/EONKEY is a rollout-controlled server capability, not a wallet or
  // token system. Keep genuinely financial/value requests on the historical
  // blocked rail, including mixed requests such as "referral payout".
  if (/(wallet|token|reward|payout|earnings|pool points|swap|crypto)/.test(source)) return 'blocked-value';
  if (/(?:\beon\s*keys?\b|\beonkeys?\b|\breferr(?:al|als|ed|ing)\b|\binvite\s+(?:friend|friends|users?)\b)/.test(source)) return 'referral-eonkeys';
  if (/(legacy social|social publisher|creator studio|video editor|eon browser|workbench)/.test(source)) return 'retired-route';
  if (/(youtube|upload|publish|schedule|post to|social account|oauth|connect (?:my )?(?:youtube|instagram|tiktok|linkedin|x|facebook))/.test(source)) return 'publishing';
  if (/(automate|automation|workflow|agent)/.test(source)) return 'automation';
  if (/(campaign|content|caption|script|image|video|music|audio|creator)/.test(source)) return 'creator';
  if (/(build|website|app|code|project)/.test(source)) return 'build';
  return '';
}

function template(kind, capabilityId, title, summary, route = '/workspace') {
  return Object.freeze({ kind, capabilityId, title, summary, route });
}

/**
 * Converts broad user intent into explicit local-only card templates. It never
 * stores input text or claims the requested work has started.
 */
export function buildEonbotLocalActionCardPlan(input = '') {
  const intent = inferIntent(input);
  if (!intent) return Object.freeze({ matched: false, intent: '', cards: Object.freeze([]), summary: '' });
  if (intent.startsWith('outcome-kit:')) {
    const kitId = intent.slice('outcome-kit:'.length);
    const labels = Object.freeze({
      'campaign-launch': 'Campaign Launch Kit',
      'brand-system': 'Brand System Kit',
      'build-brief': 'Build Brief Kit',
      'creator-export': 'Creator Export Kit',
      'realm-style': 'Realm Style Kit'
    });
    const label = labels[kitId] || 'Outcome Kit';
    return Object.freeze({
      matched: true, intent, summary: `Open the ${label} as an editable local starting brief.`,
      cards: Object.freeze([
        template('mission-draft', 'creator-outcome-kit-previews', label, `${label} is a free local starting brief. Review and edit it in Workspace; no provider call, purchase, licence, subscription, feature unlock, referral value, or external action has started.`, `/workspace?kit=${encodeURIComponent(kitId)}`),
        template('review-required', 'chat-action-cards', 'Review required', 'Prepare a local draft, review the message and rights notes, then export or use a service manually. No external work is automatic.', `/workspace?kit=${encodeURIComponent(kitId)}`)
      ])
    });
  }
  if (intent === 'blocked-value') {
    return Object.freeze({
      matched: true, intent, summary: 'This request reaches a blocked value system. Nothing is activated.',
      cards: Object.freeze([
        template('blocked-capability', 'reward-wallet-referral', 'Blocked capability', 'Rewards, wallet, swap, referral, payout, and token paths remain disabled. No value action has started.', '/rewards')
      ])
    });
  }
  if (intent === 'referral-eonkeys') {
    return Object.freeze({
      matched: true,
      intent,
      summary: 'Open the server-authoritative EONKEY/referral status. Sharing alone never qualifies for value.',
      cards: Object.freeze([
        template(
          'review-required',
          'server-referral-eonkeys',
          'Referral & EONKEY status',
          'Referral/EONKEY availability is rollout-controlled by the server ledger. A copied link, QR, post, click or share alone does not grant a key, discount, cash, token or payout; only an eligible server-verified milestone can qualify.',
          '/eon-keys'
        )
      ])
    });
  }
  if (intent === 'retired-route') {
    return Object.freeze({
      matched: true, intent, summary: 'This request names a retired surface. EONAPP keeps the canonical surface instead.',
      cards: Object.freeze([
        template('retired-capability', 'legacy-workbench-creator-routes', 'Retired capability', 'The named legacy route is not restored. Use the current canonical Create or Workspace surface instead; Image, Video and Music now begin in Create.', '/create')
      ])
    });
  }
  if (intent === 'publishing') {
    return Object.freeze({
      matched: true, intent, summary: 'A publishing request is converted into requirements, not an upload or schedule.',
      cards: Object.freeze([
        template('mission-draft', 'mission-draft', 'Mission draft', 'Local outline: prepare content and identify the requested target. No connected account, provider call, or job is active.', '/workspace'),
        template('connection-required', 'youtube-private-upload', 'Connection required', 'No social or Google connection is active. Future access requires a separate explicit, least-privilege OAuth connection.', '/workspace'),
        template('review-required', 'chat-action-cards', 'Review required', 'Every future publish needs a clear review of target account, content, media, scope, timing, and expiry.', '/workspace'),
        template('approval-packet-preview', 'youtube-private-upload', 'Action Packet preview', 'This is a non-executable local preview. It is not server-issued, approved, signed, queued, scheduled, or published.', '/workspace')
      ])
    });
  }
  if (intent === 'automation') {
    return Object.freeze({
      matched: true, intent, summary: 'An automation request is converted into a local workflow review plan.',
      cards: Object.freeze([
        template('mission-draft', 'mission-draft', 'Mission draft', 'Local outline: define the result, inputs, and review point. No agent, queue, workflow, or provider call is running.', '/automations'),
        template('review-required', 'automation-local-review', 'Review required', 'Automations can be simulated locally. A local approval does not trigger an external action or durable job.', '/automations'),
        template('approval-packet-preview', 'durable-automation-runtime', 'Action Packet preview', 'The backend Action Gateway and durable runtime are planned. This preview cannot execute, schedule, or send anything.', '/workspace')
      ])
    });
  }
  if (intent === 'creator') {
    return Object.freeze({
      matched: true, intent, summary: 'A creator request is routed to canonical Create with an explicit generation/provider review boundary.',
      cards: Object.freeze([
        template('mission-draft', 'mission-draft', 'Creator draft', 'Open canonical Create for Image, Video or Music. Preparing the route or prompt does not generate, upload, publish or spend.', '/create'),
        template('provider-required', 'configured-ai-provider', 'Model/runtime requirement', 'Model-powered creation uses only a verified local runtime or a provider the user configured explicitly. EONAPP does not silently switch providers, download models or start a paid job.', '/create'),
        template('review-required', 'chat-action-cards', 'Review required', 'Review the prompt, assets, rights, execution rail and intended output before any generation or connected provider action.', '/create')
      ])
    });
  }
  const label = intent === 'build' ? 'Build mission draft' : 'Mission draft';
  return Object.freeze({
    matched: true, intent, summary: 'This request is a local planning draft only.',
    cards: Object.freeze([
      template('mission-draft', 'mission-draft', label, 'Local outline only. EONBOT has not created a project, called a provider, deployed code, or started a background job.', '/workspace'),
      template('review-required', 'chat-action-cards', 'Review required', 'Review the scoped draft in Workspace before any future connected action is considered.', '/workspace')
    ])
  });
}

/** Save a user-reviewed local plan into the local Review Inbox. */
export function createEonbotLocalActionCards(plan = {}, { storage, now = Date.now() } = {}) {
  const templates = Array.isArray(plan?.cards) ? plan.cards : [];
  if (!templates.length) return Object.freeze({ ok: false, cards: Object.freeze([]), reason: 'no-action-cards' });
  const cards = templates.map((item, index) => normalizeCard({
    id: makeId(Number(now) + index),
    kind: item.kind,
    capabilityId: item.capabilityId,
    title: item.title,
    summary: item.summary,
    route: item.route,
    status: 'awaiting-review',
    createdAt: iso(now),
    expiresAt: iso(Number(now) + EONBOT_ACTION_CARD_TTL_MS),
    updatedAt: iso(now)
  }, { now })).filter(Boolean);
  if (!cards.length) return Object.freeze({ ok: false, cards: Object.freeze([]), reason: 'invalid-action-cards' });
  const existing = readCards({ storage, now });
  const persisted = writeCards([...cards, ...existing], { storage });
  return Object.freeze({ ok: persisted, cards: Object.freeze(cards), reason: persisted ? null : 'storage-unavailable' });
}

export function listEonbotLocalReviewInbox(options = {}) {
  return Object.freeze([...readCards(options)]);
}

export function listPendingEonbotLocalReviewCards(options = {}) {
  return Object.freeze(readCards(options).filter((card) => card.status === 'awaiting-review'));
}

function updateCard(id, status, { storage, now = Date.now() } = {}) {
  if (!ID_PATTERN.test(String(id || '')) || !CARD_STATUSES.has(status)) return Object.freeze({ ok: false, card: null, reason: 'invalid-action-card' });
  let updated = null;
  const cards = readCards({ storage, now }).map((card) => {
    if (card.id !== id) return card;
    if (card.status !== 'awaiting-review') return card;
    updated = normalizeCard({ ...card, status, updatedAt: iso(now) }, { now });
    return updated || card;
  });
  if (!updated) return Object.freeze({ ok: false, card: null, reason: 'action-card-not-reviewable' });
  return Object.freeze({ ok: writeCards(cards, { storage }), card: updated, reason: null });
}

export function markEonbotLocalActionCardReviewed(id, options = {}) {
  return updateCard(id, 'reviewed', options);
}

export function dismissEonbotLocalActionCard(id, options = {}) {
  return updateCard(id, 'dismissed', options);
}

export function clearEonbotLocalActionCardsForTest({ storage } = {}) {
  try { storageFor(storage)?.removeItem(EONBOT_ACTION_CARD_STORAGE_KEY); } catch {}
}

export default Object.freeze({
  EONBOT_ACTION_CARD_SCHEMA,
  EONBOT_ACTION_CARD_STORAGE_KEY,
  EONBOT_ACTION_CARD_TTL_MS,
  buildEonbotLocalActionCardPlan,
  createEonbotLocalActionCards,
  listEonbotLocalReviewInbox,
  listPendingEonbotLocalReviewCards,
  markEonbotLocalActionCardReviewed,
  dismissEonbotLocalActionCard,
  clearEonbotLocalActionCardsForTest
});
