/**
 * W266 — visual proof lab contract.
 *
 * A local automated screenshot is a reproducible regression artefact, not
 * proof of a real Android/iPhone/PWA experience, visual approval, accessibility
 * sign-off, or release readiness. This module makes that separation explicit.
 */
export const W266_VISUAL_PROOF_LAB_SCHEMA = 'eonapp.w266.visual-proof-lab.v1';

export const W266_CAPTURE_PROFILES = Object.freeze([
  Object.freeze({
    id: 'desktop-chrome',
    label: 'Desktop Chromium viewport',
    viewport: Object.freeze({ width: 1440, height: 1000 }),
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    reducedMotion: false,
    evidenceLimit: 'Local browser emulation only; keyboard and resize regression capture.'
  }),
  Object.freeze({
    id: 'mobile-chrome-emulated',
    label: 'Mobile Chromium emulation',
    viewport: Object.freeze({ width: 390, height: 844 }),
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: false,
    evidenceLimit: 'Not a physical Android, installed PWA, thermal, WebGL, or browser-chrome proof.'
  }),
  Object.freeze({
    id: 'desktop-reduced-motion',
    label: 'Desktop reduced-motion regression',
    viewport: Object.freeze({ width: 1440, height: 1000 }),
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    reducedMotion: true,
    evidenceLimit: 'Media-preference regression only; not a completed accessibility review.'
  })
]);

export const W266_CAPTURE_SCENARIOS = Object.freeze([
  Object.freeze({ id: 'chat-first-entry', route: '/chat', profiles: Object.freeze(['desktop-chrome', 'mobile-chrome-emulated']), intent: 'Primary Chat entry remains readable and shell-safe.' }),
  Object.freeze({ id: 'workspace-handoff', route: '/workspace', profiles: Object.freeze(['desktop-chrome', 'mobile-chrome-emulated']), intent: 'Workspace handoff remains readable without a real project payload.' }),
  Object.freeze({ id: 'projects-handoff', route: '/projects', profiles: Object.freeze(['desktop-chrome', 'mobile-chrome-emulated']), intent: 'Projects route remains readable with empty/test-safe local storage.' }),
  Object.freeze({ id: 'city-lite-return', route: '/eoncity', profiles: Object.freeze(['desktop-chrome', 'mobile-chrome-emulated', 'desktop-reduced-motion']), intent: 'City Lite remains the resilient return path.' }),
  Object.freeze({ id: 'city-play-preview-entry', route: '/eoncity/play?preview=1', profiles: Object.freeze(['desktop-chrome', 'mobile-chrome-emulated', 'desktop-reduced-motion']), intent: 'Opt-in Play entry is visible without starting gameplay or collecting data.' })
]);

export const W266_EXTERNAL_VISUAL_EVIDENCE = Object.freeze([
  'redacted-real-android-capture',
  'redacted-real-iphone-capture',
  'installed-pwa-update-rollback-capture',
  'no-webgl-or-constrained-fallback-capture',
  'human-visual-diff-review'
]);

function profileMap() {
  return new Map(W266_CAPTURE_PROFILES.map((profile) => [profile.id, profile]));
}

/**
 * Separates unavailable or policy-blocked browser infrastructure from an
 * application regression. This only classifies local capture infrastructure;
 * it never turns a blocked capture into visual or release evidence.
 */
