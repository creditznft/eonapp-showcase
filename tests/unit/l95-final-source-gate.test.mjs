import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gate = readFileSync(new URL('../../scripts/l95-final-source-gate.mjs', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('Launch95 exposes one deterministic final source gate for Codex handover', () => {
  assert.equal(pkg.scripts['qa:launch95-final'], 'node scripts/l95-final-source-gate.mjs');
  assert.match(gate, /git', \['merge-base', '--is-ancestor'/);
  assert.match(gate, /git', \['diff', '--check', `\$\{LIVE_AUTHORITY\}\.\.HEAD`\]/);
  assert.match(gate, /git', \['diff', '--check'\]/);
  assert.match(gate, /git', \['diff', '--cached', '--check'\]/);
  assert.match(gate, /git', \['ls-files', '--others', '--exclude-standard'\]/);
  assert.match(gate, /--check/);
  assert.match(gate, /\^l95-\.\*\\\.test\\\.mjs\$/);
  assert.match(gate, /--test/);
  assert.match(gate, /run-current-unit-suite\.mjs/);
  assert.match(gate, /EONAPP_GATE_WRITE_EVIDENCE: '0'/);
  assert.match(gate, /w281-ai-provider-lifecycle-gate\.mjs/);
  assert.match(gate, /w306-local-first-boundary-gate\.mjs/);
  assert.match(gate, /rt86-retention-notification-scale-gate\.mjs/);
  assert.match(gate, /rt87-push-device-entitlement-gate\.mjs/);
  assert.match(gate, /run\('git', \['status', '--porcelain=v1', '--untracked-files=all'\]/);
  assert.match(gate, /authorityStatusAfter !== authorityStatusBefore/);
  assert.match(gate, /readOnlyAuthorities=clean/);
  assert.match(gate, /L95_FINAL_SOURCE_GATE/);
});
