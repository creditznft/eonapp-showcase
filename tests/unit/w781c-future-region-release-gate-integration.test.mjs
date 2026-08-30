import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W781C derives presentation audit and release gate from the canonical open-world summary', () => {
  assert.match(runtime, /auditEonExpanseW781AOpenWorldArt\(openWorld \|\| \{\}\)/);
  assert.match(runtime, /deriveEonExpanseW781BFutureRegionReleaseGate\(\{ programme: futureRegionProgramme, artAudit: openWorldArtAudit, authoredRegionPackageCertification: futureRegionPackageCertification \}\)/);
  assert.match(runtime, /openWorldArtAudit,/);
  assert.match(runtime, /futureRegionReleaseGate,/);
});

test('W781C surfaces proxy blockers and release status through the existing frontier card', () => {
  assert.match(overlay, /futureRegionReleaseGate: lastBoard\.futureRegionReleaseGate/);
  assert.match(overlay, /Release gate:/);
  assert.match(overlay, /deterministic development proxies still require authored replacement/);
  assert.match(overlay, /blockingProxyCount/);
});

test('W781C adds no release button, gateway activation or second runtime', () => {
  assert.doesNotMatch(overlay, /Activate future gateway/);
  assert.doesNotMatch(runtime, /futureRegionReleaseGate[^\n]*activateGateway/);
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
});
