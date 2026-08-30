/** W400/W402 — Canonical Workspace Creator Engine surface. */
import { ApiKeyVault } from '../utils/api-key-vault.js';
import { detectLocalAiCapabilityProfile } from '../utils/local-ai-capability-matrix.js';
import { buildCreatorEngineOverview, buildCreatorTaskPlan, CREATOR_TASKS } from './creator-engine-registry.js';

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function vaultSummary() {
  try {
    const status = ApiKeyVault.status();
    const count = Array.isArray(status?.providers) ? status.providers.length : 0;
    return Object.freeze({ count, encryptedEntries: Boolean(status?.hasEncryptedEntries) });
  } catch {
    return Object.freeze({ count: 0, encryptedEntries: false });
  }
}

function taskCard(plan) {
  const draft = plan.modes.find((mode) => mode.id === 'draft-only');
  const local = plan.modes.find((mode) => mode.id === 'local-runtime');
  const provider = plan.modes.find((mode) => mode.id === 'byok-provider');
  const localState = local?.available ? (local.state === 'advanced' ? 'Advanced local candidate' : 'Local candidate') : 'Keep local conservative';
  return `<article class="eon-creator-engine-task" data-creator-engine-task="${escapeHtml(plan.task.id)}"><div><p class="eon-creator-engine-eyebrow">${escapeHtml(plan.task.workloadId.replaceAll('-', ' '))}</p><h3>${escapeHtml(plan.task.label)}</h3><p>${escapeHtml(plan.task.output)}</p></div><dl><div><dt>Now</dt><dd>${escapeHtml(draft?.label || 'Draft and package')}</dd></div><div><dt>Device path</dt><dd>${escapeHtml(localState)}</dd></div><div><dt>Connected path</dt><dd>${escapeHtml(provider?.state?.replaceAll('-', ' ') || 'Not connected')}</dd></div></dl><p class="eon-creator-engine-reason">${escapeHtml(local?.reason || plan.workload.reason)}</p><div class="eon-creator-engine-actions"><button type="button" class="eon-record-button" data-creator-engine-brief="${escapeHtml(plan.task.id)}">Draft with EONBOT</button><a class="eon-record-button" href="/local-ai#creator-media">Check local media path</a></div></article>`;
}

export function renderCreatorEngineWorkspace(options = {}) {
  const profile = options.profile || detectLocalAiCapabilityProfile();
  const vault = vaultSummary();
  const overview = buildCreatorEngineOverview({ profile, localRuntimeDetected: false });
  const vaultNote = vault.encryptedEntries
    ? `${vault.count} encrypted provider entr${vault.count === 1 ? 'y is' : 'ies are'} present in this browser. That does not verify a creator-media adapter.`
    : 'No encrypted provider entry is present for this browser. Creator provider setup remains disabled here.';
  return `<section class="eon-hub-card eon-hub-card-full eon-creator-engine" aria-labelledby="eon-creator-engine-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Creator planning · Workspace</p><h2 id="eon-creator-engine-title">Plan here, execute in Create</h2><p>Prepare image, video, music, voice, and campaign work here without triggering generation. Real user-triggered Local and Direct BYOK media controls live in Create; Local AI setup can reuse approved runtimes already installed on the device or offer Local Lite; third-party software/model downloads remain explicit and provider credentials stay outside this Workspace surface.</p></div><span class="eon-record-status">Draft-first</span></div><div class="eon-creator-engine-summary"><article><span>Device route</span><strong>${escapeHtml(profile.label)}</strong><p>${escapeHtml(profile.summary)}</p></article><article><span>Local creator media</span><strong>Continue in Create</strong><p>ComfyUI image/video and local music rails remain device-dependent and proof-gated.</p></article><article><span>Connected provider</span><strong>Continue in Create</strong><p>${escapeHtml(vaultNote)} Direct BYOK execution, when configured, is reviewed and user-triggered from Create rather than this planner.</p></article></div><div class="eon-creator-engine-actions"><button type="button" class="eon-hub-primary" data-creator-engine-brief="content-package">Start a creator brief</button><a class="eon-record-button" href="/create">Open Create</a><a class="eon-record-button" href="/local-ai#creator-media">Check local media setup</a><a class="eon-record-button" href="/forge">Open Forge for code and sites</a></div><p class="eon-record-form-note">This Workspace planner itself never installs a model, reads a provider credential, uploads media, starts generation, or publishes. Move to Create only when you want to review and explicitly run an established execution rail.</p><div class="eon-creator-engine-grid">${overview.taskPlans.map(taskCard).join('')}</div></section>`;
}

function promptFor(taskId = '') {
  const task = buildCreatorTaskPlan(taskId);
  return `Help me prepare a ${task.task.label.toLowerCase()} brief for a creator. Ask one focused question at a time. Keep it truthful: make a local draft and plan, do not claim that a provider, local model, upload, render, or social post has happened. Device guidance: ${task.workload.reason}`;
}

export function bindCreatorEngineWorkspace(root, { onOpenChat } = {}) {
  root?.querySelectorAll?.('[data-creator-engine-brief]').forEach((button) => button.addEventListener('click', () => {
    const taskId = button.dataset.creatorEngineBrief || CREATOR_TASKS[0].id;
    if (typeof onOpenChat === 'function') onOpenChat(promptFor(taskId));
  }));
}

export function getCreatorEngineWorkspaceTruth() {
  return Object.freeze({
    canonicalSurface: 'Workspace',
    canonicalExecutionSurface: '/create',
    workspaceRole: 'planning-and-handoff',
    legacyCreatorStudioRoute: false,
    mediaProviderCalls: false,
    credentialsCollectedHere: false,
    localModelInstallation: false,
    externalPublishing: false,
    vaultOnlyCredentialBoundary: true
  });
}
