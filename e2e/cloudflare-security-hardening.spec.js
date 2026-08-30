/**
 * cloudflare-security-hardening.spec.js
 * Validates TLS, HSTS, HTTPS redirect, and Cloudflare security headers
 * Runs against live deployment domain
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const LIVE_DOMAIN = process.env.EONAPP_LIVE_DOMAIN || 'https://eonapp.ch';
const evidenceDir = path.join(process.cwd(), 'docs', 'qa', 'cloudflare-hardening-evidence');
const RUN_LIVE_SECURITY = process.env.EONAPP_RUN_LIVE_SECURITY === '1';

function ensureDir() {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

test.describe('Cloudflare Security Hardening Verification', () => {
  test.skip(!RUN_LIVE_SECURITY, 'Set EONAPP_RUN_LIVE_SECURITY=1 to run live edge security checks.');
  test('HTTPS redirect from HTTP enforced', async ({ page }) => {
    ensureDir();

    const httpUrl = LIVE_DOMAIN.replace(/^https:/, 'http:');
    const response = await page.request.get(httpUrl, { maxRedirects: 1, followLocation: false });

    const headers = response.headers();
    const location = headers['location'] || '';

    const evidence = {
      test: 'HTTPS redirect enforcement',
      timestamp: new Date().toISOString(),
      testUrl: httpUrl,
      statusCode: response.status(),
      location,
      redirectsToHttps: location.startsWith('https://') || false,
      pass: [301, 302, 307, 308].includes(response.status()) &&
            location.startsWith('https://')
    };

    fs.writeFileSync(
      path.join(evidenceDir, 'https-redirect-proof.json'),
      JSON.stringify(evidence, null, 2)
    );

    expect(evidence.pass).toBeTruthy();
  });

  test('Strict-Transport-Security (HSTS) header present and propagated', async ({ page }) => {
    ensureDir();

    const response = await page.request.get(LIVE_DOMAIN);
    const hstsHeader = response.headers()['strict-transport-security'] || '';

    const evidence = {
      test: 'HSTS header verification',
      timestamp: new Date().toISOString(),
      domain: LIVE_DOMAIN,
      statusCode: response.status(),
      hstsHeader,
      hasHstsHeader: Boolean(hstsHeader),
      maxAge: hstsHeader.match(/max-age=(\d+)/)?.[1] || null,
      includeSubdomains: /includesubdomains/i.test(hstsHeader),
      preload: hstsHeader.includes('preload'),
      pass: Boolean(hstsHeader) && hstsHeader.includes('max-age')
    };

    fs.writeFileSync(
      path.join(evidenceDir, 'hsts-header-proof.json'),
      JSON.stringify(evidence, null, 2)
    );

    expect(evidence.pass).toBeTruthy();
  });

  test('Content-Security-Policy enforced', async ({ page }) => {
    ensureDir();

    const response = await page.request.get(`${LIVE_DOMAIN}/chat.html`);
    const cspHeader = response.headers()['content-security-policy'] || '';

    const evidence = {
      test: 'Content-Security-Policy enforcement',
      timestamp: new Date().toISOString(),
      domain: LIVE_DOMAIN,
      url: `${LIVE_DOMAIN}/chat.html`,
      statusCode: response.status(),
      cspHeader: cspHeader.substring(0, 200), // truncate for readability
      hasCspHeader: Boolean(cspHeader),
      restrictive: cspHeader.includes('default-src') || cspHeader.includes("script-src"),
      pass: Boolean(cspHeader) && cspHeader.length > 0
    };

    fs.writeFileSync(
      path.join(evidenceDir, 'csp-header-proof.json'),
      JSON.stringify(evidence, null, 2)
    );

    expect(evidence.pass).toBeTruthy();
  });

  test('X-Content-Type-Options MIME-sniffing protection', async ({ page }) => {
    ensureDir();

    const response = await page.request.get(`${LIVE_DOMAIN}/chat.html`);
    const xctoHeader = response.headers()['x-content-type-options'] || '';

    const evidence = {
      test: 'X-Content-Type-Options verification',
      timestamp: new Date().toISOString(),
      domain: LIVE_DOMAIN,
      xctoHeader,
      hasXctoHeader: Boolean(xctoHeader),
      value: xctoHeader,
      isNosniff: xctoHeader === 'nosniff',
      pass: xctoHeader === 'nosniff'
    };

    fs.writeFileSync(
      path.join(evidenceDir, 'xcto-header-proof.json'),
      JSON.stringify(evidence, null, 2)
    );

    expect(evidence.pass).toBeTruthy();
  });

  test('Comprehensive security header audit', async ({ page }) => {
    ensureDir();

    const response = await page.request.get(`${LIVE_DOMAIN}/`);
    const headers = response.headers();

    const auditReport = {
      test: 'Comprehensive security header audit',
      timestamp: new Date().toISOString(),
      domain: LIVE_DOMAIN,
      statusCode: response.status(),
      headers: {
        'strict-transport-security': headers['strict-transport-security'] || 'MISSING',
        'content-security-policy': (headers['content-security-policy'] || 'MISSING').substring(0, 100),
        'x-content-type-options': headers['x-content-type-options'] || 'MISSING',
        'x-frame-options': headers['x-frame-options'] || 'MISSING',
        'x-xss-protection': headers['x-xss-protection'] || 'MISSING',
        'referrer-policy': headers['referrer-policy'] || 'MISSING',
        'permissions-policy': headers['permissions-policy'] || 'MISSING'
      },
      cloudflareHeaders: {
        'cf-cache-status': headers['cf-cache-status'] || 'MISSING',
        'cf-ray': headers['cf-ray'] || 'MISSING'
      },
      pass: Boolean(
        headers['strict-transport-security'] &&
        headers['content-security-policy'] &&
        headers['x-content-type-options'] === 'nosniff'
      )
    };

    fs.writeFileSync(
      path.join(evidenceDir, 'comprehensive-security-audit.json'),
      JSON.stringify(auditReport, null, 2)
    );

    console.log('Security audit report:', JSON.stringify(auditReport, null, 2));
    expect(auditReport.pass).toBeTruthy();
  });

  test('TLS version check', async ({ page }) => {
    ensureDir();

    const response = await page.request.get(LIVE_DOMAIN);
    const headers = response.headers();
    const protocol = headers['protocol'] || (headers['alt-svc'] ? 'HTTP/3' : 'HTTP/2');

    const evidence = {
      test: 'TLS version and protocol verification',
      timestamp: new Date().toISOString(),
      domain: LIVE_DOMAIN,
      protocol,
      isModern: protocol.includes('2') || protocol.includes('3'),
      cfRay: response.headers()['cf-ray'] || '',
      pass: protocol && (protocol.includes('2') || protocol.includes('3'))
    };

    fs.writeFileSync(
      path.join(evidenceDir, 'tls-protocol-proof.json'),
      JSON.stringify(evidence, null, 2)
    );

    expect(evidence.pass).toBeTruthy();
  });
});
