/**
 * W660A2 — privacy projection from existing EONAPP state into EON NEXUS.
 *
 * Renderers receive this bounded projection, never the raw stores. Private Chat
 * text, project summaries, filenames, credentials, endpoints and account hints
 * are intentionally absent.
 */

import { normalizeEonNexusState } from './eon-nexus-state-contract.js';
import { projectEonNexusProjectAtlas } from './eon-nexus-project-atlas.js';

const LOCAL_PROVIDER_IDS = new Set(['browserlocal', 'ollama', 'lmstudio', 'jan']);
const ACTIVE_PRESENCE = new Set(['queued', 'active', 'handoff']);

function cleanText(value = '', max = 180) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function count(value = [], max = 9999) {
  return Math.max(0, Math.min(max, Array.isArray(value) ? value.length : Number(value) || 0));
}

function newest(records = []) {
  return [...(Array.isArray(records) ? records : [])].sort((a, b) => {
    const right = Date.parse(String(b?.updatedAt || b?.createdAt || '')) || 0;
    const left = Date.parse(String(a?.updatedAt || a?.createdAt || '')) || 0;
    return right - left;
  })[0] || null;
}

function safeRoleLabel(role = '') {
  const labels = Object.freeze({
    coordinator: 'Coordinator',
    researcher: 'Research',
    writer: 'Writing',
    builder: 'Build',
    'media-planner': 'Media plan',
    'media-runner': 'Media',
    reviewer: 'Validation',
    exporter: 'Export',
    'local-runner': 'Local AI',
    forge: 'Forge',
    projects: 'Projects',
    'local-ai': 'Local AI',
    library: 'Library',
    automations: 'Automations',
    vault: 'Vault',
    settings: 'Settings',
    billing: 'Billing',
    guide: 'Guide'
  });
  return labels[String(role || '').toLowerCase()] || 'Tool';
}

function mapPresenceStatus(entry = {}) {
  const status = String(entry.status || '').toLowerCase();
  const phase = String(entry.phase || '').toLowerCase();
  if (status === 'failed' || phase === 'failed') return 'failed';
  if (status === 'complete' || phase === 'complete') return 'complete';
  if (status === 'waiting' || phase === 'waiting-approval' || phase === 'review') return 'waiting';
  if (ACTIVE_PRESENCE.has(status) || ['routing', 'working'].includes(phase)) return 'active';
  return 'available';
}

function mapTaskStage(record = {}) {
  const state = String(record.state || 'ready');
  const workflow = String(record.workflowState || '').toLowerCase();
  if (state === 'review-needed') return { stage: 'waiting-approval', label: 'Waiting for approval' };
  if (state === 'completed') return { stage: 'complete', label: 'Complete' };
  if (state === 'failed') return { stage: 'failed', label: 'Could not complete' };
  if (state === 'paused') return { stage: 'paused', label: 'Paused' };
  if (state === 'cancelled') return { stage: 'cancelled', label: 'Cancelled' };
  if (workflow.includes('validat')) return { stage: 'validation', label: 'Running validation' };
  if (workflow.includes('file')) return { stage: 'files', label: 'Inspecting files' };
  if (workflow.includes('research')) return { stage: 'research', label: 'Researching' };
  if (state === 'running') return { stage: 'working', label: 'Working' };
  return { stage: 'idle', label: 'Ready' };
}

export function projectNexusConversation(thread = null, { detailsOpened = false } = {}) {
  const source = thread && typeof thread === 'object' ? thread : {};
  return Object.freeze({
    id: cleanText(source.id, 160).replace(/[^a-zA-Z0-9:_-]/g, ''),
    label: detailsOpened && cleanText(source.title, 120) ? cleanText(source.title, 120) : 'Private conversation',
    messageCount: count(source.messages, 500),
    updatedAt: String(source.updatedAt || source.createdAt || ''),
    openRoute: source.id ? `/?thread=${encodeURIComponent(String(source.id))}` : '/',
    privateByDefault: true
  });
}

export function projectNexusProject(activeContext = null, project = null, { detailsOpened = false } = {}) {
  const context = activeContext && typeof activeContext === 'object' ? activeContext : {};
  const record = project && typeof project === 'object' ? project : {};
  const id = cleanText(context.projectId || record.id, 160).replace(/[^a-zA-Z0-9:_-]/g, '');
  const selected = Boolean(id);
  return Object.freeze({
    id,
    label: selected && detailsOpened
      ? cleanText(record.title || context.projectTitle || 'Active project', 180)
      : selected ? 'Active project' : 'No project selected',
    selected,
    status: selected && ['active', 'paused', 'complete'].includes(String(record.status || '')) ? String(record.status) : selected ? 'active' : 'none',
    taskCount: count(record.tasks, 1000),
    artefactCount: count(record.artifacts, 1000),
    openRoute: cleanText(context.route, 500).startsWith('/') ? cleanText(context.route, 500) : '/projects',
    updatedAt: String(record.updatedAt || context.updatedAt || ''),
    privateByDefault: true
  });
}

