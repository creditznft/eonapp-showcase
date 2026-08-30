import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  W147_NPC_VOICE_SOCIAL_RECEIPT_KEY,
  W147_NPC_VOICE_SOCIAL_SCHEMA,
  W147_SOCIAL_LAYERS,
  applyW147NpcVoiceSocialPlanToWorld,
  buildW147NearestNpcSocialSnapshot,
  buildW147NpcVoiceSocialPlan,
  getW147RemainingPhaseSummary,
  recordW147NpcVoiceSocialReceipt,
  resolveW147VoiceTier,
  scoreW147NpcVoiceSocialPlan
} from '../../assets/js/realm3d/engine/EonCityW147NpcVoiceSocialRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.get(String(key)) || null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

test('W147 tier keeps voice opt-in and protects constrained devices', () => {
  const social = resolveW147VoiceTier({ quality: 'standard', voiceSupported: true, recognitionSupported: true, mobile: false, touch: false });
  const mobile = resolveW147VoiceTier({ quality: 'neon', voiceSupported: true, mobile: true, touch: true, saveData: true });
  const textOnly = resolveW147VoiceTier({ voiceSupported: false });
  assert.equal(social.id, 'social-voice');
  assert.equal(social.voiceEnabledByDefault, false);
  assert.equal(social.userGestureRequired, true);
  assert.equal(social.microphoneStartsOnlyAfterTap, true);
  assert.equal(mobile.id, 'safe-proximity');
  assert.equal(textOnly.id, 'text-only');
  assert.equal(textOnly.textFallbackAlwaysAvailable, true);
});

test('W147 plan scores 100 and includes all social safety layers', () => {
  const world = buildEonCityVoxelWorld();
  const plan = buildW147NpcVoiceSocialPlan({ worldKind: world.kind, quality: 'standard', npcs: world.npcs, voice: { voiceSupported: true, recognitionSupported: true } });
  const score = scoreW147NpcVoiceSocialPlan(plan);
  assert.equal(plan.schema, W147_NPC_VOICE_SOCIAL_SCHEMA);
  assert.equal(score.score, 100);
  assert.equal(score.ok, true);
  assert.equal(W147_SOCIAL_LAYERS.length >= 6, true);
  assert.equal(plan.proximityPolicy.volumeUsesDistance, true);
  assert.equal(plan.microphonePolicy.startsOnlyAfterTap, true);
  assert.equal(plan.microphonePolicy.typedFallbackRequired, true);
  assert.equal(plan.socialSafety.noApiKeysSpoken, true);
  assert.equal(plan.socialSafety.noSeedPhrasesSpoken, true);
  assert.equal(plan.socialSafety.noWalletBackupsSpoken, true);
  assert.equal(plan.socialSafety.noFinancialPromises, true);
  assert.equal(plan.npcCues.every((cue) => cue.bubble.length <= 118), true);
});

test('W147 decorates city, private workstation, and generated realm NPCs', () => {
  for (const world of [buildEonCityVoxelWorld(), buildPrivateWorkstationVoxelWorld({ owner: 'unit' }), buildMyRealmVoxelWorld({ username: 'unit' })]) {
    applyW147NpcVoiceSocialPlanToWorld(world, { quality: 'standard', voice: { voiceSupported: true, recognitionSupported: true } });
    assert.equal(world.w147NpcVoiceSocialPlan.schema, W147_NPC_VOICE_SOCIAL_SCHEMA);
    assert.equal(world.w147NpcVoiceSocialScore.score, 100);
    assert.ok(world.npcs.some((npc) => npc.w147SocialCue?.schema), `${world.kind} missing W147 social cue`);
    assert.equal(world.w147NpcVoiceSocialPlan.socialSafety.ownerVisitorBoundary, true);
  }
});

test('W147 nearest NPC snapshot provides proximity bubble and station guidance', () => {
  const world = buildEonCityVoxelWorld();
  const npc = world.npcs[0];
  const snap = buildW147NearestNpcSocialSnapshot({ player: { x: npc.position[0], z: npc.position[1] }, npcs: world.npcs });
  assert.equal(snap.active, true);
  assert.equal(snap.near, true);
  assert.ok(snap.bubble);
  assert.ok(snap.stationGuidance?.route);
});

test('W147 receipt is local, redacted, and consent-safe', () => {
  const storage = new MemoryStorage();
  const world = buildEonCityVoxelWorld();
  const plan = buildW147NpcVoiceSocialPlan({ worldKind: world.kind, quality: 'standard', npcs: world.npcs, voice: { voiceSupported: true, recognitionSupported: true } });
  const score = scoreW147NpcVoiceSocialPlan(plan);
  const receipt = recordW147NpcVoiceSocialReceipt(storage, { plan, score });
  assert.equal(receipt.key, W147_NPC_VOICE_SOCIAL_RECEIPT_KEY);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.voiceEnabledByDefault, false);
  assert.equal(receipt.microphoneStartsOnlyAfterTap, true);
  assert.equal(receipt.secretValuesIncluded, false);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(JSON.stringify(receipt).includes('sk-live'), false);
  assert.equal(Boolean(storage.getItem(W147_NPC_VOICE_SOCIAL_RECEIPT_KEY)), true);
});

test('W147 engine, panel, CSS, route, and package scripts are wired', () => {
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /realmNpcVoiceSocialSession\s*=\s*'w147'/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /getW147NpcVoiceSocialState/);
  assert.match(read('assets/js/realm3d/engine/WorldPanels.js'), /data-w147-npc-voice-social="true"/);
  assert.match(read('assets/js/realm3d/engine/VoxelWorld.js'), /w147NpcVoiceSocial/);
  assert.match(read('assets/css/realm3d.css'), /W147 EON City NPC voice\/proximity\/social pass/);
  assert.match(read('realm.html'), /w147-npc-voice-social-proof\.js/);
  assert.match(read('realm.html'), /data-w147-proof-status/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['qa:w147-npc-voice-social']);
  assert.ok(pkg.scripts['qa:w121-w147-visual-overhaul']);
});

test('W147 remaining phase summary moves to W148 only', () => {
  const summary = getW147RemainingPhaseSummary();
  assert.equal(summary.completedPhase, 'W147');
  assert.equal(summary.npcVoiceSocialDone, true);
  assert.equal(summary.phases.some((phase) => phase.id === 'W147'), false);
  assert.ok(summary.phases.some((phase) => phase.id === 'W148'));
});

test('W147 generated stats prove completion after gate runs', () => {
  const statsPath = path.join(root, 'artifacts', 'W147_NPC_VOICE_SOCIAL_STATS_2026-06-13.json');
  if (!fs.existsSync(statsPath)) return;
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W147_NPC_VOICE_SOCIAL_SCHEMA);
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
  assert.equal(stats.receiptKey, W147_NPC_VOICE_SOCIAL_RECEIPT_KEY);
});
