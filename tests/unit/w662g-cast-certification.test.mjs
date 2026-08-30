import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getEonCityCastCertificationPlan, getEonCityCastCertificationTruth, renderEonCityCastCertificationMarkup } from '../../assets/js/city/eon-city-cast-certification.js';

test('W662G projects all source-controlled cast without fabricating browser acceptance', () => {
  const plan = getEonCityCastCertificationPlan();
  assert.equal(plan.rows.length, 15);
  assert.equal(plan.counts.loaded, 0);
  assert.equal(plan.authenticatedHumanProof, false);
  assert.ok(plan.rows.some((row) => row.assetId === 'eoncity-eonbot-orbit' && row.expectedAnimations.includes('dock')));
  assert.ok(plan.rows.every((row) => row.browserProofRequired));
  assert.equal(getEonCityCastCertificationTruth().noFabricatedPass, true);
});

test('W662G accepts bounded runtime observations while preserving fallback truth', () => {
  const plan = getEonCityCastCertificationPlan({ runtimeSummary: { characterAssets: [
    { id: 'eoncity-pathfinder-prime-11clips', primaryLoaded: true, animationStates: ['idle', 'walk', 'run'], functionalRoleObserved: true },
    { id: 'eoncity-eonbot-orbit', fallbackLoaded: true, animationStates: ['hover', 'follow'], terminalOrDockObserved: false }
  ] } });
  const hero = plan.rows.find((row) => row.assetId === 'eoncity-pathfinder-prime-11clips');
  const eonbot = plan.rows.find((row) => row.assetId === 'eoncity-eonbot-orbit');
  assert.equal(hero.fallbackInactive, true);
  assert.equal(eonbot.fallbackLoaded, true);
  assert.equal(eonbot.terminalOrDockObserved, false);
  assert.match(renderEonCityCastCertificationMarkup(plan), /browser proof required/i);
});

test('W662G is exposed from the City menu but not the persistent HUD', () => {
  const station = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  assert.match(station, /data-eon-play-open-cast-certification/);
  assert.match(station, /data-eon-play-cast-certification-panel/);
  const directHud = station.match(/const directHudActions = '([^']+)'/)?.[1] || '';
  assert.doesNotMatch(directHud, /cast-certification/);
});
