import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('closing a City workspace returns to the exact Open World with a next-action reminder', () => {
  assert.match(runtime, /source\?\.snapshot\?\.worldMode === 'EXPANSE_ACTIVE'/);
  assert.match(runtime, /Back in My Frontier\. Next:/);
  assert.match(runtime, /Back in Storm Sector\. Next:/);
  assert.match(runtime, /Back in Signal Frontier\. Next:/);
});

test('workspace return guidance derives from maintained world state instead of mutating progression', () => {
  assert.match(runtime, /deriveCurrentMyFrontierReadiness\(\)/);
  assert.match(runtime, /expanseStormSectorMissions\.getView\(\)\?\.nextObjective/);
  assert.match(runtime, /deriveEonExpanseW772CCurrentObjectiveAuthority\(buildEonExpanseW766EMissionBoard\(expanseMissionRuntime\.getState\(\)\)\)/);
  assert.doesNotMatch(runtime, /Back in My Frontier[\s\S]{0,180}award/i);
});