export function projectNexusRoute(readiness = {}) {
  const source = readiness && typeof readiness === 'object' ? readiness : {};
  const providerId = cleanText(source.providerId || 'guide', 64).toLowerCase();
  const runtimeType = String(source.runtimeType || '').toLowerCase();
  const mode = runtimeType === 'local' || LOCAL_PROVIDER_IDS.has(providerId)
    ? 'local'
    : providerId === 'guide' || runtimeType === 'guide'
      ? 'guide'
      : source.eonappHosted === true
        ? 'hosted'
        : 'direct-provider';
  const providerLabel = mode === 'guide'
    ? 'Guide mode'
    : cleanText(source.providerLabel || providerId || 'AI route', 120);
  return Object.freeze({
    mode,
    providerId: providerId || 'guide',
    providerLabel,
    privateOnDevice: mode === 'local' && source.ready === true,
    verified: source.ready === true,
    disclosure: mode === 'local'
      ? 'Text generation is routed to a verified local runtime. Browser speech remains a separate capability.'
      : mode === 'direct-provider'
        ? 'The selected provider is contacted directly with the user-configured route.'
        : mode === 'hosted'
          ? 'This task uses an explicitly permitted hosted EONAPP route.'
          : 'Built-in Guide mode is active; no model-powered provider task is running.'
  });
}

export function projectNexusTask(record = null) {
  const source = record && typeof record === 'object' ? record : {};
  const stage = mapTaskStage(source);
  const id = cleanText(source.taskId, 160).replace(/[^a-zA-Z0-9:_-]/g, '');
  return Object.freeze({
    id,
    label: id ? 'Current task' : 'No active task',
    state: cleanText(source.state || 'ready', 48),
    stage: stage.stage,
    stageLabel: stage.label,
    cancellable: ['running', 'paused', 'review-needed'].includes(String(source.state || '')),
    foregroundOnly: source.foregroundOnly !== false,
    updatedAt: String(source.updatedAt || source.createdAt || '')
  });
}

export function projectNexusApproval({ reviewItems = [], proposals = [] } = {}) {
  const proposalRows = Array.isArray(proposals) ? proposals : [];
  const reviews = Array.isArray(reviewItems) ? reviewItems : [];
  const activeProposals = proposalRows.filter((proposal) => proposal?.status === 'reviewing');
  const countValue = activeProposals.length + reviews.length;
  const first = activeProposals[0] || reviews[0] || null;
  return Object.freeze({
    pending: countValue > 0,
    count: countValue,
    label: countValue ? `${countValue} approval${countValue === 1 ? '' : 's'} waiting` : 'No approval waiting',
    reviewRoute: cleanText(first?.route, 500).startsWith('/') ? cleanText(first.route, 500) : '/workspace',
    actionId: cleanText(first?.id || first?.proposalId || '', 160).replace(/[^a-zA-Z0-9:_-]/g, '')
  });
}

export function projectNexusNodes(entries = []) {
  const rows = Array.isArray(entries) ? entries : [];
  const byRole = new Map();
  for (const entry of rows) {
    if (!entry || typeof entry !== 'object') continue;
    const role = cleanText(entry.role || 'coordinator', 64).toLowerCase();
    const current = byRole.get(role);
    const candidate = {
      id: `role:${role}`,
      kind: role,
      label: safeRoleLabel(role),
      status: mapPresenceStatus(entry),
      count: 1,
      providerKind: ['local', 'cloud', 'guide'].includes(String(entry.providerKind || '')) ? String(entry.providerKind) : 'guide',
      updatedAt: String(entry.updatedAt || entry.createdAt || '')
    };
    if (!current) {
      byRole.set(role, candidate);
      continue;
    }
    const priority = Object.freeze({ failed: 7, waiting: 6, active: 5, complete: 4, selected: 3, available: 2, blocked: 1 });
    byRole.set(role, {
      ...current,
      status: (priority[candidate.status] || 0) > (priority[current.status] || 0) ? candidate.status : current.status,
      count: current.count + 1,
      updatedAt: Date.parse(candidate.updatedAt) > Date.parse(current.updatedAt) ? candidate.updatedAt : current.updatedAt
    });
  }
  return Object.freeze([...byRole.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 16).map(Object.freeze));
}

export function projectNexusResults(taskRecord = null) {
  const source = taskRecord && typeof taskRecord === 'object' ? taskRecord : {};
  const resultCount = count(source.artifactIds, 1000);
  return Object.freeze({
    count: resultCount,
    // There is no current durable read/unread receipt. Do not invent one.
    unread: 0,
    label: resultCount ? `${resultCount} result${resultCount === 1 ? '' : 's'} available` : 'No new results',
    openRoute: source.reviewStatus === 'review-needed' ? '/workspace' : '/'
  });
}

