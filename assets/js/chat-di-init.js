/**
 * chat-di-init.js
 * CSP-safe chat DI bootstrap and public helper APIs.
 */

const win = /** @type {any} */ (window);

// Keep chat DI APIs present even when DI integration loads late.
win.getAvailableModelsForChat = async () => {
  const di = win.DistributedInferenceIntegration;
  if (!di?.getAvailableModels) return [];
  try {
    return await di.getAvailableModels();
  } catch {
    return [];
  }
};

win.getModelRegistryForChat = (/** @type {any} */ query = '', /** @type {any} */ options = {}) => {
  const di = win.DistributedInferenceIntegration;
  if (!di?.getModelRegistry) return [];
  try {
    return di.getModelRegistry(query, options);
  } catch {
    return [];
  }
};

win.getChatModelQuote = (/** @type {any} */ modelId, /** @type {any} */ maxTokens = 2000) => {
  const di = win.DistributedInferenceIntegration;
  if (!di?.getMarketplaceQuote) return null;
  try {
    return di.getMarketplaceQuote(modelId, { maxTokens });
  } catch {
    return null;
  }
};

win.submitChatInference = async (/** @type {any} */ prompt) => {
  const di = win.DistributedInferenceIntegration;
  if (!di?.submitInference) return null;
  const models = await win.getAvailableModelsForChat();
  if (!models?.length) return null;
  const bestModel = models[0].modelId;
  const quote = win.getChatModelQuote(bestModel, 2000);
  const submission = await di.submitInference({
    modelId: bestModel,
    prompt,
    maxTokens: 2000
  });
  return submission ? { ...submission, quote } : null;
};

let badgeMounted = false;

async function mountProviderBadge() {
  if (badgeMounted) return;
  if (!win.ProviderStatusBadge || !win.DistributedInferenceIntegration) return;
  const badge = new win.ProviderStatusBadge('chat-provider-badge', {
    compact: false,
    showReputation: true,
    clickable: true
  });
  await badge.update();
  badgeMounted = true;
}

async function initChatDI() {
  if (badgeMounted) return;
  for (let i = 0; i < 8 && !badgeMounted; i += 1) {
    try {
      await mountProviderBadge();
    } catch {
      // Retry a few ticks in case globals are still booting.
    }
    if (!badgeMounted) {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initChatDI();
  }, { once: true });
} else {
  void initChatDI();
}
