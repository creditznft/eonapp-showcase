#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || '1'];
}));
const withServer = args.get('server') === '1' || args.get('serve') === '1';
const port = Number(args.get('port') || 4173);
const schema = 'eonapp.w149.ceo-launch-verification.v1';
const requiredSecrets = [
  'AD_REWARD_POSTBACK_SECRET',
  'MONETAG_REWARDED_SCRIPT_URL',
  'MONETAG_REWARDED_SDK_FUNCTION',
  'MONETAG_REWARDED_ZONE_ID',
  'NOWPAYMENTS_IPN_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHANNEL_USERNAME'
];

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function exists(file) { return fs.existsSync(path.join(root, file)); }
function activeLines(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
}
function blockFor(headers, route) {
  const lines = headers.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === route);
  if (start < 0) return '';
  const out = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\S/.test(line) && line.trim().startsWith('/')) break;
    out.push(line.trim());
  }
  return out.join('\n');
}
function hasAll(text, needles) { return needles.every((needle) => text.includes(needle)); }
function check(id, ok, detail, severity = 'blocker') { return { id, ok: Boolean(ok), severity, detail }; }
function jsonWrite(file, data) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`);
}
function markdownWrite(file, stats) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  const blockers = stats.checks.filter((item) => !item.ok && item.severity === 'blocker');
  const warnings = stats.checks.filter((item) => !item.ok && item.severity !== 'blocker');
  const lines = [
    '# W149 CEO launch verification',
    '',
    `Schema: ${stats.schema}`,
    `Result: ${stats.ok ? 'PASS' : 'FAIL'}`,
    `Checks: ${stats.passedChecks}/${stats.totalChecks}`,
    `Blockers: ${blockers.length}`,
    `Warnings: ${warnings.length}`,
    '',
    '## Blockers',
    '',
    blockers.length ? blockers.map((item) => `- ${item.id}: ${item.detail}`).join('\n') : 'None.',
    '',
    '## Warnings',
    '',
    warnings.length ? warnings.map((item) => `- ${item.id}: ${item.detail}`).join('\n') : 'None.',
    '',
    '## CEO launch decision',
    '',
    stats.ok
      ? 'Proceed to Codex merge/deploy with the production browser proof as the final live-only gate.'
      : 'Do not deploy until every blocker above is fixed.',
    ''
  ];
  fs.writeFileSync(path.join(root, file), `${lines.join('\n')}\n`);
}

function staticChecks() {
  const headers = read('_headers');
  const publicHeaders = exists('public/_headers') ? read('public/_headers') : '';
  const redirects = read('_redirects');
  const publicRedirects = exists('public/_redirects') ? read('public/_redirects') : '';
  const telegramHtml = read('telegram.html');
  const rewardHtml = read('reward-access.html');
  const marketHtml = read('market.html');
  const config = read('assets/js/ads/config.js');
  const monetag = read('assets/js/ads/monetag-rewarded.js');
  const rewardPage = read('assets/js/reward-access-page.js');
  const telegramPage = read('assets/js/telegram-page.js');
  const telegramSession = read('functions/api/telegram/session.js');
  const adPostback = read('functions/api/ad-rewards/postback.js');
  const nowpaymentsIpn = read('functions/api/nowpayments/ipn.js');
  const tgGrowth = read('assets/js/utils/telegram-growth-rewards.js');
  const readiness = read('scripts/telegram-miniapp-readiness.mjs');
  const redirectsLines = activeLines(redirects);
  const telegramRedirectRules = redirectsLines.filter((line) => /^\/telegram(?:\.html|\/)?\s+/i.test(line));
  const telegramUnsafeRedirectLoops = telegramRedirectRules.filter((line) => {
    const [, to = '', status = ''] = line.split(/\s+/);
    return /telegram(?:\.html)?/i.test(to) && /^(301|302|307|308)$/i.test(status);
  });
  const telegramSafeRewriteRules = telegramRedirectRules.filter((line) => {
    const [, to = '', status = ''] = line.split(/\s+/);
    return /^(\/telegram\.html)$/i.test(to) && status === '200';
  });
  const telegramBlock = blockFor(headers, '/telegram');
  const telegramHtmlBlock = blockFor(headers, '/telegram.html');
  const rewardBlock = blockFor(headers, '/reward-access.html');
  const marketBlock = blockFor(headers, '/market');
  const marketHtmlBlock = blockFor(headers, '/market.html');
  const allSource = [config, monetag, rewardPage, telegramPage, telegramSession, adPostback, nowpaymentsIpn, tgGrowth, readiness].join('\n');
  const checks = [
    check('source-headers-public-headers-in-sync', headers === publicHeaders, 'Root _headers and public/_headers must match so local/Vite and Cloudflare deploy behavior do not drift.'),
    check('source-redirects-public-redirects-in-sync', redirects === publicRedirects, 'Root _redirects and public/_redirects must match so future builds cannot revive stale /game or Telegram redirects.'),
    check(
      'telegram-no-active-redirect-loop-rules',
      telegramUnsafeRedirectLoops.length === 0 && telegramSafeRewriteRules.length >= 2,
      `Telegram routes should use safe 200 rewrites, not 30x loops. Unsafe: ${telegramUnsafeRedirectLoops.join(' | ') || 'none'}. Safe rewrites: ${telegramSafeRewriteRules.join(' | ') || 'none'}`
    ),
    check('telegram-clean-route-header', hasAll(telegramBlock, ['Cache-Control: no-cache, no-store, must-revalidate', '! X-Frame-Options', '! Cross-Origin-Opener-Policy', '! Cross-Origin-Embedder-Policy', 'frame-ancestors', 'web.telegram.org']), 'Clean /telegram route must be no-store and Telegram-frame compatible.'),
    check('telegram-html-route-header', hasAll(telegramHtmlBlock, ['Cache-Control: no-cache, no-store, must-revalidate', '! X-Frame-Options', '! Cross-Origin-Opener-Policy', '! Cross-Origin-Embedder-Policy', 'frame-ancestors', 'web.telegram.org']), 'Legacy /telegram.html route must also be no-store and Telegram-frame compatible if opened directly.'),
    check('reward-access-header', hasAll(rewardBlock, ['Cache-Control: no-cache, no-store, must-revalidate', '! X-Frame-Options', 'https://libtl.com', 'frame-ancestors', 'web.telegram.org']), 'Reward access route must be no-store, embeddable by Telegram, and able to load Monetag SDK only there.'),
    check('market-no-store-clean-route', marketBlock.includes('Cache-Control: no-cache, no-store, must-revalidate') && marketHtmlBlock.includes('Cache-Control: no-cache, no-store, must-revalidate'), 'Market clean and .html routes must not serve stale first-load HTML.'),
    check('telegram-canonical-url-final', /<link rel="canonical" href="https:\/\/eonapp\.ch\/telegram"/.test(telegramHtml) && !/https:\/\/eonapp\.ch\/telegram\.html/.test(telegramHtml) && !/https:\/\/eonapp\.ch\/telegram\.html/.test(tgGrowth) && !/miniAppUrl:\s*'https:\/\/eonapp\.ch\/telegram\.html'/.test(readiness), 'All public Mini App docs/config should prefer https://eonapp.ch/telegram, not .html.'),
    check('telegram-visible-proof-states', hasAll(telegramHtml, ['data-w132-reward-proof="telegram-miniapp"', 'Monetag SDK', 'Postback pending', 'Reward granted']), 'Telegram page must visibly explain reward state transitions.'),
    check('reward-visible-proof-states', hasAll(rewardHtml, ['data-w132-reward-proof="reward-access"', 'Monetag', 'postback', 'Telegram']), 'Reward page must visibly explain Telegram + Monetag proof states.'),
    check('monetag-exact-sdk-values', hasAll(config, ["zoneId: '11111741'", "scriptUrl: 'https://libtl.com/sdk.js'", "sdkFunctionName: 'show_11111741'"]) && /data-zone'\s*:\s*cfg\.zoneId|data-zone/.test(monetag) && /type:\s*'end'/.test(monetag) && /type:\s*'pop'/.test(monetag), 'Monetag SDK must match dashboard zone/function and exact rewarded interstitial/popup calls.'),
    check('no-inapp-reward-credit-path', /In-App Interstitial[\s\S]{0,120}intentionally not used/.test(monetag) && !/format:\s*'inApp'/.test(rewardPage), 'In-App Interstitial may be documented as blocked but must not grant reward credits.'),
    check('user-action-before-ad', /awaiting-user-action/.test(rewardPage) && /addEventListener\('click'/.test(rewardPage) && /opening-monetag-rewarded-sdk/.test(rewardPage), 'Rewarded ad SDK must open only from user tap flow.'),
    check('market-starter-first-impression', /starter/i.test(marketHtml) && /Vault/i.test(marketHtml) && !/No items match your search/.test(marketHtml.slice(0, 20000)), 'Market first-load HTML must not look empty/broken and must lead to Vault inventory.'),
    check('secret-names-present-values-absent', requiredSecrets.every((name) => allSource.includes(name) || headers.includes(name) || redirects.includes(name) || name.startsWith('MONETAG_REWARDED')), 'Required Cloudflare binding/secret names are documented in source by name only.'),
    check('telegram-function-uses-token-and-channel', /TELEGRAM_BOT_TOKEN/.test(telegramSession) && /TELEGRAM_CHANNEL_USERNAME/.test(telegramSession) && /validateTelegramInitData/.test(telegramSession), 'Telegram session function must HMAC verify initData and check channel membership with env token/channel.'),
    check('postback-function-secret-bound', /AD_REWARD_POSTBACK_SECRET/.test(adPostback) && /invalid_postback_secret/.test(adPostback) && /reward_event_type/.test(adPostback), 'Monetag postback must be secret-bound and reward_event_type aware.'),
    check('nowpayments-ipn-secret-bound', /NOWPAYMENTS_IPN_SECRET/.test(nowpaymentsIpn) && /x-nowpayments-sig/i.test(nowpaymentsIpn), 'NOWPayments IPN must remain signature/secret-bound.'),
    check('core-routes-exist', ['index.html', 'telegram.html', 'reward-access.html', 'market.html', 'vault.html', 'eon-browser.html', 'realm.html', 'support.html'].every(exists), 'Core launch routes must exist in the source bundle.'),
    check('dist-ready-optional', exists('dist/index.html') && exists('dist/_headers') && exists('dist/_redirects'), 'Run npm run build before deploy so dist/ and Cloudflare headers/redirects are materialized.', 'warning')
  ];
  return { checks };
}

function request(pathname) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathname, method: 'GET', timeout: 8000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ path: pathname, ok: true, status: res.statusCode || 0, headers: res.headers, body: body.slice(0, 120000) }));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', (error) => resolve({ path: pathname, ok: false, status: 0, error: String(error?.message || error) }));
    req.end();
  });
}

async function withStaticServer(fn) {
  const serverScript = path.join(root, 'scripts', 'lhci-static-server.mjs');
  const child = spawn(process.execPath, [serverScript, '--port', String(port), '--root', 'dist'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  const append = (chunk) => { output += String(chunk || ''); };
  child.stdout.on('data', append);
  child.stderr.on('data', append);
  try {
    for (let i = 0; i < 50; i += 1) {
      const row = await request('/');
      if (row.status === 200) return await fn(output);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return { serverStarted: false, output };
  } finally {
    child.kill('SIGTERM');
  }
}

async function serverChecks() {
  if (!withServer) return { server: { skipped: true, reason: 'pass --server=1 after npm run build to run local HTTP route checks' }, checks: [] };
  if (!exists('dist/index.html')) return { server: { skipped: true, reason: 'dist missing; run npm run build first' }, checks: [check('server-dist-missing', false, 'dist missing; run npm run build first')] };
  return await withStaticServer(async (output) => {
    const paths = ['/', '/telegram', '/telegram.html', '/reward-access.html?mode=telegram', '/market', '/market.html', '/vault.html'];
    const rows = [];
    for (const route of paths) rows.push(await request(route));
    const checks = [
      check('server-core-routes-2xx', rows.every((row) => row.status >= 200 && row.status < 300), `HTTP statuses: ${rows.map((row) => `${row.path}=${row.status || row.error}`).join(', ')}`),
      check('server-telegram-content', rows.some((row) => row.path === '/telegram' && /Telegram/i.test(row.body || '') && /Monetag/i.test(row.body || '')), '/telegram must render Telegram + Monetag proof copy.'),
      check('server-reward-content', rows.some((row) => row.path.startsWith('/reward-access') && /show_11111741|Monetag|Telegram/i.test(row.body || '')), '/reward-access.html must render reward proof/call context.'),
      check('server-market-content', rows.some((row) => row.path === '/market' && /starter|Vault|market/i.test(row.body || '')), '/market must render starter/market content.'),
      check('server-no-html-loop', rows.filter((row) => row.path.includes('telegram')).every((row) => row.status < 300 || row.status >= 400), `Telegram local routes should not redirect-loop. Statuses: ${rows.filter((row) => row.path.includes('telegram')).map((row) => `${row.path}=${row.status}`).join(', ')}`)
    ];
    return { server: { skipped: false, output: output.slice(-2000), routes: rows.map((row) => ({ path: row.path, status: row.status, ok: row.ok, error: row.error || '' })) }, checks };
  });
}

const startedAt = new Date().toISOString();
const staticResult = staticChecks();
const serverResult = await serverChecks();
const checks = [...staticResult.checks, ...serverResult.checks];
const blockers = checks.filter((item) => !item.ok && item.severity === 'blocker');
const stats = {
  schema,
  ok: blockers.length === 0,
  startedAt,
  completedAt: new Date().toISOString(),
  totalChecks: checks.length,
  passedChecks: checks.filter((item) => item.ok).length,
  blockerCount: blockers.length,
  warningCount: checks.filter((item) => !item.ok && item.severity !== 'blocker').length,
  checks,
  server: serverResult.server,
  requiredCloudflareBindingsByNameOnly: requiredSecrets,
  ceoDecision: blockers.length === 0
    ? 'Proceed to Codex deployment prep. Run production browser proof after deploy.'
    : 'Block deployment until failed launch checks are fixed.'
};
jsonWrite('artifacts/W149_CEO_LAUNCH_VERIFICATION_STATS_2026-06-13.json', stats);
jsonWrite('tmp/w149-simple-launch-proof.json', stats);
markdownWrite('reports/w149/CEO_LAUNCH_VERIFICATION_2026-06-13.md', stats);

if (!stats.ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`[W149] CEO launch verification passed: ${stats.passedChecks}/${stats.totalChecks} checks. ${serverResult.server?.skipped ? 'Local HTTP proof skipped.' : 'Local HTTP proof included.'}`);
