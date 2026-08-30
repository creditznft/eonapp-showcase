import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EON_CITY_PRODUCTIVE_RPG_SCHEMA } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { createEonExpanseW766FLivingContent } from '../../assets/js/city/w766/eon-expanse-w766f-living-content.js';
import { deriveEonExpanseW767WProductiveReceipt, validateEonExpanseW767WProductiveReceipt } from '../../assets/js/city/w766/eon-expanse-w767w-productive-receipt-bridge.js';
import { deriveEonExpanseW767YDailySignal, validateEonExpanseW767YDailySignalSelection } from '../../assets/js/city/w766/eon-expanse-w767y-daily-signal.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const at = Date.UTC(2026, 7, 4, 4, 30, 0);
const plan = {
  schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA,
  missions: [
    { id: 'creator', state: 'completed', outcome: { kind: 'creator-guide-artifact', route: '/create', source: 'create-local-guide', receiptId: 'creator:daily:1', verifiedAt: at - 1000, verified: true } },
    { id: 'local-ai-byok', state: 'completed', outcome: { kind: 'local-ai-self-test', route: '/local-ai', source: 'local-ai-device', receiptId: 'local-ai:daily:1', verifiedAt: at - 1000, verified: true } },
    { id: 'automation', state: 'completed', outcome: { kind: 'automation-proposal', route: '/automations', source: 'automations-local', receiptId: 'automation:daily:1', verifiedAt: at - 1000, verified: true } },
    { id: 'vault-recovery', state: 'completed', outcome: { kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local', receiptId: 'vault:daily:1', verifiedAt: at - 1000, verified: true } }
  ]
};

test('W767Y chooses one deterministic optional recommendation without a streak penalty', () => {
  const first = deriveEonExpanseW767YDailySignal({ at, nativePlan: plan, livingState: {} });
  const second = deriveEonExpanseW767YDailySignal({ at: at + 1200, nativePlan: plan, livingState: {} });
  assert.equal(first.ok, true);
  assert.equal(first.missionId, second.missionId);
  assert.equal(first.dayKey, '2026-08-04');
  assert.equal(first.readyToClaim, true);
  assert.equal(first.hasStreakPenalty, false);
  assert.equal(first.requiresPublicPosting, false);
  assert.equal(first.automaticCompletion, false);
});

test('W767Y consumes a fresh native receipt once across Daily Signal and productive XP', () => {
  let state = {};
  const recommendation = () => deriveEonExpanseW767YDailySignal({ at, nativePlan: plan, livingState: state });
  const runtime = createEonExpanseW766FLivingContent({
    initial: state,
    now: () => at,
    onChange: (next) => { state = next; },
    onAwardXp: ({ amount }) => ({ ok: true, totalXp: amount, level: 1 }),
    verifyWorkspaceReceipt: ({ missionId, workspaceReceipt }) => validateEonExpanseW767WProductiveReceipt({ missionId, workspaceReceipt, nativePlan: plan }),
    getDailySignalRecommendation: () => recommendation()
  });
  const daily = recommendation();
  assert.equal(runtime.completeDailySignal({ dayKey: daily.dayKey, missionId: daily.missionId, workspaceReceipt: daily.receipt }).reason, 'explicit-user-action-required');
  const claimed = runtime.completeDailySignal({ dayKey: daily.dayKey, missionId: daily.missionId, workspaceReceipt: daily.receipt, explicitUserAction: true });
  assert.equal(claimed.ok, true);
  assert.equal(claimed.awardedXp, 40);
  assert.equal(runtime.completeProductiveMission(daily.missionId, { explicitUserAction: true, workspaceReceipt: daily.receipt }).reason, 'native-outcome-receipt-already-consumed');
});

test('W767Y selection validation rejects stale day or recommendation changes', () => {
  const daily = deriveEonExpanseW767YDailySignal({ at, nativePlan: plan, livingState: {} });
  assert.equal(validateEonExpanseW767YDailySignalSelection(daily).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW767YDailySignalSelection(daily, { explicitUserAction: true, expectedDayKey: '2026-08-03' }).reason, 'daily-signal-day-changed');
  assert.equal(validateEonExpanseW767YDailySignalSelection(daily, { explicitUserAction: true, expectedDayKey: daily.dayKey, expectedMissionId: 'other' }).reason, 'daily-signal-selection-changed');
});

test('W767Y runtime and board use existing receipt, workspace and progression authorities only', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const living = await read('../../assets/js/city/w766/eon-expanse-w766f-living-content.js');
  const board = await read('../../assets/js/city/w766/eon-expanse-w767t-living-activity-board.js');
  assert.match(runtime, /deriveEonExpanseW767YDailySignal/);
  assert.match(runtime, /completeDailySignal/);
  assert.match(runtime, /Claim Daily Signal|claim-daily-signal/);
  assert.match(living, /nativeReceiptConsumed/);
  assert.match(board, /ready-to-claim/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
