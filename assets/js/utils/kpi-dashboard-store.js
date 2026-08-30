const KPI_SNAPSHOTS_KEY = 'eon:kpi:snapshots:v1';

function loadSnapshots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KPI_SNAPSHOTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSnapshots(/** @type {any} */ rows) {
  try {
    localStorage.setItem(KPI_SNAPSHOTS_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
  } catch {}
}

export function appendKpiSnapshot(/** @type {any} */ snapshot = {}) {
  const rows = loadSnapshots();
  rows.unshift({
    id: `kpi-${Date.now()}`,
    retainedUsers7d: Number(snapshot.retainedUsers7d || 0),
    conversionRate: Number(snapshot.conversionRate || 0),
    ttfvMinutes: Number(snapshot.ttfvMinutes || 0),
    approvalsProcessed: Number(snapshot.approvalsProcessed || 0),
    liveTradesGuarded: Number(snapshot.liveTradesGuarded || 0),
    createdAt: new Date().toISOString()
  });
  saveSnapshots(rows.slice(0, 180));
}

export function getKpiSummary() {
  const rows = loadSnapshots();
  const latest = rows[0] || null;
  return {
    count: rows.length,
    latest,
    trend: rows.slice(0, 14)
  };
}
