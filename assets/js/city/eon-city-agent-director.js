/**
 * W359 — EON City Agent Director.
 *
 * Converts the existing redacted, foreground-only Agent Presence facts into
 * original City character direction. It is intentionally a visual grammar, not
 * an agent runtime: it never starts work, contacts a provider, reads prompts,
 * transcripts, model names, credentials, or account data.
 *
 * Provider identity is hidden by default. A visitor can explicitly opt in to
 * seeing the bounded selected-provider label that their own browser already
 * used for the foreground request. No provider character is official, endorsed
 * by, or controlled by a provider.
 */
import { describeAgentPresence, getAgentPresenceProviderLabel } from '../operator/agent-presence.js';

export const CITY_AGENT_DIRECTOR_SCHEMA = 'eon.city.agent-director.w359.v1';

const ROLE_DIRECTION = Object.freeze({
  coordinator: Object.freeze({ characterId: 'eonbot-orbit', title: 'EONBOT Orbit', silhouette: 'orbital-companion', station: 'command-plaza', palette: '#8b9cff' }),
  researcher: Object.freeze({ characterId: 'signal-cartographer', title: 'Signal Cartographer', silhouette: 'archive-scout', station: 'knowledge-archive', palette: '#5eead4' }),
  builder: Object.freeze({ characterId: 'forge-runner', title: 'Forge Runner', silhouette: 'workshop-builder', station: 'build-workshop', palette: '#b39cff' }),
  reviewer: Object.freeze({ characterId: 'review-warden', title: 'Review Warden', silhouette: 'review-steward', station: 'review-bridge', palette: '#fbbf24' }),
  'local-runner': Object.freeze({ characterId: 'local-sentinel', title: 'Local Sentinel', silhouette: 'local-engineer', station: 'local-ai-observatory', palette: '#34d399' }),
  guide: Object.freeze({ characterId: 'guide-wisp', title: 'Guide Wisp', silhouette: 'guide-light', station: 'command-plaza', palette: '#c4b5fd' })
});

// These are original EON City visual themes. They are not logos, mascots or
// official representations of the named providers.
const PROVIDER_DIRECTION = Object.freeze({
  guide: Object.freeze({ relayId: 'guide-wisp', relayName: 'Guide Wisp', accent: '#c4b5fd', motif: 'soft-orbit' }),
  groq: Object.freeze({ relayId: 'velocity-relay', relayName: 'Velocity Relay', accent: '#fb7185', motif: 'split-trail' }),
  gemini: Object.freeze({ relayId: 'prism-relay', relayName: 'Prism Relay', accent: '#60a5fa', motif: 'twin-prism' }),
  openrouter: Object.freeze({ relayId: 'route-relay', relayName: 'Route Relay', accent: '#a78bfa', motif: 'wayfinder-ring' }),
  mistral: Object.freeze({ relayId: 'draft-relay', relayName: 'Draft Relay', accent: '#38bdf8', motif: 'wind-fin' }),
  deepseek: Object.freeze({ relayId: 'depth-relay', relayName: 'Depth Relay', accent: '#22d3ee', motif: 'scan-fin' }),
  cerebras: Object.freeze({ relayId: 'circuit-relay', relayName: 'Circuit Relay', accent: '#f59e0b', motif: 'pulse-core' }),
  perplexity: Object.freeze({ relayId: 'atlas-relay', relayName: 'Atlas Relay', accent: '#2dd4bf', motif: 'question-orbit' }),
  together: Object.freeze({ relayId: 'mesh-relay', relayName: 'Mesh Relay', accent: '#f472b6', motif: 'mesh-band' }),
  nvidia: Object.freeze({ relayId: 'vector-relay', relayName: 'Vector Relay', accent: '#84cc16', motif: 'vector-shield' }),
  sambanova: Object.freeze({ relayId: 'pulse-relay', relayName: 'Pulse Relay', accent: '#fb923c', motif: 'pulse-ribbon' }),
  fireworks: Object.freeze({ relayId: 'flare-relay', relayName: 'Flare Relay', accent: '#f97316', motif: 'flare-crown' }),
  huggingface: Object.freeze({ relayId: 'studio-relay', relayName: 'Studio Relay', accent: '#facc15', motif: 'studio-orbit' }),
  openai: Object.freeze({ relayId: 'dialogue-relay', relayName: 'Dialogue Relay', accent: '#10b981', motif: 'dialogue-ring' }),
  ollama: Object.freeze({ relayId: 'local-sentinel', relayName: 'Local Sentinel', accent: '#34d399', motif: 'local-core' }),
  lmstudio: Object.freeze({ relayId: 'local-studio', relayName: 'Local Studio', accent: '#14b8a6', motif: 'studio-core' }),
  jan: Object.freeze({ relayId: 'local-janus', relayName: 'Local Janus', accent: '#06b6d4', motif: 'dual-core' })
});

