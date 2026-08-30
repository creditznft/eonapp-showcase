/**
 * EONAPP Invite & Share Center.
 *
 * This module creates signed, self-contained invite links and portable Realm
 * identity links. It is intentionally not a chat-publication, payout,
 * commission, reward, click-tracking, account-connection, or auto-posting
 * system. Campaign copy is saved only in the current browser until a person
 * explicitly chooses to use it.
 */
import { createRealmShareLink } from './realm-share-runtime.js';
import { ensureMyRealmState, getMyRealmPublicIdentity } from '../realm/realm-state.js';
import { dispatchEonWorkSurfaceOpen } from '../work-surface/eon-work-surface-registry.js';
import { createSignedShareLink, PUBLIC_LINK_NOTICE } from './signed-share-link.js';
import { buildShareLinks, copyToClipboard, showToast } from './share.js';
import { ensureProfile } from './profile.js';
import { EON_AI_COST_BOUNDARY, getEonKeyTypes, getEonReferralRewardMatrix, getEonUnlockMenu } from '../referrals/eon-keys-catalog.js';
import { bindReferralIdentityFromInvite, fetchReferralStatus } from '../referrals/eon-referral-server-client.js';
import { readEonOutputShareHandoff } from '../share/eon-output-share-handoff.js';
import { recordEonShareW753ReviewedHandoffReceipt } from '../share/eon-share-w753-reviewed-handoff-receipt.js';
import {
  EON_SHARE_CARD_PRESETS,
  EON_VIRAL_GUARDRAILS,
  EON_VIRAL_SHARE_SURFACES,
  buildEonRewardDisclosure,
  buildEonViralCaption,
  createEonShareCardFile,
  getEonNativeShareCapability,
  shareEonLocalMedia
} from '../share/eon-viral-share-kit.js';

export const SHARE_DRAFTS_STORAGE_KEY = 'eon:share:drafts:v1';
export const SHARE_DRAFTS_SCHEMA = 'eon.share-center.drafts.v2';
export const SHARE_CAMPAIGN_INTENT_STORAGE_KEY = 'eon:share:campaign-intent:v1';
export const SHARE_CAMPAIGN_INTENT_SCHEMA = 'eon.share-center.campaign-intent.v1';
export const MAX_SHARE_DRAFTS = 16;
export const MAX_CAMPAIGN_MESSAGE_LENGTH = 280;
export const EON_SHARE_CENTER_W753_SCHEMA = 'eon.share-command-center.w753.v1';

export const SHARE_CENTER_TARGETS = Object.freeze([
  Object.freeze({
    id: 'eonapp',
    label: 'EONAPP invite',
    shortLabel: 'EONAPP',
    destination: '/',
    linkKind: 'invite',
    description: 'Invite someone to begin with EONBOT. The link opens the guest-first EONAPP chat home.'
  }),
  Object.freeze({
    id: 'city',
    label: 'EON City invite',
    shortLabel: 'EON City',
    destination: '/eoncity',
    linkKind: 'invite',
    description: 'Invite someone to enter EON City. Private projects, chats, Vault data and City state stay local.'
  }),
  Object.freeze({
    id: 'realm',
    label: 'My Realm identity',
    shortLabel: 'My Realm',
    destination: '/u/:handle',
    linkKind: 'realm',
    description: 'Share a signed portable Realm identity only; private City state stays local.'
  })
]);

