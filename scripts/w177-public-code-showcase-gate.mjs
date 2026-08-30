import fs from 'node:fs';

const checks = [
  ['realm-code-preview safe boundary', 'assets/js/realm3d/realm-code-preview.js', /Public GitHub showcase boundary|public GitHub showcase boundaries/i],
  ['realm-code-preview sponsor boost contract', 'assets/js/realm3d/realm-code-preview.js', /Sponsor Boost safe monetization contract/i],
  ['realm-code-preview command operator snippet', 'assets/js/realm3d/realm-code-preview.js', /EONBOT command operator contract/i],
  ['trust showcase sponsor boost module', 'assets/js/trust-showcase-page.js', /Sponsor Boost safety/i],
  ['trust showcase eonbot module', 'assets/js/trust-showcase-page.js', /EONBOT command operator/i],
  ['trust showcase mobile UX module', 'assets/js/trust-showcase-page.js', /Mobile game UX guard/i],
  ['private source disclaimer', 'assets/js/realm3d/realm-code-preview.js', /not private source|private source/i]
];

const failures = [];
for (const [label, file, pattern] of checks) {
  const text = fs.readFileSync(file, 'utf8');
  if (!pattern.test(text)) failures.push(`${label} failed in ${file}`);
}

const source = fs.readFileSync('assets/js/realm3d/realm-code-preview.js', 'utf8') + fs.readFileSync('assets/js/trust-showcase-page.js', 'utf8');
for (const forbidden of [/TELEGRAM_BOT_TOKEN/i, /NOWPAYMENTS_IPN_SECRET/i, /AD_REWARD_POSTBACK_SECRET/i, /FILEBASE_SECRET/i, /PRIVATE_KEY/i]) {
  if (forbidden.test(source)) failures.push(`forbidden secret-looking token exposed: ${forbidden}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, wave: 'W177', checks: checks.length, message: 'Public Code Showcase and in-app trust explorer are curated and safe.' }, null, 2));
