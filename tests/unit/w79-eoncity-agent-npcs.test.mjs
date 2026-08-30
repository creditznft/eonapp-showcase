import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_NPC_PRIVACY_POLICY,
  buildAgentNpcCatalog,
  buildAgentNpcInteractionPlan,
  buildAgentNpcPanelModel,
  scoreAgentNpcMetaverseReadiness
} from '../../assets/js/realm3d/engine/EonCityAgentNpcRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { getEonCityMegaBlueprint } from '../../assets/js/realm3d/engine/EonCityMegaBlueprint.js';

test('W79 agent NPC policy blocks private data from 3D visitor surfaces', () => {
  assert.equal(AGENT_NPC_PRIVACY_POLICY.visitorRealm.noOwnerPrivateContext, true);
  assert.equal(AGENT_NPC_PRIVACY_POLICY.visitorRealm.npcMode, 'scripted-guide-and-sales-assistant-only');
  assert.ok(AGENT_NPC_PRIVACY_POLICY.forbiddenIn3d.includes('display-api-key'));
  assert.ok(AGENT_NPC_PRIVACY_POLICY.forbiddenIn3d.includes('read-private-chat-to-visitors'));
  assert.ok(AGENT_NPC_PRIVACY_POLICY.forbiddenIn3d.includes('raw-ip-storage'));
});

test('W79 owner agents become AI-backed only when a model/provider is ready', () => {
  const setupCatalog = buildAgentNpcCatalog({ providerStatus: { hasWorkingProvider: false } });
  const readyCatalog = buildAgentNpcCatalog({ providerStatus: { hasWorkingProvider: true } });
  assert.ok(setupCatalog.ownerAgents.length >= 6);
  assert.ok(setupCatalog.ownerAgents.some((agent) => agent.mode === 'setup-required'));
  assert.ok(readyCatalog.ownerAgents.filter((agent) => agent.mode === 'ai-backed-after-user-command').length >= 4);
  assert.ok(readyCatalog.ownerAgents.every((agent) => agent.approvalRequiredFor.includes('publish')));
});

test('W79 visitor NPCs are scripted guides/sales assistants and never private work agents', () => {
  const catalog = buildAgentNpcCatalog({ realm: { ownerName: 'Manisha Realm' } });
  assert.equal(catalog.visitorNpcs.length, 3);
  assert.ok(catalog.visitorNpcs.every((npc) => npc.mode === 'scripted-only'));
  assert.ok(catalog.visitorNpcs.every((npc) => npc.noOwnerPrivateContext));
  assert.ok(catalog.visitorNpcs.some((npc) => npc.id === 'visitor-product-assistant'));
});

test('W79 agent command sanitizer rejects secrets and high-risk autonomy', () => {
  const secretPlan = buildAgentNpcInteractionPlan({ providerStatus: { hasWorkingProvider: true }, commandText: 'use my API key gsk_abc123456789 to auto publish' });
  const safePlan = buildAgentNpcInteractionPlan({ providerStatus: { hasWorkingProvider: true }, commandText: 'draft a product landing page plan' });
  assert.equal(secretPlan.blocked, true);
  assert.equal(secretPlan.commandAccepted, false);
  assert.equal(safePlan.blocked, false);
  assert.equal(safePlan.commandAccepted, true);
});

test('W79 in-world panel model separates private owner agents from visitor NPCs', () => {
  const catalog = buildAgentNpcCatalog({ providerStatus: { hasWorkingProvider: true } });
  const ownerPanel = buildAgentNpcPanelModel(catalog.ownerAgents[0], { ownerView: true });
  const hiddenOwnerPanel = buildAgentNpcPanelModel(catalog.ownerAgents[0], { ownerView: false });
  const visitorPanel = buildAgentNpcPanelModel(catalog.visitorNpcs[0], { ownerView: false });
  assert.equal(ownerPanel.ownerOnly, true);
  assert.equal(ownerPanel.visible, true);
  assert.equal(hiddenOwnerPanel.visible, false);
  assert.equal(visitorPanel.ownerOnly, false);
  assert.equal(visitorPanel.visible, true);
});

test('W79 EON City, private workstation, and generated realms carry agent NPC catalogs safely', () => {
  const city = buildEonCityVoxelWorld();
  const office = buildPrivateWorkstationVoxelWorld({ owner: 'local-operator' });
  const realm = buildMyRealmVoxelWorld({ username: 'creditznft' });
  assert.ok(city.agentNpcCatalog.ownerAgents.length >= 6);
  assert.ok(city.agentNpcCatalog.ownerAgents.some((npc) => npc.id === 'agent-eonbot-copilot'));
  assert.ok(!city.npcs.some((npc) => npc.audience === 'owner-private-workspace-only'), 'public city must not instantiate owner-private work agents');
  assert.ok(office.npcs.some((npc) => npc.audience === 'owner-private-workspace-only'));
  assert.ok(realm.npcs.some((npc) => npc.id === 'visitor-product-assistant'));
  assert.ok(realm.npcs.some((npc) => npc.audience === 'realm-visitors-scripted-only'));
});

test('W79 blueprint and score include AI-agent NPC metaverse target', () => {
  const blueprint = getEonCityMegaBlueprint();
  const plan = buildAgentNpcInteractionPlan({ providerStatus: { hasWorkingProvider: true } });
  const score = scoreAgentNpcMetaverseReadiness(plan);
  assert.equal(blueprint.agentNpcModel.schema, 'eon.realm3d.agent-npc-model.w79.v1');
  assert.ok(blueprint.agentNpcModel.ownerPrivateAgents.includes('EONBot Copilot'));
  assert.ok(blueprint.agentNpcModel.visitorNpcs.includes('Product Assistant'));
  assert.equal(score.total, 100);
  assert.equal(score.grade, 'ready-for-private-agent-npcs');
});
