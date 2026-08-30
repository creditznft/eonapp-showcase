import assert from 'node:assert/strict';
import test from 'node:test';
import { assessCityLighthouseReport, evaluateW432CertificationEvidence, getW432CertificationTruth } from '../../assets/js/city/eon-city-certification-evidence.js';
import { buildW432LighthouseMatrix } from '../../scripts/w432-prepare-lighthouse-matrix.mjs';
import { inspectW432CityCertificationTooling } from '../../scripts/w432-city-certification-tooling-gate.mjs';

function reportFor(route, profile = 'desktop') {
  const mobile = profile === 'mobile';
  return {
    requestedUrl: `https://eonapp.ch${route}`,
    finalUrl: `https://eonapp.ch${route}`,
    timing: { total: 1200 },
    categories: { performance: { score: mobile ? .75 : .85 }, accessibility: { score: .9 }, 'best-practices': { score: .9 }, seo: { score: .9 } },
    audits: { 'largest-contentful-paint': { numericValue: mobile ? 4200 : 3000 }, 'cumulative-layout-shift': { numericValue: .04 }, 'total-blocking-time': { numericValue: mobile ? 500 : 300 } }
  };
}

test('W432 accepts only a usable canonical report and rejects Chrome error pages', () => {
  const good = assessCityLighthouseReport(reportFor('/eoncity'), { profile: 'desktop' });
  assert.equal(good.usable, true);
  assert.equal(good.passesBudgets, true);
  const blocked = assessCityLighthouseReport({ requestedUrl: 'http://127.0.0.1:4192/eoncity', finalUrl: 'chrome-error://chromewebdata/', categories: {} }, { profile: 'desktop' });
  assert.equal(blocked.usable, false);
  assert.equal(blocked.passesBudgets, false);
});

test('W432 planned matrix remains external-evidence-only without reports and devices', () => {
  const matrix = buildW432LighthouseMatrix();
  assert.equal(matrix.expectedCaseCount, 18);
  const evidence = evaluateW432CertificationEvidence();
  assert.equal(evidence.status, 'external-evidence-required');
  assert.equal(evidence.expectedLighthouseReportCount, 18);
  assert.equal(evidence.independentlyCertified, false);
  assert.equal(getW432CertificationTruth().automaticCertification, false);
});

test('W432 static tooling gate remains green', () => {
  const gate = inspectW432CityCertificationTooling();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 9);
  assert.match(gate.limitations.join(' '), /No Lighthouse report/i);
});
