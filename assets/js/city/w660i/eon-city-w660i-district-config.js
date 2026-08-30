/** W660I — explicit nine-district scene and arrival authority. */
export const EON_CITY_W660I_DISTRICT_CONFIG_SCHEMA = 'eon.city.w660i.district-config.v1';

const freeze = (value) => Object.freeze(value);
const point = (x, z, y = 0) => freeze({ x, y, z });
const camera = (alpha, beta, radius, targetY = 1.2) => freeze({ alpha, beta, radius, targetY });
const palette = (sky, fog, primary, accent, warm) => freeze({ sky, fog, primary, accent, warm });
const district = (value) => freeze({
  ...value,
  center: point(value.center.x, value.center.z),
  arrival: freeze({ ...point(value.arrival.x, value.arrival.z), heading: Number(value.arrival.heading || 0) }),
  camera: camera(value.camera.alpha, value.camera.beta, value.camera.radius, value.camera.targetY),
  palette: palette(...value.palette),
  terminals: freeze([...(value.terminals || [])]),
  skyline: freeze([...(value.skyline || [])])
});

export const EON_CITY_W660I_DISTRICTS = freeze([
  district({
    id: 'orientation-hall', label: 'Orientation Hall', purpose: 'Tutorial, device guidance, first missions and EONBOT introduction.',
    center: { x: 0, z: 7.2 }, radius: 5.4, arrival: { x: 0, z: 5.35, heading: Math.PI },
    camera: { alpha: -Math.PI / 2, beta: 1.04, radius: 11.8, targetY: 1.35 }, palette: ['#071523', '#0c2130', '#143a4a', '#34d9ff', '#f4b860'],
    signatureLandmarkId: 'orientation-ascension-hall', activeAssetGroupId: 'orientation-hall-composition', signature: 'gateway',
    terminals: ['start-here-terminal', 'device-guidance-terminal', 'missions-rewards-terminal'], skyline: ['guide-spire', 'arrival-tower', 'learning-arc']
  }),
  district({
    id: 'transit-network', label: 'Transit Network', purpose: 'Review-first travel map, district routes and capsule/platform arrival.',
    center: { x: 0, z: 1.5 }, radius: 4.2, arrival: { x: 0, z: 0.05, heading: Math.PI },
    camera: { alpha: -Math.PI / 2, beta: 0.98, radius: 10.4, targetY: 1.15 }, palette: ['#07131a', '#10252b', '#16414b', '#48f0cf', '#ffd166'],
    signatureLandmarkId: 'transit-orbit-exchange', activeAssetGroupId: 'transit-network-composition', signature: 'rings',
    terminals: ['district-route-console', 'capsule-status-terminal'], skyline: ['route-pylon', 'signal-bridge', 'capsule-dock']
  }),
  district({
    id: 'agent-theatre', label: 'Agent Theatre', purpose: 'Agent proposals, truthful receipts and review-first operations.',
    center: { x: 4.75, z: 1.8 }, radius: 4.2, arrival: { x: 3.35, z: 0.65, heading: -Math.PI / 2 },
    camera: { alpha: Math.PI * 0.88, beta: 1.02, radius: 10.6, targetY: 1.45 }, palette: ['#130d1d', '#24152f', '#41225b', '#c084fc', '#ff9f43'],
    signatureLandmarkId: 'agent-receipt-amphitheatre', activeAssetGroupId: 'agent-theatre-composition', signature: 'theatre',
    terminals: ['proposal-review-dais', 'receipt-verification-console'], skyline: ['agent-signal-spire', 'review-arch', 'receipt-tower']
  }),
  district({
    id: 'creator-atrium', label: 'Creator Atrium', purpose: 'Projects, Creator Capture and public-safe sharing review.',
    center: { x: -8.4, z: -4.1 }, radius: 5.2, arrival: { x: -7.1, z: -2.75, heading: Math.PI / 2 },
    camera: { alpha: -0.25, beta: 1.02, radius: 11.4, targetY: 1.25 }, palette: ['#140d18', '#2a1726', '#4c243e', '#ff6fae', '#f6c453'],
    signatureLandmarkId: 'creator-capture-atrium', activeAssetGroupId: 'creator-atrium-composition', signature: 'atrium',
    terminals: ['project-continuation-seat', 'creator-capture-console', 'sharing-review-terminal'], skyline: ['media-tower', 'project-beacon', 'capture-sail']
  }),
  district({
    id: 'forge-basilica', label: 'Forge Basilica', purpose: 'Coding, build, debugging and reviewed Forge workflows.',
    center: { x: 8.2, z: -3.2 }, radius: 5.2, arrival: { x: 6.65, z: -1.85, heading: -Math.PI / 2 },
    camera: { alpha: Math.PI * 1.15, beta: 0.98, radius: 12.2, targetY: 1.5 }, palette: ['#100f0b', '#272010', '#443317', '#ff9f1c', '#5ee7ff'],
    signatureLandmarkId: 'forge-basilica-reactor', activeAssetGroupId: 'forge-basilica-composition', signature: 'spire',
    terminals: ['forge-workbench-terminal', 'build-validation-console', 'device-lab-console'], skyline: ['compiler-spire', 'debug-tower', 'build-crane']
  }),
  district({
    id: 'command-centre', label: 'Command Centre', purpose: 'Whole-City operations, system state and bounded command tools.',
    center: { x: 0, z: -7.8 }, radius: 5.0, arrival: { x: 0, z: -6.05, heading: 0 },
    camera: { alpha: Math.PI / 2, beta: 0.94, radius: 12.6, targetY: 1.55 }, palette: ['#081018', '#121d2a', '#1e3445', '#56d4ff', '#ffb84d'],
    signatureLandmarkId: 'command-horizon-citadel', activeAssetGroupId: 'command-centre-composition', signature: 'citadel',
    terminals: ['city-status-command-table', 'agent-operations-console', 'review-inbox-terminal'], skyline: ['command-crown', 'operations-spire', 'horizon-array']
  }),
  district({
    id: 'archive-canopy', label: 'Archive Canopy', purpose: 'Library, research, saved knowledge and archive navigation.',
    center: { x: 9.25, z: 9.25 }, radius: 4.8, arrival: { x: 9.25, z: 7.55, heading: Math.PI },
    camera: { alpha: Math.PI * 1.18, beta: 1.03, radius: 11.2, targetY: 1.25 }, palette: ['#071612', '#102a22', '#1b4938', '#62f5b4', '#e6c76b'],
    signatureLandmarkId: 'archive-luminous-canopy', activeAssetGroupId: 'archive-canopy-composition', signature: 'canopy',
    terminals: ['library-search-terminal', 'research-archive-console'], skyline: ['knowledge-tree', 'index-spire', 'archive-bridge']
  }),
  district({
    id: 'vault-station', label: 'Vault Station', purpose: 'Local custody, backup boundaries, recovery and Vault Reveals.',
    center: { x: 7.25, z: 6.65 }, radius: 4.6, arrival: { x: 5.8, z: 5.25, heading: -Math.PI / 2 },
    camera: { alpha: Math.PI * 1.08, beta: 0.96, radius: 11.4, targetY: 1.35 }, palette: ['#0b1118', '#172331', '#263b50', '#5aa9ff', '#d5ad5f'],
    signatureLandmarkId: 'vault-custody-gate', activeAssetGroupId: 'vault-station-composition', signature: 'vault',
    terminals: ['vault-recovery-console', 'backup-boundary-terminal', 'reveal-status-altar'], skyline: ['custody-tower', 'recovery-arch', 'key-sentinel']
  }),
  district({
    id: 'trade-dome', label: 'Trade Dome', purpose: 'Membership, plan status, referral status and EONKEY unlocks.',
    center: { x: -7.2, z: 6.4 }, radius: 4.8, arrival: { x: -5.75, z: 5.0, heading: Math.PI / 2 },
    camera: { alpha: -0.12, beta: 1.0, radius: 11.7, targetY: 1.35 }, palette: ['#170f0c', '#2f1d14', '#4b2d1d', '#ffbc5e', '#54e6d5'],
    signatureLandmarkId: 'trade-membership-dome', activeAssetGroupId: 'trade-dome-composition', signature: 'dome',
    terminals: ['membership-plan-console', 'referral-status-terminal', 'eonkeys-unlock-terminal'], skyline: ['membership-dome', 'plan-tower', 'key-market-arc']
  })
]);

