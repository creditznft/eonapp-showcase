/**
 * Chat deferred enhancements — W228 + W736A.
 *
 * This file intentionally adds only delayed accessibility, language, truthful
 * search metadata only. Quick Command is the sole persistent frontend launcher;
 * this file must not load legacy EON Nexus, distributed-inference, token,
 * marketplace, provider-earnings, background-agent runtimes, Babylon.js or GLB assets.
 */
function scheduleIdle(task, timeout = 3000, fallbackDelay = 2000) {
  let started = false;
  let fallbackTimer = 0;
  const runOnce = () => {
    if (started) return;
    started = true;
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    try {
      const result = task();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {}
  };
  fallbackTimer = window.setTimeout(runOnce, fallbackDelay);
  if ('requestIdleCallback' in window) window.requestIdleCallback(runOnce, { timeout });
}

function appendJsonLd(payload) {
  const node = document.createElement('script');
  node.type = 'application/ld+json';
  node.text = JSON.stringify(payload);
  document.head.appendChild(node);
}

function installStructuredData() {
  const chatUrl = 'https://eonapp.ch/chat';
  appendJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'EONAPP', item: 'https://eonapp.ch/chat' },
      { '@type': 'ListItem', position: 2, name: 'EONBOT', item: chatUrl }
    ]
  });
  appendJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'EONBOT · EONAPP',
    url: chatUrl,
    description: 'EONBOT is a chat-first local workdesk. Guide mode is available without a connection; Local and Connected modes are shown only after explicit setup proof.',
    publisher: { '@type': 'Organization', name: 'EONAPP', url: 'https://eonapp.ch/chat' }
  });
  appendJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What can EONBOT do?',
        acceptedAnswer: { '@type': 'Answer', text: 'EONBOT can provide product guidance, help plan local work, and open focused EONAPP tools. Model-powered replies are shown only when a tested local runtime or separately configured provider is ready.' }
      },
      {
        '@type': 'Question',
        name: 'How does Local AI work?',
        acceptedAnswer: { '@type': 'Answer', text: 'You choose and install a compatible local runtime yourself, then run an explicit browser self-test. Local mode does not browse, publish, trade, send messages, or continue after the browser closes.' }
      },
      {
        '@type': 'Question',
        name: 'Where are provider credentials managed?',
        acceptedAnswer: { '@type': 'Answer', text: 'EONBOT does not accept credentials in chat. Optional provider configuration belongs in Vault and requires a separate user action.' }
      }
    ]
  });
}

async function runDeferredRuntimeI18n() {
  const lang = document?.documentElement?.lang || localStorage.getItem('eonapp_language') || 'en';
  if (!lang || lang === 'en') return;
  const { translateForUser } = await import('/assets/js/utils/multi-language.js');
  async function rt(text) {
    try { return await translateForUser(String(text || ''), { toLang: lang, category: 'guide' }); }
    catch { return String(text || ''); }
  }
  for (const el of document.querySelectorAll('[data-runtime-i18n]')) el.textContent = await rt(el.getAttribute('data-runtime-i18n') || '');
  for (const el of document.querySelectorAll('[data-runtime-i18n-aria-label]')) el.setAttribute('aria-label', await rt(el.getAttribute('data-runtime-i18n-aria-label') || ''));
  for (const el of document.querySelectorAll('[data-runtime-i18n-placeholder]')) el.setAttribute('placeholder', await rt(el.getAttribute('data-runtime-i18n-placeholder') || ''));
}

function clearShellPending() {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.body.classList.remove('page-shell-pending')));
}

installStructuredData();
const boot = () => {
  // W736A: Quick Command owns the persistent command-launcher role. Historical
  // Chat Nexus modules remain in source for archaeology but are not auto-mounted.
  scheduleIdle(() => import('/assets/js/utils/accessibility-autoload.js'), 4000, 2800);
  scheduleIdle(runDeferredRuntimeI18n, 4500, 3200);
  clearShellPending();
};
if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot, { once: true });
