import {
  activatePrivateMarketResumeCandidate,
  getPrivateMarketDrop,
  listPrivateMarketThemes,
  readPrivateMarketResumeCandidate,
  savePrivateMarketDropItemToVault
} from './market-private-drop.js';
import { appendOperatorActivity } from '../operator/operator-activity.js';
import { formatMonthlyPlanPrice, getEonCommercialPublicSummary } from '../commerce/eon-commercial-catalog.js';
import { getEonRealmRelicPublicSummary } from '../realm-relic/eon-realm-relic-boundary.js';

const root = document.getElementById('eon-market-v2');
const realmRelicSummary = getEonRealmRelicPublicSummary();
const state = {
  drop: null,
  busy: false,
  tab: 'generate',
  revealedCount: 0,
  resume: null,
  generation: { theme: 'neon-archive', prompt: '' }
};

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function rarityClass(tier = 1) {
  const value = Number(tier || 1);
  return value >= 4 ? 'is-legendary' : value >= 3 ? 'is-epic' : value >= 2 ? 'is-rare' : 'is-common';
}

function rarityLabel(tier = 1) {
  const value = Number(tier || 1);
  return value >= 4 ? 'Legendary' : value >= 3 ? 'Epic' : value >= 2 ? 'Rare' : 'Common';
}

function prefersReducedMotion() {
  try { return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches); } catch { return false; }
}

function countLabel(count = 0) {
  return `${count} local preview${count === 1 ? '' : 's'}`;
}

function card(item, index) {
  const hidden = index >= state.revealedCount;
  return `<article class="eon-market-card${hidden ? ' is-revealing' : ''}" data-market-item="${esc(item.id)}" ${hidden ? 'aria-hidden="true" inert' : ''}>
    <div class="eon-market-art-wrap"><img loading="lazy" src="${esc(item.imageUri)}" alt="Generated local preview for ${esc(item.title)}" class="eon-market-art"><span class="eon-market-rarity ${rarityClass(item.rarityTier)}">${rarityLabel(item.rarityTier)}</span></div>
    <div class="eon-market-card-body">
      <div class="eon-market-card-meta"><span>Local Relic preview</span><span>${esc(item.edition)}</span></div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.utilityStatement)}</p>
      <div class="eon-market-traits"><span>${esc(item.collectionType || 'Private collection')}</span><span>Fingerprint stored locally</span></div>
      <div class="eon-market-card-actions"><button type="button" class="eon-market-save" data-save-preview="${esc(item.id)}">Save locally</button><button type="button" class="eon-market-detail" data-detail-preview="${esc(item.id)}">Details</button></div>
      <p class="eon-market-card-note">Generated on this device · not minted · not a purchase · no financial value. Local Relic record only.</p>
    </div>
  </article>`;
}

function emptyPanel() {
  const themes = listPrivateMarketThemes().map((theme) => `<option value="${esc(theme.id)}" ${state.generation.theme === theme.id ? 'selected' : ''}>${esc(theme.label)}</option>`).join('');
  const resume = state.resume;
  return `<section class="eon-market-empty" aria-labelledby="eon-market-create-title">
    <div class="eon-market-empty-copy"><p class="eon-market-eyebrow">Private collection studio</p><h2 id="eon-market-create-title">Create 4 original local previews</h2><p>Start empty. Choose a visual theme, optionally add a short private direction, then generate four originals in this browser. Nothing is listed, minted, sold, or published.</p></div>
    <form class="eon-market-generate-form" id="eon-market-generate-form">
      <label><span>Theme</span><select id="eon-market-theme">${themes}</select></label>
      <label><span>Optional direction</span><input id="eon-market-prompt" maxlength="140" value="${esc(state.generation.prompt)}" placeholder="Example: calm city archive" /></label>
      <button type="submit" class="eon-market-primary">Generate 4 originals</button>
      <p class="eon-market-form-note">This stays local to this browser profile. Do not put passwords, API keys, recovery phrases, or private data in the direction field.</p>
    </form>
    ${resume ? `<div class="eon-market-resume"><strong>${resume.kind === 'legacy' ? 'Earlier local collection found' : 'Local collection found'}</strong><p>It is not shown automatically. You can resume ${countLabel(resume.drop.items.length)} or generate a fresh collection.</p><button type="button" class="eon-market-secondary" data-resume-drop>Resume local collection</button></div>` : ''}
  </section>`;
}

function officialPanel() {
  const summary = getEonCommercialPublicSummary();
  const plans = summary.paidPlans.map((plan) => `${plan.label} ${formatMonthlyPlanPrice(plan)}`).join(' · ');
  return `<section class="eon-market-official" aria-live="polite" data-commerce-active="false">
    <div class="eon-market-official-card">
      <p class="eon-market-eyebrow">Clear product boundary</p>
      <h2>This studio is not a marketplace</h2>
      <p>Vault Reveals are private, browser-local visual records. They cannot be bought, sold, minted, transferred, listed, or treated as financial assets.</p>
      <p>EONAPP subscriptions are a separate productivity service using Dodo Payments hosted checkout. Current monthly plans are ${esc(plans)}, each with the canonical seven-day trial. A subscription never purchases a Reveal.</p>
      <ul class="eon-market-foundation-list"><li>No user seller marketplace.</li><li>No wallet, NFT, token, resale, commission, or payout rail.</li><li>No browser callback is accepted as payment or entitlement proof.</li></ul>
      <div class="eon-market-actions"><a class="eon-market-secondary" href="/help">Open support</a><a class="eon-market-secondary" href="/billing">Review plans &amp; billing</a></div>
    </div>
  </section>`;
}

