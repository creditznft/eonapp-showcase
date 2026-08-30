/**
 * W623G — public-safe viral sharing primitives.
 *
 * This module deliberately separates a strong sharing experience from reward,
 * attribution and publishing claims. It can prepare captions, local files and
 * branded progress cards, but it cannot post in the background, upload media,
 * prove a social post, qualify a referral or grant EONKEYS.
 */
export const EON_VIRAL_SHARE_KIT_SCHEMA = 'eonapp.viral-share-kit.w623g.v1';
// Client-side viral primitives are never the referral activation authority.
// This false value means "this module cannot assert activation", not that a
// deployment-level referral programme is necessarily inactive. Current state
// comes from the authenticated /api/referrals authority used by Share Center.
export const EON_VIRAL_SHARE_PROGRAM_ACTIVE = false;

const freeze = (value) => Object.freeze(value);
const SECRET_LIKE = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|private[-_ ]?key|seed(?:\s+phrase)?|mnemonic|recovery)\b\s*[:=]|\b(?:sk|gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|ghp|gho)_[A-Za-z0-9_-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;

function clean(value = '', max = 280) {
  const text = Array.from(String(value ?? ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  if (SECRET_LIKE.test(text)) throw new Error('Remove credentials, private links, recovery material or secret-like text before sharing.');
  return text;
}

function publicUrl(value = '') {
  try {
    const url = new URL(String(value || ''), globalThis.location?.origin || 'https://eonapp.ch');
    const local = url.protocol === 'http:' && /^(localhost|127\.0\.0\.1|eonapp\.local)$/i.test(url.hostname);
    return url.protocol === 'https:' || local ? url.toString() : '';
  } catch {
    return '';
  }
}

export const EON_VIRAL_SHARE_SURFACES = freeze([
  freeze({ id: 'invite', label: 'Invite to EONAPP', icon: '↗', promise: 'Send a signed app or City link without sharing private work.', proof: 'signed-public-link' }),
  freeze({ id: 'creation', label: 'Share a creation', icon: '✦', promise: 'Hand one local image, video or audio file to an installed app after review.', proof: 'explicit-native-file-share' }),
  freeze({ id: 'milestone', label: 'Celebrate progress', icon: '◆', promise: 'Create a public-safe project, badge, City or Vault Reveal card.', proof: 'local-generated-card' }),
  freeze({ id: 'campaign', label: 'Build a share campaign', icon: '⌁', promise: 'Ask EONBOT for captions, visual direction and a manual posting plan.', proof: 'reviewable-draft-only' })
]);

export const EON_SHARE_CARD_PRESETS = freeze([
  freeze({ id: 'creation', label: 'Creation launch', kicker: 'MADE WITH EONAPP', defaultTitle: 'I made something new', defaultDetail: 'A new image, video, music track, radio idea, website or project is ready to explore.' }),
  freeze({ id: 'music', label: 'Music signal', kicker: 'EON MUSIC SIGNAL', defaultTitle: 'I made this in EON Music', defaultDetail: 'A new local music result or personal radio idea is ready to hear, remix or build on.' }),
  freeze({ id: 'project', label: 'Project milestone', kicker: 'PROJECT MILESTONE', defaultTitle: 'A real step forward', defaultDetail: 'I moved this project from an idea to a reviewable result.' }),
  freeze({ id: 'city', label: 'EON City badge', kicker: 'EON CITY SIGNAL', defaultTitle: 'Mission complete', defaultDetail: 'A productive EON City mission created a real saved outcome.' }),
  freeze({ id: 'vault', label: 'Vault Reveal', kicker: 'VAULT REVEAL', defaultTitle: 'A new Reveal unlocked', defaultDetail: 'A non-financial visual collectible from my EONAPP journey.' })
]);

export const EON_VIRAL_GUARDRAILS = freeze([
  'No spam, unsolicited messaging, cookie stuffing, cloaking or misleading redirects.',
  'No fake earnings, reach, conversion, scarcity, endorsement or guaranteed-result claims.',
  'EONAPP keeps ordinary display ads disabled, and signed-in users may voluntarily use Sponsor Terminal. Sponsor Terminal is separate from referral attribution: ad views, clicks and shares never qualify as referral milestones. Public sharing is welcome; any independent external promotion must be honest, non-spammy and use a referral programme that is active for your account.',
  'When a material EONKEY benefit can be earned, disclose it clearly in the post itself.',
  'EONKEYS are non-cash, non-transferable app unlocks. They never create a subscription, discount, payout, wallet, token or provider credit.',
  'Private chats, files, Vault secrets, provider keys and hidden project data must never be included.'
]);

export function buildEonRewardDisclosure(options = {}) {
  const active = options.active === true;
  const compact = options.compact === true;
  if (!active) {
    const state = String(options.state || 'unverified').trim().toLowerCase();
    if (state === 'inactive') {
      return compact
        ? 'Referral programme is currently inactive; sharing alone earns nothing.'
        : 'The server currently reports the referral programme inactive. Sharing remains available, but no share, click, signup, purchase or post can create an EONKEY while that server state remains inactive.';
    }
    return compact
      ? 'Referral status is not verified here; sharing alone earns nothing.'
      : 'Referral/EONKEY status is server-authoritative and has not been verified by this helper. Sharing remains available, but never claim a reward from a click, copy, post or share alone.';
  }
  return compact
    ? 'Disclosure: I may earn non-cash EONKEYS if you join and complete an eligible verified milestone.'
    : 'Disclosure: I may earn non-cash, non-transferable EONKEYS if you join through this link and complete an eligible verified milestone. EONKEYS unlock selected EONAPP features only.';
}

export function buildEonViralCaption(input = {}) {
  const preset = EON_SHARE_CARD_PRESETS.find((entry) => entry.id === String(input.preset || '').trim()) || EON_SHARE_CARD_PRESETS[0];
  const title = clean(input.title || preset.defaultTitle, 120) || preset.defaultTitle;
  const detail = clean(input.detail || preset.defaultDetail, 360) || preset.defaultDetail;
  const cta = clean(input.cta || 'Explore EONAPP and make something useful.', 180);
  const link = publicUrl(input.link);
  const disclosure = input.includeRewardDisclosure === true ? buildEonRewardDisclosure({ active: input.rewardProgramActive === true, compact: true }) : '';
  return [title, detail, cta, disclosure, link].filter(Boolean).join('\n\n');
}

export function buildEonShareCardPlan(input = {}) {
  const preset = EON_SHARE_CARD_PRESETS.find((entry) => entry.id === String(input.preset || '').trim()) || EON_SHARE_CARD_PRESETS[0];
  const title = clean(input.title || preset.defaultTitle, 120) || preset.defaultTitle;
  const detail = clean(input.detail || preset.defaultDetail, 360) || preset.defaultDetail;
  const handle = clean(input.handle || 'EONAPP.CH', 48) || 'EONAPP.CH';
  return freeze({
    schema: EON_VIRAL_SHARE_KIT_SCHEMA,
    preset: preset.id,
    kicker: preset.kicker,
    title,
    detail,
    handle,
    width: 1080,
    height: 1350,
    aspect: '4:5',
    publicSafe: true,
    localOnly: true,
    containsPrivateData: false,
    containsRewardClaim: false
  });
}

function wrapCanvasText(context, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function createEonShareCardFile(input = {}, options = {}) {
  if (typeof document === 'undefined') throw new Error('Share-card rendering needs a browser document.');
  const plan = buildEonShareCardPlan(input);
  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot render a share card.');

  const gradient = context.createLinearGradient(0, 0, plan.width, plan.height);
  gradient.addColorStop(0, '#090d16');
  gradient.addColorStop(0.55, '#111827');
  gradient.addColorStop(1, '#071b24');
  context.fillStyle = gradient;
  context.fillRect(0, 0, plan.width, plan.height);

  context.strokeStyle = 'rgba(124, 240, 255, 0.42)';
  context.lineWidth = 3;
  context.strokeRect(54, 54, plan.width - 108, plan.height - 108);

  context.fillStyle = '#8bf8ff';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText(plan.kicker, 92, 150);

  context.fillStyle = '#f8fafc';
  context.font = '800 88px system-ui, sans-serif';
  const titleLines = wrapCanvasText(context, plan.title, plan.width - 184).slice(0, 4);
  let y = 320;
  for (const line of titleLines) {
    context.fillText(line, 92, y);
    y += 105;
  }

  context.fillStyle = '#b7c8d8';
  context.font = '500 42px system-ui, sans-serif';
  const detailLines = wrapCanvasText(context, plan.detail, plan.width - 184).slice(0, 6);
  y += 42;
  for (const line of detailLines) {
    context.fillText(line, 92, y);
    y += 58;
  }

  context.fillStyle = '#8bf8ff';
  context.font = '800 34px system-ui, sans-serif';
  context.fillText(plan.handle, 92, plan.height - 120);
  context.fillStyle = '#94a3b8';
  context.font = '500 26px system-ui, sans-serif';
  context.fillText('Public-safe local card · no private project data included', 92, plan.height - 78);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('The share card could not be encoded.')), 'image/png', 0.94);
  });
  const safeName = clean(options.fileName || `eonapp-${plan.preset}-card.png`, 96).replace(/[^a-zA-Z0-9._-]/g, '-');
  if (typeof File === 'function') return new File([blob], safeName, { type: 'image/png', lastModified: Date.now() });
  blob.name = safeName;
  return blob;
}

