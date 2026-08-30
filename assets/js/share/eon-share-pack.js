/**
 * W388A.1 + W479-P0 — EON Share Pack.
 *
 * A local creator deliverable for draft, export, copy and native share. It is
 * deliberately not an OAuth connector, publishing client, scheduler, campaign
 * tracker, referral-reward record, or reach/engagement claim.
 */
export const EON_SHARE_PACK_SCHEMA = 'eonapp.share-pack.w388a1.v1';

const freeze = (value) => Object.freeze(value);
const SECRET_LIKE = /(?:api[-_ ]?key|secret|token|password|bearer\s+[a-z0-9._-]{8,}|sk-[a-z0-9_-]{12,})/i;
const MAX_TITLE = 120;
const MAX_AUDIENCE = 160;
const MAX_GOAL = 360;
const MAX_CTA = 160;
const MAX_CREDIT = 120;
const MAX_ALT_TEXT = 420;
const MAX_FIRST_COMMENT = 500;
const MAX_FORMAT_NOTES = 420;

export const EON_SHARE_PACK_FORMATS = freeze([
  freeze({ id: 'vertical-video', label: 'Vertical video', frame: '9:16', use: 'Short-form motion brief' }),
  freeze({ id: 'square-post', label: 'Square post', frame: '1:1', use: 'Feed or community card' }),
  freeze({ id: 'wide-video', label: 'Wide video', frame: '16:9', use: 'Long-form cover or video opener' }),
  freeze({ id: 'story-card', label: 'Story card', frame: '9:16', use: 'Quick invitation or update' })
]);

// Universal manual destinations are labels for a post kit, not live connectors.
// The device share sheet chooses the actual app; no platform URL, OAuth or API
// request is made from this module.
export const EON_UNIVERSAL_POST_DESTINATIONS = freeze([
  freeze({ id: 'any-app', label: 'Any app on my device', mode: 'native-share-or-manual' }),
  freeze({ id: 'instagram', label: 'Instagram', mode: 'native-share-or-manual' }),
  freeze({ id: 'facebook-pages', label: 'Facebook Page', mode: 'native-share-or-manual' }),
  freeze({ id: 'tiktok', label: 'TikTok', mode: 'native-share-or-manual' }),
  freeze({ id: 'youtube', label: 'YouTube', mode: 'native-share-or-manual' }),
  freeze({ id: 'x', label: 'X', mode: 'native-share-or-manual' }),
  freeze({ id: 'linkedin', label: 'LinkedIn', mode: 'native-share-or-manual' }),
  freeze({ id: 'pinterest', label: 'Pinterest', mode: 'native-share-or-manual' }),
  freeze({ id: 'threads', label: 'Threads', mode: 'native-share-or-manual' }),
  freeze({ id: 'telegram', label: 'Telegram', mode: 'native-share-or-manual' }),
  freeze({ id: 'discord', label: 'Discord', mode: 'native-share-or-manual' }),
  freeze({ id: 'reddit', label: 'Reddit', mode: 'native-share-or-manual' }),
  freeze({ id: 'whatsapp', label: 'WhatsApp', mode: 'native-share-or-manual' }),
  freeze({ id: 'snapchat', label: 'Snapchat', mode: 'native-share-or-manual' })
]);


