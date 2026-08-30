/**
 * W653 — EON City Command Room control-workspace contract.
 *
 * The Command Room is the practical default layer of EON City: a readable
 * control cockpit over the living 3D world. It keeps EONBOT inside City, groups
 * productive destinations by intent, and requires a second visible click before
 * any native EONAPP route opens.
 */
import { EON_COMMAND_DECK_CARDS } from './eon-city-command-deck.js';
import { EON_CITY_COMMAND_WORLD_DISTRICTS, EON_CITY_COMMAND_WORLD_LAYERS } from './eon-city-command-world-plan.js';
import { buildEonCityW709MasterRoomPlan, getEonCityW709MasterStationReview, validateEonCityW709MasterRoomPlan } from './w709/eon-city-w709-command-centre-master-room.js';

export const EON_CITY_COMMAND_ROOM_SCHEMA = 'eon.city.command-room.w653.v2';

const freeze = (value) => Object.freeze(value);
const clone = (value) => JSON.parse(JSON.stringify(value));

const COMMAND_ROOM_ALLOWED_ROUTES = freeze(['/', '/create', '/projects', '/forge', '/library', '/workspace', '/insights', '/local-ai', '/automations', '/vault', '/realm-studio']);
const COMMAND_ROOM_LOCAL_ACTIONS = freeze(['share-command-center', 'district-map', 'city-explore', 'command-deck', 'eonbot-panel']);
const SCREEN_TIERS = freeze(['primary', 'systems']);

export const EON_CITY_COMMAND_ROOM_SCREENS = freeze([
  freeze({
    id: 'eonbot', tier: 'primary', label: 'EONBOT Core', shortLabel: 'EONBOT', action: 'eonbot-panel', layer: 'command-room', accent: 'cyan', shortcut: 'C',
    headline: 'Ask, plan and continue inside City',
    detail: 'Open the in-City EONBOT planner. No prompt is copied and no provider starts automatically.', districtId: 'command-centre'
  }),
  freeze({
    id: 'projects', tier: 'primary', label: 'Project Console', shortLabel: 'Projects', route: '/projects', action: 'open-route', layer: 'command-room', accent: 'teal', shortcut: 'P',
    headline: 'Continue saved local work',
    detail: 'Review the Projects destination, then open it deliberately. Private project content stays outside City.', districtId: 'workshop'
  }),
  freeze({
    id: 'create', tier: 'primary', label: 'Creator Atrium', shortLabel: 'Create', route: '/create', action: 'open-route', layer: 'command-room', accent: 'rose', shortcut: 'N',
    headline: 'Create images, video, websites or guides',
    detail: 'Open the beginner-facing Create surface after review. City itself does not generate or publish.', districtId: 'creator-atrium'
  }),
  freeze({
    id: 'forge', tier: 'primary', label: 'Forge Basilica', shortLabel: 'Forge', route: '/forge', action: 'open-route', layer: 'command-room', accent: 'violet', shortcut: 'F',
    headline: 'Build or edit a web project',
    detail: 'Open Forge deliberately. Nothing compiles, changes files, deploys or uploads from the City card.', districtId: 'forge-bay'
  }),
  freeze({
    id: 'library', tier: 'primary', label: 'Archive Canopy', shortLabel: 'Library', route: '/library', action: 'open-route', layer: 'command-room', accent: 'mint', shortcut: 'B',
    headline: 'Reuse saved outputs and materials',
    detail: 'Open Library after review. City shows no private note, prompt, file or generated output.', districtId: 'archive'
  }),
  freeze({
    id: 'research', tier: 'primary', label: 'Strategy Observatory', shortLabel: 'Research', route: '/insights', action: 'open-route', layer: 'living-dashboard', accent: 'cyan', shortcut: 'I',
    headline: 'Research, compare and analyse',
    detail: 'Open the Research Lab after review. City does not place trades or claim live advice.', districtId: 'observatory'
  }),
  freeze({
    id: 'automations', tier: 'primary', label: 'Automation Relay', shortLabel: 'Automations', route: '/automations', action: 'open-route', layer: 'agent-theater', accent: 'amber', shortcut: 'A',
    headline: 'Review automation drafts',
    detail: 'Open Automations for explicit review. City never schedules or executes background work.', districtId: 'automation-relay'
  }),
  freeze({
    id: 'workspace', tier: 'systems', label: 'Advanced Workspace', shortLabel: 'Workspace', route: '/workspace', action: 'open-route', layer: 'command-room', accent: 'slate', shortcut: 'W',
    headline: 'Open the advanced work surface',
    detail: 'Use Workspace for deeper creator and operating tools after a visible route confirmation.', districtId: 'workshop'
  }),
  freeze({
    id: 'local-ai', tier: 'systems', label: 'Device Lab', shortLabel: 'Local AI', route: '/local-ai', action: 'open-route', layer: 'living-dashboard', accent: 'mint', shortcut: 'L',
    headline: 'Make private Local AI ready',
    detail: 'Open Make Local AI ready. City uses the same proof-based Guide/Local/Connected authority as Chat; no model install or local request starts from this card.', districtId: 'device-lab'
  }),
  freeze({
    id: 'vault', tier: 'systems', label: 'Vault Gardens', shortLabel: 'Vault', route: '/vault', action: 'open-route', layer: 'living-dashboard', accent: 'slate', shortcut: 'V',
    headline: 'Backup, recovery and protected settings',
    detail: 'Open Vault intentionally. City never displays keys, secrets, tokens or payment values.', districtId: 'vault-safehouse'
  }),
  freeze({
    id: 'realm-studio', tier: 'systems', label: 'Realm Studio', shortLabel: 'Realm', route: '/realm-studio', action: 'open-route', layer: 'command-room', accent: 'violet', shortcut: 'R',
    headline: 'Shape your private City identity',
    detail: 'Open the local Realm Studio. Nothing is publicly published or shared from this card.', districtId: 'realm'
  })
]);

