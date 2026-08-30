const EXTENSION_SCHEMES = /^(?:chrome-extension|moz-extension|safari-web-extension|ms-browser-extension|opera-extension):/i;

function safeText(value = '') { return String(value || '').replace(/(cookie|authorization|token|code|state|session|key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 1000); }
function safeUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try { const url = new URL(raw); url.search = ''; url.hash = ''; return safeText(url.toString()); } catch { return safeText(raw.split(/[?#]/, 1)[0]); }
}

export function classifyBrowserConsoleMessage(message = {}) {
  const type = typeof message.type === 'function' ? String(message.type() || '') : String(message.type || '');
  const text = typeof message.text === 'function' ? String(message.text() || '') : String(message.text || '');
  let location = {};
  try { location = typeof message.location === 'function' ? (message.location() || {}) : (message.location || {}); } catch {}
  const url = safeUrl(location?.url || '');
  const source = EXTENSION_SCHEMES.test(url) ? 'browser-extension' : 'page-or-browser';
  return Object.freeze({ type, text: safeText(text), url, source, firstPartyRelevant: source !== 'browser-extension' });
}

export function routeBrowserConsoleEvidence(message, { firstParty = [], extensions = [] } = {}) {
  const evidence = classifyBrowserConsoleMessage(message);
  if (!['error', 'warning'].includes(evidence.type)) return evidence;
  const target = evidence.firstPartyRelevant ? firstParty : extensions;
  target.push(Object.freeze({ type: evidence.type, text: evidence.text, ...(evidence.url ? { url: evidence.url } : {}) }));
  return evidence;
}
