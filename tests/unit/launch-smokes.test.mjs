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
    for (const key of Object.keys(store)) delete store[key];
  }
};

const missionIntake = await import('../../assets/js/utils/mission-intake.js');
const browserApproval = await import('../../assets/js/utils/browser-approval.js');
const missionEngine = await import('../../assets/js/utils/mission-engine.js');
const missionMemory = await import('../../assets/js/utils/mission-memory.js');
const nftEconomy = await import('../../assets/js/utils/nft-economy.js');
const creatorReceipts = await import('../../assets/js/utils/creator-receipts.js');
const builderDeploy = await import('../../assets/js/utils/builder-deploy.js');

test('Mission Commander intake smoke builds clarifiers and preview copy', () => {
  const clarifiers = missionIntake.buildMissionClarifiers('Build me a launch site', 'balanced', 'strict', 'ja');
  const preview = missionIntake.buildMissionPreview('Build me a launch site', 'balanced', 'strict', 'performance', 'ja');

  assert.ok(Array.isArray(clarifiers));
  assert.ok(clarifiers.length <= 3);
  assert.match(preview, /Launch site/i);
  assert.match(preview, /Budget mode: performance/i);
});

test('Mission Engine plan -> execute -> receipt smoke carries route explanation', () => {
  const receipt = missionEngine.buildMissionReceipt({
    mode: 'build',
    prompt: 'Build me a launch site',
    orchestration: {
      planId: 'mission-123',
      action: 'build',
      taskType: 'build',
      providerSelection: { provider: { id: 'openrouter', label: 'OpenRouter' }, model: 'qwen2.5-coder' },
      provider: 'openrouter',
      model: 'qwen2.5-coder',
      budget: { maxHistoryMessages: 12, maxInputChars: 2400, maxOutputTokens: 520, timeoutMs: 25000 }
    },
    reply: {
      meta: {
        providerId: 'openrouter',
        provider: 'OpenRouter',
        model: 'qwen2.5-coder',
        routing: { provider: 'openrouter', reason: 'Task routed to coder-capable provider.' },
        budget: { mode: 'balanced' }
      }
    },
    budgetDecision: { reason: 'User selected Balanced budget mode for build.' },
    taskClass: 'build'
  });

  assert.equal(receipt.schema, 'mission-receipt/v1');
  assert.equal(receipt.missionId, 'mission-123');
  assert.equal(receipt.taskClass, 'build');
  assert.equal(receipt.routeExplanation, 'User selected Balanced budget mode for build.');
  assert.equal(receipt.provider, 'openrouter');
});

test('Browser operator approval gate smoke flags risky external publish actions', () => {
  const approval = browserApproval.assessBrowserRisk('https://example.com', 'research', 'publish to social and share', []);
  const safe = browserApproval.assessBrowserRisk('/browser', 'browse', 'read this page', []);

  assert.equal(approval.requiresApproval, true);
  assert.equal(approval.riskLevel, 'high');
  assert.equal(safe.requiresApproval, false);
  assert.equal(safe.riskLevel, 'low');
});

test('Token budget route explanation smoke remembers budget posture', () => {
  localStorage.clear();
  const memory = missionMemory.recordMissionMemory({
    missionId: 'mission-budget-1',
    taskType: 'build',
    mode: 'build',
    budgetMode: 'performance',
    providerId: 'openrouter',
    providerLabel: 'OpenRouter',
    model: 'qwen2.5-coder',
    outcome: 'success',
    summary: 'Launched site'
  });

  const decision = missionMemory.resolveMissionBudgetDecision({
    taskType: 'build',
    requestedBudgetMode: 'auto',
    baseBudget: { maxHistoryMessages: 20, maxInputChars: 5000, maxOutputTokens: 1500, timeoutMs: 60000 },
    memory
  });

  assert.equal(decision.budgetMode, 'performance');
  assert.match(decision.reason, /remembered performance budget mode/i);
});

test('Creator media artifact receipt smoke records provenance', () => {
  const receipt = creatorReceipts.buildCreatorMediaReceipt({
    kind: 'video',
    title: 'Launch Reel',
    platform: 'youtube',
    format: '16:9',
    aspect: '16:9',
    mediaUrl: 'https://cdn.example/video.mp4',
    manifestUrl: 'https://cdn.example/manifest.json',
    assetIntent: 'sale-ready',
    provenance: { sourceType: 'creator-studio-video' },
    fairUse: { note: 'Review source rights before publishing.' }
  });

  assert.equal(receipt.schema, 'creator-media-receipt/v1');
  assert.equal(receipt.kind, 'video');
  assert.match(receipt.provenance.receiptHash, /^0x[0-9a-f]{8}$/i);
  assert.match(receipt.fairUse.note, /source rights/i);
});

test('NFT economy smoke classifies utility assets and operator badges', () => {
  const operatorProfile = nftEconomy.buildNftUtilityProfile({
    collectionType: 'operator',
    metadata: { sellerReputation: { tier: 'operator' }, permanence: { status: 'anchored' } },
    isAdmin: true
  });
  const computeBadge = nftEconomy.buildComputeReputationBadge(4200);
  const outcome = nftEconomy.buildMarketplaceOutcomeCopy({ collectionType: 'compute', metadata: { computeScore: 4200 } });

  assert.equal(operatorProfile.badgeLabel, 'Operator Badge');
  assert.equal(operatorProfile.operatorBadge, 'Admin Operator');
  assert.ok(operatorProfile.unlockSummary.includes('Treasury tools'));
  assert.equal(computeBadge, 'Compute Reputation: Trusted');
  assert.match(outcome, /Compute Pass/i);
});

test('Website builder artifact bundle smoke verifies bundle output', () => {
  const manifest = builderDeploy.buildDeployManifest({
    projectName: 'Launch Site',
    target: 'cloudflare-pages',
    route: '/',
    html: '<!doctype html><html><body>Hello</body></html>',
    css: 'body { color: white; }',
    js: 'console.log("hi");'
  });
  const verification = builderDeploy.verifyDeployBundle({
    manifest,
    html: '<!doctype html><html><body>Hello</body></html>',
    css: 'body { color: white; }',
    js: 'console.log("hi");'
  });
  const readout = builderDeploy.buildDeployVerificationReadout(verification, manifest);

  assert.equal(verification.ok, true);
  assert.match(readout, /Launch Site/i);
  assert.match(readout, /Cloudflare Pages/i);
});
