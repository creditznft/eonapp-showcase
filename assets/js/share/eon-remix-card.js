import { EON_REMIX_CANONICAL_ORIGIN, parseEonRemixDeepLinkHash } from './eon-remix-deep-link.js';

/**
 * W388A.2 — EON Remix Cards.
 *
 * A Remix Card is a local, explicit starter package for a creator to share by
 * copy, download, or the browser's native share sheet. It does not host a
 * public page, transfer private work, open a collaboration session, create a
 * referral, or prove that anyone remixed anything.
 */

export const EON_REMIX_CARD_SCHEMA = 'eonapp.remix-card.w388a2.v1';

export const EON_REMIX_CARD_KINDS = Object.freeze([
  Object.freeze({ id: 'campaign-brief', label: 'Campaign brief', hint: 'A public-safe idea, audience and first action.' }),
  Object.freeze({ id: 'content-series', label: 'Content series', hint: 'A repeatable post or short-form series starter.' }),
  Object.freeze({ id: 'image-concept', label: 'Image concept', hint: 'A public-safe visual direction someone can reinterpret.' }),
  Object.freeze({ id: 'forge-starter', label: 'Forge starter', hint: 'A public website or app concept without source files.' }),
  Object.freeze({ id: 'video-storyboard', label: 'Video storyboard', hint: 'A short sequence, hook and viewer CTA.' }),
  Object.freeze({ id: 'music-track', label: 'Music track idea', hint: 'A mood, arrangement or production direction without transferring audio.' }),
  Object.freeze({ id: 'dj-set', label: 'DJ set idea', hint: 'A sequencing or energy-arc starter using only authorized music.' }),
  Object.freeze({ id: 'radio-station', label: 'Radio station idea', hint: 'A personal station mood and curation direction without a commercial catalogue.' }),
  Object.freeze({ id: 'city-postcard', label: 'City postcard', hint: 'A finite project-world milestone with one useful next step.' })
]);

const MAX_TITLE = 120;
const MAX_TEXT = 720;
const MAX_CREDIT = 120;
const MAX_LINK = 2048;
const SECRET_LIKE = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|seed phrase|private key)\b\s*[:=]|\b(?:sk|gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw)_[A-Za-z0-9_-]{16,}\b|\bsk-[A-Za-z0-9_-]{18,}\b)/i;

const freeze = (value) => Object.freeze(value);

function clean(value = '', limit = MAX_TEXT) {
  const output = [...String(value ?? '')].filter((character) => { const code = character.charCodeAt(0); return code >= 32 && code !== 127; }).join('').replace(/\s+/g, ' ').trim().slice(0, limit);
  if (SECRET_LIKE.test(output)) throw new Error('Do not include keys, passwords, tokens, private links, or other secrets in a Remix Card.');
  return output;
}

function cardKind(kind = '') {
  const found = EON_REMIX_CARD_KINDS.find((entry) => entry.id === String(kind || '').trim());
  return found || EON_REMIX_CARD_KINDS[0];
}

function publicLink(value = '') {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (SECRET_LIKE.test(raw)) throw new Error('Do not include keys, passwords, tokens, private links, or other secrets in a Remix Card.');
  let url;
  try { url = new URL(raw); } catch { throw new Error('Use a valid public http(s) link or leave the link blank.'); }
  if (!/^https?:$/i.test(url.protocol)) throw new Error('Use a public http(s) link or leave the link blank.');
  const host = url.hostname.toLowerCase();
  const privateHost = host === 'localhost' || host.endsWith('.local') || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  if (privateHost) throw new Error('Use a public link. Local, private-network, or device-only links cannot be included in a Remix Card.');
  return url.toString().slice(0, MAX_LINK);
}

function nowIso() {
  return new Date().toISOString();
}

function cardFormat(card = {}) {
  const kind = cardKind(card.kind);
  return freeze({
    title: card.title,
    kind: freeze({ id: kind.id, label: kind.label }),
    usefulOutcome: card.usefulOutcome,
    firstRemixStep: card.firstRemixStep,
    creatorCredit: card.creatorCredit || '',
    creditRequested: card.creditRequested === true,
    publicLink: card.publicLink || '',
    reuseNote: card.reuseNote || '',
    recipientBoundary: 'Use this as a starting brief and make your own version. It does not grant access to private projects, chats, source, files, media, accounts, keys, or platform permissions.',
    attributionBoundary: 'Creator credit is a courtesy request, not a legal license, ownership claim, or platform rule.',
    publishingBoundary: 'Copy, export, or native-share only. EONAPP does not post, schedule, track reach, verify a remix, or create a referral reward.'
  });
}

