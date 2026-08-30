document.addEventListener('DOMContentLoaded', async () => {
  try {
    const badge = new window.ProviderStatusBadge('studio-provider-chip-di', { compact: true, showReputation: true, clickable: true });
    await badge.update();
  } catch {}

  try {
    window.getAvailableModelsForStudio = async () => await window.DistributedInferenceIntegration.getAvailableModels();
    window.submitStudioInference = async (/** @type {string} */ prompt, maxTokens = 1000) => {
      const models = await window.getAvailableModelsForStudio();
      if (!models?.length) return null;
      return await window.DistributedInferenceIntegration.submitInference({
        modelId: models[0].modelId,
        prompt,
        maxTokens
      });
    };
  } catch {}
});
