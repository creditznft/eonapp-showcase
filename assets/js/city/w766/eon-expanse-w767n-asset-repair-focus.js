const freeze = (value) => Object.freeze(value);
const list = (value) => Array.isArray(value) ? value : [];
const token = (value = '', max = 96) => String(value || '').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max);
const words = (value = '') => String(value || '').replaceAll('-', ' ').replaceAll('_', ' ').trim();

export const EON_EXPANSE_W767N_ASSET_REPAIR_FOCUS_SCHEMA = 'eon.city.expanse.asset-repair-focus.w767n.v1';

function failureCategory(record = {}) {
  const state = String(record.state || '');
  const reason = String(record.failureReason || '').toLowerCase();
  if (state === 'pending') return 'loading';
  if (reason.includes('not-found') || reason.includes('404') || reason.includes('fetch') || reason.includes('load')) return 'asset-unavailable';
  if (reason.includes('visible') || reason.includes('mesh')) return 'visible-mesh-invalid';
  if (reason.includes('material')) return 'material-invalid';
  if (reason.includes('ground')) return 'grounding-invalid';
  if (reason.includes('scale') || reason.includes('height') || reason.includes('bounds')) return 'scale-or-bounds-invalid';
  if (reason.includes('zone') || reason.includes('placement') || reason.includes('position')) return 'placement-invalid';
  if (reason.includes('disposed')) return 'disposed-during-load';
  if (record.proceduralFallbackPresented === true) return 'procedural-fallback-active';
  return reason ? 'presentation-rejected' : 'presentation-incomplete';
}

function safeRecord(record = {}, priority = 2) {
  const source = ['hero-landmark', 'npc', 'activity'].includes(record.source) ? record.source : 'authored-asset';
  const id = token(record.id || record.assetId || 'unknown-asset');
  const assetId = token(record.assetId || record.id || 'unknown-asset');
  const zoneId = token(record.zoneId || 'unknown-zone');
  const category = failureCategory(record);
  const sourceLabel = source === 'hero-landmark' ? 'Hero landmark' : source === 'npc' ? 'NPC' : source === 'activity' ? 'Activity' : 'Authored asset';
  return freeze({
    id: `${source}:${id}:${zoneId}`,
    priority,
    source,
    sourceLabel,
    assetId,
    zoneId,
    zoneLabel: words(zoneId) || 'Unknown zone',
    label: `${sourceLabel}: ${words(assetId || id) || 'Unknown asset'}`,
    category,
    categoryLabel: words(category),
    state: token(record.state || 'repair-required'),
    proceduralFallbackPresented: record.proceduralFallbackPresented === true,
    storesPrivateContent: false
  });
}

export function buildEonExpanseW767NAssetRepairFocus(report = {}, { maxItems = 5 } = {}) {
  const safeMaxItems = Math.max(1, Math.min(8, Number(maxItems || 5)));
  const records = list(report.records);
  const missingZoneIds = [...new Set(list(report.missingZoneIds).map((value) => token(value)).filter(Boolean))];
  const candidates = [];

  for (const zoneId of missingZoneIds) {candidates.push(freeze({
    id: `hero-landmark:missing:${zoneId}`,
    priority: 0,
    source: 'hero-landmark',
    sourceLabel: 'Hero landmark',
    assetId: '',
    zoneId,
    zoneLabel: words(zoneId),
    label: `Missing hero landmark: ${words(zoneId)}`,
    category: 'zone-landmark-missing',
    categoryLabel: 'zone landmark missing',
    state: 'missing',
    proceduralFallbackPresented: true,
    storesPrivateContent: false
  }));}

  for (const record of records) {
    const requiresRepair = Boolean(record.failureReason)
      || record.proceduralFallbackPresented === true
      || record.state === 'fallback-presented'
      || record.state === 'pending';
    if (!requiresRepair) continue;
    const priority = record.state === 'pending' ? 3 : record.source === 'hero-landmark' ? 1 : 2;
    candidates.push(safeRecord(record, priority));
  }

  const deduped = new Map();
  for (const item of candidates) {
    const key = `${item.source}:${item.assetId || 'missing'}:${item.zoneId}:${item.category}`;
    if (!deduped.has(key) || item.priority < deduped.get(key).priority) deduped.set(key, item);
  }
  const ranked = [...deduped.values()].sort((a, b) => a.priority - b.priority || a.zoneId.localeCompare(b.zoneId) || a.label.localeCompare(b.label));
  const items = freeze(ranked.slice(0, safeMaxItems).map(({ priority: _priority, ...item }) => freeze(item)));
  const affectedZoneIds = freeze([...new Set(ranked.map((item) => item.zoneId).filter((zoneId) => zoneId && zoneId !== 'unknown-zone'))]);
  const status = String(report.status || 'unavailable');
  const visible = report.releaseReady !== true && status === 'repair-required';
  const totals = report.totals || {};

  return freeze({
    schema: EON_EXPANSE_W767N_ASSET_REPAIR_FOCUS_SCHEMA,
    visible,
    status,
    releaseReady: report.releaseReady === true,
    affectedZoneCount: affectedZoneIds.length,
    affectedZoneIds,
    items,
    moreCount: Math.max(0, ranked.length - items.length),
    rejectedCount: Math.max(0, Number(totals.rejected || 0)),
    proceduralFallbackCount: Math.max(0, Number(totals.proceduralFallback || 0)),
    pendingCount: Math.max(0, Number(totals.pending || 0)),
    browserEvidenceStillRequired: report?.truthBoundary?.browserEvidenceStillRequired !== false,
    exposesRequestedPaths: false,
    storesPrivateContent: false
  });
}
