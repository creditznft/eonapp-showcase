/**
 * W576–W590 — EON Universe completion layer.
 *
 * This is a local, source-controlled City panel. It never fetches, authenticates,
 * calls a provider, persists an entitlement, enables media, or certifies a device.
 * It makes the remaining City programme understandable and reviewable in the same
 * signed-in City session without pretending that external evidence already exists.
 */
import {
  W576_W590_UNIVERSE_COMPLETION_CONTRACT,
  W576_W590_UNIVERSE_COMPLETION_SCHEMA
} from '../../../config/w576-w590-universe-completion-contract.mjs';

const freeze = (value) => Object.freeze(value);
const MAX_NOTE_LENGTH = 180;
const SAFE_ID = /^[a-z0-9-]{2,48}$/;
const SECTION_IDS = freeze(['districts', 'workroom', 'eonbot', 'ai', 'missions', 'expeditions', 'gateways', 'resilience', 'security', 'devices', 'release']);
const SECTION_SET = new Set(SECTION_IDS);

export const EON_CITY_UNIVERSE_COMPLETION_SCHEMA = W576_W590_UNIVERSE_COMPLETION_SCHEMA;
export const EON_CITY_UNIVERSE_COMPLETION_WAVES = W576_W590_UNIVERSE_COMPLETION_CONTRACT.waves;

// Internal source trace for the 15-contract completion ledger. This is deliberately
// never rendered in the user-facing City systems guide, which uses plain language.
export const EON_CITY_UNIVERSE_COMPLETION_INTERNAL_WAVE_TRACE = freeze([
  'W576', 'W577', 'W578', 'W579', 'W580', 'W581', 'W582', 'W583',
  'W584', 'W585', 'W586', 'W587', 'W588', 'W589', 'W590'
]);

export const EON_CITY_OPERATIONAL_DISTRICTS = freeze([
  freeze({ id: 'forge-court', wave: 'W576', title: 'Forge Court', type: 'workflow', detail: 'Review a build, app or automation task before opening its native work surface.', route: '/projects', action: 'review-then-cancel' }),
  freeze({ id: 'creator-avenue', wave: 'W576', title: 'Creator Avenue', type: 'workflow', detail: 'Prepare creator work as a local review card; no media, connector or publishing action starts here.', route: '/creator', action: 'review-then-cancel' }),
  freeze({ id: 'vault-gardens', wave: 'W577', title: 'Vault Gardens', type: 'continuity', detail: 'Inspect capsule continuity and cosmetic reveal boundaries without treating a local preference as ownership.', route: '/vault', action: 'review-then-cancel' }),
  freeze({ id: 'device-lab-docks', wave: 'W578', title: 'Device Lab Docks', type: 'capability', detail: 'Compare local AI readiness and redacted job receipt states without probing models or reading credentials.', route: '/local-ai', action: 'safe-in-place' }),
  freeze({ id: 'transit-gate', wave: 'W579', title: 'Transit Gate', type: 'wayfinding', detail: 'Choose a district guide in City; fast travel remains a local review until a real landmark route is available.', route: '/eoncity', action: 'safe-in-place' }),
  freeze({ id: 'project-workroom', wave: 'W580', title: 'Project Workroom', type: 'workroom', detail: 'Stage a same-tab project-task review. A user must still choose any native destination outside this panel.', route: '/projects', action: 'review-then-cancel' })
]);

export const EON_CITY_EONBOT_MODES = freeze([
  freeze({ id: 'guide', title: 'Guide', detail: 'Explain districts, controls and safe next steps with captions-first City copy.' }),
  freeze({ id: 'planner', title: 'Planner', detail: 'Prepare a local review-needed plan without calling a provider or opening work.' }),
  freeze({ id: 'builder', title: 'Builder', detail: 'Describe a build handoff and native destination; the City never submits code or deploys.' }),
  freeze({ id: 'companion', title: 'Companion', detail: 'Keep a calm visual companion presence with no mic, voice, social or telemetry behaviour.' })
]);

