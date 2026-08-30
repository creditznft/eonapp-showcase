import multiLanguageService from './multi-language.js';
import { autoLocalizePage, getCurrentLanguage, localizeStatic, normalizeLanguageCode, translateForUser } from './app-language.js';
import { ensureRuntimeStyles } from './dev-style-fallback.js';
import { getProfile } from './profile.js';
import { openEonShareSheet } from './eon-share-sheet.js';
import { applyLaunchI18nReset } from './launch-i18n-reset.js';
import { applyLanguageDocumentProfile } from './i18n-rc-registry.js';
import { FOOTER_NAV_GROUPS, flattenFooterLinks } from './support-tools-footer-proof.js';
import './analytics-bridge.js';

const /** @type {any} */
CORE_NAV = [
  { href: '/', label: 'EONBOT', i18nKey: 'nav.ai-chat' },
  { href: '/create', label: 'Create', i18nKey: 'nav.create' },
  { href: '/projects', label: 'Projects', i18nKey: 'nav.projects' },
  { href: '/library', label: 'Library', i18nKey: 'nav.library' },
  { href: '/eoncity', label: 'EON City', i18nKey: 'nav.realm' }
];

const /** @type {any} */
MORE_NAV = [
  { href: '/automations', label: 'Automations', i18nKey: 'nav.automations' },
  { href: '/local-ai', label: 'Local AI', i18nKey: 'nav.local-ai' },
  { href: '/profile#eon-profile-account-foundation', label: 'Account & backup', i18nKey: 'common.profile' },
  { href: '/vault', label: 'Vault & Backup', i18nKey: 'nav.vault' },
  { href: '/billing', label: 'Billing', i18nKey: 'nav.billing' },
  { href: '/help', label: 'Support', i18nKey: 'nav.support' }
];

/** @type {any} */
let _navEl = null;
let _currentPath = '/';

const /** @type {any} */
MOBILE_QUICK_NAV = [
  { href: '/', label: 'EONBOT', icon: '✦', i18nKey: 'nav.ai-chat' },
  { href: '/create', label: 'Create', icon: '＋', i18nKey: 'nav.create' },
  { href: '/projects', label: 'Projects', icon: '▣', i18nKey: 'nav.projects' },
  { href: '/library', label: 'Library', icon: '▤', i18nKey: 'nav.library' },
  { href: '/eoncity', label: 'City', icon: '◌', i18nKey: 'nav.realm' }
];

