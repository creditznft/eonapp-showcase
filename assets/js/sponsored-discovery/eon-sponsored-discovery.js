import { sanitizeSponsoredDiscoveryIntent } from '../../../config/rt97-sponsored-discovery-contract.mjs';

export const EON_SPONSORED_DISCOVERY_CLIENT_SCHEMA = 'eonapp.sponsored-discovery.client.rt97.v2';
const VEXRAIL_TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const freeze = (value) => Object.freeze(value);
const escapeHtml = (value = '') => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
let turnstileLoader = null;

async function readVexrailStatus(environment = globalThis) {
  const response = await environment.fetch('/api/ai/vexrail', { method: 'GET', credentials: 'same-origin', headers: { accept: 'application/json' }, cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  return response.ok ? body : {};
}

async function loadVexrailTurnstile(environment = globalThis) {
  if (environment.turnstile?.render && environment.turnstile?.execute) return environment.turnstile;
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const doc = environment.document;
      const existing = doc?.querySelector?.('script[data-eon-vexrail-turnstile]');
      const script = existing || doc?.createElement?.('script');
      if (!script) return reject(new Error('vexrail_human_verification_unavailable'));
      if (!existing) {
        script.src = VEXRAIL_TURNSTILE_SCRIPT;
        script.async = true;
        script.defer = true;
        script.dataset.eonVexrailTurnstile = 'true';
        doc.head?.appendChild(script);
      }
      const finish = () => environment.turnstile?.render ? resolve(environment.turnstile) : reject(new Error('vexrail_human_verification_unavailable'));
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => reject(new Error('vexrail_human_verification_unavailable')), { once: true });
      if (environment.turnstile?.render) finish();
    }).catch((error) => { turnstileLoader = null; throw error; });
  }
  return turnstileLoader;
}

async function acquireVexrailTurnstileToken(status = {}, environment = globalThis) {
  if (status?.turnstileRequired !== true) return '';
  const sitekey = String(status?.turnstileSiteKey || '').trim();
  if (!sitekey) throw new Error('vexrail_human_verification_unavailable');
  const turnstile = await loadVexrailTurnstile(environment);
  const holder = environment.document.createElement('div');
  holder.setAttribute('role', 'region');
  holder.setAttribute('aria-label', 'Sponsored Discovery human verification');
  holder.setAttribute('data-eon-vexrail-turnstile', 'interactive');
  holder.style.position = 'fixed';
  holder.style.right = 'max(1rem, env(safe-area-inset-right))';
  holder.style.bottom = 'max(1rem, env(safe-area-inset-bottom))';
  holder.style.zIndex = '2147483646';
  holder.style.pointerEvents = 'auto';
  holder.style.maxWidth = 'calc(100vw - 2rem)';
  holder.style.padding = '.75rem';
  holder.style.borderRadius = '.85rem';
  holder.style.background = 'var(--clr-surface, #171b18)';
  holder.style.boxShadow = '0 12px 38px rgba(0,0,0,.38)';
  environment.document.body.appendChild(holder);
  return new Promise((resolve, reject) => {
    let widgetId = null;
    const cleanup = () => { try { if (widgetId !== null) turnstile.remove(widgetId); } catch {} holder.remove(); };
    const fail = () => { cleanup(); reject(new Error('vexrail_human_verification_required')); };
    try {
      widgetId = turnstile.render(holder, {
        sitekey,
        action: 'sponsored_gemini',
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token) => { const value = String(token || '').trim(); cleanup(); value ? resolve(value) : reject(new Error('vexrail_human_verification_required')); },
        'error-callback': fail,
        'expired-callback': fail,
        'timeout-callback': fail
      });
      turnstile.execute(widgetId);
    } catch { fail(); }
  });
}

function appendSafeTextWithLinks(target, text = '') {
  const source = String(text || '');
  const pattern = /\[([^\]\n]{1,180})\]\((https:\/\/[^\s)<>"']+)\)|(https:\/\/[^\s<>"']+)/gi;
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    const index = Number(match.index || 0);
    if (index > cursor) target.appendChild(document.createTextNode(source.slice(cursor, index)));
    const label = String(match[1] || '').trim();
    let rawUrl = String(match[2] || match[3] || '');
    while (/[),.;!?]$/.test(rawUrl) && !match[2]) rawUrl = rawUrl.slice(0, -1);
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('unsafe');
      const link = document.createElement('a');
      link.href = parsed.toString();
      link.target = '_blank';
      link.rel = 'sponsored noopener noreferrer';
      link.textContent = label || rawUrl;
      target.appendChild(link);
    } catch {
      target.appendChild(document.createTextNode(match[0] || rawUrl));
    }
    cursor = index + String(match[0] || '').length;
  }
  if (cursor < source.length) target.appendChild(document.createTextNode(source.slice(cursor)));
}

