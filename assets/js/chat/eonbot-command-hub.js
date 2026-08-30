/**
 * EONBOT Command Hub
 * ------------------
 * The only command-routing authority for the Chat-first product. A command
 * may prepare one safe destination or an explicitly user-tapped local action.
 * It never performs a side effect from message text and never claims a task
 * was completed before the destination/action itself provides evidence.
 */

import { getCapabilityTruthForRoute } from '../capabilities/capability-truth-registry.js';
import { buildEonShareIntentFromChat } from '../share/eon-share-intent.js';

export const EONBOT_COMMAND_HUB_VERSION = 'w263-capability-execution-v7';

const QUICK_REPLIES = Object.freeze([
  'Start a new chat',
  'Open Projects',
  'Open Create',
  'Make Local AI ready',
  'Open EON City'
]);

const freezeActions = (actions) => Object.freeze(actions.map((action) => Object.freeze({ ...action, patterns: Object.freeze([...action.patterns]) })));

/**
 * Each entry must point to a canonical route or a route query that the target
 * page itself owns. `new-chat` is intentionally the only local mutation: it
 * is executed only after the user taps its CTA and Chat then replaces ?new=1
 * with the created local thread URL.
 */
export const EONBOT_COMMAND_HUB_ACTIONS = freezeActions([
  {
    id: 'new-chat',
    route: '/?new=1',
    routeId: 'chat',
    label: 'Start a new chat',
    ctaLabel: 'Start new chat',
    actionType: 'local-thread-create',
    availability: 'local-first',
    confirmation: 'user-tap',
    patterns: ['new chat', 'start a new chat', 'start chat', 'fresh chat'],
    purpose: 'Create a blank local chat thread. Existing local threads remain in the sidebar.',
    truthNote: 'This affects only the current browser profile and does not delete existing chats, publish anything, or contact a provider.'
  },
  {
    id: 'open-chat',
    route: '/',
    routeId: 'chat',
    label: 'Open Chat',
    ctaLabel: 'Open Chat',
    actionType: 'navigation',
    availability: 'live-local-first',
    confirmation: 'user-tap',
    patterns: ['open chat', 'go to chat', 'continue chat', 'talk to eonbot'],
    purpose: 'Open the current local EONBOT chat thread.',
    truthNote: 'Chat threads stay in this browser profile unless you explicitly export a backup.'
  },
  {
    id: 'open-projects',
    route: '/projects',
    routeId: 'projects',
    label: 'Open Projects',
    ctaLabel: 'Open Projects',
    actionType: 'navigation',
    availability: 'local-first',
    confirmation: 'user-tap',
    patterns: ['open projects', 'my projects', 'project list', 'new project', 'create project'],
    purpose: 'Open Projects, where you can choose whether to create or resume a local project.',
    truthNote: 'EONBOT has not created a project yet; the Projects page asks for your next explicit choice.'
  },
  {
    id: 'open-library',
    route: '/library',
    routeId: 'library',
    label: 'Open Library',
    ctaLabel: 'Open Library',
    actionType: 'navigation',
    availability: 'local-first',
    confirmation: 'user-tap',
    patterns: ['open library', 'my library', 'save to library', 'library item'],
    purpose: 'Open the local Library for reusable notes, prompts, templates, and outputs.',
    truthNote: 'EONBOT does not save a message automatically; review the item and choose Save in Library.'
  },
  {
    id: 'open-workspace',
    route: '/create',
    routeId: 'create',
    label: 'Open Create',
    ctaLabel: 'Open Create',
    actionType: 'navigation',
    availability: 'live',
    confirmation: 'user-tap',
    patterns: ['open workspace', 'ai cockpit', 'build a website', 'make a website', 'build an app', 'make an app', 'code project', 'analyze data'],
    purpose: 'Open the one Create screen for Image, Video, Website / Forge, Project / Document, Automation or Guide.',
    truthNote: 'Opening Create does not publish, deploy, spend money, upload media, schedule work or run an external action.'
  },
  {
    id: 'open-create-image',
    route: '/create?mode=image',
    routeId: 'create',
    label: 'Create an image',
    ctaLabel: 'Open Create → Image',
    actionType: 'navigation',
    availability: 'capability-dependent',
    confirmation: 'user-tap',
    patterns: ['create an image', 'make an image', 'generate an image', 'make a picture', 'generate a picture', 'create a poster', 'make a poster', 'create artwork'],
    purpose: 'Open the canonical Image workspace. After the user taps the CTA, Chat may carry one bounded creation idea through a single-use browser-session handoff; it is not placed in the URL or durable action receipts and is never executed by routing alone.',
    truthNote: 'No image is generated until you explicitly run a reviewed Image workflow in Create. Provider spend, upload and publishing remain separately gated.'
  },
  {
    id: 'open-create-video',
    route: '/create?mode=video',
    routeId: 'create',
    label: 'Create a video',
    ctaLabel: 'Open Create → Video',
    actionType: 'navigation',
    availability: 'capability-dependent',
    confirmation: 'user-tap',
    patterns: ['create a video', 'make a video', 'generate a video', 'make a clip', 'generate a clip', 'image to video', 'turn this image into video', 'create a short video'],
    purpose: 'Open the canonical Video workspace. After the user taps the CTA, Chat may carry one bounded text idea through a single-use browser-session handoff; media is not transferred, the idea is not placed in the URL or durable action receipts, and routing never starts generation.',
    truthNote: 'No video is generated until you explicitly run a reviewed Video workflow in Create. Local workflow proof, provider spend, uploads and publishing stay separately gated.'
  },
  {
    id: 'open-create-music',
    route: '/create?mode=music',
    routeId: 'create',
    label: 'Create music',
    ctaLabel: 'Open Create → Music',
    actionType: 'navigation',
    availability: 'browser-plus-optional-local-runtime',
    confirmation: 'user-tap',
    patterns: ['create music', 'make music', 'generate music', 'make a song', 'generate a song', 'create a track', 'make a track', 'generate a track', 'make a beat', 'auto dj', 'create a radio station', 'open eon radio'],
    purpose: 'Open the canonical Music workspace for browser sequencing, optional explicit local ACE-Step generation, Auto DJ and private EON Radio. After the user taps, one bounded music idea may be carried through a single-use browser-session handoff without auto-generation.',
    truthNote: 'The routing command itself generates nothing. Full local music generation requires a user-started ACE-Step runtime, explicit scan/run, and no silent model download, cloud fallback or publishing.'
  },
  {
    id: 'open-automations',
    route: '/automations',
    routeId: 'automations',
    label: 'Open Automations',
    ctaLabel: 'Open Automations',
    actionType: 'navigation',
    availability: 'local-simulation',
    confirmation: 'user-tap',
    patterns: ['open automations', 'open automation', 'create automation', 'new automation', 'build automation', 'automation workflow', 'schedule workflow'],
    purpose: 'Open Automations to draft and review a local workflow before any external effect.',
    truthNote: 'No automation is enabled or executed from this chat command.'
  },
  {
    id: 'open-local-ai',
    route: '/local-ai#eonbot-local-ai-setup',
    routeId: 'local-ai',
    label: 'Make Local AI ready',
    ctaLabel: 'Make Local AI ready',
    actionType: 'navigation',
    availability: 'device-dependent',
    confirmation: 'user-tap',
    patterns: ['local ai', 'offline ai', 'ollama', 'lm studio', 'lmstudio', 'install model', 'download model', 'local model', 'recommend a local model', 'which local model', 'scan installed models', 'scan local models', 'local ai recommendation'],
    purpose: 'Open EONBOT’s consumer Local AI setup. One explicit setup action can reuse or safely start supported AI already installed, offer a reviewed fitting model pack when needed, or prepare Local Lite on a compatible browser.',
    truthNote: 'Runtime checks happen only after the user starts setup. Companion connection and every software/model download stay visible and user-approved. Local mode never silently falls back to cloud AI, and Chat never collects a provider key.'
  },
  {
    id: 'open-market',
    route: '/create?mode=image',
    routeId: 'create',
    label: 'Create an image',
    ctaLabel: 'Open Create → Image',
    actionType: 'navigation',
    availability: 'local-preview-only',
    confirmation: 'user-tap',
    patterns: ['open market', 'market preview', 'generate preview', 'generate collection', 'nft preview', 'market'],
    purpose: 'Open the canonical Image path in Create for prompt planning and an honest Local, Direct BYOK or Guide choice.',
    truthNote: 'No image was generated, uploaded, purchased, published or made transferable by this command.'
  },
  {
    id: 'open-vault',
    route: '/vault#provider-check',
    routeId: 'vault',
    label: 'Open Vault',
    ctaLabel: 'Open Vault',
    actionType: 'navigation',
    availability: 'sensitive-local',
    confirmation: 'user-tap',
    sensitive: true,
    patterns: ['open vault', 'vault', 'backup', 'restore backup', 'recovery', 'api key settings', 'secure settings'],
    purpose: 'Open Vault for local backup, recovery, and approved connected settings.',
    truthNote: 'Do not paste passwords, recovery phrases, private keys, exchange secrets, or API keys into Chat.'
  },
  {
    id: 'open-insights',
    route: '/insights',
    routeId: 'insights',
    label: 'Open Research Lab',
    ctaLabel: 'Open Research Lab',
    actionType: 'navigation',
    availability: 'local-research-only',
    confirmation: 'user-tap',
    patterns: ['open research lab', 'open trade', 'trade research', 'chart', 'market research', 'scenario review'],
    purpose: 'Open Research Lab for local research, charts, historical review and Scenario Studio.',
    truthNote: 'EONAPP does not place live orders, transfer funds, withdraw money, or convert credits to cash.'
  },
  {
    id: 'open-realm-studio',
    route: '/eoncity',
    routeId: 'eoncity',
    label: 'Open EON City',
    ctaLabel: 'Open EON City',
    actionType: 'navigation',
    availability: 'local-only',
    confirmation: 'user-tap',
    patterns: ['realm studio', 'my realm', 'create realm', 'edit realm', 'realm draft', 'personal realm'],
    purpose: 'Open EON City, the canonical destination for City identity, orientation and future personal-space workflows.',
    truthNote: 'The older My Realm Studio name is compatibility-only. EON City does not create a public store, visitor economy, payout program or seller platform.'
  },
  {
    id: 'guide-city-objective',
    route: '/eoncity?focus=objective',
    routeId: 'eoncity',
    label: 'Guide the current City objective',
    ctaLabel: 'Route current objective',
    actionType: 'city-guidance',
    availability: 'direct-babylon-city',
    confirmation: 'user-tap',
    patterns: ['what should i do in eon city', 'what is next in eon city', 'eon city objective', 'city objective', 'city mission', 'guide city objective'],
    purpose: 'Enter the direct Babylon Command District and use the in-world Mission Board to review the local objective.',
    truthNote: 'The route is prepared only after you tap. City progress is local and no reward, point, subscription benefit, or value is created by a City visit.'
  },
  {
    id: 'guide-city-command-centre',
    route: '/eoncity?target=command',
    routeId: 'eoncity',
    label: 'Guide to City Command Centre',
    ctaLabel: 'Route to Command Centre',
    actionType: 'city-guidance',
    availability: 'direct-babylon-city',
    confirmation: 'user-tap',
    patterns: ['guide me to city command centre', 'guide me to command centre', 'city command centre', 'eon city command centre'],
    purpose: 'Enter the direct Babylon Command District, where the Command Deck and nearby route cue remain available.',
    truthNote: 'EONBOT only prepares the route. Opening Chat or completing a City interaction remains your explicit choice.'
  },
  {
    id: 'guide-city-workspace',
    route: '/eoncity?target=workspace',
    routeId: 'eoncity',
    label: 'Guide to City Workspace',
    ctaLabel: 'Route to Workspace',
    actionType: 'city-guidance',
    availability: 'direct-babylon-city',
    confirmation: 'user-tap',
    patterns: ['guide me to city workspace', 'take me to city workspace', 'city workspace district', 'eon city workspace'],
    purpose: 'Enter the direct Babylon Command District, then choose Workspace deliberately from the Command Deck.',
    truthNote: 'The City route is a local guide. Workspace does not publish, deploy, spend, or run an external action by opening it.'
  },
  {
    id: 'guide-city-realm',
    route: '/eoncity?target=realm',
    routeId: 'eoncity',
    label: 'Guide to your EON City space',
    ctaLabel: 'Open your City space',
    actionType: 'city-guidance',
    availability: 'direct-babylon-city',
    confirmation: 'user-tap',
    patterns: ['guide me to city realm studio', 'take me to city realm', 'city realm studio', 'eon city realm studio'],
    purpose: 'Enter the Command District and follow the in-world route toward personal-space features.',
    truthNote: 'Personal-space features remain local-first and preview-stage. Opening City does not publish anything, create a seller account, or make work public.'
  },
  {
    id: 'return-to-my-realm',
    route: '/eoncity?target=realm&return=realm',
    routeId: 'eoncity',
    label: 'Return to your EON City space',
    ctaLabel: 'Open your City space',
    actionType: 'city-guidance',
    availability: 'direct-babylon-city',
    confirmation: 'user-tap',
    patterns: ['return to my realm', 'take me home to my realm', 'enter my realm in city', 'go to my realm in city', 'realm return'],
    purpose: 'Enter the direct Babylon Command District and continue to My Realm only after you choose that native route.',
    truthNote: 'This is a local return route. It does not publish your Realm, create attribution, unlock a subscription, or grant a reward.'
  },
  {
    id: 'open-eon-city',
    route: '/eoncity',
    routeId: 'eoncity',
    label: 'Enter EON City',
    ctaLabel: 'Enter EON City',
    actionType: 'navigation',
    availability: 'direct-babylon-city',
    confirmation: 'user-tap',
    patterns: ['open eon city', 'play eon city', 'eon city', '3d eon city', 'eon city 3d', 'open 3d city', 'city tour', 'play city'],
    purpose: 'Open the direct Babylon Command District. City controls, Command Deck and same-route low-detail recovery stay inside one world.',
    truthNote: 'City activity is local and meaningful only when you actually perform it; EONBOT does not fabricate work, crowds, purchases, rewards, progress or a second City renderer.'
  },
  {
    id: 'make-creation-shareable',
    route: '/workspace#eon-share',
    routeId: 'workspace',
    label: 'Make a creation shareable',
    ctaLabel: 'Open local Share tools',
    actionType: 'navigation',
    availability: 'local-share-draft',
    confirmation: 'user-tap',
    patterns: ['make this creator video shareable', 'make this shareable', 'make it shareable', 'make my creation shareable', 'turn this into a share pack', 'create a share pack', 'create a remix card', 'make a remix card', 'help me share this', 'package this for social', 'shareable and invite a remix', 'video shareable', 'creation shareable', 'shareable'],
    purpose: 'Prepare a short-lived local Ready-to-Post kit or Remix Card draft from the message only after you tap the destination.',
    truthNote: 'EONBOT does not transfer attachments or chat history, connect a platform, post, schedule, track reach, create a referral, or grant a reward. Review the short local kit before copying, downloading, or using native share.'
  },
  {
    id: 'open-share-center',
    route: '/profile#eon-profile-share-center',
    routeId: 'profile',
    label: 'Open Share Center',
    ctaLabel: 'Open Share Center',
    actionType: 'navigation',
    availability: 'local-signed-invites',
    confirmation: 'user-review-before-posting',
    patterns: ['share center', 'invite', 'invite link', 'share link', 'referral', 'qr code', 'promote eonapp'],
    purpose: 'Open Share Center to create a signed invite or portable Realm identity link and draft copy for your review. Referral/EONKEY programme state remains server-authoritative and rollout-controlled.',
    truthNote: 'Creating, copying, posting or opening a signed link never grants value by itself. When the server referral ledger is enabled, only an eligible accepted association and verified qualifying milestone may create an EONKEY unlock; there is no cash, token, payout, click reward, automated posting, or public store.'
  },
  {
    id: 'open-access-status',
    route: '/rewards',
    routeId: 'rewards-status',
    label: 'Review Access status',
    ctaLabel: 'Review Access status',
    actionType: 'navigation',
    availability: 'disabled-no-active-program',
    confirmation: 'user-tap',
    patterns: ['reward status', 'rewards', 'reward', 'earn', 'earnings', 'offerwall', 'pool points', 'eon lite'],
    purpose: 'Open the current Access status page, which explains that no reward campaign, conversion, payout, or token program is active.',
    truthNote: 'No raw click, share, ad view, copied link, Pool Point, EON Lite, or chat activity creates value in this release.'
  },
  {
    id: 'open-profile',
    route: '/profile',
    routeId: 'profile',
    label: 'Open Profile & Settings',
    ctaLabel: 'Open Profile & Settings',
    actionType: 'navigation',
    availability: 'local-first',
    confirmation: 'user-tap',
    patterns: ['open profile', 'profile settings', 'appearance', 'change theme', 'graphite theme', 'classic eon theme'],
    purpose: 'Open local profile, appearance, and account-boundary settings.',
    truthNote: 'The profile is local to this browser until an account-backed system is formally introduced.'
  },
  {
    id: 'open-voice-chat',
    route: '/?voice=1',
    routeId: 'chat',
    label: 'Review voice controls',
    ctaLabel: 'Review voice controls',
    actionType: 'navigation',
    availability: 'browser-dependent',
    confirmation: 'microphone-permission',
    requiresPermission: true,
    patterns: ['voice chat', 'voice mode', 'use microphone', 'microphone', 'dictate', 'speech recognition'],
    purpose: 'Open Chat voice controls so you can decide whether to grant browser microphone permission.',
    truthNote: 'Voice capture depends on the browser and device. Typed input remains fully available, and no universal free speech service is promised.'
  }
]);

