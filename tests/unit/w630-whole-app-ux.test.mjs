import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_W630_ACTIVE_CONTEXT_KEY,
  buildComposerTruth,
  buildLockedFeaturePrompt,
  clearActiveProjectContext,
  isW630ContextRoute,
  normalizeActiveProjectContext,
  readActiveProjectContext,
  resolveW630ContextHelp,
  saveActiveProjectContext,
  searchW630Commands,
  validateW630WholeAppUxContract
} from '../../assets/js/shell/eon-whole-app-ux.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key), map };
}

test('W630 validates the calm whole-app source contract', () => {
  const report = validateW630WholeAppUxContract();
  assert.equal(report.ok, true);
  assert.equal(report.passed, 8);
});

test('W630 keeps active project context local and route allowlisted', () => {
  const storage = memoryStorage();
  const result = saveActiveProjectContext({ projectId: 'p1', projectTitle: 'Launch', outcome: 'Ship safely', route: '/forge' }, { storage });
  assert.equal(result.ok, true);
  assert.equal(readActiveProjectContext({ storage }).route, '/forge');
  assert.equal(JSON.parse(storage.getItem(EON_W630_ACTIVE_CONTEXT_KEY)).localOnly, true);
});

test('W630 rejects secret-looking project context', () => {
  assert.throws(() => normalizeActiveProjectContext({ projectId: 'p1', projectTitle: 'api_key=secret', route: '/projects' }), /credentials/);
});

test('W630 command search adds a continue action without executing it', () => {
  const storage = memoryStorage();
  saveActiveProjectContext({ projectId: 'p2', projectTitle: 'Campaign', outcome: 'Draft', route: '/workspace' }, { storage });
  const results = searchW630Commands('continue', { storage, currentPath: '/' });
  assert.equal(results[0].id, 'continue-project');
  assert.equal(results[0].effect, 'navigation');
  assert.equal(results[0].projectId, 'p2');
});

test('W630 composer truth never auto-starts voice or hides a cloud fallback', () => {
  const truth = buildComposerTruth({ attachmentCount: 2, runtime: 'direct-byok', voiceActive: false });
  assert.equal(truth.attachmentsStayLocalUntilSend, true);
  assert.equal(truth.microphoneStartsAutomatically, false);
  assert.equal(truth.hiddenCloudFallback, false);
  assert.equal(truth.runtime, 'direct-byok');
});

test('W630 locked feature prompts are dismissible and non-pushy', () => {
  const prompt = buildLockedFeaturePrompt({ state: 'locked', title: 'Video export' });
  assert.equal(prompt.dismissible, true);
  assert.equal(prompt.countdown, false);
  assert.equal(prompt.urgencyClaim, false);
  assert.equal(prompt.automaticCheckout, false);
});

test('W630 context help reflects the current surface', () => {
  const help = resolveW630ContextHelp('/automations.html');
  assert.equal(help.path, '/automations');
  assert.match(help.message, /not remote execution proof/i);
});

test('W630 clear context removes only the continuity pointer', () => {
  const storage = memoryStorage();
  saveActiveProjectContext({ projectId: 'p3', projectTitle: 'Local', route: '/projects' }, { storage });
  assert.equal(clearActiveProjectContext({ storage }).ok, true);
  assert.equal(readActiveProjectContext({ storage }), null);
  assert.equal(isW630ContextRoute('/eoncity'), true);
  assert.equal(isW630ContextRoute('/unknown'), false);
});