function safeSponsoredUrl(value = '') {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function renderSponsoredResults(results = []) {
  const cards = Array.isArray(results) ? results.slice(0, 5).map((item = {}) => {
    const url = safeSponsoredUrl(item.url);
    const title = escapeHtml(String(item.title || '').slice(0, 160));
    if (!url || !title) return '';
    const merchant = escapeHtml(String(item.merchant || '').slice(0, 120));
    const description = escapeHtml(String(item.description || '').slice(0, 300));
    const price = escapeHtml(String(item.price || '').slice(0, 80));
    return `<article class="eon-sponsored-offer-card"><a href="${escapeHtml(url)}" target="_blank" rel="sponsored noopener noreferrer"><strong>${title}</strong>${merchant ? `<span>${merchant}</span>` : ''}${description ? `<p>${description}</p>` : ''}${price ? `<b>${price}</b>` : ''}</a></article>`;
  }).filter(Boolean) : [];
  return cards.length ? `<section class="eon-sponsored-offers" aria-label="Sponsored offers"><div class="eon-sponsored-badge">Sponsored offers · Zyntent</div><div class="eon-sponsored-offer-strip">${cards.join('')}</div></section>` : '';
}

export function renderSponsoredDiscoveryPanel(state = {}) {
  const review = state.review || null;
  const answer = String(state.answer || '');
  const meta = state.meta && typeof state.meta === 'object' ? state.meta : {};
  const results = Array.isArray(state.results) ? state.results : [];
  const answerHtml = answer
    ? `<div class="eon-sponsored-discovery-answer"><div class="eon-sponsored-badge">Sponsored Discovery</div><div data-eon-sponsored-answer></div>${meta.model ? `<p class="local-ai-disclosure">${escapeHtml(meta.provider || 'Vexrail')} · ${escapeHtml(meta.model)}${meta.economicsState ? ` · economics ${escapeHtml(meta.economicsState)}` : ''}</p>` : ''}</div>`
    : state.completed && !results.length ? '<p class="local-ai-disclosure">No Sponsored Discovery answer was returned. Your Local AI/BYOK session was not changed.</p>' : '';
  return `<section class="local-ai-truth-card eon-sponsored-discovery" data-eon-sponsored-discovery aria-labelledby="eon-sponsored-discovery-title">
    <p class="local-ai-eyebrow">Optional · explicit Sponsored Discovery</p><h2 id="eon-sponsored-discovery-title">Sponsored Discovery</h2>
    <p>Your Local AI or BYOK answer stays private and ad-free. This separate tool sends only the short commercial intent you review below. It never sends chat history, the Local/BYOK answer, saved memory, provider keys, files or attachments.</p>
    <p class="local-ai-disclosure">Signed-in users only. Paid plans remain ad-free by default; pressing <strong>Send this reviewed intent</strong> is an explicit sponsored exception for this discovery request only. Vexrail remains the primary sponsored discovery answer; a separate structured offer rail may appear below it when inventory is available.</p>
    <div class="eon-sponsored-discovery-form"><label>What do you want to find?<input id="eon-sponsored-discovery-query" data-eon-sponsored-query maxlength="180" value="${escapeHtml(state.query || '')}" placeholder="Example: lightweight CRM for a two-person studio" autocomplete="off" /></label><label>Category<select data-eon-sponsored-category><option value="general">General</option><option value="software">Software</option><option value="business">Business</option><option value="travel">Travel</option><option value="shopping">Shopping</option></select></label><div class="local-ai-actions"><button type="button" class="local-ai-secondary" data-eon-sponsored-review>Review outbound intent</button></div></div>
    ${review ? `<div class="eon-sponsored-review"><strong>Review before sending</strong><p><code>${escapeHtml(review.query)}</code></p><p class="local-ai-disclosure">Outbound user fields: query, category and requested result count only. Trusted geo, rate limits and economics are enforced server-side. If the protected Vexrail fallback is needed, its Turnstile token is verified by EONAPP/Cloudflare and is not forwarded to Vexrail.</p><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-eon-sponsored-send${state.busy ? ' disabled' : ''}>${state.busy ? 'Searching…' : 'Send this reviewed intent'}</button><button type="button" class="local-ai-secondary is-quiet" data-eon-sponsored-cancel>Cancel</button></div></div>` : ''}
    ${state.signInRequired ? '<p class="local-ai-disclosure"><a class="local-ai-inline-link" href="/api/auth/google/start?returnTo=%2Flocal-ai">Sign in with Google to use Sponsored Discovery</a></p>' : ''}
    <p class="local-ai-result" data-eon-sponsored-status aria-live="polite">${escapeHtml(state.message || 'Nothing is sent until you review and confirm the intent.')}</p>${answerHtml}${renderSponsoredResults(results)}
  </section>`;
}

export function bindSponsoredDiscoveryPanel(root, state, { rerender = () => {}, environment = globalThis } = {}) {
  const host = root?.querySelector?.('[data-eon-sponsored-discovery]');
  if (!host) return freeze({ ok: false, reason: 'sponsored_discovery_host_missing' });
  const answerHost = host.querySelector('[data-eon-sponsored-answer]');
  if (answerHost && state.answer) appendSafeTextWithLinks(answerHost, state.answer);
  const query = host.querySelector('[data-eon-sponsored-query]');
  const category = host.querySelector('[data-eon-sponsored-category]');
  if (category && state.category) category.value = state.category;
  query?.addEventListener('input', () => { state.query = String(query.value || '').slice(0, 180); });
  category?.addEventListener('change', () => { state.category = String(category.value || 'general'); });
  host.querySelector('[data-eon-sponsored-review]')?.addEventListener('click', () => {
    const candidate = sanitizeSponsoredDiscoveryIntent({ query: query?.value || state.query || '', category: category?.value || state.category || 'general', explicitReview: true, maxResults: 4 });
    if (!candidate.ok) {
      state.review = null; state.message = candidate.reason === 'secret_like_intent_rejected' ? 'This intent looks like it may contain a credential or secret. Remove it before using Sponsored Discovery.' : 'Enter a short search intent before reviewing.'; rerender(); return;
    }
    state.query = candidate.intent.query; state.category = candidate.intent.category; state.review = candidate.intent; state.message = 'Review the exact outbound intent, then confirm if you want to send this separate sponsored request.'; state.answer = ''; state.results = []; state.meta = {}; state.completed = false; state.signInRequired = false; rerender();
  });
  host.querySelector('[data-eon-sponsored-cancel]')?.addEventListener('click', () => { state.review = null; state.message = 'Cancelled. Nothing was sent.'; rerender(); });
  host.querySelector('[data-eon-sponsored-send]')?.addEventListener('click', async () => {
    if (!state.review || state.busy) return;
    state.busy = true; state.message = 'Checking sponsored discovery eligibility and human verification…'; state.signInRequired = false; rerender();
    let status = {};
    try { status = await readVexrailStatus(environment); } catch {}
    if (status?.signedIn !== true) { state.busy = false; state.completed = false; state.signInRequired = true; state.message = 'Sponsored Discovery is signed-in only and never consumes the guest one-shot. Sign in, then review and send the intent again.'; rerender(); return; }
    let turnstileToken = '';
    if (status?.configured === true && (status?.eligible === true || status?.eligibleByOptIn === true)) {
      try { turnstileToken = await acquireVexrailTurnstileToken(status, environment); }
      catch { state.busy = false; state.completed = false; state.message = 'Human verification is required before Sponsored Discovery can contact Vexrail. No discovery request was sent.'; rerender(); return; }
    }
    state.message = 'Sending the reviewed intent to primary Vexrail and companion sponsored offers…'; rerender();
    let response = null; let body = {};
    try {
      response = await environment.fetch('/api/discovery/sponsored', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ query: state.review.query, category: state.review.category, maxResults: state.review.maxResults || 4, explicitReview: true, ...(turnstileToken ? { turnstileToken } : {}) }) });
      body = await response.json().catch(() => ({}));
    } catch {}
    state.busy = false; state.completed = true; state.review = null;
    if (!response?.ok || body?.ok !== true) {
      state.answer = ''; state.results = []; state.meta = {};
      state.message = body?.error === 'sponsored_discovery_sign_in_required' || body?.error === 'vexrail_sign_in_required'
        ? 'Sign in is required for Sponsored Discovery. The guest one-shot was not used.'
        : body?.error === 'vexrail_human_verification_required'
          ? 'Human verification is required. No Vexrail discovery request completed.'
          : body?.error === 'vexrail_profitability_guard'
            ? 'Sponsored Discovery is paused by the profitability governor for this market/request class.'
            : 'Sponsored Discovery could not complete. Your Local AI/BYOK session was not changed.';
      rerender(); return;
    }
    state.answer = String(body.answer || '').slice(0, 12000);
    state.results = Array.isArray(body.results) ? body.results.slice(0, 5) : [];
    state.meta = { provider: String(body.provider || 'vexrail'), model: String(body.model || ''), routing: String(body.routing || ''), economicsState: String(body.economicsState || '') };
    state.message = body.provider === 'zyntent' ? 'Sponsored offers were returned by Zyntent while the primary Vexrail request was unavailable. Your private AI session was not changed.' : 'Sponsored Discovery completed with a primary Vexrail answer. Any available Zyntent cards are a separate sponsored offer rail; your private AI session remains unchanged.';
    rerender();
  });
  return freeze({ ok: true, schema: EON_SPONSORED_DISCOVERY_CLIENT_SCHEMA });
}

export default freeze({ EON_SPONSORED_DISCOVERY_CLIENT_SCHEMA, renderSponsoredDiscoveryPanel, bindSponsoredDiscoveryPanel });