export const EON_CITY_USEFUL_MISSIONS = freeze([
  freeze({ id: 'orient-city', title: 'Orient in City', detail: 'Read the control guide and locate one district signal.', type: 'orientation' }),
  freeze({ id: 'review-work', title: 'Review a work handoff', detail: 'Open a review card and choose Cancel after understanding the destination.', type: 'safety' }),
  freeze({ id: 'check-device', title: 'Check device readiness', detail: 'Record a human observation in the device evidence lab; no device certification is created.', type: 'readiness' })
]);

export const EON_CITY_EXPEDITION_DESIGN_KIT = freeze([
  freeze({ id: 'quiet-build-garden', title: 'Quiet Build Garden', detail: 'A small private, no-network exploration template for project planning.', audience: 'builder' }),
  freeze({ id: 'creator-signal-walk', title: 'Creator Signal Walk', detail: 'A finite local template for creator ideation and share-safe output review.', audience: 'creator' }),
  freeze({ id: 'operator-observation-deck', title: 'Operator Observation Deck', detail: 'A review-only template for status and recovery practice.', audience: 'operator' })
]);

export const EON_CITY_REALM_GATEWAY_TYPES = freeze([
  freeze({ id: 'private-project', title: 'Private project gateway', detail: 'Requires a future explicit project policy and external review before it may connect to a project.' }),
  freeze({ id: 'curated-pocket-world', title: 'Curated pocket world', detail: 'A static authored destination pattern; it does not claim social or multiplayer access.' })
]);

export const EON_CITY_DEVICE_REVIEW_MATRIX = freeze([
  freeze({ id: 'desktop-keyboard-mouse', title: 'Desktop keyboard and mouse', status: 'not-run' }),
  freeze({ id: 'android-touch', title: 'Android touch', status: 'not-run' }),
  freeze({ id: 'iphone-ipad-safari', title: 'iPhone / iPad Safari', status: 'not-run' }),
  freeze({ id: 'tablet-orientation', title: 'Tablet portrait and landscape', status: 'not-run' }),
  freeze({ id: 'controller', title: 'Controller where available', status: 'not-run' }),
  freeze({ id: 'reduced-motion', title: 'Reduced motion and sound off', status: 'not-run' }),
  freeze({ id: 'offline-recovery', title: 'Offline / cache / refresh recovery', status: 'not-run' })
]);

const SECTION_META = freeze([
  freeze({ id: 'districts', label: 'Districts', detail: 'Useful City routes' }),
  freeze({ id: 'workroom', label: 'Workroom', detail: 'Safe local review' }),
  freeze({ id: 'eonbot', label: 'EONBOT', detail: 'Guidance modes' }),
  freeze({ id: 'ai', label: 'AI readiness', detail: 'Capability and consent' }),
  freeze({ id: 'missions', label: 'Missions', detail: 'Optional local practice' }),
  freeze({ id: 'expeditions', label: 'Expeditions', detail: 'Curated world ideas' }),
  freeze({ id: 'gateways', label: 'Gateways', detail: 'Private and curated only' }),
  freeze({ id: 'resilience', label: 'Resilience', detail: 'Recovery observations' }),
  freeze({ id: 'security', label: 'Security', detail: 'Protected boundaries' }),
  freeze({ id: 'devices', label: 'Devices', detail: 'Human review matrix' }),
  freeze({ id: 'release', label: 'Release', detail: 'Evidence and approval' })
]);

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function safeId(value = '', fallback = '') {
  const candidate = String(value || '').trim().toLowerCase();
  return SAFE_ID.test(candidate) ? candidate : fallback;
}

function normalizeSection(value = 'districts') {
  const candidate = safeId(value, 'districts');
  return SECTION_SET.has(candidate) ? candidate : 'districts';
}

function findById(rows, id) {
  return rows.find((entry) => entry.id === id) || null;
}

function cloneRows(rows) {
  return freeze(rows.map((entry) => freeze({ ...entry })));
}

function localStatus(label, detail) {
  return freeze({ label: String(label || ''), detail: String(detail || ''), localOnly: true, externalAction: false });
}

function makeWorkTask(district) {
  return freeze({
    id: `review-${district.id}`,
    districtId: district.id,
    title: `${district.title} review`,
    detail: district.detail,
    route: district.route,
    action: district.action,
    confirmationRequired: true,
    routeOpened: false,
    providerCalled: false,
    projectRead: false
  });
}

