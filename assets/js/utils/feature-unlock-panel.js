/**
 * W228 access-status compatibility adapter.
 * No ad, referral, payment, NFT, subscription, token, or campaign action can
 * unlock a feature in this release. Old panel slots render a short truth note
 * rather than a conversion funnel.
 */
import { MONETIZATION_DECISION } from './monetization-decision-gate.js';

const STYLE_HREF = new URL('../../css/feature-unlocks.css?no-inline', import.meta.url).href;

function esc(value = '') {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
}
function normalizeFeatureId(value = 'available') {
  return String(value || 'available').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 80) || 'available';
}

export function ensureFeatureUnlockStyles() {
  if (document.querySelector('link[data-feature-unlocks="1"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.featureUnlocks = '1';
  document.head.appendChild(link);
}

export function getFeatureUnlockBalance() {
  return Object.freeze({ campaignActive: false, status: 'no-active-program', updatedAt: 0 });
}
export function saveFeatureUnlockBalance(_next = {}) { return getFeatureUnlockBalance(); }
export function addProviderValueCredits(_receipt = {}) { return Object.freeze({ ok: false, reason: 'no_active_program', balance: getFeatureUnlockBalance() }); }
export function addSocialPerformanceCredits(_options = {}) { return Object.freeze({ ok: false, reason: 'no_active_program', balance: getFeatureUnlockBalance() }); }
export function claimTemporaryFeatureUnlock(featureId = 'available', _method = 'none') {
  return Object.freeze({ ok: false, featureId: normalizeFeatureId(featureId), reason: 'no_active_program', decision: MONETIZATION_DECISION });
}

export function getFeatureAccessStatus(featureId = 'available') {
  return Object.freeze({
    ok: true,
    featureId: normalizeFeatureId(featureId),
    access: 'available-no-program',
    monetizationEnabled: false,
    decision: MONETIZATION_DECISION
  });
}

export function buildFeatureUnlockPanelModel(featureId = 'available') {
  const normalized = normalizeFeatureId(featureId);
  return Object.freeze({
    menu: Object.freeze({ featureId: normalized, featureLabel: normalized.replace(/_/g, ' ') }),
    balance: getFeatureUnlockBalance(),
    accessStatus: getFeatureAccessStatus(normalized),
    decision: MONETIZATION_DECISION
  });
}

export function renderFeatureUnlockPanel(root, options = {}) {
  if (!root) return null;
  ensureFeatureUnlockStyles();
  const model = buildFeatureUnlockPanelModel(options.featureId || root.dataset.featureId || 'available');
  const title = options.title || 'Access status';
  const compact = Boolean(options.compact || root.dataset.compact === '1');
  const description = options.description || 'This release does not run unlock, reward, referral, subscription, payment or token campaigns.';
  root.innerHTML = `<section class="eon-unlock-panel${compact ? ' is-compact' : ''}" data-feature-unlock-panel="1" data-feature-id="${esc(model.menu.featureId)}" data-w228-no-program="true"><div class="eon-unlock-head"><div><span class="eon-unlock-kicker">Availability</span><h3>${esc(title)}</h3><p>${esc(description)}</p></div><span class="eon-unlock-policy">No hidden activation</span></div><div class="eon-unlock-status">Nothing in this panel changes access or creates value.</div></section>`;
  return model;
}

export function mountFeatureUnlockPanel(target, options = {}) {
  const root = typeof target === 'string' ? document.querySelector(target) : target;
  return root ? renderFeatureUnlockPanel(root, options) : null;
}
export function createFeatureUnlockPanelElement(options = {}) {
  const element = document.createElement('div');
  element.className = options.className || 'eon-feature-unlock-slot';
  element.dataset.featureId = options.featureId || 'available';
  if (options.compact) element.dataset.compact = '1';
  renderFeatureUnlockPanel(element, options);
  return element;
}

export default {
  ensureFeatureUnlockStyles,
  getFeatureUnlockBalance,
  saveFeatureUnlockBalance,
  addProviderValueCredits,
  addSocialPerformanceCredits,
  claimTemporaryFeatureUnlock,
  getFeatureAccessStatus,
  buildFeatureUnlockPanelModel,
  renderFeatureUnlockPanel,
  mountFeatureUnlockPanel,
  createFeatureUnlockPanelElement
};