export function createEonRemixCard(input = {}) {
  const title = clean(input?.title, MAX_TITLE);
  const usefulOutcome = clean(input?.usefulOutcome, MAX_TEXT);
  const firstRemixStep = clean(input?.firstRemixStep, MAX_TEXT);
  if (!title) throw new Error('Give the Remix Card a clear title.');
  if (!usefulOutcome) throw new Error('Explain the useful outcome someone can make.');
  if (!firstRemixStep) throw new Error('Add one safe first remix step.');
  const card = freeze({
    schema: EON_REMIX_CARD_SCHEMA,
    createdAt: nowIso(),
    title,
    kind: cardKind(input?.kind).id,
    usefulOutcome,
    firstRemixStep,
    creatorCredit: clean(input?.creatorCredit, MAX_CREDIT),
    creditRequested: input?.creditRequested === true,
    publicLink: publicLink(input?.publicLink),
    reuseNote: clean(input?.reuseNote, MAX_TEXT),
    execution: freeze({
      localDraft: true,
      copy: true,
      export: true,
      nativeShare: true,
      publicHosting: false,
      directPublishing: false,
      oauthConnections: false,
      tracking: false,
      referralReward: false,
      collaborationPresence: false
    })
  });
  return freeze({ ...card, card: cardFormat(card) });
}

export function buildEonRemixCardText(card = {}) {
  const view = card.card || cardFormat(card);
  const lines = [
    `EON Remix Card — ${String(view.title || '').trim()}`,
    '',
    `Type: ${String(view.kind?.label || 'Creator starter')}`,
    `Make: ${String(view.usefulOutcome || '').trim()}`,
    `First step: ${String(view.firstRemixStep || '').trim()}`
  ];
  if (view.publicLink) lines.push(`Public link: ${view.publicLink}`);
  if (view.creatorCredit) lines.push(`Creator credit${view.creditRequested ? ' requested' : ''}: ${view.creatorCredit}`);
  if (view.reuseNote) lines.push(`Creator note: ${view.reuseNote}`);
  lines.push('', 'Boundary', view.recipientBoundary, view.attributionBoundary, view.publishingBoundary);
  return lines.join('\n').trim();
}

export function buildEonRemixShareText(card = {}, remixUrl = '') {
  const text = buildEonRemixCardText(card);
  let canonicalRemixUrl = '';
  if (String(remixUrl || '').trim()) {
    try {
      const parsedUrl = new URL(String(remixUrl));
      const canonical = new URL(EON_REMIX_CANONICAL_ORIGIN);
      const starter = parseEonRemixDeepLinkHash(parsedUrl.hash);
      if (parsedUrl.protocol === 'https:' && parsedUrl.origin === canonical.origin && parsedUrl.pathname === '/create' && starter.ok) canonicalRemixUrl = parsedUrl.toString();
    } catch { canonicalRemixUrl = ''; }
  }
  if (!canonicalRemixUrl) return text;
  return `${text}\n\nRemix this in EONAPP:\n${canonicalRemixUrl}`;
}

export function buildEonRemixCardExport(card = {}) {
  if (!String(card?.title || '').trim()) throw new Error('A valid Remix Card is required.');
  return freeze({
    schema: EON_REMIX_CARD_SCHEMA,
    exportedAt: nowIso(),
    card: JSON.parse(JSON.stringify(card)),
    text: buildEonRemixCardText(card),
    limitations: freeze([
      'Export contains text and structured starter direction only.',
      'It contains no source files, media bodies, private chat, account data, credentials, tokens, tracking identifiers, referral code, or publishing proof.',
      'A creator credit request is not a legal license, rights clearance, ownership determination, or platform rule.'
    ])
  });
}

export async function shareEonRemixCard(card = {}, options = {}) {
  let remixUrl = '';
  if (String(options?.remixUrl || '').trim()) {
    try {
      const parsedUrl = new URL(String(options.remixUrl));
      const canonical = new URL(EON_REMIX_CANONICAL_ORIGIN);
      const starter = parseEonRemixDeepLinkHash(parsedUrl.hash);
      if (parsedUrl.protocol === 'https:' && parsedUrl.origin === canonical.origin && parsedUrl.pathname === '/create' && starter.ok) remixUrl = parsedUrl.toString();
    } catch { remixUrl = ''; }
  }
  const text = buildEonRemixShareText(card, remixUrl);
  const share = options?.nativeShare || globalThis.navigator?.share;
  if (typeof share !== 'function') return freeze({ ok: false, reason: 'native-share-unavailable' });
  const payload = {
    title: `EON Remix Card · ${clean(card?.title, MAX_TITLE)}`,
    text: text.slice(0, 1600),
    ...(remixUrl ? { url: remixUrl } : card?.publicLink ? { url: String(card.publicLink) } : {})
  };
  await share(payload);
  return freeze({ ok: true, payload: freeze({ ...payload }) });
}

export function getEonRemixCardTruth() {
  return freeze({
    schema: EON_REMIX_CARD_SCHEMA,
    localPageSessionOnly: true,
    browserSessionPrefillOnly: true,
    publicHosting: false,
    accounts: false,
    privateProjectTransfer: false,
    fileTransfer: false,
    providerCalls: false,
    directPublishing: false,
    oauthConnections: false,
    storedPlatformTokens: false,
    tracking: false,
    referralReward: false,
    imageStarter: true,
    videoStarter: true,
    musicTrackStarter: true,
    djSetStarter: true,
    radioStationStarter: true,
    collaborationPresence: false,
    legalLicenseClaim: false,
    externalRemixProof: false,
    fragmentRemixDeepLinkSupported: true,
    combinedRemixShareCopy: true
  });
}
