/**
 * Institutional AI v2 — creator iteration planning without automatic compute.
 *
 * This planner transforms only the prompt text already visible to the user.
 * It never reads generated media, calls a model/provider, stores history or
 * grants permission for a follow-up generation request.
 */
export const EON_CREATOR_ITERATION_SCHEMA = 'eonapp.creator.iteration-planner.v1';
const freeze = Object.freeze;
const KIND_SUFFIX = freeze({
  image: 'Create a distinct variation. Keep the core subject and mood, but change composition, camera/framing, lighting and secondary details. Do not copy the prior result exactly.',
  video: 'Create a distinct variation. Keep the core subject and motion intent, but change camera framing, pacing and secondary visual details. This is a new generation, not an extension of the prior media.',
  music: 'Create a distinct variation. Keep the core mood and musical identity, but change arrangement, melodic phrasing, texture and progression so it feels related but newly composed.'
});

function clean(value = '') { return String(value || '').replace(/\s+/g, ' ').trim(); }

export function buildCreatorVariationPrompt({ mediaKind = '', prompt = '', iteration = 1, maxChars = 1200 } = {}) {
  const kind = ['image', 'video', 'music'].includes(String(mediaKind)) ? String(mediaKind) : '';
  const source = clean(prompt);
  const limit = Math.max(240, Math.min(12000, Number(maxChars) || 1200));
  if (!kind || !source) return freeze({ ok: false, reason: !kind ? 'unsupported-media-kind' : 'source-prompt-required', prompt: '', providerCalled: false, generationStarted: false });
  const suffix = `${KIND_SUFFIX[kind]} Variation ${Math.max(1, Math.min(999, Number(iteration) || 1))}.`;
  const room = Math.max(80, limit - suffix.length - 2);
  const next = `${source.slice(0, room)}\n\n${suffix}`.slice(0, limit);
  return freeze({
    ok: true,
    schema: EON_CREATOR_ITERATION_SCHEMA,
    mediaKind: kind,
    iteration: Math.max(1, Math.min(999, Number(iteration) || 1)),
    prompt: next,
    promptChars: next.length,
    sourceMediaRead: false,
    promptPersisted: false,
    providerCalled: false,
    localRuntimeCalled: false,
    generationStarted: false,
    budgetApprovalGranted: false,
    automaticNavigation: false
  });
}

export function getCreatorIterationPlannerTruth() {
  return freeze({
    schema: EON_CREATOR_ITERATION_SCHEMA,
    supportedMediaKinds: freeze(['image', 'video', 'music']),
    sourceMediaRead: false,
    promptSessionOnly: true,
    promptPersisted: false,
    providerCalled: false,
    localRuntimeCalled: false,
    generationStarted: false,
    budgetApprovalGranted: false,
    separateGenerateActionRequired: true,
    mediaExtensionClaimed: false
  });
}
