import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const host = await readFile(new URL('../../assets/js/work-surface/eon-work-surface-host.js', import.meta.url), 'utf8');

test('L95 work surfaces cannot remain indefinitely on Preparing', () => {
  assert.match(host, /const ADAPTER_LOAD_TIMEOUT_MS = 6000/);
  assert.match(host, /Promise\.race\(\[loadEonWorkSurfaceAdapter\(adapterPath\), timeout\]\)/);
  assert.match(host, /work-surface-adapter-load-timeout/);
});

test('L95 timed-out workspaces keep a maintained-page escape and an immediate Close action', () => {
  assert.match(host, /This workspace took too long to prepare\. Use the maintained page now or close and keep playing\./);
  assert.match(host, /Open \$\{escapeText\(invocation\.definition\.label\)\} page/);
  assert.match(host, /data-eon-work-surface-close>Close/);
  assert.match(host, /return freeze\(\{ ok: false, reason: 'adapter-load-timeout' \}\)/);
});
