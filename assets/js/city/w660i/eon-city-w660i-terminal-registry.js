/** W660I — real product actions for the procedural terminals in all nine districts. */
import { EON_CITY_W660I_DISTRICTS } from './eon-city-w660i-district-config.js';
import { resolveEonCityW675TerminalPlacement } from '../w675/eon-city-w675-orientation-belt-activation.js';
import { resolveEonCityW688TerminalPlacement } from '../w688/eon-city-w688-creator-forge-belt-activation.js';
import { resolveEonCityW689TerminalPlacement } from '../w689/eon-city-w689-all-district-belts.js';

export const EON_CITY_W660I_TERMINAL_SCHEMA = 'eon.city.w660i.terminal-registry.v1';
export const EON_CITY_W660I_TERMINAL_INTERACTION_RADIUS = 2.7;
const freeze = (value) => Object.freeze(value);
const localPositions = freeze([
  freeze({ x: -2.6, y: 0, z: 1.65 }),
  freeze({ x: 0, y: 0, z: 2.25 }),
  freeze({ x: 2.6, y: 0, z: 1.65 })
]);
const action = (id, label, { panel = '', route = '', purpose = '' } = {}) => freeze({
  id,
  label,
  panel,
  route,
  purpose,
  reviewRequired: true,
  explicitUserAction: true,
  autoExecute: false,
  autoNavigate: false,
  privateDataRead: false
});

