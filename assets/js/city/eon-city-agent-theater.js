/**
 * W618E — EON Agent Theater foundations.
 *
 * Fully implements the launch-safe Agent Theater foundation: visible dormant
 * agents now, and active agents only from receipt-backed W439 signals. It does
 * not create agents, start jobs, infer background work, show raw prompts, show
 * outputs, or expose provider/account/credential data.
 */
import { EON_CITY_COMMAND_ROOM_DORMANT_AGENTS } from './eon-city-command-room.js';
import { EON_CITY_AGENT_SIGNAL_SCHEMA } from './eon-city-agent-signal.js';

export const EON_CITY_AGENT_THEATER_SCHEMA = 'eon.city.agent-theater.w618e.v1';
export const EON_CITY_AGENT_THEATER_STAGE_SCHEMA = 'eon.city.agent-theater-stage.w620.v1';

const freeze = (value) => Object.freeze(value);
const clone = (value) => JSON.parse(JSON.stringify(value));

const ROLE_DISTRICT = Object.freeze({
  coordinator: 'command-centre',
  builder: 'workshop',
  researcher: 'archive',
  custody: 'vault-safehouse',
  growth: 'share-tower'
});

function safeRole(value = '') {
  const role = String(value || '').trim().toLowerCase();
  return ['coordinator', 'builder', 'researcher', 'custody', 'growth'].includes(role) ? role : 'coordinator';
}


export const EON_CITY_AGENT_THEATER_LANES = freeze([
  freeze({ id: 'eonbot-core', label: 'EONBOT Core', role: 'coordinator', districtId: 'command-centre', route: '/', emptyState: 'Waiting for your explicit planning action.' }),
  freeze({ id: 'forge-builder', label: 'Forge Builder', role: 'builder', districtId: 'workshop', route: '/forge', emptyState: 'No build job receipt is active.' }),
  freeze({ id: 'local-ai-guide', label: 'Local AI Guide', role: 'researcher', districtId: 'observatory', route: '/local-ai', emptyState: 'No local runtime receipt is active.' }),
  freeze({ id: 'automation-relay', label: 'Automation Relay', role: 'coordinator', districtId: 'automation-relay', route: '/automations', emptyState: 'No reviewed automation receipt is active.' }),
  freeze({ id: 'vault-steward', label: 'Vault Steward', role: 'custody', districtId: 'vault-safehouse', route: '/vault', emptyState: 'No backup or custody receipt is active.' }),
  freeze({ id: 'share-steward', label: 'Share Steward', role: 'growth', districtId: 'share-tower', route: '/realm-studio', emptyState: 'No signed invite/share receipt is active.' })
]);

function laneForAgent(agent = {}) {
  const role = safeRole(agent.role || 'coordinator');
  if (role === 'builder') return 'forge-builder';
  if (role === 'researcher') return 'local-ai-guide';
  if (role === 'custody') return 'vault-steward';
  if (role === 'growth') return 'share-steward';
  if (/automation/i.test(String(agent.districtId || agent.label || ''))) return 'automation-relay';
  return 'eonbot-core';
}

function publicReceiptCell(agent = {}) {
  return freeze({
    id: agent.id,
    label: agent.label,
    state: agent.state,
    route: agent.route || '/',
    receiptVerified: agent.receiptVerified === true,
    detail: agent.detail,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    providerVisible: false,
    externalEffect: false
  });
}

function activeAgentFromSignal(signal = {}) {
  if (signal?.schema !== EON_CITY_AGENT_SIGNAL_SCHEMA || signal.receiptVerified !== true) return null;
  const role = safeRole(signal.presenceEntry?.role || 'coordinator');
  return freeze({
    id: `receipt-${String(signal.signalId || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 80)}`,
    label: signal.title || 'Receipt-backed agent signal',
    role,
    districtId: ROLE_DISTRICT[role] || 'command-centre',
    state: `receipt-${signal.state || 'active'}`,
    detail: signal.bubble || 'A sanitized local job receipt can be reviewed in its native surface.',
    route: signal.route || '/',
    receiptVerified: true,
    localOnly: true,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    providerVisible: false,
    externalEffect: false
  });
}

