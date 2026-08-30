import { showToast } from './share.js';

const DEPLOY_GUIDE_PATH = '/docs/CLOUDFLARE_GITHUB_CONNECTION_GUIDE_2026-05-04.md';

/**
 * @param {string} value
 * @returns {string}
 */
function slugify(value = '') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  return slug || 'eon-site';
}

/**
 * @param {string} filename
 * @param {string} text
 * @param {string} [type='text/plain']
 */
function downloadTextFile(filename, text, type = 'text/plain') {
  const blob = new Blob([String(text ?? '')], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeBundleText(value = '') {
  return String(value || '').trim();
}

export function verifyDeployBundle(/** @type {any} */ {
  manifest = null,
  html = '',
  css = '',
  js = ''
} = {}) {
  const files = Array.isArray(manifest?.files) ? manifest.files : [];
  const expected = ['index.html', 'style.css', 'script.js'];
  const bundleText = `${html}\n${css}\n${js}`;
  const forbidden = /(credit card|cvv|seed phrase|private key|wallet seed|social security|ssn)/i;
  const checks = [
    {
      name: 'Bundle assets exist',
      ok: Boolean(normalizeBundleText(html)),
      detail: 'index.html is populated.'
    },
    {
      name: 'Manifest file list matches builder output',
      ok: expected.every((file) => files.some((/** @type {any} */ entry) => entry?.path === file)) && files.length >= 3,
      detail: `Files listed: ${files.map((/** @type {any} */ file) => file?.path).filter(Boolean).join(', ') || 'none'}.`
    },
    {
      name: 'Route and target are present',
      ok: Boolean(normalizeBundleText(manifest?.route)) && Boolean(normalizeBundleText(manifest?.target)),
      detail: `Route: ${manifest?.route || '/'} · Target: ${manifest?.target || 'unknown'}.`
    },
    {
      name: 'Verification copy is human-review ready',
      ok: String(manifest?.verification?.status || '').toLowerCase() === 'ready-for-human-review',
      detail: 'Manifest is marked ready for human review.'
    },
    {
      name: 'No payment or identity secrets in bundle',
      ok: !forbidden.test(bundleText),
      detail: 'No obvious payment, secret, or identity material found in the bundle.'
    }
  ];

  const ok = checks.every((check) => check.ok);
  return {
    ok,
    generatedAt: new Date().toISOString(),
    summary: ok ? 'Deploy bundle passed the browser verifier.' : 'Deploy bundle needs review before handoff.',
    checks
  };
}

export function buildDeployVerificationReadout(/** @type {any} */ verification, /** @type {any} */ manifest) {
  const lines = [
    '# EON Builder Deploy Verification',
    '',
    `Project: ${manifest?.projectName || 'My Project'}`,
    `Target: ${manifest?.handoff?.mode === 'github-pages' ? 'GitHub Pages' : 'Cloudflare Pages'}`,
    `Status: ${verification?.ok ? 'PASS' : 'REVIEW NEEDED'}`,
    `Generated: ${verification?.generatedAt || new Date().toISOString()}`,
    '',
    '## Checks'
  ];
  (verification?.checks || []).forEach((/** @type {any} */ check) => {
    lines.push(`- [${check.ok ? 'x' : ' '}] ${check.name}: ${check.detail || ''}`.trimEnd());
  });
  return lines.join('\n');
}

export function buildDeployManifest(/** @type {any} */ {
  projectName = 'My Project',
  target = 'cloudflare-pages',
  route = '/',
  html = '',
  css = '',
  js = ''
} = {}) {
  const siteSlug = slugify(projectName);
  const generatedAt = new Date().toISOString();
  const files = [
    { path: 'index.html', bytes: String(html || '').length, type: 'text/html' },
    { path: 'style.css', bytes: String(css || '').length, type: 'text/css' },
    { path: 'script.js', bytes: String(js || '').length, type: 'text/javascript' }
  ];

  return {
    kind: 'eon-builder-deploy-manifest',
    version: 1,
    projectName: String(projectName || 'My Project').trim(),
    siteSlug,
    target,
    route: String(route || '/').trim() || '/',
    generatedAt,
    verification: {
      status: 'ready-for-human-review',
      checks: [
        'HTML, CSS, and JS files are bundled as separate deploy assets.',
        'The manifest includes a route, target, and generation timestamp.',
        'The README explains the next delivery step for the chosen rail.',
        'No card details or root identity material are included.'
      ]
    },
    files,
    handoff: {
      guidePath: DEPLOY_GUIDE_PATH,
      mode: target === 'github-pages' ? 'github-pages' : 'cloudflare-pages',
      notes: [
        'This bundle was prepared inside EON Builder.',
        'The next step is to upload or connect the files through the chosen delivery rail.',
        'Card details are never part of this flow.'
      ]
    }
  };
}

export function buildDeployReadme(/** @type {any} */ manifest) {
  const target = manifest?.handoff?.mode === 'github-pages' ? 'GitHub Pages' : 'Cloudflare Pages';
  return [
    '# EON Builder Deploy Bundle',
    '',
    `Project: ${manifest?.projectName || 'My Project'}`,
    `Target: ${target}`,
    `Route: ${manifest?.route || '/'}`,
    `Generated: ${manifest?.generatedAt || new Date().toISOString()}`,
    '',
    '## Next steps',
    '1. Open the deploy guide.',
    '2. Connect the chosen delivery rail.',
    '3. Upload or sync the generated files.',
    '4. Confirm the live URL in the browser cockpit.',
    '',
    '## Files included',
    ...(Array.isArray(manifest?.files) ? manifest.files.map((/** @type {any} */ file) => `- ${file.path} (${file.bytes} bytes)`) : []),
    '',
    '## Notes',
    '- EONAPP keeps the root identity decentralized.',
    '- This bundle is a browser-native deploy handoff, not a central login dependency.',
    '- If you stored tokens in Vault, use them only in the chosen provider checkout or upload flow.'
  ].join('\n');
}

export function buildDeployTestPlan(/** @type {any} */ manifest) {
  return [
    '# EON Builder Deploy Test Plan',
    '',
    `Project: ${manifest?.projectName || 'My Project'}`,
    `Route: ${manifest?.route || '/'}`,
    '',
    '## Smoke checks',
    '- Confirm the homepage loads without a console error.',
    '- Confirm CSS is applied and the primary CTA is visible.',
    '- Confirm the main nav links resolve to the intended routes.',
    '- Confirm the generated bundle still matches the manifest file list.',
    '',
    '## Human verifier pass',
    '- Review the deploy preview visually before publishing.',
    '- Open the README and confirm the chosen delivery rail.',
    '- Keep the deploy receipt in Vault after the handoff.'
  ].join('\n');
}

export async function prepareDeployBundle(/** @type {any} */ options = {}) {
  const manifest = buildDeployManifest(options);
  const html = String(options.html || '');
  const css = String(options.css || '');
  const js = String(options.js || '');
  const readme = buildDeployReadme(manifest);
  const testPlan = buildDeployTestPlan(manifest);
  const verification = verifyDeployBundle({ manifest, html, css, js });
  const verificationReadout = buildDeployVerificationReadout(verification, manifest);
  const prefix = manifest.siteSlug;

  downloadTextFile(`${prefix}.index.html`, html, 'text/html');
  downloadTextFile(`${prefix}.style.css`, css, 'text/css');
  downloadTextFile(`${prefix}.script.js`, js, 'text/javascript');
  downloadTextFile(`${prefix}.deploy-manifest.json`, JSON.stringify(manifest, null, 2), 'application/json');
  downloadTextFile(`${prefix}.DEPLOY-README.md`, readme, 'text/markdown');
  downloadTextFile(`${prefix}.TEST-PLAN.md`, testPlan, 'text/markdown');
  downloadTextFile(`${prefix}.VERIFICATION.md`, verificationReadout, 'text/markdown');

  showToast(`Prepared ${manifest.projectName} deploy bundle.`, verification.ok ? 'success' : 'warning');
  return { manifest, readme, testPlan, verification, verificationReadout };
}

export async function copyDeployManifest(/** @type {any} */ manifest) {
  const text = JSON.stringify(manifest || {}, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    showToast('Deploy manifest copied.', 'success');
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    showToast(ok ? 'Deploy manifest copied.' : 'Could not copy deploy manifest.', ok ? 'success' : 'error');
    return ok;
  }
}

export function openDeployGuide() {
  window.open(DEPLOY_GUIDE_PATH, '_blank', 'noopener,noreferrer');
}
