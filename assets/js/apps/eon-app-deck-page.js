import {
  createEonAppDeckLaunchIntent,
  getEonAppDeckCard,
  getEonAppDeckTruth,
  listEonAppDeckCards,
  listEonAppDeckCategories
} from './eon-app-deck-catalog.js';
import { listEonActionClasses } from '../automation/eon-action-taxonomy.js';
import { bindCityModeLinkTracking, enterCityMode } from '../city/city-mode-transition.js';
import { getIdentityAccountHref } from '../account/eon-identity-onboarding.js';

const root = document.getElementById('eon-app-deck-root');
const ui = {
  category: 'workrooms',
  selectedId: 'launch-room',
  status: 'Choose an outcome, a role, a future connection boundary, or a reviewable Blueprint.'
};

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function setChatPrefill(prompt = '') {
  try { localStorage.setItem('eon:chat:prefill:v1', String(prompt || '').trim()); } catch {}
}

function openChatForCard(card) {
  if (!card?.chatPrompt) return;
  createEonAppDeckLaunchIntent({ category: card.category, itemId: card.id });
  setChatPrefill(card.chatPrompt);
  window.location.assign('/chat?new=1');
}

function useBlueprint(card) {
  if (!card?.automationGoal) return;
  const result = createEonAppDeckLaunchIntent({ category: 'blueprints', itemId: card.id });
  if (!result.ok) {
    ui.status = 'This Blueprint could not be prepared. Nothing was saved or run.';
    render();
    return;
  }
  window.location.assign(`/automations?blueprint=${encodeURIComponent(card.id)}`);
}

function openInsightsDesk(card) {
  if (!card?.route || card.category !== 'insights') return;
  const result = createEonAppDeckLaunchIntent({ category: 'insights', itemId: card.id });
  if (!result.ok) {
    ui.status = 'This research desk could not be opened. No data was changed.';
    render();
    return;
  }
  window.location.assign(card.route);
}

function selectCard(category, id) {
  ui.category = category;
  ui.selectedId = id;
  ui.status = 'Selection is local to this browser. It does not connect an account or start work.';
  render();
}

function renderCategoryTabs(categories) {
  return `<nav class="eon-app-deck-tabs" aria-label="App Deck categories">${categories.map((category) => `<button type="button" class="eon-app-deck-tab${category.id === ui.category ? ' is-active' : ''}" data-app-deck-category="${escapeHtml(category.id)}" aria-pressed="${String(category.id === ui.category)}"><span>${escapeHtml(category.label)}</span><small>${category.count}</small></button>`).join('')}</nav>`;
}

function renderCard(card) {
  const selected = card.id === ui.selectedId;
  const tags = card.actionClasses?.length ? card.actionClasses.map((action) => `<span>${escapeHtml(action)}</span>`).join('') : '<span>local guidance</span>';
  const action = card.category === 'blueprints' ? 'Prepare Blueprint' : card.category === 'insights' ? 'Open local desk' : card.category === 'connections' ? 'Review boundary' : card.category === 'crew' ? 'Ask this role' : 'Open Workroom';
  return `<article class="eon-app-deck-card${selected ? ' is-selected' : ''}" data-app-deck-card="${escapeHtml(card.id)}"><div class="eon-app-deck-card-icon" aria-hidden="true">${escapeHtml(card.icon || '◇')}</div><div class="eon-app-deck-card-copy"><p>${escapeHtml(card.cityDistrict || card.service || card.category)}</p><h3>${escapeHtml(card.label)}</h3><span>${escapeHtml(card.summary)}</span></div><div class="eon-app-deck-card-footer"><div class="eon-app-deck-action-tags">${tags}</div><button type="button" data-app-deck-open="${escapeHtml(card.id)}">${action}</button></div></article>`;
}

function renderDetail(card) {
  if (!card) return '<aside class="eon-app-deck-detail"><p>Select a card to inspect its purpose and boundary.</p></aside>';
  const actionLabels = (card.actionClasses || []).map((id) => escapeHtml(id)).join(' · ') || 'local guidance only';
  let actionMarkup = '';
  if (card.category === 'blueprints') actionMarkup = `<button type="button" class="eon-app-deck-primary" data-app-deck-use-blueprint="${escapeHtml(card.id)}">Prepare in Automations</button>`;
  else if (card.category === 'insights') actionMarkup = `<button type="button" class="eon-app-deck-primary" data-app-deck-open-insights="${escapeHtml(card.id)}">Open local desk</button>`;
  else if (card.category === 'workrooms' || card.category === 'crew') actionMarkup = `<button type="button" class="eon-app-deck-primary" data-app-deck-open-chat="${escapeHtml(card.id)}">Open in EONBOT Chat</button>`;
  else actionMarkup = `<a class="eon-app-deck-primary" href="/automations">See automation boundary</a>`;
  const connectionStatus = card.category === 'connections'
    ? 'Not connected · planned only'
    : card.category === 'insights'
      ? 'Manual or user-owned local data only'
      : 'No connection required for this local entry';
  const detailNote = card.category === 'connections'
    ? 'This card explains a future permission boundary. It does not request OAuth, access an account, or store a credential.'
    : card.category === 'insights'
      ? 'This opens a local research desk. It does not load a live feed, give personalised investment advice, create an order, or open a prediction market.'
      : 'Opening a card creates a local handoff only. Nothing is sent, scheduled, published, purchased, or run in the background.';
  return `<aside class="eon-app-deck-detail" aria-live="polite"><p class="eon-app-deck-eyebrow">${escapeHtml(card.category)}</p><h2>${escapeHtml(card.label)}</h2><p>${escapeHtml(card.outcome)}</p><dl><div><dt>Action classes</dt><dd>${actionLabels}</dd></div><div><dt>Connection status</dt><dd>${connectionStatus}</dd></div><div><dt>External execution</dt><dd>Not active</dd></div></dl>${actionMarkup}<p class="eon-app-deck-detail-note">${detailNote}</p></aside>`;
}

