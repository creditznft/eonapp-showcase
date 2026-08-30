import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_ART_BIBLE, getEonCityArtBibleSummary, validateEonCityArtBible } from '../../assets/js/city/eon-city-art-bible.js';
import { W624A_CITY_ART_BIBLE_CONTRACT, validateW624aCityArtBibleContract } from '../../config/w624a-city-art-bible-contract.mjs';

test('W624A freezes one coherent Productive Nocturne art direction', () => {
  assert.equal(validateW624aCityArtBibleContract().ok, true);
  assert.equal(validateEonCityArtBible().ok, true);
  assert.match(EON_CITY_ART_BIBLE.vision, /productive/i);
  assert.equal(EON_CITY_ART_BIBLE.pillars.length, 6);
  assert.equal(EON_CITY_ART_BIBLE.palette.usage.neutralSurfaceMinimumPercent, 72);
  assert.equal(EON_CITY_ART_BIBLE.palette.usage.simultaneousHeroAccentsMaximum, 2);
});

test('W624A defines distinct architecture, human scale, and target frames', () => {
  const silhouettes = EON_CITY_ART_BIBLE.architecture.commandDistrictLandmarks.map((row) => row.silhouette);
  assert.equal(EON_CITY_ART_BIBLE.architecture.commandDistrictLandmarks.length, 6);
  assert.equal(new Set(silhouettes).size, silhouettes.length);
  assert.equal(EON_CITY_ART_BIBLE.architecture.scale.playerHeightMeters, 1.76);
  assert.equal(EON_CITY_ART_BIBLE.targetFrames.length, 3);
  for (const frame of EON_CITY_ART_BIBLE.targetFrames) {
    const source = fs.readFileSync(new URL(`../../${frame.path.replace(/^\//, '')}`, import.meta.url), 'utf8');
    assert.match(source, /<svg[\s>]/);
    assert.match(source, /target/i);
  }
});

test('W624A character cast is inclusive, expressive, and tied to real outcomes', () => {
  assert.equal(EON_CITY_ART_BIBLE.cast.player.id, 'wayfinder');
  assert.ok(EON_CITY_ART_BIBLE.cast.player.customizationSlots.includes('mobility aid'));
  assert.ok(EON_CITY_ART_BIBLE.cast.player.prohibitions.includes('pay-to-win statistics'));
  assert.equal(EON_CITY_ART_BIBLE.cast.eonbot.id, 'eonbot-orbit');
  assert.ok(EON_CITY_ART_BIBLE.cast.eonbot.prohibitions.includes('fake autonomous work'));
  assert.equal(EON_CITY_ART_BIBLE.cast.npcs.length, 5);
  assert.ok(EON_CITY_ART_BIBLE.cast.npcs.every((npc) => npc.outcome));
});

test('W624A productive RPG forbids fake outcomes and financial game mechanics', () => {
  const rpg = EON_CITY_ART_BIBLE.productiveRpg;
  assert.equal(rpg.missionContract.mustPersist, true);
  assert.equal(rpg.missionContract.fakeSuccessScreenAllowed, false);
  assert.ok(rpg.missionContract.mustCreateOneOf.includes('saved project'));
  for (const banned of ['cash value', 'token balance', 'loot boxes', 'pay-to-win power']) assert.ok(rpg.progression.prohibited.includes(banned));
  assert.equal(rpg.firstMissions.length, 5);
});

test('W624A budgets and score thresholds are explicit but not claimed as measured proof', () => {
  const summary = getEonCityArtBibleSummary();
  assert.equal(summary.scoreWeight, 100);
  assert.equal(EON_CITY_ART_BIBLE.scorecard.commandDistrictExpansionThreshold, 9);
  assert.equal(EON_CITY_ART_BIBLE.scorecard.flagshipOwnerApprovalThreshold, 9.5);
  assert.match(EON_CITY_ART_BIBLE.budgets.disclaimer, /not current measured/i);
  assert.equal(EON_CITY_ART_BIBLE.releaseBoundary.finalBinaryArt, false);
  assert.equal(EON_CITY_ART_BIBLE.releaseBoundary.finalDeviceCertification, false);
  assert.equal(W624A_CITY_ART_BIBLE_CONTRACT.ownerApproval.approvalStatus, 'pending-target-frame-review');
});