export function getEonCityUniverseCompletionPlan({ section = 'districts', selectedDistrictId = 'forge-court', selectedModeId = 'guide' } = {}) {
  const district = findById(EON_CITY_OPERATIONAL_DISTRICTS, safeId(selectedDistrictId, 'forge-court')) || EON_CITY_OPERATIONAL_DISTRICTS[0];
  const mode = findById(EON_CITY_EONBOT_MODES, safeId(selectedModeId, 'guide')) || EON_CITY_EONBOT_MODES[0];
  return freeze({
    schema: EON_CITY_UNIVERSE_COMPLETION_SCHEMA,
    selectedSection: normalizeSection(section),
    selectedDistrict: freeze({ ...district }),
    selectedMode: freeze({ ...mode }),
    waves: cloneRows(EON_CITY_UNIVERSE_COMPLETION_WAVES),
    districts: cloneRows(EON_CITY_OPERATIONAL_DISTRICTS),
    eonbotModes: cloneRows(EON_CITY_EONBOT_MODES),
    usefulMissions: cloneRows(EON_CITY_USEFUL_MISSIONS),
    expeditions: cloneRows(EON_CITY_EXPEDITION_DESIGN_KIT),
    realmGateways: cloneRows(EON_CITY_REALM_GATEWAY_TYPES),
    deviceReviewMatrix: cloneRows(EON_CITY_DEVICE_REVIEW_MATRIX),
    sourceOnly: true,
    externalEvidenceRequired: true,
    previewEvidenceProven: false,
    productionEvidenceProven: false,
    deviceEvidenceProven: false,
    automaticCertification: false,
    automaticProductionApproval: false,
    remoteNetwork: false,
    telemetry: false,
    publicMultiplayer: false,
    paymentOrEntitlement: false
  });
}

export function getEonCityW576W590Truth() {
  return freeze({
    schema: EON_CITY_UNIVERSE_COMPLETION_SCHEMA,
    sourceImplementationComplete: true,
    localReviewPanel: true,
    publicCityAccessBypass: false,
    oauthOrCaptchaAutomation: false,
    credentialCollection: false,
    providerCallFromCity: false,
    microphoneOrAudioActivation: false,
    paymentOrEntitlementActivation: false,
    rewardOrChanceMechanic: false,
    publicMultiplayerClaim: false,
    backgroundNetworkOrTelemetry: false,
    automaticCertification: false,
    automaticProductionApproval: false,
    previewEvidenceProven: false,
    productionEvidenceProven: false,
    deviceEvidenceProven: false,
    oauthEvidenceProven: false,
    ownerApprovalProven: false
  });
}

export function validateEonCityUniverseCompletionPlan(plan = getEonCityUniverseCompletionPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_UNIVERSE_COMPLETION_SCHEMA) errors.push('schema-invalid');
  if (!SECTION_SET.has(plan?.selectedSection)) errors.push('section-invalid');
  if (!Array.isArray(plan?.waves) || plan.waves.length !== 15) errors.push('waves-invalid');
  if (!Array.isArray(plan?.districts) || plan.districts.length !== EON_CITY_OPERATIONAL_DISTRICTS.length) errors.push('districts-invalid');
  if (!Array.isArray(plan?.eonbotModes) || plan.eonbotModes.length !== EON_CITY_EONBOT_MODES.length) errors.push('modes-invalid');
  if (plan?.sourceOnly !== true || plan?.externalEvidenceRequired !== true) errors.push('source-boundary-invalid');
  for (const key of ['previewEvidenceProven', 'productionEvidenceProven', 'deviceEvidenceProven', 'automaticCertification', 'automaticProductionApproval', 'remoteNetwork', 'telemetry', 'publicMultiplayer', 'paymentOrEntitlement']) {
    if (plan?.[key] !== false) errors.push(`truth-${key}-invalid`);
  }
  return freeze(errors);
}

