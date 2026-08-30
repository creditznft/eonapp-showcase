/**
 * browser-di-init.js
 * CSP-safe DI bootstrap for eon-browser page.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const win = /** @type {any} */ (window);
  if (!win.getLocalRuntimeDetector || !win.ProviderStatusBadge || !win.DistributedInferenceIntegration) return;

  const detector = win.getLocalRuntimeDetector();
  const statusHtml = detector.renderStatusHTML();
  const /** @type {any} */
statusDiv = document.getElementById('browser-local-status');
  if (statusDiv) statusDiv.innerHTML = statusHtml;

  const badge = new win.ProviderStatusBadge('browser-provider-badge', {
    compact: true,
    showReputation: true,
    clickable: true
  });
  await badge.update();

  /**
   * @param {any} model
   * @returns {string[]}
   */
  function inferModelCapabilities(model) {
    const haystack = `${String(model?.modelId || '')} ${String(model?.name || '')} ${Array.isArray(model?.tags) ? model.tags.join(' ') : ''}`.toLowerCase();
    const caps = new Set(['text']);
    if (/(code|coder|codex|starcoder|codestral|qwen.*coder|phi.*code|devstral|tabby|github)/.test(haystack)) caps.add('code');
    if (/(reason|think|math|o1|o3|o4|qwq|r1|large|70b|72b|405b|pro)/.test(haystack)) caps.add('reasoning');
    if (/(vision|vl|llava|pixtral|gemini|gpt-4o|claude|multimodal|image)/.test(haystack)) caps.add('vision');
    if (/(tool|function|instruct|hermes|command|mistral|qwen)/.test(haystack)) caps.add('tools');
    if (/(multilingual|translate|aya|qwen|mistral|gemma|deepseek|bloom|jan|ollama|lm studio)/.test(haystack)) caps.add('multilingual');
    return [...caps];
  }

  /**
   * @param {any} model
   * @param {string[]} requiredCaps
   */
  function scoreModelForTask(model, requiredCaps) {
    const caps = inferModelCapabilities(model);
    const matches = requiredCaps.filter((cap) => caps.includes(cap)).length;
    let score = requiredCaps.length ? matches / requiredCaps.length : 0;
    if (model?.free) score += 0.15;
    if (Array.isArray(model?.tags) && model.tags.includes('local')) score += 0.1;
    if (Number(model?.contextLength || 0) >= 64000) score += 0.05;
    return score;
  }

  /**
   * @param {any[]} models
   * @param {'browser' | 'code' | 'creator' | 'local'} task
   */
  function chooseBestModel(models, task) {
    const taskCaps = {
      browser: ['text', 'reasoning', 'tools'],
      code: ['code', 'tools', 'reasoning'],
      creator: ['text', 'vision', 'multilingual'],
      local: ['text']
    };
    const caps = taskCaps[task] || taskCaps.browser;
    return [...models]
      .map((model) => ({ model, score: scoreModelForTask(model, caps) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.model.free !== b.model.free) return a.model.free ? -1 : 1;
        return String(a.model.name || a.model.modelId || '').localeCompare(String(b.model.name || b.model.modelId || ''));
      })[0]?.model || null;
  }

  win.getAvailableModelsForBrowser = async () => await win.DistributedInferenceIntegration.getAvailableModels();
  win.getBestBrowserModelForTask = async (/** @type {'browser' | 'code' | 'creator' | 'local'} */ task = 'browser') => {
    const models = await win.getAvailableModelsForBrowser();
    return chooseBestModel(Array.isArray(models) ? models : [], task);
  };
  win.submitBrowserInference = async (/** @type {string} */ prompt, /** @type {number} */ maxTokens = 500) => {
    const models = await win.getAvailableModelsForBrowser();
    if (!models?.length) return null;
    const task = /(code|build|fix|website|app|javascript|typescript|html|css|monaco)/i.test(String(prompt || ''))
      ? 'code'
      : /(video|music|image|subtitle|publish|create|creative)/i.test(String(prompt || ''))
        ? 'creator'
        : 'browser';
    const selected = chooseBestModel(models, task) || models[0];
    return await win.DistributedInferenceIntegration.submitInference({
      modelId: selected.modelId || selected.id,
      prompt,
      maxTokens
    });
  };
});
