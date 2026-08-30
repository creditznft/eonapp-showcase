const loadCreatorStudio = () => import('./creator-studio-page.js');

function scheduleImport() {
  const run = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => { void loadCreatorStudio().catch(() => {}); }, { timeout: 2000 });
      return;
    }
    window.setTimeout(() => { void loadCreatorStudio().catch(() => {}); }, 0);
  };

  if (document.readyState === 'complete') {
    run();
    return;
  }

  window.addEventListener('load', run, { once: true });
}

scheduleImport();
