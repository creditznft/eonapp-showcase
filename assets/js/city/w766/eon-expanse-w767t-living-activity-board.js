import { EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS, EON_EXPANSE_W766F_SIDE_MISSIONS } from './eon-expanse-w766f-living-content.js';

const freeze = (value) => Object.freeze(value);
const list = (value) => Array.isArray(value) ? value.map(String) : [];
const words = (value = '') => String(value || '').replaceAll('-', ' ').replaceAll('_', ' ').trim();

export const EON_EXPANSE_W767T_LIVING_ACTIVITY_BOARD_SCHEMA = 'eon.city.expanse.living-activity-board.w767t.v1';

const SIDE_REQUIREMENTS = freeze({
  'signal-salvage': freeze({ total: 3, progressKey: 'signalFragments', unit: 'fragments' }),
  'archive-sweep': freeze({ total: 2, progressKey: 'archiveSweepRecords', unit: 'records' }),
  'eonbot-curiosity-trail': freeze({ total: 3, progressKey: 'eonbotSignals', unit: 'signals' }),
  'lost-worker': freeze({ total: 2, progressKey: 'lostWorker', unit: 'steps' }),
  'transit-calibration': freeze({ total: 1, progressKey: 'transitJourneyReceipts', unit: 'journey' })
});

function dayKey(at) {
  const timestamp = Number(at);
  return new Date(Number.isFinite(timestamp) ? timestamp : Date.now()).toISOString().slice(0, 10);
}

function sideProgress(missionId, progress = {}, cycleMatches = false) {
  if (missionId === 'lost-worker') return Number(progress.lostWorkerLocated === true) + Number(progress.routeTerminalActivated === true);
  if (!cycleMatches) return 0;
  const requirement = SIDE_REQUIREMENTS[missionId];
  if (!requirement) return 0;
  return list(progress[requirement.progressKey]).length;
}

function sideItem(mission, state, today) {
  const receipts = new Set(list(state.processedReceipts));
  const completed = new Set(list(state.completedSideMissions));
  const progress = state.activityProgress || {};
  const requirement = SIDE_REQUIREMENTS[mission.id] || freeze({ total: 1, unit: 'step' });
  const cycleMatches = String(progress.cycleKey || '') === today;
  const current = Math.min(requirement.total, sideProgress(mission.id, progress, cycleMatches));
  const completedToday = mission.repeatable ? receipts.has(`side:${mission.id}:${today}`) : completed.has(mission.id);
  const status = completedToday ? 'completed' : current > 0 ? 'in-progress' : 'available';
  const detail = completedToday
    ? mission.repeatable ? 'Completed for today; it returns on the next UTC day.' : 'Completed permanently.'
    : current > 0 ? `${current}/${requirement.total} ${requirement.unit} verified through physical interaction.` : mission.objective;
  return freeze({
    id: `side:${mission.id}`,
    activityId: mission.id,
    family: 'side-mission',
    label: mission.label,
    zoneId: mission.zoneId,
    zoneLabel: words(mission.zoneId),
    status,
    progress: `${current}/${requirement.total}`,
    detail,
    xp: Number(mission.xp || 0),
    repeatable: mission.repeatable === true,
    reviewFirst: false,
    receiptRequired: true,
    automaticCompletion: false,
    priority: status === 'in-progress' ? 0 : status === 'available' ? 2 : 5
  });
}

function productiveItem(mission, state) {
  const completed = new Set(list(state.completedProductiveMissions));
  const done = completed.has(mission.id);
  return freeze({
    id: `productive:${mission.id}`,
    activityId: mission.id,
    family: 'productive-mission',
    label: mission.label,
    zoneId: '',
    zoneLabel: 'EONAPP workspace',
    workspaceId: String(mission.workspaceId || ''),
    status: done ? 'completed' : 'review-required',
    progress: done ? '1/1' : '0/1',
    detail: done ? 'Verified native workspace receipt accepted.' : `Review the ${words(mission.workspaceId)} workspace, complete a real outcome, then return with its matching native receipt.`,
    xp: Number(mission.xp || 0),
    repeatable: false,
    reviewFirst: true,
    receiptRequired: true,
    automaticCompletion: false,
    priority: done ? 6 : 3
  });
}

export function deriveEonExpanseW767TLivingActivityBoard(state = {}, { at = Date.now(), maxItems = 6, dailySignal = null } = {}) {
  const today = dayKey(at);
  const sideItems = EON_EXPANSE_W766F_SIDE_MISSIONS.map((mission) => sideItem(mission, state, today));
  const productiveItems = EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS.map((mission) => productiveItem(mission, state));
  const dailyComplete = list(state.dailyCompletions).includes(today);
  const dailyStatus = dailyComplete ? 'completed' : dailySignal?.status === 'ready-to-claim' ? 'ready-to-claim' : 'review-required';
  const dailyItem = freeze({
    id: `daily:${today}`,
    activityId: 'daily-signal',
    family: 'daily-signal',
    label: dailySignal?.label || 'Daily Signal',
    zoneId: '',
    zoneLabel: 'Signal Frontier',
    workspaceId: String(dailySignal?.workspaceId || ''),
    missionId: String(dailySignal?.missionId || ''),
    dayKey: String(dailySignal?.dayKey || today),
    status: dailyStatus,
    progress: dailyComplete ? '1/1' : '0/1',
    detail: dailyComplete ? 'Optional recommendation completed for today.' : dailySignal?.detail || 'One optional useful action; skipping it never removes progress or creates a streak penalty.',
    xp: 40,
    repeatable: true,
    reviewFirst: true,
    receiptRequired: true,
    automaticCompletion: false,
    priority: dailyComplete ? 7 : dailyStatus === 'ready-to-claim' ? 1 : 4
  });
  const ranked = [...sideItems, ...productiveItems, dailyItem]
    .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
  const limit = Math.max(1, Math.min(16, Number(maxItems || 6)));
  const items = freeze(ranked.slice(0, limit).map(({ priority: _priority, ...item }) => freeze(item)));
  return freeze({
    schema: EON_EXPANSE_W767T_LIVING_ACTIVITY_BOARD_SCHEMA,
    dayKey: today,
    items,
    moreCount: Math.max(0, ranked.length - items.length),
    inProgressCount: ranked.filter((item) => item.status === 'in-progress').length,
    availableSideCount: sideItems.filter((item) => item.status === 'available').length,
    productiveReviewCount: productiveItems.filter((item) => item.status === 'review-required').length,
    completedCount: ranked.filter((item) => item.status === 'completed').length,
    dailyComplete,
    hasStreakPenalty: false,
    requiresPublicPosting: false,
    exposesPrivateWorkspaceContent: false,
    automaticCompletion: false
  });
}
