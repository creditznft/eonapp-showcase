import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
const errors = [];
const headers = read('_headers');
const publicHeaders = read('public/_headers');
if (headers !== publicHeaders) errors.push('_headers and public/_headers differ');
for (const needle of [
  "script-src-attr 'none'",
  'Cross-Origin-Resource-Policy: same-origin',
  'Origin-Agent-Cluster: ?1',
  'X-DNS-Prefetch-Control: off',
  'Strict-Transport-Security:',
  'report-uri /csp-report'
]) if (!headers.includes(needle)) errors.push(`missing security header: ${needle}`);
if (/monetag|propeller|libtl/i.test(headers)) errors.push('inactive ad provider host appears in CSP headers');
const browser = read('assets/js/eon-browser-page.js');
if (!/(?:sandbox\s*=\s*|setAttribute\(\s*['\"]sandbox['\"]\s*,\s*)['\"]allow-scripts allow-forms allow-popups['\"]/i.test(browser)) errors.push('browser iframe sandbox must omit allow-same-origin');
if (/sandbox\s*=\s*['\"][^'\"]*allow-same-origin/i.test(browser)) errors.push('browser iframe sandbox contains allow-same-origin');
if (!/referrerPolicy\s*=\s*['\"]no-referrer['\"]/i.test(browser)) errors.push('browser iframe must use no-referrer');
const csp = read('functions/csp-report.js');
for (const needle of ['MAX_REPORT_BYTES = 12 * 1024', 'redactUrl', 'redactOrigin', 'documentPath', 'blockedOrigin']) if (!csp.includes(needle)) errors.push(`CSP endpoint missing ${needle}`);
if (/request\.headers\.get\(['\"]cookie/i.test(csp) || /request\.headers\.get\(['\"]authorization/i.test(csp)) errors.push('CSP endpoint reads sensitive request headers');
const telemetry = read('assets/js/utils/privacy-telemetry.js');
for (const needle of ['stripsQueryAndFragment: true', 'stripsCredentialLikeValues: true', 'SENSITIVE_ASSIGNMENT_PATTERN']) if (!telemetry.includes(needle)) errors.push(`telemetry privacy contract missing ${needle}`);
for (const file of ['privacy.html', 'terms.html', 'legal.html', 'support.html']) if (!fs.existsSync(file)) errors.push(`missing trust surface ${file}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('W214 security, CSP, telemetry, iframe and trust gate: PASS');
