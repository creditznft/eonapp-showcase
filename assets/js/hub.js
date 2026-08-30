import { registerEonServiceWorker } from './utils/eon-service-worker-registration.js';
import { ARCHIVED_GAMES, ARCHIVED_TOOLS, BLOG_CLUSTERS, FLAGSHIP_GAMES, FLAGSHIP_TOOLS, GAMES, TOOLS } from './app-data.js';
import { copyToClipboard, showToast } from './utils/share.js';
import { renderAvatarMarkup } from './utils/avatar.js';
import { captureInviteFromUrl, ensureProfile, getProfileStats } from './utils/profile.js';
import { generateInviteLink } from './utils/referral-par.js';
import { mountAdsDeferred, mountChatWidgetDeferred, warmRewardRuntime } from './utils/runtime-loader.js';
import { applyTheme, initThemeToggle } from './utils/storage.js';
import { escapeHtml } from './utils/escape.js';
import { checkGameCompatibility } from './utils/device-detection.js';
import { initSiteShell } from './utils/site-shell.js';
import { initAppLanguage, localizeStatic, autoLocalizePage } from './utils/app-language.js';
import { initInfoHints } from './utils/info-hints.js';

function sanitizeRelativeUrl(/** @type {any} */ value = '') {
  try {
    const url = new URL(String(value || ''), window.location.origin);
    if (!/^https?:$/i.test(url.protocol)) return '#';
    if (url.origin !== window.location.origin) return '#';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '#';
  }
}

function sanitizeClassToken(/** @type {any} */ value = '') {
  return String(value || '').trim().replace(/[^a-z0-9_-]/gi, '').slice(0, 60);
}

function sanitizeElementId(/** @type {any} */ value = '') {
  return String(value || '').trim().replace(/[^a-z0-9_-]/gi, '').slice(0, 80);
}

function renderAction(/** @type {any} */ label, /** @type {any} */ href, /** @type {any} */ live) {
  if (!live) {
    return `<span class="badge">Coming soon</span>`;
  }
  return `<a class="btn btn-outline btn-sm" href="${sanitizeRelativeUrl(href)}">${escapeHtml(label)}</a>`;
}

function renderArchiveAction(/** @type {any} */ href) {
  return `<a class="btn btn-outline btn-sm" href="${sanitizeRelativeUrl(href)}">Open archive entry</a>`;
}

function renderToolCard(/** @type {any} */ tool) {
  const statusClass = tool.status === 'flagship' ? 'badge-gold' : tool.status === 'live' ? 'badge-green' : '';
  const statusText = tool.status === 'flagship' ? 'Flagship' : tool.status === 'live' ? 'Support' : 'Archived';
  return `
    <article class="card hub-card" id="${sanitizeElementId(tool.id)}">
      <div class="card-icon">${escapeHtml(tool.icon)}</div>
      <div class="card-title">${escapeHtml(tool.title)}</div>
      <div class="card-desc">${escapeHtml(tool.desc)}</div>
      <div class="card-meta">
        <span class="badge">${escapeHtml(tool.category)}</span>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="card-meta">
        <span style="font-size:.82rem;color:var(--clr-text-muted)">Viral ${escapeHtml(tool.viral)}/10</span>
        <span style="font-size:.82rem;color:var(--clr-text-muted)">Profit ${escapeHtml(tool.profit)}/10</span>
      </div>
      <div class="card-meta">${tool.status === 'archived' ? renderArchiveAction(tool.url) : renderAction(tool.status === 'flagship' ? 'Open flagship tool' : 'Open support tool', tool.url, true)}</div>
    </article>
  `;
}

function renderGameCard(/** @type {any} */ game) {
  const statusClass = game.status === 'flagship' ? 'badge-gold' : game.status === 'live' ? 'badge-green' : '';
  const statusText = game.status === 'flagship' ? 'Flagship' : game.status === 'live' ? 'Support' : 'Archived';

  // Check device compatibility
  const compat = checkGameCompatibility(game.id);
  const compatBadge = compat.compatible
    ? `<span class="badge badge-blue" title="${escapeHtml(compat.reason)}">✓ Compatible</span>`
    : `<span class="badge badge-red" title="${escapeHtml(compat.reason)}">⚠ Limited</span>`;

  return `
    <article class="card hub-card" id="${sanitizeElementId(game.id)}">
      <div class="game-card-preview ${sanitizeClassToken(game.preview || '')}">${escapeHtml(game.icon)}</div>
      <div class="card-title">${escapeHtml(game.title)}</div>
      <div class="card-desc">${escapeHtml(game.desc)}</div>
      <div class="card-meta">
        <span class="badge ${statusClass}">${statusText}</span>
        ${compatBadge}
      </div>
      <div class="card-meta">${game.status === 'archived' ? renderArchiveAction(game.url) : renderAction(game.status === 'flagship' ? 'Play flagship' : 'Play support game', game.url, true)}</div>
    </article>
  `;
}

