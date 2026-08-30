import { EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_POLICIES, deriveEonExpanseW767WProductiveReceipt } from './eon-expanse-w767w-productive-receipt-bridge.js';

const freeze = (value) => Object.freeze(value);
const list = (value) => Array.isArray(value) ? value.map(String) : [];
const dayKeyFor = (at) => new Date(Number.isFinite(Number(at)) ? Number(at) : Date.now()).toISOString().slice(0, 10);
const hash = (value = '') => { let result = 2166136261; for (const ch of String(value)) { result ^= ch.charCodeAt(0); result = Math.imul(result, 16777619); } return result >>> 0; };
const consumed = (processedReceipts = [], receiptId = '') => Boolean(receiptId) && list(processedReceipts).some((entry) => entry === receiptId || entry.endsWith(`:${receiptId}`));

export const EON_EXPANSE_W767Y_DAILY_SIGNAL_SCHEMA = 'eon.city.expanse.daily-signal.w767y.v1';

export function deriveEonExpanseW767YDailySignal({ at = Date.now(), nativePlan = {}, livingState = {} } = {}) {
  const dayKey = dayKeyFor(at);
  const completedToday = list(livingState.dailyCompletions).includes(dayKey);
  const completedProductive = new Set(list(livingState.completedProductiveMissions));
  const supported = EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_POLICIES.filter((entry) => entry.nativeMissionId);
  const preferred = supported.filter((entry) => !completedProductive.has(entry.missionId));
  const pool = preferred.length ? preferred : supported;
  const policy = pool[hash(dayKey) % Math.max(1, pool.length)] || null;
  if (!policy) return freeze({ ok: false, reason: 'daily-signal-recommendation-unavailable', dayKey, completedToday, hasStreakPenalty: false });
  const candidate = deriveEonExpanseW767WProductiveReceipt(nativePlan, policy.missionId);
  const receiptConsumed = candidate.ok && consumed(livingState.processedReceipts, candidate.id);
  const readyToClaim = candidate.ok && !receiptConsumed && !completedToday;
  const status = completedToday ? 'completed' : readyToClaim ? 'ready-to-claim' : 'review-required';
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W767Y_DAILY_SIGNAL_SCHEMA,
    dayKey,
    missionId: policy.missionId,
    workspaceId: policy.workspaceId,
    label: `Daily Signal · ${policy.missionId.replaceAll('-', ' ')}`,
    status,
    completedToday,
    readyToClaim,
    receiptConsumed,
    receipt: readyToClaim ? candidate : null,
    detail: completedToday
      ? 'Optional recommendation completed for today.'
      : readyToClaim
        ? 'A fresh verified native outcome is ready for explicit Daily Signal confirmation.'
        : `Review the ${policy.workspaceId.replaceAll('-', ' ')} workspace and complete a fresh genuine outcome. Skipping today never removes progress.`,
    xp: 40,
    hasStreakPenalty: false,
    requiresPublicPosting: false,
    automaticCompletion: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW767YDailySignalSelection(recommendation = null, { explicitUserAction = false, expectedDayKey = '', expectedMissionId = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!recommendation?.ok || !recommendation?.dayKey || !recommendation?.missionId) return freeze({ ok: false, reason: recommendation?.reason || 'daily-signal-recommendation-unavailable' });
  if (expectedDayKey && String(expectedDayKey) !== recommendation.dayKey) return freeze({ ok: false, reason: 'daily-signal-day-changed' });
  if (expectedMissionId && String(expectedMissionId) !== recommendation.missionId) return freeze({ ok: false, reason: 'daily-signal-selection-changed' });
  return freeze({ ok: true, recommendation, automaticCompletion: false, mutatesProgression: false });
}
