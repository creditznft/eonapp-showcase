import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOT, auditW271PageMarkup, canonicalPageFiles, runW271AccessibilityI18nSourceGate } from '../../scripts/w271-accessibility-i18n-source-gate.mjs';

test('W271-A0 requires document language, landmark, skip path and shared bootstrap', () => {
  const result = auditW271PageMarkup('fixture.html', '<html><head><title></title></head><body><main></main></body></html>');
  assert.equal(result.errors.length >= 4, true);
  assert.match(result.errors.join(' '), /document language/i);
  assert.match(result.errors.join(' '), /viewport/i);
  assert.match(result.errors.join(' '), /skip link/i);
  assert.match(result.errors.join(' '), /bootstrap/i);
});

test('W271-A0 covers every canonical public source page and stays source-only', () => {
  const report = runW271AccessibilityI18nSourceGate(ROOT);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.w260Verdict, 'NO_GO');
  assert.equal(report.checkedPageFiles.length, canonicalPageFiles().length);
  assert.equal(report.boardDecision, 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING');
});
