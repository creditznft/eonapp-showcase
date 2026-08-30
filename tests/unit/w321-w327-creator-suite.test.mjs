import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCreatorSuiteExport, createCreatorSuiteDraft, getCreatorSuite2Truth, normalizeCreatorSuiteBrief } from '../../assets/js/creator-suite-2/creator-suite-2-engine.js';
import { getCreatorSuite2SessionTruth } from '../../assets/js/creator-suite-2/creator-suite-2-workspace.js';
import { runW321W327CreatorSuiteGate } from '../../scripts/w321-w327-creator-suite-gate.mjs';

test('W321–W326 prepares a truthful local Creator Suite draft for each supported studio', () => {
  for (const module of ['build', 'content', 'image', 'video', 'audio', 'voice']) {
    const draft = createCreatorSuiteDraft({ module, title: `${module} launch`, audience: 'local users', goal: 'Prepare a clear draft without starting a provider job', style: 'calm and focused', callToAction: 'Review next step' }, { now: 1_770_200_000_000, idFactory: () => `creatordraft_${module}` });
    assert.equal(draft.module, module);
    assert.equal(draft.truthLabel, 'prepared-for-export');
    assert.equal(draft.payload.providerCall, false);
    assert.equal(draft.payload.publish, false);
    assert.ok(draft.payload.deliverables.length >= 3);
  }
});

test('W327 exports a local draft with an explicit non-media, non-publishing boundary', () => {
  const draft = createCreatorSuiteDraft({ module: 'video', title: 'Campaign storyboard', audience: 'new visitors', goal: 'Prepare a short story', style: 'bright', callToAction: 'Visit the site' }, { now: 1_770_200_000_000, idFactory: () => 'creatordraft_storyboard' });
  const exported = buildCreatorSuiteExport(draft);
  assert.equal(exported.boundary.generatedMedia, false);
  assert.equal(exported.boundary.providerCall, false);
  assert.equal(exported.boundary.upload, false);
  assert.equal(exported.boundary.publish, false);
});

test('Creator Suite rejects secret-like text and does not claim encrypted persistence before vault integration', () => {
  assert.throws(() => normalizeCreatorSuiteBrief({ module: 'build', title: 'Unsafe', audience: 'test', goal: 'api_key=very-secret-value-123456789', style: 'plain', callToAction: 'go' }), /credential|secret/i);
  assert.equal(getCreatorSuite2Truth().durableEncryptedSave, false);
  assert.equal(getCreatorSuite2SessionTruth().localStorage, false);
  assert.equal(getCreatorSuite2SessionTruth().exportRequiresUserAction, true);
});

test('W321–W327 source gate remains Workspace-only and no-provider', () => {
  const report = runW321W327CreatorSuiteGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
