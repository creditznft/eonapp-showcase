import { prepareDeployBundle, buildDeployManifest, copyDeployManifest, openDeployGuide } from './builder-deploy.js';

function clean(value = '', fallback = '') {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48) || 'eon-site';
}

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildParagraphs(value = '') {
  return String(value || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((part) => `<p>${escapeHtml(part)}</p>`)
    .join('\n');
}

function buildBullets(value = '') {
  const lines = String(value || '')
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
  return lines.length
    ? lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('\n')
    : '<li>High-trust delivery</li><li>Fast launch path</li><li>Browser-assisted promotion</li>';
}

export function normalizeCreatorLaunchInput(input = {}) {
  const projectName = clean(input.projectName, 'My Business Launch');
  const offer = clean(input.offer, projectName);
  const audience = clean(input.audience, 'new customers');
  const summary = clean(input.summary, 'A simple launch-ready business site with clear positioning, offer copy, and a next-step CTA.');
  const cta = clean(input.cta, 'Start now');
  const route = clean(input.route, '/');
  const target = clean(input.target, 'cloudflare-pages');
  const faq = clean(input.faq, 'What do you offer?\nHow fast can I get started?\nWhat should I do next?');
  return {
    projectName,
    siteSlug: slugify(projectName),
    offer,
    audience,
    summary,
    cta,
    route: route.startsWith('/') ? route : `/${route}`,
    target: target === 'github-pages' ? 'github-pages' : 'cloudflare-pages',
    faq
  };
}

export function buildCreatorLaunchPreview(input = {}) {
  const ctx = normalizeCreatorLaunchInput(input);
  return [
    `Project: ${ctx.projectName}`,
    `Target: ${ctx.target === 'github-pages' ? 'GitHub Pages' : 'Cloudflare Pages'}`,
    `Route: ${ctx.route}`,
    `Primary CTA: ${ctx.cta}`,
    `Audience: ${ctx.audience}`,
    `Offer: ${ctx.offer}`
  ];
}

export function buildStarterLandingBundle(input = {}) {
  const ctx = normalizeCreatorLaunchInput(input);
  const faqItems = String(ctx.faq || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => `<details><summary>${escapeHtml(line)}</summary><p>${escapeHtml(ctx.summary)}</p></details>`)
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(ctx.projectName)}</title>
  <meta name="description" content="${escapeHtml(ctx.summary)}" />
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <main class="site-shell">
    <section class="hero">
      <span class="eyebrow">Built with EONAPP</span>
      <h1>${escapeHtml(ctx.projectName)}</h1>
      <p class="hero-copy">${escapeHtml(ctx.summary)}</p>
      <div class="hero-meta">
        <span>Offer: ${escapeHtml(ctx.offer)}</span>
        <span>Audience: ${escapeHtml(ctx.audience)}</span>
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#contact">${escapeHtml(ctx.cta)}</a>
        <a class="btn btn-secondary" href="#offer">See the offer</a>
      </div>
    </section>

    <section id="offer" class="card-grid">
      <article class="card">
        <h2>What you get</h2>
        ${buildParagraphs(ctx.summary)}
      </article>
      <article class="card">
        <h2>Why this launch is fast</h2>
        <ul>${buildBullets(ctx.summary)}</ul>
      </article>
    </section>

    <section class="card-grid">
      <article class="card">
        <h2>Launch-ready copy</h2>
        <p>${escapeHtml(ctx.offer)}</p>
        <p>${escapeHtml(ctx.audience)}</p>
      </article>
      <article class="card">
        <h2>FAQ starter</h2>
        ${faqItems}
      </article>
    </section>

    <section id="contact" class="card contact-card">
      <h2>Ready to move?</h2>
      <p>${escapeHtml(ctx.summary)}</p>
      <button id="primary-cta" class="btn btn-primary" type="button">${escapeHtml(ctx.cta)}</button>
      <p class="fine-print">This starter site was prepared as a deploy handoff bundle for ${ctx.target === 'github-pages' ? 'GitHub Pages' : 'Cloudflare Pages'}.</p>
    </section>
  </main>
  <script src="./script.js"></script>
</body>
</html>`;

  const css = `:root{
  --bg:#07111f;
  --card:#0f172a;
  --text:#e5eefc;
  --muted:#93a4bf;
  --line:rgba(148,163,184,.22);
  --accent:#38bdf8;
  --accent-2:#22c55e;
}
*{box-sizing:border-box}
body{
  margin:0;
  min-height:100vh;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:radial-gradient(circle at top,#12243f 0%,#07111f 55%,#020617 100%);
  color:var(--text);
}
.site-shell{width:min(1100px,92vw);margin:0 auto;padding:48px 0 64px}
.hero,.card{
  border:1px solid var(--line);
  background:linear-gradient(180deg,rgba(15,23,42,.95),rgba(2,6,23,.95));
  border-radius:24px;
  box-shadow:0 20px 50px rgba(2,6,23,.35);
}
.hero{padding:40px}
.eyebrow{display:inline-flex;padding:.35rem .65rem;border-radius:999px;background:rgba(56,189,248,.14);color:#7dd3fc;font-size:.78rem;font-weight:700;letter-spacing:.02em}
.hero h1{margin:16px 0 12px;font-size:clamp(2rem,4vw,3.5rem);line-height:1.05}
.hero-copy{max-width:740px;font-size:1.06rem;color:var(--muted);line-height:1.7}
.hero-meta{display:flex;flex-wrap:wrap;gap:.75rem;margin:16px 0 0;color:#cbd5e1;font-size:.95rem}
.hero-actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:24px}
.btn{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:46px;padding:0 18px;border-radius:14px;border:1px solid transparent;
  text-decoration:none;font-weight:700;cursor:pointer;
}
.btn-primary{background:linear-gradient(135deg,var(--accent),#2563eb);color:#fff}
.btn-secondary{background:transparent;border-color:var(--line);color:var(--text)}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:18px}
.card{padding:24px}
.card h2{margin:0 0 12px;font-size:1.1rem}
.card p,.card li,.card summary,.fine-print{color:var(--muted);line-height:1.7}
.card ul{margin:0;padding-left:1.15rem}
details+details{margin-top:.65rem}
.contact-card{margin-top:18px}
@media (max-width:700px){
  .site-shell{width:min(94vw,1100px);padding:24px 0 40px}
  .hero{padding:24px}
}`;
  const js = `const btn = document.getElementById('primary-cta');
if (btn) {
  btn.addEventListener('click', () => {
    alert('This starter site is ready for ${ctx.target === 'github-pages' ? 'GitHub Pages' : 'Cloudflare Pages'} handoff. Connect your contact or booking flow next.');
  });
}`;
  return { ctx, html, css, js };
}

export async function prepareCreatorLaunchHandoff(input = {}) {
  const { ctx, html, css, js } = buildStarterLandingBundle(input);
  return prepareDeployBundle({
    projectName: ctx.projectName,
    target: ctx.target,
    route: ctx.route,
    html,
    css,
    js
  });
}

export async function copyCreatorLaunchHandoffManifest(input = {}) {
  const { ctx, html, css, js } = buildStarterLandingBundle(input);
  const manifest = buildDeployManifest({
    projectName: ctx.projectName,
    target: ctx.target,
    route: ctx.route,
    html,
    css,
    js
  });
  await copyDeployManifest(manifest);
  return manifest;
}

export { openDeployGuide };
