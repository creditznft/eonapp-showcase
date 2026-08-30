import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRealm3dVisualDeviceQaPlan,
  scoreRealm3dDeviceBudget,
  scoreRealm3dVisualQuality,
  buildVisualQaHandoffChecklist
} from '../../assets/js/realm3d/engine/EonCityVisualDeviceQa.js';
import {
  buildEonBotDialogueState,
  buildAgentCommandDraft,
  scoreEonBotAgentPolish
} from '../../assets/js/realm3d/engine/EonCityAgentDialogueRuntime.js';
import {
  buildAiUpgradeMarketCatalog,
  scoreAiUpgradeMarketCatalog
} from '../../assets/js/utils/ai-upgrade-market-catalog.js';
import {
  buildLootboxNftEnvelope,
  openLootboxNft,
  buildLootboxRevealShowPlan,
  scoreLootboxMarketSystem
} from '../../assets/js/utils/lootbox-marketplace.js';
import {
  buildLootboxVisualBundle,
  scoreLootboxVisual
} from '../../assets/js/utils/lootbox-nft-visuals.js';
import { buildNftWorldClassAudit } from '../../assets/js/utils/nft-market-quality-audit.js';

test('W82 visual/device QA plan includes mobile, fullscreen, screenshot and FPS contracts', () => {
  const plan = buildRealm3dVisualDeviceQaPlan({ quality: 'standard', includeRealScreenshots: true });
  assert.equal(plan.schema, 'eon.realm3d.visual-device-qa.w82.v1');
  assert.ok(plan.viewports.some((viewport) => viewport.id === 'mobile-landscape'));
  assert.ok(plan.checks.some((check) => check.includes('pointer lock')));
  const budget = scoreRealm3dDeviceBudget({ fps: 32, frameMs: 30, visibleBlocks: 9000, visibleNpcs: 12, hydratedScreens: 2 }, plan);
  assert.equal(budget.grade, 'excellent');
  assert.ok(buildVisualQaHandoffChecklist().codexMustRunLater.some((cmd) => cmd.includes('Playwright') || cmd.includes('playwright')));
});

test('W82 visual quality scoring keeps secret safety and NFT art in the score', () => {
  const score = scoreRealm3dVisualQuality({ nftArtScore: 90, secretSafety: 100, cityDensity: 82, workstationDetail: 88, lootboxShowScore: 90, agentPolish: 90, mobileUsability: 82, controlSafety: 94 });
  assert.equal(score.grade, 'ship-ready');
  assert.equal(score.checks.secretSafetyOk, true);
  assert.equal(score.checks.nftArtOk, true);
});

test('W83 EONBot dialogue is text-first, owner-private, approval-first, and visitor safe', () => {
  const dialogue = buildEonBotDialogueState({ providerStatus: { hasWorkingProvider: true, browserSpeechReady: true }, ownerView: true });
  assert.equal(dialogue.voiceMode.fallback, 'text-first-dialogue');
  assert.ok(dialogue.suggestedCommands.includes('Help me generate a utility NFT'));
  const command = buildAgentCommandDraft({ commandText: 'publish my landing page after drafting copy', providerStatus: { hasWorkingProvider: true }, ownerView: true });
  assert.equal(command.needsApproval, true);
  assert.equal(command.mode, 'draft-plan-only-until-user-approves');
  const secret = buildAgentCommandDraft({ commandText: 'my api key is sk-secret123456789', providerStatus: { hasWorkingProvider: true }, ownerView: true });
  assert.equal(secret.blocked, true);
  const visitor = buildEonBotDialogueState({ ownerView: false });
  assert.equal(visitor.ownerView, false);
  assert.ok(scoreEonBotAgentPolish().total >= 85);
});

test('W84 AI Upgrade Market unifies stores and includes utility NFTs plus lootbox NFTs', () => {
  const catalog = buildAiUpgradeMarketCatalog();
  assert.equal(catalog.policy.unifiedUserFacingName, 'AI Upgrade Market');
  assert.ok(catalog.counts.lootboxes >= 3);
  assert.ok(catalog.counts.utilityNfts >= 5);
  assert.ok(catalog.products.every((product) => product.oneAdOrShareLifetimeBlocked));
  assert.ok(scoreAiUpgradeMarketCatalog(catalog).total >= 90);
});

test('W84 lootboxes can be sold unopened, opened once with confirmation, and reveal through a show', () => {
  const lootbox = buildLootboxNftEnvelope({ tier: 'genesis', seed: 'unit-test-genesis' });
  assert.equal(lootbox.canSellUnopened, true);
  assert.equal(lootbox.status, 'unopened');
  assert.equal(openLootboxNft(lootbox, { userConfirmed: false }).error, 'user_confirmation_required');
  const opened = openLootboxNft(lootbox, { userConfirmed: true, openSeed: 'open-unit' });
  assert.equal(opened.ok, true);
  assert.equal(opened.lootbox.canSellUnopened, false);
  assert.ok(opened.rewards.length >= 1);
  const show = buildLootboxRevealShowPlan(lootbox, opened.rewards);
  assert.ok(show.stages.length >= 5);
  assert.ok(show.accessibility.skipButton);
  assert.ok(scoreLootboxMarketSystem({ lootbox }).total >= 90);
});

test('W84 lootbox visuals are framed, disclosed, and high scoring', () => {
  const bundle = buildLootboxVisualBundle({ tier: 'architect', owner: '0x0000000000000000000000000000000000000001', seed: 'visual-unit' });
  assert.ok(bundle.svg.includes('EON LOOTBOX'));
  assert.ok(bundle.svg.includes('Unopened NFT'));
  assert.ok(bundle.staticUri.startsWith('data:image/svg+xml'));
  const score = scoreLootboxVisual({ svg: bundle.svg, tier: bundle.envelope.tier, envelope: bundle.envelope });
  assert.ok(score.score >= 85);
});

test('W84 NFT world-class audit covers generator diversity, market catalog, and lootboxes', () => {
  const audit = buildNftWorldClassAudit({ includeLootboxes: true });
  assert.equal(audit.schema, 'eon.nft-world-class-audit.w84.v1');
  assert.ok(audit.categoryFamilies.includes('lootbox'));
  assert.ok(audit.artSamples.length >= 8);
  assert.ok(audit.lootboxes.length >= 4);
  assert.ok(audit.total >= 85);
  assert.equal(audit.checks.hasUtility, true);
});
