/** W400/W402 — conservative local creator media setup guidance. */
import { buildCreatorTaskPlan, CREATOR_TASKS } from '../creator/creator-engine-registry.js';

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function badgeFor(plan) {
  const local = plan.modes.find((mode) => mode.id === 'local-runtime');
  if (local?.available && local.state === 'advanced') return 'Advanced local path';
  if (local?.available) return 'Possible local path';
  return 'Cloud / draft first';
}

export function buildCreatorMediaCatalog(profile, options = {}) {
  const localRuntimeDetected = Boolean(options.localRuntimeDetected);
  const entries = CREATOR_TASKS
    .filter((task) => task.id !== 'content-package')
    .map((task) => buildCreatorTaskPlan(task.id, { profile, localRuntimeDetected }));
  return Object.freeze({
    schema: 'eonapp.creator-media-catalog.v1',
    profileLabel: profile?.label || 'Current device',
    entries,
    rules: Object.freeze([
      'Choose a runtime and models yourself from official or trusted sources; EONAPP does not auto-install or auto-download them.',
      'Treat image-to-video and full video as advanced workflows. A capable GPU does not guarantee a model, workflow, storage budget, or render time.',
      'Keep raw footage, cache files, and temporary renders out of long-term browser storage. A future proved final output becomes a save-first Post Pack for manual export/share; it never connects an account or posts automatically.'
    ])
  });
}

export function renderCreatorMediaCatalog(profile, options = {}) {
  const catalog = buildCreatorMediaCatalog(profile, options);
  return `<section id="creator-media-routes" class="local-ai-catalog-card local-ai-creator-media" aria-labelledby="local-ai-creator-media-title"><div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">Creator media routes</p><h2 id="local-ai-creator-media-title">Image and video, matched to this device</h2><p>Start with a brief, then choose a local runtime only where the device fit is realistic. Connected media APIs are designed for Vault-only setup later; this page never asks for their keys.</p></div><a class="local-ai-secondary" href="/workspace#creator-engine">Open Creator Engine</a></div><div class="local-ai-profile-grid">${catalog.entries.map((plan) => { const local = plan.modes.find((mode) => mode.id === 'local-runtime'); return `<article class="local-ai-profile is-${local?.available ? 'good' : 'careful'}"><div><span class="local-ai-fit">${escapeHtml(badgeFor(plan))}</span><h3>${escapeHtml(plan.task.label)}</h3><p>${escapeHtml(plan.task.output)}</p></div><p class="local-ai-profile-work">Local rail · ${escapeHtml(plan.task.localRail)}</p><p class="local-ai-profile-reason">${escapeHtml(local?.reason || plan.workload.reason)}</p><p class="local-ai-runtime-note">Connected rail · ${escapeHtml(plan.task.providerRail)}. Not connected in this release.</p><div class="local-ai-actions"><a class="local-ai-secondary" href="/workspace#creator-engine">Prepare a brief</a><a class="local-ai-secondary is-quiet" href="/vault#api-keys">Vault-only provider setup</a></div></article>`; }).join('')}</div><ul class="local-ai-disclosure">${catalog.rules.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
}
