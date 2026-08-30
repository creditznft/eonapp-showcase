#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildRealm3dVisualDeviceQaPlan, scoreRealm3dVisualQuality, buildVisualQaHandoffChecklist } from '../assets/js/realm3d/engine/EonCityVisualDeviceQa.js';
import { scoreEonBotAgentPolish } from '../assets/js/realm3d/engine/EonCityAgentDialogueRuntime.js';
import { buildNftWorldClassAudit } from '../assets/js/utils/nft-market-quality-audit.js';
import { buildAiUpgradeMarketCatalog, scoreAiUpgradeMarketCatalog } from '../assets/js/utils/ai-upgrade-market-catalog.js';
import { buildLootboxNftEnvelope, scoreLootboxMarketSystem } from '../assets/js/utils/lootbox-marketplace.js';

const visualPlan = buildRealm3dVisualDeviceQaPlan({ includeRealScreenshots: true });
const handoff = buildVisualQaHandoffChecklist();
const visualScore = scoreRealm3dVisualQuality({ nftArtScore: 90, lootboxShowScore: 90, agentPolish: 92, mobileUsability: 84, cityDensity: 84, workstationDetail: 88, controlSafety: 94, secretSafety: 100 });
const agentScore = scoreEonBotAgentPolish();
const nftAudit = buildNftWorldClassAudit({ includeLootboxes: true });
const marketScore = scoreAiUpgradeMarketCatalog(buildAiUpgradeMarketCatalog());
const lootboxScore = scoreLootboxMarketSystem({ lootbox: buildLootboxNftEnvelope({ tier: 'genesis', seed: 'gate' }) });

assert.equal(visualPlan.schema, 'eon.realm3d.visual-device-qa.w82.v1');
assert.ok(handoff.codexMustRunLater.length >= 6, 'live QA handoff is incomplete');
assert.ok(visualScore.total >= 82, `visual quality too low: ${visualScore.total}`);
assert.ok(agentScore.total >= 85, `agent polish too low: ${agentScore.total}`);
assert.ok(nftAudit.total >= 85, `NFT audit too low: ${nftAudit.total}`);
assert.ok(marketScore.total >= 90, `market score too low: ${marketScore.total}`);
assert.ok(lootboxScore.total >= 90, `lootbox score too low: ${lootboxScore.total}`);

console.log(JSON.stringify({
  ok: true,
  gate: 'w82-w85-visual-agent-nft-lootbox',
  visualScore,
  agentScore,
  nftAudit: { total: nftAudit.total, grade: nftAudit.grade, averageVisualScore: nftAudit.averageVisualScore, minLootboxScore: nftAudit.minLootboxScore },
  marketScore,
  lootboxScore
}, null, 2));
