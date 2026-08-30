import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEonExpanseW775ACaptureHandoff, validateEonExpanseW775ACaptureHandoff } from '../../assets/js/city/w775/eon-expanse-w775a-capture-handoff-package.js';

const context = { type: 'expanse-capture-moment', momentId: 'my-frontier-construction:plot-creator:creator-workshop:42', source: 'my-frontier-construction', label: 'Creator Workshop' };

test('W775A builds a reviewed capture package with screenshot and recording choices', () => {
  const result = buildEonExpanseW775ACaptureHandoff(context);
  assert.equal(result.ok, true);
  assert.deepEqual(result.captureOptions, ['screenshot', 'short-clip', 'full-recording']);
  assert.equal(result.cleanHudRecommended, true);
  assert.equal(result.eonbotPoseAvailable, true);
});

test('W775A includes safe captions and optional QR/referral support without creating either', () => {
  const result = buildEonExpanseW775ACaptureHandoff({ ...context, label: '<b>Creator Workshop</b>' });
  assert.doesNotMatch(result.label, /[<>]/);
  assert.match(result.suggestedCaptions.short, /Infinite Frontier/);
  assert.equal(result.qrOptional, true);
  assert.equal(result.referralLinkOptional, true);
  assert.equal(result.createsReferralLinkAutomatically, false);
});

test('W775A requires privacy review and forbids automatic recording, upload or publication', () => {
  const result = buildEonExpanseW775ACaptureHandoff(context);
  assert.equal(result.privacyReviewRequired, true);
  assert.equal(result.startsRecordingAutomatically, false);
  assert.equal(result.uploadsAutomatically, false);
  assert.equal(result.publishesAutomatically, false);
  assert.equal(validateEonExpanseW775ACaptureHandoff(result, { expectedMomentId: context.momentId }).ok, true);
});

test('W775A rejects invalid or stale moment identities', () => {
  assert.equal(buildEonExpanseW775ACaptureHandoff({}).ok, false);
  const result = buildEonExpanseW775ACaptureHandoff(context);
  assert.equal(validateEonExpanseW775ACaptureHandoff(result, { expectedMomentId: 'other' }).ok, false);
});
