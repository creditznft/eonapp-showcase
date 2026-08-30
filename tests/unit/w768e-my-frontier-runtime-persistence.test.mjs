import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createEonExpanseW766AInitialState,
  createEonExpanseW766APersistence,
  createEonExpanseW766AWorldSeed
} from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const unlockReceipt = Object.freeze({ id: 'campaign:signal-restoration:complete', campaignId: 'signal-restoration', completedAt: 1785792600000, totalXp: 2100, cosmeticId: 'signal-vanguard-glow' });

test('W768E persists only bounded My Frontier choices and verified construction-shaped records', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 1785795000000 });
  const initial = createEonExpanseW766AInitialState({ seed: createEonExpanseW766AWorldSeed({ profileId: 'w768e-test' }), now: 1785794000000 });
  const write = persistence.write({
    ...initial,
    myFrontier: {
      unlockReceipt,
      buildingChoices: { 'plot-creator': 'creator-workshop', 'plot-knowledge': 'creator-workshop', injected: 'anything' },
      residents: { 'resident-pathfinder': 'pathfinder', injected: 'person' },
      residentReceipts: { 'resident-pathfinder': { id: 'character-arc:pathfinder:beyond-the-gate:1785792700000', residentId: 'pathfinder', completedAt: 1785792700000 }, injected: { id: 'forged', residentId: 'person', completedAt: 1 } },
      processedReceipts: ['my-frontier-unlock:campaign:signal-restoration:complete'],
      privatePrompt: 'must disappear',
      rawCoordinates: { x: 999, z: 999 }
    },
    myFrontierConstruction: {
      records: [
        { plotId: 'plot-creator', buildingId: 'creator-workshop', permitId: 'my-frontier-construction:plot-creator:creator-workshop:creator:verified:1', sourceReceiptId: 'creator:verified:1', authority: 'productive', constructedAt: 1785794900000 },
        { plotId: 'plot-knowledge', buildingId: 'creator-workshop', permitId: 'forged', sourceReceiptId: 'private', authority: 'productive', constructedAt: 1785794900000 }
      ],
      privatePayload: 'must disappear'
    }
  });
  assert.equal(write.ok, true);
  const state = persistence.read(initial);
  assert.equal(state.myFrontier.unlocked, true);
  assert.equal(state.myFrontier.buildingChoices['plot-creator'], 'creator-workshop');
  assert.equal(state.myFrontier.buildingChoices['plot-knowledge'], undefined);
  assert.equal(state.myFrontier.residents['resident-pathfinder'], 'pathfinder');
  assert.equal(state.myFrontier.residentReceipts['resident-pathfinder'].residentId, 'pathfinder');
  assert.equal(state.myFrontier.residentReceipts.injected, undefined);
  assert.equal(state.myFrontierConstruction.records.length, 1);
  assert.equal(state.myFrontierConstruction.records[0].buildingId, 'creator-workshop');
  assert.doesNotMatch(JSON.stringify(state), /must disappear|\"rawCoordinates\"|privatePayload/);
});

test('W768E canonical runtime revalidates unlock, planning, permits and construction without another scene', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /createEonExpanseW768BMyFrontierState/);
  assert.match(runtime, /deriveEonExpanseW768CConstructionPermit/);
  assert.match(runtime, /createEonExpanseW768DConstructionLedger/);
  assert.match(runtime, /productive-result-claim-required/);
  assert.match(runtime, /unlockExpanseMyFrontier/);
  assert.match(runtime, /selectExpanseMyFrontierBuilding/);
  assert.match(runtime, /confirmExpanseMyFrontierConstruction/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});
