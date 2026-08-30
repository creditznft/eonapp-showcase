import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

test('W769F persistence sanitizes operational upgrade records and strips unsafe fields', () => {
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 1000 });
  const base = createEonExpanseW766AInitialState({ now: 10 });
  const write = persistence.write({ ...base, myFrontierUpgrades: { records: [{ plotId: 'plot-creator', buildingId: 'creator-workshop', level: 2, permitId: 'permit-1', sourceReceiptId: 'receipt-2', upgradedAt: 900, privatePrompt: 'secret' }], paidShortcutAccepted: true } });
  assert.equal(write.ok, true);
  const restored = persistence.read();
  assert.equal(restored.myFrontierUpgrades.records.length, 1);
  assert.equal(restored.myFrontierUpgrades.records[0].privatePrompt, undefined);
  assert.equal(restored.myFrontierUpgrades.paidShortcutAccepted, false);
});

test('W769F canonical runtime revalidates upgrades against construction and receipt markers on reload', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /createEonExpanseW769EUpgradeLedger/);
  assert.match(source, /verifyPersistedMyFrontierUpgrade/);
  assert.match(source, /district-upgrade-construction-stale/);
  assert.match(source, /my-frontier-upgrade:\$\{entry\.sourceReceiptId\}/);
  assert.match(source, /getExpanseMyFrontierUpgradeProjection/);
  assert.match(source, /confirmExpanseMyFrontierDistrictUpgrade/);
});

test('W769F passes upgrade projection to the existing canonical My Frontier renderer', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /upgradeProjection: expanseMyFrontierUpgrades\.getSafeProjection\(constructionProjection\)/);
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)[\s\S]*W769F|runRenderLoop[\s\S]*W769F/);
  assert.equal((source.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((source.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((source.match(/runRenderLoop\s*\(/g) || []).length, 1);
});

test('W769F keeps district upgrade explicit, non-financial and XP neutral', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const foundation = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-foundation.js', import.meta.url), 'utf8');
  assert.match(runtime, /explicitUserAction/);
  assert.match(foundation, /paidShortcutAccepted: false/);
  assert.doesNotMatch(runtime + foundation, /awardXp\([^\n]*district-upgrade|checkout[^\n]*district-upgrade|payment[^\n]*district-upgrade/);
});