export const EON_PLATFORM_VARIANT_GUIDANCE = freeze({
  'any-app': freeze({ aspect: "Use the destination app's recommended crop.", titleField: 'Optional', captionLimit: 1600, notes: 'Keep one universal caption plus a manual upload checklist.' }),
  instagram: freeze({ aspect: '9:16 Reels or Story, 1:1 feed fallback', titleField: 'Not used', captionLimit: 2200, notes: 'Put disclosure near the opening line when needed; keep visual text large.' }),
  'facebook-pages': freeze({ aspect: '1:1 feed or 9:16 Story/Reel', titleField: 'Optional', captionLimit: 5000, notes: 'Use a clear page-safe CTA and avoid unproved performance claims.' }),
  tiktok: freeze({ aspect: '9:16 vertical video', titleField: 'Caption hook', captionLimit: 2200, notes: 'Lead with a short hook, then CTA; upload manually from the device.' }),
  youtube: freeze({ aspect: '16:9 long-form or 9:16 Shorts', titleField: 'Required for upload', captionLimit: 5000, notes: 'Prepare title, description, thumbnail brief, and chapters manually.' }),
  x: freeze({ aspect: '1:1, 16:9, or vertical preview', titleField: 'Post text only', captionLimit: 280, notes: 'Use the short variant and attach media manually.' }),
  linkedin: freeze({ aspect: '1:1 or 16:9 professional preview', titleField: 'Post text only', captionLimit: 3000, notes: 'Make the value proposition professional and evidence-based.' }),
  pinterest: freeze({ aspect: '2:3 pin or 9:16 idea pin', titleField: 'Pin title', captionLimit: 500, notes: 'Use a descriptive visual title and manual destination URL only if public.' }),
  threads: freeze({ aspect: '1:1 or vertical preview', titleField: 'Post text only', captionLimit: 500, notes: 'Use conversational short copy; attach final media manually.' }),
  telegram: freeze({ aspect: 'Any supported media', titleField: 'Message text', captionLimit: 1024, notes: 'Manual channel/group posting only unless a future bot connector is separately proved.' }),
  discord: freeze({ aspect: 'Any supported media', titleField: 'Message text', captionLimit: 2000, notes: 'Manual server/channel posting only; no webhook is active.' }),
  reddit: freeze({ aspect: 'Subreddit-specific', titleField: 'Required post title', captionLimit: 40000, notes: 'Check subreddit rules and flair manually before posting.' }),
  whatsapp: freeze({ aspect: 'Device share media', titleField: 'Message text', captionLimit: 4096, notes: 'Use device share sheet/manual forwarding; no broadcast automation.' }),
  snapchat: freeze({ aspect: '9:16 vertical', titleField: 'Overlay text', captionLimit: 250, notes: 'Prepare short overlay text and upload manually.' })
});

