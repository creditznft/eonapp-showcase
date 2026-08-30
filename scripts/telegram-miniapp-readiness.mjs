#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const requiredFiles = [
  'telegram.html',
  'assets/js/telegram-page.js',
  'assets/css/telegram.css',
  'functions/api/telegram/session.js',
  'assets/js/utils/offline-screen-translations.w59.js'
];

const errors = [];
const warnings = [];

function read(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    errors.push(`Missing ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

for (const file of requiredFiles) read(file);

const html = read('telegram.html');
const pageJs = read('assets/js/telegram-page.js');
const sessionJs = read('functions/api/telegram/session.js');
const packageJson = JSON.parse(read('package.json') || '{}');

if (!/telegram\.org\/js\/telegram-web-app\.js/.test(html)) errors.push('telegram.html must load Telegram WebApp SDK.');
if (!/https:\/\/t\.me\/EonApps/.test(html) || !/https:\/\/t\.me\/EonApps/.test(pageJs)) errors.push('Telegram page must link to t.me/EonApps channel.');
if (!/(https:\/\/t\.me\/EonAppsBot|EonAppsBot|getTelegramDeepLinks)/.test(pageJs)) {
  errors.push('Telegram page must include EonAppsBot fallback link.');
}
if (!/reward-access\.html\?mode=telegram/.test(html) || !/reward-access\.html\?mode=telegram/.test(pageJs)) errors.push('Telegram page must route reward actions to reward-access.html?mode=telegram.');
if (!/TELEGRAM_BOT_TOKEN/.test(sessionJs)) errors.push('Telegram session function must use TELEGRAM_BOT_TOKEN env secret.');
if (!/TELEGRAM_CHANNEL_USERNAME/.test(sessionJs)) warnings.push('Telegram session function should support TELEGRAM_CHANNEL_USERNAME env binding.');
if (!/validateTelegramInitData/.test(sessionJs)) errors.push('Telegram initData validation helper missing.');
if (/\b\d{6,}:[A-Za-z0-9_-]{20,}\b/.test(html + pageJs + sessionJs)) errors.push('Possible Telegram bot token found in frontend/session source. Remove before shipping.');
if (!packageJson.scripts?.['qa:telegram-miniapp-readiness']) errors.push('package.json missing qa:telegram-miniapp-readiness script.');

const report = {
  schema: 'eon.telegram-miniapp-readiness.v1',
  status: errors.length ? 'FAIL' : 'PASS',
  miniAppUrl: 'https://eonapp.ch/telegram',
  bot: '@EonAppsBot',
  channel: '@EonApps',
  requiredCloudflareSecrets: ['TELEGRAM_BOT_TOKEN'],
  optionalCloudflareVariables: ['TELEGRAM_CHANNEL_USERNAME=EonApps'],
  requiredFiles,
  warnings,
  errors
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
