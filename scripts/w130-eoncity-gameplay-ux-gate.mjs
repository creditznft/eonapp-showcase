import fs from 'node:fs';
import path from 'node:path';
import { buildEonCityVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const world = buildEonCityVoxelWorld();
const plan = world.w130GameplayUxPlan || {};
const score = world.w130GameplayUxScore || {};
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const css = read('assets/css/realm3d.css');
const mapJs = read('assets/js/realm3d/engine/EonCityMap.js');

assert(plan.schema === 'eon.realm3d.w130.gameplay-ux-pass.v1', 'missing W130 gameplay UX plan on city world');
assert(score.score === 100 && score.ok === true, 'W130 score is not 100');
assert((plan.approachPrompts || []).length >= 10, 'missing approach prompts for all districts');
assert((plan.previewOverlays || []).length >= 10, 'missing full-screen building preview overlays');
assert((plan.teleportDirectory?.entryCount || 0) >= 10, 'missing minimap/room teleport directory entries');
assert((plan.teleportDirectory?.missingRoomIds || []).length === 0, 'teleport directory has missing rooms');
assert((plan.heroScreens || []).length >= 10, 'missing one hero screen per room');
assert((plan.npcGuideBubbles || []).length >= 8, 'missing NPC first-visit guide bubbles');
assert(plan.mobileNpcPolicy?.faceScale >= 1.35, 'mobile NPC face scale not strengthened');
assert(plan.mobileNpcPolicy?.bubbleMinimumTapTarget >= 48, 'mobile NPC guide bubbles are not touch-safe');
assert(plan.roomUxPolicy?.oneHeroScreenPerRoom === true, 'room UX policy missing one hero screen rule');
assert(plan.roomUxPolicy?.workstationShortcutAlwaysVisible === true, 'missing workstation shortcut policy');
assert(plan.roomUxPolicy?.eonbotShortcutAlwaysVisible === true, 'missing EONBOT shortcut policy');

assert(/realmGameplayUxSession\s*=\s*'w130'/.test(engine), 'EngineBoot missing W130 dataset');
assert(/data-realm3d-room-menu/.test(engine), 'EngineBoot missing Rooms menu button/wiring');
assert(/openW130RoomTeleportMenu/.test(engine), 'EngineBoot missing room teleport menu method');
assert(/buildW130ApproachPrompt/.test(engine), 'EngineBoot missing approach prompt import/use');
assert(/data-w130-approach-prompt/.test(engine), 'interaction chip missing W130 approach prompt dataset');
assert(/openRoomTeleportMenu/.test(panels), 'WorldPanels missing teleport menu');
assert(/data-w130-room-teleport="true"/.test(panels), 'WorldPanels missing W130 teleport marker');
assert(/Open full page/.test(panels) && /Enter room/.test(panels), 'teleport menu missing page/room actions');
assert(/W130 gameplay UX pass/.test(css), 'realm3d CSS missing W130 marker');
assert(/\.realm3d-room-teleport-grid/.test(css), 'CSS missing room teleport grid');
assert(/min-height:\s*48px/.test(css), 'CSS missing mobile tap target rule');
assert(/buildW130GameplayUxPlan/.test(mapJs), 'EonCityMap missing W130 plan import/use');
assert(/w130GameplayUxScore/.test(mapJs), 'EonCityMap missing W130 score assignment');

const stats = {
  wave: 'W130_EONCITY_GAMEPLAY_UX_PASS',
  generatedAt: new Date().toISOString(),
  score: failures.length ? 0 : 100,
  approachPrompts: plan.approachPrompts?.length || 0,
  previewOverlays: plan.previewOverlays?.length || 0,
  teleportEntries: plan.teleportDirectory?.entryCount || 0,
  heroScreens: plan.heroScreens?.length || 0,
  npcGuideBubbles: plan.npcGuideBubbles?.length || 0,
  mobileNpcFaceScale: plan.mobileNpcPolicy?.faceScale || 0,
  remainingPhasesAfterW130: ['W131 Market trust + starter drop proof', 'W132 Telegram + Monetag production proof', 'W133 Support/Tools/footer cleanup', 'W134 Dependency security'],
  failures
};

fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W130_EONCITY_GAMEPLAY_UX_STATS_2026-06-12.json'), JSON.stringify(stats, null, 2));

if (failures.length) {
  console.error('W130 EON City gameplay UX gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`W130 EON City gameplay UX gate passed: ${stats.approachPrompts} prompts, ${stats.previewOverlays} overlays, ${stats.teleportEntries} teleport entries, ${stats.heroScreens} hero screens, score ${stats.score}.`);
