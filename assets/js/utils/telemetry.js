/**
 * A15 I23 — privacy-safe local pipeline diagnostics.
 *
 * This compatibility surface is opt-in, browser-local and bounded. It stores
 * operational labels only; caller objects are compacted instead of spread so
 * prompts, replies, credentials, file contents and full URLs cannot enter the
 * ledger by accident.
 */
import { isLocalMeasurementEnabled } from './eon-analytics.js';
import { compactTelemetryPayload, redactTelemetryText } from './privacy-telemetry.js';

export const EON_PIPELINE_TELEMETRY_KEY = 'eon:telemetry:events:v2';
const LEGACY_EVENTS_KEY = 'eon:telemetry:events:v1';
const MAX_EVENTS = 120;

function safeStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function loadEvents(storage = safeStorage()) {
  if (!isLocalMeasurementEnabled({ storage })) return [];
  try {
    const parsed = JSON.parse(storage?.getItem(EON_PIPELINE_TELEMETRY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(-MAX_EVENTS) : [];
  } catch { return []; }
}

function saveEvents(events, storage = safeStorage()) {
  const trimmed = Array.isArray(events) ? events.slice(-MAX_EVENTS) : [];
  try { storage?.setItem(EON_PIPELINE_TELEMETRY_KEY, JSON.stringify(trimmed)); return true; }
  catch { return false; }
}

export function clearPipelineTelemetry(options = {}) {
  const storage = options.storage || safeStorage();
  try { storage?.removeItem(EON_PIPELINE_TELEMETRY_KEY); } catch {}
  try { storage?.removeItem(LEGACY_EVENTS_KEY); } catch {}
  return Object.freeze({ ok: true, storage: 'browser-local-only' });
}

export function emit(type, data = {}, options = {}) {
  if (!isLocalMeasurementEnabled({ storage: options.storage })) return null;
  const eventType = redactTelemetryText(type || 'unknown', 64).replace(/[^a-zA-Z0-9:_-]/g, '-');
  if (!eventType) return null;
  const now = Number(options.now || Date.now());
  const event = Object.freeze({
    t: now,
    day: new Date(now).toISOString().slice(0, 10),
    minuteBucket: Math.floor(now / 60000),
    type: eventType,
    data: Object.freeze(compactTelemetryPayload(data, 8)),
    containsUserContent: false,
    remoteUpload: false
  });
  const storage = options.storage || safeStorage();
  const events = loadEvents(storage);
  events.push(event);
  saveEvents(events, storage);
  return event;
}

export const telemetry = Object.freeze({
  toolStart: (tool) => emit('tool:start', { tool }),
  aiAssist: (tool, action) => emit('tool:ai_assist', { tool, action }),
  export: (tool, format) => emit('tool:export', { tool, format }),
  handoff: (fromTool, toTool) => emit('tool:handoff', { from: fromTool, to: toTool }),
  publish: (platform, status) => emit('platform:publish', { platform, status }),
  iframeBlock: (url) => emit('tool:iframe_blocked', { route: url }),
  chatMsg: (provider) => emit('chat:message', { provider })
});

const DAY_MS = 86_400_000;

/**
 * Returns aggregated stats for the last 7 days.
 * @returns {{ total: number, byType: object, byTool: object, days: object[] }}
 */
export function getDashboardData() {
  const events = loadEvents();
  const cutoff = Date.now() - 7 * DAY_MS;
  const recent = events.filter((/** @type {any} */ e) => e.t >= cutoff);

  const /** @type {any} */
byType = {};
  const /** @type {any} */
byTool = {};
  const /** @type {any} */
byDay  = {};

  for (const /** @type {any} */
e of recent) {
    (/** @type {any} */ (byType))[e.type] = ((/** @type {any} */ (byType))[e.type] || 0) + 1;

    const tool = e?.data?.tool || '';
    if (tool) {
      (/** @type {any} */ (byTool))[tool] = ((/** @type {any} */ (byTool))[tool] || 0) + 1;
    }

    // Day bucket: YYYY-MM-DD
    const day = new Date(e.t).toISOString().slice(0, 10);
    if (!((/** @type {any} */ (byDay))[day])) (/** @type {any} */ (byDay))[day] = {};
    ((/** @type {any} */ (byDay))[day])[e.type] = (((/** @type {any} */ (byDay))[day])[e.type] || 0) + 1;
  }

  // Build ordered last-7-days array
  const /** @type {any} */
days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    days.push({ date: d, events: (/** @type {any} */ (byDay))[d] || {} });
  }

  return {
    total: recent.length,
    byType,
    byTool,
    days,
  };
}

/**
 * Render a compact KPI dashboard HTML string.
 * Suitable for injection into any panel.
 * @returns {string} HTML
 */
export function renderKPIDashboard() {
  const data = getDashboardData();
  const t = data.byType;

  const /** @type {any} */
kpis = [
    { label: 'AI Assists',    value: (/** @type {any} */ (t))['tool:ai_assist'] || 0,    icon: '🤖' },
    { label: 'Exports',       value: (/** @type {any} */ (t))['tool:export'] || 0,        icon: '📤' },
    { label: 'Pipeline Runs', value: (/** @type {any} */ (t))['tool:handoff'] || 0,       icon: '🔗' },
    { label: 'Published',     value: (/** @type {any} */ (t))['platform:publish'] || 0,   icon: '🚀' },
    { label: 'Chat Messages', value: (/** @type {any} */ (t))['chat:message'] || 0,        icon: '💬' },
  ];

  const kpiHtml = kpis.map((/** @type {any} */ k) => `
    <div class="kpi-card">
      <span class="kpi-icon">${k.icon}</span>
      <span class="kpi-value">${k.value}</span>
      <span class="kpi-label">${k.label}</span>
    </div>`).join('');

  // Sparkline bars (last 7 days, total events per day)
  const allDayMax = Math.max(1, ...data.days.map((/** @type {any} */ d) => Object.values(d.events).reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0)));
  const sparkBars = data.days.map((/** @type {any} */ d) => {
    const total = Object.values(d.events).reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0);
    const pct = Math.round((total / allDayMax) * 100);
    const label = d.date.slice(5); // MM-DD
    return `<div class="spark-col" title="${label}: ${total} events">
      <div class="spark-bar" style="height:${pct}%"></div>
      <div class="spark-lbl">${label}</div>
    </div>`;
  }).join('');

  // Top tool
  const topToolEntry = Object.entries(data.byTool).sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1])[0];
  const topTool = topToolEntry ? `${topToolEntry[0]} (${topToolEntry[1]})` : '—';

  return `
<div class="kpi-dashboard">
  <div class="kpi-header">
    <span class="kpi-title">📊 Last 7 Days</span>
    <span class="kpi-subtitle">Top tool: ${topTool}</span>
  </div>
  <div class="kpi-row">${kpiHtml}</div>
  <div class="kpi-spark">
    <div class="spark-label">Daily activity</div>
    <div class="spark-bars">${sparkBars}</div>
  </div>
</div>`;
}