const definitions = freeze({
  'start-here-terminal': freeze({ label: 'Start Here Terminal', purpose: 'Review first missions, City progress and the next safe action.', actions: freeze([
    action('start-here-missions', 'Review missions', { panel: 'missions-rewards', purpose: 'Open verified City XP, missions, EONKEY and Vault Reveal status.' }),
    action('start-here-help', 'Open Help', { route: '/help', purpose: 'Open EONAPP help after route review.' })
  ]) }),
  'device-guidance-terminal': freeze({ label: 'Device Guidance Terminal', purpose: 'Review local or hosted AI setup without changing a provider.', actions: freeze([
    action('device-guidance-local-ai', 'Open Local AI', { route: '/local-ai', purpose: 'Inspect device guidance and provider state on the native Local AI page.' }),
    action('device-guidance-settings', 'Open Settings', { route: '/settings', purpose: 'Review accessibility and application preferences.' })
  ]) }),
  'missions-rewards-terminal': freeze({ label: 'Missions & Rewards Terminal', purpose: 'Show only verified City progress and non-crypto product unlocks.', actions: freeze([
    action('orientation-progress', 'Review City progress', { panel: 'missions-rewards', purpose: 'Inspect verified mission, XP, EONKEY and Vault Reveal status.' }),
    action('orientation-eonkeys', 'Open EONKEYs', { route: '/eon-keys', purpose: 'Review server-issued product unlocks; EONKEYs are not cryptocurrency.' }),
    action('orientation-sponsor-terminal', 'Open Sponsor Terminal', { route: '/rewards', purpose: 'Voluntarily watch rewarded ExoClick video. Only a qualifying server-validated completion can issue one consumable Sponsor Key.' })
  ]) }),
  'district-route-console': freeze({ label: 'District Route Console', purpose: 'Choose a City destination through a separate review and confirmation.', actions: freeze([
    action('transit-map', 'Choose a district', { panel: 'travel-map', purpose: 'Review one of the nine City destinations before confirming local travel.' }),
    action('transit-progress', 'Review exploration', { panel: 'missions-rewards', purpose: 'Review verified district-arrival and exploration progress.' })
  ]) }),
  'capsule-status-terminal': freeze({ label: 'Transit Capsule Status', purpose: 'Review the current local travel state without automatic movement.', actions: freeze([
    action('capsule-routes', 'Review travel map', { panel: 'travel-map', purpose: 'Inspect available City routes. Proximity never starts travel.' }),
    action('capsule-projects', 'Open Projects', { route: '/projects', purpose: 'Review a project before leaving City for the native project surface.' })
  ]) }),
  'proposal-review-dais': freeze({ label: 'Proposal Review Dais', purpose: 'Review real agent proposals and supported controls.', actions: freeze([
    action('proposal-agent-theatre', 'Review Agent Theatre', { panel: 'command-room', purpose: 'Inspect only genuine jobs, proposals, receipts and supported controls.' }),
    action('proposal-automations', 'Open Automations', { route: '/automations', purpose: 'Review automation records on their native page.' })
  ]) }),
  'receipt-verification-console': freeze({ label: 'Receipt Verification Console', purpose: 'Inspect truthful execution receipts without fabricated completion.', actions: freeze([
    action('receipt-command-room', 'Review receipts', { panel: 'command-room', purpose: 'Inspect observed job state and receipts.' }),
    action('receipt-workspace', 'Open Workspace', { route: '/workspace', purpose: 'Open the native Workspace after review.' })
  ]) }),
  'project-continuation-seat': freeze({ label: 'Project Continuation Seat', purpose: 'Resume real projects using the existing project store.', actions: freeze([
    action('creator-projects', 'Open Projects', { route: '/projects', purpose: 'Choose or resume a project on its native surface.' }),
    action('creator-workspace', 'Open Workspace', { route: '/workspace', purpose: 'Continue advanced project work in Workspace.' })
  ]) }),
  'creator-capture-console': freeze({ label: 'Creator Capture Console', purpose: 'Record gameplay locally with optional microphone and facecam.', actions: freeze([
    action('creator-capture-open', 'Creator Capture', { panel: 'creator-capture', purpose: 'Open local WebM capture. Nothing uploads automatically.' }),
    action('creator-capture-share', 'Sharing Center', { panel: 'share-center', purpose: 'Prepare a public-safe share only after recording and review.' })
  ]) }),
  'sharing-review-terminal': freeze({ label: 'Sharing Review Terminal', purpose: 'Prepare signed invites or public-safe gameplay handoffs.', actions: freeze([
    action('creator-sharing-center', 'Sharing Center', { panel: 'share-center', purpose: 'Review copy, invite and sharing choices. Nothing posts automatically.' }),
    action('creator-profile', 'Open Profile', { route: '/profile', purpose: 'Review public profile information before sharing.' })
  ]) }),
  'forge-workbench-terminal': freeze({ label: 'Forge Workbench Terminal', purpose: 'Open the existing EON Forge workflow.', actions: freeze([
    action('forge-open', 'Open Forge', { route: '/forge', purpose: 'Open the seven-stage Forge workflow on its native page.' }),
    action('forge-projects', 'Review Projects', { route: '/projects', purpose: 'Choose the project Forge should work with.' })
  ]) }),
  'build-validation-console': freeze({ label: 'Build Validation Console', purpose: 'Review build and debugging work without claiming unobserved completion.', actions: freeze([
    action('build-forge', 'Open Forge', { route: '/forge', purpose: 'Inspect build, validation and debugging state in Forge.' }),
    action('build-workspace', 'Open Workspace', { route: '/workspace', purpose: 'Open advanced project evidence and handoff tools.' })
  ]) }),
  'device-lab-console': freeze({ label: 'Device Lab Console', purpose: 'Review local runtime readiness and selected AI routes.', actions: freeze([
    action('device-lab-local-ai', 'Open Local AI', { route: '/local-ai', purpose: 'Inspect device and provider readiness without changing it automatically.' }),
    action('device-lab-settings', 'Open Settings', { route: '/settings', purpose: 'Review device, language and accessibility preferences.' })
  ]) }),
  'city-status-command-table': freeze({ label: 'City Status Command Table', purpose: 'Review current City and agent state through bounded controls.', actions: freeze([
    action('command-status-room', 'Open Command Room', { panel: 'command-room', purpose: 'Review only genuine jobs, receipts and supported controls.' }),
    action('command-missions', 'Review City progress', { panel: 'missions-rewards', purpose: 'Inspect verified City progress and district arrivals.' })
  ]) }),
  'agent-operations-console': freeze({ label: 'Agent Operations Console', purpose: 'Review real automations and agent operations.', actions: freeze([
    action('command-agent-room', 'Review Agent Theatre', { panel: 'command-room', purpose: 'Inspect real agent and receipt state.' }),
    action('command-automations', 'Open Automations', { route: '/automations', purpose: 'Open native automation records after route review.' })
  ]) }),
  'review-inbox-terminal': freeze({ label: 'Review Inbox Terminal', purpose: 'Open work that requires human review or continuation.', actions: freeze([
    action('command-workspace', 'Open Workspace', { route: '/workspace', purpose: 'Review current project work and receipts.' }),
    action('command-projects', 'Open Projects', { route: '/projects', purpose: 'Choose the project requiring attention.' })
  ]) }),
  'library-search-terminal': freeze({ label: 'Library Search Terminal', purpose: 'Open saved knowledge and library navigation.', actions: freeze([
    action('archive-library', 'Open Library', { route: '/library', purpose: 'Review saved knowledge on the native Library page.' }),
    action('archive-projects', 'Open Projects', { route: '/projects', purpose: 'Continue the project connected to the research.' })
  ]) }),
  'research-archive-console': freeze({ label: 'Research Archive Console', purpose: 'Open research tools while preserving source uncertainty.', actions: freeze([
    action('archive-research', 'Open Research Lab', { route: '/insights', purpose: 'Open local research and uncertainty review.' }),
    action('archive-library-review', 'Review Library', { route: '/library', purpose: 'Inspect saved knowledge before continuing research.' })
  ]) }),
  'vault-recovery-console': freeze({ label: 'Vault Recovery Console', purpose: 'Review local custody and recovery boundaries.', actions: freeze([
    action('vault-recovery-open', 'Open Vault', { route: '/vault', purpose: 'Review local custody, backup and recovery state.' }),
    action('vault-recovery-settings', 'Open Settings', { route: '/settings', purpose: 'Review device and backup preferences.' })
  ]) }),
  'backup-boundary-terminal': freeze({ label: 'Backup Boundary Terminal', purpose: 'Explain what stays local and what requires explicit backup.', actions: freeze([
    action('vault-backup-open', 'Review Vault', { route: '/vault', purpose: 'Inspect backup and recovery boundaries without reading secrets.' }),
    action('vault-backup-help', 'Open Help', { route: '/help', purpose: 'Review custody and backup guidance.' })
  ]) }),
  'reveal-status-altar': freeze({ label: 'Vault Reveal Status Altar', purpose: 'Show earned cosmetic Reveals and EONKEY unlock status truthfully.', actions: freeze([
    action('vault-reveals-status', 'Review Reveals', { panel: 'missions-rewards', purpose: 'Review earned cosmetic Vault Reveals and verified progress.' }),
    action('vault-reveals-keys', 'Open EONKEYs', { route: '/eon-keys', purpose: 'Review non-crypto product unlocks.' })
  ]) }),
  'membership-plan-console': freeze({ label: 'Membership Plan Console', purpose: 'Review server-backed plan status and available paths.', actions: freeze([
    action('trade-membership', 'Review Membership', { panel: 'membership', purpose: 'Review plan status without initiating checkout.' }),
    action('trade-profile', 'Open Profile', { route: '/profile', purpose: 'Review account and membership identity.' })
  ]) }),
  'referral-status-terminal': freeze({ label: 'Referral Status Terminal', purpose: 'Review referral and invitation state without automatic sharing.', actions: freeze([
    action('trade-sharing', 'Sharing Center', { panel: 'share-center', purpose: 'Prepare an explicit signed invite or public-safe share.' }),
    action('trade-profile-referral', 'Open Profile', { route: '/profile', purpose: 'Review account and referral status.' })
  ]) }),
  'eonkeys-unlock-terminal': freeze({ label: 'EONKEY Unlock Terminal', purpose: 'Review non-crypto product unlocks and earned status.', actions: freeze([
    action('trade-eonkeys', 'Open EONKEYs', { route: '/eon-keys', purpose: 'Review server-issued product unlocks.' }),
    action('trade-progress', 'Review progress', { panel: 'missions-rewards', purpose: 'Inspect verified City progress and earned unlock state.' })
  ]) })
});

