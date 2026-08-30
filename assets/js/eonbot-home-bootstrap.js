/**
 * V01 — keep the guest-first EONBOT landing surface small and responsive.
 *
 * The home document intentionally ships only its semantic, styled composer.
 * The complete chat runtime, shell, optional AI setup and local-file/voice
 * integrations are fetched on the user's first relevant interaction. This is
 * a route-level split, not a feature removal: the interaction is replayed
 * after hydration and the same maintained modules own the resulting action.
 */
// Keep the route split while letting Vite rewrite every stylesheet to its
// emitted content-addressed asset. Manually appended source paths are not
// present in a production dist directory and result in MIME-rejected HTML.
const DEFERRED_STYLES = Object.freeze([
  () => import('../css/layout.css'),
  () => import('../css/components.css'),
  () => import('../css/chat.css'),
  () => import('../css/eon-app-shell.css'),
  () => import('../css/eon-chat-first.css'),
  () => import('../css/eon-continue.css')
]);

let hydration = null;
let shellHydration = null;
let stylesHydration = null;

function addDeferredStyles() {
  if (stylesHydration) return stylesHydration;
  stylesHydration = Promise.all(DEFERRED_STYLES.map((load) => load())).then(() => true);
  return stylesHydration;
}

function hydrateShell() {
  if (shellHydration) return shellHydration;
  shellHydration = addDeferredStyles().then(() => Promise.all([
    import('./eon-app-shell.js'),
    import('./chat-page-deferred.js')
  ])).then(() => true);
  return shellHydration;
}

function hydrateHome() {
  if (hydration) return hydration;
  hydration = Promise.all([
    hydrateShell(),
    import('./chat-page.js'),
    import('./eonbot-home.js')
  ]).then(() => {
    document.body.dataset.eonbotHydrated = 'true';
    return true;
  });
  return hydration;
}

function scheduleShellHydration() {
  const load = () => { void hydrateShell(); };
  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 900 });
  else window.setTimeout(load, 350);
}

function setPromptAndFocus(prompt) {
  const input = document.getElementById('chat-input');
  if (!input) return;
  input.value = String(prompt || '').trim();
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function relevantTarget(target) {
  return target?.closest?.('#chat-send, #chat-attach, #chat-voice-send, #chat-voice-toggle, #chat-voice-mode, #chat-tts-toggle, [data-eonbot-home-prompt], [data-eon-chat-starter], [data-eonbot-home-open-setup]') || null;
}

document.addEventListener('focusin', (event) => {
  if (event.target?.id === 'chat-input') void hydrateHome();
}, true);

document.addEventListener('keydown', (event) => {
  if (document.body.dataset.eonbotHydrated === 'true' || event.target?.id !== 'chat-input' || event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  void hydrateHome().then(() => document.getElementById('chat-send')?.click());
}, true);

document.addEventListener('click', (event) => {
  if (document.body.dataset.eonbotHydrated === 'true') return;
  const target = relevantTarget(event.target);
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const prompt = target.getAttribute('data-eonbot-home-prompt') || target.getAttribute('data-eon-chat-starter');
  void hydrateHome().then(() => {
    if (prompt) {
      setPromptAndFocus(prompt);
      return;
    }
    document.getElementById(target.id)?.click();
  });
}, true);

window.addEventListener('eonbot:ask', (event) => {
  if (document.body.dataset.eonbotHydrated === 'true') return;
  const prompt = String(event?.detail?.prompt || '').trim();
  if (!prompt) return;
  void hydrateHome().then(() => {
    setPromptAndFocus(prompt);
    document.getElementById('chat-send')?.click();
  });
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleShellHydration, { once: true });
else scheduleShellHydration();