export function createEonCityUniverseCompletionController({ onStatus = null } = {}) {
  const state = {
    section: 'districts',
    districtId: 'forge-court',
    modeId: 'guide',
    workReview: null,
    localCapabilityReviewed: false,
    hostedProviderReviewOpened: false,
    mission: null,
    expeditionId: null,
    gatewayId: null,
    observations: [],
    disposed: false
  };

  const notify = (message) => {
    try { onStatus?.(String(message || '')); } catch {}
  };
  const snapshot = () => freeze({
    ...getEonCityUniverseCompletionPlan({ section: state.section, selectedDistrictId: state.districtId, selectedModeId: state.modeId }),
    workReview: state.workReview ? freeze({ ...state.workReview }) : null,
    localCapabilityReviewed: state.localCapabilityReviewed,
    hostedProviderReviewOpened: state.hostedProviderReviewOpened,
    mission: state.mission ? freeze({ ...state.mission }) : null,
    expeditionId: state.expeditionId,
    gatewayId: state.gatewayId,
    observations: freeze(state.observations.map((entry) => freeze({ ...entry }))),
    disposed: state.disposed
  });

  const active = () => !state.disposed;
  return freeze({
    schema: EON_CITY_UNIVERSE_COMPLETION_SCHEMA,
    selectSection(id = '') {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      state.section = normalizeSection(id);
      return freeze({ ok: true, snapshot: snapshot() });
    },
    selectDistrict(id = '') {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      const district = findById(EON_CITY_OPERATIONAL_DISTRICTS, safeId(id));
      if (!district) return freeze({ ok: false, reason: 'district-not-found', snapshot: snapshot() });
      state.districtId = district.id;
      notify(`${district.title} selected locally. No route, project or provider was opened.`);
      return freeze({ ok: true, district: freeze({ ...district }), snapshot: snapshot() });
    },
    openWorkReview(id = state.districtId) {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      const district = findById(EON_CITY_OPERATIONAL_DISTRICTS, safeId(id));
      if (!district) return freeze({ ok: false, reason: 'district-not-found', snapshot: snapshot() });
      state.districtId = district.id;
      state.workReview = makeWorkTask(district);
      notify(`${district.title} is ready for review. Choosing Cancel keeps you in City.`);
      return freeze({ ok: true, review: freeze({ ...state.workReview }), snapshot: snapshot() });
    },
    cancelWorkReview() {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      state.workReview = null;
      notify('Stayed in City. No work destination, project, provider or personal data was opened.');
      return freeze({ ok: true, snapshot: snapshot() });
    },
    selectMode(id = '') {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      const mode = findById(EON_CITY_EONBOT_MODES, safeId(id));
      if (!mode) return freeze({ ok: false, reason: 'mode-not-found', snapshot: snapshot() });
      state.modeId = mode.id;
      notify(`EONBOT ${mode.title} mode selected for this local City session.`);
      return freeze({ ok: true, mode: freeze({ ...mode }), snapshot: snapshot() });
    },
    reviewLocalCapability() {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      state.localCapabilityReviewed = true;
      notify('Local AI capability guidance reviewed. City did not probe a model, contact localhost, or read credentials.');
      return freeze({ ok: true, status: localStatus('Local capability review', 'Guidance only; a real local runtime must prove itself in Device Lab.'), snapshot: snapshot() });
    },
    reviewHostedProviderConsent() {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      state.hostedProviderReviewOpened = true;
      notify('Hosted AI consent boundary reviewed. City did not contact a provider or open a consent flow.');
      return freeze({ ok: true, status: localStatus('Hosted provider boundary', 'Provider selection and consent remain separate, explicit and externally evidenced.'), snapshot: snapshot() });
    },
    startUsefulMission(dayToken = 'session', missionId = 'orient-city') {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      const mission = findById(EON_CITY_USEFUL_MISSIONS, safeId(missionId));
      const token = String(dayToken || 'session').replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 48) || 'session';
      if (!mission) return freeze({ ok: false, reason: 'mission-not-found', snapshot: snapshot() });
      state.mission = freeze({ id: mission.id, dayToken: token, title: mission.title, complete: false, reward: 'none', optIn: true });
      notify(`${mission.title} started as an opt-in local mission. It grants no reward, chance or entitlement.`);
      return freeze({ ok: true, mission: freeze({ ...state.mission }), snapshot: snapshot() });
    },
    completeUsefulMission() {
      if (!active() || !state.mission) return freeze({ ok: false, reason: 'mission-not-active', snapshot: snapshot() });
      state.mission = freeze({ ...state.mission, complete: true });
      notify('Useful mission marked complete locally. No reward, subscription benefit or progression entitlement was created.');
      return freeze({ ok: true, mission: freeze({ ...state.mission }), snapshot: snapshot() });
    },
    selectExpedition(id = '') {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      const expedition = findById(EON_CITY_EXPEDITION_DESIGN_KIT, safeId(id));
      if (!expedition) return freeze({ ok: false, reason: 'expedition-not-found', snapshot: snapshot() });
      state.expeditionId = expedition.id;
      notify(`${expedition.title} inspected as a source-controlled design kit. No pocket world was launched.`);
      return freeze({ ok: true, expedition: freeze({ ...expedition }), snapshot: snapshot() });
    },
    reviewGateway(id = '') {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      const gateway = findById(EON_CITY_REALM_GATEWAY_TYPES, safeId(id));
      if (!gateway) return freeze({ ok: false, reason: 'gateway-not-found', snapshot: snapshot() });
      state.gatewayId = gateway.id;
      notify(`${gateway.title} reviewed. No public realm, account connection or multiplayer session was opened.`);
      return freeze({ ok: true, gateway: freeze({ ...gateway }), snapshot: snapshot() });
    },
    recordObservation(lab = 'resilience', status = 'not-run', note = '') {
      if (!active()) return freeze({ ok: false, reason: 'controller-disposed', snapshot: snapshot() });
      const safeLab = safeId(lab, 'resilience');
      const safeStatus = ['not-run', 'passed', 'failed', 'blocked'].includes(String(status || '')) ? String(status) : 'not-run';
      const safeNote = Array.from(String(note || '')).map((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127 ? ' ' : character;
      }).join('').slice(0, MAX_NOTE_LENGTH);
      state.observations.push(freeze({ lab: safeLab, status: safeStatus, note: safeNote }));
      if (state.observations.length > 24) state.observations.splice(0, state.observations.length - 24);
      notify('Local observation recorded. It is not a device, security, identity or production certification.');
      return freeze({ ok: true, snapshot: snapshot() });
    },
    getSnapshot: snapshot,
    dispose() {
      state.disposed = true;
      state.workReview = null;
      state.observations = [];
      return snapshot();
    }
  });
}

