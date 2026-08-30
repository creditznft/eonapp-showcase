import { installPublicTrustConfig } from './trust/eon-trust-public-page.js';

const LABELS = { operational: 'Operational', degraded: 'Degraded', major_outage: 'Major outage', maintenance: 'Maintenance', unknown: 'Status unavailable' };
function formatTime(value) {
  const date = new Date(Number(value || 0));
  return Number.isFinite(date.getTime()) && date.getTime() > 0 ? date.toLocaleString() : 'Not reported';
}
function renderStatus(payload = {}) {
  const overall = document.querySelector('[data-status-overall]');
  const note = document.querySelector('[data-status-note]');
  const components = document.querySelector('[data-status-components]');
  const incidents = document.querySelector('[data-status-incidents]');
  if (overall) { overall.textContent = LABELS[payload.overall] || LABELS.unknown; overall.dataset.state = payload.overall || 'unknown'; }
  if (note) {note.textContent = payload.configured
    ? `Public status generated ${formatTime(payload.generatedAt)}. Updates contain no prompts, credentials or private case content.`
    : 'The public status service is not configured for this deployment. This is not an all-clear signal.';}
  if (components) {
    components.replaceChildren(...(payload.components || []).map((row) => {
      const article = document.createElement('article');
      article.className = 'eon-hub-card';
      article.innerHTML = `<p class="eon-hub-kicker">${LABELS[row.status] || row.status}</p><h2></h2><p></p><small></small>`;
      article.querySelector('h2').textContent = row.label;
      article.querySelector('p').textContent = row.note || 'No public note.';
      article.querySelector('small').textContent = `Updated ${formatTime(row.updatedAt)}`;
      return article;
    }));
    if (!(payload.components || []).length) components.textContent = 'No component status is configured.';
  }
  if (incidents) {
    incidents.replaceChildren(...(payload.incidents || []).map((row) => {
      const article = document.createElement('article');
      article.className = 'eon-hub-card';
      article.innerHTML = '<p class="eon-hub-kicker"></p><h2></h2><p></p><small></small>';
      article.querySelector('.eon-hub-kicker').textContent = `${row.severity} · ${row.status}`;
      article.querySelector('h2').textContent = row.title;
      article.querySelector('p').textContent = row.summary;
      article.querySelector('small').textContent = `Started ${formatTime(row.startedAt)} · Updated ${formatTime(row.updatedAt)}`;
      return article;
    }));
    if (!(payload.incidents || []).length) incidents.textContent = payload.configured ? 'No active or recently resolved public incidents.' : 'Incident history is unavailable.';
  }
}
async function init() {
  installPublicTrustConfig();
  try {
    const response = await fetch('/api/status/current', { cache: 'no-store', credentials: 'same-origin', headers: { accept: 'application/json' } });
    renderStatus(await response.json());
  } catch { renderStatus({ configured: false, overall: 'unknown', components: [], incidents: [] }); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