function renderTaxonomy() {
  return `<section class="eon-app-deck-taxonomy" aria-labelledby="eon-app-deck-taxonomy-title"><div><p class="eon-app-deck-eyebrow">Automation safety language</p><h2 id="eon-app-deck-taxonomy-title">Every future action is classified before it can be connected.</h2><p>Current Automations only plan and simulate. These labels prevent a draft, write, publish, spend or delete action from being disguised as harmless AI help.</p></div><div class="eon-app-deck-taxonomy-grid">${listEonActionClasses().map((action) => `<article><strong>${escapeHtml(action.label)}</strong><span>${escapeHtml(action.currentRuntime.replace(/-/g, ' '))}</span></article>`).join('')}</div></section>`;
}

function render() {
  if (!root) return;
  const categories = listEonAppDeckCategories();
  const cards = listEonAppDeckCards(ui.category);
  if (!cards.some((card) => card.id === ui.selectedId)) ui.selectedId = cards[0]?.id || '';
  const selected = getEonAppDeckCard(ui.category, ui.selectedId);
  const truth = getEonAppDeckTruth();
  root.innerHTML = `<section class="eon-app-deck" aria-labelledby="eon-app-deck-title"><header class="eon-app-deck-hero"><div><p class="eon-app-deck-eyebrow">EON App Deck · outcome-first local workspace</p><h1 id="eon-app-deck-title">Choose what you want to achieve.</h1><p>Workrooms make outcomes clearer. Blueprints turn repeat work into a reviewable local plan. Insights &amp; Forecasts keeps research, business questions and private forecasts inside Apps. AI Crew makes roles visible, while Connections explains future permissions.</p></div><div class="eon-app-deck-hero-actions"><a href="/eoncity" class="eon-app-deck-secondary">Enter EON City</a><a href="${getIdentityAccountHref('/apps')}" class="eon-app-deck-secondary">Account &amp; backup</a><a href="/automations" class="eon-app-deck-primary">Open Automations</a></div></header>${renderCategoryTabs(categories)}<div class="eon-app-deck-layout"><section class="eon-app-deck-catalog" aria-label="${escapeHtml(ui.category)} catalog">${cards.map(renderCard).join('')}</section>${renderDetail(selected)}</div>${renderTaxonomy()}<footer class="eon-app-deck-truth" aria-live="polite"><strong>Local App Deck status</strong><span>${escapeHtml(ui.status)}</span><small>${escapeHtml(truth.currentScope)}. Optional Google Login is account access only; create an encrypted local backup for work you cannot lose.</small></footer></section>`;
  bind();
}

function bind() {
  root?.querySelectorAll('[data-app-deck-category]').forEach((button) => button.addEventListener('click', () => {
    const category = String(button.dataset.appDeckCategory || '');
    const first = listEonAppDeckCards(category)[0];
    ui.category = category;
    ui.selectedId = first?.id || '';
    ui.status = 'Category changed locally. No connection or AI request started.';
    render();
  }));
  root?.querySelectorAll('[data-app-deck-card]').forEach((card) => card.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    selectCard(ui.category, card.dataset.appDeckCard || '');
  }));
  root?.querySelectorAll('[data-app-deck-open]').forEach((button) => button.addEventListener('click', () => {
    const card = getEonAppDeckCard(ui.category, button.dataset.appDeckOpen || '');
    if (!card) return;
    if (card.category === 'blueprints') useBlueprint(card);
    else if (card.category === 'insights') openInsightsDesk(card);
    else if (card.category === 'connections') { ui.selectedId = card.id; ui.status = 'This connection is planned only. Review its action boundary before any future connection phase.'; render(); }
    else openChatForCard(card);
  }));
  root?.querySelectorAll('[data-app-deck-open-chat]').forEach((button) => button.addEventListener('click', () => openChatForCard(getEonAppDeckCard(ui.category, button.dataset.appDeckOpenChat || ''))));
  root?.querySelectorAll('[data-app-deck-use-blueprint]').forEach((button) => button.addEventListener('click', () => useBlueprint(getEonAppDeckCard('blueprints', button.dataset.appDeckUseBlueprint || ''))));
  root?.querySelectorAll('[data-app-deck-open-insights]').forEach((button) => button.addEventListener('click', () => openInsightsDesk(getEonAppDeckCard('insights', button.dataset.appDeckOpenInsights || ''))));
}

function initAppDeck() {
  enterCityMode('apps', { entry: 'apps' });
  bindCityModeLinkTracking(root || document, 'apps', { entry: 'apps' });
  render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAppDeck, { once: true });
else initAppDeck();
