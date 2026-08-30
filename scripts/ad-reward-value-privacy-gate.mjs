import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'functions/api/ad-rewards/postback.js',
  'functions/api/ad-rewards/status.js'
];
const corpus = files.map((file) => `\n/* ${file} */\n${fs.readFileSync(path.join(root, file), 'utf8')}`).join('\n');
const errors = [];

const required = [
  'value-only-provider-receipt-no-user-ip-country-storage',
  'provider_estimated_price_and_reward_event_type_only',
  'ymid_required_value_only_mode',
  'rawIpStored: false',
  'countryStored: false',
  'uidStored: false',
  'telegramIdStored: false',
  'sessionIdStored: false'
];
for (const token of required) {
  if (!corpus.includes(token)) errors.push(`Missing required W68 privacy/value token: ${token}`);
}

const forbiddenPatterns = [
  /adreward:uid:/i,
  /adreward:session:/i,
  /telegram_id\s*:/i,
  /uid\s*:/i,
  /session_id\s*:/i,
  /ipAddress\s*:/i,
  /rawIp\s*:/i,
  /country\s*:/i,
  /userAgent\s*:/i,
  /events\s*:\s*\[/i
];
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) errors.push(`Forbidden ad reward storage pattern found: ${pattern}`);
}

if (errors.length) {
  console.error('W68 ad reward value privacy gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  schema: 'eon.ad-reward-value-privacy-gate.v1',
  checkedFiles: files,
  rule: 'Monetag/provider ymid + reward_event_type + estimated_price only; no IP, country, user-agent, UID, Telegram ID, session ID, or event arrays.'
}, null, 2));
