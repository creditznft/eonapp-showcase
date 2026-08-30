import { EON_CITY_W750_VIEW_EVENT } from '../../contracts/city/eon-city-view-events.js';
import { recordEonCoreOutcome } from '../../contracts/outcomes/eon-core-outcome-authority.js';

const freeze = (value) => Object.freeze(value);
const escapeText = (value = '') => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function viewFromInvocation(invocation = {}) {
  return invocation?.context?.commandCentreView || null;
}

function stateClass(value = '') {
  const state = String(value || 'empty');
  if (state === 'error') return 'is-error';
  if (state === 'warning') return 'is-warning';
  if (state === 'active') return 'is-active';
  return 'is-empty';
}

function formatProgress(job = {}) {
  if (job.authoritativeProgress !== true || !Number.isFinite(Number(job.progress))) return '';
  return `<span>${Math.max(0, Math.min(100, Number(job.progress)))}% authoritative</span>`;
}

function renderCards(cards = []) {
  if (!cards.length) return '<p class="eon-command-centre-empty">No bounded status card is available.</p>';
  return `<div class="eon-command-centre-cards">${cards.map((entry) => `<article data-state="${escapeText(entry.state || 'empty')}">
    <div><small>${escapeText(entry.authority || 'bounded authority')}</small><strong>${escapeText(entry.label || entry.id || 'Status')}</strong></div>
    <span class="eon-command-centre-count">${Number(entry.count || 0)}</span>
    <p>${escapeText(entry.summary || 'No bounded detail is available.')}</p>
    <footer><span>${escapeText(entry.state || 'empty')}</span><span>${escapeText(entry.freshness?.label || entry.source || 'Source unavailable')}</span></footer>
  </article>`).join('')}</div>`;
}

function renderJobs(jobs = [], selectedJobId = '') {
  if (!jobs.length) return '<section class="eon-command-centre-theatre-empty"><span aria-hidden="true">◇</span><strong>The stage is still</strong><p>No genuine job receipt is present. Start useful work in EONBOT, Create / Forge or Automations; real job status appears here only when a maintained surface records it.</p></section>';
  return `<div class="eon-command-centre-jobs">${jobs.map((job) => `<button type="button" data-eon-command-job="${escapeText(job.jobId)}" class="${job.jobId === selectedJobId ? 'is-selected' : ''}">
    <span><strong>${escapeText(job.jobType || 'Job')}</strong><small>${escapeText(job.sourceSurface || 'unknown')} · ${escapeText(job.railLabel || 'Unavailable')}</small></span>
    <span><b>${escapeText(job.state || 'queued')}</b>${formatProgress(job)}</span>
  </button>`).join('')}</div>`;
}

function wallActions(wall = {}) {
  if (wall.id === 'work') return `<button type="button" data-eon-command-open="projects">Open Projects</button><button type="button" data-eon-command-open="nexus" data-eon-command-ring="task">Inspect task ring</button>`;
  if (wall.id === 'review') return `<button type="button" data-eon-command-open="automations">Review approvals</button><button type="button" data-eon-command-open="nexus" data-eon-command-ring="results">Inspect result ring</button>`;
  if (wall.id === 'systems') return `<button type="button" data-eon-command-open="local-ai">Provider readiness</button><button type="button" data-eon-command-open="plans">Billing status</button><button type="button" data-eon-command-open="library">Vault / recovery</button>`;
  if (wall.id === 'atlas-transit') return `<button type="button" data-eon-command-guide="project-atlas">Guide to Project Atlas</button><button type="button" data-eon-command-guide="share-capture">Guide to Transit / Share</button><button type="button" data-eon-command-open="nexus" data-eon-command-ring="project">Inspect work object</button>`;
  return `<button type="button" data-eon-command-open="chat">Ask EONBOT</button><button type="button" data-eon-command-open="create">Open Create / Forge</button><button type="button" data-eon-command-open="automations">Open Automations</button><button type="button" data-eon-command-refresh>Refresh receipts</button>`;
}

function render(root, view = {}, selectedWallId = '', explicitlyReviewedWallId = '', recordedWallId = '') {
  const walls = Array.isArray(view?.walls) ? view.walls : [];
  const selected = walls.find((entry) => entry.id === selectedWallId) || walls.find((entry) => entry.id === view?.selectedWallId) || walls[0] || null;
  root.innerHTML = `<section class="eon-command-centre-dock" data-eon-command-centre-dock data-selected-wall="${escapeText(selected?.id || '')}">
    <header class="eon-command-centre-hero">
      <div><small>One Nexus · five truthful walls</small><h2>${escapeText(view?.title || 'Living Command Centre')}</h2><p>${escapeText(view?.summary || 'Review real bounded state before opening maintained work.')}</p></div>
      <aside><strong>${escapeText(view?.nexusState || 'ready')}</strong><span>${escapeText(view?.nexusFreshness?.label || 'Freshness unavailable')}</span></aside>
    </header>
    <nav class="eon-command-centre-wall-tabs" aria-label="Command Centre walls">
      ${walls.map((wall) => `<button type="button" class="${stateClass(wall.state)}" data-eon-command-wall="${escapeText(wall.id)}" aria-pressed="${wall.id === selected?.id ? 'true' : 'false'}"><span>${escapeText(wall.shortLabel)}</span><strong>${Number(wall.count || 0)}</strong><small>${escapeText(wall.state)}</small></button>`).join('')}
    </nav>
    <article class="eon-command-centre-inspector ${stateClass(selected?.state)}">
      <header><div><small>${escapeText(selected?.purpose || '')}</small><h3>${escapeText(selected?.label || 'Command wall')}</h3><p>${escapeText(selected?.headline || '')}</p></div><span>${Number(selected?.count || 0)}</span></header>
      <p class="eon-command-centre-detail">${escapeText(selected?.detail || 'No bounded detail is available.')}</p>
      ${selected?.id === 'agent-theatre' ? renderJobs(selected.jobs || [], selected.selectedJobId || '') : renderCards(selected?.cards || [])}
      <div class="eon-command-centre-actions">${wallActions(selected || {})}${selected ? `<button type="button" data-eon-command-record-review${explicitlyReviewedWallId === selected.id ? '' : ' disabled'}>${recordedWallId === selected.id ? 'Status review recorded' : explicitlyReviewedWallId === selected.id ? 'Record this status review' : 'Select this wall to review'}</button>` : ''}</div>
      <footer><strong>Truth boundary</strong><span>${escapeText(selected?.truthBoundary || 'No private content or automatic work is exposed in City.')}</span></footer>
    </article>
    <footer class="eon-command-centre-footer"><span>Raw prompts, outputs, files, keys, payment records and account identifiers remain outside City.</span><button type="button" data-eon-command-refresh>Refresh bounded state</button></footer>
  </section>`;
}