const byId = new Map(EON_CITY_W660I_DISTRICTS.map((entry) => [entry.id, entry]));

export function getEonCityW660iDistrictConfig(id = '') {
  return byId.get(String(id || '').trim().toLowerCase()) || null;
}

export function resolveEonCityW660iDistrictAtPosition(position = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return EON_CITY_W660I_DISTRICTS
    .map((entry) => freeze({ entry, distance: Math.hypot(x - entry.center.x, z - entry.center.z) }))
    .sort((left, right) => left.distance - right.distance)[0]?.entry || null;
}

export function resolveEonCityW660iDistrictTransition(position = {}, {
  currentDistrictId = '',
  enterMargin = 0.35,
  exitMargin = 1.35,
  switchAdvantage = 1.5
} = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  const ranked = EON_CITY_W660I_DISTRICTS
    .map((entry) => freeze({ entry, distance: Math.hypot(x - entry.center.x, z - entry.center.z) }))
    .sort((left, right) => left.distance - right.distance);
  const candidate = ranked[0] || null;
  const current = byId.get(String(currentDistrictId || '').trim().toLowerCase()) || null;
  if (!current || !candidate) return candidate?.entry || null;
  const currentDistance = Math.hypot(x - current.center.x, z - current.center.z);
  if (candidate.entry.id === current.id) return current;
  const safelyInsideCurrent = currentDistance <= current.radius + Math.max(0, Number(exitMargin) || 0);
  const clearlyInsideCandidate = candidate.distance <= Math.max(0.1, candidate.entry.radius - Math.max(0, Number(enterMargin) || 0));
  const clearlyCloser = candidate.distance + Math.max(0, Number(switchAdvantage) || 0) < currentDistance;
  if (safelyInsideCurrent && (!clearlyInsideCandidate || !clearlyCloser)) return current;
  return candidate.entry;
}

