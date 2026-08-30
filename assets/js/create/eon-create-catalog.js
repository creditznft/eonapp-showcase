import { buildEonDestinationHref } from '../contracts/navigation/eon-destination-registry.js';

/**
 * W623E — canonical beginner-first Create catalogue.
 *
 * This registry describes navigation only. It never executes a provider job,
 * stores a provider credential, uploads media, starts checkout, or grants an
 * entitlement. Image/video generation remains local runtime, direct user-owned
 * BYOK, or Guide mode until the later creator programmes are proven.
 */

export const EON_CREATE_EXECUTION_RAILS = Object.freeze([
  'local-runtime',
  'direct-user-owned-byok',
  'guide'
]);

export const EON_CREATE_MODES = Object.freeze([
  Object.freeze({
    id: 'image',
    label: 'Image',
    icon: '▧',
    title: 'Create an image',
    summary: 'Plan an image, prepare a prompt, or set up a supported local image runtime.',
    status: 'Setup required',
    truth: 'Local ComfyUI source integration exists, but a real owner-machine image output is still required before EONAPP claims generation works.',
    primary: Object.freeze({ kind: 'chat', label: 'Plan image', prompt: 'Help me create an image. Ask for subject, purpose, style, aspect ratio and any reference-image needs. Clearly label whether the next step is Local, Direct BYOK or Guide mode.' }),
    secondary: Object.freeze({ label: 'Make Local AI ready', href: buildEonDestinationHref('local-ai', { creator: 'image' }) }),
    rails: Object.freeze(['local-runtime', 'direct-user-owned-byok', 'guide'])
  }),
  Object.freeze({
    id: 'video',
    label: 'Video',
    icon: '▶',
    title: 'Create a video',
    summary: 'Build a storyboard for text-to-video or image-to-video, then choose a supported execution rail.',
    status: 'Setup required',
    truth: 'Local video must produce a real saved video through EONAPP on supported hardware. Weak devices must receive a safe Direct BYOK or Guide fallback.',
    primary: Object.freeze({ kind: 'chat', label: 'Plan video', prompt: 'Help me create a short AI video. Ask whether I want text-to-video or image-to-video, then collect subject, duration, aspect ratio, camera motion and first/last-frame needs. Clearly label Local, Direct BYOK or Guide mode.' }),
    secondary: Object.freeze({ label: 'Make Local AI ready', href: buildEonDestinationHref('local-ai', { creator: 'video' }) }),
    rails: Object.freeze(['local-runtime', 'direct-user-owned-byok', 'guide'])
  }),
  Object.freeze({
    id: 'music',
    label: 'Music',
    icon: '♫',
    title: 'Make music',
    summary: 'Create a beat locally, ask a verified EONBOT model for a sequencer pattern, plan Auto DJ sets, or build a private EON Radio station.',
    status: 'Create now',
    truth: 'The browser sequencer and WAV export are real local tools. Smart Pattern is deterministic synthesis. EONBOT pattern generation is model-assisted only when a verified model succeeds; full generative audio still requires a separately certified music adapter.',
    primary: Object.freeze({ kind: 'chat', label: 'Ask EONBOT for a music idea', prompt: 'Help me make music in EONAPP. Ask for style, mood, vocals/instrumental, duration and intended use. Keep deterministic sequencer patterns distinct from true model-generated audio, and use only a verified Local or Direct BYOK model path when one is ready.' }),
    secondary: Object.freeze({ label: 'Make Local AI ready', href: buildEonDestinationHref('local-ai', { creator: 'music' }) }),
    rails: Object.freeze(['local-runtime', 'direct-user-owned-byok', 'guide'])
  }),
  Object.freeze({
    id: 'website',
    label: 'Website / Forge',
    icon: '⌘',
    title: 'Build a website or app',
    summary: 'Open EON Forge for a reviewable local build, preview and export workflow.',
    status: 'Create now',
    truth: 'Forge is a local-first builder. Remote deployment remains separate and permissioned.',
    primary: Object.freeze({ kind: 'route', label: 'Create in EON Forge', href: buildEonDestinationHref('forge') }),
    secondary: Object.freeze({ label: 'Open Projects', href: buildEonDestinationHref('projects') }),
    rails: Object.freeze(['local-runtime', 'guide'])
  }),
  Object.freeze({
    id: 'project',
    label: 'Project / Document',
    icon: '□',
    title: 'Start a project or document',
    summary: 'Create a saved local outcome with notes, tasks and reusable outputs.',
    status: 'Create now',
    truth: 'Projects live in this browser profile until you explicitly export an encrypted Capsule.',
    primary: Object.freeze({ kind: 'route', label: 'Open Projects', href: buildEonDestinationHref('projects', { create: '1' }) }),
    secondary: Object.freeze({ label: 'Ask EONBOT', href: buildEonDestinationHref('home', { new: '1' }) }),
    rails: Object.freeze(['local-runtime', 'guide'])
  }),
  Object.freeze({
    id: 'automation',
    label: 'Automation',
    icon: '↝',
    title: 'Plan an automation',
    summary: 'Draft a repeatable workflow with explicit review before any action runs.',
    status: 'Plan only',
    truth: 'Automations remain approval-first. Opening this mode does not schedule or execute anything.',
    primary: Object.freeze({ kind: 'route', label: 'Open Automations', href: buildEonDestinationHref('automations') }),
    secondary: Object.freeze({ label: 'Open Workspace', href: buildEonDestinationHref('workspace') }),
    rails: Object.freeze(['local-runtime', 'guide'])
  }),
  Object.freeze({
    id: 'guide',
    label: 'Guide',
    icon: '✦',
    title: 'Ask EONBOT to guide you',
    summary: 'Describe the result you need and let EONBOT choose the simplest honest starting path.',
    status: 'Plan only',
    truth: 'Guide mode can prepare plans, prompts, storyboards and next steps without pretending a generation or external action already happened.',
    primary: Object.freeze({ kind: 'chat', label: 'Open Guide', prompt: 'Guide me to the simplest EONAPP workflow for what I want to make. Ask one question at a time, keep advanced controls hidden until useful, and never claim an external action or generation completed without evidence.' }),
    secondary: Object.freeze({ label: 'Open Local AI setup', href: buildEonDestinationHref('local-ai') }),
    rails: Object.freeze(['guide'])
  })
]);