export async function mountEonWorkSurface({ root, environment = globalThis, invocation = {}, open, close } = {}) {
  let disposed = false;
  let currentView = viewFromInvocation(invocation) || {};
  let selectedWallId = String(invocation?.context?.commandWallId || (invocation.id === 'agent-theatre' ? 'agent-theatre' : currentView?.selectedWallId || ''));
  let explicitlyReviewedWallId = '';
  let recordedWallId = '';
  render(root, currentView, selectedWallId, explicitlyReviewedWallId, recordedWallId);

  const openSurface = (id = '', trigger = null, ringId = '') => open?.({
    id,
    source: 'eon-city-command-centre',
    explicitUserAction: true,
    presentationMode: invocation.presentationMode || 'dock',
    sessionId: invocation.sessionId,
    trigger,
    context: freeze({
      ...(invocation.context || {}),
      commandWallId: selectedWallId,
      nexusRingId: ringId,
      returnToCommandCentreDock: true,
      cityPresentation: true,
      allowFocusWorkspace: true
    })
  }, trigger);

  const onClick = (event) => {
    const wallButton = event.target.closest?.('[data-eon-command-wall]');
    if (wallButton) {
      selectedWallId = String(wallButton.dataset.eonCommandWall || '');
      explicitlyReviewedWallId = selectedWallId;
      recordedWallId = '';
      environment.EON_CITY_COMMAND_HUB_RUNTIME?.inspectCommandCentreWall?.(selectedWallId, { explicitUserAction: true });
      render(root, currentView, selectedWallId, explicitlyReviewedWallId, recordedWallId);
      return;
    }
    const recordReviewButton = event.target.closest?.('[data-eon-command-record-review]');
    if (recordReviewButton) {
      const selected = (Array.isArray(currentView?.walls) ? currentView.walls : []).find((entry) => entry.id === selectedWallId) || null;
      if (!selected || explicitlyReviewedWallId !== selected.id) return;
      const result = recordEonCoreOutcome({
        kind: 'command-status-reviewed',
        route: '/eoncity',
        source: 'command-centre-local-review',
        receiptId: `command-status-reviewed:${selected.id}:${Date.now()}`,
        verified: true
      }, { storage: environment.localStorage, environment });
      if (result.ok) {
        recordedWallId = selected.id;
        render(root, currentView, selectedWallId, explicitlyReviewedWallId, recordedWallId);
      }
      return;
    }
    const openButton = event.target.closest?.('[data-eon-command-open]');
    if (openButton) {
      void openSurface(String(openButton.dataset.eonCommandOpen || 'chat'), openButton, String(openButton.dataset.eonCommandRing || ''));
      return;
    }
    const guideButton = event.target.closest?.('[data-eon-command-guide]');
    if (guideButton) {
      const stationId = String(guideButton.dataset.eonCommandGuide || '');
      close?.({ restoreFocus: false });
      const guide = () => environment.EON_CITY_COMMAND_HUB_RUNTIME?.guideToStation?.(stationId, { explicitUserAction: true });
      if (typeof environment.requestAnimationFrame === 'function') environment.requestAnimationFrame(guide); else guide();
      return;
    }
    const jobButton = event.target.closest?.('[data-eon-command-job]');
    if (jobButton) {
      environment.EON_CITY_COMMAND_HUB_RUNTIME?.reviewAgentTheatreJob?.(String(jobButton.dataset.eonCommandJob || ''), { explicitUserAction: true });
      return;
    }
    if (event.target.closest?.('[data-eon-command-refresh]')) {
      void environment.EON_CITY_COMMAND_HUB_RUNTIME?.refreshCommandCentre?.({ explicitUserAction: true, includeServerBilling: true });
    }
  };

  const onView = (event) => {
    const next = event?.detail?.view;
    if (!next || disposed) return;
    currentView = next;
    render(root, currentView, selectedWallId, explicitlyReviewedWallId, recordedWallId);
  };

  root.addEventListener('click', onClick);
  environment.addEventListener?.(EON_CITY_W750_VIEW_EVENT, onView);
  return freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeEventListener('click', onClick);
      environment.removeEventListener?.(EON_CITY_W750_VIEW_EVENT, onView);
    }
  });
}

export default mountEonWorkSurface;