export const EON_CITY_W660I_TERMINALS = freeze(EON_CITY_W660I_DISTRICTS.flatMap((district) =>
  district.terminals.map((terminalId, index) => {
    const definition = definitions[terminalId];
    const legacyLocalPosition = localPositions[index % localPositions.length];
    const placement = resolveEonCityW689TerminalPlacement({ districtId: district.id, terminalId, legacyLocalPosition })
      || resolveEonCityW688TerminalPlacement({ districtId: district.id, terminalId, legacyLocalPosition })
      || resolveEonCityW675TerminalPlacement({ districtId: district.id, terminalId, legacyLocalPosition });
    const localPosition = placement?.localPosition || legacyLocalPosition;
    return freeze({
      schema: EON_CITY_W660I_TERMINAL_SCHEMA,
      id: terminalId,
      label: definition?.label || terminalId.replaceAll('-', ' '),
      purpose: definition?.purpose || 'Review a district product action.',
      districtId: district.id,
      localPosition,
      position: placement?.position || freeze({ x: district.center.x + localPosition.x, y: 0, z: district.center.z + localPosition.z }),
      spatialModel: placement?.spatialModel || 'legacy-sanctum',
      interactionRadius: EON_CITY_W660I_TERMINAL_INTERACTION_RADIUS,
      actions: definition?.actions || freeze([]),
      visible: true,
      reviewFirst: true,
      localOnly: true,
      autoExecute: false,
      autoNavigate: false,
      privateDataRead: false
    });
  })
));