const STATUS_MOTION = Object.freeze({
  queued: Object.freeze({ motion: 'await', intensity: .34, label: 'Awaiting your foreground turn' }),
  active: Object.freeze({ motion: 'focus', intensity: .88, label: 'Working in this open browser session' }),
  handoff: Object.freeze({ motion: 'handoff', intensity: .72, label: 'Handing off a checked step' }),
  waiting: Object.freeze({ motion: 'review', intensity: .62, label: 'Waiting for your explicit review' }),
  ready: Object.freeze({ motion: 'ready', intensity: .45, label: 'Ready for your explicit start' }),
  complete: Object.freeze({ motion: 'complete', intensity: .56, label: 'Recorded step finished; review in the native surface' }),
  failed: Object.freeze({ motion: 'attention', intensity: .68, label: 'Needs attention in the native surface' })
});

function cleanRole(value = '') {
  const id = String(value || '').toLowerCase();
  return ROLE_DIRECTION[id] ? id : 'coordinator';
}

function cleanProvider(value = '') {
  const id = String(value || '').toLowerCase();
  return PROVIDER_DIRECTION[id] ? id : 'guide';
}

function preferenceAllowsIdentity(preferences = {}) {
  return String(preferences?.detailLevel || '') === 'provider-identity';
}

/** Returns original City art direction for one already-recorded work cue. */
export function resolveCityAgentVisual(entry = {}, preferences = {}) {
  const safeCue = describeAgentPresence(entry, preferences);
  const role = cleanRole(entry?.role);
  const providerId = cleanProvider(entry?.providerId);
  const roleDirection = ROLE_DIRECTION[role];
  const providerDirection = PROVIDER_DIRECTION[providerId];
  const status = STATUS_MOTION[String(entry?.status || '').toLowerCase()] || STATUS_MOTION.ready;
  const providerVisible = preferenceAllowsIdentity(preferences) && providerId !== 'guide';
  const providerLabel = providerVisible ? getAgentPresenceProviderLabel(providerId) : '';
  const title = providerVisible
    ? `${roleDirection.title} · ${providerLabel} connection`
    : roleDirection.title;
  const bubble = providerVisible
    ? `${safeCue.bubble} This original relay visualises the selected connection only; it is not an official provider character.`
    : safeCue.bubble;
  return Object.freeze({
    schema: CITY_AGENT_DIRECTOR_SCHEMA,
    characterId: roleDirection.characterId,
    relayId: providerDirection.relayId,
    relayName: providerDirection.relayName,
    silhouette: roleDirection.silhouette,
    station: roleDirection.station,
    motif: providerDirection.motif,
    role,
    status: String(entry?.status || 'ready').toLowerCase(),
    motion: status.motion,
    motionIntensity: status.intensity,
    motionLabel: status.label,
    accent: providerVisible ? providerDirection.accent : safeCue.accent || roleDirection.palette,
    title,
    bubble,
    providerVisible,
    providerLabel,
    localOnly: true,
    foregroundOnly: true,
    externalEffect: false,
    promptVisible: false,
    outputVisible: false,
    modelVisible: false,
    credentialVisible: false,
    providerOfficialCharacter: false
  });
}

export function getCityAgentDirectorTruth() {
  return Object.freeze({
    schema: CITY_AGENT_DIRECTOR_SCHEMA,
    source: 'redacted-agent-presence-only',
    foregroundOnly: true,
    backgroundAgentRuntime: false,
    providerCalls: false,
    providerIdentityDefault: 'hidden',
    providerIdentityRequiresLocalOptIn: true,
    rawPrompt: false,
    rawOutput: false,
    modelName: false,
    credentials: false,
    externalEffect: false,
    providerOfficialCharacter: false
  });
}
