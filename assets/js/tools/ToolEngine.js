import { getChallengeToastMessages } from '../utils/challenges.js';
import { copyToClipboard, wireResultActions, showToast } from '../utils/share.js';
import {
  buildChallengeUrl,
  captureInviteFromUrl,
  ensureProfile,
  getChallengeFromUrl,
  getInviteSummary,
  getProfileStats,
  recordChallengeWin,
  recordToolRun
} from '../utils/profile.js';
import { getStreak } from '../utils/storage.js';
import { generateInviteLink } from '../utils/referral-par.js';
import { escapeHtml } from '../utils/escape.js';

// Browser global type cast for custom window properties
const appWin = /** @type {any} */ (window);

function sanitizeId(/** @type {any} */ value = '') {
  return String(value || '').trim().replace(/[^a-z0-9_-]/gi, '').slice(0, 80);
}

function sanitizeToolUrl(/** @type {any} */ value = '') {
  try {
    const url = new URL(String(value || ''), window.location.origin);
    if (!/^https?:$/i.test(url.protocol)) return '#';
    if (url.origin !== window.location.origin) return '#';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '#';
  }
}

export class ToolEngine {
  constructor(/** @type {any} */ def) {
    this.def = def;
    this.state = this._readHash();
    this.profile = ensureProfile();
    this.inviteContext = captureInviteFromUrl();
    this.challengeContext = getChallengeFromUrl();
    this.prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    this.hasFinePointer = window.matchMedia?.('(pointer: fine)')?.matches ?? false;
  }

  mount(/** @type {any} */ root) {
    this._applyMeta();
    root.innerHTML = this._renderForm();
    this._bindProfileActions(root);
    this._syncProfileContext(root);
    this._bindChoiceButtons(root);
    this._bindRangeInputs(root);
    root.querySelector('#eon-run-btn')?.addEventListener('click', () => this.run(root));

    if (this.state?.inputs) {
      this._hydrate(root, this.state.inputs);
    }
    if (this.state?.result) {
      this._renderResult(root, this.state.result);
    }
  }

  async run(/** @type {any} */ root) {
    const inputs = this._collect(root);
    const /** @type {any} */
btn = root.querySelector('#eon-run-btn');
    if (!this.def.compute || typeof this.def.compute !== 'function') {
      throw new Error('Tool definition missing compute function');
    }
    try {
      const result = await this.def.compute(inputs);
      this._writeHash({ tool: this.def.id, inputs, result });
      this._renderResult(root, result);

      const challenge = typeof this.def.challenge === 'function' ? this.def.challenge(result) : null;
      const streak = getStreak(this.def.id);
      const runUpdate = recordToolRun(this.def.id, {
        title: challenge?.headline || result?.title || this.def.title,
        score: challenge?.value ?? '',
        badge: challenge?.label || ''
      });
      this.profile = runUpdate?.profile || ensureProfile();
      this._syncProfileContext(root);

      this._announceChallengeProgress(runUpdate?.challengeUpdate);

      if (streak.count === 3) {
        showToast('3-day streak unlocked. Your profile just got stronger.', 'success');
      }
    } catch (/** @type {any} */
error) {
      if (appWin.DEBUG) console.warn('[ToolEngine] Run failed:', error);
      showToast('Something went wrong. Try again.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = this.def.runLabel || 'Generate Result';
      }
    }
  }

  _announceChallengeProgress(/** @type {any} */ update) {
    const messages = getChallengeToastMessages(update);
    messages.forEach((/** @type {any} */ message, /** @type {any} */ index) => {
      setTimeout(() => showToast(message, 'success'), index * 250);
    });
  }

  _renderForm() {
    const fields = this.def.fields.map((/** @type {any} */ field) => this._renderField(field)).join('');
    return `
      <div class="tool-header">
        <span class="badge">${escapeHtml(this.def.category)}</span>
        <h1>${escapeHtml(this.def.title)}</h1>
        <p>${escapeHtml(this.def.description)}</p>
      </div>
      ${this._renderProfileStrip()}
      ${this._renderChallengeBanner()}
      <div class="tool-form">
        ${fields}
        <button class="btn btn-primary run-btn" id="eon-run-btn">${this.def.runLabel || 'Generate Result'}</button>
      </div>
      <div id="eon-result" aria-live="polite"></div>
      <div class="related-tools" id="eon-related"></div>
    `;
  }

