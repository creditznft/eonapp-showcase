import test from 'node:test';
import assert from 'node:assert/strict';

const store = Object.create(null);

globalThis.localStorage = {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
  },
  setItem(key, value) {
    store[key] = String(value);
  },
  removeItem(key) {
    delete store[key];
  },
  clear() {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  }
};

const memory = await import('../../assets/js/utils/mission-memory.js');

test('mission memory records and reuses the last successful budget mode for a task', () => {
  localStorage.clear();

  const initial = memory.loadMissionMemory();
  assert.equal(initial.defaultBudgetMode, 'balanced');

  const before = memory.resolveMissionBudgetDecision({
    taskType: 'build',
    requestedBudgetMode: 'auto',
    baseBudget: {
      maxHistoryMessages: 20,
      maxInputChars: 5000,
      maxOutputTokens: 1500,
      timeoutMs: 60000
    },
    memory: initial
  });
  assert.equal(before.budgetMode, 'balanced');

  memory.recordMissionMemory({
    missionId: 'mission-123',
    taskType: 'build',
    mode: 'build',
    budgetMode: 'performance',
    providerId: 'openrouter',
    providerLabel: 'OpenRouter',
    model: 'qwen2.5-coder',
    outcome: 'success',
    summary: 'Built a website'
  });

  const after = memory.loadMissionMemory();
  assert.equal(after.taskProfiles.build.budgetMode, 'performance');
  assert.equal(after.recent.length, 1);

  const decision = memory.resolveMissionBudgetDecision({
    taskType: 'build',
    requestedBudgetMode: 'auto',
    baseBudget: {
      maxHistoryMessages: 20,
      maxInputChars: 5000,
      maxOutputTokens: 1500,
      timeoutMs: 60000
    },
    memory: after
  });

  assert.equal(decision.budgetMode, 'performance');
  assert.match(decision.reason, /remembered performance budget mode/i);

  const summary = memory.formatMissionMemorySummary(after);
  assert.match(summary, /Top build → performance/i);
});
