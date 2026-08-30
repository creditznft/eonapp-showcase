/**
 * W368 — EONBOT City Work Loop.
 *
 * City may prepare a bounded local foreground planning receipt, then show a
 * visible review and let the person open a native EON surface. It never sends
 * a provider request, reads private work, stores typed City text, starts an
 * automation, or auto-navigates.
 */
import { createEonKernelMissionDraft } from '../ai-kernel/eon-ai-kernel-bridge.js';
import { recordCommandDistrictEvent } from './eon-city-command-district.js';
import {
  consumeEonCityWorkReturnReceipt,
  writeEonCityWorkHandoff,
  writeEonCityWorkReturnReceipt
} from '../contracts/city/eon-city-work-handoff.js';

export const CITY_WORK_LOOP_SCHEMA = 'eon.city.work-loop.w368.v1';
export const CITY_WORK_LOOP_MAX_TYPED_LENGTH = 180;

const freeze = (value) => Object.freeze(value);
const INTENTS = freeze([
  freeze({
    id: 'shape-project',
    label: 'Shape a project',
    detail: 'Prepare a small local project-planning review, then continue in Chat.',
    destination: freeze({ receiverId: 'home', route: '/?new=1', label: 'Chat', mode: 'chat', landmarkId: 'command-centre' }),
    kernelSeed: 'Help me prepare a local project plan.',
    role: 'Coordinator'
  }),
  freeze({
    id: 'research-next',
    label: 'Research next steps',
    detail: 'Prepare a bounded research-route review without reading files in City.',
    destination: freeze({ receiverId: 'workspace', route: '/workspace', label: 'Workspace', mode: 'workspace', landmarkId: 'archive' }),
    kernelSeed: 'Help me prepare local research next steps.',
    role: 'Researcher'
  }),
  freeze({
    id: 'build-brief',
    label: 'Prepare a build brief',
    detail: 'Prepare a build-route review; implementation stays in a native work surface.',
    destination: freeze({ receiverId: 'projects', route: '/projects', label: 'Projects', mode: 'projects', landmarkId: 'workshop' }),
    kernelSeed: 'Help me prepare a local build brief.',
    role: 'Builder'
  }),
  freeze({
    id: 'organise-workflow',
    label: 'Organise a workflow',
    detail: 'Prepare a local automation planning review. Nothing runs or schedules from City.',
    destination: freeze({ receiverId: 'automations', route: '/automations', label: 'Automations', mode: 'automations', landmarkId: 'relay' }),
    kernelSeed: 'Help me prepare a local workflow plan.',
    role: 'Coordinator'
  })
]);

const INTENT_BY_ID = new Map(INTENTS.map((item) => [item.id, item]));
const SAFE_DESTINATIONS = new Set(['/?new=1', '/workspace', '/projects', '/automations']);

function safeTextMeta(value = '') {
  const text = [...String(value || '')].filter((character) => {
    const code = character.codePointAt(0) || 0;
    return code >= 32 && code !== 127;
  }).join('').trim();
  return freeze({ present: Boolean(text), length: Math.min(CITY_WORK_LOOP_MAX_TYPED_LENGTH, [...text].slice(0, CITY_WORK_LOOP_MAX_TYPED_LENGTH).length) });
}

function cleanTaskId(value = '') {
  const taskId = String(value || '').trim();
  return /^eontask_[a-z0-9_-]{12,120}$/i.test(taskId) ? taskId : '';
}

export function getCityWorkLoopIntents() {
  return INTENTS;
}

export function getCityWorkLoopIntent(intentId = '') {
  return INTENT_BY_ID.get(String(intentId || '').trim()) || null;
}

/**
 * The optional typed value is deliberately reduced to presence/length metadata.
 * It is not sent to the Kernel bridge, storage, City renderer, URL, or receipt.
 */
export async function createCityWorkLoopProposal({ intentId = '', typedRequest = '', now = Date.now() } = {}, options = {}) {
  const intent = getCityWorkLoopIntent(intentId);
  if (!intent) return freeze({ ok: false, reason: 'unknown-intent', proposal: null, truth: getCityWorkLoopTruth() });
  const typed = safeTextMeta(typedRequest);
  let mission;
  try {
    mission = await createEonKernelMissionDraft({
      intentText: intent.kernelSeed,
      origin: 'eon-city',
      privacyClass: 'device-local',
      now
    }, options);
  } catch {
    return freeze({ ok: false, reason: 'local-plan-unavailable', proposal: null, truth: getCityWorkLoopTruth() });
  }
  const taskId = cleanTaskId(mission?.id || mission?.context?.task?.taskId);
  if (!taskId) return freeze({ ok: false, reason: 'invalid-local-plan', proposal: null, truth: getCityWorkLoopTruth() });
  const district = recordCommandDistrictEvent('route-prepared', { landmarkId: intent.destination.landmarkId, now }, { storage: options.cityStorage });
  const state = mission.status === 'awaiting_approval' ? 'review-needed' : mission.status === 'blocked' ? 'blocked' : 'unavailable';
  const proposal = freeze({
    schema: CITY_WORK_LOOP_SCHEMA,
    id: taskId,
    intentId: intent.id,
    title: intent.label,
    role: intent.role,
    destination: freeze({ ...intent.destination }),
    state,
    localOnly: true,
    foregroundOnly: true,
    externalEffect: false,
    typedRequest: freeze({ present: typed.present, length: typed.length, stored: false, forwarded: false }),
    review: freeze({ required: true, completed: false, detail: 'City prepared only a local planning receipt. Review and continue in the native surface yourself.' }),
    district: freeze({ stageId: district?.state?.stageId || 'review-route', landmarkId: intent.destination.landmarkId }),
    createdAt: new Date(Number(now)).toISOString()
  });
  return freeze({ ok: state === 'review-needed', reason: state === 'review-needed' ? null : 'review-blocked', proposal, truth: getCityWorkLoopTruth() });
}

