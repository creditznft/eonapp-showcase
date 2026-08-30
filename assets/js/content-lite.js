import { registerEonServiceWorker } from './utils/eon-service-worker-registration.js';

/**
 * W105 lightweight content-route bootstrap.
 * Keeps blog and preserved compatibility routes fast by avoiding the full app shell/i18n bundle.
 * These pages are static, link-forwarding surfaces; app routes keep the full shell.
 */
(function initEonContentLite() {
  const root = document.documentElement;
  root.setAttribute('data-theme', 'dark');
  try { localStorage.setItem('eon:theme', 'dark'); } catch {}

  const markCurrent = () => {
    const path = (location.pathname || '/').replace(/\/$/, '') || '/';
    document.querySelectorAll('a[href]').forEach((link) => {
      try {
        const url = new URL(link.getAttribute('href') || '', location.origin);
        const linkPath = url.pathname.replace(/\/$/, '') || '/';
        if (linkPath === path) link.setAttribute('aria-current', 'page');
      } catch {}
    });
  };

  const enableFocusMode = () => {
    let keyboard = false;
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        keyboard = true;
        root.classList.add('user-is-tabbing');
      }
    }, { passive: true });
    window.addEventListener('pointerdown', () => {
      if (keyboard) root.classList.remove('user-is-tabbing');
      keyboard = false;
    }, { passive: true });
  };

  const boot = () => {
    markCurrent();
    enableFocusMode();
    if ('serviceWorker' in navigator && !document.body?.dataset?.noServiceWorker) {
      void registerEonServiceWorker();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