export const EON_CITY_COMMAND_ROOM_DASHBOARD_SIGNALS = freeze([
  freeze({ id: 'local-ai', label: 'Local AI', state: 'review-required', surface: '/local-ai', districtId: 'device-lab', detail: 'Local status becomes ready only after a Local Lite receipt or explicit desktop-runtime self-test.' }),
  freeze({ id: 'projects', label: 'Projects', state: 'local-surface-ready', surface: '/projects', districtId: 'workshop', detail: 'Saved work remains in the native Projects surface.' }),
  freeze({ id: 'vault', label: 'Vault / backup', state: 'local-custody', surface: '/vault', districtId: 'vault-safehouse', detail: 'Backup and protected settings remain explicit and opt-in.' }),
  freeze({ id: 'share', label: 'Share / EON Keys', state: 'server-proof-required', surface: 'share-command-center', districtId: 'share-tower', detail: 'Links can be reviewed now; reward attribution requires server ledger proof.' }),
  freeze({ id: 'automation', label: 'Automation Relay', state: 'review-only', surface: '/automations', districtId: 'automation-relay', detail: 'No schedule or run starts from City visuals.' })
]);

export const EON_CITY_COMMAND_ROOM_DORMANT_AGENTS = freeze([
  freeze({ id: 'eonbot-guide', label: 'EONBOT Guide', role: 'coordinator', districtId: 'command-centre', state: 'ready-on-request', detail: 'Guides a route only after a visible user action.' }),
  freeze({ id: 'builder-orb', label: 'Builder Orb', role: 'builder', districtId: 'forge-bay', state: 'dormant-until-job-receipt', detail: 'Animates only from a verified build or job receipt.' }),
  freeze({ id: 'research-orb', label: 'Research Orb', role: 'researcher', districtId: 'observatory', state: 'dormant-until-job-receipt', detail: 'Never exposes raw prompts, documents or private output.' }),
  freeze({ id: 'vault-guardian', label: 'Vault Guardian', role: 'custody', districtId: 'vault-safehouse', state: 'local-visual-only', detail: 'Never exposes keys, tokens, secrets or payment data.' }),
  freeze({ id: 'share-scout', label: 'Share Scout', role: 'growth', districtId: 'share-tower', state: 'server-proof-required', detail: 'No conversion or EON Key grant is implied without ledger evidence.' })
]);

