/** W319 — foreground-only guided workflow blueprints. */

import { getEonKernelRoleProfile } from './eon-role-profiles.js';

export const EON_GUIDED_WORKFLOW_SCHEMA = 'eonapp.guided-workflow.v1';

function clean(value = '', max = 120) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeSteps(profile, taskClass = 'chat') {
  const first = profile.role === 'reviewer' ? 'Review the local request boundary' : `Prepare ${taskClass.replace(/-/g, ' ')} draft`;
  return Object.freeze([
    Object.freeze({ stepId: 'scope', role: profile.role, label: clean(first, 96), status: 'ready', externalEffect: false }),
    Object.freeze({ stepId: 'review', role: 'reviewer', label: 'Show a local review summary', status: 'waiting-user', externalEffect: false }),
    Object.freeze({ stepId: 'export', role: 'coordinator', label: 'Offer manual export or canonical surface', status: 'manual-only', externalEffect: false })
  ]);
}

export function createGuidedWorkflowBlueprint({ taskId = '', taskClass = 'chat', role = 'coordinator', now = Date.now() } = {}) {
  const normalizedTaskId = String(taskId || '').trim();
  if (!/^eontask_[a-z0-9_-]{12,120}$/i.test(normalizedTaskId)) throw new Error('A guided workflow needs an opaque local task ID.');
  const profile = getEonKernelRoleProfile(role);
  return Object.freeze({
    schema: EON_GUIDED_WORKFLOW_SCHEMA,
    version: 1,
    workflowId: `eonflow_${normalizedTaskId.slice('eontask_'.length)}`,
    taskId: normalizedTaskId,
    taskClass: clean(taskClass, 48) || 'chat',
    state: 'ready',
    foregroundOnly: true,
    backgroundAfterClose: false,
    externalEffect: false,
    pauseOnTabClose: true,
    resumeRequiresUserAction: true,
    createdAt: new Date(Number(now)).toISOString(),
    steps: safeSteps(profile, taskClass)
  });
}

export function getGuidedWorkflowTruth() {
  return Object.freeze({
    schema: EON_GUIDED_WORKFLOW_SCHEMA,
    foregroundOnly: true,
    backgroundAfterClose: false,
    autoResume: false,
    providerCall: false,
    externalExecution: false,
    manualExportOnly: true
  });
}