export function classifyW266CaptureEnvironmentError(error) {
  const detail = String(error?.message || error || '').replace(/\s+/g, ' ').trim();
  if (/ERR_BLOCKED_BY_ADMINISTRATOR|URLBlocklist|managed browser URL policy/i.test(detail)) {
    return Object.freeze({
      blocked: true,
      code: 'managed-browser-url-policy',
      message: 'Managed browser URL policy blocked navigation before the application loaded.'
    });
  }
  if (/Executable doesn['’]t exist|npx playwright install|browserType\.launch/i.test(detail)) {
    return Object.freeze({
      blocked: true,
      code: 'playwright-browser-unavailable',
      message: 'The local Playwright browser executable is unavailable; no application page was captured.'
    });
  }
  return Object.freeze({ blocked: false, code: '', message: '' });
}

export function buildW266VisualProofPlan(options = {}) {
  const profiles = profileMap();
  const captures = [];
  for (const scenario of W266_CAPTURE_SCENARIOS) {
    for (const profileId of scenario.profiles) {
      const profile = profiles.get(profileId);
      if (!profile) continue;
      captures.push(Object.freeze({
        id: `${scenario.id}--${profile.id}`,
        scenarioId: scenario.id,
        route: scenario.route,
        profileId: profile.id,
        viewport: profile.viewport,
        reducedMotion: profile.reducedMotion,
        localAutomationOnly: true,
        userDataPolicy: 'Use empty/test-safe local storage only. Do not seed credentials, Vault data, private Chat, wallet, payment, provider, reward, token, loot, referral, or commerce records.'
      }));
    }
  }
  return Object.freeze({
    schema: W266_VISUAL_PROOF_LAB_SCHEMA,
    scope: 'local-automated-regression-capture',
    baseUrl: String(options.baseUrl || 'http://127.0.0.1:4173').replace(/\/$/, ''),
    captures,
    externalVisualEvidence: W266_EXTERNAL_VISUAL_EVIDENCE.map((id) => Object.freeze({ id, status: 'not-collected', evidenceRefs: [] })),
    canCertifyDeviceSupport: false,
    canCertifyReleaseReadiness: false,
    claimFence: Object.freeze([
      'Local Chromium screenshots are not real-device evidence.',
      'A screenshot run cannot certify visual quality, accessibility, PWA update/rollback, security, or release readiness.',
      'City Play capture stops at the opt-in entry surface; it does not start Play, complete a mission, or infer task success.'
    ])
  });
}

export function validateW266VisualProofPlan(plan) {
  const errors = [];
  if (!plan || plan.schema !== W266_VISUAL_PROOF_LAB_SCHEMA) errors.push('Invalid W266 visual proof plan schema.');
  if (plan?.scope !== 'local-automated-regression-capture') errors.push('W266 must remain local automated regression capture.');
  if (plan?.canCertifyDeviceSupport !== false || plan?.canCertifyReleaseReadiness !== false) errors.push('W266 must not self-certify device support or release readiness.');
  const captures = Array.isArray(plan?.captures) ? plan.captures : [];
  if (!captures.length) errors.push('W266 must define capture scenarios.');
  const ids = new Set();
  for (const capture of captures) {
    if (!capture?.id || ids.has(capture.id)) errors.push(`Duplicate or missing W266 capture id: ${capture?.id || '(missing)'}.`);
    ids.add(capture?.id);
    if (!String(capture?.route || '').startsWith('/')) errors.push(`W266 capture route is invalid: ${capture?.id || '(unknown)'}.`);
    if (capture?.route.includes('/eoncity/play') && capture.route !== '/eoncity/play?preview=1') errors.push('W266 City Play capture must use exact ?preview=1 opt-in.');
    if (capture?.localAutomationOnly !== true) errors.push(`W266 capture is not marked local-only: ${capture?.id || '(unknown)'}.`);
  }
  const external = Array.isArray(plan?.externalVisualEvidence) ? plan.externalVisualEvidence : [];
  if (external.length !== W266_EXTERNAL_VISUAL_EVIDENCE.length) errors.push('W266 must enumerate every required external visual-evidence lane.');
  for (const id of W266_EXTERNAL_VISUAL_EVIDENCE) {
    const rows = external.filter((row) => row?.id === id);
    if (rows.length !== 1) errors.push(`Missing or duplicated W266 external visual evidence lane: ${id}.`);
    if (rows[0]?.status !== 'not-collected') errors.push(`W266 source board must not pre-claim external evidence: ${id}.`);
  }
  return Object.freeze({ ok: errors.length === 0, errors });
}

export default {
  W266_VISUAL_PROOF_LAB_SCHEMA,
  W266_CAPTURE_PROFILES,
  W266_CAPTURE_SCENARIOS,
  W266_EXTERNAL_VISUAL_EVIDENCE,
  classifyW266CaptureEnvironmentError,
  buildW266VisualProofPlan,
  validateW266VisualProofPlan
};