export function validateEonCityW660iDistrictConfigs(entries = EON_CITY_W660I_DISTRICTS) {
  const errors = [];
  const ids = new Set();
  for (const entry of entries || []) {
    if (!entry.id || ids.has(entry.id)) errors.push(`id:${entry.id || 'missing'}`);
    ids.add(entry.id);
    if (!entry.label || !entry.purpose || !entry.signatureLandmarkId || !entry.activeAssetGroupId) errors.push(`identity:${entry.id}`);
    if (![entry.center?.x, entry.center?.z, entry.arrival?.x, entry.arrival?.z, entry.arrival?.heading, entry.radius].every(Number.isFinite)) errors.push(`position:${entry.id}`);
    if (!entry.terminals || entry.terminals.length < 2) errors.push(`terminals:${entry.id}`);
    if (!entry.skyline || entry.skyline.length < 3) errors.push(`skyline:${entry.id}`);
    if (!entry.palette?.primary || !entry.palette?.accent || !entry.palette?.warm) errors.push(`palette:${entry.id}`);
  }
  const required = ['orientation-hall', 'transit-network', 'agent-theatre', 'creator-atrium', 'forge-basilica', 'command-centre', 'archive-canopy', 'vault-station', 'trade-dome'];
  for (const id of required) if (!ids.has(id)) errors.push(`required:${id}`);
  for (const entry of entries || []) {
    const nearest = [...(entries || [])].map((candidate) => ({ candidate, distance: Math.hypot(entry.arrival.x - candidate.center.x, entry.arrival.z - candidate.center.z) })).sort((left, right) => left.distance - right.distance)[0]?.candidate;
    if (nearest?.id !== entry.id) errors.push(`arrival-resolves-to:${entry.id}:${nearest?.id || 'none'}`);
  }
  return freeze({ ok: errors.length === 0 && ids.size === 9, errors: freeze(errors), count: ids.size });
}

export default freeze({
  EON_CITY_W660I_DISTRICT_CONFIG_SCHEMA,
  EON_CITY_W660I_DISTRICTS,
  getEonCityW660iDistrictConfig,
  resolveEonCityW660iDistrictAtPosition,
  resolveEonCityW660iDistrictTransition,
  validateEonCityW660iDistrictConfigs
});