/** Writes the canonical expiring CityWorkHandoff only after visible review. */
export async function writeCityWorkLoopHandoff(proposal = {}, options = {}) {
  const intent = getCityWorkLoopIntent(proposal?.intentId);
  const taskId = cleanTaskId(proposal?.id);
  if (!intent || !taskId) return freeze({ ok: false, reason: 'invalid-proposal' });
  if (proposal?.review?.required !== true) return freeze({ ok: false, reason: 'visible-review-required' });
  return writeEonCityWorkHandoff({
    receiverId: intent.destination.receiverId,
    surface: intent.destination.mode,
    sourceMode: 'command-hub',
    stationId: `legacy:${intent.destination.landmarkId}`,
    actionId: intent.id,
    missionId: 'city-work-loop',
    objectiveId: intent.id,
    returnContextId: taskId,
    referenceId: taskId,
    safeLabel: intent.destination.label,
    sourceSchema: CITY_WORK_LOOP_SCHEMA
  }, options);
}

/** Creates a canonical Core → City return receipt after receiver consumption. */
export function writeCityWorkLoopReturnReceipt(proposal = {}, handoffId = '', input = {}, options = {}) {
  const intent = getCityWorkLoopIntent(proposal?.intentId);
  const taskId = cleanTaskId(proposal?.id);
  if (!intent || !taskId) return freeze({ ok: false, reason: 'invalid-proposal' });
  return writeEonCityWorkReturnReceipt({
    handoffId,
    receiverId: intent.destination.receiverId,
    result: input.result || 'completed',
    resultCode: input.resultCode || 'city-work-loop-reviewed',
    errorCode: input.errorCode || '',
    evidenceReceiptId: input.evidenceReceiptId || ''
  }, options);
}

export function consumeCityWorkLoopReturnReceipt(receiptId = '', options = {}) {
  return consumeEonCityWorkReturnReceipt(receiptId, options);
}

/** Creates a safe, finite legacy return marker only after a person chooses to return. */
export function recordCityWorkLoopReturn(proposal = {}, { now = Date.now(), cityStorage } = {}) {
  const intent = getCityWorkLoopIntent(proposal?.intentId);
  const taskId = cleanTaskId(proposal?.id);
  if (!intent || !taskId) return freeze({ ok: false, reason: 'invalid-proposal', receipt: null });
  const district = recordCommandDistrictEvent('returned', { landmarkId: intent.destination.landmarkId, now }, { storage: cityStorage });
  return freeze({
    ok: Boolean(district?.ok),
    reason: district?.ok ? null : 'city-return-unavailable',
    receipt: freeze({
      schema: CITY_WORK_LOOP_SCHEMA,
      taskId,
      intentId: intent.id,
      landmarkId: intent.destination.landmarkId,
      state: 'returned-to-city',
      localOnly: true,
      storesUserContent: false,
      externalEffect: false,
      createdAt: new Date(Number(now)).toISOString()
    })
  });
}

export function validateCityWorkLoopProposal(candidate = {}) {
  const errors = [];
  const value = candidate && typeof candidate === 'object' ? candidate : {};
  const intent = getCityWorkLoopIntent(value.intentId);
  if (value.schema !== CITY_WORK_LOOP_SCHEMA) errors.push('Unexpected City Work Loop schema.');
  if (!intent) errors.push('Unknown City Work Loop intent.');
  if (!cleanTaskId(value.id)) errors.push('City Work Loop task reference must be opaque and bounded.');
  if (!SAFE_DESTINATIONS.has(String(value.destination?.route || ''))) errors.push('City Work Loop destination is not allowlisted.');
  if (value.localOnly !== true || value.foregroundOnly !== true || value.externalEffect !== false) errors.push('City Work Loop must remain local, foreground-only and non-executing.');
  if (value.review?.required !== true || value.review?.completed !== false) errors.push('City Work Loop requires a visible unfinished review.');
  if (value.typedRequest?.stored !== false || value.typedRequest?.forwarded !== false) errors.push('Typed City text must not be stored or forwarded.');
  const serialized = JSON.stringify(value);
  if (/https?:\/\/|provider[_-]?key|access[_-]?token|vault|wallet|payment|prompt/i.test(serialized)) errors.push('City Work Loop proposal includes forbidden private or remote data.');
  return freeze({ schema: CITY_WORK_LOOP_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true });
}

export function getCityWorkLoopTruth() {
  return freeze({
    schema: CITY_WORK_LOOP_SCHEMA,
    localOnly: true,
    foregroundOnly: true,
    providerRequest: false,
    externalExecution: false,
    autoNavigation: false,
    autoApproval: false,
    typedTextStored: false,
    typedTextForwarded: false,
    rendererMayShow: freeze(['intent label', 'bounded role', 'review-needed state', 'safe native destination']),
    rendererNeverShows: freeze(['typed request', 'prompt', 'AI output', 'provider key', 'provider endpoint', 'private file', 'Vault content', 'account data', 'payment data'])
  });
}