function cleanRoute(route = '') {
  const value = String(route || '').trim();
  if (!value.startsWith('/')) return '';
  const base = value.split('#')[0].split('?')[0] || '/';
  return COMMAND_ROOM_ALLOWED_ROUTES.includes(base) ? value : '';
}

export function getEonCityCommandRoomScreens() { return clone(EON_CITY_COMMAND_ROOM_SCREENS); }
export function getEonCityCommandRoomDashboardSignals() { return clone(EON_CITY_COMMAND_ROOM_DASHBOARD_SIGNALS); }
export function getEonCityCommandRoomDormantAgents() { return clone(EON_CITY_COMMAND_ROOM_DORMANT_AGENTS); }

export function getEonCityCommandRoomScreen(screenId = '') {
  const id = String(screenId || '').trim();
  const screen = EON_CITY_COMMAND_ROOM_SCREENS.find((entry) => entry.id === id);
  return screen ? freeze({ ...screen }) : null;
}

export function getEonCityCommandRoomScreenReview(screenId = '') {
  const screen = getEonCityCommandRoomScreen(screenId);
  if (!screen) return freeze({ ok: false, error: 'unknown-command-room-screen', review: null });
  if (screen.action !== 'open-route') return freeze({ ok: true, local: true, review: freeze({ id: screen.id, title: screen.label, detail: screen.detail, action: screen.action, actionLabel: 'Open inside City', route: null, confirmationRequired: true }) });
  const route = cleanRoute(screen.route);
  if (!route) return freeze({ ok: false, error: 'unsafe-command-room-route', review: null });
  return freeze({
    ok: true,
    local: false,
    review: freeze({ id: screen.id, title: screen.label, detail: screen.detail, route, action: 'open-route', actionLabel: `Open ${screen.shortLabel}`, confirmationRequired: true, transfersCityContent: false })
  });
}

export function getEonCityCommandRoomModel({ includeDeckCompatibility = true, dashboardSignals: dashboardSignalOverrides = null, dormantAgents: dormantAgentOverrides = null, agentTheaterStage = null } = {}) {
  const screens = getEonCityCommandRoomScreens();
  const dashboardSignals = Array.isArray(dashboardSignalOverrides) && dashboardSignalOverrides.length ? clone(dashboardSignalOverrides) : getEonCityCommandRoomDashboardSignals();
  const dormantAgents = Array.isArray(dormantAgentOverrides) && dormantAgentOverrides.length ? clone(dormantAgentOverrides) : getEonCityCommandRoomDormantAgents();
  const masterRoom = buildEonCityW709MasterRoomPlan({ statusCards: dashboardSignals, districtCount: EON_CITY_COMMAND_WORLD_DISTRICTS.length });
  return freeze({
    schema: EON_CITY_COMMAND_ROOM_SCHEMA,
    defaultMode: true,
    title: 'EON Command Room',
    subtitle: 'Operate EONAPP from one readable cockpit over the living 3D City.',
    promise: 'Start useful work quickly, then explore when you want the world around it.',
    layers: clone(EON_CITY_COMMAND_WORLD_LAYERS).map((layer) => layer.id),
    screens: freeze(screens),
    masterRoom,
    dashboardSignals: freeze(dashboardSignals),
    dormantAgents: freeze(dormantAgents),
    agentTheaterStage: freeze(Array.isArray(agentTheaterStage) ? clone(agentTheaterStage) : []),
    districtIds: freeze(EON_CITY_COMMAND_WORLD_DISTRICTS.map((district) => district.id)),
    deckCardIds: freeze(includeDeckCompatibility ? EON_COMMAND_DECK_CARDS.map((card) => card.id) : []),
    defaultVisibleInDirectCity: true,
    optionalExploreMode: true,
    routeConfirmationRequired: true,
    interactionHighlightAvailable: true,
    keyboardShortcuts: freeze(screens.map((screen) => screen.shortcut).filter(Boolean)),
    readsPrivateWork: false,
    startsProvider: false,
    startsAutomation: false,
    opensCheckout: false,
    grantsReward: false,
    browserEntitlementAuthority: false,
    fakeAgentActivity: false,
    autoNavigation: false,
    remoteTelemetry: false
  });
}

