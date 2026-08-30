import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildModuleClosure, inspectCoreCityBoundary, parseHtmlModuleEntries } from '../../scripts/lib/a15-source-authority.mjs';

const CORE_HTML = Object.freeze([
  'index.html', 'create.html', 'projects.html', 'library.html', 'workspace.html', 'forge.html', 'trade.html',
  'automations.html', 'profile.html', 'vault.html', 'capsule.html', 'local-ai.html', 'realm-studio.html'
]);

test('A15 I03 isolates every primary Core route from City implementation modules', () => {
  const boundary = inspectCoreCityBoundary();
  assert.equal(boundary.routeCount, 13);
  assert.equal(boundary.coupledRouteCount, 0);
  assert.equal(boundary.distinctCityModuleCount, 0);
  assert.deepEqual(boundary.routes.flatMap((route) => route.unresolved), []);
});

test('Core retains bounded City compatibility contracts without importing assets/js/city', () => {
  const entries = CORE_HTML.flatMap((file) => parseHtmlModuleEntries(file));
  const closure = buildModuleClosure(entries);
  assert.equal(closure.modules.some((file) => file.startsWith('assets/js/city/')), false);
  assert.equal(closure.modules.some((file) => file.startsWith('assets/js/contracts/city/')), true);
  assert.deepEqual(closure.unresolved, []);
});

test('EONCITY remains an explicit entry instead of a Core bootstrap dependency', () => {
  const source = readFileSync(new URL('../../eoncity.html', import.meta.url), 'utf8');
  assert.match(source, /eon-city-play-core\.js|eon-app-shell\.js/);
});