export function deriveNexusEonbotState({ chatState = {}, task = {}, approval = {}, connection = {}, voiceState = {} } = {}) {
  const voiceStatus = String(voiceState.status || voiceState.voiceSession || '').toLowerCase();
  if (voiceState.isListening === true || chatState.voiceListening === true || voiceStatus === 'listening' || voiceStatus === 'requesting-microphone') return 'listening';
  if (voiceState.isSpeaking === true || chatState.isSpeaking === true || voiceStatus === 'speaking' || voiceStatus === 'live-output') return 'speaking';
  if (approval.pending === true || task.state === 'review-needed') return 'waiting-approval';
  if (task.state === 'failed' || voiceStatus === 'error' || connection.state === 'error') return 'error';
  if (['disconnected', 'unavailable'].includes(connection.state)) return 'offline';
  if (chatState.pending === true || task.state === 'running' || ['connecting', 'thinking'].includes(voiceStatus)) return 'processing';
  if (task.state === 'completed' && Number(task.resultCount || 0) > 0) return 'complete';
  return 'ready';
}

export function projectNexusConnection({ readiness = {}, liveVoice = {}, online = true } = {}) {
  if (online === false) return Object.freeze({ state: 'disconnected', retryable: true, label: 'Connection unavailable' });
  if (String(liveVoice.status || '') === 'error') return Object.freeze({ state: 'error', retryable: true, label: 'Voice connection needs attention' });
  if (String(readiness.state || '') === 'checking') return Object.freeze({ state: 'checking', retryable: false, label: 'Checking AI route' });
  if (readiness.ready === false && !['guide', 'needs-key', 'needs-endpoint', 'verification-required'].includes(String(readiness.state || ''))) {
    return Object.freeze({ state: 'unavailable', retryable: true, label: cleanText(readiness.reason || 'AI route unavailable', 140) });
  }
  return Object.freeze({ state: 'available', retryable: false, label: 'Ready' });
}

export function buildEonNexusPrivacyProjectedState({
  thread = null,
  activeProjectContext = null,
  project = null,
  readiness = {},
  taskRecords = [],
  reviewItems = [],
  proposals = [],
  agentPresence = [],
  productNodes = [],
  chatState = {},
  voiceState = {},
  online = true,
  detailsOpened = false,
  quality = {},
  now = Date.now()
} = {}) {
  const latestTask = newest(taskRecords);
  const conversation = projectNexusConversation(thread, { detailsOpened });
  const projectedProject = projectNexusProject(activeProjectContext, project, { detailsOpened });
  const atlas = projectEonNexusProjectAtlas({ activeProjectContext, project, thread, taskRecords, detailsOpened });
  const route = projectNexusRoute(readiness);
  const task = projectNexusTask(latestTask);
  const approval = projectNexusApproval({ reviewItems, proposals });
  const nodes = projectNexusNodes([...(Array.isArray(agentPresence) ? agentPresence : []), ...(Array.isArray(productNodes) ? productNodes : [])]);
  const results = projectNexusResults(latestTask);
  const connection = projectNexusConnection({ readiness, liveVoice: voiceState, online });
  const eonbotState = deriveNexusEonbotState({
    chatState,
    task: { ...task, resultCount: results.count },
    approval,
    connection,
    voiceState
  });
  return normalizeEonNexusState({
    conversation,
    project: projectedProject,
    eonbot: {
      state: eonbotState,
      detailCode: eonbotState,
      statusLabel: eonbotState.replace(/-/g, ' '),
      canListen: voiceState.dictationReady === true || voiceState.voiceReady === true,
      isListening: eonbotState === 'listening',
      isSpeaking: eonbotState === 'speaking'
    },
    task,
    route,
    approval,
    nodes,
    results,
    connection,
    quality,
    atlas,
    updatedAt: new Date(Number(now) || Date.now()).toISOString()
  }, { now });
}

export function getEonNexusPrivacyProjectionTruth() {
  return Object.freeze({
    rawChatText: false,
    rawProjectSummary: false,
    privateFilename: false,
    providerCredential: false,
    providerEndpoint: false,
    accountHint: false,
    vaultContent: false,
    projectAndConversationLabelsRedactedByDefault: true,
    unreadResultsInvented: false,
    atlasSelectedProjectOnly: true,
    atlasMissingLinksInvented: false,
    rendererReceivesProjectedStateOnly: true
  });
}

export default Object.freeze({
  projectNexusConversation,
  projectNexusProject,
  projectNexusRoute,
  projectNexusTask,
  projectNexusApproval,
  projectNexusNodes,
  projectNexusResults,
  deriveNexusEonbotState,
  projectNexusConnection,
  buildEonNexusPrivacyProjectedState,
  getEonNexusPrivacyProjectionTruth
});