const byId = new Map(EON_CITY_W660I_TERMINALS.map((entry) => [entry.id, entry]));

export function getEonCityW660iTerminal(id = '') {
  return byId.get(String(id || '').trim()) || null;
}

export function getEonCityW660iTerminalsForDistrict(districtId = '') {
  const id = String(districtId || '').trim().toLowerCase();
  return freeze(EON_CITY_W660I_TERMINALS.filter((entry) => !id || entry.districtId === id));
}

export function getNearestEonCityW660iTerminal(position = {}, districtId = '') {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  const entries = getEonCityW660iTerminalsForDistrict(districtId);
  const nearest = entries
    .map((entry) => ({ entry, distance: Math.hypot(x - entry.position.x, z - entry.position.z) }))
    .sort((left, right) => left.distance - right.distance)[0];
  return nearest ? freeze(nearest) : null;
}

export function validateEonCityW660iTerminals(entries = EON_CITY_W660I_TERMINALS) {
  const errors = [];
  const ids = new Set();
  const districtCounts = new Map(EON_CITY_W660I_DISTRICTS.map((entry) => [entry.id, 0]));
  for (const entry of entries || []) {
    if (!entry.id || ids.has(entry.id)) errors.push(`id:${entry.id || 'missing'}`);
    ids.add(entry.id);
    if (!entry.label || !entry.purpose || !districtCounts.has(entry.districtId)) errors.push(`identity:${entry.id}`);
    if (![entry.position?.x, entry.position?.z, entry.interactionRadius].every(Number.isFinite)) errors.push(`position:${entry.id}`);
    if (!entry.actions || entry.actions.length < 2) errors.push(`actions:${entry.id}`);
    if (entry.actions?.some((item) => !item.reviewRequired || item.autoExecute || item.autoNavigate || item.privateDataRead)) errors.push(`unsafe-action:${entry.id}`);
    if (districtCounts.has(entry.districtId)) districtCounts.set(entry.districtId, districtCounts.get(entry.districtId) + 1);
  }
  for (const [districtId, count] of districtCounts) if (count < 2) errors.push(`district-terminal-count:${districtId}:${count}`);
  return freeze({
    ok: errors.length === 0 && ids.size === EON_CITY_W660I_DISTRICTS.reduce((total, entry) => total + entry.terminals.length, 0),
    errors: freeze(errors),
    count: ids.size,
    districtCounts: freeze(Object.fromEntries(districtCounts)),
    schema: EON_CITY_W660I_TERMINAL_SCHEMA
  });
}

export default freeze({
  EON_CITY_W660I_TERMINAL_SCHEMA,
  EON_CITY_W660I_TERMINALS,
  EON_CITY_W660I_TERMINAL_INTERACTION_RADIUS,
  getEonCityW660iTerminal,
  getEonCityW660iTerminalsForDistrict,
  getNearestEonCityW660iTerminal,
  validateEonCityW660iTerminals
});