function renderBlogCard(/** @type {any} */ cluster) {
  const metaParts = [
    cluster.priority ? `<span style="font-size:.82rem;color:var(--clr-text-muted)">Priority ${escapeHtml(cluster.priority)}</span>` : '',
    cluster.intent ? `<span style="font-size:.82rem;color:var(--clr-text-muted)">${escapeHtml(cluster.intent)}</span>` : ''
  ].filter(Boolean).join('');

  return `
    <article class="card hub-card">
      ${cluster.label ? `<div class="card-meta"><span class="badge">${escapeHtml(cluster.label)}</span></div>` : ''}
      <div class="card-title">${escapeHtml(cluster.title)}</div>
      <div class="card-desc">${escapeHtml(cluster.desc)}</div>
      ${metaParts ? `<div class="card-meta">${metaParts}</div>` : ''}
      <div class="card-meta"><a class="btn btn-outline btn-sm" href="${sanitizeRelativeUrl(cluster.url)}">${escapeHtml(cluster.cta || 'Explore cluster')}</a></div>
    </article>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  initAppLanguage();
  initSiteShell();
  applyTheme();
  initThemeToggle();
  ensureProfile();
  const inviteContext = captureInviteFromUrl();
  if ('serviceWorker' in navigator) {
    void registerEonServiceWorker();
  }

  const pageType = document.body.dataset.pageType || 'static';
  void mountAdsDeferred(pageType === 'tools' || pageType === 'games' ? 'hub' : pageType);
  void mountChatWidgetDeferred({ pageType });
  // Marketplace is intentionally kept lean on first load; reward runtime warms later on other surfaces.
  if (pageType !== 'marketplace') {
    void warmRewardRuntime({ idle: true, timeout: 1400 });
  }

  if (inviteContext?.referralReturn) {
    showToast(`Qualified referral relationship noted from ${inviteContext.referralReturn.fromAlias}. ${inviteContext.referralReturn.tier.name} reached.`, 'success');
  }

  const /** @type {any} */
liveTools = document.getElementById('live-tools');
  if (liveTools) {
    liveTools.innerHTML = FLAGSHIP_TOOLS.length
      ? FLAGSHIP_TOOLS.map(renderToolCard).join('')
      : `
        <article class="card hub-card">
          <div class="card-title">Flagship tools are being rebuilt</div>
          <div class="card-desc">All previous tools were moved to archive while the new flagship suite is prepared.</div>
          <div class="card-meta"><a class="btn btn-outline btn-sm" href="/archive.html">Open archive</a></div>
        </article>
      `;
  }

  const /** @type {any} */
plannedTools = document.getElementById('planned-tools');
  if (plannedTools) {
    const supportTools = TOOLS.filter((/** @type {any} */ tool) => tool.status === 'live');
    plannedTools.innerHTML = supportTools.length
      ? supportTools.map(renderToolCard).join('')
      : `
        <article class="card hub-card">
          <div class="card-title">No support tools listed</div>
          <div class="card-desc">Everything currently visible is either flagship or archived while the rebuild continues.</div>
        </article>
      `;
  }

  const /** @type {any} */
gamesGrid = document.getElementById('games-grid');
  if (gamesGrid) {
    gamesGrid.innerHTML = FLAGSHIP_GAMES.length
      ? FLAGSHIP_GAMES.map(renderGameCard).join('')
      : `
        <article class="card hub-card">
          <div class="card-title">Flagship games are being rebuilt</div>
          <div class="card-desc">All previous games were moved to archive while the flagship lineup is rebuilt.</div>
          <div class="card-meta"><a class="btn btn-outline btn-sm" href="/archive.html">Open archive</a></div>
        </article>
      `;
  }

  const /** @type {any} */
supportGames = document.getElementById('support-games');
  if (supportGames) {
    const supportGameList = GAMES.filter((/** @type {any} */ game) => game.status === 'live');
    supportGames.innerHTML = supportGameList.length
      ? supportGameList.map(renderGameCard).join('')
      : `
        <article class="card hub-card">
          <div class="card-title">No support games listed</div>
          <div class="card-desc">The catalog is currently archive-first until new flagship games are published.</div>
        </article>
      `;
  }

  const /** @type {any} */
archivedTools = document.getElementById('archived-tools');
  if (archivedTools) {
    archivedTools.innerHTML = ARCHIVED_TOOLS.map(renderToolCard).join('');
  }

  const /** @type {any} */
archivedGames = document.getElementById('archived-games');
  if (archivedGames) {
    archivedGames.innerHTML = ARCHIVED_GAMES.map(renderGameCard).join('');
  }

  const /** @type {any} */
blogGrid = document.getElementById('blog-clusters');
  if (blogGrid) {
    blogGrid.innerHTML = BLOG_CLUSTERS.map(renderBlogCard).join('');
  }

  const /** @type {any} */
summary = document.getElementById('profile-summary');
  if (summary) {
    const stats = getProfileStats();
    const safeAlias = escapeHtml(stats.alias);
    summary.innerHTML = `
      <div class="card profile-summary-card">
        <div class="card-title" style="display:flex;align-items:center;gap:.75rem">${renderAvatarMarkup(stats, { size: 42, alt: `${safeAlias} avatar` })}<span>${safeAlias}</span></div>
        <div class="card-desc">Generated vault alias for this device. ${stats.totalRuns} recorded runs, ${stats.badgeCount} badges, and <strong>${escapeHtml(stats.referralTier.emoji)} ${escapeHtml(stats.referralTier.name)}</strong> status with ${stats.referralReturns} referral return${stats.referralReturns === 1 ? '' : 's'} stored locally.</div>
        <div class="card-meta">
          <button class="btn btn-outline btn-sm" type="button" id="hub-copy-invite-btn">Copy invite link</button>
          <a class="btn btn-outline btn-sm" href="/vault">Vault</a>
        </div>
      </div>
    `;

    summary.querySelector('#hub-copy-invite-btn')?.addEventListener('click', () => {
      void (async () => {
        const url = await generateInviteLink(ensureProfile(), { source: 'hub-profile', destination: '/vault' });
        copyToClipboard(url);
      })().catch(() => showToast?.('Could not create a signed invite link.', 'error'));
    });
  }

  await localizeStatic();
  await autoLocalizePage(document);
  initInfoHints();
  window.addEventListener('eon:content-updated', () => initInfoHints());
});