export function buildEonCityAgentTheater({ agentSignalSnapshot = null } = {}) {
  const dormantAgents = clone(EON_CITY_COMMAND_ROOM_DORMANT_AGENTS).map((agent) => freeze({
    ...agent,
    receiptVerified: false,
    localOnly: true,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    providerVisible: false,
    externalEffect: false
  }));
  const receiptAgents = (Array.isArray(agentSignalSnapshot?.visibleSignals) ? agentSignalSnapshot.visibleSignals : [])
    .map(activeAgentFromSignal)
    .filter(Boolean);
  const visibleAgents = receiptAgents.length ? receiptAgents : dormantAgents;
  return freeze({
    schema: EON_CITY_AGENT_THEATER_SCHEMA,
    sourceSchema: agentSignalSnapshot?.schema || EON_CITY_AGENT_SIGNAL_SCHEMA,
    mode: receiptAgents.length ? 'receipt-backed-active' : 'dormant-foundation',
    visibleAgents: freeze(visibleAgents),
    dormantAgents: freeze(dormantAgents),
    receiptAgents: freeze(receiptAgents),
    visibleCount: visibleAgents.length,
    dormantCount: dormantAgents.length,
    receiptCount: receiptAgents.length,
    receiptBackedOnlyForActive: true,
    dormantWhenNoReceipt: true,
    startsProvider: false,
    startsAutomation: false,
    opensCheckout: false,
    grantsReward: false,
    readsPrivateWork: false,
    fakeAgentActivity: false,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    providerVisible: false,
    remoteTelemetry: false
  });
}

export function validateEonCityAgentTheater(snapshot = buildEonCityAgentTheater()) {
  const errors = [];
  if (snapshot.schema !== EON_CITY_AGENT_THEATER_SCHEMA) errors.push('Agent Theater schema mismatch.');
  if (!['dormant-foundation', 'receipt-backed-active'].includes(snapshot.mode)) errors.push('Agent Theater mode is invalid.');
  if (!Array.isArray(snapshot.visibleAgents) || snapshot.visibleAgents.length < 1) errors.push('Agent Theater must expose visible dormant/receipt agents.');
  if (snapshot.mode === 'dormant-foundation' && snapshot.visibleAgents.length < 4) errors.push('Dormant Agent Theater foundation must expose at least four sleeping agents.');
  if (!snapshot.receiptBackedOnlyForActive || !snapshot.dormantWhenNoReceipt) errors.push('Agent Theater must be receipt-backed for active agents and dormant without receipts.');
  for (const agent of Array.isArray(snapshot.visibleAgents) ? snapshot.visibleAgents : []) {
    const id = String(agent?.id || '').trim();
    if (!/^[a-z0-9_-]{2,96}$/i.test(id)) errors.push(`Invalid Agent Theater id: ${id || '(empty)'}`);
    if (!String(agent?.label || '').trim() || !String(agent?.detail || '').trim()) errors.push(`Incomplete Agent Theater agent: ${id}`);
    if (String(agent?.state || '').startsWith('receipt-') && agent.receiptVerified !== true) errors.push(`Active Agent Theater signal is not receipt verified: ${id}`);
    if (agent.rawPromptVisible || agent.rawOutputVisible || agent.credentialVisible || agent.providerVisible || agent.externalEffect) errors.push(`Agent Theater leaked private/provider/external state: ${id}`);
  }
  if (snapshot.startsProvider || snapshot.startsAutomation || snapshot.opensCheckout || snapshot.grantsReward || snapshot.readsPrivateWork || snapshot.fakeAgentActivity || snapshot.rawPromptVisible || snapshot.rawOutputVisible || snapshot.credentialVisible || snapshot.providerVisible || snapshot.remoteTelemetry) {
    errors.push('Agent Theater violates launch safety boundaries.');
  }
  const serialized = JSON.stringify(snapshot);
  if (/cash|crypto|wallet balance|nft|free month|renewal discount|auto[- ]?post|fake agent|platform-paid hosted generation|api[_ -]?key/i.test(serialized)) errors.push('Agent Theater contains a forbidden commercial, posting, fake-agent, credential, prompt or output claim.');
  return freeze({ schema: `${EON_CITY_AGENT_THEATER_SCHEMA}.validation`, ok: errors.length === 0, errors: freeze(errors), visibleCount: snapshot.visibleAgents?.length || 0, receiptCount: snapshot.receiptAgents?.length || 0 });
}

export function renderEonCityAgentTheaterAgents(snapshot = buildEonCityAgentTheater()) {
  return (Array.isArray(snapshot.visibleAgents) ? snapshot.visibleAgents : []).map((agent) => ({
    id: agent.id,
    label: agent.label,
    role: agent.role,
    districtId: agent.districtId,
    state: agent.state,
    detail: agent.detail,
    receiptVerified: Boolean(agent.receiptVerified)
  }));
}

