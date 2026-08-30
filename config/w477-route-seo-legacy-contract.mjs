/**
 * W477 route/SEO/legacy contract.
 *
 * Keeps one reviewable search map separate from the much larger runtime route
 * contract. Search destinations are deliberately only public documentation and
 * the flagship entry points; personal, local-only, disabled and retired
 * surfaces are served with canonical URLs but noindex directives.
 */
import { ALL_ROUTE_ROWS } from './route-contract.mjs';
import { EON_GUIDE_SEO_ROUTES } from './eon-guide-catalog.mjs';

export const W477_ROUTE_SEO_LEGACY_VERSION = 'eonapp.rt96.route-seo-guides.v5';
export const W477_CANONICAL_ORIGIN = 'https://eonapp.ch';
export const W477_SITEMAP_LASTMOD = '2026-08-30';

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export const W477_SEARCH_INDEX_ROUTES = freezeRows([
  ...EON_GUIDE_SEO_ROUTES,
  { path: '/', file: 'index.html', changefreq: 'weekly', priority: '1.0' },
  { path: '/insights', file: 'trade.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/local-ai', file: 'local-ai.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/about', file: 'about.html', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', file: 'privacy.html', changefreq: 'monthly', priority: '0.4' },
  { path: '/terms', file: 'terms.html', changefreq: 'monthly', priority: '0.4' },
  { path: '/legal', file: 'legal.html', changefreq: 'monthly', priority: '0.4' },
  { path: '/help', file: 'help.html', changefreq: 'monthly', priority: '0.4' },
  { path: '/editorial-policy', file: 'editorial-policy.html', changefreq: 'monthly', priority: '0.3' },
  { path: '/advertising-disclosure', file: 'advertising-disclosure.html', changefreq: 'monthly', priority: '0.3' }
]);

export const W477_NOINDEX_ROUTE_FILES = freezeRows([
  // RT96: dynamic service status remains link-accessible but is not a search landing page.
  { path: '/status', file: 'status.html', robots: 'noindex, follow' },
  // W554: identity-gated City is private workspace entry, not a crawler landing page.
  { path: '/eoncity', file: 'eoncity.html' },
  { path: '/projects', file: 'projects.html' },
  { path: '/library', file: 'library.html' },
  { path: '/workspace', file: 'workspace.html' },
  { path: '/create', file: 'create.html' },
  { path: '/forge', file: 'forge.html' },
  { path: '/preview-studio', file: 'market.html' },
  { path: '/automations', file: 'automations.html' },
  { path: '/profile', file: 'profile.html' },
  { path: '/vault', file: 'vault.html' },
  { path: '/capsule', file: 'capsule.html' },
  { path: '/realm-studio', file: 'realm-studio.html' },
  { path: '/telegram', file: 'telegram.html' },
  { path: '/rewards', file: 'rewards.html' },
  { path: '/referral', file: 'referral.html' },
  { path: '/archive', file: 'archive.html' },
  { path: '/billing', file: 'billing.html' },
  { path: '/settings', file: 'settings.html' },
  { path: '/install', file: 'install.html' }
]);

export const W477_PRIMARY_PUBLIC_DESTINATIONS = Object.freeze(['/', '/insights']);
export const W477_QUARANTINE_POLICY = Object.freeze({
  mode: 'inventory-only-until-reviewed-browser-evidence',
  deleteLegacySource: false,
  archiveLocation: 'quarantine/w477-awaiting-evidence',
  reason: 'W476-B browser/network observations must classify real route and origin use before a source file is moved or deleted.'
});

export function canonicalUrl(pathname = '/') {
  const path = String(pathname || '/').trim() || '/';
  if (path === '/') return `${W477_CANONICAL_ORIGIN}/`;
  return `${W477_CANONICAL_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getW477SeoDirectiveForFile(file = '') {
  const indexed = W477_SEARCH_INDEX_ROUTES.find((entry) => entry.file === file);
  if (indexed) return Object.freeze({ ...indexed, canonical: canonicalUrl(indexed.path), robots: 'index, follow', indexable: true });
  const noindex = W477_NOINDEX_ROUTE_FILES.find((entry) => entry.file === file);
  if (noindex) return Object.freeze({ ...noindex, canonical: canonicalUrl(noindex.path), robots: noindex.robots || 'noindex, nofollow', indexable: false });
  return null;
}

export function renderW477SitemapXml() {
  const rows = W477_SEARCH_INDEX_ROUTES.map((entry) => `  <url><loc>${canonicalUrl(entry.path)}</loc><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority><lastmod>${W477_SITEMAP_LASTMOD}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

export function renderW477RobotsTxt() {
  return `User-agent: *\nAllow: /\n\nDisallow: /api/\nDisallow: /csp-report\nDisallow: /functions/\nDisallow: /scripts/\nDisallow: /.git/\nDisallow: /dist/\nDisallow: /test-results/\nDisallow: /playwright-report/\n\nSitemap: ${canonicalUrl('/sitemap.xml')}\n`;
}

export function validateW477RouteSeoLegacyContract() {
  const errors = [];
  const liveMap = new Map(ALL_ROUTE_ROWS.filter((row) => Number(row.status) === 200 && !row.from.includes('*')).map((row) => [row.from, row]));
  const seenFiles = new Set();
  const seenPaths = new Set();
  for (const entry of [...W477_SEARCH_INDEX_ROUTES, ...W477_NOINDEX_ROUTE_FILES]) {
    if (seenFiles.has(entry.file)) errors.push(`Duplicate SEO file: ${entry.file}`);
    if (seenPaths.has(entry.path)) errors.push(`Duplicate SEO path: ${entry.path}`);
    seenFiles.add(entry.file);
    seenPaths.add(entry.path);
    const route = liveMap.get(entry.path);
    if (!route) errors.push(`SEO path is not a live route: ${entry.path}`);
    if (route?.file !== entry.file) errors.push(`SEO file mismatch for ${entry.path}: expected ${route?.file || 'none'}, got ${entry.file}`);
  }
  for (const path of W477_PRIMARY_PUBLIC_DESTINATIONS) {
    if (!W477_SEARCH_INDEX_ROUTES.some((entry) => entry.path === path)) errors.push(`Primary public destination missing from index map: ${path}`);
  }
  if (W477_QUARANTINE_POLICY.deleteLegacySource) errors.push('W477 must not delete legacy source before reviewed browser evidence.');
  return errors;
}