function clean(value = '', max = 160) {
  const output = Array.from(String(value ?? '').replace(/[<>]/g, ' '), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
  if (SECRET_LIKE.test(output)) throw new Error('Do not include keys, passwords, tokens, or other secrets in a Share Pack.');
  return output;
}

function nowIso() {
  return new Date().toISOString();
}

function publicLink(value = '') {
  const raw = clean(value, 2048);
  if (!raw) return '';
  try {
    const parsed = new URL(raw, globalThis.location?.origin || 'https://eonapp.ch');
    const localHttp = /^http:$/i.test(parsed.protocol) && /^(localhost|127\.0\.0\.1|eonapp\.local)$/i.test(parsed.hostname);
    if (!/^https:$/i.test(parsed.protocol) && !localHttp) throw new Error('invalid-protocol');
    return parsed.toString();
  } catch {
    throw new Error('Use a public http(s) link or leave the link field empty.');
  }
}

function selectedFormats(input = []) {
  const requested = Array.isArray(input) ? input.map((item) => String(item || '').trim()) : [];
  const allowed = EON_SHARE_PACK_FORMATS.filter((format) => requested.includes(format.id));
  return allowed.length ? allowed : EON_SHARE_PACK_FORMATS.slice(0, 2);
}

function selectedDestination(input = '') {
  const id = String(input || '').trim().toLowerCase();
  return EON_UNIVERSAL_POST_DESTINATIONS.find((destination) => destination.id === id) || EON_UNIVERSAL_POST_DESTINATIONS[0];
}

function shareableMediaFile(file = null) {
  if (!file || typeof file !== 'object') return null;
  const name = clean(file.name || '', 160);
  const type = clean(file.type || '', 120).toLowerCase();
  const size = Number(file.size || 0);
  if (!name || !Number.isFinite(size) || size < 0) return null;
  if (!/^image\//.test(type) && !/^video\//.test(type) && !/^audio\//.test(type)) return null;
  return file;
}

function compact(value = '', fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function buildCaption({ title, goal, cta, link, credit }, kind = 'standard') {
  const lead = compact(goal, `A creator-ready starting point for ${title}.`);
  const shortLead = lead.length > 132 ? `${lead.slice(0, 129).trim()}…` : lead;
  const base = kind === 'short' ? `${title} — ${shortLead}` : `${title}\n\n${lead}`;
  const call = cta ? `\n\n${cta}` : '';
  const attribution = credit ? `\n\n${credit}` : '';
  const url = link ? `\n${link}` : '';
  return `${base}${call}${attribution}${url}`.trim();
}

function formatDraft(format, input) {
  const headline = input.title;
  const action = compact(input.cta, 'Open the public link and make it your own.');
  return freeze({
    id: format.id,
    label: format.label,
    frame: format.frame,
    use: format.use,
    caption: buildCaption(input, format.id === 'story-card' ? 'short' : 'standard'),
    visualBrief: `Lead with “${headline}”. Show one clear outcome for ${compact(input.audience, 'the intended audience')}, then one proof detail. Keep the frame ${format.frame}, readable without sound, and end with: ${action}`,
    videoBeat: format.id.includes('video') || format.id === 'story-card'
      ? `0–2s: show the outcome. 2–6s: reveal one useful step. 6–10s: show the result. Final beat: ${action}`
      : 'Use a clear headline, one proof point, and an obvious next step. Do not imply performance, reach, earnings, or a result you cannot prove.'
  });
}

export function createEonSharePack(input = {}) {
  const title = clean(input?.title, MAX_TITLE);
  if (!title) throw new Error('Give the Share Pack a clear title.');
  const audience = clean(input?.audience, MAX_AUDIENCE);
  const goal = clean(input?.goal, MAX_GOAL);
  const cta = clean(input?.cta, MAX_CTA);
  const credit = clean(input?.credit, MAX_CREDIT);
  const altText = clean(input?.altText || input?.alt || '', MAX_ALT_TEXT);
  const firstComment = clean(input?.firstComment || '', MAX_FIRST_COMMENT);
  const formatNotes = clean(input?.formatNotes || input?.notes || '', MAX_FORMAT_NOTES);
  const link = publicLink(input?.link);
  const destination = selectedDestination(input?.destination);
  const normalized = freeze({ title, audience, goal, cta, credit, altText, firstComment, formatNotes, link });
  const formats = selectedFormats(input?.formats).map((format) => formatDraft(format, normalized));
  const variant = EON_PLATFORM_VARIANT_GUIDANCE[destination.id] || EON_PLATFORM_VARIANT_GUIDANCE['any-app'];
  return freeze({
    schema: EON_SHARE_PACK_SCHEMA,
    createdAt: nowIso(),
    title,
    audience,
    goal,
    cta,
    credit,
    altText,
    firstComment,
    formatNotes,
    link,
    destination: freeze({ id: destination.id, label: destination.label, mode: destination.mode }),
    formats: freeze(formats),
    platformVariant: freeze({ destinationId: destination.id, ...variant }),
    assetHandoff: freeze({ mode: 'user-selected-local-file-at-share-time', persistentMediaBody: false, cloudMediaHost: false, downloadFallback: true }),
    disclosureReminder: 'If you receive a material benefit for promoting content, use a clear disclosure appropriate to the destination and relationship. This Share Pack does not create a benefit or approve a claim.',
    execution: freeze({ mode: 'draft-export-native-share-only', nativeShareRequiresVisibleUserAction: true, transientUserSelectedFileShare: true, hostedMedia: false, directPublishing: false, oauthConnections: false, storedPlatformTokens: false, automatedScheduling: false, referralReward: false, tracking: false }),
    limitations: freeze([
      'Draft language and creative direction only.',
      'No image, video, audio, project file, private chat, provider response, credential, account, or social-post receipt is stored in the Share Pack.',
      'A user may choose one local image, video or audio file for a single native-share action; EONAPP does not upload, host, retain, scan, or post that file.',
      'A native-share handoff or export does not prove that anything was posted, viewed, remixed, or converted.'
    ])
  });
}

export function buildEonSharePackText(pack = {}) {
  const title = clean(pack?.title, MAX_TITLE);
  if (!title) throw new Error('A valid Share Pack is required.');
  const formats = Array.isArray(pack?.formats) ? pack.formats : [];
  const destination = String(pack?.destination?.label || 'Any app on my device').trim();
  const firstComment = clean(pack?.firstComment || '', MAX_FIRST_COMMENT);
  const altText = clean(pack?.altText || '', MAX_ALT_TEXT);
  const formatNotes = clean(pack?.formatNotes || '', MAX_FORMAT_NOTES);
  const platformVariant = pack?.platformVariant || {};
  const content = formats.map((format) => `# ${format?.label || 'Format'} (${format?.frame || 'draft'})\n\nCaption\n${String(format?.caption || '').trim()}\n\nVisual brief\n${String(format?.visualBrief || '').trim()}\n\n${String(format?.videoBeat || '').trim()}`).join('\n\n---\n\n');
  const accessibility = altText ? `\n\nAlt text / accessibility description\n${altText}` : '';
  const comment = firstComment ? `\n\nFirst comment / pinned comment draft\n${firstComment}` : '';
  const notes = formatNotes ? `\n\nFormat notes\n${formatNotes}` : '';
  const platform = platformVariant?.destinationId ? `\n\nPlatform variant\n${platformVariant.destinationId} · ${platformVariant.aspect || 'manual format'} · ${platformVariant.notes || 'Review platform rules manually.'}` : '';
  return `EON Share Pack — ${title}\n\nDestination\n${destination}\n\n${content}${accessibility}${comment}${notes}${platform}\n\nDisclosure reminder\n${String(pack?.disclosureReminder || '').trim()}\n\nBoundary\nDraft/export/native-share only. No direct publishing, account connection, scheduling, tracking, referral reward, hosted media, or posting claim is active.`.trim();
}

export function buildEonSharePackExport(pack = {}) {
  const text = buildEonSharePackText(pack);
  return freeze({
    schema: EON_SHARE_PACK_SCHEMA,
    exportedAt: nowIso(),
    pack: JSON.parse(JSON.stringify(pack)),
    text,
    limitations: freeze(['Export contains text and structured creative direction only.', 'It contains no media bodies, source footage, private files, credentials, platform tokens, account data, or posting proof.'])
  });
}

export async function shareEonSharePack(pack = {}, options = {}) {
  if (options.userGesture !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const text = buildEonSharePackText(pack);
  const share = options?.nativeShare || globalThis.navigator?.share;
  const canShare = options?.nativeCanShare || globalThis.navigator?.canShare;
  if (typeof share !== 'function') return freeze({ ok: false, reason: 'native-share-unavailable' });
  const primary = Array.isArray(pack?.formats) ? pack.formats[0] : null;
  const file = shareableMediaFile(options?.file);
  const payload = {
    title: `EON Share Pack · ${clean(pack?.title, MAX_TITLE)}`,
    text: String(primary?.caption || text).slice(0, 1600),
    ...(pack?.link ? { url: String(pack.link) } : {})
  };
  if (file) {
    const withFile = { ...payload, files: [file] };
    if (typeof canShare === 'function' && canShare(withFile) !== true) {
      return freeze({ ok: false, reason: 'native-file-share-unavailable', fileKeptLocal: true, payload: freeze({ ...payload }) });
    }
    await share(withFile);
    return freeze({ ok: true, fileShared: true, fileKeptLocal: true, payload: freeze({ ...payload, fileName: file.name, fileType: file.type, fileSize: Number(file.size || 0) }) });
  }
  await share(payload);
  return freeze({ ok: true, fileShared: false, fileKeptLocal: true, payload: freeze({ ...payload }) });
}

export function getEonSharePackTruth() {
  return freeze({
    schema: EON_SHARE_PACK_SCHEMA,
    localPageSessionOnly: true,
    platformVariants: true,
    altTextAndFirstCommentDrafts: true,
    mediaBodies: false,
    transientUserSelectedFileShare: true,
    transientAudioShare: true,
    hostedMedia: false,
    providerCalls: false,
    directPublishing: false,
    oauthConnections: false,
    storedPlatformTokens: false,
    automatedScheduling: false,
    referralReward: false,
    tracking: false
  });
}