function generationPanel(status = '') {
  const total = state.drop?.items?.length || 0;
  const allVisible = state.revealedCount >= total;
  return `<section class="eon-market-generated" aria-label="Generated local previews">
    <div class="eon-market-generation-head"><div><p class="eon-market-eyebrow">Generated locally</p><h2>${esc(state.drop.theme?.label || 'Private collection')}</h2><p>${state.drop.prompt ? `Direction: ${esc(state.drop.prompt)}` : state.drop.migration ? 'Recovered locally after your explicit resume action.' : 'No written direction was stored.'}</p></div><div class="eon-market-hero-actions"><button type="button" class="eon-market-primary" data-regenerate-drop ${state.busy ? 'disabled' : ''}>${state.busy ? 'Generating…' : 'Generate a fresh 4'}</button><button type="button" class="eon-market-secondary" data-new-collection ${state.busy ? 'disabled' : ''}>Start empty</button><a class="eon-market-secondary" href="/vault">Open Vault</a></div></div>
    <section class="eon-market-progress" aria-live="polite"><strong>${state.busy ? `Rendering ${Math.min(state.revealedCount + 1, total)} of ${total}` : allVisible ? `${countLabel(total)} ready` : `Rendering ${state.revealedCount} of ${total}`}</strong><span>${status || 'Each card has a stable local fingerprint. Saved previews remain local and do not become NFTs or market listings.'}</span></section>
    <section class="eon-market-grid" aria-label="Generated local Preview Studio items">${state.drop.items.map(card).join('')}</section>
  </section>`;
}

function render(status = '') {
  if (!root) return;
  const showingGenerate = state.tab === 'generate';
  const content = showingGenerate
    ? state.drop ? generationPanel(status) : emptyPanel()
    : officialPanel();
  root.innerHTML = `<section class="eon-market-v2-shell" aria-labelledby="eon-market-title" data-market-scope="private-preview-official-disabled">
    <aside class="eon-market-progress" aria-label="Compatibility status"><strong>Compatibility preview</strong><span>This older Vault Reveal surface is kept for existing local records. Start all new image, video, website, project, automation or guided work from <a href="/create">Create</a>.</span></aside>
    <header class="eon-market-v2-hero">
      <div><p class="eon-market-eyebrow">Existing local records · future commerce disabled</p><h1 id="eon-market-title">Vault Reveal compatibility preview</h1><p>Review or migrate earlier browser-local visual previews without treating this page as a marketplace, a general creator, or a second top-level product.</p></div>
      <div class="eon-market-hero-actions"><a class="eon-market-secondary" href="/create">Open Create</a><a class="eon-market-secondary" href="/vault">Open Vault</a></div>
    </header>
    <div class="eon-market-tabs" role="tablist" aria-label="Preview Studio sections">
      <button type="button" role="tab" aria-selected="${showingGenerate}" class="${showingGenerate ? 'is-active' : ''}" data-market-tab="generate">Private generate</button>
      <button type="button" role="tab" aria-selected="${!showingGenerate}" class="${!showingGenerate ? 'is-active' : ''}" data-market-tab="official">Future safeguards</button>
    </div>
    ${content}
    <section class="eon-market-truth"><div><strong>${esc(realmRelicSummary.relic.label)}</strong><p>${esc(realmRelicSummary.relic.note)}</p></div><div><strong>Private generated preview</strong><p>Generated previews are local visual references. They are not NFTs, investments, public listings, payment receipts, or transferable assets.</p></div><div><strong>Saved local preview</strong><p>Save creates a browser-local Vault record with a fingerprint and origin label. It never mints, purchases, lists, or assigns financial value.</p></div><div><strong>Future catalog safeguards</strong><p>Official commerce stays disabled until its server-backed checkout, receipt, delivery, support, and legal truth are proven.</p></div></section>
    <p class="eon-market-status" id="eon-market-status" aria-live="polite"></p>
  </section>`;
  bind();
}

function runProgressiveReveal() {
  const total = state.drop?.items?.length || 0;
  if (!total) return;
  if (prefersReducedMotion()) {
    state.revealedCount = total;
    render('Local generation complete. Reduced-motion mode shows the completed collection without staged animation.');
    return;
  }
  state.revealedCount = 0;
  render('Creating local visuals one at a time…');
  const reveal = () => {
    state.revealedCount += 1;
    render(state.revealedCount >= total ? 'Local generation complete. Review, save, regenerate, or start a new empty collection.' : `Generated preview ${state.revealedCount} is ready. Rendering the next local preview…`);
    if (state.revealedCount < total) window.setTimeout(reveal, 170);
  };
  window.setTimeout(reveal, 120);
}

