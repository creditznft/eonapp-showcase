/** W388A.2 Workspace surface for local EON Remix Cards. */
import { buildEonRemixCardExport, buildEonRemixCardText, buildEonRemixShareText, createEonRemixCard, EON_REMIX_CARD_KINDS, getEonRemixCardTruth, shareEonRemixCard } from './eon-remix-card.js';
import { clearEonShareIntent, readEonShareIntent } from './eon-share-intent.js';
import { clearEonOutputShareHandoff, readEonOutputShareHandoff } from './eon-output-share-handoff.js';
import { buildEonRemixDeepLink } from './eon-remix-deep-link.js';

const session = { card: null, remixLink: '', intent: null, output: null };

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function downloadJson(payload, title = 'remix-card') {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eonapp-${String(title || 'remix-card').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'remix-card'}.json`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function cardPreview(card) {
  if (!card) return '<p class="eon-hub-empty">No Remix Card in this page session yet. Create a public-safe starter someone can adapt manually.</p>';
  const view = card.card;
  return `<article class="eon-remix-card-preview"><p class="eon-creator-engine-eyebrow">${escapeHtml(view.kind.label)} · local draft</p><h3>${escapeHtml(view.title)}</h3><dl><div><dt>Make</dt><dd>${escapeHtml(view.usefulOutcome)}</dd></div><div><dt>First remix step</dt><dd>${escapeHtml(view.firstRemixStep)}</dd></div>${view.creatorCredit ? `<div><dt>Creator credit${view.creditRequested ? ' requested' : ''}</dt><dd>${escapeHtml(view.creatorCredit)}</dd></div>` : ''}${view.publicLink ? `<div><dt>Public link</dt><dd><a href="${escapeHtml(view.publicLink)}" rel="noopener noreferrer" target="_blank">Open user-provided link</a></dd></div>` : ''}${view.reuseNote ? `<div><dt>Creator note</dt><dd>${escapeHtml(view.reuseNote)}</dd></div>` : ''}</dl><p class="eon-remix-card-boundary">${escapeHtml(view.recipientBoundary)}</p><p class="eon-remix-card-boundary">${escapeHtml(view.attributionBoundary)}</p></article>`;
}

function syncPrefill() {
  if (!session.intent) session.intent = readEonShareIntent();
  session.output = readEonOutputShareHandoff();
  return { intent: session.intent, output: session.output };
}

function render(root, status = '') {
  if (!root) return;
  const { intent, output } = syncPrefill();
  const prefill = output || intent;
  const card = session.card;
  const remixLink = session.remixLink;
  root.innerHTML = `<section id="eon-remix-card" class="eon-hub-card eon-hub-card-full eon-remix-card" aria-labelledby="eon-remix-card-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">EON Remix Card · W388A.2 + Share-2</p><h2 id="eon-remix-card-title">Invite a useful remix—not an empty signup</h2><p>Turn a public-safe creative idea into a small starter another person can adapt manually. This tool does not host a card, transfer a project, grant access, create a collaboration room, track remixes, make a referral, or publish anything.</p></div><span class="eon-record-status">Draft / export / native share</span></div>${output ? `<section class="eon-share-intent-note"><strong>${escapeHtml(output.sourceLabel)} ready to adapt</strong><p>Only a short browser-session title, audience and public-safe outcome were passed in. No source files, media, chats, credentials, links or account data were transferred.</p><button type="button" class="eon-record-button" data-eon-remix-clear-output>Clear output handoff</button></section>` : ''}${intent ? `<section class="eon-share-intent-note"><strong>EONBOT share draft available</strong><p>Only this short typed request is in the browser-session handoff. Review and change it before creating anything.</p><button type="button" class="eon-record-button" data-eon-remix-clear-intent>Clear chat draft</button></section>` : ''}<form class="eon-record-form eon-remix-card-form" data-eon-remix-card-form><label>Remix Card title<input name="title" maxlength="120" required value="${escapeHtml(prefill?.title || '')}" placeholder="Remix this launch-reel structure" /></label><label>What can someone make?<textarea name="usefulOutcome" maxlength="720" required placeholder="A useful creator workflow or finished concept they can adapt safely.">${escapeHtml(prefill?.usefulOutcome || '')}</textarea></label><label>First remix step<textarea name="firstRemixStep" maxlength="720" required placeholder="Change the audience, hook, visual direction, or CTA for your own use case.">${escapeHtml(prefill?.firstRemixStep || '')}</textarea></label><label>Starter type<select name="kind">${EON_REMIX_CARD_KINDS.map((kind) => `<option value="${escapeHtml(kind.id)}"${output?.remixKind === kind.id || (!output && intent?.wantsRemix && kind.id === 'content-series') ? ' selected' : ''}>${escapeHtml(kind.label)} · ${escapeHtml(kind.hint)}</option>`).join('')}</select></label><label>Public remix or preview link (optional)<input name="publicLink" inputmode="url" maxlength="2048" placeholder="https://example.com/public-preview" /></label><label>Creator credit (optional)<input name="creatorCredit" maxlength="120" placeholder="Created by @yourname" /></label><label>Reuse note (optional)<textarea name="reuseNote" maxlength="720" placeholder="What should someone keep, change, or credit? This is not a legal license."></textarea></label><label class="eon-remix-credit-check"><input type="checkbox" name="creditRequested" /> Please keep the optional creator credit where the destination allows it.</label><p class="eon-record-form-note">Use only public-safe text and links. Do not add private project links, source code, files, media, access links, credentials, account details, claims about ownership, or a promise of a reward. A Remix Card is a creative starter—not a rights clearance or platform-posting approval.</p><p class="eon-record-form-error" data-eon-remix-card-status>${escapeHtml(status)}</p><div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">Create local Remix Card</button><button type="button" class="eon-record-button" data-eon-remix-card-copy ${card ? '' : 'disabled'}>Copy card</button><button type="button" class="eon-record-button" data-eon-remix-card-copy-link ${remixLink ? '' : 'disabled'}>Copy Remix in EONAPP link</button><button type="button" class="eon-record-button" data-eon-remix-card-copy-combined ${card && remixLink ? '' : 'disabled'}>Copy card + Remix link</button><button type="button" class="eon-record-button" data-eon-remix-card-native ${card ? '' : 'disabled'}>Native share…</button><button type="button" class="eon-record-button" data-eon-remix-card-export ${card ? '' : 'disabled'}>Export card</button><button type="button" class="eon-record-button is-danger" data-eon-remix-card-clear ${card ? '' : 'disabled'}>Clear page card</button></div></form><div data-eon-remix-card-output>${cardPreview(card)}</div></section>`;
}

