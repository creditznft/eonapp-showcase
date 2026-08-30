import { RC_LANGUAGE_CODES, RC_LANGUAGE_META, applyLanguageDocumentProfile, normalizeRcLanguage } from './i18n-rc-registry.js';

const PREF_KEY = 'eon:lang:preference:v1';
const LEGACY_KEY = 'eon:lang:v1';

function safeRead(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeWrite(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function flag(code = '') {
  return String(code).toUpperCase().split('').map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397)).join('');
}

function normalizePreference(value) {
  const raw = String(value || '').trim().toLowerCase().replace('_', '-');
  if (!raw || raw === 'auto') return 'auto';
  const base = raw.split('-')[0];
  return RC_LANGUAGE_CODES.includes(base) ? base : 'auto';
}

function resolvePreference(preferred) {
  if (preferred !== 'auto') return normalizeRcLanguage(preferred);
  const browser = String(navigator.language || navigator.languages?.[0] || 'en').toLowerCase().split('-')[0];
  return RC_LANGUAGE_CODES.includes(browser) ? browser : 'en';
}

function getHost() {
  const headerInner = document.querySelector('.site-header .header-inner');
  if (headerInner) {
    let rail = headerInner.querySelector('.shell-utility-rail');
    if (!rail) {
      rail = document.createElement('div');
      rail.className = 'shell-utility-rail w102-lite-utility-rail';
      headerInner.appendChild(rail);
    }
    return rail;
  }
  return document.body;
}

async function applyRuntimeLanguage(preferred) {
  const resolved = resolvePreference(preferred);
  applyLanguageDocumentProfile(document, resolved);
  try {
    const language = await import('./app-language.js');
    language.initAppLanguage?.({ localize: false });
    await language.autoLocalizePage?.(document);
  } catch (error) {
    console.warn('[W102 language picker] Language runtime unavailable; document profile still applied.', error);
  }
  document.dispatchEvent(new CustomEvent('eon:w102-language-applied', { detail: { preferred, resolved } }));
  return resolved;
}

export function mountReleaseLanguagePicker() {
  const existing = document.getElementById('global-lang-picker');
  if (existing) return existing;

  const preferred = normalizePreference(safeRead(PREF_KEY) || safeRead(LEGACY_KEY) || 'auto');
  const resolved = resolvePreference(preferred);
  applyLanguageDocumentProfile(document, resolved);

  const wrap = document.createElement('label');
  wrap.className = 'sub-badge shell-lang-picker w102-release-lang-picker';
  wrap.setAttribute('for', 'global-lang-picker');
  wrap.setAttribute('aria-label', 'Language');
  wrap.innerHTML = '<span class="shell-lang-icon" aria-hidden="true">🌐</span><span class="shell-lang-label">Language</span>';

  const select = document.createElement('select');
  select.id = 'global-lang-picker';
  select.className = 'shell-lang-select';
  select.setAttribute('aria-label', 'Choose language');

  const auto = document.createElement('option');
  auto.value = 'auto';
  auto.textContent = 'Auto';
  select.appendChild(auto);
  for (const code of RC_LANGUAGE_CODES) {
    const meta = RC_LANGUAGE_META[code];
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${flag(meta.flag)} ${meta.name}`;
    select.appendChild(option);
  }
  select.value = preferred;
  select.addEventListener('change', () => {
    const next = normalizePreference(select.value);
    safeWrite(PREF_KEY, next);
    safeWrite(LEGACY_KEY, next);
    void applyRuntimeLanguage(next);
  });

  wrap.appendChild(select);
  const host = getHost();
  if (host === document.body) wrap.classList.add('w102-release-lang-picker--floating');
  host.insertBefore(wrap, host.firstChild || null);

  if (preferred !== 'en' && preferred !== 'auto' || resolved !== 'en') void applyRuntimeLanguage(preferred);
  return select;
}

function boot() {
  mountReleaseLanguagePicker();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
