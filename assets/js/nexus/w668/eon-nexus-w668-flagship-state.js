/**
 * W668 — one flagship visual-intelligence state for Pulse, Expanded Nexus and City.
 *
 * This projection consumes only the already privacy-projected Nexus snapshot.
 * It owns no assistant, conversation, project, task, approval, provider or
 * renderer state and never starts work, voice, navigation or approval.
 */
export const EON_NEXUS_W668_FLAGSHIP_SCHEMA = 'eon.nexus.flagship-state.w668.v1';
export const EON_NEXUS_W668_MAX_NODES = 5;

const freeze = (value) => Object.freeze(value);

const STATE_PROFILES = freeze({
  ready: freeze({ label: 'Ready', shape: 'orbital-calm', accent: '#22d3ee', secondary: '#8b5cf6', energy: 0.38, pulseMs: 3200, orbitSpeed: 0.22, halo: 0.48, topology: 'balanced-orbit' }),
  listening: freeze({ label: 'Listening', shape: 'receptive-wave', accent: '#67e8f9', secondary: '#38bdf8', energy: 0.66, pulseMs: 1450, orbitSpeed: 0.32, halo: 0.72, topology: 'open-wave' }),
  processing: freeze({ label: 'Working', shape: 'reasoning-helix', accent: '#a78bfa', secondary: '#22d3ee', energy: 0.86, pulseMs: 1050, orbitSpeed: 0.72, halo: 0.9, topology: 'focused-helix' }),
  speaking: freeze({ label: 'Speaking', shape: 'voice-ripple', accent: '#38bdf8', secondary: '#f8c761', energy: 0.74, pulseMs: 1180, orbitSpeed: 0.48, halo: 0.82, topology: 'voice-ripple' }),
  'waiting-approval': freeze({ label: 'Approval waiting', shape: 'decision-gate', accent: '#fb923c', secondary: '#f8c761', energy: 0.78, pulseMs: 1800, orbitSpeed: 0.12, halo: 0.88, topology: 'attention-gate' }),
  complete: freeze({ label: 'Complete', shape: 'resolved-star', accent: '#f8c761', secondary: '#22d3ee', energy: 0.64, pulseMs: 2200, orbitSpeed: 0.2, halo: 0.78, topology: 'resolved-radiance' }),
  error: freeze({ label: 'Needs attention', shape: 'fractured-signal', accent: '#fb7185', secondary: '#fb923c', energy: 0.9, pulseMs: 720, orbitSpeed: 0.08, halo: 0.94, topology: 'fault-focus' }),
  offline: freeze({ label: 'Offline', shape: 'dormant-core', accent: '#94a3b8', secondary: '#475569', energy: 0.16, pulseMs: 5200, orbitSpeed: 0, halo: 0.2, topology: 'dormant' })
});

const STATUS_PRIORITY = freeze({ waiting: 8, failed: 7, active: 6, selected: 5, complete: 4, blocked: 3, available: 2 });
const STATUS_ACCENTS = freeze({ waiting: '#fb923c', failed: '#fb7185', active: '#22d3ee', selected: '#a78bfa', complete: '#f8c761', blocked: '#94a3b8', available: '#67e8f9' });

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon-nexus')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cleanId(value = '', fallback = '') {
  const text = String(value || '').trim().replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 100);
  return text || fallback;
}

function cleanText(value = '', max = 120) {
  const printable = Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 ? ' ' : character;
  }).join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, max);
}

function coherentState(snapshot = {}) {
  const raw = Object.hasOwn(STATE_PROFILES, String(snapshot?.eonbot?.state || '')) ? String(snapshot.eonbot.state) : 'ready';
  if (snapshot?.approval?.pending === true) return 'waiting-approval';
  if (snapshot?.connection?.state === 'error') return 'error';
  if (['disconnected', 'unavailable'].includes(String(snapshot?.connection?.state || ''))) return 'offline';
  if (['running', 'paused', 'review-needed'].includes(String(snapshot?.task?.state || '')) && ['ready', 'complete'].includes(raw)) return 'processing';
  // A stale "complete" light without a current task or result must settle back
  // to ready. Pulse, Expanded Nexus and City must never imply a fresh outcome
  // merely because an old completion state remained in the adapter.
  if (raw === 'complete' && !snapshot?.task?.id && Math.max(0, Number(snapshot?.results?.count) || 0) === 0) return 'ready';
  return raw;
}

function normalizeNode(node = {}, index = 0) {
  const status = Object.hasOwn(STATUS_PRIORITY, String(node.status || '')) ? String(node.status) : 'available';
  const id = cleanId(node.id, `node-${index + 1}`);
  return freeze({
    id,
    kind: cleanId(node.kind, 'tool'),
    label: cleanText(node.label || node.kind || 'Available', 90) || 'Available',
    status,
    count: Math.max(0, Math.min(999, Number(node.count) || 0)),
    providerKind: ['guide', 'local', 'cloud'].includes(String(node.providerKind || '')) ? String(node.providerKind) : 'guide',
    accent: STATUS_ACCENTS[status] || STATUS_ACCENTS.available,
    stableAngleDeg: hash32(`${id}:angle`) % 360,
    stableRadius: Number((0.74 + (hash32(`${id}:radius`) % 18) / 100).toFixed(2)),
    phase: Number(((hash32(`${id}:phase`) % 1000) / 1000).toFixed(3))
  });
}