export function getEonCreateMode(id = '') {
  const normalized = String(id || '').trim().toLowerCase();
  return EON_CREATE_MODES.find((mode) => mode.id === normalized) || EON_CREATE_MODES[0];
}

export function validateEonCreateCatalog() {
  const errors = [];
  const expected = ['image', 'video', 'music', 'website', 'project', 'automation', 'guide'];
  const actual = EON_CREATE_MODES.map((mode) => mode.id);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`Create mode order must be ${expected.join(', ')}.`);
  if (new Set(actual).size !== actual.length) errors.push('Create mode ids must be unique.');
  for (const mode of EON_CREATE_MODES) {
    if (!mode.label || !mode.title || !mode.summary || !mode.truth) errors.push(`${mode.id} is missing beginner-facing copy.`);
    if (!mode.primary?.label || !['chat', 'route'].includes(mode.primary?.kind)) errors.push(`${mode.id} is missing a valid primary action.`);
    if (mode.primary?.kind === 'chat' && !mode.primary?.prompt) errors.push(`${mode.id} chat action is missing a prompt.`);
    if (mode.primary?.kind === 'route' && !String(mode.primary?.href || '').startsWith('/')) errors.push(`${mode.id} route action is invalid.`);
    for (const rail of mode.rails || []) if (!EON_CREATE_EXECUTION_RAILS.includes(rail)) errors.push(`${mode.id} uses unknown execution rail ${rail}.`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
