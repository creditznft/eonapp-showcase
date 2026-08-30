const loadWorkbench = () => import('./workbench-page.js');

function scheduleImport() {
  const run = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => { void loadWorkbench().catch(() => {}); }, { timeout: 2000 });
      return;
    }
    window.setTimeout(() => { void loadWorkbench().catch(() => {}); }, 0);
  };

  if (document.readyState === 'complete') {
    run();
    return;
  }

  window.addEventListener('load', run, { once: true });
}

scheduleImport();