function orderNodes(nodes = [], stableOrder = [], focusNodeId = '') {
  const stable = new Map((Array.isArray(stableOrder) ? stableOrder : []).map((id, index) => [String(id), index]));
  const focus = cleanId(focusNodeId);
  return [...(Array.isArray(nodes) ? nodes : [])]
    .map(normalizeNode)
    .sort((left, right) => {
      if (focus && left.id === focus) return -1;
      if (focus && right.id === focus) return 1;
      const leftStable = stable.has(left.id) ? stable.get(left.id) : Number.MAX_SAFE_INTEGER;
      const rightStable = stable.has(right.id) ? stable.get(right.id) : Number.MAX_SAFE_INTEGER;
      if (leftStable !== rightStable) return leftStable - rightStable;
      const statusDelta = (STATUS_PRIORITY[right.status] || 0) - (STATUS_PRIORITY[left.status] || 0);
      return statusDelta || left.stableAngleDeg - right.stableAngleDeg || left.label.localeCompare(right.label);
    });
}

function surfaceScale(surface = 'expanded') {
  if (surface === 'pulse') return freeze({ form: 'pulse', coreScale: 0.34, fieldScale: 0.12, nodeScale: 0, detailLevel: 'signal' });
  if (surface === 'spatial') return freeze({ form: 'spatial', coreScale: 1.35, fieldScale: 1.5, nodeScale: 1.12, detailLevel: 'world' });
  return freeze({ form: 'expanded', coreScale: 1, fieldScale: 1, nodeScale: 1, detailLevel: 'workspace' });
}

export function projectEonNexusW668FlagshipState(snapshot = {}, {
  surface = 'expanded',
  stableNodeOrder = []
} = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const state = coherentState(source);
  const profile = STATE_PROFILES[state];
  const ordered = orderNodes(source.nodes, stableNodeOrder, source?.surface?.focusNodeId);
  const primary = ordered.slice(0, EON_NEXUS_W668_MAX_NODES);
  const projectId = cleanId(source?.project?.id || source?.project?.projectId || (source?.project?.selected ? 'selected-project' : 'no-project'));
  const conversationId = cleanId(source?.conversation?.id || source?.conversation?.threadId || 'shared-conversation');
  const routeMode = cleanId(source?.route?.mode || (source?.route?.privateOnDevice ? 'local' : 'guide'), 'guide');
  const nodeIdentity = primary.map((node) => node.id).join(',') || 'no-nodes';
  const continuitySeed = `${projectId}|${conversationId}|${routeMode}|${nodeIdentity}`;
  const continuityId = `nx-${hash32(continuitySeed).toString(36)}`;
  const morphSignature = `${state}:${continuityId}:${profile.topology}`;
  const angleOffset = hash32(`${continuityId}:angle-offset`) % 72;
  const nodes = freeze(primary.map((node, index) => freeze({
    ...node,
    displayAngleDeg: Number((angleOffset + (360 / Math.max(1, primary.length)) * index).toFixed(3)),
    orbitRadius: Number((0.78 + (index % 2) * 0.08).toFixed(2))
  })));
  const attentionNode = nodes.find((node) => ['waiting', 'failed', 'active', 'selected'].includes(node.status)) || nodes[0] || null;
  const scale = surfaceScale(surface);
  const approvalCount = Math.max(0, Number(source?.approval?.count) || 0);
  const resultCount = Math.max(0, Number(source?.results?.count) || 0);
  const taskActive = Boolean(source?.task?.id) || ['running', 'paused', 'review-needed'].includes(String(source?.task?.state || ''));
  const dataEnergy = Math.min(1, profile.energy + Math.min(0.12, nodes.length * 0.018) + Math.min(0.08, (approvalCount + resultCount) * 0.012));

  return freeze({
    schema: EON_NEXUS_W668_FLAGSHIP_SCHEMA,
    surface: scale.form,
    state,
    stateLabel: profile.label,
    shape: profile.shape,
    topology: profile.topology,
    accent: profile.accent,
    secondaryAccent: profile.secondary,
    energy: Number(dataEnergy.toFixed(3)),
    pulseMs: profile.pulseMs,
    orbitSpeed: profile.orbitSpeed,
    halo: profile.halo,
    coreScale: scale.coreScale,
    fieldScale: scale.fieldScale,
    nodeScale: scale.nodeScale,
    detailLevel: scale.detailLevel,
    continuityId,
    morphSignature,
    nodes: freeze(nodes),
    allNodeCount: ordered.length,
    hiddenNodeCount: Math.max(0, ordered.length - nodes.length),
    stableNodeOrder: freeze(ordered.map((node) => node.id)),
    attentionNodeId: attentionNode?.id || '',
    projectSelected: source?.project?.selected === true,
    taskActive,
    approvalPending: source?.approval?.pending === true,
    approvalCount,
    resultCount,
    privateRoute: source?.route?.privateOnDevice === true,
    sameStateAcrossPulseExpandedSpatial: true,
    startsAiWork: false,
    startsVoiceCapture: false,
    autoNavigation: false,
    autoApproval: false,
    privateContentRead: false
  });
}

export function getEonNexusW668FlagshipTruth() {
  return freeze({
    schema: EON_NEXUS_W668_FLAGSHIP_SCHEMA,
    oneStateProjection: true,
    surfaces: freeze(['pulse', 'expanded', 'spatial']),
    maximumVisualNodes: EON_NEXUS_W668_MAX_NODES,
    stableNodeIdentity: true,
    stateDrivenShapeLightAndMotion: true,
    sameConversation: true,
    sameProjectState: true,
    secondAssistant: false,
    secondProjectStore: false,
    privateContentRead: false,
    automaticWork: false,
    automaticVoice: false,
    automaticNavigation: false,
    automaticApproval: false
  });
}

export default freeze({
  EON_NEXUS_W668_FLAGSHIP_SCHEMA,
  EON_NEXUS_W668_MAX_NODES,
  projectEonNexusW668FlagshipState,
  getEonNexusW668FlagshipTruth
});
