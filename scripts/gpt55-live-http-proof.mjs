#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || '1'];
}));

const target = String(args.get('target') || process.env.EONAPP_PUBLIC_URL || 'https://eonapp.ch').replace(/\/$/, '');
const out = String(args.get('out') || 'reports/gpt55-launch/http-proof.json');
const telegramOnly = args.has('telegram-only');

const routes = telegramOnly ? [
  '/telegram',
  '/telegram.html',
  '/reward-access.html?mode=telegram&source=telegram-miniapp'
] : [
  '/',
  '/chat.html',
  '/eon-browser.html',
  '/market',
  '/vault',
  '/realm',
  '/support.html',
  '/subscription',
  '/billing.html',
  '/telegram',
  '/telegram.html',
  '/reward-access.html?mode=telegram&source=telegram-miniapp'
];

function pickHeaders(headers) {
  const wanted = [
    'content-type',
    'cache-control',
    'content-security-policy',
    'x-frame-options',
    'cross-origin-opener-policy',
    'cross-origin-embedder-policy',
    'location'
  ];
  const out = {};
  for (const key of wanted) out[key] = headers.get(key) || '';
  return out;
}


function extractMetaCsp(body) {
  const html = String(body || '');
  const tag = (html.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/i) || [])[0]
    || (html.match(/<meta[^>]+content=["'][^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/i) || [])[0]
    || '';
  const content = tag.match(/content="([^"]*)"/i) || tag.match(/content='([^']*)'/i);
  return content ? content[1] : '';
}

function analyze(route, status, finalUrl, headers, body) {
  const failures = [];
  const lowerBody = String(body || '').toLowerCase();
  const headerCsp = headers['content-security-policy'] || '';
  const metaCsp = extractMetaCsp(body);
  const csp = headerCsp || metaCsp;
  const xfo = headers['x-frame-options'] || '';
  if (status >= 400) failures.push(`http_${status}`);
  if (/telegram/.test(route)) {
    if (xfo) failures.push('telegram_route_has_x_frame_options');
    if (!/frame-ancestors[^;]*(web\.telegram\.org|\*\.telegram\.org)/i.test(csp)) failures.push('telegram_frame_ancestors_missing');
    if (!/telegram\.org\/js\/telegram-web-app\.js/i.test(body)) failures.push('telegram_sdk_script_missing');
    if (!lowerBody.includes('telegram') || !lowerBody.includes('monetag')) failures.push('telegram_required_copy_missing');
  }
  if (/reward-access/.test(route)) {
    if (xfo) failures.push('reward_route_has_x_frame_options');
    if (!/monetag|libtl|propeller/i.test(csp)) failures.push('reward_monetag_csp_missing');
    if (!lowerBody.includes('watch rewarded ad')) failures.push('reward_cta_missing');
  }
  return { ok: failures.length === 0, failures, cspSource: headerCsp ? 'header' : (metaCsp ? 'meta' : 'missing') };
}

const results = [];
for (const route of routes) {
  const url = `${target}${route}`;
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'EONAPP-GPT55-LiveProof/1.0' } });
    const text = await res.text();
    const headers = pickHeaders(res.headers);
    const analysis = analyze(route, res.status, res.url, headers, text);
    results.push({
      route,
      url,
      finalUrl: res.url,
      status: res.status,
      redirected: res.url !== url,
      ms: Date.now() - started,
      headers,
      bodySample: text.slice(0, 500).replace(/\s+/g, ' '),
      ...analysis
    });
  } catch (error) {
    results.push({ route, url, status: null, ok: false, failures: ['fetch_failed'], error: error?.message || String(error), ms: Date.now() - started });
  }
}

const summary = {
  schema: 'eonapp.gpt55.live-http-proof.v1',
  target,
  checkedAt: new Date().toISOString(),
  ok: results.every((row) => row.ok),
  failureCount: results.reduce((sum, row) => sum + row.failures.length, 0),
  routes: results.length,
  results
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exit(1);
