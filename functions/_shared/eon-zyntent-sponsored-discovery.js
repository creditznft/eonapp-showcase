import {
  EON_ZYNTENT,
  getPartnerMonetizationRuntimeConfig
} from '../../config/rt97-partner-monetization-contract.mjs';

const freeze = (value) => Object.freeze(value);

function cleanText(value = '', max = 240) {
  return Array.from(String(value || '').trim())
    .filter((character) => {
      const code = character.codePointAt(0) || 0;
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .slice(0, max);
}

function safeHttpsUrl(value = '') {
  try {
    const parsed = new URL(String(value || '').trim());
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function countryFromRequest(request) {
  const cfCountry = String(request?.cf?.country || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(cfCountry) ? cfCountry : 'US';
}

function languageFromRequest(request, fallback = 'en') {
  const requested = cleanText(fallback, 12).toLowerCase();
  if (/^[a-z]{2}(?:-[a-z]{2})?$/.test(requested)) return requested.slice(0, 2);
  const header = cleanText(request?.headers?.get?.('accept-language') || '', 80).toLowerCase();
  const match = header.match(/\b([a-z]{2})(?:-[a-z]{2})?\b/);
  return match?.[1] || 'en';
}

export function buildZyntentSponsoredDiscoveryPayload(intent = {}, request = null) {
  const query = cleanText(intent?.query, 180);
  const requestedLimit = Number(intent?.maxResults ?? intent?.ads_limit ?? 4);
  const adsLimit = Number.isFinite(requestedLimit) ? Math.min(5, Math.max(1, Math.floor(requestedLimit))) : 4;
  return freeze({
    query: freeze({ text: query }),
    countries: freeze([countryFromRequest(request)]),
    language: languageFromRequest(request, intent?.language || 'en'),
    ads_limit: adsLimit,
    entity_types: freeze([]),
    merchants: freeze([])
  });
}

function candidateItems(payload = {}) {
  if (Array.isArray(payload)) return payload;
  for (const key of ['ads', 'results', 'items', 'data']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

export function normalizeZyntentSponsoredResults(payload = {}, maxResults = 5) {
  const max = Math.min(5, Math.max(1, Number(maxResults) || 5));
  const results = [];
  for (const raw of candidateItems(payload)) {
    if (!raw || typeof raw !== 'object') continue;
    const merchantObject = raw.merchant && typeof raw.merchant === 'object' ? raw.merchant : {};
    const url = safeHttpsUrl(raw.tracking_url || raw.trackingUrl || raw.click_url || raw.clickUrl || raw.target_url || raw.targetUrl || raw.url || raw.link);
    if (!url) continue;
    const title = cleanText(raw.title || raw.name || raw.product_name || raw.productName || merchantObject.name, 160);
    if (!title) continue;
    const imageUrl = safeHttpsUrl(raw.image_url || raw.imageUrl || raw.image || raw.thumbnail_url || raw.thumbnailUrl);
    results.push(freeze({
      title,
      description: cleanText(raw.description || raw.subtitle || raw.text, 300),
      merchant: cleanText(raw.merchant_name || raw.merchantName || merchantObject.name, 120),
      price: cleanText(raw.price?.formatted || raw.price_text || raw.priceText || (typeof raw.price === 'string' || typeof raw.price === 'number' ? raw.price : ''), 80),
      imageUrl,
      url,
      sponsored: true
    }));
    if (results.length >= max) break;
  }
  return freeze(results);
}

export async function fetchZyntentSponsoredDiscovery({ env = {}, request = null, intent = {}, fetchImpl = fetch } = {}) {
  const runtime = getPartnerMonetizationRuntimeConfig(env);
  if (!runtime?.zyntent?.ready) return freeze({ ok: false, status: 503, reason: 'zyntent_not_configured' });

  const apiKey = String(env[EON_ZYNTENT.apiKeyEnv] || '').trim();
  const sourceId = String(env[EON_ZYNTENT.sourceIdEnv] || '').trim();
  const payload = buildZyntentSponsoredDiscoveryPayload(intent, request);
  if (payload.query.text.length < 3) return freeze({ ok: false, status: 400, reason: 'zyntent_query_too_short' });

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
  let response;
  try {
    response = await fetchImpl(`${EON_ZYNTENT.apiBase}${EON_ZYNTENT.adsSearchPath}`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ source_id: sourceId, ...payload }),
      ...(controller ? { signal: controller.signal } : {})
    });
  } catch {
    return freeze({ ok: false, status: 502, reason: 'zyntent_unavailable' });
  } finally {
    if (timer) clearTimeout(timer);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) return freeze({ ok: false, status: response.status || 502, reason: 'zyntent_provider_error' });
  const results = normalizeZyntentSponsoredResults(body, payload.ads_limit);
  return freeze({
    ok: true,
    status: 200,
    provider: 'zyntent',
    sponsored: true,
    disclosure: 'Sponsored Discovery · Zyntent product/deal results',
    results,
    noFill: results.length === 0,
    outbound: freeze({
      fullConversationForwarded: false,
      localAnswerForwarded: false,
      byokAnswerForwarded: false,
      privateMemoryForwarded: false,
      providerKeysForwarded: false,
      fields: freeze(['source_id', 'query.text', 'countries', 'language', 'ads_limit', 'entity_types', 'merchants'])
    })
  });
}

export default freeze({
  buildZyntentSponsoredDiscoveryPayload,
  normalizeZyntentSponsoredResults,
  fetchZyntentSponsoredDiscovery
});
