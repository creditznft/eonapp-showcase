import { getAgentExecutionSnapshot, getAgentExecutorSummary } from './agent-executor.js';
import { recordEonNotificationActivity } from '../notifications/eon-notification-center.js';

const WATCHDOG_STATE_KEY = 'eon:mission-watchdog:v1';

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(WATCHDOG_STATE_KEY) || 'null');
    return raw && typeof raw === 'object' ? raw : { enabled: false, lastAlertAt: 0 };
  } catch {
    return { enabled: false, lastAlertAt: 0 };
  }
}

function saveState(state) {
  try { localStorage.setItem(WATCHDOG_STATE_KEY, JSON.stringify(state)); } catch {}
}

/** Record a real stalled-job signal locally. It never asks push permission. */
async function notify(title, body, jobId) {
  const result = recordEonNotificationActivity({
    eventId: `approval-needed:mission-watchdog:${String(jobId || 'unknown').replace(/[^a-z0-9:_-]/gi, '').slice(0, 120) || 'unknown'}`,
    category: 'approval-needed',
    title,
    body,
    route: '/'
  }, { explicitSourceEvent: true });
  return Boolean(result.ok);
}

function isStale(summary, snapshot, staleAfterMs) {
  const runningJobId = String(summary?.runningJobId || '');
  if (!runningJobId) return false;
  const runtime = snapshot?.runtime || null;
  const lastUpdatedAt = Number(runtime?.lastUpdatedAt || runtime?.startedAt || 0);
  if (!Number.isFinite(lastUpdatedAt) || !lastUpdatedAt) return false;
  return Date.now() - lastUpdatedAt >= staleAfterMs;
}

let timer = null;

export function startMissionWatchdog({ intervalMs = 60000, staleAfterMs = 300000 } = {}) {
  const state = loadState();
  state.enabled = true;
  saveState(state);
  if (timer) return { ok: true, enabled: true };

  timer = setInterval(async () => {
    try {
      const summary = getAgentExecutorSummary();
      const runningJobId = String(summary?.runningJobId || '');
      if (!runningJobId) return;
      const snapshot = getAgentExecutionSnapshot(runningJobId);
      if (!isStale(summary, snapshot, staleAfterMs)) return;

      const current = loadState();
      const lastAlertAt = Number(current.lastAlertAt || 0);
      if (Date.now() - lastAlertAt < staleAfterMs) return;

      current.lastAlertAt = Date.now();
      saveState(current);
      await notify('EON mission needs review', `Mission ${runningJobId} looks stalled. Open the cockpit to review the current step and receipts.`, runningJobId);
    } catch {}
  }, Math.max(30000, intervalMs));

  return { ok: true, enabled: true };
}

export function stopMissionWatchdog() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const state = loadState();
  state.enabled = false;
  saveState(state);
  return { ok: true, enabled: false };
}

export function getMissionWatchdogStatus() {
  const state = loadState();
  return { enabled: Boolean(state.enabled), lastAlertAt: Number(state.lastAlertAt || 0) };
}

Object.assign(/** @type {any} */ (globalThis), { startMissionWatchdog, stopMissionWatchdog, getMissionWatchdogStatus });
