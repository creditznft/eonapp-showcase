import { getChallengeToastMessages } from './challenges.js';
import { markShare } from './profile.js';
import { downloadCanvas, exportShareCard } from './share-card.js';
import { buildPlatformShareTargets } from '../social/social-platform-adapters.js';

export function showToast(/** @type {any} */ msg, /** @type {any} */ type = '') {
  document.querySelectorAll('.toast').forEach((/** @type {any} */ toast) => toast.remove());
  const /** @type {any} */
el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export async function copyToClipboard(/** @type {any} */ text) {
  const value = typeof text === 'string' ? text : String(text ?? '');

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      showToast('Link copied.', 'success');
      return true;
    } catch {
      // Try legacy fallback below.
    }
  }

  try {
    const /** @type {any} */
area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, area.value.length);
    const ok = document.execCommand('copy');
    area.remove();
    if (ok) {
      showToast('Link copied.', 'success');
      return true;
    }
  } catch {
    // noop
  }

  showToast('Copy failed.', 'error');
  return false;
}

export function buildShareLinks(/** @type {any} */ text, /** @type {any} */ url = window.location.href, /** @type {any} */ missionCode = '') {
  const targets = buildPlatformShareTargets({ link: url, message: text, missionCode, title: document?.title || 'EON Apps' });
  return {
    x: targets.x,
    telegram: targets.telegram,
    reddit: targets.reddit,
    wa: targets.whatsapp,
    whatsapp: targets.whatsapp,
    linkedin: targets.linkedin,
    facebook: targets.facebook,
    email: targets.email,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
    threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`
  };
}

async function downloadCard(/** @type {any} */ cardEl, /** @type {any} */ toolId) {
  if (!cardEl) {
    showToast('Card export is not available on this page.', 'error');
    return;
  }

  try {
    const result = await exportShareCard(cardEl, {
      fileToken: toolId || 'result',
      backgroundColor: '#1a2236',
      preferredScale: 2,
      maxPixels: 6500000
    });
    if (!result.ok) {
      showToast('Card export is not available on this page.', 'error');
      return;
    }
    downloadCanvas(result.canvas, result.filename);
    showToast('Result card saved.', 'success');
  } catch {
    showToast('Card export failed.', 'error');
  }
}

function openShare(/** @type {any} */ url) {
  try {
    const parsed = new URL(url, window.location.origin);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return;
    }
    window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
  } catch {
    // noop
  }
}

function showChallengeProgress(/** @type {any} */ update) {
  const messages = getChallengeToastMessages(update?.challengeUpdate);
  messages.forEach((/** @type {any} */ message, /** @type {any} */ index) => {
    setTimeout(() => showToast(message, 'success'), index * 250);
  });
}

export function wireResultActions(/** @type {any} */ {
  root = document,
  cardEl,
  toolId,
  shareUrl,
  shareText
}) {
  const links = buildShareLinks(shareText, shareUrl);

  root.querySelectorAll('[data-share-platform]').forEach((/** @type {any} */ btn) => {
    if (btn.dataset.wired === 'true') return;
    btn.dataset.wired = 'true';
    btn.addEventListener('click', () => {
      const platform = btn.dataset.sharePlatform;
      const link = (/** @type {any} */ (links))[platform];
      if (!link) return;
      const update = markShare();
      showChallengeProgress(update);
      openShare(link);
    });
  });

  const /** @type {any} */ copyBtn = root.querySelector('#eon-copy-btn');
  if (copyBtn && copyBtn.dataset.wired !== 'true') {
    copyBtn.dataset.wired = 'true';
    copyBtn.addEventListener('click', () => {
      const update = markShare();
      showChallengeProgress(update);
      copyToClipboard(shareUrl);
    });
  }

  const /** @type {any} */ dlBtn = root.querySelector('#eon-dl-btn');
  if (dlBtn && dlBtn.dataset.wired !== 'true') {
    dlBtn.dataset.wired = 'true';
    dlBtn.addEventListener('click', () => downloadCard(cardEl, toolId));
  }
}
