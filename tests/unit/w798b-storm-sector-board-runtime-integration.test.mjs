import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W798B derives Storm Board from canonical mission transit NPC and presentation truth', () => {
  assert.match(source, /deriveEonExpanseW798AStormBoard/);
  assert.match(source, /activeRegionId: expanseActiveRegionId/);
  assert.match(source, /missionState: expanseStormSectorMissions\.getState\(\)/);
  assert.match(source, /transitState: expanseStormSectorTransit\.getState\(\)/);
  assert.match(source, /npcSummary: expanseStormSectorNpcs\?\.getSummary/);
  assert.match(source, /presentationSummary: expanseStormSectorPresenter\?\.getSummary/);
  assert.match(source, /stormSector,/);
});

test('W798B switches HUD and suppresses Signal-only assistance inside Storm Sector', () => {
  assert.match(source, /resolveEonExpanseW792BStormSectorZone/);
  assert.match(source, /stormGuidancePresentation/);
  assert.match(source, /zoneLabel: stormSectorZone\?\.label \|\| 'Storm Sector'/);
  assert.match(source, /const signalFrontierActive = expanseActive && expanseActiveRegionId === 'signal-frontier' && !stormSector\.active/);
  assert.match(source, /expanseActive: signalFrontierActive/);
  assert.match(source, /deriveEonExpanseW767PDynamicEventPresentation\(signalFrontierActive \? activeExpanseEvent : null/);
  assert.match(source, /storm-sector-physical-navigation/);
});

test('W798B does not create another runtime or progression authority', () => {
  assert.equal((source.match(/new Engine\(/g) || []).length, 1);
  assert.equal((source.match(/new Scene\(/g) || []).length, 1);
  assert.equal((source.match(/runRenderLoop\(/g) || []).length, 1);
  assert.doesNotMatch(source, /stormSector\.grantXp|stormSector\.recordAction/);
});
