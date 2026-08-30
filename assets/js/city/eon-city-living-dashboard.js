/**
 * W618D — EON Living City Dashboard signals.
 *
 * A truthful local status projection for the City skyline / Command Room. It
 * may render dormant, ready, attention, or not-live states, but it never starts
 * a job, probes a server, uploads telemetry, reads private work, or pretends
 * AI/agents are active without a receipt-backed signal.
 */
export const EON_CITY_LIVING_DASHBOARD_SCHEMA = 'eon.city.living-dashboard.w618d.v1';

const freeze = (value) => Object.freeze(value);
const SAFE_STATES = freeze(['ready', 'review-required', 'local-only', 'not-live', 'attention', 'dormant', 'receipt-active']);

function count(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function cleanState(value = 'dormant') {
  const state = String(value || '').trim().toLowerCase();
  return SAFE_STATES.includes(state) ? state : 'dormant';
}

export function buildEonCityLivingDashboard({
  localAiSelfTestPassed = false,
  projectPortalCount = 0,
  vaultBackupReady = false,
  shareLedgerLive = false,
  automationDraftCount = 0,
  agentSignalSnapshot = null
} = {}) {
  const activeSignals = count(agentSignalSnapshot?.activeCount);
  const attentionSignals = count(agentSignalSnapshot?.attentionCount);
  const completedSignals = count(agentSignalSnapshot?.completedCount);
  const panels = freeze([
    freeze({
      id: 'local-ai',
      label: 'Local AI Observatory',
      districtId: 'observatory',
      route: '/local-ai',
      state: localAiSelfTestPassed ? 'ready' : 'review-required',
      headline: localAiSelfTestPassed ? 'Local runtime verified' : 'Device self-test required',
      detail: localAiSelfTestPassed ? 'A local runtime can be selected after user review.' : 'No hosted generation or model install is started by City.',
      truthSource: 'local-ai-self-test',
      localOnly: true
    }),
    freeze({
      id: 'projects',
      label: 'Project District',
      districtId: 'workshop',
      route: '/projects',
      state: projectPortalCount > 0 ? 'ready' : 'local-only',
      headline: projectPortalCount > 0 ? `${projectPortalCount} project portal${projectPortalCount === 1 ? '' : 's'} prepared` : 'Projects surface ready',
      detail: 'City shows only safe route/project counts; private project content stays on native pages.',
      truthSource: 'project-district-registry',
      localOnly: true
    }),
    freeze({
      id: 'vault',
      label: 'Vault Gardens',
      districtId: 'vault-safehouse',
      route: '/vault',
      state: vaultBackupReady ? 'ready' : 'review-required',
      headline: vaultBackupReady ? 'Backup route reviewed' : 'Backup is opt-in',
      detail: 'No key, token, account value, payment value or Vault content is shown in City.',
      truthSource: 'vault-backup-status',
      localOnly: true
    }),
    freeze({
      id: 'share',
      label: 'Share Tower',
      districtId: 'share-tower',
      route: 'share-command-center',
      state: shareLedgerLive ? 'ready' : 'not-live',
      headline: shareLedgerLive ? 'Referral ledger available' : 'Rewards need server proof later',
      detail: 'Share links and QR are reviewable; raw clicks never grant EON Keys.',
      truthSource: 'server-ledger-status',
      localOnly: !shareLedgerLive
    }),
    freeze({
      id: 'automation',
      label: 'Automation Relay',
      districtId: 'automation-relay',
      route: '/automations',
      state: automationDraftCount > 0 ? 'attention' : 'review-required',
      headline: automationDraftCount > 0 ? `${automationDraftCount} draft${automationDraftCount === 1 ? '' : 's'} need review` : 'No automation running',
      detail: 'City never schedules or runs automation from lights, panels, or agent visuals.',
      truthSource: 'automation-review-surface',
      localOnly: true
    }),
    freeze({
      id: 'agent-signals',
      label: 'Agent Theater',
      districtId: 'command-centre',
      route: 'agent-theater',
      state: activeSignals > 0 ? 'receipt-active' : attentionSignals > 0 ? 'attention' : completedSignals > 0 ? 'ready' : 'dormant',
      headline: activeSignals > 0 ? `${activeSignals} receipt-backed signal${activeSignals === 1 ? '' : 's'}` : 'Agents sleeping',
      detail: 'Only sanitized job receipts can light up agents; no prompt, output, provider or credential is displayed.',
      truthSource: 'eon-city-agent-signal-snapshot',
      localOnly: true
    })
  ]);
  return freeze({
    schema: EON_CITY_LIVING_DASHBOARD_SCHEMA,
    panels,
    panelCount: panels.length,
    activeCount: panels.filter((panel) => ['ready', 'receipt-active', 'attention'].includes(panel.state)).length,
    truthfulOnly: true,
    noFakeActivity: true,
    startsProvider: false,
    startsAutomation: false,
    opensCheckout: false,
    grantsReward: false,
    readsPrivateWork: false,
    remoteTelemetry: false
  });
}

export function validateEonCityLivingDashboard(snapshot = buildEonCityLivingDashboard()) {
  const errors = [];
  if (snapshot.schema !== EON_CITY_LIVING_DASHBOARD_SCHEMA) errors.push('Living Dashboard schema mismatch.');
  const panels = Array.isArray(snapshot.panels) ? snapshot.panels : [];
  if (panels.length < 6) errors.push('Living Dashboard must expose at least six truthful panels.');
  const ids = new Set();
  for (const panel of panels) {
    const id = String(panel?.id || '').trim();
    if (!/^[a-z0-9-]{2,40}$/.test(id)) errors.push(`Invalid Living Dashboard panel id: ${id || '(empty)'}`);
    if (ids.has(id)) errors.push(`Duplicate Living Dashboard panel id: ${id}`);
    ids.add(id);
    if (!SAFE_STATES.includes(cleanState(panel?.state))) errors.push(`Unsafe Living Dashboard state: ${panel?.state || '(empty)'}`);
    if (!String(panel?.label || '').trim() || !String(panel?.headline || '').trim() || !String(panel?.detail || '').trim()) errors.push(`Incomplete Living Dashboard panel: ${id}`);
  }
  for (const required of ['local-ai', 'projects', 'vault', 'share', 'automation', 'agent-signals']) {
    if (!ids.has(required)) errors.push(`Missing Living Dashboard panel: ${required}`);
  }
  if (!panels.some((panel) => panel.id === 'share' && panel.state === 'not-live')) errors.push('Share Tower must stay not-live until server ledger proof exists.');
  if (!snapshot.truthfulOnly || !snapshot.noFakeActivity) errors.push('Living Dashboard must be truthful-only and no-fake-activity.');
  if (snapshot.startsProvider || snapshot.startsAutomation || snapshot.opensCheckout || snapshot.grantsReward || snapshot.readsPrivateWork || snapshot.remoteTelemetry) errors.push('Living Dashboard violates launch safety boundaries.');
  const serialized = JSON.stringify(snapshot);
  if (/cash|crypto|wallet balance|nft|free month|renewal discount|auto[- ]?post|fake agent|platform-paid hosted generation|api[_ -]?key/i.test(serialized)) errors.push('Living Dashboard contains a forbidden commercial, posting, fake-agent, or credential claim.');
  return freeze({ schema: `${EON_CITY_LIVING_DASHBOARD_SCHEMA}.validation`, ok: errors.length === 0, errors: freeze(errors), panelCount: panels.length });
}

export function renderEonCityLivingDashboardSignals(snapshot = buildEonCityLivingDashboard()) {
  return (Array.isArray(snapshot.panels) ? snapshot.panels : []).map((panel) => ({
    id: panel.id,
    label: panel.label,
    state: panel.state,
    surface: panel.route,
    districtId: panel.districtId,
    detail: `${panel.headline}. ${panel.detail}`
  }));
}
