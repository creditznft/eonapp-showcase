import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';

function summarize(world) {
  return {
    kind: world.kind,
    blocks: world.blocks?.length || 0,
    finalAaaBlocks: (world.blocks || []).filter((block) => block.finalAaaPolish).length,
    animatedAnchors: (world.blocks || []).filter((block) => block.animation || block.cinematicAnchor).length,
    screens: world.workstationScreens?.length || 0,
    cityStations: world.cityStationScreens?.length || 0,
    artScore: world.artQualityScore?.total || 0,
    finalAaaScore: world.finalAaaUserScore?.total || 0,
    finalAaaGrade: world.finalAaaUserScore?.grade || 'missing',
    realBrowserQaRequired: world.finalAaaVisualQa?.passBeforeRelease === false
  };
}

const report = {
  schema: 'eon.w92.final-aaa-handoff-gate.v1',
  city: summarize(buildEonCityVoxelWorld()),
  workstation: summarize(buildPrivateWorkstationVoxelWorld({ owner: 'qa' })),
  realm: summarize(buildMyRealmVoxelWorld({ username: 'qa-owner', seed: 'w92-final' }))
};

const failures = [];
if (report.city.finalAaaScore < 94) failures.push(`city final score ${report.city.finalAaaScore} < 94`);
if (report.workstation.finalAaaScore < 90) failures.push(`workstation final score ${report.workstation.finalAaaScore} < 90`);
if (report.realm.finalAaaScore < 92) failures.push(`realm final score ${report.realm.finalAaaScore} < 92`);
if (report.city.finalAaaBlocks < 230) failures.push('city lacks final AAA polish block density');
if (report.realm.finalAaaBlocks < 80) failures.push('realm lacks final AAA polish block density');
if (!report.city.realBrowserQaRequired || !report.realm.realBrowserQaRequired) failures.push('real browser QA requirement must stay explicit');

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, report }, null, 2));