function generateCollection({ theme = state.generation.theme, prompt = state.generation.prompt } = {}) {
  state.generation = { theme: String(theme || 'neon-archive'), prompt: String(prompt || '').trim() };
  state.busy = true;
  render('Preparing four original local previews…');
  window.setTimeout(() => {
    state.drop = getPrivateMarketDrop({ regenerate: true, count: 4, theme: state.generation.theme, prompt: state.generation.prompt });
    state.resume = { kind: 'current', drop: state.drop };
    state.busy = false;
    appendOperatorActivity({ source: 'market', status: 'complete', title: 'Private Preview Studio collection generated', detail: 'Four user-triggered local previews are ready to review.', route: '/preview-studio', metadata: { itemCount: 4, scope: 'private-generated-preview' } });
    runProgressiveReveal();
  }, 80);
}

function generateFromForm(form) {
  const theme = String(form?.querySelector('#eon-market-theme')?.value || state.generation.theme || 'neon-archive');
  const prompt = String(form?.querySelector('#eon-market-prompt')?.value || '').trim();
  generateCollection({ theme, prompt });
}

function resumeCollection() {
  const activated = activatePrivateMarketResumeCandidate(state.resume);
  const status = root?.querySelector('#eon-market-status');
  if (!activated.ok) {
    if (status) status.textContent = 'This saved local collection could not be resumed. Your original local data was left unchanged.';
    return;
  }
  state.drop = activated.drop;
  state.resume = { kind: 'current', drop: activated.drop };
  state.generation = { theme: activated.drop.theme?.id || 'neon-archive', prompt: activated.drop.prompt || '' };
  state.revealedCount = state.drop.items.length;
  appendOperatorActivity({ source: 'market', status: 'complete', title: 'Local Preview Studio collection resumed', detail: `${countLabel(state.drop.items.length)} opened by user action.`, route: '/preview-studio', metadata: { itemCount: state.drop.items.length, scope: activated.migrated ? 'migrated-local-preview' : 'private-generated-preview' } });
  render(activated.migrated ? 'Earlier local previews were copied into the current local-only format after your explicit action. The original record remains unchanged.' : 'Your existing local collection was resumed by your action.');
}

function bind() {
  root?.querySelectorAll('[data-market-tab]').forEach((button) => button.addEventListener('click', () => {
    const next = String(button.dataset.marketTab || 'generate');
    if (next !== 'generate' && next !== 'official') return;
    state.tab = next;
    render(next === 'official' ? 'Future commerce remains intentionally disabled.' : state.drop ? 'Your local collection is ready to review.' : 'Start empty and generate only when you choose.');
  }));

  root?.querySelector('#eon-market-generate-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.busy) generateFromForm(event.currentTarget);
  });

  root?.querySelector('[data-resume-drop]')?.addEventListener('click', () => {
    if (state.resume?.drop) resumeCollection();
  });

  root?.querySelector('[data-regenerate-drop]')?.addEventListener('click', () => {
    if (!state.busy) generateCollection(state.generation);
  });

  root?.querySelector('[data-new-collection]')?.addEventListener('click', () => {
    if (state.busy) return;
    state.drop = null;
    state.revealedCount = 0;
    state.resume = readPrivateMarketResumeCandidate();
    render('Preview Studio is empty again. Existing local previews stay stored until you choose to resume them.');
  });

  root?.querySelectorAll('[data-save-preview]').forEach((button) => button.addEventListener('click', () => {
    const result = savePrivateMarketDropItemToVault(button.dataset.savePreview);
    const status = root.querySelector('#eon-market-status');
    if (!result.ok) { if (status) status.textContent = 'This local preview is not available to save. Generate or resume a collection first.'; return; }
    button.textContent = result.alreadySaved ? 'Already saved' : 'Saved locally';
    button.disabled = true;
    appendOperatorActivity({ source: 'market', status: 'complete', title: 'Generated preview saved locally', detail: result.item.title, route: '/vault', metadata: { itemId: result.item.id, scope: 'local-preview-record' } });
    if (status) status.innerHTML = `${esc(result.item.title)} was saved as a <strong>local preview record</strong> in this browser’s Vault. It was not minted, purchased, or listed.`;
  }));

  root?.querySelectorAll('[data-detail-preview]').forEach((button) => button.addEventListener('click', () => {
    const item = state.drop?.items?.find((candidate) => candidate.id === button.dataset.detailPreview);
    const status = root.querySelector('#eon-market-status');
    if (!item || !status) return;
    status.innerHTML = `<strong>${esc(item.title)}</strong> · ${esc(item.utilityStatement)} · Local fingerprint: ${esc(item.visualFingerprint).slice(0, 56)}…`;
  }));
}

function init() {
  if (!root) return;
  state.resume = readPrivateMarketResumeCandidate();
  render('Start empty. Generation happens only after your action.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
