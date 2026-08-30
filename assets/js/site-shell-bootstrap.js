/**
 * Keep legacy document routes interactive before optional shell enhancement
 * arrives.  The shell has share, realm and City helpers behind it, so a static
 * import causes Vite to module-preload that whole graph on lightweight pages
 * such as Billing.  Load it once the document is usable instead.
 */
function startSiteShell() {
  return import('./utils/site-shell.js')
    .then(({ initSiteShell }) => initSiteShell())
    .catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startSiteShell, { once: true });
} else {
  void startSiteShell();
}
