// W127 Button Truth Guard
// Lightweight runtime safety net: critical user-facing links must either route
// somewhere real or explain why the action is unavailable. It never grants
// rewards, never bypasses auth, and never changes Telegram/Monetag proof rules.

const DEAD_HREF_RE = /^(#|javascript:|)$/i;
const INTERNAL_HASH_OK = (href) => href.startsWith('#') && href.length > 1 && document.getElementById(href.slice(1));

function makeToast() {
  let toast = document.getElementById('eon-button-truth-toast');
  if (toast) return toast;
  toast = document.createElement('div');
  toast.id = 'eon-button-truth-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = 'position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);z-index:99999;max-width:min(92vw,520px);padding:.75rem 1rem;border:1px solid rgba(103,232,249,.38);border-radius:18px;background:rgba(2,6,23,.94);color:#e5f7ff;box-shadow:0 18px 60px rgba(0,0,0,.42);font:600 14px/1.35 system-ui,sans-serif;display:none';
  document.body.appendChild(toast);
  return toast;
}

let toastTimer = 0;
function showToast(message) {
  const toast = makeToast();
  toast.textContent = message;
  toast.style.display = 'block';
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.style.display = 'none'; }, 3200);
}

function labelFor(el) {
  return String(el.getAttribute('aria-label') || el.textContent || el.id || 'This action').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function markDeadAnchor(anchor) {
  anchor.dataset.eonButtonTruth = 'dead-link-guarded';
  anchor.setAttribute('aria-disabled', 'true');
  anchor.addEventListener('click', (event) => {
    event.preventDefault();
    showToast(`${labelFor(anchor)} is not available yet. Open Workstation or ask EONBOT for the safe route.`);
  });
}

export function initButtonTruthGuard(root = document) {
  const anchors = Array.from(root.querySelectorAll('a[href]'));
  let guarded = 0;
  for (const anchor of anchors) {
    const href = String(anchor.getAttribute('href') || '').trim();
    if (!DEAD_HREF_RE.test(href)) continue;
    if (INTERNAL_HASH_OK(href)) continue;
    if (anchor.dataset.allowDeadLink === 'true' || anchor.dataset.w127SafeFallback) continue;
    markDeadAnchor(anchor);
    guarded += 1;
  }
  document.documentElement.dataset.eonButtonTruthGuard = 'active';
  document.documentElement.dataset.eonButtonTruthGuarded = String(guarded);
  return { guarded };
}

if (typeof window !== 'undefined') {
  const run = () => initButtonTruthGuard(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
