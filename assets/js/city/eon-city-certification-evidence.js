/** W432 — local parsing and fail-closed assessment for supplied audit metadata. */
import { W432_CITY_CERTIFICATION_CONTRACT, W432_CITY_CERTIFICATION_SCHEMA, W432_LIGHTHOUSE_BUDGETS, W432_LIGHTHOUSE_ROUTE_MATRIX } from '../../../config/w432-city-certification-contract.mjs';

const freeze = (value) => Object.freeze(value);
const PROFILE_SET = new Set(['desktop', 'mobile']);
const ROUTE_SET = new Set(W432_LIGHTHOUSE_ROUTE_MATRIX.map((entry) => entry.route));

function score(report, id) {
  const raw = Number(report?.categories?.[id]?.score);
  return Number.isFinite(raw) ? raw : null;
}

function auditValue(report, id) {
  const raw = Number(report?.audits?.[id]?.numericValue);
  return Number.isFinite(raw) ? raw : null;
}

function validUrl(value) {
  try {
    const parsed = new URL(String(value || ''));
    return /^https?:$/.test(parsed.protocol) && !/^chrome-error:/i.test(parsed.href) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeProfile(value = '') {
  const profile = String(value || '').trim().toLowerCase();
  return PROFILE_SET.has(profile) ? profile : null;
}

export function assessCityLighthouseReport(report = {}, { profile = 'desktop' } = {}) {
  const resolvedProfile = normalizeProfile(profile);
  const budget = resolvedProfile ? W432_LIGHTHOUSE_BUDGETS[resolvedProfile] : null;
  const requested = validUrl(report?.requestedUrl);
  const final = validUrl(report?.finalUrl);
  const route = final?.pathname || requested?.pathname || '';
  const categories = freeze({
    performance: score(report, 'performance'),
    accessibility: score(report, 'accessibility'),
    bestPractices: score(report, 'best-practices'),
    seo: score(report, 'seo')
  });
  const metrics = freeze({
    lcpMs: auditValue(report, 'largest-contentful-paint'),
    cls: auditValue(report, 'cumulative-layout-shift'),
    tbtMs: auditValue(report, 'total-blocking-time')
  });
  const checks = freeze({
    profileValid: Boolean(resolvedProfile),
    requestedUrlValid: Boolean(requested),
    finalUrlValid: Boolean(final),
    canonicalRoute: ROUTE_SET.has(route),
    navStartPresent: Boolean(report?.timing?.total || report?.audits?.['first-contentful-paint']?.numericValue >= 0),
    categoriesComplete: Object.values(categories).every((value) => value !== null),
    metricsComplete: Object.values(metrics).every((value) => value !== null),
    categoryBudgets: Boolean(budget) && categories.performance !== null && categories.accessibility !== null && categories.bestPractices !== null && categories.seo !== null
      && categories.performance >= budget.performance && categories.accessibility >= budget.accessibility && categories.bestPractices >= budget.bestPractices && categories.seo >= budget.seo,
    metricBudgets: Boolean(budget) && metrics.lcpMs !== null && metrics.cls !== null && metrics.tbtMs !== null
      && metrics.lcpMs <= budget.lcpMs && metrics.cls <= budget.cls && metrics.tbtMs <= budget.tbtMs
  });
  const usable = checks.profileValid && checks.requestedUrlValid && checks.finalUrlValid && checks.canonicalRoute && checks.navStartPresent && checks.categoriesComplete && checks.metricsComplete;
  return freeze({
    schema: W432_CITY_CERTIFICATION_SCHEMA,
    profile: resolvedProfile || 'unknown',
    route,
    usable,
    passesBudgets: usable && checks.categoryBudgets && checks.metricBudgets,
    checks,
    categories,
    metrics,
    evidenceBoundary: freeze({ reportSuppliedByCaller: true, browserOrDeviceRunCreated: false, productionVerified: false, certificationIssued: false, launchApproved: false })
  });
}

export function evaluateW432CertificationEvidence({ lighthouse = [], device = [] } = {}) {
  const reports = Array.isArray(lighthouse) ? lighthouse.map((entry) => assessCityLighthouseReport(entry?.report || entry, { profile: entry?.profile || 'desktop' })) : [];
  const deviceCases = Array.isArray(device) ? device : [];
  const requiredLighthouse = W432_LIGHTHOUSE_ROUTE_MATRIX.flatMap((entry) => entry.requiredProfiles.map((profile) => `${profile}:${entry.route}`));
  const reportKeys = new Set(reports.filter((entry) => entry.usable).map((entry) => `${entry.profile}:${entry.route}`));
  const usableReportCount = reports.filter((entry) => entry.usable).length;
  const passingReportCount = reports.filter((entry) => entry.passesBudgets).length;
  const completedDeviceCases = deviceCases.filter((entry) => entry?.humanObserved === true && entry?.status === 'passed').length;
  const missingReports = requiredLighthouse.filter((key) => !reportKeys.has(key));
  return freeze({
    schema: W432_CITY_CERTIFICATION_SCHEMA,
    status: missingReports.length ? 'external-evidence-required' : 'lighthouse-evidence-submitted-awaiting-device-review',
    expectedLighthouseReportCount: requiredLighthouse.length,
    usableLighthouseReportCount: usableReportCount,
    passingLighthouseReportCount: passingReportCount,
    missingLighthouseReports: freeze(missingReports),
    expectedDeviceCaseCount: W432_CITY_CERTIFICATION_CONTRACT.deviceMatrix.length,
    humanPassedDeviceCaseCount: completedDeviceCases,
    reports: freeze(reports),
    sourceOnly: true,
    independentlyCertified: false,
    productionVerified: false,
    launchApproved: false,
    note: 'A complete local report set still requires human device review and independent production verification before any certification claim.'
  });
}

export function getW432CertificationTruth() {
  return freeze({
    schema: W432_CITY_CERTIFICATION_SCHEMA,
    sourceOnly: true,
    automaticLighthouseRun: false,
    automaticDeviceRun: false,
    automaticProductionVerification: false,
    automaticCertification: false,
    automaticLaunchApproval: false,
    chromeErrorPagesRejected: true,
    rawArtifactsRequired: true
  });
}
