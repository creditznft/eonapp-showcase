/**
 * W321–W327 — Creator Suite 2 local draft engine.
 *
 * This is not a resurrected Creator/Video/Music route and it is not a hidden
 * provider. It prepares ordinary local drafts, metadata and export files in
 * memory only. A creator draft is never labelled as generated media, uploaded,
 * published, scheduled, sold, or licensed until a future user-selected action
 * produces verifiable evidence.
 */

export const CREATOR_SUITE_2_SCHEMA = 'eonapp.creator-suite-2.v1';
export const CREATOR_SUITE_2_MODULES = Object.freeze(['build', 'content', 'image', 'video', 'audio', 'voice']);

const SECRET_LIKE_RE = /(?:\b(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|passphrase|private[_ -]?key|seed(?:\s+phrase)?|mnemonic|authorization)\b\s*[:=]\s*\S+|\b(?:sk|rk|pk|ghp|gho|xox[baprs])[-_][A-Za-z0-9_-]{8,}|\bBearer\s+[A-Za-z0-9._~+/-]{12,})/i;

function clean(value = '', max = 8000) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, max);
}

function safeLine(value = '', max = 180) {
  return clean(value, max).replace(/\s+/g, ' ');
}

function makeId(prefix = 'creator') {
  try { if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`; } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function assertNoSecret(...values) {
  if (values.some((value) => SECRET_LIKE_RE.test(String(value || '')))) throw new Error('Creator Suite drafts cannot contain a credential, token, passphrase, or secret-like value. Store security material only in the encrypted local Vault.');
}

function lines(...values) {
  return values.map((value) => safeLine(value, 800)).filter(Boolean);
}

export function normalizeCreatorSuiteBrief(input = {}) {
  const module = CREATOR_SUITE_2_MODULES.includes(String(input.module || '')) ? String(input.module) : 'content';
  const title = safeLine(input.title || 'Untitled local creator draft', 180);
  const audience = safeLine(input.audience || 'your selected audience', 280);
  const goal = clean(input.goal || '', 4000);
  const style = safeLine(input.style || 'clear, useful, human', 280);
  const callToAction = safeLine(input.callToAction || 'Choose the next step', 180);
  assertNoSecret(title, audience, goal, style, callToAction);
  if (!goal) throw new Error('Describe the local draft goal before preparing it.');
  return Object.freeze({ module, title, audience, goal, style, callToAction });
}

function buildDraftPayload(brief) {
  const common = Object.freeze({
    title: brief.title,
    audience: brief.audience,
    goal: brief.goal,
    style: brief.style,
    callToAction: brief.callToAction,
    localOnly: true,
    externalEffect: false,
    providerCall: false,
    schedule: false,
    publish: false
  });
  if (brief.module === 'build') {return Object.freeze({
    ...common,
    type: 'build-brief',
    deliverables: Object.freeze(['requirements summary', 'page outline', 'component checklist', 'manual developer handoff']),
    outline: Object.freeze(lines('Outcome: ' + brief.goal, 'Audience: ' + brief.audience, 'Style: ' + brief.style, 'CTA: ' + brief.callToAction))
  });}
  if (brief.module === 'content') {return Object.freeze({
    ...common,
    type: 'content-brief',
    deliverables: Object.freeze(['message hierarchy', 'caption variants', 'review checklist']),
    outline: Object.freeze(lines('Primary message: ' + brief.goal, 'Audience language: ' + brief.audience, 'Tone: ' + brief.style, 'CTA: ' + brief.callToAction))
  });}
  if (brief.module === 'image') {return Object.freeze({
    ...common,
    type: 'image-prompt-deck',
    deliverables: Object.freeze(['art direction brief', 'prompt variants', 'rights review checklist']),
    outline: Object.freeze(lines('Visual subject: ' + brief.goal, 'Audience: ' + brief.audience, 'Art direction: ' + brief.style, 'No image generation has started.'))
  });}
  if (brief.module === 'video') {return Object.freeze({
    ...common,
    type: 'video-storyboard',
    deliverables: Object.freeze(['storyboard', 'shot list', 'caption outline', 'manual export checklist']),
    outline: Object.freeze(lines('Opening: ' + brief.goal, 'Middle: show the practical value for ' + brief.audience, 'Closing: ' + brief.callToAction, 'No video rendering or upload has started.'))
  });}
  if (brief.module === 'audio') {return Object.freeze({
    ...common,
    type: 'audio-brief',
    deliverables: Object.freeze(['sound direction', 'usage note', 'manual export checklist']),
    outline: Object.freeze(lines('Audio purpose: ' + brief.goal, 'Listener: ' + brief.audience, 'Sound direction: ' + brief.style, 'No music generation or distribution has started.'))
  });}
  return Object.freeze({
    ...common,
    type: 'voice-script',
    deliverables: Object.freeze(['voice brief', 'script beats', 'consent and rights checklist']),
    outline: Object.freeze(lines('Voice purpose: ' + brief.goal, 'Listener: ' + brief.audience, 'Delivery style: ' + brief.style, 'No voice model call, clone, or playback export has started.'))
  });
}

export function createCreatorSuiteDraft(input = {}, { now = Date.now(), idFactory = makeId } = {}) {
  const brief = normalizeCreatorSuiteBrief(input);
  const payload = buildDraftPayload(brief);
  return Object.freeze({
    schema: CREATOR_SUITE_2_SCHEMA,
    version: 1,
    draftId: String(idFactory('creatordraft') || '').slice(0, 180),
    module: brief.module,
    title: brief.title,
    truthLabel: 'prepared-for-export',
    rightsStatus: 'user-review-required',
    state: 'draft',
    createdAt: new Date(Number(now)).toISOString(),
    payload
  });
}

export function buildCreatorSuiteExport(draft = {}) {
  if (!draft || draft.schema !== CREATOR_SUITE_2_SCHEMA || !String(draft.draftId || '')) throw new Error('Only a Creator Suite 2 local draft can be exported.');
  return Object.freeze({
    schema: 'eonapp.creator-suite-2-export.v1',
    exportedAt: new Date().toISOString(),
    draft: {
      schema: CREATOR_SUITE_2_SCHEMA,
      version: 1,
      draftId: String(draft.draftId),
      module: String(draft.module),
      title: String(draft.title),
      truthLabel: 'prepared-for-export',
      rightsStatus: String(draft.rightsStatus),
      state: 'draft',
      createdAt: String(draft.createdAt),
      payload: draft.payload
    },
    boundary: Object.freeze({
      localDraft: true,
      generatedMedia: false,
      providerCall: false,
      upload: false,
      schedule: false,
      publish: false,
      ownershipProven: false
    })
  });
}

export function getCreatorSuite2Truth() {
  return Object.freeze({
    schema: CREATOR_SUITE_2_SCHEMA,
    canonicalSurface: 'Workspace',
    retiredStandaloneRoutes: true,
    localMemoryDrafts: true,
    durableEncryptedSave: false,
    providerGeneration: false,
    providerProxy: false,
    upload: false,
    schedule: false,
    publish: false,
    walletOrTokenUtility: false,
    rawCredentialAccepted: false
  });
}
