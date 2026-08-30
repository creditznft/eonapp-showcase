/**
 * W316–W320 — compatibility bridge to the single local-first EON AI Kernel.
 *
 * It creates only redacted foreground task facts. Existing Chat inference is
 * still direct user-selected/provider-configured behavior until later adapter
 * cutover; this bridge neither proxies a request nor stores the text/output it
 * sees. It stores only a SHA-256 artifact hash when a response is completed.
 */

import { createEonArtifact, createEonReviewRecord, createEonTaskGraph } from './eon-task-contract.js';
import { classifyEonKernelIntent, getEonKernelRoleProfile } from './eon-role-profiles.js';
import { createGuidedWorkflowBlueprint } from './eon-guided-workflow-blueprints.js';
import { recordEonKernelCityMirror } from './eon-city-event-bridge.js';
import { upsertEonKernelForegroundRecord } from './eon-ai-kernel-session-store.js';

const DEFAULT_PROJECT_ID = 'eonproj_chat_foreground';

function cryptoFor(candidate = null) {
  const api = candidate || globalThis.crypto;
  if (!api?.subtle?.digest || !api?.getRandomValues) throw new Error('Web Crypto is unavailable in this browser.');
  return api;
}

function toBase64Url(value) {
  let binary = '';
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  if (typeof btoa !== 'function') throw new Error('Base64 encoding is unavailable in this browser.');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function safeHash(value = '', cryptoApi = null) {
  const digest = await cryptoFor(cryptoApi).subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return `sha256:${toBase64Url(digest)}`;
}

function nowIso(now = Date.now()) { return new Date(Number(now)).toISOString(); }

function sessionRecord({ task, role, taskClass, workflow, artifact = null, review = null } = {}) {
  return Object.freeze({
    taskId: task.taskId,
    projectId: task.projectId,
    title: task.title,
    taskClass,
    role,
    state: task.state,
    privacyClass: task.privacyClass,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    artifactIds: artifact ? [artifact.artifactId] : [],
    reviewId: review?.reviewId || '',
    reviewStatus: review?.status || '',
    reviewExpiresAt: review?.expiresAt || '',
    workflowState: workflow?.state || ''
  });
}

function setTaskState(task, state, now = Date.now()) {
  const iso = nowIso(now);
  return Object.freeze({
    ...task,
    state,
    updatedAt: iso,
    nodes: Object.freeze(task.nodes.map((node) => Object.freeze({ ...node, state: state === 'completed' ? 'completed' : state === 'failed' ? 'failed' : state === 'review-needed' ? 'review-needed' : 'running', updatedAt: iso })))
  });
}

function classifyPrivacy(value = '') {
  return String(value || '') === 'direct-to-provider' ? 'direct-to-provider' : 'device-local';
}

export function beginEonKernelForegroundTask({ intentText = '', projectId = DEFAULT_PROJECT_ID, privacyClass = 'device-local', origin = 'chat', providerId = 'guide', now = Date.now() } = {}, { cryptoApi, sessionStorage, cityStorage } = {}) {
  const classification = classifyEonKernelIntent(intentText);
  const privacy = classifyPrivacy(privacyClass);
  const profile = getEonKernelRoleProfile(classification.role);
  const task = createEonTaskGraph({
    projectId,
    title: classification.safeLabel,
    state: classification.blocked ? 'review-needed' : 'running',
    privacyClass: privacy,
    nodes: [{ nodeId: 'foreground-kernel', role: profile.role === 'media-runner' ? 'media-runner' : profile.role, state: classification.blocked ? 'review-needed' : 'running', privacyClass: privacy, expectedArtifacts: ['local-summary'], foregroundOnly: true }]
  }, { now, cryptoApi });
  const workflow = createGuidedWorkflowBlueprint({ taskId: task.taskId, taskClass: classification.taskClass, role: profile.role, now });
  upsertEonKernelForegroundRecord(sessionRecord({ task, role: profile.role, taskClass: classification.taskClass, workflow }), { storage: sessionStorage });
  recordEonKernelCityMirror({ task, role: profile.role, providerId, now }, { storage: cityStorage });
  return Object.freeze({
    task,
    workflow,
    classification,
    // Bounded selected-provider metadata is for an explicit local City visual
    // preference only. It is never a model, endpoint, credential or account.
    cityProviderId: String(providerId || 'guide').toLowerCase().slice(0, 32),
    origin: String(origin || 'chat').slice(0, 48),
    routingDisclosure: privacy === 'direct-to-provider' ? 'Existing direct provider behavior remains user-selected; this kernel bridge does not proxy the request.' : 'Guide/local foreground planning only; no provider request was created.'
  });
}

export async function completeEonKernelForegroundTask(context = {}, { output = '', provenance = 'guide', truthLabel = 'drafted', requiresReview = false, providerId = '', now = Date.now(), cryptoApi, sessionStorage, cityStorage } = {}) {
  const task = context?.task;
  if (!task?.taskId) return Object.freeze({ ok: false, reason: 'invalid-task-context', task: null, artifact: null, review: null });
  const completedTask = setTaskState(task, requiresReview ? 'review-needed' : 'completed', now);
  const artifact = createEonArtifact({
    projectId: completedTask.projectId,
    taskId: completedTask.taskId,
    kind: 'chat-response',
    contentHash: await safeHash(output, cryptoApi),
    provenance: ['guide', 'local-runtime', 'direct-provider'].includes(provenance) ? provenance : 'guide',
    truthLabel: ['drafted', 'generated-locally', 'generated-by-selected-provider'].includes(truthLabel) ? truthLabel : 'drafted',
    reviewStatus: requiresReview ? 'review-needed' : 'unreviewed'
  }, { now, cryptoApi });
  const review = requiresReview ? createEonReviewRecord({ taskId: completedTask.taskId, artifactIds: [artifact.artifactId], status: 'review-needed', createdAt: nowIso(now), expiresAt: nowIso(Number(now) + 24 * 60 * 60 * 1000) }, { now, cryptoApi }) : null;
  const persisted = upsertEonKernelForegroundRecord(sessionRecord({ task: completedTask, role: context?.classification?.role || 'coordinator', taskClass: context?.classification?.taskClass || 'chat', workflow: context?.workflow, artifact, review }), { storage: sessionStorage });
  const city = recordEonKernelCityMirror({ task: completedTask, role: context?.classification?.role || 'coordinator', providerId: providerId || context?.cityProviderId || 'guide', now }, { storage: cityStorage });
  return Object.freeze({ ok: persisted.ok, reason: persisted.reason, task: completedTask, artifact, review, city });
}

export function failEonKernelForegroundTask(context = {}, { now = Date.now(), sessionStorage, cityStorage } = {}) {
  const task = context?.task;
  if (!task?.taskId) return Object.freeze({ ok: false, reason: 'invalid-task-context', task: null });
  const failedTask = setTaskState(task, 'failed', now);
  const persisted = upsertEonKernelForegroundRecord(sessionRecord({ task: failedTask, role: context?.classification?.role || 'coordinator', taskClass: context?.classification?.taskClass || 'chat', workflow: context?.workflow }), { storage: sessionStorage });
  const city = recordEonKernelCityMirror({ task: failedTask, role: context?.classification?.role || 'coordinator', providerId: context?.cityProviderId || 'guide', now }, { storage: cityStorage });
  return Object.freeze({ ok: persisted.ok, reason: persisted.reason, task: failedTask, city });
}

export async function createEonKernelMissionDraft({ intentText = '', projectId = DEFAULT_PROJECT_ID, privacyClass = 'device-local', origin = 'chat', now = Date.now() } = {}, options = {}) {
  const context = beginEonKernelForegroundTask({ intentText, projectId, privacyClass, origin, now }, options);
  if (context.classification.blocked) {
    const reviewTask = setTaskState(context.task, 'review-needed', now);
    return Object.freeze({ id: reviewTask.taskId, status: 'blocked', steps: Object.freeze(['review']), notes: 'The requested value-system path is disabled. Nothing has started.', context: Object.freeze({ ...context, task: reviewTask }) });
  }
  const review = await completeEonKernelForegroundTask(context, { output: `${context.classification.taskClass}:${context.task.taskId}`, provenance: 'guide', truthLabel: 'drafted', requiresReview: true, now, ...options });
  return Object.freeze({
    id: review.task.taskId,
    status: 'awaiting_approval',
    steps: Object.freeze(context.workflow.steps.map((step) => step.stepId)),
    notes: 'Foreground local plan prepared. Review is local only; no agent, provider job, schedule, account connection, or external action has started.',
    context: Object.freeze({ ...context, task: review.task }),
    review
  });
}

export function getEonKernelBridgeTruth() {
  return Object.freeze({
    oneTaskVocabulary: true,
    chatCompatibilityBridge: true,
    workspaceReviewBridge: true,
    cityMirrorBridge: true,
    foregroundOnly: true,
    backgroundAfterClose: false,
    rawPromptStored: false,
    rawOutputStored: false,
    selectedProviderCityVisualOptInOnly: true,
    providerProxy: false,
    externalExecution: false,
    localStorage: false
  });
}