export function validateEonCityCommandRoomModel(model = getEonCityCommandRoomModel()) {
  const errors = [];
  if (model.schema !== EON_CITY_COMMAND_ROOM_SCHEMA) errors.push('Command Room schema mismatch.');
  if (model.defaultMode !== true || model.defaultVisibleInDirectCity !== true) errors.push('Command Room must be the default visible direct-City mode.');
  if (model.routeConfirmationRequired !== true || model.interactionHighlightAvailable !== true) errors.push('Command Room review/highlight controls are required.');
  const screens = Array.isArray(model.screens) ? model.screens : [];
  if (screens.length !== 11) errors.push('Command Room must expose seven primary and four systems screens.');
  const screenIds = new Set();
  const shortcuts = new Set();
  let primaryCount = 0;
  let systemsCount = 0;
  for (const screen of screens) {
    const id = String(screen?.id || '').trim();
    if (!/^[a-z0-9-]{2,40}$/.test(id)) errors.push(`Invalid Command Room screen id: ${id || '(empty)'}`);
    if (screenIds.has(id)) errors.push(`Duplicate Command Room screen: ${id}`);
    screenIds.add(id);
    if (!SCREEN_TIERS.includes(screen?.tier)) errors.push(`Invalid Command Room tier: ${id}`);
    if (screen?.tier === 'primary') primaryCount += 1;
    if (screen?.tier === 'systems') systemsCount += 1;
    if (!String(screen?.label || '').trim() || !String(screen?.headline || '').trim() || !String(screen?.detail || '').trim()) errors.push(`Incomplete Command Room screen: ${id}`);
    if (screen.action === 'open-route') {
      if (!cleanRoute(screen.route)) errors.push(`Unsafe Command Room route: ${screen.route || '(empty)'}`);
    } else if (!COMMAND_ROOM_LOCAL_ACTIONS.includes(screen.action)) errors.push(`Unsafe Command Room action: ${screen.action || '(empty)'}`);
    const shortcut = String(screen?.shortcut || '').trim().toUpperCase();
    if (shortcut) {
      if (!/^[A-Z0-9]$/.test(shortcut)) errors.push(`Invalid shortcut for ${id}: ${shortcut}`);
      if (shortcuts.has(shortcut)) errors.push(`Duplicate Command Room shortcut: ${shortcut}`);
      shortcuts.add(shortcut);
    }
  }
  if (primaryCount !== 7 || systemsCount !== 4) errors.push(`Command Room hierarchy invalid: ${primaryCount}/7 primary, ${systemsCount}/4 systems.`);
  for (const required of ['eonbot', 'projects', 'create', 'forge', 'library', 'research', 'automations', 'workspace', 'local-ai', 'vault', 'realm-studio']) if (!screenIds.has(required)) errors.push(`Missing required Command Room screen: ${required}`);
  const layerIds = new Set(Array.isArray(model.layers) ? model.layers : []);
  for (const required of ['command-room', 'living-dashboard', 'agent-theater']) if (!layerIds.has(required)) errors.push(`Missing Command World layer in Command Room: ${required}`);
  if (!Array.isArray(model.dashboardSignals) || model.dashboardSignals.length < 5) errors.push('Living Dashboard signals must be present in the Command Room.');
  if (!Array.isArray(model.dormantAgents) || model.dormantAgents.length < 5) errors.push('Dormant Agent Theater agents must be present in the Command Room.');
  if (!Array.isArray(model.agentTheaterStage)) errors.push('Command Room must carry Agent Theater stage lanes.');
  const masterValidation = validateEonCityW709MasterRoomPlan(model.masterRoom);
  if (!masterValidation.ok) errors.push(...masterValidation.errors.map((error) => `master-room:${error}`));
  if (model.readsPrivateWork || model.startsProvider || model.startsAutomation || model.opensCheckout || model.grantsReward || model.browserEntitlementAuthority || model.fakeAgentActivity || model.autoNavigation || model.remoteTelemetry) errors.push('Command Room violates launch safety boundaries.');
  const serialized = JSON.stringify(model);
  if (/cash|crypto|wallet balance|nft|free month|renewal discount|auto[- ]?post|fake agent|platform-paid hosted generation|api[_ -]?key/i.test(serialized)) errors.push('Command Room contains a forbidden commercial, posting, fake-agent, or credential claim.');
  return freeze({ schema: `${EON_CITY_COMMAND_ROOM_SCHEMA}.validation`, ok: errors.length === 0, errors: freeze(errors), screenCount: screenIds.size, primaryCount, systemsCount, signalCount: model.dashboardSignals?.length || 0, dormantAgentCount: model.dormantAgents?.length || 0 });
}

