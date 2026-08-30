/**
 * RT96/RT98 acquisition-content authority.
 *
 * Guide routes are allowed to scale only through this reviewed catalogue.
 * A route belongs here when it has a substantial original article, a useful
 * first-party tool or methodology, explicit update/source notes where facts
 * can change, and a review-first EONBOT handoff. This is deliberately not a
 * keyword-page generator.
 */
export const EON_GUIDE_CATALOG_SCHEMA = 'eonapp.guides.acquisition.v1';
export const EON_GUIDE_LAST_REVIEWED = '2026-08-30';

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export const EON_GUIDE_ROUTES = freezeRows([
  {
    id: 'guides',
    from: '/guides',
    to: '/guides/index.html',
    status: 200,
    file: 'guides/index.html',
    lifecycle: 'editorial-acquisition',
    expected: ['EONAPP Guides', 'AI cost', 'Local AI']
  },
  {
    id: 'guide-ai-api-cost-calculator',
    from: '/guides/ai-api-cost-calculator',
    to: '/guides/ai-api-cost-calculator.html',
    status: 200,
    file: 'guides/ai-api-cost-calculator.html',
    lifecycle: 'editorial-acquisition-utility',
    expected: ['AI API Cost Calculator', 'per 1M tokens']
  },
  {
    id: 'guide-local-ai-hardware-checker',
    from: '/guides/local-ai-hardware-checker',
    to: '/guides/local-ai-hardware-checker.html',
    status: 200,
    file: 'guides/local-ai-hardware-checker.html',
    lifecycle: 'editorial-acquisition-utility',
    expected: ['Local AI Hardware Checker', 'RAM', 'VRAM']
  },
  {
    id: 'guide-local-ai-vs-cloud-ai',
    from: '/guides/local-ai-vs-cloud-ai',
    to: '/guides/local-ai-vs-cloud-ai.html',
    status: 200,
    file: 'guides/local-ai-vs-cloud-ai.html',
    lifecycle: 'editorial-acquisition-utility',
    expected: ['Local AI vs Cloud AI', 'decision']
  },
  {
    id: 'guide-ai-small-business',
    from: '/guides/ai-for-small-business',
    to: '/guides/ai-for-small-business.html',
    status: 200,
    file: 'guides/ai-for-small-business.html',
    lifecycle: 'editorial-acquisition-utility',
    expected: ['AI for Small Business', 'ROI']
  },
  { id: 'guide-ai-api-pricing-guide', from: '/guides/ai-api-pricing-guide', to: '/guides/ai-api-pricing-guide.html', status: 200, file: 'guides/ai-api-pricing-guide.html', lifecycle: 'editorial-acquisition-support', expected: ['AI API Pricing Guide: How to Compare Real Costs'] },
  { id: 'guide-byok-ai-guide', from: '/guides/byok-ai-guide', to: '/guides/byok-ai-guide.html', status: 200, file: 'guides/byok-ai-guide.html', lifecycle: 'editorial-acquisition-support', expected: ['BYOK AI Guide: Bring Your Own API Key Safely'] },
  { id: 'guide-ai-api-cost-optimization', from: '/guides/ai-api-cost-optimization', to: '/guides/ai-api-cost-optimization.html', status: 200, file: 'guides/ai-api-cost-optimization.html', lifecycle: 'editorial-acquisition-support', expected: ['How to Reduce AI API Costs Without Destroying Quality'] },
  { id: 'guide-local-ai-ram-guide', from: '/guides/local-ai-ram-guide', to: '/guides/local-ai-ram-guide.html', status: 200, file: 'guides/local-ai-ram-guide.html', lifecycle: 'editorial-acquisition-support', expected: ['How Much RAM Do You Need for Local AI?'] },
  { id: 'guide-local-ai-vram-guide', from: '/guides/local-ai-vram-guide', to: '/guides/local-ai-vram-guide.html', status: 200, file: 'guides/local-ai-vram-guide.html', lifecycle: 'editorial-acquisition-support', expected: ['How Much VRAM Do You Need for Local AI?'] },
  { id: 'guide-laptop-for-local-ai', from: '/guides/laptop-for-local-ai', to: '/guides/laptop-for-local-ai.html', status: 200, file: 'guides/laptop-for-local-ai.html', lifecycle: 'editorial-acquisition-support', expected: ['Laptop Specs for Local AI: A Practical Buying Guide'] },
  { id: 'guide-private-ai-guide', from: '/guides/private-ai-guide', to: '/guides/private-ai-guide.html', status: 200, file: 'guides/private-ai-guide.html', lifecycle: 'editorial-acquisition-support', expected: ['Private AI Guide: Local AI, BYOK and Cloud Privacy Compared'] },
  { id: 'guide-local-ai-on-android', from: '/guides/local-ai-on-android', to: '/guides/local-ai-on-android.html', status: 200, file: 'guides/local-ai-on-android.html', lifecycle: 'editorial-acquisition-support', expected: ['Local AI on Android: What Works and What to Expect'] },
  { id: 'guide-webgpu-local-ai', from: '/guides/webgpu-local-ai', to: '/guides/webgpu-local-ai.html', status: 200, file: 'guides/webgpu-local-ai.html', lifecycle: 'editorial-acquisition-support', expected: ['WebGPU for Local AI: Browser Acceleration Explained'] },
  { id: 'guide-ai-automation-small-business', from: '/guides/ai-automation-small-business', to: '/guides/ai-automation-small-business.html', status: 200, file: 'guides/ai-automation-small-business.html', lifecycle: 'editorial-acquisition-support', expected: ['AI Automation for Small Business: Where ROI Actually Comes From'] },
  { id: 'guide-ai-tools-for-freelancers', from: '/guides/ai-tools-for-freelancers', to: '/guides/ai-tools-for-freelancers.html', status: 200, file: 'guides/ai-tools-for-freelancers.html', lifecycle: 'editorial-acquisition-support', expected: ['AI Tools for Freelancers: Build a Lean Stack Instead of Buying Everything'] },
  { id: 'guide-ai-chatbot-cost-small-business', from: '/guides/ai-chatbot-cost-small-business', to: '/guides/ai-chatbot-cost-small-business.html', status: 200, file: 'guides/ai-chatbot-cost-small-business.html', lifecycle: 'editorial-acquisition-support', expected: ['AI Chatbot Cost for Small Business: What You Actually Pay For'] }
]);

