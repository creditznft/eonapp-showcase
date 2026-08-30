import assert from 'node:assert/strict';
import test from 'node:test';
import { W520_CORE_SEAMS, validateW520CoreModularisationContract } from '../../config/w520-core-modularisation-contract.mjs';
import { inspectW520CoreModularisation } from '../../scripts/w520-core-modularisation-gate.mjs';
import { DEFAULT_AI_PROVIDER_ID, PROVIDERS, normalizeAIProviderId } from '../../assets/js/chat/ai-provider-catalog.js';
import { createChatDailyGuideUsageStore, createChatMissionTimelineStore } from '../../assets/js/chat/chat-page-session-state.js';
import { getEonShellPopoverPlacement, renderEonShellNavigationMarkup, resolveEonShellPage } from '../../assets/js/shell/eon-shell-navigation.js';
import { deriveRecoveryStatus, normalizeBrowserAttachments, normalizeBrowserWorkspaceProfiles, normalizeRecoveryState } from '../../assets/js/utils/profile/profile-browser-state.js';

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
}

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W520 core seams reduce all four orchestrators and add no boundary cycle', () => {
  assert.deepEqual(validateW520CoreModularisationContract(), []);
  const report = inspectW520CoreModularisation();
  assert.equal(report.ok, true, report.issues.join('\n'));
  assert.equal(report.seams.length, 4);
  assert.deepEqual(report.seams.map((seam) => seam.id), W520_CORE_SEAMS.map((seam) => seam.id));
  assert.ok(report.seams.every((seam) => seam.reducedByLines > 0));
  assert.deepEqual(report.boundaryCycles, []);
});

test('W520 provider catalog remains metadata-only and preserves Guide fallback', () => {
  assert.equal(DEFAULT_AI_PROVIDER_ID, 'guide');
  assert.equal(normalizeAIProviderId('custom'), 'guide');
  assert.equal(normalizeAIProviderId('ollama'), 'ollama');
  assert.equal(PROVIDERS.openai.defaultModel, '');
  assert.equal(PROVIDERS.openai.requiresApiKey, true);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W520 shell contract preserves canonical routes and keyboard-native navigation markup', () => {
  assert.equal(resolveEonShellPage({ pathname: '/workspace.html' }), 'forge');
  assert.equal(resolveEonShellPage({ pathname: '/eoncity/lite' }), 'eoncity');
  assert.equal(resolveEonShellPage({ pathname: '/unknown', explicit: 'vault' }), 'vault');
  const markup = renderEonShellNavigationMarkup('chat');
  assert.match(markup, /<a class="eon-app-nav-link" href="\/" aria-label="EONBOT"/);
  assert.match(markup, /<button type="button" class="eon-app-nav-link" data-eon-shell-action="search"/);
  assert.match(markup, /aria-current="page"/);
  const placement = getEonShellPopoverPlacement({ anchorRect: { left: 900, right: 960, top: 720, bottom: 760 }, viewportWidth: 980, viewportHeight: 780, popoverWidth: 264, popoverHeight: 320 });
  assert.ok(placement.left >= 8 && placement.left <= 708);
  assert.ok(placement.top >= 8 && placement.top <= 452);
});

test('W520 chat session state remains browser-local and has a bounded guide/recovery timeline', () => {
  const storage = new MemoryStorage();
  const now = () => new Date('2026-07-03T10:00:00.000Z');
  const guide = createChatDailyGuideUsageStore({ storage, limit: 2, now });
  assert.equal(guide.getAllowance().remaining, 2);
  guide.increment();
  guide.increment();
  assert.equal(guide.getAllowance().remaining, 0);
  const timeline = createChatMissionTimelineStore({ storage });
  const entry = timeline.append({ kind: 'draft', title: 'Local-only mission' });
  assert.equal(timeline.load().at(-1).id, entry.id);
  timeline.setMode('advanced');
  assert.equal(timeline.getMode(), 'advanced');
});

test('W520 profile browser/recovery contract retains local-only normalization and safe caps', () => {
  const attachments = normalizeBrowserAttachments(Array.from({ length: 20 }, (_, index) => ({ provider: 'google', accountId: String(index), attachedAt: `2026-07-${String((index % 9) + 1).padStart(2, '0')}T00:00:00.000Z` })));
  assert.equal(attachments.length, 16);
  const workspaces = normalizeBrowserWorkspaceProfiles([{ label: 'Creator workstation', attachments }]);
  assert.equal(workspaces[0].attachmentCount, 16);
  const recovery = normalizeRecoveryState({ mirrorTargets: ['local-export'], lastExportAt: '2026-07-03T00:00:00.000Z' });
  assert.equal(deriveRecoveryStatus(recovery), 'mirrored');
  assert.equal(normalizeRecoveryState({ status: 'unknown' }).status, 'local-only');
});