function renderScreen(screen) {
  const route = cleanRoute(screen.route || '');
  const routeAttrs = route ? ` data-eon-command-room-route="${escapeAttribute(route)}"` : '';
  const shortcutAttr = screen.shortcut ? ` data-eon-command-room-shortcut="${escapeAttribute(screen.shortcut)}"` : '';
  const shortcut = screen.shortcut ? `<kbd>${escapeHtml(screen.shortcut)}</kbd>` : '';
  return `<button type="button" class="eon-command-room-screen eon-command-room-accent-${escapeAttribute(screen.accent || 'cyan')}" data-eon-command-room-tier="${escapeAttribute(screen.tier)}" data-eon-command-room-action="${escapeAttribute(screen.action || '')}" data-eon-command-room-screen="${escapeAttribute(screen.id || '')}" aria-pressed="false" aria-controls="eon-command-room-review"${shortcutAttr}${routeAttrs}><span class="eon-command-room-screen-top"><strong>${escapeHtml(screen.label)}</strong>${shortcut}</span><span>${escapeHtml(screen.headline)}</span><small>${escapeHtml(screen.detail)}</small></button>`;
}

export function renderEonCityCommandRoomMarkup(model = getEonCityCommandRoomModel()) {
  const screens = Array.isArray(model.screens) ? model.screens : [];
  const primaryMarkup = screens.filter((screen) => screen.tier === 'primary').map(renderScreen).join('');
  const systemMarkup = screens.filter((screen) => screen.tier === 'systems').map(renderScreen).join('');
  const signals = Array.isArray(model.dashboardSignals) ? model.dashboardSignals : [];
  const agents = Array.isArray(model.dormantAgents) ? model.dormantAgents : [];
  const masterRoom = model.masterRoom || buildEonCityW709MasterRoomPlan();
  const masterStations = Array.isArray(masterRoom.stations) ? masterRoom.stations : [];
  const masterStationMarkup = masterStations.map((entry) => `<button type="button" class="eon-command-room-master-station eon-command-room-accent-${escapeAttribute(entry.accent || 'cyan')}" data-eon-command-room-master-station="${escapeAttribute(entry.id)}" aria-pressed="false" aria-controls="eon-command-room-review"><span>${escapeHtml(entry.label)}</span><small>${escapeHtml(entry.purpose)}</small><em>${escapeHtml(entry.observedState || 'not-observed')}</em></button>`).join('');
  const signalMarkup = signals.map((signal) => `<li data-eon-command-room-signal="${escapeAttribute(signal.id)}"><strong>${escapeHtml(signal.label)}</strong><span>${escapeHtml(signal.state)}</span><small>${escapeHtml(signal.detail)}</small></li>`).join('');
  const agentMarkup = agents.map((agent) => `<li data-eon-command-room-agent="${escapeAttribute(agent.id)}"><span aria-hidden="true"></span><strong>${escapeHtml(agent.label)}</strong><em>${escapeHtml(agent.state)}</em><small>${escapeHtml(agent.detail)}</small></li>`).join('');
  const stageLanes = Array.isArray(model.agentTheaterStage) ? model.agentTheaterStage : [];
  const routeScreenIds = new Map(screens.filter((screen) => screen.route).map((screen) => [cleanRoute(screen.route), screen.id]));
  routeScreenIds.set('/', 'eonbot');
  const stageMarkup = stageLanes.map((lane) => {
    const cells = Array.isArray(lane.cells) ? lane.cells : [];
    const cellMarkup = cells.length ? cells.map((cell) => `<li><strong>${escapeHtml(cell.label)}</strong><span>${escapeHtml(cell.state)}</span><small>${escapeHtml(cell.detail)}</small></li>`).join('') : `<li><strong>Dormant</strong><span>${escapeHtml(lane.state || 'dormant-empty')}</span><small>${escapeHtml(lane.emptyState || 'Waiting for a real receipt.')}</small></li>`;
    const route = cleanRoute(lane.route || '');
    const screenId = routeScreenIds.get(route) || '';
    const reviewButton = screenId
      ? `<button type="button" data-eon-command-room-agent-lane-review="${escapeAttribute(lane.id)}" data-eon-command-room-agent-lane-screen="${escapeAttribute(screenId)}">Review surface</button>`
      : '<span>Native surface unavailable</span>';
    return `<article data-eon-command-room-agent-lane="${escapeAttribute(lane.id)}"><h4>${escapeHtml(lane.label)}</h4><ul>${cellMarkup}</ul>${reviewButton}</article>`;
  }).join('');
  return `<section class="eon-command-room-panel" data-eon-command-room-panel aria-labelledby="eon-command-room-title">
    <div class="eon-command-room-card">
      <div class="eon-command-room-hero">
        <div><p class="eon-play-kicker">EON City · control workspace</p><h2 id="eon-command-room-title">${escapeHtml(model.title)}</h2><p>${escapeHtml(model.subtitle)} ${escapeHtml(model.promise)}</p></div>
        <div class="eon-command-room-hero-actions"><button type="button" data-eon-command-room-explore>Enter 3D Explore</button><button type="button" data-eon-command-room-map>District Map</button><button type="button" data-eon-command-room-highlight aria-pressed="false">Show interactives</button><button type="button" data-eon-command-room-share>Share</button></div>
      </div>
      <section class="eon-command-room-master" data-eon-command-room-master aria-labelledby="eon-command-room-master-title"><div class="eon-command-room-master-head"><div><p class="eon-play-kicker">W709 · all-in-one operations</p><h3 id="eon-command-room-master-title">${escapeHtml(masterRoom.title)}</h3><p>One central table connects NEXUS, work, approvals, Atlas, providers, EONBOT, City monitoring and Vault.</p></div><div class="eon-command-room-master-table" aria-hidden="true"><span></span><strong>${escapeHtml(masterRoom.commandTable?.label || 'City Operations Table')}</strong></div></div><div class="eon-command-room-master-grid" aria-label="Command Centre master stations">${masterStationMarkup}</div></section>
      <section class="eon-command-room-work-lanes" aria-labelledby="eon-command-room-work-title"><h3 id="eon-command-room-work-title">Start or continue work</h3><div class="eon-command-room-grid" aria-label="Primary EONAPP work screens">${primaryMarkup}</div></section>
      <section class="eon-command-room-systems-rack" aria-labelledby="eon-command-room-systems-title"><h3 id="eon-command-room-systems-title">Systems and private spaces</h3><div class="eon-command-room-grid eon-command-room-system-grid" aria-label="EONAPP systems screens">${systemMarkup}</div></section>
      <section class="eon-command-room-review" id="eon-command-room-review" data-eon-command-room-review aria-live="polite" aria-atomic="true"><p>Choose a screen to review it. Native pages open only after a second visible click.</p></section>
      <div class="eon-command-room-bottom">
        <section><h3>Living dashboard</h3><ul class="eon-command-room-signals">${signalMarkup}</ul></section>
        <section><h3>Agent Theater</h3><ul class="eon-command-room-agents">${agentMarkup}</ul><div class="eon-command-room-agent-stage" data-eon-command-room-agent-stage>${stageMarkup}</div><p>Agents remain still until a real receipt exists. City never performs fake work for atmosphere.</p></section>
      </div>
      <p class="eon-command-room-boundary">Your cockpit prepares choices and shows truthful status. Work, AI, sharing, publishing and account changes remain explicit actions in their native surfaces.</p>
    </div>
  </section>`;
}

function escapeHtml(value = '') { return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function escapeAttribute(value = '') { return escapeHtml(value).replace(/`/g, '&#96;'); }

export { getEonCityW709MasterStationReview };