  _renderProfileStrip() {
    return `
      <div class="tool-profile-strip">
        <div class="tool-profile-meta" data-tool-profile-meta></div>
        <div class="tool-profile-actions">
          <button class="btn btn-outline btn-sm" type="button" id="tool-copy-invite-btn">Copy invite link</button>
          <a class="btn btn-outline btn-sm" href="/vault">Open vault</a>
        </div>
      </div>
    `;
  }

  _bindProfileActions(/** @type {any} */ root) {
    root.querySelector('#tool-copy-invite-btn')?.addEventListener('click', () => {
      void (async () => {
        const url = await generateInviteLink(ensureProfile(), { source: 'tool-profile', destination: '/vault' });
        copyToClipboard(url);
      })().catch(() => showToast('Could not create a signed invite link.', 'error'));
    });
  }

  _syncProfileContext(/** @type {any} */ root) {
    const /** @type {any} */
meta = root.querySelector('[data-tool-profile-meta]');
    if (!meta) {
      return;
    }

    const stats = getProfileStats();
    const invite = getInviteSummary();
    const nextTier = stats.referralTier.nextTarget
      ? ` · ${stats.referralTier.remaining} to ${escapeHtml(stats.referralTier.nextName || '')}`
      : ' · Max local tier reached';

    meta.innerHTML = `
      <strong>Generated vault alias: ${escapeHtml(`${stats.avatar} ${stats.alias}`)}</strong>
      <span>${stats.referralTier.emoji} ${escapeHtml(stats.referralTier.name)} · ${stats.totalRuns} run${stats.totalRuns === 1 ? '' : 's'} · ${invite.referralReturns} referral return${invite.referralReturns === 1 ? '' : 's'}${nextTier}</span>
      <small>Signed invite links are self-contained public identifiers. They need no short-link registry; sharing does not create credit, value, or a central click record.</small>
    `;
  }