export const KPI_STYLES = `
<style>
.kpi-dashboard{padding:12px 16px;background:rgba(0,0,0,.3);border-radius:10px;border:1px solid rgba(255,255,255,.08);color:#e2e8f0;font-family:inherit;}
.kpi-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.kpi-title{font-weight:700;font-size:.9rem;}
.kpi-subtitle{font-size:.75rem;opacity:.6;}
.kpi-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.kpi-card{flex:1;min-width:70px;background:rgba(255,255,255,.06);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;}
.kpi-icon{font-size:1.2rem;}
.kpi-value{font-size:1.3rem;font-weight:700;color:#a78bfa;}
.kpi-label{font-size:.65rem;opacity:.7;white-space:nowrap;}
.kpi-spark{display:flex;flex-direction:column;gap:4px;}
.spark-label{font-size:.7rem;opacity:.5;margin-bottom:2px;}
.spark-bars{display:flex;align-items:flex-end;gap:3px;height:40px;}
.spark-col{display:flex;flex-direction:column;align-items:center;flex:1;}
.spark-bar{width:100%;background:rgba(167,139,250,.5);border-radius:2px 2px 0 0;min-height:2px;transition:height .3s;}
.spark-lbl{font-size:.55rem;opacity:.5;white-space:nowrap;}
@media(max-width:640px){.kpi-row{gap:5px;}.kpi-card{min-width:55px;padding:6px 7px;}.kpi-value{font-size:1.1rem;}}
</style>`;
