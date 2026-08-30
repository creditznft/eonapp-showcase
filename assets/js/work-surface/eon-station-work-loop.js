import { EON_CITY_W751_VIEW_EVENT } from '../contracts/city/eon-city-view-events.js';

const freeze = (value) => Object.freeze(value);
const escapeText = (value = '') => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function stateLabel(state = 'ready') {
  if (state === 'verified') return 'Verified';
  if (state === 'active') return 'Native work active';
  if (state === 'failed') return 'Proof unavailable';
  if (state === 'cancelled') return 'Cancelled';
  if (state === 'returned') return 'Returned';
  if (state === 'opened') return 'Workspace opened';
  if (state === 'reviewed') return 'Reviewed';
  return 'Ready';
}

export function renderEonCityW751StationWorkLoop(view = {}) {
  const steps = Array.isArray(view?.steps) ? view.steps : [];
  if (!view?.stationId || steps.length !== 3) return '';
  return `<section class="eon-station-work-loop" data-eon-station-work-loop="${escapeText(view.stationId)}" data-state="${escapeText(view.state || 'ready')}" data-accent="${escapeText(view.accent || 'nexus')}">
    <header><div><small>W751 · real station work loop</small><h2>${escapeText(view.title)}</h2><p>${escapeText(view.outcome)}</p></div><span>${escapeText(stateLabel(view.state))}</span></header>
    <ol>${steps.map((step) => `<li data-state="${escapeText(step.state || 'upcoming')}"><span>${Number(step.order || 0)}</span><div><strong>${escapeText(step.label)}</strong><small>${escapeText(step.detail)}</small></div></li>`).join('')}</ol>
    <footer><div><strong>Completion authority</strong><span>${escapeText(view.completionAuthority)}</span></div><div class="eon-station-work-loop-actions"><button type="button" data-eon-station-loop-review="${escapeText(view.stationId)}">Review loop</button><button type="button" data-eon-station-loop-refresh>Check real proof</button>${view.proofHref ? `<a href="${escapeText(view.proofHref)}">${escapeText(view.proofLabel || 'Open maintained page')}</a>` : ''}</div></footer>
    <p class="eon-station-work-loop-status" aria-live="polite">${escapeText(view.status || 'Ready for review.')}</p>
  </section>`;
}

export function mountEonCityW751StationWorkLoop({ root, environment = globalThis, invocation = {} } = {}) {
  if (!root) return freeze({ dispose() {} });
  const stationId = String(invocation?.context?.stationId || invocation?.context?.stationWorkLoop?.stationId || '');
  let current = environment.EON_CITY_COMMAND_HUB_RUNTIME?.getProductiveStationLoop?.(stationId) || invocation?.context?.stationWorkLoop || null;
  let disposed = false;
  const render = () => {
    if (!current || current.stationId !== stationId) {
      root.hidden = true;
      root.replaceChildren?.();
      return;
    }
    root.hidden = false;
    root.innerHTML = renderEonCityW751StationWorkLoop(current);
  };
  const onClick = (event) => {
    const review = event.target.closest?.('[data-eon-station-loop-review]');
    if (review) {
      environment.EON_CITY_COMMAND_HUB_RUNTIME?.reviewProductiveStation?.(String(review.dataset.eonStationLoopReview || stationId), { explicitUserAction: true });
      return;
    }
    if (event.target.closest?.('[data-eon-station-loop-refresh]')) environment.EON_CITY_COMMAND_HUB_RUNTIME?.refreshProductiveStations?.('dock-explicit-refresh', { explicitUserAction: true });
  };
  const onView = (event) => {
    if (disposed) return;
    const stations = Array.isArray(event?.detail?.view?.stations) ? event.detail.view.stations : [];
    const next = stations.find((entry) => entry.stationId === stationId);
    if (!next) return;
    current = next;
    render();
  };
  render();
  root.addEventListener?.('click', onClick);
  environment.addEventListener?.(EON_CITY_W751_VIEW_EVENT, onView);
  return freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeEventListener?.('click', onClick);
      environment.removeEventListener?.(EON_CITY_W751_VIEW_EVENT, onView);
    }
  });
}

export default mountEonCityW751StationWorkLoop;
