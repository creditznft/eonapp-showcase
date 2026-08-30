/**
 * CSP-safe Market bootstrap.
 * Hydrates the generated NFT catalog from an external module so strict CSP does not block /market.
 */
const runIdle = window.requestIdleCallback || ((callback, options = {}) => {
  const timeout = Number(options?.timeout || 900);
  return window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 }), timeout);
});

const bootMarket = () => {
  runIdle(() => {
    import('/assets/js/market-page.js').catch(() => {});
  }, { timeout: 900 });
  runIdle(() => {
    import('/assets/js/utils/accessibility-autoload.js').catch(() => {});
  }, { timeout: 4500 });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootMarket, { once: true });
} else {
  bootMarket();
}
