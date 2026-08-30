#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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
} from '../assets/js/realm3d/engine/EonCityW147NpcVoiceSocialRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';

const root = process.cwd();
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.get(String(key)) || null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

const city = buildEonCityVoxelWorld();
const privateWorld = buildPrivateWorkstationVoxelWorld({ owner: 'gate' });
const myRealm = buildMyRealmVoxelWorld({ username: 'gate', seed: 'w147' });
const socialTier = resolveW147VoiceTier({ quality: 'standard', voiceSupported: true, recognitionSupported: true, mobile: false, touch: false });
const mobileTier = resolveW147VoiceTier({ quality: 'neon', voiceSupported: true, mobile: true, touch: true, saveData: true });
const textOnlyTier = resolveW147VoiceTier({ voiceSupported: false });
const plan = buildW147NpcVoiceSocialPlan({ worldKind: city.kind, quality: 'standard', npcs: city.npcs, voice: { voiceSupported: true, recognitionSupported: true } });
const score = scoreW147NpcVoiceSocialPlan(plan);
const nearest = buildW147NearestNpcSocialSnapshot({ player: { x: city.npcs[0]?.position?.[0] || 0, z: city.npcs[0]?.position?.[1] || 0 }, npcs: city.npcs });
const storage = new MemoryStorage();
const receipt = recordW147NpcVoiceSocialReceipt(storage, { plan, score });
const summary = getW147RemainingPhaseSummary();
const pkg = JSON.parse(read('package.json'));
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const voxel = read('assets/js/realm3d/engine/VoxelWorld.js');
const css = read('assets/css/realm3d.css');
const realmHtml = read('realm.html');

assert(W147_SOCIAL_LAYERS.length >= 6, 'W147 must define six social/voice layers');
assert(socialTier.id === 'social-voice' && socialTier.voiceEnabledByDefault === false && socialTier.microphoneStartsOnlyAfterTap === true, 'desktop voice tier is not opt-in/consent-safe');
assert(mobileTier.id === 'safe-proximity' && mobileTier.textFallbackAlwaysAvailable === true, 'mobile tier is not safe-proximity');
assert(textOnlyTier.id === 'text-only', 'text-only fallback missing');
assert(plan.schema === W147_NPC_VOICE_SOCIAL_SCHEMA, 'W147 plan schema missing');
assert(score.score === 100 && score.ok === true, 'W147 plan score is not 100');
assert(plan.npcCues.length >= 6, 'W147 missing NPC cue proof');
assert(plan.npcCues.every((cue) => cue.bubble && cue.bubble.length <= 118), 'W147 speech bubbles are missing or too long');
assert(plan.proximityPolicy.volumeUsesDistance === true && plan.proximityPolicy.oneSpeakerAtATime === true, 'W147 proximity voice policy failed');
assert(plan.microphonePolicy.startsOnlyAfterTap === true && plan.microphonePolicy.typedFallbackRequired === true, 'W147 microphone consent fallback failed');
assert(plan.socialSafety.ownerVisitorBoundary === true && plan.socialSafety.noPrivateJobsSpokenToVisitors === true, 'W147 owner/visitor boundary failed');
assert(plan.socialSafety.noApiKeysSpoken === true && plan.socialSafety.noSeedPhrasesSpoken === true && plan.socialSafety.noWalletBackupsSpoken === true && plan.socialSafety.noFinancialPromises === true, 'W147 secret/financial safety failed');
assert(nearest.active === true && nearest.near === true && Boolean(nearest.bubble) && Boolean(nearest.stationGuidance?.route), 'W147 nearest NPC social snapshot failed');
for (const [label, world] of [['city', city], ['private', privateWorld], ['my-realm', myRealm]]) {
  applyW147NpcVoiceSocialPlanToWorld(world, { quality: 'standard', voice: { voiceSupported: true, recognitionSupported: true } });
  assert(world.w147NpcVoiceSocialScore?.score === 100, `${label} world W147 score is not 100`);
  assert((world.npcs || []).some((npc) => npc.w147SocialCue?.schema === `${W147_NPC_VOICE_SOCIAL_SCHEMA}.npc-cue`), `${label} world missing W147 social cue`);
}
assert(receipt?.key === W147_NPC_VOICE_SOCIAL_RECEIPT_KEY && receipt.ok === true && receipt.voiceEnabledByDefault === false && receipt.microphoneStartsOnlyAfterTap === true, 'W147 receipt failed');
assert(receipt.secretValuesIncluded === false && receipt.userDataMutation === false && receipt.noFinancialPromises === true, 'W147 receipt safety failed');
assert(Boolean(storage.getItem(W147_NPC_VOICE_SOCIAL_RECEIPT_KEY)), 'W147 receipt was not saved');
assert(summary.npcVoiceSocialDone === true && !summary.phases.some((phase) => phase.id === 'W147') && summary.phases.some((phase) => phase.id === 'W148'), 'W147 remaining phase summary invalid');
assert(/realmNpcVoiceSocialSession\s*=\s*'w147'/.test(engine), 'EngineBoot missing W147 dataset');
assert(/getW147NpcVoiceSocialState/.test(engine), 'EngineBoot missing W147 state');
assert(/voiceSocial/.test(engine), 'EngineBoot missing W147 runtime');
assert(/data-w147-npc-voice-social="true"/.test(panels), 'WorldPanels missing W147 proof card');
assert(/w147NpcVoiceSocial/.test(voxel), 'VoxelWorld missing W147 telemetry/cue support');
assert(/W147 EON City NPC voice\/proximity\/social pass/.test(css), 'CSS missing W147 marker');
assert(/w147-npc-voice-social-proof\.js/.test(realmHtml), 'realm.html missing W147 proof script');
assert(/data-w147-proof-status/.test(realmHtml), 'realm.html missing W147 proof status');
assert(Boolean(pkg.scripts?.['qa:w147-npc-voice-social']), 'package missing W147 QA script');
assert(Boolean(pkg.scripts?.['qa:w121-w147-visual-overhaul']), 'package missing W121-W147 cumulative script');

const stats = {
  schema: W147_NPC_VOICE_SOCIAL_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  receiptKey: W147_NPC_VOICE_SOCIAL_RECEIPT_KEY,
  socialTier,
  mobileTier,
  textOnlyTier,
  npcCueCount: plan.npcCues.length,
  robotGuideCount: plan.robotGuideCount,
  ownerPrivateCount: plan.ownerPrivateCount,
  stationTargets: plan.stationTargets,
  nearest,
  remainingPhases: summary.phases,
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w147-npc-voice-social-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W147_NPC_VOICE_SOCIAL_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W147] NPC voice/proximity/social gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W147] NPC voice/proximity/social passed (${stats.score}/100): ${stats.npcCueCount} NPC cues, ${stats.robotGuideCount} robot guides, ${stats.ownerPrivateCount} owner-private boundaries, ${stats.stationTargets.length} station targets. Voice remains opt-in; mic requires tap.`);
