import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildModeGuidance,
  getModelSelectionPolicyMeta,
  getRuntimePreferenceMeta
} from '../../assets/js/utils/eon-mode-system.js';
import { buildMissionClarifiers, buildMissionPreview } from '../../assets/js/utils/mission-intake.js';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('RT89 Auto mode states the canonical same-provider routing boundary', () => {
  const auto = buildModeGuidance({ assistantMode: 'auto', runtimePreference: 'hybrid', provider: 'cerebras' }, { providerLabel: 'Cerebras' });
  const localFirst = buildModeGuidance({ assistantMode: 'auto', runtimePreference: 'local-first', provider: 'ollama' }, { providerLabel: 'Ollama' });
  assert.match(auto, /inside the provider you explicitly selected and verified/i);
  assert.match(auto, /never grants a silent provider switch/i);
  assert.match(localFirst, /request still runs only through the provider you explicitly selected and verified/i);
  assert.match(getModelSelectionPolicyMeta('best').description, /approved provider envelope/i);
  assert.match(getRuntimePreferenceMeta('hybrid').description, /each request still uses only the provider you explicitly selected and verified/i);
});

test('RT89 mission intake describes delegation planning without autonomous execution claims', () => {
  const preview = buildMissionPreview('Build a launch site', 'autonomous', 'fast', 'performance', 'en');
  assert.match(preview, /Delegation plan: maximum delegation/i);
  assert.match(preview, /Review level: fewer review pauses/i);
  assert.match(preview, /No background work starts from this preview/i);
  assert.doesNotMatch(preview, /Autonomy:/i);

  const questions = buildMissionClarifiers('Build', 'auto', 'normal', 'auto').join(' ');
  assert.match(questions, /Create \/ Forge/i);
  assert.match(questions, /maximize delegation/i);
  assert.doesNotMatch(questions, /WorkBench/i);
});

test('RT89 Chat controls keep model/provider and mission authority truthful at the visible control', () => {
  const source = read('assets/js/chat-page.js');
  assert.match(source, /<span>Delegation plan<\/span>/);
  assert.match(source, /Maximum delegation \(plan only\)/);
  assert.match(source, /Fewer review pauses \(plan only\)/);
  assert.match(source, /Auto \/ Best \/ Fast \/ Economy rank only models already verified for the selected provider/i);
  assert.match(source, /it never silently switches providers, installs a runtime, downloads a model, or starts a request/i);
  assert.doesNotMatch(source, /<option value="autonomous">Autonomous<\/option>/);
  assert.doesNotMatch(source, /<option value="fast">Fast track<\/option>/);
});

test('RT89 empty Agent Theatre offers real work entry points while remaining receipt-only', () => {
  const source = read('assets/js/work-surface/adapters/eon-command-centre-panel.js');
  assert.match(source, /Start useful work in EONBOT, Create \/ Forge or Automations/i);
  assert.match(source, /real job status appears here only when a maintained surface records it/i);
  assert.match(source, /data-eon-command-open="chat">Ask EONBOT/);
  assert.match(source, /data-eon-command-open="create">Open Create \/ Forge/);
  assert.match(source, /data-eon-command-open="automations">Open Automations/);
});
