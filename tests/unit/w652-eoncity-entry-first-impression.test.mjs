import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonCityEntryExperience, validateEonCityEntryExperience } from '../../assets/js/city/eon-city-entry-experience.js';
import { describeEonCityAccessView, mountEonCityAccessStation } from '../../assets/js/city/eon-city-access-station.js';
import { buildEonCityAccessDecision } from '../../config/w554-eon-city-access-project-portals-contract.mjs';
import { inspectW652EntryFirstImpression } from '../../scripts/w652-eoncity-entry-first-impression-audit.mjs';

function root() { return { dataset: {}, innerHTML: '', querySelector() { return null; } }; }
function machine() { let state='idle'; return { getSnapshot:()=>({state}), transition:(next)=>(state=next,{state}), fail:()=>(state='recoverable-error',{state}) }; }

test('W652 entry promise leads with value while preserving authenticated-only truth', () => {
  const experience = getEonCityEntryExperience();
  assert.equal(validateEonCityEntryExperience(experience).ok, true);
  assert.equal(experience.promise.title, 'Your work becomes a place.');
  assert.equal(experience.promise.authenticatedOnly, true);
  assert.equal(experience.promise.public3dPreview, false);
  assert.deepEqual(experience.highlights.map((item) => item.id), ['command-room','living-districts','agent-theater','explore']);
});

test('W652 signed-out view renders value, identity action and zero heavy imports', async () => {
  const target = root(); let imports = 0;
  const result = await mountEonCityAccessStation(target, {
    runtimeStateMachine: machine(),
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: false }))),
    importImpl: async () => { imports += 1; return {}; }
  });
  assert.equal(result.state, 'login');
  assert.equal(imports, 0);
  assert.match(target.innerHTML, /Your work becomes a place/);
  assert.match(target.innerHTML, /Inside EON City/);
  assert.match(target.innerHTML, /Continue with Google/);
  assert.doesNotMatch(target.innerHTML, /public 3D preview/i);
  assert.equal(describeEonCityAccessView(result.payload).kind, 'login');
});

test('W652 objective source audit clears the previsual 9.5 target', () => {
  const report = inspectW652EntryFirstImpression();
  assert.equal(report.ok, true, report.failures.join('\n'));
  assert.equal(report.localCriteriaScore, 100);
  assert.ok(report.executivePrevisualScore >= 95);
});
