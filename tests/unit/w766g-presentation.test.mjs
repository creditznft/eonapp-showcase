import assert from 'node:assert/strict';
import { resolveEonExpanseW766GQualityProfile, projectEonExpanseW766GRestoration, buildEonExpanseW766GMissionBoardView, buildEonExpanseW766GMapPresentation } from '../../assets/js/city/w766/eon-expanse-w766g-presentation-director.js';
assert.equal(resolveEonExpanseW766GQualityProfile('cinematic', { mobile: true }).id, 'balanced');
assert.equal(resolveEonExpanseW766GQualityProfile('balanced', { reducedMotion: true }).particles, 0);
const restored = projectEonExpanseW766GRestoration({ milestones: ['beacon-one-repaired','beacon-two-repaired','regional-transit-restored','regional-core-synchronized','campaign:signal-restoration:complete'], currentZone: 'horizon-vault' });
assert.equal(restored.global.restorationPercent, 100); assert.equal(restored.zones['horizon-vault'].celebration, true); assert.equal(restored.global.returnRouteAlwaysAvailable, true);
const board = buildEonExpanseW766GMissionBoardView({ campaignBoard: { currentLevel: 8, totalXp: 2040, completion: { completed: 7, total: 7, campaignComplete: true }, reward: { owned: true } }, contentSummary: { sideCompleted: 2, productiveCompleted: 1, discoveries: 3, discoveryTotal: 5 }, map: { completionPercent: 100 } });
assert.equal(board.campaign.complete, true); assert.equal(board.discoveries.completed, 3);
const map = buildEonExpanseW766GMapPresentation({ completionPercent: 20, zones: [{ id:'x',label:'X',discovered:false,current:false,transitUnlocked:false }] }); assert.equal(map.zones[0].truthfulLabel, 'Undiscovered Signal'); assert.equal(map.hardWorldEdgeShown, false);
console.log('w766g presentation tests passed');

import { readFileSync } from 'node:fs';
const visualSource = readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766g-visual-director.js', import.meta.url), 'utf8');
assert.match(visualSource, /Scene\.FOGMODE_EXP2/);
assert.match(visualSource, /hubVisualStateRestored/);