function safeStorage(storage = null) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function clean(value = '', max = 160) {
  return Array.from(String(value || '').replaceAll('<', ' ').replaceAll('>', ' '), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeType(value = '') {
  const id = clean(value, 32).toLowerCase();
  // Legacy AI Cockpit/workspace share calls intentionally resolve to the EONBOT home.
  if (id === 'workspace' || id === 'cockpit' || id === 'chat') return 'eonapp';
  return SHARE_CENTER_TARGETS.some((target) => target.id === id) ? id : 'eonapp';
}

const CITY_SHARE_SOURCES = Object.freeze(new Set([
  'eoncity', 'eon-city', 'eon-city-command-hub', 'city-menu', 'share-capture',
  'share-command-center-city', 'creator-capture'
]));

export function resolveShareCenterType(options = {}) {
  const explicit = clean(options?.type || options?.target || options?.context?.type, 32).toLowerCase();
  if (explicit) return normalizeType(explicit);
  const source = clean(options?.source || options?.invocation?.source, 80).toLowerCase();
  if (CITY_SHARE_SOURCES.has(source) || source.startsWith('eon-city-')) return 'city';
  const destination = clean(options?.destination || options?.invocation?.context?.destination, 120);
  if (destination === '/eoncity' || destination.startsWith('/eoncity?') || destination.startsWith('/eoncity#')) return 'city';
  const pathname = clean(options?.pathname || options?.environment?.location?.pathname || globalThis.location?.pathname, 160);
  if (pathname === '/eoncity' || pathname.startsWith('/eoncity/')) return 'city';
  return 'eonapp';
}

function targetFor(value = '') {
  const type = normalizeType(value);
  return SHARE_CENTER_TARGETS.find((target) => target.id === type) || SHARE_CENTER_TARGETS[0];
}

function safeOrigin(value = '') {
  const fallback = globalThis.location?.origin || 'https://eonapp.ch';
  try {
    const origin = new URL(value || fallback, fallback);
    if (!/^https?:$/i.test(origin.protocol)) throw new Error('invalid_protocol');
    return origin.origin;
  } catch {
    return 'https://eonapp.ch';
  }
}

function validPublicUrl(value = '') {
  try {
    const url = new URL(String(value || ''));
    const localHttp = /^http:$/i.test(url.protocol) && /^(localhost|127\.0\.0\.1|eonapp\.local)$/i.test(url.hostname);
    return /^https:$/i.test(url.protocol) || localHttp ? url.toString() : '';
  } catch {
    return '';
  }
}

function safeDraftId(value = '') {
  return clean(value || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, 96)
    .replace(/[^a-zA-Z0-9_-]/g, '');
}

function normalizeDraft(raw = {}) {
  const url = validPublicUrl(raw?.url);
  const id = safeDraftId(raw?.id);
  if (!id || !url) return null;
  const type = normalizeType(raw?.type || raw?.target || raw?.kind);
  const target = targetFor(type);
  return {
    id,
    label: clean(raw?.label || target.label, 72) || target.label,
    message: clean(raw?.message, MAX_CAMPAIGN_MESSAGE_LENGTH),
    url,
    type,
    destination: clean(raw?.destination || target.destination, 96) || target.destination,
    linkKind: target.linkKind,
    createdAt: typeof raw?.createdAt === 'string' ? raw.createdAt : ''
  };
}

export function getShareCenterTarget(value = '') {
  return targetFor(value);
}

export function buildEonInviteMessage(profile = ensureProfile()) {
  const alias = clean(profile?.alias || 'an EONAPP user', 32);
  return `${alias} invited you to try EONAPP — a private AI workdesk with EONBOT, local-first tools, and EON City.`;
}

export function buildShareCenterMessage(type = 'eonapp', options = {}) {
  const target = targetFor(type);
  const profile = options.profile || ensureProfile();
  const alias = clean(profile?.alias || 'an EONAPP user', 32);
  if (target.id === 'city') {
    return `${alias} invited you to explore EON City in EONAPP — a lightweight visual world for your private AI workdesk.`;
  }
  if (target.id === 'realm') {
    const realm = options.realmIdentity || {};
    const label = clean(realm.label || 'an EON Realm', 48);
    return `Explore ${label} in EONAPP through a signed portable Realm identity link. It does not publish a storefront, payment request, or private City data.`;
  }
  return buildEonInviteMessage(profile);
}

export function listShareDrafts(options = {}) {
  try {
    const parsed = JSON.parse(safeStorage(options.storage)?.getItem(SHARE_DRAFTS_STORAGE_KEY) || 'null');
    const drafts = Array.isArray(parsed?.drafts) ? parsed.drafts : [];
    return drafts
      .map((draft) => normalizeDraft(draft))
      .filter(Boolean)
      .slice(0, MAX_SHARE_DRAFTS);
  } catch {
    return [];
  }
}

export function saveShareDraft(draft = {}, options = {}) {
  const next = normalizeDraft({ ...draft, createdAt: draft.createdAt || nowIso() });
  if (!next) return null;
  const existing = listShareDrafts(options).filter((entry) => entry.id !== next.id);
  const drafts = [next, ...existing].slice(0, MAX_SHARE_DRAFTS);
  try {
    safeStorage(options.storage)?.setItem(SHARE_DRAFTS_STORAGE_KEY, JSON.stringify({
      schema: SHARE_DRAFTS_SCHEMA,
      drafts
    }));
    return next;
  } catch {
    return null;
  }
}

export function removeShareDraft(id = '', options = {}) {
  const safeId = safeDraftId(id);
  if (!safeId) return false;
  const drafts = listShareDrafts(options).filter((draft) => draft.id !== safeId);
  try {
    safeStorage(options.storage)?.setItem(SHARE_DRAFTS_STORAGE_KEY, JSON.stringify({
      schema: SHARE_DRAFTS_SCHEMA,
      drafts
    }));
    return true;
  } catch {
    return false;
  }
}

function normaliseCampaignIntent(raw = {}) {
  const draft = normalizeDraft(raw?.draft || raw);
  if (!draft) return null;
  return {
    schema: SHARE_CAMPAIGN_INTENT_SCHEMA,
    draft,
    createdAt: typeof raw?.createdAt === 'string' ? raw.createdAt : nowIso(),
    mode: 'local-draft',
    activeRewards: false,
    activePayouts: false,
    automatedPosting: false
  };
}

export function saveShareCampaignIntent(raw = {}, options = {}) {
  const intent = normaliseCampaignIntent(raw);
  if (!intent) return null;
  try {
    safeStorage(options.storage)?.setItem(SHARE_CAMPAIGN_INTENT_STORAGE_KEY, JSON.stringify(intent));
    return intent;
  } catch {
    return null;
  }
}

export function readShareCampaignIntent(options = {}) {
  try {
    const raw = JSON.parse(safeStorage(options.storage)?.getItem(SHARE_CAMPAIGN_INTENT_STORAGE_KEY) || 'null');
    return normaliseCampaignIntent(raw);
  } catch {
    return null;
  }
}

export function clearShareCampaignIntent(options = {}) {
  try {
    safeStorage(options.storage)?.removeItem(SHARE_CAMPAIGN_INTENT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

async function createRealmCenterDraft(options = {}) {
  const storage = safeStorage(options.storage);
  const loaded = options.realmState
    ? { state: options.realmState }
    : ensureMyRealmState({ storage });
  const realmIdentity = getMyRealmPublicIdentity(loaded.state);
  if (!realmIdentity.shareEligible) {
    const issue = realmIdentity.reviewIssues[0] || 'Review your Realm label and handle before sharing.';
    throw new Error(issue);
  }
  const result = await createRealmShareLink({
    publicRealmId: realmIdentity.id,
    username: realmIdentity.handle,
    displayName: realmIdentity.label,
    theme: realmIdentity.theme
  }, {
    source: 'share-center',
    origin: safeOrigin(options.origin),
    identity: options.identity
  });
  return {
    result,
    realmIdentity,
    target: targetFor('realm')
  };
}

export async function createShareCenterDraft(options = {}) {
  const storage = safeStorage(options.storage);
  const type = resolveShareCenterType(options);
  const target = targetFor(type);
  const profile = options.profile || ensureProfile();
  let result;
  let realmIdentity = null;

  if (target.id === 'realm') {
    const realm = await createRealmCenterDraft({ ...options, storage });
    result = realm.result;
    realmIdentity = realm.realmIdentity;
  } else {
    result = await createSignedShareLink({
      destination: target.destination,
      source: 'share-center',
      missionType: 'share_eonapp',
      origin: safeOrigin(options.origin),
      identity: options.identity
    });
  }

  const draft = {
    id: options.id,
    label: clean(options.label || target.label, 72) || target.label,
    message: clean(options.message || buildShareCenterMessage(target.id, { profile, realmIdentity }), MAX_CAMPAIGN_MESSAGE_LENGTH),
    url: result.canonicalLink,
    type: target.id,
    destination: target.id === 'realm' ? `/u/${realmIdentity.handle}` : target.destination,
    createdAt: nowIso()
  };
  const normalisedDraft = normalizeDraft(draft);
  const saved = options.persist === false ? normalisedDraft : saveShareDraft(normalisedDraft, { storage });
  let referralStatus = null;
  let referralRegistration = null;
  if (target.id !== 'realm' && result.token) {
    referralStatus = await fetchReferralStatus(options.referralStatusOptions || {});
    if (referralStatus?.active && referralStatus?.signedIn) {
      referralRegistration = await bindReferralIdentityFromInvite(result.token);
    }
  }
  return {
    ...normalisedDraft,
    saved: saved || null,
    missionCode: result.missionCode || '',
    protocol: result.payload?.schema || '',
    publicNotice: result.publicNotice || PUBLIC_LINK_NOTICE,
    realmIdentity,
    referralStatus,
    referralRegistration,
    activeRewards: referralStatus?.active === true,
    activePayouts: false,
    automatedPosting: false,
    clickTracking: false
  };
}

/** Compatibility wrapper retained for callers from W218. */
export async function createEonInviteDraft(options = {}) {
  return createShareCenterDraft({ ...options, type: 'eonapp' });
}

function focusableNodes(root) {
  return [...root.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled])')]
    .filter((node) => !node.hidden && node.offsetParent !== null);
}

async function renderCenterQr(canvas, value) {
  const module = await import('./qr-code.js');
  return module.renderQrCanvas(canvas, value, { width: 168, margin: 1 });
}

function downloadQr(canvas, type = 'invite') {
  if (!canvas || canvas.dataset.qrReady !== 'true') {
    showToast('QR code is not ready yet.', 'error');
    return;
  }
  try {
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `eonapp-${clean(type, 24).replace(/[^a-z0-9-]/gi, '-') || 'invite'}-qr.png`;
    anchor.rel = 'noopener';
    anchor.click();
    showToast('QR image saved.', 'success');
  } catch {
    showToast('QR image could not be saved in this browser.', 'error');
  }
}

function shareOpen(url = '') {
  try {
    const target = new URL(url, window.location.origin);
    if (!/^https?:$/i.test(target.protocol)) return;
    window.open(target.toString(), '_blank', 'noopener,noreferrer');
  } catch {}
}

function buildCampaignBriefPrompt(draft = {}) {
  const url = validPublicUrl(draft?.url);
  const message = clean(draft?.message, MAX_CAMPAIGN_MESSAGE_LENGTH);
  return `Create a clear organic sharing kit for EONAPP using this signed invite link: ${url || 'Use the current signed invite link.'}\n\nGive me: 1) one short caption, 2) three platform-friendly variants, 3) a simple visual brief, and 4) a one-week manual posting plan.${message ? ` Existing message: ${message}` : ''} Do not promise earnings, rewards, investment results, or a giveaway. Do not claim that any account is connected or that anything will post automatically.`;
}

function openCampaignBriefInEonbot(draft = {}) {
  const prompt = buildCampaignBriefPrompt(draft);
  try { sessionStorage.setItem('eon:chat:pending-composer-prompt:v1', prompt); } catch {}
  if (normalizedPathForShare() === '/') {
    window.dispatchEvent(new CustomEvent('eon:composer-prompt', { detail: { prompt } }));
    return;
  }
  window.location.assign('/?compose=share');
}


// W618B compatibility wording superseded by W623G: "Share the app. Earn EON Keys later."
// Safety phrase retained for archived source gates: "EON Keys never create cash, wallet, crypto, NFT, resale, payout, commission, or platform-paid AI credits".
function renderShareRewardSummary() {
  const keyTypes = getEonKeyTypes().slice(0, 3).map((key) => `<li><strong>${clean(key.label, 48)}</strong><span>${clean(key.summary, 180)}</span></li>`).join('');
  const rewardRows = getEonReferralRewardMatrix()
    .filter((row) => row.inviterReward?.length || row.inviteeReward?.length)
    .slice(0, 3)
    .map((row) => `<li><strong>${clean(row.label, 56)}</strong><span>${clean([...(row.inviterReward || []), ...(row.inviteeReward || [])].join(' · '), 180)}</span></li>`)
    .join('');
  const unlocks = getEonUnlockMenu().slice(0, 5).map((unlock) => clean(unlock.label, 72)).join(' · ');
  return `
    <section class="eon-share-rewards eon-share-referral-compact" aria-labelledby="eon-share-rewards-title">
      <div class="eon-share-reward-head"><div><p class="eon-share-sheet-kicker">EONKEY status · server authority</p><h3 id="eon-share-rewards-title" data-eon-referral-heading>Checking the referral authority…</h3></div><span class="eon-share-status-pill" data-eon-referral-pill data-state="checking">Checking…</span></div>
      <p data-eon-referral-disclosure>Sharing remains available while the exact referral state is checked.</p>
      <p class="eon-share-referral-reference" data-eon-referral-reference>Endpoint: /api/referrals · reference: checking</p>
      <details class="eon-share-referral-details"><summary>Referral details and non-cash boundaries</summary>
        <div class="eon-share-reward-grid"><article><strong>Key types</strong><ul>${keyTypes}</ul></article><article><strong>Eligible verified moments</strong><ul>${rewardRows}</ul></article></div>
        <p class="eon-share-unlock-line"><strong>Unlock examples:</strong> ${unlocks}.</p>
        <p class="eon-share-reward-boundary">${clean(EON_AI_COST_BOUNDARY.statement, 260)} EONKEYS never create cash, wallet, crypto, NFT, resale, payout, commission, a subscription, a discount, or platform-paid AI credits. Sharing, copying or posting alone creates no reward.</p>
        <details class="eon-share-promotion-safety"><summary>Public sharing safety</summary><ul>${EON_VIRAL_GUARDRAILS.map((rule) => `<li>${clean(rule, 240)}</li>`).join('')}</ul></details>
      </details>
    </section>`;
}

function renderViralShareStudio() {
  const capability = getEonNativeShareCapability();
  const handoff = readEonOutputShareHandoff();
  const handoffCopy = handoff
    ? `<div class="eon-share-handoff-ready"><strong>${clean(handoff.sourceLabel, 72)} ready</strong><span>${clean(handoff.title, 120)} · ${clean(handoff.usefulOutcome, 180)}</span></div>`
    : '<p class="eon-share-muted">Finish an image, video, music track, Forge starter or City postcard to prefill this area. You can also choose a local file manually.</p>';
  return `
    <section class="eon-share-viral-studio" aria-labelledby="eon-share-viral-title">
      <div class="eon-share-viral-head"><div><p class="eon-share-sheet-kicker">Public-safe sharing studio</p><h3 id="eon-share-viral-title">Turn useful work into something people want to pass on</h3></div><span>${capability.nativeShare ? 'Native share ready' : 'Copy + open fallback'}</span></div>
      <div class="eon-share-launch-grid">${EON_VIRAL_SHARE_SURFACES.map((surface) => `<article><span aria-hidden="true">${surface.icon}</span><strong>${clean(surface.label, 60)}</strong><p>${clean(surface.promise, 180)}</p></article>`).join('')}</div>
      <section class="eon-share-creation" aria-labelledby="eon-share-creation-title">
        <div><h4 id="eon-share-creation-title">Share an image, video or music file</h4><p>On supported devices, the system share menu can hand one local file directly to any installed app. EONAPP does not upload, host or retain it.</p></div>
        ${handoffCopy}
        <label class="eon-share-field"><span>Local image, video or audio</span><input type="file" accept="image/*,video/*,audio/*" data-eon-viral-file /></label>
        <label class="eon-share-field"><span>Title</span><input type="text" maxlength="120" data-eon-viral-title value="Made with EONAPP" /></label>
        <label class="eon-share-field"><span>Caption</span><textarea maxlength="1600" data-eon-viral-caption>${clean(handoff?.usefulOutcome || 'I turned an idea into a useful result with EONAPP.', 700)}</textarea></label>
        <div class="eon-share-sheet-draft-actions"><button type="button" data-eon-viral-native>Share local file…</button><button type="button" data-eon-viral-copy>Copy caption</button></div>
        <p class="eon-share-action-status" data-eon-viral-status>Nothing posts until you choose a destination and confirm.</p>
      </section>
      <section class="eon-share-card-maker" aria-labelledby="eon-share-card-title">
        <div><h4 id="eon-share-card-title">Create a progress card</h4><p>Celebrate a creation, project milestone, EON City signal or Vault Reveal without exposing private work.</p></div>
        <div class="eon-share-card-fields">
          <label class="eon-share-field"><span>Card type</span><select data-eon-card-preset>${EON_SHARE_CARD_PRESETS.map((preset) => `<option value="${preset.id}">${clean(preset.label, 60)}</option>`).join('')}</select></label>
          <label class="eon-share-field"><span>Headline</span><input type="text" maxlength="120" data-eon-card-title value="I made something new" /></label>
          <label class="eon-share-field eon-share-card-detail"><span>Public-safe detail</span><textarea maxlength="360" data-eon-card-detail>A new image, video, music track, website or project is ready to explore.</textarea></label>
        </div>
        <div class="eon-share-sheet-draft-actions"><button type="button" data-eon-card-share>Share card…</button><button type="button" data-eon-card-save>Save PNG</button></div>
        <p class="eon-share-action-status" data-eon-card-status>Card is generated locally only after you press a button.</p>
      </section>
    </section>`;
}

function renderSavedDrafts(root, activate, options = {}) {
  const host = root.querySelector('[data-eon-share-saved]');
  if (!host) return;
  const drafts = listShareDrafts({ storage: options.storage });
  if (!drafts.length) {
    host.innerHTML = '<p class="eon-share-saved-empty">No local campaign drafts yet.</p>';
    return;
  }
  host.innerHTML = drafts.slice(0, 4).map((draft) => `
    <article class="eon-share-saved-item">
      <div><strong>${clean(draft.label, 72)}</strong><span>${targetFor(draft.type).shortLabel} · local draft</span></div>
      <div class="eon-share-saved-actions"><button type="button" data-eon-share-use="${draft.id}">Use</button><button type="button" data-eon-share-remove="${draft.id}" aria-label="Delete ${clean(draft.label, 72)}">×</button></div>
    </article>`).join('');
  host.querySelectorAll('[data-eon-share-use]').forEach((button) => {
    button.addEventListener('click', () => {
      const draft = listShareDrafts({ storage: options.storage }).find((entry) => entry.id === button.dataset.eonShareUse);
      if (draft) activate(draft.type, draft);
    });
  });
  host.querySelectorAll('[data-eon-share-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      removeShareDraft(button.dataset.eonShareRemove || '', { storage: options.storage });
      renderSavedDrafts(root, activate, options);
      showToast('Local campaign draft removed.', 'success');
    });
  });
}

function updateReferralRewardStatus(root, draft = {}) {
  const status = draft?.referralStatus || {};
  const registration = draft?.referralRegistration || {};
  const state = ['active', 'inactive', 'unavailable'].includes(status?.state) ? status.state : status?.active ? 'active' : status?.ok === false ? 'unavailable' : 'inactive';
  const pill = root.querySelector('[data-eon-referral-pill]');
  const disclosure = root.querySelector('[data-eon-referral-disclosure]');
  const heading = root.querySelector('[data-eon-referral-heading]');
  const reference = root.querySelector('[data-eon-referral-reference]');
  if (!pill || !disclosure || !heading) return;
  const ref = clean(status?.referenceCode || status?.error || `referral-${state}`, 120);
  const endpoint = clean(status?.endpoint || status?.authority?.endpoint || '/api/referrals', 120);
  const checkedAt = clean(status?.checkedAt || status?.freshness?.checkedAt || '', 80);
  const http = Number(status?.httpStatus || 0);
  const database = clean(status?.authority?.databaseMode || status?.databaseMode || status?.authority?.databaseBinding || status?.databaseBinding || 'not reported', 80);
  if (reference) reference.textContent = `Endpoint: ${endpoint} · state: ${state} · reference: ${ref}${http ? ` · HTTP ${http}` : ''}${checkedAt ? ` · checked ${checkedAt}` : ''} · database: ${database}`;
  if (state === 'unavailable') {
    pill.dataset.state = 'unavailable';
    pill.textContent = 'Unavailable';
    heading.textContent = 'Referral status is unavailable; sharing still works.';
    disclosure.textContent = `The server state could not be verified. Reference ${ref || 'referral-status-unavailable'}. No inactive or reward claim is inferred from this failure.`;
    return;
  }
  if (state === 'inactive') {
    pill.dataset.state = 'inactive';
    pill.textContent = 'Inactive';
    heading.textContent = 'The referral programme is inactive. Normal sharing remains available.';
    disclosure.textContent = 'Signed links, Copy, QR, local capture and native sharing still work. No referral grant, redemption or EONKEY can be created while the server authority reports inactive.';
    return;
  }
  if (!status.signedIn) {
    pill.dataset.state = 'active';
    pill.textContent = 'Active';
    heading.textContent = 'The referral programme is active; sign in to attach an invite identity.';
    disclosure.textContent = 'Sharing alone creates no reward. Only eligible server-verified milestones may create non-cash EONKEY unlocks after sign-in and attribution.';
    return;
  }
  pill.dataset.state = registration?.ok === false ? 'attention' : 'active';
  pill.textContent = registration?.ok === false ? 'Identity check' : 'Active';
  heading.textContent = registration?.ok === false
    ? 'The programme is active, but this signed invite identity needs attention.'
    : 'The programme and signed invite identity are active.';
  disclosure.textContent = registration?.ok === false
    ? `The link remains shareable. Identity reference ${clean(registration?.error || 'bind-identity-unavailable', 100)}.`
    : buildEonRewardDisclosure({ active: true });
}

// W728 compatibility phrase retained: Record gameplay, then share the moment.
function renderShareCenterMarkup({ creatorCaptureAvailable = true, showClose = false, modal = false } = {}) {
  return `
    <section class="eon-share-sheet eon-share-center eon-share-center-v2" data-eon-share-center-schema="${EON_SHARE_CENTER_W753_SCHEMA}" ${modal ? 'role="dialog" aria-modal="true"' : 'role="region"'} aria-labelledby="eon-share-title" tabindex="-1">
      <header class="eon-share-sheet-header">
        <div><p class="eon-share-sheet-kicker">W753 · quick invite · local capture · truthful status</p><h2 id="eon-share-title">Share Command Center 2.0</h2></div>
        ${showClose ? '<button type="button" class="eon-share-icon-button" data-eon-share-close aria-label="Close Share Command Center">×</button>' : ''}
      </header>
      <p class="eon-share-sheet-lead">Create a signed invite, copy it, share through your device, save its QR, or record EON City locally. Nothing uploads or posts automatically.</p>
      <div class="eon-share-targets" role="tablist" aria-label="Choose the signed invite target">
        ${SHARE_CENTER_TARGETS.map((target) => `<button type="button" role="tab" data-eon-share-target="${target.id}" aria-selected="false">${target.shortLabel}</button>`).join('')}
      </div>
      <section class="eon-share-quick" aria-labelledby="eon-share-quick-title">
        <div class="eon-share-quick-head"><div><p class="eon-share-sheet-kicker">Quick Share</p><h3 id="eon-share-quick-title">Signed invite and QR</h3></div><p class="eon-share-target-copy" data-eon-share-target-copy></p></div>
        <div class="eon-share-sheet-linkrow">
          <input type="text" readonly aria-label="Generated signed invite link" data-eon-share-link value="Creating a signed invite…" />
          <button type="button" class="eon-share-primary" data-eon-share-copy disabled>Copy link</button>
        </div>
        <div class="eon-share-quick-grid">
          <div>
            <div class="eon-share-sheet-actions eon-share-primary-actions" aria-label="Primary share actions">
              <button type="button" data-eon-share-native disabled>Share…</button>
              <button type="button" data-eon-share-platform="whatsapp" disabled>WhatsApp</button>
            </div>
            <label class="eon-share-review-check"><input type="checkbox" data-eon-share-review-confirm disabled /> I reviewed the target, signed link and public-safe message.</label>
            <button type="button" data-eon-share-review-receipt disabled>Confirm reviewed handoff</button>
            <p class="eon-share-action-status" data-eon-share-review-status>A mission receipt is created only after this explicit review—or after saving a local Creator Capture WebM.</p>
          </div>
          <section class="eon-share-qr" aria-labelledby="eon-share-qr-title">
            <div><h4 id="eon-share-qr-title">Invite QR</h4><p>Contains only the signed public link.</p></div>
            <canvas width="168" height="168" data-eon-share-qr aria-label="Invite QR code"></canvas>
            <button type="button" data-eon-share-download-qr disabled>Save QR</button>
          </section>
        </div>
      </section>
      <section class="eon-share-city-capture" data-eon-share-city-capture ${creatorCaptureAvailable ? '' : 'hidden'} aria-labelledby="eon-share-city-capture-title">
        <div><p class="eon-share-sheet-kicker">Creator Capture · local recording</p><h3 id="eon-share-city-capture-title">Record, preview and save EON City</h3><p>Start with microphone off, add facecam only when chosen, stop and preview locally, then save WebM or prepare a reviewed signed invite.</p></div>
        <button type="button" data-eon-share-capture>Open Creator Capture</button>
      </section>
      ${renderViralShareStudio()}
      ${renderShareRewardSummary()}
      <details class="eon-share-advanced">
        <summary>Campaign drafts, more destinations and technical details</summary>
        <div class="eon-share-sheet-actions eon-share-more-destinations" aria-label="More manual share destinations">
          <button type="button" data-eon-share-platform="telegram" disabled>Telegram</button>
          <button type="button" data-eon-share-platform="x" disabled>X</button>
          <button type="button" data-eon-share-platform="linkedin" disabled>LinkedIn</button>
          <button type="button" data-eon-share-platform="facebook" disabled>Facebook</button>
          <button type="button" data-eon-share-platform="reddit" disabled>Reddit</button>
          <button type="button" data-eon-share-platform="email" disabled>Email</button>
        </div>
        <section class="eon-share-sheet-draft" aria-labelledby="eon-share-draft-title">
          <h3 id="eon-share-draft-title">Campaign draft</h3>
          <p>Save optional copy locally or ask EONBOT to shape a manual posting plan. No social account is connected and no post is scheduled.</p>
          <label class="eon-share-field"><span>Label</span><input type="text" maxlength="72" data-eon-share-label placeholder="Example: EON City invite" /></label>
          <label class="eon-share-field"><span>Message</span><textarea maxlength="${MAX_CAMPAIGN_MESSAGE_LENGTH}" data-eon-share-message></textarea></label>
          <div class="eon-share-sheet-draft-actions"><button type="button" data-eon-share-save disabled>Save local draft</button><button type="button" data-eon-share-workspace disabled>Build a manual share kit with EONBOT</button></div>
        </section>
        <section class="eon-share-saved" aria-labelledby="eon-share-saved-title"><h3 id="eon-share-saved-title">Saved local drafts</h3><div data-eon-share-saved></div></section>
      </details>
      <p class="eon-share-sheet-notice" data-eon-share-notice>${PUBLIC_LINK_NOTICE}</p>
    </section>`;
}

export async function mountEonShareCenter(root, options = {}) {
  if (!root || typeof root.querySelector !== 'function') throw new Error('share-center-root-required');
  const environment = options.environment || globalThis;
  const creatorCaptureAvailable = options.creatorCaptureAvailable !== false;
  const modal = options.modal === true;
  const showClose = options.showClose === true;
  const close = typeof options.close === 'function' ? options.close : () => {};
  const openWorkSurface = typeof options.openWorkSurface === 'function' ? options.openWorkSurface : null;
  root.dataset.eonShareCenter = '1';
  root.innerHTML = renderShareCenterMarkup({ creatorCaptureAvailable, showClose, modal });
  const sheet = root.querySelector('.eon-share-sheet');
  let active = null;
  let generation = 0;
  let disposed = false;

  const currentMessage = () => clean(root.querySelector('[data-eon-share-message]')?.value || active?.message || '', MAX_CAMPAIGN_MESSAGE_LENGTH);
  const currentLabel = () => clean(root.querySelector('[data-eon-share-label]')?.value || active?.label || '', 72) || active?.label || 'Share draft';
  const actionLinks = () => buildShareLinks(currentMessage(), active?.url || '');
  const setReviewStatus = (message = '') => { const node = root.querySelector('[data-eon-share-review-status]'); if (node) node.textContent = String(message || ''); };

  const updateControls = (ready) => {
    for (const selector of ['[data-eon-share-copy]', '[data-eon-share-native]', '[data-eon-share-save]', '[data-eon-share-workspace]', '[data-eon-share-download-qr]']) {
      const node = root.querySelector(selector); if (node) node.disabled = !ready;
    }
    root.querySelectorAll('[data-eon-share-platform]').forEach((button) => { button.disabled = !ready; });
    const checkbox = root.querySelector('[data-eon-share-review-confirm]');
    if (checkbox) { checkbox.disabled = !ready; if (!ready) checkbox.checked = false; }
    const review = root.querySelector('[data-eon-share-review-receipt]');
    if (review) review.disabled = !ready || checkbox?.checked !== true;
  };

  const activate = async (type, savedDraft = null) => {
    const target = targetFor(type);
    const request = ++generation;
    root.querySelectorAll('[data-eon-share-target]').forEach((button) => {
      const selected = button.dataset.eonShareTarget === target.id;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    const targetCopy = root.querySelector('[data-eon-share-target-copy]');
    if (targetCopy) targetCopy.textContent = target.description;
    const captureCard = root.querySelector('[data-eon-share-city-capture]');
    if (captureCard) captureCard.hidden = target.id !== 'city' || !creatorCaptureAvailable;
    const linkInput = root.querySelector('[data-eon-share-link]');
    const notice = root.querySelector('[data-eon-share-notice]');
    if (linkInput) linkInput.value = 'Creating a fresh signed link…';
    if (notice) notice.textContent = 'Creating a signed public link. No social post, upload, reward or click tracking is created.';
    setReviewStatus('Review confirmation becomes available after the signed link and QR are ready.');
    updateControls(false);
    try {
      const draft = savedDraft || await createShareCenterDraft({ type: target.id, persist: false, storage: options.storage, origin: environment.location?.origin, referralStatusOptions: options.referralStatusOptions });
      if (disposed || request !== generation) return;
      active = { ...draft, message: clean(savedDraft?.message || draft.message, MAX_CAMPAIGN_MESSAGE_LENGTH) };
      updateReferralRewardStatus(root, active);
      if (linkInput) linkInput.value = active.url;
      const label = root.querySelector('[data-eon-share-label]');
      const message = root.querySelector('[data-eon-share-message]');
      if (label) label.value = active.label;
      if (message) message.value = active.message;
      if (notice) notice.textContent = `${active.publicNotice || PUBLIC_LINK_NOTICE} This is a ${target.shortLabel} link. Copying, sharing or posting alone creates no reward.`;
      const canvas = root.querySelector('[data-eon-share-qr]');
      try { await renderCenterQr(canvas, active.url); } catch { if (canvas) canvas.dataset.qrReady = 'false'; }
      updateControls(true);
      setReviewStatus('Review the target, signed link and public-safe message, then confirm the handoff explicitly.');
    } catch (error) {
      if (disposed || request !== generation) return;
      active = null;
      if (linkInput) linkInput.value = 'Could not create a signed link in this browser.';
      if (notice) notice.textContent = `No private work or referral state was inferred. ${clean(error?.message || '', 140)}`;
      updateControls(false);
    }
  };

  const openCapture = (trigger) => {
    const invocation = { id: 'creator-capture', source: options.source || 'share-command-center', explicitUserAction: true, context: { type: 'city', referralLink: true }, presentationMode: options.presentationMode || 'dock' };
    if (openWorkSurface) return openWorkSurface(invocation, trigger);
    if (options.source) return dispatchEonWorkSurfaceOpen(invocation, environment);
    return dispatchEonWorkSurfaceOpen({ id: 'creator-capture', source: 'share-command-center', explicitUserAction: true, context: { type: 'city', referralLink: true }, presentationMode: options.presentationMode || 'dock' }, environment);
  };

  root.querySelector('[data-eon-share-close]')?.addEventListener('click', close);
  root.querySelector('[data-eon-share-capture]')?.addEventListener('click', (event) => openCapture(event.currentTarget));
  root.querySelectorAll('[data-eon-share-target]').forEach((button) => button.addEventListener('click', () => { void activate(button.dataset.eonShareTarget || 'eonapp'); }));
  root.querySelector('[data-eon-share-review-confirm]')?.addEventListener('change', (event) => {
    const button = root.querySelector('[data-eon-share-review-receipt]');
    if (button) button.disabled = !active?.url || event.currentTarget.checked !== true;
  });
  root.querySelector('[data-eon-share-review-receipt]')?.addEventListener('click', () => {
    const checkbox = root.querySelector('[data-eon-share-review-confirm]');
    const result = recordEonShareW753ReviewedHandoffReceipt({ kind: 'reviewed-signed-handoff', source: 'share-center-local', explicitUserAction: true, signedLinkReviewed: Boolean(active?.url && checkbox?.checked) }, { storage: options.storage, environment, now: Date.now() });
    if (result.ok) {
      setReviewStatus(result.duplicate ? 'This reviewed handoff was already verified. The Share & Capture mission remains duplicate-protected.' : 'Reviewed handoff verified. Return to Missions & Vault to claim the Share & Capture mission explicitly.');
      if (checkbox) checkbox.disabled = true;
      const button = root.querySelector('[data-eon-share-review-receipt]'); if (button) button.disabled = true;
    } else setReviewStatus('The reviewed handoff receipt could not be stored. No mission completion or XP was claimed.');
  });
  root.querySelector('[data-eon-share-copy]')?.addEventListener('click', async () => {
    if (!active?.url) return;
    const copied = await copyToClipboard(active.url);
    setReviewStatus(copied ? 'Signed link copied. Copying alone does not complete a mission or create a reward.' : 'Copy was unavailable; select the visible link manually.');
  });
  root.querySelector('[data-eon-share-native]')?.addEventListener('click', async () => {
    if (!active?.url) return;
    const payload = { title: 'EONAPP', text: currentMessage(), url: active.url };
    if (environment.navigator?.share) { try { await environment.navigator.share(payload); setReviewStatus('System share menu opened. EONAPP cannot see the destination or whether you posted.'); } catch { setReviewStatus('Sharing was cancelled or unavailable. Nothing was posted.'); } }
    else { await copyToClipboard(active.url); setReviewStatus('Native sharing is unavailable, so the signed link was copied. Nothing was posted.'); }
  });
  root.querySelectorAll('[data-eon-share-platform]').forEach((button) => button.addEventListener('click', () => {
    if (!active?.url) return;
    const href = actionLinks()[button.dataset.eonSharePlatform];
    if (href) shareOpen(href);
  }));
  root.querySelector('[data-eon-share-download-qr]')?.addEventListener('click', () => downloadQr(root.querySelector('[data-eon-share-qr]'), active?.type || 'invite'));
  root.querySelector('[data-eon-share-save]')?.addEventListener('click', () => {
    if (!active?.url) return;
    const saved = saveShareDraft({ ...active, label: currentLabel(), message: currentMessage() }, { storage: options.storage });
    showToast(saved ? 'Local campaign draft saved. It will not post automatically.' : 'Could not save this local campaign draft.', saved ? 'success' : 'error');
    renderSavedDrafts(root, activate, { storage: options.storage });
  });
  root.querySelector('[data-eon-share-workspace]')?.addEventListener('click', (event) => {
    if (!active?.url) return;
    const intent = saveShareCampaignIntent({ draft: { ...active, label: currentLabel(), message: currentMessage() } }, { storage: options.storage });
    if (!intent) { showToast('Could not prepare the local campaign brief.', 'error'); return; }
    if (openWorkSurface) {
      try { environment.sessionStorage?.setItem?.('eon:chat:pending-composer-prompt:v1', buildCampaignBriefPrompt(intent.draft)); } catch {}
      openWorkSurface({ id: 'nexus', source: 'share-command-center', explicitUserAction: true, context: { type: 'city', shareCampaignIntent: true }, presentationMode: options.presentationMode || 'dock' }, event.currentTarget);
    } else {
      close();
      openCampaignBriefInEonbot(intent.draft);
    }
  });

  const viralStatus = root.querySelector('[data-eon-viral-status]');
  const cardStatus = root.querySelector('[data-eon-card-status]');
  const selectedLocalFile = () => root.querySelector('[data-eon-viral-file]')?.files?.[0] || null;
  const currentViralCaption = () => clean(root.querySelector('[data-eon-viral-caption]')?.value || '', 1600);
  root.querySelector('[data-eon-viral-copy]')?.addEventListener('click', async () => {
    const caption = currentViralCaption();
    if (!caption) { showToast('Add a caption first.', 'error'); return; }
    const ok = await copyToClipboard(caption);
    if (viralStatus) viralStatus.textContent = ok ? 'Caption copied. Review the destination and disclosure manually.' : 'Caption could not be copied in this browser.';
  });
  root.querySelector('[data-eon-viral-native]')?.addEventListener('click', async () => {
    const file = selectedLocalFile();
    if (!file) { showToast('Choose one local image or video first.', 'error'); return; }
    try {
      const result = await shareEonLocalMedia({ file, title: root.querySelector('[data-eon-viral-title]')?.value || 'Made with EONAPP', text: currentViralCaption(), url: active?.url || '' }, { userGesture: true, navigator: environment.navigator });
      if (viralStatus) viralStatus.textContent = result.ok ? 'System share menu opened. EONAPP cannot see the destination or posting result.' : 'Native file sharing is unavailable. Copy the caption and use the local file manually.';
    } catch { if (viralStatus) viralStatus.textContent = 'Sharing was cancelled or unavailable. The local file stayed on this device.'; }
  });
  const cardInput = () => ({ preset: root.querySelector('[data-eon-card-preset]')?.value || 'creation', title: root.querySelector('[data-eon-card-title]')?.value || '', detail: root.querySelector('[data-eon-card-detail]')?.value || '' });
  const downloadLocalFile = (file) => {
    const url = environment.URL.createObjectURL(file);
    const anchor = environment.document.createElement('a');
    anchor.href = url; anchor.download = file.name || 'eonapp-share-card.png'; anchor.rel = 'noopener'; anchor.click();
    environment.setTimeout(() => environment.URL.revokeObjectURL(url), 1200);
  };
  root.querySelector('[data-eon-card-save]')?.addEventListener('click', async () => {
    try { const file = await createEonShareCardFile(cardInput()); downloadLocalFile(file); if (cardStatus) cardStatus.textContent = 'Public-safe PNG saved locally. Review it before posting.'; }
    catch (error) { if (cardStatus) cardStatus.textContent = clean(error?.message || 'The card could not be created in this browser.', 180); }
  });
  root.querySelector('[data-eon-card-share]')?.addEventListener('click', async () => {
    try {
      const input = cardInput(); const file = await createEonShareCardFile(input);
      const result = await shareEonLocalMedia({ file, title: input.title || 'Made with EONAPP', text: buildEonViralCaption({ ...input, link: active?.url || '', includeRewardDisclosure: false }) }, { userGesture: true, navigator: environment.navigator });
      if (!result.ok) downloadLocalFile(file);
      if (cardStatus) cardStatus.textContent = result.ok ? 'System share menu opened. Posting remains your decision.' : 'Native file sharing is unavailable, so the PNG was saved for manual posting.';
    } catch (error) { if (cardStatus) cardStatus.textContent = clean(error?.message || 'The card could not be shared in this browser.', 180); }
  });

  renderSavedDrafts(root, activate);
  const initialType = resolveShareCenterType({ ...options, environment });
  await activate(initialType);
  if (modal) environment.requestAnimationFrame?.(() => sheet?.focus());
  return Object.freeze({
    ok: true,
    schema: EON_SHARE_CENTER_W753_SCHEMA,
    getActive: () => active,
    activate,
    dispose() { disposed = true; generation += 1; if (options.clearOnDispose === true) root.innerHTML = ''; }
  });
}

export async function openEonShareSheet(options = {}) {
  const existing = document.querySelector('[data-eon-share-sheet]');
  if (existing) { existing.querySelector('[data-eon-share-close]')?.focus(); return existing; }
  const root = document.createElement('div');
  root.className = 'eon-share-sheet-backdrop';
  root.dataset.eonShareSheet = '1';
  document.body.appendChild(root);
  const lastFocus = document.activeElement;
  let mounted = null;
  const close = () => { mounted?.dispose?.(); root.remove(); lastFocus?.focus?.(); };
  root.addEventListener('click', (event) => { if (event.target === root) close(); });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const nodes = focusableNodes(root); if (!nodes.length) return;
    const first = nodes[0]; const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  mounted = await mountEonShareCenter(root, { ...options, modal: true, showClose: true, close, environment: globalThis });
  return root;
}


/**
 * W381 — non-modal compact share surface for the chat header.
 *
 * It creates a self-contained signed invite link and offers explicit copy/native
 * sharing. It does not post to social services, connect accounts, track clicks,
 * or activate any referral incentive. "Create a share brief" simply moves a
 * factual campaign brief into EONBOT for the user to review.
 */
export async function openEonSharePopover(options = {}) {
  const existing = document.querySelector('[data-eon-share-popover]');
  if (existing) {
    existing.querySelector('[data-eon-share-popover-close]')?.focus();
    return existing;
  }

  const root = document.createElement('section');
  root.className = 'eon-share-popover';
  root.dataset.eonSharePopover = '1';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Share EONAPP');
  root.tabIndex = -1;
  root.innerHTML = `
    <header class="eon-share-popover-head">
      <div><p class="eon-share-sheet-kicker">Share</p><h2>Share EONAPP</h2></div>
      <button type="button" class="eon-share-icon-button" data-eon-share-popover-close aria-label="Close share menu">×</button>
    </header>
    <p class="eon-share-popover-copy">Send a simple signed invite. It never includes this chat, files, Vault data or private project work.</p>
    <div class="eon-share-popover-linkrow">
      <input type="text" readonly aria-label="Signed EONAPP invite link" data-eon-share-popover-link value="Creating invite…" />
      <button type="button" class="eon-share-primary" data-eon-share-popover-copy disabled>Copy link</button>
    </div>
    <div class="eon-share-popover-actions" aria-label="Share actions">
      <button type="button" data-eon-share-popover-native disabled>Share…</button>
      <button type="button" data-eon-share-popover-brief disabled>Create a share brief</button><button type="button" data-eon-share-popover-full>Open Command Center</button>
    </div>
    <section class="eon-share-popover-status">
      <strong>Campaigns &amp; scheduling</strong>
      <p>Not connected yet. When publishing connections launch, you will connect each account with OAuth, review content, then approve a post or schedule.</p>
    </section>
    <p class="eon-share-popover-notice" data-eon-share-popover-notice>Creating a signed link locally. EONAPP keeps ordinary display ads disabled; Sponsor Terminal is a separate voluntary rewarded path. This share surface tracks no social post and never posts automatically; sharing, clicks and ad views do not grant referral value by themselves.</p>`;
  document.body.appendChild(root);

  const anchor = typeof Element !== 'undefined' && options.anchor instanceof Element ? options.anchor : null;
  const lastFocus = document.activeElement;
  const position = () => {
    const width = Math.min(364, Math.max(280, window.innerWidth - 24));
    if (!anchor || window.innerWidth <= 640) {
      root.style.setProperty('--eon-share-popover-left', `${Math.max(12, Math.round((window.innerWidth - width) / 2))}px`);
      root.style.setProperty('--eon-share-popover-top', `${Math.max(12, window.innerHeight - 426)}px`);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width));
    const preferredTop = rect.bottom + 10;
    const top = preferredTop + 360 > window.innerHeight ? Math.max(12, rect.top - 360) : preferredTop;
    root.style.setProperty('--eon-share-popover-left', `${Math.round(left)}px`);
    root.style.setProperty('--eon-share-popover-top', `${Math.round(top)}px`);
  };
  position();

  const close = () => {
    window.removeEventListener('resize', position);
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    document.removeEventListener('keydown', onDocumentKeyDown, true);
    root.remove();
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };
  const onDocumentPointerDown = (event) => {
    if (!root.contains(event.target) && event.target !== anchor) close();
  };
  const onDocumentKeyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
  };
  window.addEventListener('resize', position);
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onDocumentKeyDown, true);
  root.querySelector('[data-eon-share-popover-close]')?.addEventListener('click', close);

  let active = null;
  const input = root.querySelector('[data-eon-share-popover-link]');
  const notice = root.querySelector('[data-eon-share-popover-notice]');
  const copy = root.querySelector('[data-eon-share-popover-copy]');
  const nativeShare = root.querySelector('[data-eon-share-popover-native]');
  const brief = root.querySelector('[data-eon-share-popover-brief]');
  const full = root.querySelector('[data-eon-share-popover-full]');
  try {
    active = await createShareCenterDraft({ type: options.type || 'eonapp', persist: false });
    if (input) input.value = active.url;
    if (notice) notice.textContent = 'Signed invite ready. Sharing alone earns nothing. When the programme is active and you are signed in, eligible verified milestones can create non-cash EONKEYS and digital rewards.';
    [copy, nativeShare, brief].forEach((button) => { if (button) button.disabled = false; });
  } catch (error) {
    if (input) input.value = 'Invite link could not be created in this browser.';
    if (notice) notice.textContent = `No private data was shared. ${clean(error?.message || '', 120)}`;
  }

  copy?.addEventListener('click', () => { if (active?.url) void copyToClipboard(active.url); });
  nativeShare?.addEventListener('click', async () => {
    if (!active?.url) return;
    const payload = { title: 'EONAPP', text: active.message, url: active.url };
    if (navigator.share) {
      try { await navigator.share(payload); } catch {}
    } else {
      await copyToClipboard(active.url);
    }
  });
  brief?.addEventListener('click', () => {
    if (!active?.url) return;
    close();
    openCampaignBriefInEonbot(active);
  });
  full?.addEventListener('click', () => {
    close();
    void openEonShareSheet({ type: options.type || 'eonapp' });
  });

  requestAnimationFrame(() => root.querySelector('[data-eon-share-popover-close]')?.focus());
  return root;
}

function normalizedPathForShare() {
  const path = String(globalThis.location?.pathname || '/').replace(/\/+$/, '') || '/';
  return path === '/chat' || path === '/chat.html' ? '/' : path;
}