export function buildEonCityAgentTheaterStage(snapshot = buildEonCityAgentTheater()) {
  const agents = Array.isArray(snapshot.visibleAgents) ? snapshot.visibleAgents : [];
  const lanes = EON_CITY_AGENT_THEATER_LANES.map((lane) => {
    const cells = agents.filter((agent) => laneForAgent(agent) === lane.id).map(publicReceiptCell);
    return freeze({
      ...lane,
      cells: freeze(cells),
      cellCount: cells.length,
      state: cells.length ? 'receipt-backed-visible' : 'dormant-empty',
      emptyStateVisible: cells.length === 0,
      rawPromptVisible: false,
      rawOutputVisible: false,
      credentialVisible: false,
      providerVisible: false,
      externalEffect: false
    });
  });
  return freeze({
    schema: EON_CITY_AGENT_THEATER_STAGE_SCHEMA,
    sourceSchema: snapshot.schema,
    mode: snapshot.mode,
    lanes: freeze(lanes),
    laneCount: lanes.length,
    visibleReceiptCells: lanes.reduce((sum, lane) => sum + lane.cellCount, 0),
    actions: freeze([
      freeze({ id: 'review-native-surface', label: 'Review native surface', startsWork: false, requiresClick: true }),
      freeze({ id: 'open-receipt-origin', label: 'Open receipt origin', startsWork: false, requiresClick: true }),
      freeze({ id: 'return-command-room', label: 'Return to Command Room', startsWork: false, requiresClick: true })
    ]),
    noFakeActivity: true,
    noPromptOrOutputLeak: true,
    noCredentialLeak: true,
    noCheckoutOrReward: true,
    startsProvider: false,
    startsAutomation: false,
    grantsReward: false,
    opensCheckout: false,
    remoteTelemetry: false
  });
}

export function validateEonCityAgentTheaterStage(stage = buildEonCityAgentTheaterStage()) {
  const errors = [];
  if (stage.schema !== EON_CITY_AGENT_THEATER_STAGE_SCHEMA) errors.push('Agent Theater stage schema mismatch.');
  if (!Array.isArray(stage.lanes) || stage.lanes.length < 6) errors.push('Agent Theater stage must include six practical lanes.');
  for (const lane of Array.isArray(stage.lanes) ? stage.lanes : []) {
    if (!String(lane.id || '').trim() || !String(lane.label || '').trim() || !String(lane.route || '').startsWith('/')) errors.push(`Invalid Agent Theater lane: ${lane.id || '(empty)'}`);
    if (!['receipt-backed-visible', 'dormant-empty'].includes(lane.state)) errors.push(`Invalid Agent Theater lane state: ${lane.id}`);
    if (lane.rawPromptVisible || lane.rawOutputVisible || lane.credentialVisible || lane.providerVisible || lane.externalEffect) errors.push(`Agent Theater lane leaked private/provider/external state: ${lane.id}`);
    for (const cell of Array.isArray(lane.cells) ? lane.cells : []) {
      if (String(cell.state || '').startsWith('receipt-') && cell.receiptVerified !== true) errors.push(`Visible Agent Theater cell must be receipt-verified: ${cell.id}`);
      if (cell.rawPromptVisible || cell.rawOutputVisible || cell.credentialVisible || cell.providerVisible || cell.externalEffect) errors.push(`Agent Theater cell leaked private/provider/external state: ${cell.id}`);
    }
  }
  if (!stage.noFakeActivity || !stage.noPromptOrOutputLeak || !stage.noCredentialLeak || !stage.noCheckoutOrReward) errors.push('Agent Theater stage safety boundaries are incomplete.');
  if (stage.startsProvider || stage.startsAutomation || stage.grantsReward || stage.opensCheckout || stage.remoteTelemetry) errors.push('Agent Theater stage attempted an external/commercial side effect.');
  const text = JSON.stringify(stage);
  if (/cash reward created|crypto payout created|wallet balance created|nft reward created|free month created|renewal discount created|api[_ -]?key visible|rawPromptVisible":true|rawOutputVisible":true|fake agent animation active/i.test(text)) errors.push('Agent Theater stage contains forbidden private/commercial/fake activity wording.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: `${EON_CITY_AGENT_THEATER_STAGE_SCHEMA}.validation`, checks: 14 });
}

export function renderEonCityAgentTheaterStage(stage = buildEonCityAgentTheaterStage()) {
  return (Array.isArray(stage.lanes) ? stage.lanes : []).map((lane) => ({
    id: lane.id,
    label: lane.label,
    route: lane.route,
    state: lane.state,
    cellCount: lane.cellCount,
    emptyState: lane.emptyState,
    cells: lane.cells.map((cell) => ({ id: cell.id, label: cell.label, state: cell.state, detail: cell.detail, route: cell.route }))
  }));
}

export default freeze({
  buildEonCityAgentTheater,
  renderEonCityAgentTheaterAgents,
  buildEonCityAgentTheaterStage,
  renderEonCityAgentTheaterStage,
  validateEonCityAgentTheater,
  validateEonCityAgentTheaterStage
});
