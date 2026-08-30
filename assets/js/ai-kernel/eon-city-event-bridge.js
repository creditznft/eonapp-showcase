/** W320 — redacted bridge from EON Kernel task facts to the existing City mirror. */

import { recordAgentPresence } from '../operator/agent-presence.js';
import { getEonKernelRoleProfile } from './eon-role-profiles.js';

const STATUS_MAP = Object.freeze({
  draft: Object.freeze({ status: 'ready', phase: 'planning' }),
  ready: Object.freeze({ status: 'ready', phase: 'planning' }),
  running: Object.freeze({ status: 'active', phase: 'working' }),
  'review-needed': Object.freeze({ status: 'waiting', phase: 'waiting-approval' }),
  completed: Object.freeze({ status: 'complete', phase: 'complete' }),
  failed: Object.freeze({ status: 'failed', phase: 'failed' }),
  paused: Object.freeze({ status: 'waiting', phase: 'waiting-approval' }),
  cancelled: Object.freeze({ status: 'failed', phase: 'failed' })
});

export function recordEonKernelCityMirror({ task = {}, role = 'coordinator', providerId = 'guide', now = Date.now() } = {}, { storage } = {}) {
  const taskId = String(task?.taskId || '').trim();
  if (!/^eontask_[a-z0-9_-]{12,120}$/i.test(taskId)) return Object.freeze({ ok: false, reason: 'invalid-task-id', entry: null });
  const profile = getEonKernelRoleProfile(role);
  const mapped = STATUS_MAP[String(task?.state || 'ready')] || STATUS_MAP.ready;
  return recordAgentPresence({
    source: 'eon-ai-kernel',
    workRef: taskId,
    role: profile.cityRole,
    action: profile.cityAction,
    status: mapped.status,
    phase: mapped.phase,
    // A bounded selected-provider ID may drive an opt-in local City visual.
    // No model, endpoint, credential, account, prompt or output is accepted.
    providerId,
    createdAt: task?.createdAt || new Date(Number(now)).toISOString(),
    updatedAt: task?.updatedAt || new Date(Number(now)).toISOString()
  }, { storage });
}

export function getEonKernelCityBridgeTruth() {
  return Object.freeze({
    source: 'eon-ai-kernel',
    rawPrompt: false,
    rawOutput: false,
    modelName: false,
    providerCredential: false,
    selectedProviderIdentityOptInOnly: true,
    externalEffect: false,
    cityCanApprove: false,
    cityCanExecute: false
  });
}
