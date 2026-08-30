import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const page = fs.readFileSync(path.join(root, 'assets/js/local-ai/local-ai-page.js'), 'utf8');
const setup = fs.readFileSync(path.join(root, 'assets/js/local-ai/local-ai-consumer-setup.js'), 'utf8');

test('RT92 Local AI first run surfaces an official installer CTA instead of looping setup', () => {
  assert.match(setup, /action:\s*bridge\.ok\s*\?\s*'connect-companion'\s*:\s*'install-local-runtime'/);
  assert.match(page, /consumerAction === 'install-local-runtime'[\s\S]*buildLocalAiSetupGuide\(profile, \{ goalId: 'private-chat' \}\)/);
  assert.match(page, /recommendedInstaller\?\.officialDownloadUrl/);
  assert.match(page, /data-local-runtime-acquire/);
  assert.match(page, />Install \$\{escapeHtml\(recommendedInstaller\.label\)\}<\/a>/);
  assert.match(page, /Other supported apps/);
});

test('RT92 Local AI installer handoff remains explicit and rechecks only after browser focus returns', () => {
  assert.match(page, /target="_blank" rel="noreferrer noopener" data-local-runtime-acquire/);
  assert.match(page, /Install the official local AI app, then return here\. EON will check it automatically\./);
  assert.match(page, /addEventListener\?\.\('focus', resume, \{ once: true \}\)/);
  assert.doesNotMatch(page, /auto(?:matically)?[- ]install(?:s|ing)?\s+(?:LM Studio|Ollama|Jan)/i);
});