function renderSection(snapshot) {
  const selected = snapshot.selectedSection;
  if (selected === 'districts') {
    return `<p>City has six useful district workflows. Each one is a review-first local handoff; none opens a route automatically.</p><div class="eon-play-command-deck-grid">${snapshot.districts.map((district) => `<button type="button" data-eon-universe-district="${escapeHtml(district.id)}" data-eon-play-command-deck-accent="${district.type === 'workflow' ? 'violet' : 'cyan'}"><strong>${escapeHtml(district.title)}</strong><span>${escapeHtml(district.detail)}</span><small>Review station →</small></button>`).join('')}</div><section class="eon-play-command-deck-detail" data-eon-universe-detail>${snapshot.workReview ? `<h3>${escapeHtml(snapshot.workReview.title)}</h3><p>${escapeHtml(snapshot.workReview.detail)}</p><p>City has prepared a review only. The native route remains closed; Cancel restores the neutral City state.</p><button type="button" data-eon-universe-cancel-review>Cancel review</button>` : `<p>Select a district to inspect its safe City handoff.</p>`}</section>`;
  }
  if (selected === 'workroom') {
    const review = snapshot.workReview;
    return `<p>Project Workroom supports same-tab task review. It never reads project files, performs work, submits a provider request or opens a route without a later user decision.</p><div class="eon-play-command-deck-grid">${snapshot.districts.filter((district) => ['workflow', 'workroom'].includes(district.type)).map((district) => `<button type="button" data-eon-universe-review-task="${escapeHtml(district.id)}" data-eon-play-command-deck-accent="teal"><strong>${escapeHtml(district.title)}</strong><span>Prepare a review card only.</span><small>Review → Cancel</small></button>`).join('')}</div><section class="eon-play-command-deck-detail" data-eon-universe-detail>${review ? `<h3>${escapeHtml(review.title)}</h3><p>Destination: ${escapeHtml(review.route)}. No navigation occurred.</p><p>Use Cancel to retain the City pose and avoid an external action.</p><button type="button" data-eon-universe-cancel-review>Cancel review</button>` : '<p>No work review is currently open.</p>'}</section>`;
  }
  if (selected === 'eonbot') {
    return `<p>EONBOT has four local City modes. Selecting a mode changes the guidance frame only; it does not enable voice, send a prompt or contact a model.</p><div class="eon-play-command-deck-grid">${snapshot.eonbotModes.map((mode) => `<button type="button" data-eon-universe-mode="${escapeHtml(mode.id)}" data-eon-play-command-deck-accent="${mode.id === snapshot.selectedMode.id ? 'mint' : 'violet'}"><strong>${escapeHtml(mode.title)}</strong><span>${escapeHtml(mode.detail)}</span><small>${mode.id === snapshot.selectedMode.id ? 'Selected locally' : 'Choose local mode'}</small></button>`).join('')}</div><section class="eon-play-command-deck-detail"><h3>${escapeHtml(snapshot.selectedMode.title)} mode</h3><p>${escapeHtml(snapshot.selectedMode.detail)}</p></section>`;
  }
  if (selected === 'ai') {
    return `<p>City shows capability and consent evidence without pretending it can operate AI. The local runtime and hosted provider each require their own real proof outside this panel.</p><div class="eon-play-command-deck-grid"><button type="button" data-eon-universe-review-local-ai data-eon-play-command-deck-accent="mint"><strong>Local AI capability</strong><span>Device Lab guidance, local model choices and redacted job-receipt visuals.</span><small>${snapshot.localCapabilityReviewed ? 'Reviewed locally' : 'Review boundary'}</small></button><button type="button" data-eon-universe-review-hosted-ai data-eon-play-command-deck-accent="amber"><strong>Hosted AI consent</strong><span>Explicit provider, purpose, data and cancellation review—no City provider call.</span><small>${snapshot.hostedProviderReviewOpened ? 'Reviewed locally' : 'Review boundary'}</small></button></div><section class="eon-play-command-deck-detail"><p>Local runtime proof, provider consent, connection, cancellation and output handling are separate evidence lanes. City has not opened either lane.</p></section>`;
  }
  if (selected === 'missions') {
    const mission = snapshot.mission;
    return `<p>Useful missions are opt-in, finite and non-commercial. They do not create loot, chance, price pressure, subscription benefit or local paid unlock.</p><div class="eon-play-command-deck-grid">${snapshot.usefulMissions.map((missionCard) => `<button type="button" data-eon-universe-start-mission="${escapeHtml(missionCard.id)}" data-eon-play-command-deck-accent="cyan"><strong>${escapeHtml(missionCard.title)}</strong><span>${escapeHtml(missionCard.detail)}</span><small>Start locally</small></button>`).join('')}</div><section class="eon-play-command-deck-detail">${mission ? `<h3>${escapeHtml(mission.title)}</h3><p>Opt-in local mission · day token ${escapeHtml(mission.dayToken)} · reward: none.</p>${mission.complete ? '<p>Marked complete locally. No entitlement was created.</p>' : '<button type="button" data-eon-universe-complete-mission>Mark local review complete</button>'}` : '<p>Choose a useful mission to begin a local, non-rewarding review.</p>'}</section>`;
  }
  if (selected === 'expeditions') {
    return `<p>Expedition templates are authored design kits for small curated pocket worlds. They are not world launches, user-generated public realms or multiplayer sessions.</p><div class="eon-play-command-deck-grid">${snapshot.expeditions.map((expedition) => `<button type="button" data-eon-universe-expedition="${escapeHtml(expedition.id)}" data-eon-play-command-deck-accent="violet"><strong>${escapeHtml(expedition.title)}</strong><span>${escapeHtml(expedition.detail)}</span><small>${escapeHtml(expedition.audience)} kit →</small></button>`).join('')}</div><section class="eon-play-command-deck-detail"><p>${snapshot.expeditionId ? 'Selected design kit is visible only in this local review.' : 'Inspect a design kit to see its no-network, no-public-world boundary.'}</p></section>`;
  }
  if (selected === 'gateways') {
    return `<p>Realm Gateways are private or curated patterns only. No public discovery, social graph, message channel, presence claim or multiplayer authority is enabled.</p><div class="eon-play-command-deck-grid">${snapshot.realmGateways.map((gateway) => `<button type="button" data-eon-universe-gateway="${escapeHtml(gateway.id)}" data-eon-play-command-deck-accent="rose"><strong>${escapeHtml(gateway.title)}</strong><span>${escapeHtml(gateway.detail)}</span><small>Review architecture</small></button>`).join('')}</div><section class="eon-play-command-deck-detail"><p>${snapshot.gatewayId ? 'Gateway selected for local architecture review. It has not connected to a Realm.' : 'Choose a gateway pattern to inspect its restricted boundary.'}</p></section>`;
  }
  if (selected === 'resilience') {
    return `<p>Rendering, cache, memory and long-session observations can be recorded locally, but results stay unverified until a named preview and a human/device evidence run exist.</p><div class="eon-play-command-deck-grid"><button type="button" data-eon-universe-observe="resilience" data-eon-play-command-deck-accent="cyan"><strong>Rendering and memory lab</strong><span>Record an observed state without certifying WebGL, streaming throughput or long-session stability.</span><small>Local observation</small></button><button type="button" data-eon-universe-observe="recovery" data-eon-play-command-deck-accent="slate"><strong>Cache and recovery lab</strong><span>Document a manual refresh or recovery outcome later in the evidence bundle.</span><small>Local observation</small></button></div><section class="eon-play-command-deck-detail"><p>${snapshot.observations.length} local observation${snapshot.observations.length === 1 ? '' : 's'} recorded. None are external proof.</p></section>`;
  }
  if (selected === 'security') {
    return `<p>Identity, edge asset delivery, abuse controls and security are strict review obligations. The City panel has not changed Google sign-in, CAPTCHA, credentials, gateways, edge policy or bot controls.</p><div class="eon-play-command-deck-grid"><button type="button" data-eon-universe-observe="security" data-eon-play-command-deck-accent="amber"><strong>Security review note</strong><span>Record a safe local reminder that source checks do not replace live edge and identity review.</span><small>Local observation</small></button><article data-eon-play-command-deck-accent="slate"><strong>Locked boundary</strong><span>No access bypass, credential capture, provider proxy, telemetry, payment or automated approval exists in this wave.</span><small>Protected boundary</small></article></div>`;
  }
  if (selected === 'devices') {
    return `<p>Physical-device review remains mandatory. The matrix below starts as not-run by design; browser code cannot honestly certify a phone, controller, visual judgement or recovery path.</p><div class="eon-play-command-deck-grid">${snapshot.deviceReviewMatrix.map((device) => `<article data-eon-play-command-deck-accent="slate"><strong>${escapeHtml(device.title)}</strong><span>Current evidence state: ${escapeHtml(device.status)}.</span><small>Human/device lane required</small></article>`).join('')}</div><section class="eon-play-command-deck-detail"><button type="button" data-eon-universe-observe="devices">Record a local reminder</button></section>`;
  }
  return `<p>Source checks, preview, production, device, asset licence, accessibility and owner approval are separate evidence gates. Local source completion never converts into release approval.</p><div class="eon-play-command-deck-grid">${snapshot.waves.map((wave) => `<article data-eon-play-command-deck-accent="${wave.releaseGate === 'D' ? 'amber' : 'teal'}"><strong>${escapeHtml(wave.title)}</strong><span>Source implementation: complete. External evidence: pending.</span><small>Independent review required</small></article>`).join('')}</div><section class="eon-play-command-deck-detail"><p>Preview, production, device, OAuth, asset-provenance and owner-approval evidence all remain pending until separately captured and reviewed.</p></section>`;
}