async function copyText(value) {
  const text = String(value || '');
  if (!text) return false;
  if (globalThis.navigator?.clipboard?.writeText) {
    try { await globalThis.navigator.clipboard.writeText(text); return true; } catch {}
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand?.('copy') === true;
  area.remove();
  return copied;
}

export function renderEonRemixCardWorkspace() {
  return '<section data-eon-remix-card-workspace></section>';
}

export function bindEonRemixCardWorkspace(root) {
  const host = root?.querySelector?.('[data-eon-remix-card-workspace]');
  if (!host) return;
  const rerender = (status = '') => { render(host, status); bind(); };
  const bind = () => {
    const form = host.querySelector('[data-eon-remix-card-form]');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        session.card = createEonRemixCard({
          title: form.elements.title.value,
          usefulOutcome: form.elements.usefulOutcome.value,
          firstRemixStep: form.elements.firstRemixStep.value,
          kind: form.elements.kind.value,
          publicLink: form.elements.publicLink.value,
          creatorCredit: form.elements.creatorCredit.value,
          reuseNote: form.elements.reuseNote.value,
          creditRequested: form.elements.creditRequested.checked
        });
        const deepLink = buildEonRemixDeepLink(session.card);
        session.remixLink = deepLink.ok ? deepLink.url : '';
        rerender(deepLink.ok ? 'Local Remix Card created. A public-safe Remix in EONAPP link is ready; review before sharing.' : 'Local Remix Card created. This starter type stays card-only and has no direct Create deep link.');
      } catch (error) {
        const status = host.querySelector('[data-eon-remix-card-status]');
        if (status) status.textContent = String(error?.message || 'The Remix Card could not be created.');
      }
    });
    host.querySelector('[data-eon-remix-card-copy]')?.addEventListener('click', async () => {
      const ok = await copyText(buildEonRemixCardText(session.card));
      rerender(ok ? 'Card copied locally. Copying does not publish or record a remix.' : 'Copy is unavailable in this browser. Export the card instead.');
    });
    host.querySelector('[data-eon-remix-card-copy-link]')?.addEventListener('click', async () => {
      const ok = await copyText(session.remixLink);
      rerender(ok ? 'Remix in EONAPP link copied. Its fragment contains only reviewed public-safe starter text; it creates no tracking or referral proof.' : 'Copy is unavailable in this browser.');
    });
    host.querySelector('[data-eon-remix-card-copy-combined]')?.addEventListener('click', async () => {
      const ok = await copyText(buildEonRemixShareText(session.card, session.remixLink));
      rerender(ok ? 'Card context + Remix in EONAPP link copied. This does not publish, track, create referral proof, or prove a remix.' : 'Copy is unavailable in this browser.');
    });
    host.querySelector('[data-eon-remix-card-native]')?.addEventListener('click', async () => {
      try {
        const result = await shareEonRemixCard(session.card, { remixUrl: session.remixLink });
        rerender(result.ok ? 'Native share was opened. EONAPP cannot confirm a post, remix, collaboration, referral, or reach.' : 'Native share is unavailable here. Copy or export the card instead.');
      } catch {
        rerender('Native share was dismissed or unavailable. Nothing was published.');
      }
    });
    host.querySelector('[data-eon-remix-card-export]')?.addEventListener('click', () => {
      try { downloadJson(buildEonRemixCardExport(session.card), session.card?.title); rerender('Remix Card exported as local JSON. No source, media, credential, account, or referral data was included.'); }
      catch { rerender('The Remix Card could not be exported in this browser.'); }
    });
    host.querySelector('[data-eon-remix-card-clear]')?.addEventListener('click', () => { session.card = null; session.remixLink = ''; rerender('Page-only Remix Card cleared.'); });
    host.querySelector('[data-eon-remix-clear-output]')?.addEventListener('click', () => { clearEonOutputShareHandoff(); session.output = null; rerender('Creator/Forge browser-session handoff cleared.'); });
    host.querySelector('[data-eon-remix-clear-intent]')?.addEventListener('click', () => { clearEonShareIntent(); session.intent = null; rerender('EONBOT browser-session draft cleared.'); });
  };
  render(host);
  bind();
}

export function getEonRemixCardWorkspaceTruth() {
  return Object.freeze({ ...getEonRemixCardTruth(), pageSessionOnly: true, browserSessionPrefillOnly: true, localExportOnly: true, externalRemixProof: false });
}