const EONBOT_COMMAND_HUB_ACTION_BY_ID = new Map(EONBOT_COMMAND_HUB_ACTIONS.map((action) => [action.id, action]));

function cleanActionId(value = '') {
  const id = String(value || '').trim();
  return /^[a-z0-9][a-z0-9-]{1,80}$/i.test(id) ? id : '';
}

function cleanActionType(value = '') {
  const type = String(value || '').trim();
  return /^[a-z0-9][a-z0-9-]{1,48}$/i.test(type) ? type : '';
}

function safeInternalActionRoute(value = '') {
  const raw = String(value || '');
  try {
    const url = new URL(raw, 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid') return '';
    if (!url.pathname.startsWith('/') || /(?:\r|\n|javascript:|data:)/i.test(raw)) return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '';
  }
}

function withoutHash(route = '') {
  const safe = safeInternalActionRoute(route);
  return safe ? safe.split('#')[0] : '';
}

/** Returns a canonical command capability or null; never infers an action from arbitrary route text. */
export function getEonbotCommandHubAction(actionId = '') {
  return EONBOT_COMMAND_HUB_ACTION_BY_ID.get(cleanActionId(actionId)) || null;
}

/** Guarded capabilities always require a separate local review/confirmation before navigation. */
export function isEonbotCommandHubActionGuarded(actionOrId = '') {
  const action = typeof actionOrId === 'object' && actionOrId
    ? actionOrId
    : getEonbotCommandHubAction(actionOrId);
  return Boolean(action?.requiresProposalReview || action?.sensitive || action?.requiresPermission || action?.requiresDeviceReview);
}

/**
 * Verifies that a proposed receipt/proposal is an exact canonical capability.
 * `allowHashless` is reserved for local receipts, which intentionally omit
 * an anchor from their privacy-minimised record.
 */
export function matchesEonbotCommandHubAction(command = {}, { allowHashless = false } = {}) {
  const source = command && typeof command === 'object' ? command : {};
  const action = getEonbotCommandHubAction(source.actionId || source.interpretedAs || source.commandId);
  if (!action) return false;
  const route = safeInternalActionRoute(source.route);
  const expectedRoute = safeInternalActionRoute(action.route);
  const actionType = cleanActionType(source.actionType);
  if (!route || !expectedRoute || actionType !== action.actionType) return false;
  if (!allowHashless) return route === expectedRoute;
  // Receipts minimise stored data by omitting an anchor entirely. They may
  // omit the canonical hash, but may never substitute a different one.
  if (route === withoutHash(route)) return route === withoutHash(expectedRoute);
  return route === expectedRoute;
}

/**
 * W263 source-of-truth execution manifest. Every entry is a local handoff,
 * requires a visible user action, and represents no external effect.
 */
export function listEonbotExecutionCapabilities() {
  return Object.freeze(EONBOT_COMMAND_HUB_ACTIONS.map((action) => {
    const guarded = isEonbotCommandHubActionGuarded(action);
    const truth = getCapabilityTruthForRoute(action.route);
    return Object.freeze({
      id: action.id,
      route: action.route,
      routeId: action.routeId,
      actionType: action.actionType,
      availability: action.availability,
      declaredConfirmation: action.confirmation,
      confirmation: guarded ? 'review-then-confirm' : action.confirmation,
      requiresUserTap: true,
      requiresProposalReview: guarded,
      requiresPermission: Boolean(action.requiresPermission),
      requiresDeviceReview: Boolean(action.requiresDeviceReview),
      sensitive: Boolean(action.sensitive),
      execution: guarded ? 'prepared-review-required' : 'prepared-user-tap',
      externalEffect: false,
      truthCapabilityId: truth?.id || null,
      truthLifecycle: truth?.lifecycle || 'blocked',
      truthNote: truth?.truthfulUserFacingNote || action.truthNote
    });
  }));
}

function combineActionTruthNote(action, truth) {
  const actionNote = String(action?.truthNote || '').trim();
  const registryNote = String(truth?.truthfulUserFacingNote || '').trim();
  if (!actionNote) return registryNote;
  if (!registryNote || registryNote === actionNote) return actionNote;
  return `${actionNote} ${registryNote}`;
}

function normalize(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/?#&=:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function phraseScore(source, phrase) {
  if (!source || !phrase) return 0;
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return 0;
  const index = source.indexOf(normalizedPhrase);
  if (index < 0) return 0;
  // Whole phrases win over short shared words. Earlier phrases only break
  // ties; they do not imply an action was performed.
  return (normalizedPhrase.split(' ').length * 100) + normalizedPhrase.length - Math.min(index, 40) / 100;
}

function actionScore(source, action) {
  return action.patterns.reduce((best, pattern) => Math.max(best, phraseScore(source, pattern)), 0);
}

/**
 * Deterministically resolve one command. Long, specific phrases beat generic
 * matches, preventing “My Realm” from falling into generic City and
 * “3D EON City” from falling into the 2D route.
 */
export function detectEonbotCommandHubAction(input = '') {
  const source = normalize(input);
  if (!source) return null;
  let best = null;
  for (const action of EONBOT_COMMAND_HUB_ACTIONS) {
    const score = actionScore(source, action);
    if (!score) continue;
    if (!best || score > best.score || (score === best.score && action.id.localeCompare(best.action.id) < 0)) {
      best = { action, score };
    }
  }
  return best?.action || null;
}

function commandText(action) {
  return `Ready to ${action.label.toLowerCase()}. Choose “${action.ctaLabel}” to continue.`;
}

/**
 * Build a receipt for a prepared user-tap command. `completed` stays false
 * because route navigation is not proof that a task on that route completed.
 */
export function buildEonbotCommandHubPlan(input = '', options = {}) {
  const action = detectEonbotCommandHubAction(input);
  if (!action) {
    return Object.freeze({
      version: EONBOT_COMMAND_HUB_VERSION,
      matched: false,
      text: 'Tell me what you want to open or start. I can route you to Chat, Create, Projects, Library, Automations, Local AI, Vault, Research Lab, EON City (including a City objective or district route), My Realm, Profile, or Share Center.',
      quickReplies: QUICK_REPLIES,
      commandReceipt: Object.freeze({
        heard: String(input || ''),
        interpretedAs: null,
        execution: 'not-started',
        completed: false,
        externalEffect: false
      })
    });
  }

  const approvalRequired = Boolean(action.requiresPermission);
  const requiresProposalReview = isEonbotCommandHubActionGuarded(action);
  const truth = getCapabilityTruthForRoute(action.route);
  const proposal = requiresProposalReview
    ? Object.freeze({
        schema: 'eon.eonbot.action-proposal.v1',
        actionId: action.id,
        actionType: action.actionType,
        route: action.route,
        label: action.label,
        reviewLabel: `Review ${action.ctaLabel}`,
        expiresInMs: 10 * 60 * 1000,
        sensitive: Boolean(action.sensitive),
        requiresPermission: approvalRequired,
        requiresDeviceReview: Boolean(action.requiresDeviceReview),
        vaultReturnContext: action.route.split('#')[0] === '/vault'
      })
    : null;
  return Object.freeze({
    version: EONBOT_COMMAND_HUB_VERSION,
    matched: true,
    commandId: action.id,
    actionType: action.actionType,
    route: action.route,
    routeId: action.routeId,
    availability: action.availability,
    truthCapabilityId: truth?.id || null,
    truthLifecycle: truth?.lifecycle || 'blocked',
    confirmation: requiresProposalReview ? 'review-then-confirm' : action.confirmation,
    approvalRequired,
    requiresDeviceReview: Boolean(action.requiresDeviceReview),
    sensitive: Boolean(action.sensitive),
    text: requiresProposalReview
      ? `I prepared a guarded action for ${action.label}. Review it before anything opens.`
      : commandText(action),
    truthNote: combineActionTruthNote(action, truth),
    toolCTA: requiresProposalReview ? null : Object.freeze({ label: action.ctaLabel, url: action.route }),
    actionCTA: null,
    proposal,
    quickReplies: QUICK_REPLIES,
    commandReceipt: Object.freeze({
      heard: String(input || ''),
      interpretedAs: action.id,
      route: action.route,
      actionType: action.actionType,
      execution: requiresProposalReview ? 'prepared-review-required' : 'prepared-user-tap',
      completed: false,
      externalEffect: false,
      needsUserApproval: approvalRequired,
      needsDeviceReview: Boolean(action.requiresDeviceReview),
      sensitive: Boolean(action.sensitive),
      proposalRequired: requiresProposalReview,
      implementation: requiresProposalReview
        ? 'A local proposal expires unless the user reviews and separately confirms it. The destination owns its own permissions, persistence, and receipts.'
        : 'The destination page owns its own permissions, persistence, and receipts.'
    }),
    shareIntent: action.id === 'make-creation-shareable' ? buildEonShareIntentFromChat(input) : null,
    source: options.source || 'chat'
  });
}

export function getEonbotCommandHubRoadmap() {
  return Object.freeze({
    version: EONBOT_COMMAND_HUB_VERSION,
    canonicalActions: EONBOT_COMMAND_HUB_ACTIONS.map((action) => action.id),
    rules: Object.freeze([
      'One command registry owns Chat route/action interpretation.',
      'Every command prepares a user-tap CTA; message text alone has no side effect.',
      'Local AI setup can check only approved device-local runtimes after the user taps setup, reuse a self-tested model that fits, or offer Local Lite. Software and model downloads remain visible user-approved actions, and EONBOT never silently falls back to cloud AI.',
      'A route open is not reported as task completion.',
      'Secrets, payments, payouts, token conversion, live trading, publishing, and social posting remain outside command execution.',
      'Voice and optional 3D stay browser/device-dependent and retain their own approval or suitability checks.'
    ])
  });
}

export default Object.freeze({
  EONBOT_COMMAND_HUB_VERSION,
  EONBOT_COMMAND_HUB_ACTIONS,
  getEonbotCommandHubAction,
  isEonbotCommandHubActionGuarded,
  matchesEonbotCommandHubAction,
  listEonbotExecutionCapabilities,
  detectEonbotCommandHubAction,
  buildEonbotCommandHubPlan,
  getEonbotCommandHubRoadmap
});