export function renderEonCityUniverseCompletionPanel() {
  return `<section class="eon-play-command-deck-panel eon-play-universe-completion-panel" data-eon-play-universe-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-universe-title"><div class="eon-play-command-deck-card"><p class="eon-play-kicker">EON City · systems guide</p><h2 id="eon-play-universe-title">City systems, clearly explained</h2><p>Choose a topic to see what City can do here, what stays local, and what still needs independent evidence.</p><div class="eon-play-command-deck-grid" data-eon-universe-nav></div><section class="eon-play-command-deck-detail" data-eon-universe-content aria-live="polite"></section><p class="eon-play-command-deck-note">This panel never grants access, opens work, connects AI, turns on sound/voice, creates a reward, starts a payment, launches multiplayer or certifies release readiness.</p><button type="button" data-eon-play-close-universe>Return to City</button></div></section>`;
}

export function bindEonCityUniverseCompletionPanel(root, { onStatus = null } = {}) {
  const panel = root?.querySelector?.('[data-eon-play-universe-panel]');
  const nav = root?.querySelector?.('[data-eon-universe-nav]');
  const content = root?.querySelector?.('[data-eon-universe-content]');
  const openButtons = [...(root?.querySelectorAll?.('[data-eon-play-open-universe]') || [])];
  const close = root?.querySelector?.('[data-eon-play-close-universe]');
  if (!panel || !nav || !content || !close || !openButtons.length) return () => {};
  const controller = createEonCityUniverseCompletionController({ onStatus });
  const render = () => {
    const snapshot = controller.getSnapshot();
    nav.innerHTML = SECTION_META.map((section) => `<button type="button" data-eon-universe-section="${escapeHtml(section.id)}" data-eon-play-command-deck-accent="${snapshot.selectedSection === section.id ? 'mint' : 'slate'}"><strong>${escapeHtml(section.label)}</strong><span>${escapeHtml(section.detail)}</span><small>${snapshot.selectedSection === section.id ? 'Open' : 'Review'}</small></button>`).join('');
    content.innerHTML = renderSection(snapshot);
    nav.querySelectorAll('[data-eon-universe-section]').forEach((button) => button.addEventListener('click', () => { controller.selectSection(button.dataset.eonUniverseSection); render(); }));
    content.querySelectorAll('[data-eon-universe-district]').forEach((button) => button.addEventListener('click', () => { controller.openWorkReview(button.dataset.eonUniverseDistrict); render(); }));
    content.querySelectorAll('[data-eon-universe-review-task]').forEach((button) => button.addEventListener('click', () => { controller.openWorkReview(button.dataset.eonUniverseReviewTask); render(); }));
    content.querySelectorAll('[data-eon-universe-cancel-review]').forEach((button) => button.addEventListener('click', () => { controller.cancelWorkReview(); render(); }));
    content.querySelectorAll('[data-eon-universe-mode]').forEach((button) => button.addEventListener('click', () => { controller.selectMode(button.dataset.eonUniverseMode); render(); }));
    content.querySelector('[data-eon-universe-review-local-ai]')?.addEventListener('click', () => { controller.reviewLocalCapability(); render(); });
    content.querySelector('[data-eon-universe-review-hosted-ai]')?.addEventListener('click', () => { controller.reviewHostedProviderConsent(); render(); });
    content.querySelectorAll('[data-eon-universe-start-mission]').forEach((button) => button.addEventListener('click', () => { controller.startUsefulMission('foreground-session', button.dataset.eonUniverseStartMission); render(); }));
    content.querySelector('[data-eon-universe-complete-mission]')?.addEventListener('click', () => { controller.completeUsefulMission(); render(); });
    content.querySelectorAll('[data-eon-universe-expedition]').forEach((button) => button.addEventListener('click', () => { controller.selectExpedition(button.dataset.eonUniverseExpedition); render(); }));
    content.querySelectorAll('[data-eon-universe-gateway]').forEach((button) => button.addEventListener('click', () => { controller.reviewGateway(button.dataset.eonUniverseGateway); render(); }));
    content.querySelectorAll('[data-eon-universe-observe]').forEach((button) => button.addEventListener('click', () => { controller.recordObservation(button.dataset.eonUniverseObserve, 'not-run', 'Local reminder recorded; external evidence remains required.'); render(); }));
  };
  const show = () => { panel.hidden = false; render(); panel.querySelector('[data-eon-universe-section]')?.focus({ preventScroll: true }); };
  const hide = () => { panel.hidden = true; openButtons[0]?.focus({ preventScroll: true }); };
  openButtons.forEach((button) => button.addEventListener('click', show));
  close.addEventListener('click', hide);
  panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
  return () => {
    openButtons.forEach((button) => button.removeEventListener('click', show));
    close.removeEventListener('click', hide);
    controller.dispose();
  };
}
