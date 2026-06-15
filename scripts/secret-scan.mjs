import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const forbiddenNames = [/\.env($|\.)/i, /private[_-]?key/i, /secret/i, /token/i];
const forbiddenText = [
  /TELEGRAM_BOT_TOKEN/i,
  /NOWPAYMENTS_IPN_SECRET/i,
  /AD_REWARD_POSTBACK_SECRET/i,
  /MONETAG_REWARDED_ZONE_ID\s*=/i,
  /FILEBASE_(SECRET|ACCESS|KEY)/i,
  /PRIVATE_KEY\s*=/i,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/i
];
const allowSecretDocs = new Set(['SECURITY.md', 'docs/public-vs-private-boundary.md', 'README.md', 'scripts/secret-scan.mjs']);
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (['.git', 'node_modules'].includes(entry.name)) continue;
      walk(full);
      continue;
    }
    if (forbiddenNames.some((re) => re.test(entry.name)) && !allowSecretDocs.has(rel)) {
      failures.push(`suspicious filename: ${rel}`);
    }
    if (!/\.(md|js|json|html|svg|yml|yaml|txt|css)$/i.test(entry.name)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const re of forbiddenText) {
      if (re.test(text)) failures.push(`forbidden text ${re} in ${rel}`);
    }
  }
}
walk(root);
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: root, message: 'Public showcase scan passed.' }, null, 2));