export const EON_GUIDE_SEO_ROUTES = freezeRows([
  { path: '/guides', file: 'guides/index.html', changefreq: 'weekly', priority: '0.9' },
  { path: '/guides/ai-api-cost-calculator', file: 'guides/ai-api-cost-calculator.html', changefreq: 'weekly', priority: '0.9' },
  { path: '/guides/local-ai-hardware-checker', file: 'guides/local-ai-hardware-checker.html', changefreq: 'weekly', priority: '0.9' },
  { path: '/guides/local-ai-vs-cloud-ai', file: 'guides/local-ai-vs-cloud-ai.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/guides/ai-for-small-business', file: 'guides/ai-for-small-business.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/guides/ai-api-pricing-guide', file: 'guides/ai-api-pricing-guide.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/byok-ai-guide', file: 'guides/byok-ai-guide.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/ai-api-cost-optimization', file: 'guides/ai-api-cost-optimization.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/local-ai-ram-guide', file: 'guides/local-ai-ram-guide.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/local-ai-vram-guide', file: 'guides/local-ai-vram-guide.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/laptop-for-local-ai', file: 'guides/laptop-for-local-ai.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/private-ai-guide', file: 'guides/private-ai-guide.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/local-ai-on-android', file: 'guides/local-ai-on-android.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/webgpu-local-ai', file: 'guides/webgpu-local-ai.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/ai-automation-small-business', file: 'guides/ai-automation-small-business.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/ai-tools-for-freelancers', file: 'guides/ai-tools-for-freelancers.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/ai-chatbot-cost-small-business', file: 'guides/ai-chatbot-cost-small-business.html', changefreq: 'monthly', priority: '0.7' }
]);

export const EON_GUIDE_QUALITY_POLICY = Object.freeze({
  minimumStaticWordsForHeroGuide: 1200,
  requireOriginalUtilityOrMethodology: true,
  requireReviewFirstEonbotHandoff: true,
  requireUpdatedDate: true,
  requireSourceNotesForChangingFacts: true,
  allowAutoSendEonbotPrompt: false,
  allowAdsenseBootstrapBeforeApproval: true,
  allowManualAdUnitsWithoutIssuedSlotIds: false,
  allowKeywordStuffing: false,
  allowScaledThinPages: false
});

export function validateEonGuideCatalog() {
  const errors = [];
  const ids = new Set();
  const paths = new Set();
  const files = new Set();
  for (const row of EON_GUIDE_ROUTES) {
    if (!row.id || ids.has(row.id)) errors.push(`Duplicate/missing guide id: ${row.id || 'missing'}`);
    if (!row.from?.startsWith('/') || paths.has(row.from)) errors.push(`Duplicate/invalid guide path: ${row.from || 'missing'}`);
    if (!row.file?.startsWith('guides/') || files.has(row.file)) errors.push(`Duplicate/invalid guide file: ${row.file || 'missing'}`);
    ids.add(row.id); paths.add(row.from); files.add(row.file);
  }
  for (const seo of EON_GUIDE_SEO_ROUTES) {
    if (!paths.has(seo.path)) errors.push(`Guide SEO path has no route: ${seo.path}`);
    if (!files.has(seo.file)) errors.push(`Guide SEO file has no route: ${seo.file}`);
  }
  return Object.freeze(errors);
}
