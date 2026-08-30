import assert from 'node:assert/strict';
import test from 'node:test';
import { CITY_MODE_ROUTES, RETIRED_CITY_MODE_PATHS, getCityModeForPath } from '../../assets/js/contracts/city/city-mode-transition.js';
import { validateW428OnePublicCityRetirementContract } from '../../config/w428-one-public-city-retirement-contract.mjs';
import { inspectW428OnePublicCityRetirement } from '../../scripts/w428-one-public-city-retirement-gate.mjs';
test('W428 resolves legacy City mode identifiers to canonical Babylon City only',()=>{
 assert.deepEqual(validateW428OnePublicCityRetirementContract(),[]);
 assert.equal(CITY_MODE_ROUTES.portal,'/eoncity'); assert.equal(CITY_MODE_ROUTES.overview,'/eoncity'); assert.equal(CITY_MODE_ROUTES['command-space'],'/eoncity'); assert.equal(CITY_MODE_ROUTES['immersive-work'],'/eoncity');
 assert.equal(RETIRED_CITY_MODE_PATHS.has('/eoncity/tour'),true); assert.equal(RETIRED_CITY_MODE_PATHS.has('/realm'),true); assert.equal(RETIRED_CITY_MODE_PATHS.has('/eoncity.html'),true); assert.equal(getCityModeForPath('/eoncity/tour'),null); assert.equal(getCityModeForPath('/realm'),null);
});
test('W428 source gate is green without deployed redirect claims',()=>{const report=inspectW428OnePublicCityRetirement({writeArtifact:false});assert.equal(report.status,'pass');assert.ok(report.checkCount>=10);assert.match(report.limitations.join(' '),/Static source verification only/i);});
