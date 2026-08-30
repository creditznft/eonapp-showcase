import { getToolRouteForAction } from './utils/support-tools-footer-proof.js';


const TOOLS_ROUTER_READY_FLAG = '__EON_TOOLS_PAGE_ROUTER_READY__';

function installImmediateToolFallbacks() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest('[data-tool-action]');
    if (!trigger || window[TOOLS_ROUTER_READY_FLAG]) return;
    if (trigger.tagName === 'A') return;
    const action = trigger.getAttribute('data-tool-action') || '';
    const fallbackHref = trigger.getAttribute('data-fallback-href') || getToolRouteForAction(action);
    if (!fallbackHref || fallbackHref === '/tools.html') return;
    event.preventDefault();
    window.location.href = fallbackHref;
  }, true);
}

installImmediateToolFallbacks();

function scheduleIdle(task, timeout = 3000, fallbackDelay = 2000) {
  const run = () => {
    try {
      const result = task();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {}
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout });
  else window.setTimeout(run, fallbackDelay);
}

function appendJsonLd(payload) {
  const node = document.createElement('script');
  node.type = 'application/ld+json';
  node.text = JSON.stringify(payload);
  document.head.appendChild(node);
}

function clearShellPending() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.body.classList.remove('page-shell-pending');
    });
  });
}

appendJsonLd({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'EONAPP Tools',
  url: 'https://eonapp.ch/tools.html',
  description: 'Tooling hub for creator and operator workflows.'
});

if (document.readyState === 'complete') {
  scheduleIdle(() => import('/assets/js/tool-page.js'), 2600, 1800);
  scheduleIdle(() => import('/assets/js/utils/accessibility-autoload.js'), 4500, 3200);
  clearShellPending();
} else {
  window.addEventListener('load', () => {
    scheduleIdle(() => import('/assets/js/tool-page.js'), 2600, 1800);
    scheduleIdle(() => import('/assets/js/utils/accessibility-autoload.js'), 4500, 3200);
    clearShellPending();
  }, { once: true });
}
