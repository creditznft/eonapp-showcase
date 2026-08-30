import { dismissEonContinue, isEonContinueDismissed, resolveEonContinueCandidate } from './eon-continue-resolver.js';
import { recordEonRetentionEvent } from './eon-retention-telemetry.js';
const escape = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
function ensureStyles(doc) {
  if (doc.querySelector('link[data-eon-continue-styles]')) return;
  const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = '/assets/css/eon-continue.css'; link.dataset.eonContinueStyles = '1'; doc.head.appendChild(link);
}
export function installEonContinueSurface({ document: doc = globalThis.document, localStorage = globalThis.localStorage, sessionStorage = globalThis.sessionStorage, now = Date.now() } = {}) {
  const main = doc?.querySelector?.('main');
  const pageType = String(doc?.body?.dataset?.eonAppPage || doc?.body?.dataset?.pageType || '').toLowerCase();
  if (pageType === 'projects') return Object.freeze({ installed: false, reason: 'projects-own-command-workspace' });
  if (!main) return Object.freeze({ installed: false, reason: 'main-unavailable' });
  if (doc.querySelector('[data-eon-w630-project-strip]')) return Object.freeze({ installed: false, reason: 'active-project-strip-owns-continuity' });
  if (doc.querySelector('[data-eon-continue]') || doc.querySelector('[data-eon-w631-panel]') || isEonContinueDismissed(localStorage, now)) return Object.freeze({ installed: false, reason: 'continuity-surface-unavailable' });
  const item = resolveEonContinueCandidate({ localStorage, sessionStorage, now });
  if (!item) return Object.freeze({ installed: false });
  ensureStyles(doc);
  const section = doc.createElement('section'); section.className = 'eon-continue-card'; section.dataset.eonContinue = item.type; section.dataset.eonContinueDestination = item.destinationId || '';
  section.setAttribute('aria-label', 'Continue your local work');
  section.innerHTML = `<div><span>Continue</span><strong>${escape(item.label)}</strong><small>${escape(item.detail)}</small></div><div class="eon-continue-actions"><a href="${escape(item.href)}">Open</a><button type="button" aria-label="Hide Continue for seven days">Not now</button></div>`;
  main.prepend(section); recordEonRetentionEvent('shown', item.type, { storage: localStorage, now });
  section.querySelector('a')?.addEventListener('click', () => recordEonRetentionEvent('opened', item.type, { storage: localStorage }));
  section.querySelector('button')?.addEventListener('click', () => { dismissEonContinue(localStorage); recordEonRetentionEvent('dismissed', item.type, { storage: localStorage }); section.remove(); });
  return Object.freeze({ installed: true, item });
}
