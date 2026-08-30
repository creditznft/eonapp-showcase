/** W802A — exact owner playthrough evidence matrix. */
const freeze = Object.freeze;
export const EON_EXPANSE_W802A_OWNER_PLAYTHROUGH_SCHEMA = 'eon.expanse.owner-playthrough-matrix.w802a.v1';

const CASES = freeze([
  ['signal-companion-rescue', 'Signal Frontier', 'Recover EONBOT through the ordered prologue'],
  ['signal-campaign-complete', 'Signal Frontier', 'Complete all seven campaign stages and the finale receipt'],
  ['signal-transit-return', 'Signal Frontier', 'Use Regional Transit and return to the Hub without state loss'],
  ['signal-label-gps-accessibility', 'Signal Frontier', 'Verify GPS, bounded labels, keyboard and touch interaction'],
  ['productive-create', 'Productive missions', 'Claim one exact native Create result'],
  ['productive-local-ai', 'Productive missions', 'Claim one exact Local AI result'],
  ['productive-automation', 'Productive missions', 'Claim one exact Automation result'],
  ['productive-library', 'Productive missions', 'Claim one exact Library result'],
  ['productive-daily-signal', 'Productive missions', 'Complete one fresh Daily Signal without duplicate XP'],
  ['frontier-unlock-plan', 'My Frontier', 'Enter My Frontier from starter access and plan one approved building'],
  ['frontier-construct-terminal', 'My Frontier', 'Construct beside the authored plot and use its maintained terminal'],
  ['frontier-resident-loop', 'My Frontier', 'Invite, interact with, release and re-invite one verified resident'],
  ['frontier-theme-upgrade', 'My Frontier', 'Apply an approved theme and verify one physical level-two upgrade'],
  ['frontier-reload', 'My Frontier', 'Reload and revalidate construction, resident and upgrade persistence'],
  ['storm-gateway-entry', 'Storm Sector', 'Enter through the exact activated authored gateway'],
  ['storm-weather-restoration', 'Storm Sector', 'Complete the ordered weather-restoration mission family'],
  ['storm-relay-repair', 'Storm Sector', 'Complete the ordered relay-repair mission family'],
  ['storm-rescue', 'Storm Sector', 'Complete the ordered storm-rescue mission family'],
  ['storm-patrols', 'Storm Sector', 'Verify all three authored patrols, routes and guidance interactions'],
  ['storm-transit', 'Storm Sector', 'Use unlocked Transit nodes without progress fabrication'],
  ['storm-return-reload', 'Storm Sector', 'Return to Signal Frontier and reload Storm progress safely'],
  ['capture-signal', 'Creator Capture', 'Prepare one Signal Frontier capture handoff'],
  ['capture-frontier', 'Creator Capture', 'Prepare one My Frontier construction or resident capture handoff'],
  ['capture-storm', 'Creator Capture', 'Prepare one verified Storm achievement capture handoff'],
  ['share-privacy-review', 'Share', 'Review clean-HUD, caption, QR/referral and privacy options without publishing'],
  ['living-side-mission', 'Living frontier', 'Complete one side mission and verify its visual memory'],
  ['living-dynamic-event', 'Living frontier', 'Observe one event lifecycle and truthful expiry'],
  ['living-repeatable', 'Living frontier', 'Verify repeatable reset without streak punishment'],
  ['chrome-desktop', 'Browser matrix', 'Complete authenticated Chrome desktop proof'],
  ['edge-desktop', 'Browser matrix', 'Complete authenticated Edge desktop proof'],
  ['mobile-landscape', 'Browser matrix', 'Complete authenticated mobile-landscape proof'],
  ['performance-lite', 'Performance', 'Record foreground Lite evidence'],
  ['performance-balanced', 'Performance', 'Record foreground Balanced evidence'],
  ['performance-cinematic', 'Performance', 'Record foreground Cinematic evidence'],
  ['transition-soak', 'Performance', 'Complete at least ten Hub ↔ Expanse transitions without unsafe growth']
].map(([id, group, label]) => freeze({ id, group, label })));

const safeId = (value = '') => /^[a-z0-9][a-z0-9._:-]{7,127}$/i.test(String(value || '')) ? String(value) : '';
const safeDigest = (value = '') => /^[a-f0-9]{64}$/i.test(String(value || '')) ? String(value).toLowerCase() : '';

export function getEonExpanseW802AOwnerPlaythroughCases() {
  return CASES;
}

export function projectEonExpanseW802AOwnerPlaythrough(evidence = [], { expectedBuildDigest = '' } = {}) {
  const digest = safeDigest(expectedBuildDigest);
  const byId = new Map();
  for (const item of Array.isArray(evidence) ? evidence : []) {
    if (!item || typeof item !== 'object' || item.passed !== true) continue;
    const caseId = String(item.caseId || '');
    if (!CASES.some((entry) => entry.id === caseId)) continue;
    const proofId = safeId(item.proofId);
    const buildDigest = safeDigest(item.buildDigest);
    const measuredAt = Number(item.measuredAt);
    if (!proofId || !buildDigest || !(measuredAt > 0)) continue;
    if (digest && buildDigest !== digest) continue;
    byId.set(caseId, freeze({ caseId, proofId, buildDigest, measuredAt }));
  }
  const rows = freeze(CASES.map((entry) => freeze({ ...entry, passed: byId.has(entry.id), evidence: byId.get(entry.id) || null })));
  const passedCount = rows.filter((entry) => entry.passed).length;
  const complete = passedCount === rows.length;
  return freeze({
    schema: EON_EXPANSE_W802A_OWNER_PLAYTHROUGH_SCHEMA,
    rows,
    passedCount,
    requiredCount: rows.length,
    complete,
    status: complete ? 'owner-playthrough-evidence-complete-awaiting-explicit-certification' : 'owner-playthrough-evidence-incomplete',
    automaticCertification: false,
    automaticDeployment: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W802A_OWNER_PLAYTHROUGH_SCHEMA, getEonExpanseW802AOwnerPlaythroughCases, projectEonExpanseW802AOwnerPlaythrough });
