import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const failures = [];
const pass = [];

function assert(name, condition, detail = '') {
  if (condition) pass.push({ name, detail });
  else failures.push({ name, detail });
}

const redirects = read('_redirects');
const publicRedirects = read('public/_redirects');
const headers = read('_headers');
const publicHeaders = read('public/_headers');
const telegramHtml = read('telegram.html');
const rewardHtml = read('reward-access.html');
const telegramJs = read('assets/js/telegram-page.js');
const rewardJs = read('assets/js/reward-access-page.js');
const monetagJs = read('assets/js/ads/monetag-rewarded.js');

for (const fileText of [redirects, publicRedirects]) {
  assert('telegram clean-url rewrite removed', !/\/telegram\s+\/telegram\.html\s+200/.test(fileText));
  assert('telegram html self-rewrite removed', !/\/telegram\.html\s+\/telegram\.html\s+200/.test(fileText));
  assert('reward clean-url rewrite removed', !/\/reward-access\s+\/reward-access\.html\s+200/.test(fileText));
  assert('reward html self-rewrite removed', !/\/reward-access\.html\s+\/reward-access\.html\s+200/.test(fileText));
  assert('redirect notes document clean-url behavior', /Cloudflare Pages clean URLs already canonicalize \.html routes/i.test(fileText));
  assert('no telegram redirect rule', !/\/telegram\S*\s+\/telegram\S*\s+30[128]/.test(fileText));
  assert('no reward redirect rule', !/\/reward-access\S*\s+\/reward-access\S*\s+30[128]/.test(fileText));
}

for (const fileText of [headers, publicHeaders]) {
  assert('telegram header detaches X-Frame-Options', /\/telegram[\s\S]*?! X-Frame-Options/.test(fileText));
  assert('telegram header allows Telegram frame ancestors', /\/telegram[\s\S]*frame-ancestors 'self' https:\/\/web\.telegram\.org https:\/\/webk\.telegram\.org https:\/\/webz\.telegram\.org https:\/\/\*\.telegram\.org/.test(fileText));
  assert('reward header detaches X-Frame-Options', /\/reward-access[\s\S]*?! X-Frame-Options/.test(fileText));
  assert('reward header allows Monetag/libtl scripts', /\/reward-access[\s\S]*https:\/\/\*\.monetag\.com[\s\S]*https:\/\/libtl\.com[\s\S]*https:\/\/\*\.libtl\.com/.test(fileText));
}

assert('telegram canonical remains /telegram', telegramHtml.includes('<link rel="canonical" href="https://eonapp.ch/telegram"'));
assert('telegram reward links use exact stable reward route', telegramHtml.includes('/reward-access.html?mode=telegram&source=telegram-miniapp'));
assert('telegram page has no meta refresh', !/<meta[^>]+http-equiv=["']refresh/i.test(telegramHtml));
assert('telegram page copy says no auto ad', /No ad starts automatically/i.test(telegramHtml));
assert('telegram JS does not import Google Analytics', !telegramJs.includes('google-analytics'));
assert('telegram JS reward path is exact stable route', telegramJs.includes("const REWARD_ACCESS_PATH = '/reward-access.html?mode=telegram&source=telegram-miniapp&action=watch-ad';"));
assert('telegram JS has no load-time timeout redirect', !/setTimeout\s*\([^)]*location\.(href|replace|assign)/s.test(telegramJs));
assert('reward page has Watch rewarded ad CTA', /Watch rewarded ad/.test(rewardHtml) && /Watch rewarded ad/.test(rewardJs));
assert('reward access blocks missing Telegram initData', rewardJs.includes('missing-telegram-initdata'));
assert('reward access verifies Telegram session before ad', rewardJs.indexOf('const telegramGate = await verifyTelegramRewardAccess()') > -1 && rewardJs.indexOf('const telegramGate = await verifyTelegramRewardAccess()') < rewardJs.indexOf('await triggerGatewayActionAd'));
assert('Monetag interstitial call uses type end', monetagJs.includes("type: 'end'") || monetagJs.includes('type: "end"'));
assert('Monetag popup fallback uses type pop', monetagJs.includes("type: 'pop'") || monetagJs.includes('type: "pop"'));
assert('Monetag only grants account proof on yes/valued', monetagJs.includes('reward_event_type') && monetagJs.includes('valued'));

const report = [
  '# W150 Telegram Reward Hardening Proof',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `Result: ${failures.length ? 'FAIL' : 'PASS'}`,
  `Passed checks: ${pass.length}`,
  `Failed checks: ${failures.length}`,
  '',
  '## Passed',
  ...pass.map((item) => `- ${item.name}${item.detail ? ` — ${item.detail}` : ''}`),
  '',
  '## Failed',
  ...(failures.length ? failures.map((item) => `- ${item.name}${item.detail ? ` — ${item.detail}` : ''}`) : ['- None']),
  ''
].join('\n');

fs.mkdirSync(path.join(ROOT, 'reports/w150'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports/w150/TELEGRAM_REWARD_HARDENING_2026-06-13.md'), report);
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/W150_TELEGRAM_REWARD_HARDENING_STATS_2026-06-13.json'), JSON.stringify({ ok: failures.length === 0, passed: pass.length, failed: failures.length, failures, generatedAt: new Date().toISOString() }, null, 2));

if (failures.length) {
  console.error(report);
  process.exit(1);
}
console.log(report);
