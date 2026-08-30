/**
 * W563 — useful City work paths.
 *
 * These are compact, source-controlled wayfinding cards. They do not inspect
 * private work, create a task, claim completion, award a reward, gate a core
 * capability, or sell a subscription. A person picks a path, reviews the
 * bounded handoff, then explicitly opens the native surface.
 */
export const EON_CITY_USEFUL_WORK_PATHS_SCHEMA = 'eon.city.useful-work-paths.w563.v1';

const freeze = (value) => Object.freeze(value);
const SAFE_ROUTES = new Set(['/workspace#creator-engine', '/forge', '/automations', '/insights', '/vault']);

const PATHS = freeze([
  freeze({
    id: 'creator',
    label: 'Creator',
    district: 'Creator Atrium',
    detail: 'Shape a brief, storyboard, caption or media review in the native Creator workspace.',
    outcome: 'A reviewed creative starting point—not generated media or publication.',
    route: '/workspace#creator-engine',
    routeLabel: 'Open Creator workspace',
    state: 'available-core'
  }),
  freeze({
    id: 'builder',
    label: 'Builder',
    district: 'Forge Bay',
    detail: 'Move an idea into the native Forge where code, layouts and exports are reviewed.',
    outcome: 'A build handoff—not an automatic code change or deploy.',
    route: '/forge',
    routeLabel: 'Open EON Forge',
    state: 'available-core'
  }),
  freeze({
    id: 'operator',
    label: 'Operator',
    district: 'Relay Station',
    detail: 'Prepare an operations or workflow review before any automation is considered in its native surface.',
    outcome: 'A review queue—not a schedule, connector, or background run.',
    route: '/automations',
    routeLabel: 'Open Automation review',
    state: 'available-core'
  }),
  freeze({
    id: 'analyst',
    label: 'Analyst',
    district: 'Strategy Observatory',
    detail: 'Open the research and paper-analysis surface after you choose a question outside City.',
    outcome: 'A research handoff—not advice, trading, or a live order.',
    route: '/insights',
    routeLabel: 'Open Research & paper analysis',
    state: 'available-core'
  }),
  freeze({
    id: 'guardian',
    label: 'Guardian',
    district: 'Vault Gardens',
    detail: 'Review backup, privacy, recovery and account-care options in the protected native Vault surface.',
    outcome: 'A safety review—not a Vault read, export, or account change in City.',
    route: '/vault',
    routeLabel: 'Open Vault review',
    state: 'available-core'
  })
]);

const BY_ID = new Map(PATHS.map((path) => [path.id, path]));

function cleanId(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function getEonCityUsefulWorkPaths() {
  return PATHS.map((path) => freeze({ ...path }));
}

export function getEonCityUsefulWorkPath(pathId = '') {
  const path = BY_ID.get(cleanId(pathId));
  return path ? freeze({ ...path }) : null;
}

/** Create a display-safe, second-click review; no user content enters this receipt. */
export function createEonCityUsefulWorkPathReview({ pathId = '' } = {}) {
  const path = getEonCityUsefulWorkPath(pathId);
  if (!path) return freeze({ ok: false, error: 'unknown-work-path', review: null, truth: getEonCityUsefulWorkPathsTruth() });
  return freeze({
    ok: true,
    review: freeze({
      schema: EON_CITY_USEFUL_WORK_PATHS_SCHEMA,
      pathId: path.id,
      title: path.label,
      district: path.district,
      detail: path.detail,
      outcome: path.outcome,
      destination: freeze({ route: path.route, label: path.routeLabel }),
      state: path.state,
      confirmationRequired: true,
      localOnly: true,
      privateContentVisible: false,
      taskCreated: false,
      providerRequestCreated: false,
      backgroundWorkStarted: false,
      entitlementChecked: false,
      commercialOfferShown: false,
      rewardCreated: false
    }),
    truth: getEonCityUsefulWorkPathsTruth()
  });
}

export function validateEonCityUsefulWorkPaths(paths = PATHS) {
  const errors = [];
  const ids = new Set();
  const routes = new Set();
  const allowedFields = new Set(['id', 'label', 'district', 'detail', 'outcome', 'route', 'routeLabel', 'state']);
  const forbiddenBehaviorFields = new Set([
    'price', 'priceCents', 'subscriptionTier', 'entitlement', 'reward', 'xp', 'loot',
    'task', 'prompt', 'file', 'projectId', 'accountId', 'provider', 'apiKey',
    'credential', 'schedule', 'publish', 'token', 'wallet'
  ]);
  for (const path of Array.isArray(paths) ? paths : []) {
    const record = path && typeof path === 'object' ? path : {};
    const id = cleanId(record.id);
    const route = String(record.route || '');
    for (const field of Object.keys(record)) {
      if (!allowedFields.has(field)) errors.push(`Unexpected work path field: ${field}`);
      if (forbiddenBehaviorFields.has(field)) errors.push(`Forbidden work path behavior field: ${field}`);
    }
    if (!/^[a-z][a-z0-9-]{2,32}$/.test(id)) errors.push(`Invalid work path id: ${id || '(empty)'}`);
    if (ids.has(id)) errors.push(`Duplicate work path id: ${id}`);
    ids.add(id);
    if (!SAFE_ROUTES.has(route)) errors.push(`Unsafe work path route: ${route || '(empty)'}`);
    if (routes.has(route)) errors.push(`Duplicate work path route: ${route}`);
    routes.add(route);
    if (record.state !== 'available-core') errors.push(`Work path must remain available-core: ${id || '(empty)'}`);
    if (!String(record.label || '').trim() || !String(record.district || '').trim() || !String(record.detail || '').trim() || !String(record.outcome || '').trim() || !String(record.routeLabel || '').trim()) errors.push(`Incomplete work path: ${id || '(empty)'}`);
  }
  if (!Array.isArray(paths) || paths.length !== 5) errors.push('Exactly five useful City work paths are required.');
  return freeze({ schema: EON_CITY_USEFUL_WORK_PATHS_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true });
}

export function getEonCityUsefulWorkPathsTruth() {
  return freeze({
    schema: EON_CITY_USEFUL_WORK_PATHS_SCHEMA,
    pathCount: PATHS.length,
    corePathsUseful: true,
    corePathsArtificiallyLocked: false,
    subscriptionEntitlementChecked: false,
    commercialOfferShown: false,
    rewardCreated: false,
    syntheticXpCreated: false,
    taskCreated: false,
    providerRequestCreated: false,
    backgroundWorkStarted: false,
    privateDataRead: false,
    privateContentVisible: false,
    automaticRoute: false,
    automaticToolExecution: false,
    completionClaimed: false,
    nativeHandoffRequiresConfirmation: true
  });
}