export function getEonNativeShareCapability(options = {}) {
  const nav = options.navigator || globalThis.navigator || {};
  const nativeShare = typeof nav.share === 'function';
  const nativeFileShare = nativeShare && typeof nav.canShare === 'function';
  return freeze({
    nativeShare,
    nativeFileShare,
    anyInstalledAppHandoff: nativeShare,
    directSocialPublishing: false,
    accountConnection: false,
    backgroundPosting: false,
    fallback: nativeShare ? 'native-share-menu' : 'copy-caption-and-open-destination'
  });
}

export async function shareEonLocalMedia(input = {}, options = {}) {
  if (options.userGesture !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const nav = options.navigator || globalThis.navigator || {};
  const file = input.file;
  if (!file || !/^(?:image|video|audio)\//i.test(String(file.type || ''))) return freeze({ ok: false, reason: 'local-image-video-or-audio-required' });
  const title = clean(input.title || 'Made with EONAPP', 120);
  const text = clean(input.text || '', 1600);
  const url = publicUrl(input.url);
  const payload = { title, text, ...(url ? { url } : {}), files: [file] };
  if (typeof nav.share !== 'function') return freeze({ ok: false, reason: 'native-share-unavailable', fileKeptLocal: true, fallback: 'copy-caption-and-open-destination' });
  if (typeof nav.canShare === 'function' && nav.canShare(payload) !== true) return freeze({ ok: false, reason: 'native-file-share-unavailable', fileKeptLocal: true, fallback: 'copy-caption-and-open-destination' });
  await nav.share(payload);
  return freeze({ ok: true, fileKeptLocal: true, nativeShareMenuOpened: true, postingProof: false, rewardProof: false });
}

export function calculateEonViralReadiness(input = {}) {
  const checks = [
    ['universalShareAccess', 1.2], ['signedPublicLinks', 1], ['nativeFileShare', 1], ['creatorHandoffs', 1],
    ['brandedProgressCards', 0.8], ['campaignDrafts', 0.8], ['platformVariants', 0.7], ['clearDisclosure', 0.7],
    ['serverAttribution', 1], ['qualifiedRewardLedger', 1], ['abuseReversal', 0.5], ['privacySafeMeasurement', 0.3]
  ];
  const earned = checks.reduce((sum, [id, weight]) => sum + (input[id] === true ? weight : 0), 0);
  const possible = checks.reduce((sum, [, weight]) => sum + weight, 0);
  const score = Math.round((earned / possible) * 100) / 10;
  const blockers = checks.filter(([id]) => input[id] !== true).map(([id]) => id);
  return freeze({ schema: EON_VIRAL_SHARE_KIT_SCHEMA, score, outOf: 10, blockers: freeze(blockers), launchClaimAllowed: score >= 9 && blockers.length === 0 });
}

export function getEonViralShareTruth() {
  return freeze({
    schema: EON_VIRAL_SHARE_KIT_SCHEMA,
    programActive: EON_VIRAL_SHARE_PROGRAM_ACTIVE,
    programActiveMeansClientSourceClaimOnly: true,
    programmeStateAuthority: '/api/referrals',
    defaultProgrammeState: 'unverified',
    clientCanActivateProgramme: false,
    publicSafeInviteLinks: true,
    localMediaNativeShare: true,
    localAudioNativeShare: true,
    musicShareCardPreset: true,
    localShareCards: true,
    eonbotCampaignDrafts: true,
    directPublishing: false,
    automaticPosting: false,
    hostedMedia: false,
    socialAccountTokens: false,
    clickOrConversionTracking: false,
    referralQualification: false,
    eonKeyGrant: false,
    paidAdPromotionRecommended: false
  });
}

export default freeze({
  EON_VIRAL_SHARE_KIT_SCHEMA,
  EON_VIRAL_SHARE_PROGRAM_ACTIVE,
  EON_VIRAL_SHARE_SURFACES,
  EON_SHARE_CARD_PRESETS,
  EON_VIRAL_GUARDRAILS,
  buildEonRewardDisclosure,
  buildEonViralCaption,
  buildEonShareCardPlan,
  createEonShareCardFile,
  getEonNativeShareCapability,
  shareEonLocalMedia,
  calculateEonViralReadiness,
  getEonViralShareTruth
});
