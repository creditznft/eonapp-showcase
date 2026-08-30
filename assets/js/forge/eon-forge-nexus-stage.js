/** W662H — truthful Forge stage path for the shared Nexus visual language. */
export const EON_FORGE_NEXUS_STAGE_SCHEMA = 'eon.forge.nexus-stage.w662h.v1';

const STAGES = Object.freeze([
  ['request', 'Request'],
  ['plan', 'Plan'],
  ['files', 'Files'],
  ['generate', 'Generate'],
  ['validate', 'Validate'],
  ['preview', 'Preview'],
  ['approval', 'Approval']
]);

function statusFor(id, context = {}) {
  const hasProject = context.projectSelected === true;
  const hasFiles = Math.max(0, Number(context.fileCount) || 0) > 0;
  const aiState = String(context.aiStatus || 'idle');
  const hasProposal = context.proposalReady === true || aiState === 'proposal-ready';
  const validation = context.validation || {};
  const checked = validation.checked === true;
  const errors = Math.max(0, Number(validation.errorCount) || 0);
  const previewReady = context.previewReady === true || hasFiles;
  if (id === 'request') return hasProject ? 'complete' : 'active';
  if (id === 'plan') return hasProject ? 'complete' : 'waiting';
  if (id === 'files') return hasFiles ? 'complete' : hasProject ? 'active' : 'waiting';
  if (id === 'generate') {
    if (aiState === 'requesting') return 'active';
    if (hasProposal || aiState === 'applied') return 'complete';
    return hasFiles ? 'available' : 'waiting';
  }
  if (id === 'validate') {
    if (!checked) return hasFiles ? 'available' : 'waiting';
    return errors ? 'needs-attention' : 'complete';
  }
  if (id === 'preview') return previewReady ? 'complete' : 'waiting';
  if (id === 'approval') return hasProposal ? 'active' : aiState === 'applied' ? 'complete' : 'waiting';
  return 'waiting';
}

export function getEonForgeNexusStageModel(context = {}) {
  const stages = STAGES.map(([id, label], index) => Object.freeze({
    id,
    label,
    order: index + 1,
    status: statusFor(id, context)
  }));
  const active = stages.find((stage) => stage.status === 'active')
    || stages.find((stage) => stage.status === 'needs-attention')
    || stages.find((stage) => stage.status === 'available')
    || stages.at(-1);
  return Object.freeze({
    schema: EON_FORGE_NEXUS_STAGE_SCHEMA,
    stages: Object.freeze(stages),
    activeStageId: active?.id || 'request',
    startsProviderRequest: false,
    appliesChanges: false,
    deploys: false,
    truthfulStateOnly: true
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

export function renderEonForgeNexusStage(context = {}) {
  const model = getEonForgeNexusStageModel(context);
  return `<section class="eon-forge-nexus-stage" data-eon-forge-nexus-stage="${escapeHtml(model.activeStageId)}" aria-label="Forge workflow stage"><div class="eon-forge-nexus-stage__orb" aria-hidden="true"><span></span></div><ol>${model.stages.map((stage) => `<li data-stage="${escapeHtml(stage.id)}" data-status="${escapeHtml(stage.status)}"${stage.id === model.activeStageId ? ' aria-current="step"' : ''}><span>${stage.order}</span><strong>${escapeHtml(stage.label)}</strong><small>${escapeHtml(stage.status.replace(/-/g, ' '))}</small></li>`).join('')}</ol></section>`;
}

export default Object.freeze({
  EON_FORGE_NEXUS_STAGE_SCHEMA,
  getEonForgeNexusStageModel,
  renderEonForgeNexusStage
});
