import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getCreatorEngineWorkspaceTruth } from '../../assets/js/creator/creator-engine-workspace.js';

const createHub = readFileSync(new URL('../../assets/js/create/eon-create-hub.js', import.meta.url), 'utf8');
const workspace = readFileSync(new URL('../../assets/js/creator/creator-engine-workspace.js', import.meta.url), 'utf8');

test('RT89 exposes direct Local and Direct BYOK launch controls for image/video without auto-running either rail', () => {
  assert.match(createHub, /data-eon-create-execution-rail="local-runtime"/);
  assert.match(createHub, /data-eon-create-execution-rail="direct-user-owned-byok"/);
  assert.match(createHub, /details\.open = true/);
  assert.match(createHub, /\[data-comfy-scan\]/);
  assert.match(createHub, /\[data-video-scan\]/);
  assert.match(createHub, /\[data-eon-direct-scan\]/);
  assert.doesNotMatch(createHub, /focusMediaExecutionRail[\s\S]{0,1400}\.click\(\)/);
});

test('RT89 keeps Workspace a no-effect planner and names Create as the canonical media execution surface', () => {
  const truth = getCreatorEngineWorkspaceTruth();
  assert.equal(truth.canonicalSurface, 'Workspace');
  assert.equal(truth.canonicalExecutionSurface, '/create');
  assert.equal(truth.workspaceRole, 'planning-and-handoff');
  assert.equal(truth.mediaProviderCalls, false);
  assert.match(workspace, /Plan here, execute in Create/);
  assert.match(workspace, /This Workspace planner itself never installs a model, reads a provider credential, uploads media, starts generation, or publishes/);
  assert.doesNotMatch(workspace, /direct creator media calls are not enabled in this release/i);
});

test('RT89 keeps internal launch-engineering jargon out of the primary Creator and Local AI guidance', () => {
  const sources = [
    readFileSync(new URL('../../assets/js/create/eon-music-studio.js', import.meta.url), 'utf8'),
    readFileSync(new URL('../../assets/js/direct-byok/eon-direct-media-studio.js', import.meta.url), 'utf8'),
    readFileSync(new URL('../../assets/js/direct-byok/direct-byok-workspace.js', import.meta.url), 'utf8'),
    readFileSync(new URL('../../assets/js/local-ai/local-ai-page.js', import.meta.url), 'utf8')
  ].join('\n');
  assert.doesNotMatch(sources, /until Codex|institutional provider programme|Manual real-output matrix/);
  assert.match(sources, /Technical real-output verification \(advanced\)/);
  assert.match(sources, /This is for owner\/developer launch checks, not normal Local AI setup/);
});

test('RT93 preserves truthful Music Lab status across a rerender', () => {
  const music = readFileSync(new URL('../../assets/js/create/eon-music-studio.js', import.meta.url), 'utf8');
  assert.match(music, /const DEFAULT_MUSIC_STATUS = 'Ready\. No audio starts until you press Play or explicitly generate\/preview a track\.';/);
  assert.match(music, /let musicStatusMessage = DEFAULT_MUSIC_STATUS;/);
  assert.match(music, /data-music-status aria-live="polite">\$\{escapeHtml\(musicStatusMessage\)\}/);
  assert.match(music, /musicStatusMessage = String\(message \|\| DEFAULT_MUSIC_STATUS\);/);
  assert.match(music, /EONBOT model pattern applied\./);
  assert.match(music, /EONBOT was unavailable; a deterministic local pattern was applied instead\./);
});
