import { assessBrowserRisk } from './browser-approval.js';

export const DISTRIBUTION_APPROVAL_CLASS = Object.freeze({
  PREPARE: 'prepare',
  DRAFT: 'draft',
  PUBLISH: 'publish',
  ACCOUNT: 'account',
  SENSITIVE: 'sensitive'
});

export const PLATFORM_AUTOMATION_POLICY = Object.freeze({
  discord:   { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  telegram:  { publishClass: 'publish', accountRail: 'token-managed',   browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  slack:     { publishClass: 'publish', accountRail: 'token-managed',   browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  twitter:   { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  threads:   { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  bluesky:   { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  mastodon:  { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  linkedin:  { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  reddit:    { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  pinterest: { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  facebook:  { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  medium:    { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  devto:     { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  substack:  { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  wordpress: { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  ghost:     { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  github:    { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: false, canCreateAccount: 'manual-only', captcha: 'manual-only' },
  tiktok:    { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  instagram: { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' },
  youtube:   { publishClass: 'publish', accountRail: 'browser-managed', browserSafe: true, googleSSO: true,  canCreateAccount: 'manual-only', captcha: 'manual-only' }
});

export function getPlatformAutomationPolicy(platform = '') {
  const key = String(platform || '').trim().toLowerCase();
  return PLATFORM_AUTOMATION_POLICY[key] || {
    publishClass: 'publish',
    accountRail: 'browser-managed',
    browserSafe: true,
    googleSSO: false,
    canCreateAccount: 'manual-only',
    captcha: 'manual-only'
  };
}

export function buildDistributionAutomationPlan({ platforms = [], content = {}, browserHost = '' } = {}) {
  const selected = Array.isArray(platforms) ? platforms.map((p) => String(p || '').trim().toLowerCase()).filter(Boolean) : [];
  const unique = [...new Set(selected)];
  const policyRows = unique.map((platform) => ({ platform, ...getPlatformAutomationPolicy(platform) }));
  const directApi = policyRows.filter((row) => row.accountRail === 'token-managed').map((row) => row.platform);
  const browserManaged = policyRows.filter((row) => row.accountRail === 'browser-managed').map((row) => row.platform);
  const googleSSO = policyRows.filter((row) => row.googleSSO).map((row) => row.platform);
  const accountCreationSupported = policyRows.filter((row) => row.canCreateAccount !== 'blocked').map((row) => row.platform);
  const needsHumanReview = policyRows.filter((row) => row.publishClass === 'publish' || row.publishClass === 'sensitive').map((row) => row.platform);
  const browserRisk = browserHost ? assessBrowserRisk(browserHost, { type: 'distribution-automation' }) : { riskLevel: 'medium' };
  const contentFields = content && typeof content === 'object' ? Object.keys(content).length : 0;

  return {
    directApi,
    browserManaged,
    googleSSO,
    accountCreationSupported,
    needsHumanReview,
    browserRisk,
    contentFields,
    truthNotes: [
      'Direct API/webhook rails can publish immediately only where the user configured dedicated credentials or webhooks.',
      'Browser-managed rails can prepare drafts, open compose flows, and continue through saved sessions, but final submit should remain user-reviewed.',
      'CAPTCHA solving is user-handled. EONAPP should never pretend to bypass anti-bot challenges automatically.',
      'Google/social login can be used as a browser session path where the platform supports it, but account creation and sensitive account changes still stay manual-review.'
    ],
    recommendedNextStep: directApi.length
      ? `Use direct API rails first: ${directApi.join(', ')}`
      : browserManaged.length
        ? `Use browser-managed publish rails first: ${browserManaged.join(', ')}`
        : 'Build the publish bundle first, then choose target platforms.'
  };
}

export function buildDistributionRailChecklist(plan = {}) {
  const steps = [];
  if (Array.isArray(plan.directApi) && plan.directApi.length) {
    steps.push(`Direct publish rails ready: ${plan.directApi.join(', ')}.`);
  }
  if (Array.isArray(plan.browserManaged) && plan.browserManaged.length) {
    steps.push(`Browser-managed publish rails: ${plan.browserManaged.join(', ')}.`);
  }
  if (Array.isArray(plan.googleSSO) && plan.googleSSO.length) {
    steps.push(`Google/social-login capable rails: ${plan.googleSSO.join(', ')}.`);
  }
  steps.push('Drafts can be prepared automatically, but publish/submit actions should remain reviewed.');
  steps.push('CAPTCHA and identity checks remain user-handled.');
  return steps;
}
