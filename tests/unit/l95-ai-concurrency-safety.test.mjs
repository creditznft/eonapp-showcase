import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');

test('L95 EONBOT allows only one foreground AI request at a time in the browser session', () => {
  assert.match(runtime, /const RATE_CONCURRENCY_MAX\s*=\s*1/);
  assert.match(runtime, /if \(_inflightCount >= RATE_CONCURRENCY_MAX\)[\s\S]*A request is already in progress/);
});

test('L95 batch and streaming replies both hold and release workload leases', () => {
  assert.match(runtime, /acquireAiWorkloadLease\(provider, runtimeSettings\)/);
  assert.match(runtime, /workloadLease\?\.release\?\.\('eonbot-reply-complete'\)/);
  assert.match(runtime, /acquireAiWorkloadLease\(provider, runtimeSettings, \{ streamed: true \}\)/);
  assert.match(runtime, /workloadLease\?\.release\?\.\('eonbot-stream-complete'\)/);
});
