import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const routes = JSON.parse(fs.readFileSync(path.join(root, '_routes.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github/workflows/preview.yml'), 'utf8');
const activeApi = fs.readdirSync(path.join(root, 'functions/api'), { recursive: true }).filter((file) => file.endsWith('.js'));

test('W655 routing contract is version 1 and API/CSP scoped', () => {
  assert.equal(routes.version, 1);
  assert.deepEqual(routes.exclude, []);
  assert.ok(routes.include.includes('/api/*'));
  assert.ok(routes.include.includes('/csp-report'));
  assert.ok(routes.include.includes('/city-private/*'));
  assert.ok(!routes.include.includes('/*'));
  assert.ok(!routes.include.some((route) => /^\/assets(?:\/|\*)/.test(route)));
  assert.ok(!routes.include.some((route) => /\.(?:glb|js|css|png|jpg)\*?$/.test(route)));
});

test('every active API Function is covered by /api/*', () => {
  assert.ok(activeApi.length > 0);
  assert.ok(routes.include.includes('/api/*'));
});

test('build and Preview preserve exact candidate dist and same-commit Functions', () => {
  const build = fs.readFileSync(path.join(root, 'scripts/build-production.mjs'), 'utf8');
  assert.match(build, /'_routes\.json'/);
  assert.match(workflow, /node scripts\/w660l-stage-pages-deploy-root\.mjs/);
  assert.match(workflow, /--candidate "\$\{\{ steps\.candidate\.outputs\.root \}\}"/);
  assert.match(workflow, /--output "\$DEPLOY_ROOT"/);
  assert.match(workflow, /test -f "\$DEPLOY_ROOT\/functions\/api\/auth\/session\.js"/);
  assert.match(workflow, /test -f "\$DEPLOY_ROOT\/functions\/api\/city\/access\.js"/);
  assert.match(workflow, /cd "\$DEPLOY_ROOT"/);
  assert.match(workflow, /wrangler@4 pages deploy \. /);
  assert.match(workflow, /w641-verify-release-candidate/);
  assert.doesNotMatch(workflow, /npm run build/);
});