  _renderChallengeBanner() {
    const invite = this.inviteContext;
    const challenge = this.challengeContext;

    if (!invite && !challenge) {
      return '';
    }

    const /** @type {any} */
lines = [];
    if (invite?.alias) {
      lines.push(`<p><strong>${escapeHtml(invite.alias)}</strong> linked this device into the EONAPP vault chain.</p>`);
      if (invite.depth) {
        lines.push(`<p class="challenge-meta">Invite chain depth: <strong>#${escapeHtml(invite.depth)}</strong></p>`);
      }
    }
    if (invite?.referralReturn) {
      lines.push(`<p class="challenge-meta"><strong>${escapeHtml(invite.referralReturn.fromAlias)}</strong> created a qualified relationship record. Recognition status: <strong>${escapeHtml(invite.referralReturn.tier.name)}</strong>.</p>`);
    }

    if (challenge?.headline) {
      const metric = challenge.value !== undefined ? ` <strong>${escapeHtml(challenge.value)}${escapeHtml(challenge.unit || '')}</strong>` : '';
      lines.push(`<p>${escapeHtml(challenge.alias || 'A linked vault')} challenged this run: ${escapeHtml(challenge.headline)}${metric}</p>`);

      if (challenge.chainDepth || challenge.expiresAt) {
        lines.push(`<p class="challenge-meta">${
          challenge.chainDepth ? `Chain depth <strong>#${escapeHtml(challenge.chainDepth)}</strong>` : ''
        }${
          challenge.chainDepth && challenge.expiresAt ? ' · ' : ''
        }${
          challenge.expiresAt ? `Expires ${escapeHtml(this._formatChallengeExpiry(challenge.expiresAt))}` : ''
        }</p>`);
      }
    }

    return `
      <div class="challenge-banner card">
        <div class="card-title">Challenge mode</div>
        <div class="card-desc">${lines.join('')}</div>
      </div>
    `;
  }

  _formatChallengeExpiry(/** @type {any} */ expiresAt) {
    const msLeft = Number(expiresAt) - Date.now();
    if (msLeft <= 0) {
      return 'now';
    }

    const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    return `in ${days} day${days === 1 ? '' : 's'}`;
  }

  _renderField(/** @type {any} */ field) {
    const fieldId = sanitizeId(field.id);
    const fieldLabel = escapeHtml(field.label);
    if (field.type === 'text' || field.type === 'number') {
      const valueAttr = field.default !== undefined ? ` value="${escapeHtml(field.default)}"` : '';
      const minAttr = field.min !== undefined ? ` min="${escapeHtml(field.min)}"` : '';
      const maxAttr = field.max !== undefined ? ` max="${escapeHtml(field.max)}"` : '';
      const stepAttr = field.step !== undefined ? ` step="${escapeHtml(field.step)}"` : '';
      return `<div class="form-group"><label for="${fieldId}">${fieldLabel}</label>
        <input type="${field.type}" id="${fieldId}" name="${fieldId}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}${valueAttr}${minAttr}${maxAttr}${stepAttr} /></div>`;
    }

    if (field.type === 'select') {
      const options = field.options.map((/** @type {any} */ option) => `<option value="${escapeHtml(option.value)}" ${option.value === field.default ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
      return `<div class="form-group"><label for="${fieldId}">${fieldLabel}</label>
        <select id="${fieldId}" name="${fieldId}">${options}</select></div>`;
    }

    if (field.type === 'choice') {
      const buttons = field.options.map((/** @type {any} */ option) =>
        `<button type="button" class="choice-btn ${option.value === field.default ? 'active' : ''}" data-field="${fieldId}" data-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button>`
      ).join('');
      return `<div class="form-group"><label>${fieldLabel}</label>
        <div class="choice-grid">${buttons}</div>
        <input type="hidden" id="${fieldId}" name="${fieldId}" value="${escapeHtml(field.default || '')}" /></div>`;
    }

    if (field.type === 'range') {
      const value = field.default || field.min;
      return `<div class="form-group"><label for="${fieldId}">${fieldLabel}: <span id="${fieldId}-val">${escapeHtml(value)}</span></label>
        <input type="range" id="${fieldId}" name="${fieldId}" min="${escapeHtml(field.min)}" max="${escapeHtml(field.max)}" value="${escapeHtml(value)}"
          data-range-target="${fieldId}-val" /></div>`;
    }

    return '';
  }

  _bindChoiceButtons(/** @type {any} */ root) {
    root.querySelectorAll('.choice-btn').forEach((/** @type {any} */ btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        root.querySelectorAll(`.choice-btn[data-field="${field}"]`).forEach((/** @type {any} */ node) => node.classList.remove('active'));
        btn.classList.add('active');
        root.querySelector(`#${field}`).value = btn.dataset.value;
      });
    });
  }

  _bindRangeInputs(/** @type {any} */ root) {
    root.querySelectorAll('input[type="range"][data-range-target]').forEach((/** @type {any} */ input) => {
      const targetId = sanitizeId(input.getAttribute('data-range-target') || '');
      const target = targetId ? root.querySelector(`#${targetId}`) : null;
      if (!target) {
        return;
      }
      input.addEventListener('input', () => {
        target.textContent = input.value;
      });
    });
  }

  _collect(/** @type {any} */ root) {
    const /** @type {any} */
inputs = {};
    this.def.fields.forEach((/** @type {any} */ field) => {
      const safeId = sanitizeId(field.id);
      if (!safeId) return;
      const /** @type {any} */
el = root.querySelector(`#${safeId}`);
      inputs[safeId] = el ? el.value : '';
    });
    return inputs;
  }

  _hydrate(/** @type {any} */ root, /** @type {any} */ inputs) {
    Object.entries(inputs).forEach((/** @type {any} */ [key, value]) => {
      const safeKey = sanitizeId(key);
      if (!safeKey) {
        return;
      }
      const /** @type {any} */
el = root.querySelector(`#${safeKey}`);
      if (!el) {
        return;
      }
      el.value = value;
      // Sync range display span when restoring from hash state
      const /** @type {any} */
rangeDisplay = root.querySelector(`#${safeKey}-val`);
      if (rangeDisplay) {
        rangeDisplay.textContent = value;
      }
      const btn = Array.from(root.querySelectorAll(`.choice-btn[data-field="${safeKey}"]`))
        .find((/** @type {any} */ node) => node.dataset.value === String(value));
      if (btn) {
        btn.classList.add('active');
      }
    });
  }

  _renderResult(/** @type {any} */ root, /** @type {any} */ result) {
    const /** @type {any} */
resultEl = root.querySelector('#eon-result');
    const safeResult = this._sanitizeResultPayload(result);
    const challenge = typeof this.def.challenge === 'function' ? this.def.challenge(result) : null;
    const shareUrl = buildChallengeUrl(window.location.pathname, challenge);
    const shareText = typeof this.def.shareText === 'function'
      ? this.def.shareText(result, challenge, this.profile)
      : 'Check my result on EONAPP.ch.';
    resultEl.innerHTML = `
      ${this.def.resultTemplate(safeResult)}
      ${this._renderChallengeOutcome(result)}
      ${this._renderShareActions()}
    `;
    this._enhanceResultExperience(resultEl);

    wireResultActions({
      root: resultEl,
      cardEl: resultEl.querySelector('#eon-share-card'),
      toolId: this.def.id,
      shareUrl,
      shareText,
    });

    const /** @type {any} */
related = root.querySelector('#eon-related');
    if (related && this.def.related?.length) {
      const relatedItems = this.def.related
        .map((/** @type {any} */ item) => this._normalizeRelatedItem(item))
        .filter(Boolean);
      related.innerHTML = `<h3>Try These Next</h3><div class="related-grid">${
        relatedItems.map((/** @type {any} */ item) => `
          <a href="${sanitizeToolUrl(item.url)}" class="card">
            <div class="card-icon">${escapeHtml(item.icon)}</div>
            <div class="card-title">${escapeHtml(item.title)}</div>
            <span class="badge">${escapeHtml(item.cat)}</span>
          </a>`
        ).join('')
      }</div>`;
    }

    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.dispatchEvent(new CustomEvent('eon:result', {
      detail: { tool: this.def.id, result, shareUrl }
    }));
  }

  _renderChallengeOutcome(/** @type {any} */ result) {
    if (!this.challengeContext || typeof this.def.compareChallenge !== 'function') {
      return '';
    }

    const comparison = this.def.compareChallenge(result, this.challengeContext);
    const didBeat = typeof comparison === 'object' ? Boolean(comparison?.won) : Boolean(comparison);
    const detail = typeof comparison === 'object' ? escapeHtml(comparison?.message || '') : '';
    if (didBeat) {
      const winUpdate = recordChallengeWin(this.def.id, this.challengeContext);
      this._announceChallengeProgress(winUpdate?.challengeUpdate);
    }

    return `
      <div class="challenge-outcome ${didBeat ? 'is-win' : 'is-try-again'}">
        <strong>${didBeat ? 'You beat the challenge.' : 'Result locked in.'}</strong>
        <span>${detail || (didBeat ? 'Share it back and keep the chain moving.' : 'Share yours back and see if someone tops you next.')}</span>
      </div>
    `;
  }

  _normalizeRelatedItem(/** @type {any} */ item) {
    if (!item) {
      return null;
    }

    if (typeof item === 'object') {
      return {
        url: sanitizeToolUrl(item.url || ''),
        icon: String(item.icon || '⚡').slice(0, 8),
        title: String(item.title || 'Tool').slice(0, 80),
        cat: String(item.cat || 'Tool').slice(0, 40)
      };
    }

    if (typeof item !== 'string') {
      return null;
    }

    const slug = item.trim();
    if (!slug) {
      return null;
    }

    const /** @type {any} */
overrides = {
      'dca-explorer': { icon: '📊', title: 'DCA Explorer', cat: 'Finance' },
      'future-worth': { icon: '💰', title: 'FutureWorth', cat: 'Finance' },
      'subscription-leak': { icon: '💸', title: 'Subscription Leak', cat: 'Finance' },
      'crypto-fate': { icon: '₿', title: 'Crypto Fate', cat: 'Finance' }
    };
    const fallbackTitle = slug
      .split('-')
      .map((/** @type {any} */ part) => part ? part[0].toUpperCase() + part.slice(1) : '')
      .join(' ');
    const meta = overrides[slug] || { icon: '⚡', title: fallbackTitle, cat: 'Tool' };

    return {
      url: sanitizeToolUrl(`/tools/${slug}.html`),
      icon: meta.icon,
      title: meta.title,
      cat: meta.cat
    };
  }

  _renderShareActions() {
    return `
      <div class="share-actions" aria-label="Share result">
        <button class="share-btn share-btn-x" data-share-platform="x">X</button>
        <button class="share-btn share-btn-reddit" data-share-platform="reddit">Reddit</button>
        <button class="share-btn share-btn-wa" data-share-platform="wa">WhatsApp</button>
        <button class="share-btn share-btn-copy" id="eon-copy-btn">Copy Link</button>
        <button class="share-btn share-btn-dl" id="eon-dl-btn">Save Card</button>
      </div>
      <p class="tool-share-note">Sharing is optional. It does not create a reward, credit, account balance, or feature unlock.</p>
    `;
  }

  _enhanceResultExperience(/** @type {any} */ resultEl) {
    this._animateResultMeters(resultEl);
    this._enableResultTilt(resultEl);
  }

  _animateResultMeters(/** @type {any} */ resultEl) {
    if (this.prefersReducedMotion) {
      return;
    }

    resultEl.querySelectorAll('.rarity-bar-inner, .trait-fill').forEach((/** @type {any} */ bar) => {
      const targetWidth = bar.style.width;
      if (!targetWidth || bar.dataset.eonAnimated === '1') {
        return;
      }
      bar.dataset.eonAnimated = '1';
      bar.style.transition = 'none';
      bar.style.width = '0%';
      // Force layout so Chromium commits the 0% start state before transition.
      void bar.offsetWidth;
      bar.style.transition = 'width 820ms cubic-bezier(0.22, 1, 0.36, 1)';
      requestAnimationFrame(() => {
        bar.style.width = targetWidth;
      });
    });
  }

  _enableResultTilt(/** @type {any} */ resultEl) {
    const /** @type {any} */
card = resultEl.querySelector('#eon-share-card');
    if (!card || card.dataset.eonInteractive === '1') {
      return;
    }
    card.dataset.eonInteractive = '1';
    card.classList.add('result-card-interactive');

    if (this.prefersReducedMotion || !this.hasFinePointer) {
      return;
    }

    card.addEventListener('pointermove', (/** @type {any} */ event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--eon-tilt-y', `${(x * 6).toFixed(2)}deg`);
      card.style.setProperty('--eon-tilt-x', `${(-y * 6).toFixed(2)}deg`);
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--eon-tilt-y', '0deg');
      card.style.setProperty('--eon-tilt-x', '0deg');
    });
  }

  /**
   * @param {any} value
   * @returns {any}
   */
  _sanitizeResultPayload(/** @type {any} */ value) {
    if (typeof value === 'string') {
      return escapeHtml(value);
    }

    if (Array.isArray(value)) {
      return value.map((/** @type {any} */ item) => this._sanitizeResultPayload(item));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map((/** @type {any} */ [key, item]) => [key, this._sanitizeResultPayload(item)])
      );
    }

    return value;
  }

  _writeHash(/** @type {any} */ obj) {
    try {
      history.replaceState(null, '', `#${encodeURIComponent(JSON.stringify(obj))}`);
    } catch {
      // noop
    }
  }

  _readHash() {
    try {
      if (!location.hash || location.hash.length < 3) {
        return {};
      }
      const decoded = decodeURIComponent(location.hash.slice(1));
      if (decoded.length > 8000) {
        return {};
      }
      const parsed = JSON.parse(decoded);
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }
      const rawInputs = parsed.inputs && typeof parsed.inputs === 'object' ? parsed.inputs : {};
      const inputs = Object.fromEntries(
        Object.entries(rawInputs)
          .slice(0, 60)
          .map((/** @type {any} */ [key, value]) => [sanitizeId(key), String(value ?? '').slice(0, 2000)])
          .filter((/** @type {any} */ [key]) => Boolean(key))
      );
      return {
        tool: typeof parsed.tool === 'string' ? parsed.tool.slice(0, 80) : '',
        inputs,
        result: parsed.result
      };
    } catch {
      return {};
    }
  }

  _applyMeta() {
    if (this.def.metaTitle) {
      document.title = this.def.metaTitle;
    }
    if (this.def.metaDesc) {
      let /** @type {any} */
meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = this.def.metaDesc;
    }
  }
}
