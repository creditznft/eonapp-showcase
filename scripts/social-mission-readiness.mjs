import fs from 'node:fs';
const required = ['assets/js/social/social-mission-engine.js','assets/js/social/social-platform-adapters.js','assets/js/social/x-public-proof.js','assets/js/social/generic-public-proof.js','assets/js/social/social-mission-widget.js','functions/api/social/verify-public-post.js','assets/css/social-missions.css'];
const errors=[];
for (const file of required) if (!fs.existsSync(file)) errors.push(`missing ${file}`);
const verifier=fs.readFileSync('functions/api/social/verify-public-post.js','utf8');
for (const needle of ['publish.twitter.com/oembed','redirect: \'error\'','ALLOWED_X_HOSTS','MAX_BODY_BYTES','bad-signature','pending_manual']) if (!verifier.includes(needle)) errors.push(`public verifier missing ${needle}`);
if (/api\.x\.com|oauth|bearer[_-]?token/i.test(verifier)) errors.push('X API/OAuth dependency detected');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('W65 social mission readiness: PASS (X intent/oEmbed, SSRF allowlist, no X API/OAuth).');