function countryCodeToFlag(/** @type {any} */ code) {
  if (!code || code.length < 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map((/** @type {any} */ c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

async function enhanceDynamicText(/** @type {any} */ pairs = []) {
  const lang = getCurrentLanguage();
  if (!lang || lang === 'en') return;
  for (const [node, source] of pairs) {
    if (!node || !source) continue;
    const translated = await translateForUser(source, { fromLang: 'en', toLang: lang, category: 'guide' });
    if (translated) node.textContent = translated;
  }
}

function normalizePath(path) {
  const normalized = String(path || '/').replace(/\/$/, '') || '/';
  if (normalized === '/' || normalized === '/chat' || normalized === '/chat.html') return '/';
  if (normalized === '/create' || normalized === '/create.html') return '/create';
  if (normalized === '/projects' || normalized === '/projects.html') return '/projects';
  if (normalized === '/library' || normalized === '/library.html') return '/library';
  if (['/workspace', '/workspace.html', '/workbench.html', '/build', '/browser', '/eon-browser.html', '/market', '/marketplace.html', '/apps', '/apps.html'].includes(normalized)) return '/create';
  if (['/eoncity', '/realm', '/realmworld', '/realmworld.html', '/game', '/games'].includes(normalized)) return '/eoncity';
  if (normalized === '/eoncity/tour' || normalized === '/eoncity/3d' || normalized === '/eoncity-3d') return '/eoncity/tour';
  if (normalized === '/eoncity/lite') return '/eoncity/lite';
  if (normalized === '/insights' || normalized === '/trade' || normalized === '/trade.html' || normalized === '/signal') return '/insights';
  if (normalized === '/vault' || normalized === '/vault.html') return '/vault';
  if (normalized === '/profile' || normalized === '/profile.html') return '/profile';
  if (normalized === '/automations' || normalized === '/automation' || normalized === '/automate' || normalized === '/automation-studio' || normalized === '/automation-studio.html') return '/automations';
  if (normalized === '/local-ai') return '/local-ai';
  if (normalized.startsWith('/u/')) return '/realm-studio';
  return normalized;
}

function upsertNav(/** @type {any} */ nav, /** @type {any} */ currentPath) {
  if (!nav) return;
  const coreHtml = CORE_NAV.map((/** @type {any} */ item) => {
    const isCurrent = normalizePath(item.href) === normalizePath(currentPath);
    const label = item.i18nKey ? multiLanguageService.t(item.i18nKey, item.label) : item.label;
    return `<a href="${item.href}" data-nav-label="${item.label}"${isCurrent ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  const moreCurrent = MORE_NAV.some((/** @type {any} */ item) => normalizePath(item.href) === normalizePath(currentPath));
  const moreLabel = multiLanguageService.t('nav.more', 'More');
  const moreHtml = `<details class="nav-more"${moreCurrent ? ' open' : ''}><summary aria-label="${moreLabel}">${moreLabel}</summary><div class="nav-more-menu">${MORE_NAV.map((/** @type {any} */ item) => {
    const isCurrent = normalizePath(item.href) === normalizePath(currentPath);
    const label = item.i18nKey ? multiLanguageService.t(item.i18nKey, item.label) : item.label;
    return `<a href="${item.href}" data-nav-label="${item.label}"${isCurrent ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('')}</div></details>`;
  nav.innerHTML = `${coreHtml}${moreHtml}`;

  const /** @type {any} */
profileBtn = document.querySelector('[data-shell-profile="1"]');
  if (profileBtn) profileBtn.textContent = multiLanguageService.t('common.profile', 'Profile');

  void (async () => {
    const /** @type {any} */
links = [...nav.querySelectorAll('a[data-nav-label]')];
    const pairs = links.map((/** @type {any} */ link) => [link, link.getAttribute('data-nav-label') || '']);
    await enhanceDynamicText(pairs);
  })();
}

function getOrCreateUtilityRail(/** @type {any} */ headerInner) {
  if (!headerInner) return null;
  const existingRail = headerInner.querySelector('.shell-utility-rail');
  if (existingRail) return existingRail;

  const /** @type {any} */
  rail = document.createElement('div');
  rail.className = 'shell-utility-rail';

  const /** @type {any} */
  subBadge = headerInner.querySelector('#sub-badge');
  if (subBadge) rail.appendChild(subBadge);

  headerInner.appendChild(rail);
  return rail;
}

function addProfileButton(utilityRail) {
  if (!utilityRail) return;
  if (utilityRail.querySelector('[data-shell-profile="1"]')) return;
  const existingProfile = utilityRail.querySelector('a[href="/profile"], a[href="/profile.html"]');
  if (existingProfile) {
    existingProfile.setAttribute('data-shell-profile', '1');
    return;
  }
  const btn = document.createElement('a');
  btn.href = '/profile#eon-profile-account-foundation';
  btn.className = 'btn btn-outline btn-sm';
  btn.setAttribute('data-shell-profile', '1');
  btn.setAttribute('aria-label', 'Open account, optional Google Login, backup and settings');
  btn.textContent = 'Account';
  utilityRail.appendChild(btn);
}

function openGlobalShareCenter() {
  void openEonShareSheet({
    type: window.location.pathname.startsWith('/eoncity') ? 'city' : window.location.pathname.startsWith('/workspace') ? 'workspace' : 'eonapp'
  });
}

function ensureGlobalShareLauncher(utilityRail) {
  if (document.body?.dataset?.eonAppShell === '1') return;
  if (document.querySelector('[data-global-share-launcher="1"]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'eon-global-share-launcher btn btn-outline btn-sm';
  button.dataset.globalShareLauncher = '1';
  button.setAttribute('aria-label', 'Open Share Command Center');
  button.innerHTML = '<span aria-hidden="true">↗</span><strong>Share</strong>';
  button.addEventListener('click', openGlobalShareCenter);
  (utilityRail || document.body).appendChild(button);
}

function normalizeFooter() {
  const /** @type {any} */
footerNav = document.querySelector('.site-footer .footer-nav');
  if (!footerNav) return;

  const /** @type {any} */
links = flattenFooterLinks(FOOTER_NAV_GROUPS);
  footerNav.setAttribute('aria-label', 'Footer product, help, community, and legal links');
  footerNav.innerHTML = FOOTER_NAV_GROUPS.map((/** @type {any} */ group) => `
    <section class="footer-link-group" data-footer-group="${group.id}" aria-label="${group.label}">
      <h2>${group.label}</h2>
      <div class="footer-link-list">
        ${group.links.map((/** @type {any} */ item) => `<a href="${item.href}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ''}${item.action ? ` data-shell-action="${item.action}"` : ''}>${item.label}</a>`).join('')}
      </div>
    </section>
  `).join('');
  footerNav.querySelector('[data-shell-action="share"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    openGlobalShareCenter();
  });

  void (async () => {
    const /** @type {any} */
anchors = [...footerNav.querySelectorAll('a')];
    const pairs = anchors.map((/** @type {any} */ a, /** @type {any} */ i) => [a, links[i]?.label || '']);
    await enhanceDynamicText(pairs);
  })();
}

function ensureBottomNav() {
  const existingBottomNav = document.querySelector('.eon-bottom-nav');
  const /** @type {any} */
nav = existingBottomNav || document.createElement('nav');
  nav.className = 'eon-bottom-nav';
  nav.setAttribute('aria-label', 'Quick navigation');
  const normalizedCurrent = normalizePath(_currentPath);
  const hasCurrentEntry = MOBILE_QUICK_NAV.some((/** @type {any} */ item) => normalizePath(item.href) === normalizedCurrent);
  const effectiveCurrent = hasCurrentEntry ? normalizedCurrent : normalizePath('/');
  nav.innerHTML = MOBILE_QUICK_NAV.map((/** @type {any} */ item) => {
    const isCurrent = normalizePath(item.href) === effectiveCurrent;
    const label = item.i18nKey ? multiLanguageService.t(item.i18nKey, item.label) : item.label;
    return `<a href="${item.href}" class="eon-bottom-nav-item${isCurrent ? ' active' : ''}"${isCurrent ? ' aria-current="page"' : ''} aria-label="${label}"><span class="eon-bnav-icon">${item.icon}</span><span class="eon-bnav-label">${label}</span></a>`;
  }).join('');
  if (!existingBottomNav) {
    document.body.appendChild(nav);
  }
  document.body.classList.add('has-bottom-nav');
}

function ensureShellFrame() {
  if (document.querySelector('.site-header')) return;
  const main = document.querySelector('main');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      <a href="/" class="brand">⚡ EONAPP<span>.ch</span></a>
      <nav class="nav" aria-label="Main"></nav>
    </div>
  `;
  if (main?.parentElement) {
    main.parentElement.insertBefore(header, main);
  } else {
    document.body.prepend(header);
  }
}

function _ensureLanguagePicker(/** @type {any} */ utilityRail) {
  if (!utilityRail || utilityRail.querySelector('#global-lang-picker')) return;

  const /** @type {any} */
existingWrap = utilityRail.querySelector('[data-shell-lang-placeholder="1"], .shell-lang-picker');
  const /** @type {any} */
wrap = existingWrap || document.createElement('label');
  wrap.className = 'sub-badge shell-lang-picker';
  wrap.removeAttribute('data-shell-lang-placeholder');
  wrap.setAttribute('for', 'global-lang-picker');
  wrap.setAttribute('aria-label', multiLanguageService.t('common.language', 'Language'));
  wrap.innerHTML = '';

  const /** @type {any} */
icon = document.createElement('span');
  icon.className = 'shell-lang-icon';
  icon.textContent = '\uD83C\uDF10';

  const /** @type {any} */
label = document.createElement('span');
  label.className = 'shell-lang-label';
  label.textContent = multiLanguageService.t('common.language', 'Language');

  const /** @type {any} */
select = document.createElement('select');
  select.id = 'global-lang-picker';
  select.className = 'shell-lang-select';
  select.setAttribute('aria-label', multiLanguageService.t('common.select-language', 'Choose language'));

  const displayLanguages = multiLanguageService.getSelectableLanguages().filter((/** @type {any} */ lang) => lang.active !== false);

  const /** @type {any} */
autoOpt = document.createElement('option');
  autoOpt.value = 'auto';
  autoOpt.textContent = multiLanguageService.t('common.auto', 'Auto');
  select.appendChild(autoOpt);

  displayLanguages.forEach((/** @type {any} */ lang) => {
    const /** @type {any} */
option = document.createElement('option');
    option.value = lang.code;
    option.textContent = `${countryCodeToFlag(lang.flag)} ${lang.name}`;
    select.appendChild(option);
  });

  let stored = 'auto';
  try {
    stored = localStorage.getItem('eon:lang:preference:v1') || localStorage.getItem('eon:lang:v1') || 'auto';
  } catch {}
  const initialValue = normalizeLanguageCode(stored, { allowAuto: true }) || 'auto';
  select.value = displayLanguages.some((/** @type {any} */ lang) => lang.code === initialValue) ? initialValue : 'auto';

  select.addEventListener('change', () => {
    const preferred = normalizeLanguageCode(select.value || 'auto', { allowAuto: true }) || 'auto';
    try {
      localStorage.setItem('eon:lang:preference:v1', preferred);
      localStorage.setItem('eon:lang:v1', preferred);
    } catch {}

    const resolved = preferred === 'auto'
      ? (multiLanguageService.detectBrowserLanguage?.() || 'en')
      : preferred;

    const normalizedResolved = normalizeLanguageCode(resolved) || 'en';
    multiLanguageService.setUserLanguage(normalizedResolved);
    applyLanguageDocumentProfile(document, normalizedResolved);
    if (_navEl) upsertNav(_navEl, _currentPath);
    localizeStatic();
    normalizeFooter();
    void autoLocalizePage();
  });

  document.addEventListener('eon:set-language', (/** @type {any} */ event) => {
    const next = normalizeLanguageCode((event)?.detail?.lang);
    if (!next) return;
    if ([...select.options].some((/** @type {any} */ opt) => opt.value === next)) {
      select.value = next;
      select.dispatchEvent(new Event('change'));
    }
  });

  document.addEventListener('language-changed', (/** @type {any} */ event) => {
    const next = normalizeLanguageCode((event)?.detail?.code || getCurrentLanguage());
    if (!next) return;
    if ([...select.options].some((/** @type {any} */ opt) => opt.value === next)) select.value = next;
    if (_navEl) upsertNav(_navEl, _currentPath);
    label.textContent = multiLanguageService.t('common.language', 'Language');
    wrap.setAttribute('aria-label', multiLanguageService.t('common.language', 'Language'));
    select.setAttribute('aria-label', multiLanguageService.t('common.select-language', 'Choose language'));
    const autoOption = select.querySelector('option[value="auto"]');
    if (autoOption) autoOption.textContent = multiLanguageService.t('common.auto', 'Auto');
    applyLanguageDocumentProfile(document, next);
    localizeStatic();
    normalizeFooter();
    void autoLocalizePage();
  });

  wrap.appendChild(icon);
  wrap.appendChild(label);
  wrap.appendChild(select);
  if (!existingWrap) utilityRail.insertBefore(wrap, utilityRail.firstChild || null);
}

export function initSiteShell() {
  void ensureRuntimeStyles();
  ensureShellFrame();
  _currentPath = normalizePath(window.location.pathname);
  const /** @type {any} */
headerInner = document.querySelector('.site-header .header-inner');
  const utilityRail = getOrCreateUtilityRail(headerInner);
  _navEl = document.querySelector('.site-header .nav');

  upsertNav(_navEl, _currentPath);
  addProfileButton(utilityRail);
  // Language overrides live in Profile → Voice & language; keep the main header calm.
  normalizeFooter();
  ensureGlobalShareLauncher(utilityRail);
  ensureBottomNav();

  const selected = getCurrentLanguage();
  document.documentElement.lang = selected;
  document.documentElement.dir = multiLanguageService.isRTL(selected) ? 'rtl' : 'ltr';

  applyLaunchI18nReset(document);
  import('./referral-par.js').then(async (referral) => {
    // A signed invite may set local arrival context. It never records a click,
    // tracks a visitor, synchronizes an attribution tree, or creates value.
    await referral?.captureSignedReferralFromCurrentLocation?.(getProfile());
  }).catch(() => {});
  void autoLocalizePage();
}
