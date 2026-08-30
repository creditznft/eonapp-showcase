/**
 * W648 — EON Forge AI Developer Workspace.
 * Extends the W387 local integrity and change-review baseline.
 *
 * Forge remains local-first. Provider requests run only in the trusted parent
 * page after explicit consent. Untrusted model output becomes an isolated,
 * request-bound proposal; it cannot mutate saved files until a person reviews
 * and applies it. The restricted preview never receives Vault keys or network.
 */

import { writeEonOutputShareHandoff } from '../share/eon-output-share-handoff.js';
import { consumeEonHandoffFromLocation, removeEonHandoffQuery } from '../contracts/navigation/eon-handoff-authority.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import { EON_PROJECT_REGISTRY_STORAGE_KEY, canonicalProjectId, registerProjectSource, removeProjectSource } from '../projects/eon-project-registry.js';
import { evaluateEonCapacity } from '../storage/eon-capacity-authority.js';
import { captureEonStorageSnapshot, restoreEonStorageSnapshot } from '../storage/eon-storage-transaction.js';
import { getForgeAiReadiness, runForgeAiRequest } from './forge-ai-controller.js';
import { forgeAiActionOptions, getForgeAiAction } from './forge-ai-actions.js';
import { renderEonForgeNexusStage } from './eon-forge-nexus-stage.js';
import { renderEonPremiumCapabilityPreview } from '../capabilities/eon-premium-preview-surface.js';
import { bindForgeGitHubPublishWorkspace, renderForgeGitHubPublishWorkspace } from './forge-github-publish-workspace.js';
import {
  FORGE_AI_ALLOWED_FILES,
  buildForgeAiDiffWindow,
  forgeAiContextSummary,
  forgeAiFingerprint,
  mergeForgeAiChanges
} from './forge-ai-protocol.js';

const root = typeof document === 'undefined' ? null : document.getElementById('eon-forge-root');
const STORE_KEY = 'eon:forge:projects:v1';
const ACTIVE_KEY = 'eon:forge:active-project:v1';
const PENDING_BRIEF_KEY = 'eon:forge:pending-brief:v1';
const MAX_PROJECTS = 24;
const MAX_SNAPSHOTS = 12;
const MAX_RECEIPTS = 12;
const MAX_LOCAL_ASSETS = 3;
const MAX_ASSET_BYTES = 160_000;
const MAX_PROJECT_BYTES = 600_000;
const CORE_FILE_ORDER = Object.freeze(['index.html', 'style.css', 'script.js', 'README.md']);
const FILE_ORDER = CORE_FILE_ORDER;
const PREVIEW_CSP = "default-src 'none'; base-uri 'none'; connect-src 'none'; font-src data:; form-action 'none'; frame-src 'none'; img-src data: blob:; media-src data: blob:; object-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'";
const ALLOWED_IMAGE_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);
const ALLOWED_SOURCE_FILES = Object.freeze(['index.html', 'style.css', 'script.js', 'README.md']);

const STYLE_PROFILES = Object.freeze({
  graphite: Object.freeze({ accent: '#6d5efc', accent2: '#b0a8ff', ink: '#111217', muted: '#5e6472', canvas: '#f6f5f3', surface: '#ffffff' }),
  ocean: Object.freeze({ accent: '#1266d6', accent2: '#57b0ff', ink: '#071726', muted: '#52677d', canvas: '#f4f9ff', surface: '#ffffff' }),
  ember: Object.freeze({ accent: '#ba4e22', accent2: '#e79552', ink: '#251611', muted: '#785d52', canvas: '#fff7f1', surface: '#fffdfb' }),
  moss: Object.freeze({ accent: '#28715c', accent2: '#69ae8d', ink: '#102019', muted: '#60756a', canvas: '#f5faf6', surface: '#ffffff' })
});

const AI_ACTION_PRESETS = Object.freeze([
  Object.freeze({ id: 'premium', action: 'restyle', label: 'Premium redesign', instruction: 'Give this project a distinctive premium visual system, stronger hierarchy, more authored layout, refined typography, restrained motion, and excellent mobile composition. Keep all existing useful behavior.' }),
  Object.freeze({ id: 'mobile', action: 'improve', label: 'Mobile polish', instruction: 'Audit and improve the complete mobile experience: responsive layout, touch targets, navigation, readable type, safe spacing, reduced motion, and interaction states. Preserve desktop quality.' }),
  Object.freeze({ id: 'accessibility', action: 'accessibility', label: 'Accessibility', instruction: 'Improve semantic structure, keyboard navigation, labels, focus visibility, contrast, reduced-motion behavior, status messaging, and screen-reader clarity without flattening the visual design.' }),
  Object.freeze({ id: 'conversion', action: 'improve', label: 'Conversion pass', instruction: 'Strengthen the page goal, headline, proof, trust, objection handling, calls to action, and mobile conversion flow. Do not invent testimonials, statistics, clients, or guarantees.' }),
  Object.freeze({ id: 'behavior', action: 'feature', label: 'App behavior', instruction: 'Upgrade the client-side behavior with useful state, clear empty/error/success states, resilient event handling, keyboard support, and visible feedback. Keep it network-free and dependency-free.' }),
  Object.freeze({ id: 'repair', action: 'fix', label: 'Fix detected issues', instruction: 'Repair all current source-check issues and warnings while preserving the project intent, visual identity, content, and working behavior. Do not add remote dependencies or network requests.' })
]);

let lastForgeCapacityDecision = null;

const workspaceState = {
  projectId: '',
  activeFile: 'index.html',
  activeView: 'preview',
  previewDevice: 'desktop',
  draftFiles: null,
  quality: null,
  importReview: null,
  aiProposal: null,
  aiBaseFiles: null,
  aiStatus: 'idle',
  aiError: '',
  aiRequestId: '',
  aiCancelToken: null,
  aiAbortController: null,
  aiAction: 'improve',
  aiSelectedPaths: [...FORGE_AI_ALLOWED_FILES],
  aiInstruction: '',
  aiReviewFile: '',
  previewTimer: 0,
  incomingHandoff: null,
  status: ''
};

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function renderIncomingHandoff() {
  const incoming = workspaceState.incomingHandoff;
  if (!incoming?.ok || !incoming.handoff) return '';
  const handoff = incoming.handoff;
  const mediaKind = cleanText(handoff.payload?.mediaKind || handoff.payload?.modeId || 'reference', 40);
  const digest = cleanText(handoff.payloadDigest || '', 80).slice(0, 12);
  return `<section class="eon-forge-panel eon-forge-incoming-handoff" data-eon-forge-incoming-handoff="${escapeHtml(handoff.kind)}"><p class="eon-forge-kicker">Incoming reference</p><h2>${escapeHtml(handoff.reference?.label || 'Continue in Forge')}</h2><p>${escapeHtml(mediaKind)} reference accepted from ${escapeHtml(handoff.sender?.id || 'EONAPP')}. The reference is review-only; no media body, private prompt, credential, project mutation, AI request, deployment, or publish action crossed this handoff.</p><small>Receipt ${escapeHtml(incoming.receipt?.receiptId || '')}${digest ? ` · digest ${escapeHtml(digest)}` : ''}</small></section>`;
}

function escapeScript(value = '') {
  return String(value ?? '').replace(/<\/script/gi, '<\\/script');
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanText(value = '', max = 1200) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function slugify(value = '') {
  const slug = String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);
  return slug || 'eon-forge-project';
}

function safeAssetPath(value = '') {
  const raw = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!/^assets\/[a-z0-9][a-z0-9._-]{0,95}$/i.test(raw)) return '';
  if (raw.includes('..')) return '';
  return raw;
}

function projectFileOrder(files = {}) {
  const assetPaths = Object.keys(files || {}).filter((path) => Boolean(safeAssetPath(path))).sort((left, right) => left.localeCompare(right));
  return [...CORE_FILE_ORDER, ...assetPaths];
}

function isImageAsset(path = '', value = '') {
  return Boolean(safeAssetPath(path) && /^data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,/i.test(String(value || '')));
}

function formatDate(value) {
  try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); } catch { return ''; }
}

function formatTime(value) {
  try { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value)); } catch { return ''; }
}

function formatBytes(value = 0) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 100) / 10} KB`;
  return `${Math.round(bytes / 100_000) / 10} MB`;
}

function uniqueId(prefix = 'forge') {
  try { return `${prefix}-${crypto.randomUUID()}`; } catch { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
}

function cloneFiles(files = {}) {
  const copy = {};
  for (const file of CORE_FILE_ORDER) copy[file] = String(files?.[file] || '');
  for (const file of Object.keys(files || {})) {
    if (safeAssetPath(file) && isImageAsset(file, files[file])) copy[file] = String(files[file]);
  }
  return copy;
}

function filesEqual(left = {}, right = {}) {
  const paths = new Set([...projectFileOrder(left), ...projectFileOrder(right)]);
  return [...paths].every((file) => String(left?.[file] || '') === String(right?.[file] || ''));
}

function fileBytes(files = {}) {
  return projectFileOrder(files).reduce((total, file) => total + new Blob([String(files?.[file] || '')]).size, 0);
}

function lineCount(source = '') {
  return Math.max(1, String(source || '').split('\n').length);
}

function lineNumbers(source = '') {
  return Array.from({ length: lineCount(source) }, (_item, index) => String(index + 1)).join('\n');
}

function snapshotFromFiles(files, label = 'Saved local revision', at = new Date().toISOString()) {
  return Object.freeze({ id: uniqueId('snapshot'), label: cleanText(label, 72) || 'Saved local revision', at, files: cloneFiles(files) });
}

function projectReadme({ title, brief, type }) {
  return `# ${title}\n\nCreated locally with EON Forge.\n\n## Project\n- Type: ${type || 'website'}\n- Storage: this browser until you explicitly export or back it up\n\n## Files\n- index.html — page structure\n- style.css — visual styling\n- script.js — browser behavior\n- assets/ — local image files you explicitly add\n\n## Safe next steps\n1. Preview the project inside Forge.\n2. Edit files and save a local revision.\n3. Run source checks.\n4. Review the local change receipt.\n5. Download your source when ready.\n\nGitHub publishing is optional and happens only after an explicit review branch, CI pass, and final publish approval. Local editing never publishes by itself.\n\n## Brief\n${brief || 'No written brief yet.'}\n`;
}

function normalizeReceipt(receipt, projectId = '') {
  if (!receipt || typeof receipt !== 'object' || !receipt.id) return null;
  const changedFiles = Array.isArray(receipt.changedFiles) ? receipt.changedFiles.slice(0, 24).map((entry) => ({
    path: safeAssetPath(entry?.path) || (CORE_FILE_ORDER.includes(entry?.path) ? entry.path : ''),
    added: Math.max(0, Number(entry?.added) || 0),
    removed: Math.max(0, Number(entry?.removed) || 0),
    bytes: Math.max(0, Number(entry?.bytes) || 0)
  })).filter((entry) => entry.path) : [];
  return {
    schema: receipt.schema === 'eon-forge-ai-change-receipt.v1' ? 'eon-forge-ai-change-receipt.v1' : 'eon-forge-local-change-receipt.v1',
    id: String(receipt.id),
    projectId: String(receipt.projectId || projectId),
    revisionId: String(receipt.revisionId || ''),
    savedAt: receipt.savedAt || new Date().toISOString(),
    changedFiles,
    checks: {
      errorCount: Math.max(0, Number(receipt?.checks?.errorCount) || 0),
      warningCount: Math.max(0, Number(receipt?.checks?.warningCount) || 0),
      totalBytes: Math.max(0, Number(receipt?.checks?.totalBytes) || 0)
    },
    origin: receipt.origin === 'ai-proposal' ? 'ai-proposal' : 'manual',
    ai: receipt.origin === 'ai-proposal' ? {
      requestId: cleanText(receipt?.ai?.requestId, 120),
      providerId: cleanText(receipt?.ai?.providerId, 48),
      model: cleanText(receipt?.ai?.model, 160),
      proposedAt: String(receipt?.ai?.proposedAt || ''),
      validation: receipt?.ai?.validation === 'passed' ? 'passed' : 'unknown'
    } : null,
    storage: 'local-browser-only'
  };
}

function normalizeProject(project) {
  if (!project || typeof project !== 'object' || !project.id || !project.files) return null;
  const title = cleanText(project.title, 72) || 'Untitled Forge project';
  const brief = cleanText(project.brief, 2200);
  const type = ['website', 'landing', 'portfolio', 'app'].includes(project.type) ? project.type : 'website';
  const style = Object.hasOwn(STYLE_PROFILES, project.style) ? project.style : 'graphite';
  const files = cloneFiles(project.files);
  if (!files['README.md']) files['README.md'] = projectReadme({ title, brief, type });
  const createdAt = project.createdAt || new Date().toISOString();
  const existingHistory = Array.isArray(project.history) ? project.history : [];
  const history = existingHistory
    .filter((snapshot) => snapshot && snapshot.files && snapshot.id)
    .map((snapshot) => ({ id: String(snapshot.id), label: cleanText(snapshot.label, 72) || 'Saved local revision', at: snapshot.at || createdAt, files: cloneFiles(snapshot.files) }));
  if (!history.length) history.push(snapshotFromFiles(files, 'Initial local project', createdAt));
  const receipts = (Array.isArray(project.receipts) ? project.receipts : []).map((receipt) => normalizeReceipt(receipt, project.id)).filter(Boolean);
  return {
    id: String(project.id), title, brief, type, style, files, history, receipts,
    lifecycleState: project.lifecycleState === 'archived' || project.archived === true ? 'archived' : 'active',
    createdAt, updatedAt: project.updatedAt || createdAt,
    schema: 'eon-forge-local-project.v3'
  };
}


function registerForgeProject(project = {}) {
  return registerProjectSource({
    namespace: 'forge',
    sourceId: project.id,
    projectId: canonicalProjectId('forge', project.id),
    storageKey: STORE_KEY,
    sourceSchema: project.schema || 'eon-forge-local-project.v3',
    relation: 'owner',
    title: project.title,
    summary: project.brief,
    operationalStatus: project.lifecycleState === 'archived' ? 'archived' : 'active',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    continueDestination: 'forge'
  }, { emit: false });
}

function readProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProject).filter(Boolean);
  } catch { return []; }
}

function writeProjects(projects) {
  try { const serialized = JSON.stringify(projects); localStorage.setItem(STORE_KEY, serialized); return localStorage.getItem(STORE_KEY) === serialized; } catch { return false; }
}

function readActiveId() {
  try { return localStorage.getItem(ACTIVE_KEY) || ''; } catch { return ''; }
}

function writeActiveId(id = '') {
  try { localStorage.setItem(ACTIVE_KEY, String(id || '')); } catch {}
}

function readPendingBrief() {
  try {
    const value = sessionStorage.getItem(PENDING_BRIEF_KEY) || '';
    sessionStorage.removeItem(PENDING_BRIEF_KEY);
    return cleanText(value, 2200);
  } catch { return ''; }
}

function inferTitle(brief = '', explicit = '') {
  const requested = cleanText(explicit, 72);
  if (requested) return requested;
  const short = cleanText(brief, 120).replace(/^(build|make|create|design)\s+(me\s+)?/i, '').replace(/[.!?].*$/, '').trim();
  if (!short) return 'New Website';
  const words = short.split(' ').slice(0, 7).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function inferHeadline(title = '', brief = '') {
  const concise = cleanText(brief, 160);
  if (concise) return concise.charAt(0).toUpperCase() + concise.slice(1);
  return `A clearer way to discover ${title}`;
}

function buildFiles({ title, brief, type = 'website', style = 'graphite' }) {
  const palette = STYLE_PROFILES[style] || STYLE_PROFILES.graphite;
  const safeTitle = escapeHtml(title);
  const safeHeadline = escapeHtml(inferHeadline(title, brief));
  const safeBrief = escapeHtml(cleanText(brief, 420) || 'A focused local starter project from EON Forge.');
  const typeLabel = escapeHtml({ landing: 'Landing page', portfolio: 'Portfolio', app: 'Local web app', website: 'Website' }[type] || 'Website');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${safeBrief}" />
  <title>${safeTitle}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="site-header">
    <a class="brand" href="#top">${safeTitle}</a>
    <button class="menu-button" type="button" data-menu-button aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav id="site-nav" class="site-nav" aria-label="Main navigation">
      <a href="#about">About</a>
      <a href="#highlights">Highlights</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <p class="eyebrow">${typeLabel} · Made with EON Forge</p>
      <h1 id="hero-title">${safeHeadline}</h1>
      <p class="hero-copy">${safeBrief}</p>
      <div class="hero-actions"><a class="button" href="#contact">Start a conversation</a><a class="text-link" href="#highlights">See what matters</a></div>
    </section>
    <section id="about" class="section split">
      <div><p class="eyebrow">A clear first version</p><h2>Give people a reason to stay.</h2></div>
      <p>Use this starter as a focused base. Replace the copy, add your real images, connect your own forms, and keep only the sections that help people understand what you offer.</p>
    </section>
    <section id="highlights" class="section">
      <p class="eyebrow">Highlights</p>
      <div class="cards">
        <article><span>01</span><h3>Clear purpose</h3><p>Start with one message that visitors understand immediately.</p></article>
        <article><span>02</span><h3>Useful detail</h3><p>Show the important proof, services, work, or next step without noise.</p></article>
        <article><span>03</span><h3>Simple action</h3><p>Make it easy for someone to contact you or continue exploring.</p></article>
      </div>
    </section>
    <section id="contact" class="section contact-panel">
      <div><p class="eyebrow">Next step</p><h2>Ready to make this yours?</h2><p>Replace this section with your contact method, booking link, waitlist, or product action.</p></div>
      <a class="button button-light" href="mailto:hello@example.com">Contact us</a>
    </section>
  </main>
  <footer>Built locally in EON Forge · Edit and export whenever you are ready.</footer>
  <script src="script.js"></script>
</body>
</html>`;
  const css = `:root { --accent:${palette.accent}; --accent-soft:${palette.accent2}; --ink:${palette.ink}; --muted:${palette.muted}; --canvas:${palette.canvas}; --surface:${palette.surface}; --line:color-mix(in srgb, var(--ink) 15%, transparent); }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; min-width:320px; color:var(--ink); background:var(--canvas); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.55; }
a { color:inherit; }
.site-header { width:min(1120px, calc(100% - 2rem)); margin:0 auto; min-height:4.75rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.brand { font-weight:850; letter-spacing:-.03em; text-decoration:none; }
.site-nav { display:flex; align-items:center; gap:1rem; }
.site-nav a, .text-link { color:var(--muted); font-size:.92rem; text-decoration:none; }
.site-nav a:hover, .text-link:hover { color:var(--accent); }
.menu-button { display:none; border:1px solid var(--line); border-radius:.55rem; background:var(--surface); color:var(--ink); padding:.45rem .65rem; font:inherit; }
.hero, .section { width:min(1120px, calc(100% - 2rem)); margin:0 auto; }
.hero { padding:clamp(4.8rem, 11vw, 8.5rem) 0 4rem; }
.eyebrow { margin:0 0 .75rem; color:var(--accent); font-size:.75rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
h1, h2, h3 { margin:0; letter-spacing:-.05em; line-height:1.02; }
h1 { max-width:13ch; font-size:clamp(3rem, 8vw, 6.6rem); }
h2 { max-width:15ch; font-size:clamp(2rem, 5vw, 3.8rem); }
h3 { font-size:1.25rem; }
.hero-copy { max-width:43rem; margin:1.25rem 0 0; color:var(--muted); font-size:clamp(1rem, 2vw, 1.2rem); }
.hero-actions { display:flex; flex-wrap:wrap; gap:.85rem; align-items:center; margin-top:1.75rem; }
.button { display:inline-flex; align-items:center; justify-content:center; min-height:2.9rem; padding:.66rem 1rem; border-radius:.7rem; background:var(--accent); color:#fff; font-weight:760; text-decoration:none; box-shadow:0 .65rem 1.8rem color-mix(in srgb, var(--accent) 25%, transparent); }
.button:hover { filter:brightness(1.06); transform:translateY(-1px); }
.section { padding:clamp(3.4rem, 8vw, 6.5rem) 0; border-top:1px solid var(--line); }
.split { display:grid; grid-template-columns:minmax(0, 1fr) minmax(16rem, .75fr); gap:2rem; }
.split > p { margin:0; color:var(--muted); font-size:1.05rem; }
.cards { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:1rem; margin-top:1.35rem; }
.cards article { min-height:13rem; padding:1.1rem; border:1px solid var(--line); border-radius:1rem; background:var(--surface); box-shadow:0 1rem 2.5rem color-mix(in srgb, var(--ink) 6%, transparent); }
.cards span { color:var(--accent); font-size:.75rem; font-weight:800; letter-spacing:.1em; }
.cards h3 { margin-top:1.75rem; }
.cards p { color:var(--muted); font-size:.92rem; }
.contact-panel { display:flex; align-items:end; justify-content:space-between; gap:1.5rem; padding:clamp(1.5rem, 4vw, 2.6rem); border:0; border-radius:1.2rem; background:var(--ink); color:var(--canvas); }
.contact-panel p:not(.eyebrow) { max-width:35rem; margin:.85rem 0 0; color:color-mix(in srgb, var(--canvas) 72%, transparent); }
.button-light { background:var(--canvas); color:var(--ink); white-space:nowrap; box-shadow:none; }
footer { width:min(1120px, calc(100% - 2rem)); margin:0 auto; padding:1.6rem 0 2.2rem; color:var(--muted); font-size:.8rem; }
@media (max-width:700px) { .site-header { position:relative; } .menu-button { display:inline-flex; } .site-nav { display:none; position:absolute; top:4rem; right:0; z-index:2; min-width:11rem; padding:.7rem; border:1px solid var(--line); border-radius:.8rem; background:var(--surface); box-shadow:0 1rem 2rem color-mix(in srgb, var(--ink) 15%, transparent); } .site-nav.is-open { display:grid; } .split, .cards { grid-template-columns:1fr; } .contact-panel { align-items:flex-start; flex-direction:column; } }
@media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } .button:hover { transform:none; } }`;
  const js = `const menuButton = document.querySelector('[data-menu-button]');
const nav = document.getElementById('site-nav');
menuButton?.addEventListener('click', () => {
  const next = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', next);
  menuButton.setAttribute('aria-expanded', String(next));
});
console.info('EON Forge starter loaded. Replace this script with your project behavior.');`;
  return { 'index.html': html, 'style.css': css, 'script.js': js, 'README.md': projectReadme({ title, brief, type }) };
}

function previewHtmlWithSafetyDocument(source = '') {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`;
  const withoutBase = String(source || '').replace(/<base\b[^>]*>/gi, '');
  if (/<head\b[^>]*>/i.test(withoutBase)) return withoutBase.replace(/<head\b[^>]*>/i, (opening) => `${opening}${meta}`);
  if (/<html\b[^>]*>/i.test(withoutBase)) return withoutBase.replace(/<html\b[^>]*>/i, (opening) => `${opening}<head>${meta}</head>`);
  return `<!doctype html><html lang="en"><head>${meta}</head><body>${withoutBase}</body></html>`;
}

function inlineLocalAssets(source = '', files = {}) {
  let output = String(source || '');
  for (const path of projectFileOrder(files).filter((file) => safeAssetPath(file) && isImageAsset(file, files[file]))) {
    output = output.replace(new RegExp(escapeRegex(path), 'g'), String(files[path]));
  }
  return output;
}

function composePreview(files) {
  const html = String(files?.['index.html'] || '');
  const css = String(files?.['style.css'] || '');
  const js = String(files?.['script.js'] || '');
  const combined = html
    .replace(/<link\s+rel=["']stylesheet["']\s+href=["']style\.css["']\s*\/?\s*>/i, `<style>${css}</style>`)
    .replace(/<script\s+src=["']script\.js["']\s*><\/script>/i, `<script>${escapeScript(js)}</script>`);
  return previewHtmlWithSafetyDocument(inlineLocalAssets(combined, files));
}

function forgeSaveFailureMessage(fallback = 'This browser could not save the local project. Check browser storage, then try again.') {
  return lastForgeCapacityDecision?.message || fallback;
}

function buildProject({ title = '', brief = '', type = 'website', style = 'graphite' } = {}) {
  const normalizedBrief = cleanText(brief, 2200);
  const projectTitle = inferTitle(normalizedBrief, title);
  const now = new Date().toISOString();
  const files = buildFiles({ title: projectTitle, brief: normalizedBrief, type, style });
  return {
    id: uniqueId(), title: projectTitle, brief: normalizedBrief,
    type: ['website', 'landing', 'portfolio', 'app'].includes(type) ? type : 'website',
    style: Object.hasOwn(STYLE_PROFILES, style) ? style : 'graphite',
    files,
    history: [snapshotFromFiles(files, 'Initial local project', now)],
    receipts: [],
    createdAt: now, updatedAt: now, schema: 'eon-forge-local-project.v3'
  };
}

function forgeProjectCapacityCounts(projects = []) {
  const totalCount = projects.length;
  const archivedCount = projects.filter((project) => project.lifecycleState === 'archived').length;
  return Object.freeze({ totalCount, archivedCount, activeCount: Math.max(0, totalCount - archivedCount) });
}

function forgeStorageTransaction() {
  return captureEonStorageSnapshot([STORE_KEY, ACTIVE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY]);
}

function saveProject(project) {
  const normalized = normalizeProject(project);
  lastForgeCapacityDecision = null;
  if (!normalized) return false;
  const projects = readProjects();
  const previous = projects.find((item) => item.id === normalized.id) || null;
  const reactivating = previous?.lifecycleState === 'archived' && normalized.lifecycleState === 'active';
  const existing = Boolean(previous) && !reactivating;
  const projectCapacity = evaluateEonCapacity({
    resourceId: 'forge-projects',
    ...forgeProjectCapacityCounts(projects),
    existing,
    requestedCount: normalized.lifecycleState === 'active' && (!previous || reactivating) ? 1 : 0,
    requestedTotalCount: previous ? 0 : 1
  });
  if (!projectCapacity.allowed) { lastForgeCapacityDecision = projectCapacity; return false; }
  if (normalized.history.length > MAX_SNAPSHOTS) {
    lastForgeCapacityDecision = evaluateEonCapacity({ resourceId: 'forge-snapshots', currentCount: normalized.history.length - 1, totalCount: normalized.history.length - 1 });
    return false;
  }
  if (normalized.receipts.length > MAX_RECEIPTS) {
    lastForgeCapacityDecision = evaluateEonCapacity({ resourceId: 'forge-receipts', currentCount: normalized.receipts.length - 1, totalCount: normalized.receipts.length - 1 });
    return false;
  }
  const transaction = forgeStorageTransaction();
  if (!transaction.ok) return false;
  const next = [normalized, ...projects.filter((item) => item.id !== normalized.id)];
  if (!writeProjects(next)) { restoreEonStorageSnapshot(transaction); return false; }
  writeActiveId(normalized.id);
  const registered = registerForgeProject(normalized);
  if (!registered.ok) {
    restoreEonStorageSnapshot(transaction);
    return false;
  }
  return true;
}

function deleteProject(id) {
  const projects = readProjects();
  const previousActiveId = readActiveId();
  const next = projects.filter((project) => project.id !== id);
  if (next.length === projects.length) return projects;
  const transaction = forgeStorageTransaction();
  if (!transaction.ok) return projects;
  if (!writeProjects(next)) { restoreEonStorageSnapshot(transaction); return projects; }
  if (previousActiveId === id) writeActiveId(next[0]?.id || '');
  const removed = removeProjectSource('forge', id, { emit: false });
  if (!removed.ok && removed.reason !== 'source-not-found') {
    restoreEonStorageSnapshot(transaction);
    return projects;
  }
  return next;
}

function setForgeProjectLifecycle(id = '', lifecycleState = 'active') {
  const project = getProjectById(id);
  if (!project) return false;
  const nextState = lifecycleState === 'archived' ? 'archived' : 'active';
  return saveProject({ ...project, lifecycleState: nextState, updatedAt: new Date().toISOString() });
}

function getProjectById(id = '') {
  const projects = readProjects();
  return projects.find((project) => project.id === id) || null;
}

function getActiveProject() {
  const projects = readProjects();
  const id = readActiveId();
  return projects.find((project) => project.id === id) || projects[0] || null;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  downloadBlob(filename, new Blob([String(text ?? '')], { type }));
}

function dataUrlToBlob(dataUrl = '') {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(String(dataUrl || ''));
  if (!match) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: match[1] });
  } catch { return null; }
}

function containsLikelySecret(files) {
  const source = Object.values(files || {}).join('\n');
  return /(sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed phrase|mnemonic|recovery phrase)\b\s*[:=])/i.test(source);
}

function braceBalance(source = '') {
  let balance = 0;
  for (const character of String(source || '')) {
    if (character === '{') balance += 1;
    if (character === '}') balance -= 1;
    if (balance < 0) return false;
  }
  return balance === 0;
}

function lineDelta(before = '', after = '') {
  const oldLines = String(before || '').split('\n');
  const newLines = String(after || '').split('\n');
  let head = 0;
  while (head < oldLines.length && head < newLines.length && oldLines[head] === newLines[head]) head += 1;
  let tail = 0;
  while (tail < oldLines.length - head && tail < newLines.length - head && oldLines[oldLines.length - 1 - tail] === newLines[newLines.length - 1 - tail]) tail += 1;
  return { changed: String(before || '') !== String(after || ''), added: Math.max(0, newLines.length - head - tail), removed: Math.max(0, oldLines.length - head - tail) };
}

function issue(kind, title, detail = '') {
  return Object.freeze({ kind, title, detail });
}

function localAssetPaths(files = {}) {
  return projectFileOrder(files).filter((path) => safeAssetPath(path));
}

function runProjectChecks(files = {}) {
  const source = cloneFiles(files);
  const errors = [];
  const warnings = [];
  const notes = [];
  const html = source['index.html'];
  const css = source['style.css'];
  const js = source['script.js'];
  const all = Object.values(source).join('\n');
  const assetPaths = localAssetPaths(source);
  if (!/<!doctype\s+html/i.test(html)) warnings.push(issue('warning', 'Add a document type', 'Start index.html with <!doctype html> for predictable browser behavior.'));
  if (!/<title>[^<]+<\/title>/i.test(html)) warnings.push(issue('warning', 'Add a page title', 'A clear title improves browser tabs and search previews.'));
  if (!/name=["']viewport["']/i.test(html)) warnings.push(issue('warning', 'Add viewport metadata', 'Responsive pages need a viewport meta tag.'));
  if (!/<main\b|role=["']main["']/i.test(html)) warnings.push(issue('warning', 'Add a main landmark', 'A <main> section helps keyboard and assistive-technology navigation.'));
  if (!/href=["']style\.css["']/i.test(html)) warnings.push(issue('warning', 'Link style.css', 'The preview can only apply the starter stylesheet when index.html links style.css.'));
  if (!/src=["']script\.js["']/i.test(html)) notes.push(issue('note', 'No script.js entry found', 'That is fine for a static page, but current script edits will not run in preview.'));
  if (!braceBalance(css)) errors.push(issue('error', 'CSS braces do not balance', 'Check for a missing or extra { or } in style.css.'));
  if (!braceBalance(js)) warnings.push(issue('warning', 'JavaScript braces may not balance', 'Check the changed lines in script.js before exporting.'));
  if (/\b(?:eval|Function)\s*\(/.test(js)) errors.push(issue('error', 'Dynamic JavaScript execution found', 'Remove eval or Function construction before exporting source.'));
  if (/\bdocument\.cookie\b/.test(js)) warnings.push(issue('warning', 'Cookie access found', 'Review cookie behavior carefully before using this project outside the sandbox.'));
  if (/\blocalStorage\b|\bsessionStorage\b/.test(js)) warnings.push(issue('warning', 'Browser storage access found', 'Review what is stored in a visitor browser before using this project outside Forge.'));
  if (/\bon\w+\s*=\s*["']/i.test(html)) warnings.push(issue('warning', 'Inline event handler found', 'Move inline on* handlers into script.js for easier review.'));
  if (/<a\b[^>]*target=["']_blank["'][^>]*>/i.test(html) && !/<a\b[^>]*rel=["'][^"']*noopener/i.test(html)) warnings.push(issue('warning', 'Review new-tab links', 'Links opening a new tab should normally include rel="noopener".'));
  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html)) warnings.push(issue('warning', 'Review image alt text', 'Add concise alt text to meaningful images.'));
  if (/(?:https?:)?\/\//i.test(all)) warnings.push(issue('warning', 'Remote URL found', 'Forge preview blocks remote connections and remote assets. Verify external links and assets in your own environment.'));
  if (/<form\b/i.test(html)) warnings.push(issue('warning', 'Form found', 'Preview blocks form submissions. Connect and test your own form endpoint later.'));
  const localReferences = [
    ...[...html.matchAll(/(?:src|href)=["'](assets\/[a-z0-9._-]+)["']/gi)].map((match) => match[1]),
    ...[...css.matchAll(/url\(["']?(assets\/[a-z0-9._-]+)["']?\)/gi)].map((match) => match[1])
  ];
  for (const reference of new Set(localReferences)) {
    if (!source[reference]) errors.push(issue('error', `Missing local asset: ${reference}`, 'Add the matching image in Forge or update the file reference.'));
  }
  if (assetPaths.length > MAX_LOCAL_ASSETS) errors.push(issue('error', 'Too many local images', `Keep a local project to ${MAX_LOCAL_ASSETS} image assets or fewer before saving.`));
  for (const path of assetPaths) {
    if (!isImageAsset(path, source[path])) errors.push(issue('error', `Unsupported asset: ${path}`, 'Forge accepts PNG, JPEG, WebP, GIF and SVG images stored as local data.'));
    if (new Blob([String(source[path] || '')]).size > MAX_ASSET_BYTES * 1.38) errors.push(issue('error', `Image is too large: ${path}`, `Keep individual local images below ${Math.round(MAX_ASSET_BYTES / 1000)} KB before adding them.`));
  }
  if (containsLikelySecret(source)) errors.push(issue('error', 'Possible secret found', 'Remove API keys, tokens, private keys, or recovery phrases before export.'));
  if (fileBytes(source) > MAX_PROJECT_BYTES) errors.push(issue('error', 'Project is too large for local Forge storage', `Keep local source below ${Math.round(MAX_PROJECT_BYTES / 1000)} KB before saving.`));
  if (!errors.length && !warnings.length) notes.push(issue('note', 'Local source check passed', 'This is a lightweight source review, not a production or security certification.'));
  return Object.freeze({ errors, warnings, notes, totalBytes: fileBytes(source), assetCount: assetPaths.length });
}

function createChangeReceipt(project, beforeFiles = {}, nextFiles = {}, report = runProjectChecks(nextFiles), revisionId = '', ai = null) {
  const changedFiles = [...new Set([...projectFileOrder(beforeFiles), ...projectFileOrder(nextFiles)])]
    .map((path) => ({ path, ...lineDelta(beforeFiles?.[path], nextFiles?.[path]), bytes: new Blob([String(nextFiles?.[path] || '')]).size }))
    .filter((entry) => entry.changed)
    .map((entry) => ({ path: entry.path, added: entry.added, removed: entry.removed, bytes: entry.bytes }));
  const aiOrigin = Boolean(ai?.requestId && ai?.providerId && ai?.model);
  return Object.freeze({
    schema: aiOrigin ? 'eon-forge-ai-change-receipt.v1' : 'eon-forge-local-change-receipt.v1', id: uniqueId('receipt'), projectId: project.id, revisionId,
    savedAt: new Date().toISOString(), changedFiles,
    checks: { errorCount: report.errors.length, warningCount: report.warnings.length, totalBytes: report.totalBytes },
    origin: aiOrigin ? 'ai-proposal' : 'manual',
    ai: aiOrigin ? {
      requestId: cleanText(ai.requestId, 120), providerId: cleanText(ai.providerId, 48), model: cleanText(ai.model, 160),
      proposedAt: String(ai.proposedAt || ''), validation: 'passed'
    } : null,
    storage: 'local-browser-only'
  });
}

function sourceManifest(project, files) {
  return {
    kind: 'eon-forge-local-project', version: 3,
    project: { id: project.id, title: project.title, type: project.type, style: project.style, createdAt: project.createdAt, updatedAt: project.updatedAt },
    files: projectFileOrder(files).map((name) => ({ path: name, bytes: new Blob([String(files?.[name] || '')]).size, kind: safeAssetPath(name) ? 'local-image-asset' : 'source' })),
    storage: 'local-browser-only', delivery: 'manual export only', safety: 'export pauses if a likely secret is found'
  };
}

function exportProject(project, files = project.files) {
  const report = runProjectChecks(files);
  if (report.errors.some((entry) => entry.title === 'Possible secret found')) {
    window.alert('Export paused because the project appears to contain a key, token, private key, or recovery phrase. Remove it before downloading source.');
    return false;
  }
  const prefix = slugify(project.title);
  for (const file of projectFileOrder(files)) {
    if (safeAssetPath(file)) {
      const asset = dataUrlToBlob(files[file]);
      if (asset) downloadBlob(`${prefix}-${file.replace(/^assets\//, 'assets-')}`, asset);
      continue;
    }
    const mime = file.endsWith('.html') ? 'text/html;charset=utf-8' : file.endsWith('.css') ? 'text/css;charset=utf-8' : file.endsWith('.js') ? 'text/javascript;charset=utf-8' : 'text/markdown;charset=utf-8';
    downloadText(`${prefix}-${file}`, files[file], mime);
  }
  downloadText(`${prefix}-eon-forge-project.json`, JSON.stringify(sourceManifest(project, files), null, 2), 'application/json;charset=utf-8');
  setStatus('Source files downloaded. Nothing was published, connected, or sent anywhere.');
  return true;
}

function exportBackup(project, files = project.files) {
  const backup = { schema: 'eon-forge-local-project-backup.v1', exportedAt: new Date().toISOString(), project: { ...project, files: cloneFiles(files) } };
  downloadText(`${slugify(project.title)}-forge-backup.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
  setStatus('Local project backup downloaded. Store it somewhere you control.');
}

function setStatus(message = '') {
  workspaceState.status = String(message || '');
  const status = root?.querySelector('[data-eon-forge-status]');
  if (status) status.textContent = workspaceState.status;
}

function openChatWithProject(project, files = project.files) {
  const summary = projectFileOrder(files).map((file) => `${file}: ${String(files?.[file] || '').length} chars`).join(', ');
  const prompt = `I have a local EON Forge project called “${project.title}”. Brief: ${project.brief || 'No written brief yet.'} Current files: ${summary}. Help me plan a specific improvement. Explain the proposed change before I manually edit or export my local files.`;
  try { sessionStorage.setItem('eon:chat:pending-composer-prompt:v1', prompt); } catch {}
  window.location.assign('/?new=1');
}

function prepareForgeOutputShare(project, destination = 'share-pack') {
  const typeLabel = ({ website: 'website', landing: 'landing page', portfolio: 'portfolio', app: 'simple web app' }[project?.type] || 'website');
  const result = writeEonOutputShareHandoff({
    explicitUserAction: true,
    origin: 'forge-project',
    title: project?.title,
    audience: `People who need a similar ${typeLabel} starting point`,
    usefulOutcome: `A local ${typeLabel} concept: ${cleanText(project?.brief || 'A focused Forge starter project.', 620)}`,
    firstRemixStep: 'Use the public-safe concept as a starting point, then rewrite the audience, content and call to action for your own project.',
    remixKind: 'forge-starter'
  });
  if (!result.ok) {
    setStatus(result.reason || 'Forge could not prepare a Share/Remix starter from this project.');
    return;
  }
  setStatus(`A short public-safe project summary is ready for ${destination === 'remix-card' ? 'a Remix Card' : 'a Share Pack'}. No source files, media, local preview, credential, link, account or deployment detail was transferred.`);
  window.location.assign(destination === 'remix-card' ? '/apps#eon-remix-card' : '/apps#eon-share');
}

function resetWorkspaceState(project) {
  workspaceState.projectId = project?.id || '';
  workspaceState.activeFile = projectFileOrder(project?.files || {}).includes(workspaceState.activeFile) ? workspaceState.activeFile : 'index.html';
  workspaceState.activeView = ['preview', 'code', 'changes', 'ai'].includes(workspaceState.activeView) ? workspaceState.activeView : 'preview';
  workspaceState.previewDevice = ['desktop', 'tablet', 'mobile'].includes(workspaceState.previewDevice) ? workspaceState.previewDevice : 'desktop';
  workspaceState.draftFiles = project ? cloneFiles(project.files) : null;
  workspaceState.quality = null;
  workspaceState.importReview = null;
  workspaceState.aiProposal = null;
  workspaceState.aiBaseFiles = null;
  workspaceState.aiAbortController = null;
  workspaceState.aiStatus = 'idle';
  workspaceState.aiError = '';
  workspaceState.aiRequestId = '';
  workspaceState.aiCancelToken = null;
  workspaceState.aiAbortController = null;
  workspaceState.aiAction = 'improve';
  workspaceState.aiSelectedPaths = [...FORGE_AI_ALLOWED_FILES];
  workspaceState.aiInstruction = '';
  workspaceState.aiReviewFile = '';
  workspaceState.status = '';
}

function activeStoredProject() {
  return getProjectById(workspaceState.projectId) || getActiveProject();
}

function isDirty(project = activeStoredProject()) {
  return Boolean(project && workspaceState.draftFiles && !filesEqual(project.files, workspaceState.draftFiles));
}

function safelyLeaveDraft(action) {
  if (!isDirty() || window.confirm('You have unsaved Forge edits. Discard this working copy? Your last saved revision will remain in this browser.')) action();
}

function saveDraft(project, label = 'Manual source save') {
  if (!project || !workspaceState.draftFiles) return false;
  const files = cloneFiles(workspaceState.draftFiles);
  const report = runProjectChecks(files);
  if (report.errors.some((entry) => /too large|Too many local images|Image is too large|Unsupported asset/i.test(entry.title))) {
    setStatus('Forge could not save this working copy until the local asset and project-size checks pass.');
    workspaceState.quality = report;
    renderWorkspace(project.id, { keepDraft: true });
    return false;
  }
  if (filesEqual(project.files, files)) { setStatus('No unsaved source changes to save.'); return true; }
  const now = new Date().toISOString();
  const snapshot = snapshotFromFiles(files, label, now);
  const receipt = createChangeReceipt(project, project.files, files, report, snapshot.id);
  const updated = normalizeProject({
    ...project, files, updatedAt: now,
    history: [snapshot, ...(project.history || [])],
    receipts: [receipt, ...(project.receipts || [])]
  });
  if (!saveProject(updated)) { setStatus(forgeSaveFailureMessage('This browser could not save the local revision. Check browser storage, then try again.')); return false; }
  workspaceState.draftFiles = cloneFiles(updated.files);
  workspaceState.quality = report;
  setStatus('Local revision and change receipt saved. No account, repository, or deployment was touched.');
  renderWorkspace(updated.id, { keepDraft: true });
  return true;
}

function restoreSnapshot(project, snapshotId) {
  const snapshot = project?.history?.find((entry) => entry.id === snapshotId);
  if (!snapshot) return;
  if (!window.confirm(`Restore “${snapshot.label}” from ${formatDate(snapshot.at)} ${formatTime(snapshot.at)}? Your current saved revision will remain in history.`)) return;
  workspaceState.draftFiles = cloneFiles(snapshot.files);
  saveDraft(project, `Restored ${snapshot.label}`);
}

function previewFrameClass() {
  return `eon-forge-preview-frame-wrap is-${workspaceState.previewDevice}`;
}

function tabButton(view, label) {
  return `<button type="button" class="eon-forge-view-tab${workspaceState.activeView === view ? ' is-active' : ''}" data-eon-forge-view="${view}" aria-selected="${workspaceState.activeView === view}">${label}</button>`;
}

function deviceButton(device, label) {
  return `<button type="button" class="eon-forge-device-button${workspaceState.previewDevice === device ? ' is-active' : ''}" data-eon-forge-device="${device}" aria-pressed="${workspaceState.previewDevice === device}">${label}</button>`;
}

function renderQuality(report = workspaceState.quality || runProjectChecks(workspaceState.draftFiles || {})) {
  const issues = [...report.errors, ...report.warnings, ...report.notes];
  const label = report.errors.length ? `${report.errors.length} issue${report.errors.length === 1 ? '' : 's'} to fix` : report.warnings.length ? `${report.warnings.length} review item${report.warnings.length === 1 ? '' : 's'}` : 'Local source check passed';
  return `<section class="eon-forge-quality" aria-live="polite"><div class="eon-forge-quality-head"><div><p>Source check</p><h3>${escapeHtml(label)}</h3></div><span class="eon-forge-quality-count"><strong>${report.errors.length}</strong> errors · <strong>${report.warnings.length}</strong> notes</span></div><ul>${issues.map((entry) => `<li class="is-${escapeHtml(entry.kind)}"><strong>${escapeHtml(entry.title)}</strong>${entry.detail ? `<span>${escapeHtml(entry.detail)}</span>` : ''}</li>`).join('')}</ul><small>${Math.round(report.totalBytes / 1000)} KB local source · ${report.assetCount || 0}/${MAX_LOCAL_ASSETS} local images · checks are lightweight guidance, not deployment certification.</small></section>`;
}

function renderPreview(project) {
  const files = workspaceState.draftFiles || project.files;
  return `<section class="eon-forge-preview-pane" aria-label="Local project preview"><div class="eon-forge-preview-toolbar"><div><p>Live local preview</p><small>Working edits appear here; save creates a revision.</small></div><div class="eon-forge-device-controls" aria-label="Preview size">${deviceButton('desktop', 'Desktop')}${deviceButton('tablet', 'Tablet')}${deviceButton('mobile', 'Mobile')}</div></div><div class="${previewFrameClass()}" data-eon-forge-preview-wrap><iframe class="eon-forge-preview-frame" title="${escapeHtml(project.title)} preview" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${escapeHtml(composePreview(files))}"></iframe></div><p class="eon-forge-preview-caption">Sandboxed iframe · restrictive preview CSP · remote connections and form submissions are blocked in preview. Local Forge images are inlined only into this preview.</p></section>`;
}

function renderEditor(_project) {
  const isAsset = Boolean(safeAssetPath(workspaceState.activeFile));
  const source = String(workspaceState.draftFiles?.[workspaceState.activeFile] || '');
  if (isAsset) return `<section class="eon-forge-editor-pane" aria-label="Local image asset"><div class="eon-forge-editor-toolbar"><div><p>Local image asset</p><h3>${escapeHtml(workspaceState.activeFile)}</h3></div><div class="eon-forge-editor-toolbar-actions"><button type="button" class="eon-forge-button-secondary" data-eon-forge-copy-asset="${escapeHtml(workspaceState.activeFile)}">Copy path</button><button type="button" class="eon-forge-button" data-eon-forge-save>Save revision</button></div></div><p class="eon-forge-editor-note">This image stays inside the local project until you save and export it. Add <code>${escapeHtml(workspaceState.activeFile)}</code> as an image source in index.html or style.css.</p><div class="eon-forge-asset-preview"><img src="${escapeHtml(source)}" alt="Local Forge asset preview" /></div></section>`;
  return `<section class="eon-forge-editor-pane" aria-label="Local source editor"><div class="eon-forge-editor-toolbar"><div><p>Working file</p><h3>${escapeHtml(workspaceState.activeFile)}</h3></div><div class="eon-forge-editor-toolbar-actions"><button type="button" class="eon-forge-button-secondary" data-eon-forge-check>Run source check</button><button type="button" class="eon-forge-button" data-eon-forge-save>Save revision</button></div></div><p class="eon-forge-editor-note">Local editor · Tab inserts spaces · Ctrl/Cmd + S saves a revision. Nothing is uploaded from this screen.</p><div class="eon-forge-editor" data-eon-forge-editor-wrap><pre class="eon-forge-line-numbers" aria-hidden="true" data-eon-forge-lines>${escapeHtml(lineNumbers(source))}</pre><textarea class="eon-forge-code-input" data-eon-forge-editor spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Edit ${escapeHtml(workspaceState.activeFile)}">${escapeHtml(source)}</textarea></div></section>`;
}

function renderReceipts(project) {
  const receipts = project.receipts || [];
  if (!receipts.length) return '<p class="eon-forge-empty">A local change receipt appears after you save a changed working copy.</p>';
  return `<div class="eon-forge-receipt-list">${receipts.map((receipt, index) => `<article><div><strong>${index === 0 ? 'Latest local receipt' : 'Local receipt'}</strong><span>${escapeHtml(formatDate(receipt.savedAt))} · ${escapeHtml(formatTime(receipt.savedAt))} · ${receipt.changedFiles.length} changed file${receipt.changedFiles.length === 1 ? '' : 's'}</span></div><button type="button" data-eon-forge-download-receipt="${escapeHtml(receipt.id)}">Download</button></article>`).join('')}</div>`;
}

function renderChanges(project) {
  const files = workspaceState.draftFiles || project.files;
  const changed = [...new Set([...projectFileOrder(project.files), ...projectFileOrder(files)])].map((file) => ({ file, ...lineDelta(project.files?.[file], files?.[file]) })).filter((entry) => entry.changed);
  const history = project.history || [];
  return `<section class="eon-forge-changes-pane" aria-label="Working changes and revision history"><div class="eon-forge-changes-head"><div><p>Changes</p><h3>${changed.length ? `${changed.length} file${changed.length === 1 ? '' : 's'} changed` : 'No unsaved changes'}</h3></div><button type="button" class="eon-forge-button-secondary" data-eon-forge-revert${changed.length ? '' : ' disabled'}>Discard working edits</button></div><div class="eon-forge-change-list">${changed.length ? changed.map((entry) => `<article><strong>${escapeHtml(entry.file)}</strong><span>+${entry.added} · -${entry.removed} lines since last save</span><button type="button" data-eon-forge-open-file="${escapeHtml(entry.file)}">Open file</button></article>`).join('') : '<p class="eon-forge-empty">Your saved source and working copy match.</p>'}</div><div class="eon-forge-history"><div><p>Local revision history</p><h3>${history.length} saved revision${history.length === 1 ? '' : 's'}</h3></div><div class="eon-forge-history-list">${history.map((snapshot, index) => `<article><div><strong>${escapeHtml(snapshot.label)}</strong><span>${escapeHtml(formatDate(snapshot.at))} · ${escapeHtml(formatTime(snapshot.at))}${index === 0 ? ' · current saved' : ''}</span></div>${index === 0 ? '<span class="eon-forge-history-current">Current</span>' : `<button type="button" data-eon-forge-restore="${escapeHtml(snapshot.id)}">Restore</button>`}</article>`).join('')}</div></div><div class="eon-forge-receipts"><div><p>Change receipts</p><h3>Review what was saved</h3></div>${renderReceipts(project)}</div></section>`;
}

function renderImportReview() {
  const review = workspaceState.importReview;
  if (!review) return '';
  const report = review.report;
  return `<section class="eon-forge-import-review" aria-live="polite"><div><p>Import review</p><h2>${escapeHtml(review.project.title)}</h2><p>This creates a separate local project. It does not overwrite the current project, connect a repository, or upload files.</p></div><div class="eon-forge-import-files">${projectFileOrder(review.project.files).map((path) => `<span>${escapeHtml(path)}</span>`).join('')}</div><p>${report.errors.length ? `${report.errors.length} blocking source check${report.errors.length === 1 ? '' : 's'} found. Review before creating the copy.` : `${report.warnings.length} review item${report.warnings.length === 1 ? '' : 's'} found. You can create a local copy and continue editing.`}</p><div class="eon-forge-import-actions"><button type="button" class="eon-forge-button-secondary" data-eon-forge-cancel-import>Cancel</button><button type="button" class="eon-forge-button" data-eon-forge-confirm-import${report.errors.some((entry) => entry.title === 'Possible secret found') ? ' disabled' : ''}>Create local copy</button></div></section>`;
}

function currentForgeAiReadiness() {
  try { return getForgeAiReadiness(); } catch (error) { return { ready: false, providerId: 'guide', providerLabel: 'AI provider', model: '', reason: error?.message || 'AI readiness is unavailable.' }; }
}

function renderAiReadiness(readiness = currentForgeAiReadiness()) {
  const label = readiness.ready ? `${readiness.providerLabel} · ${readiness.model}` : readiness.reason || 'Verify an AI provider first.';
  return `<div class="eon-forge-ai-readiness ${readiness.ready ? 'is-ready' : 'is-blocked'}"><span aria-hidden="true">${readiness.ready ? '●' : '○'}</span><div><strong>${readiness.ready ? 'Provider ready' : 'AI setup required'}</strong><small>${escapeHtml(label)}</small></div>${readiness.ready ? '' : '<a href="/vault">Open Vault</a>'}</div>`;
}

function renderAiControls(project) {
  const readiness = currentForgeAiReadiness();
  const busy = workspaceState.aiStatus === 'requesting';
  const files = workspaceState.draftFiles || project?.files || {};
  const action = getForgeAiAction(workspaceState.aiAction);
  const selectedPaths = workspaceState.aiSelectedPaths?.length ? workspaceState.aiSelectedPaths : [...action.files];
  const context = forgeAiContextSummary(files, selectedPaths);
  const actions = forgeAiActionOptions().map((entry) => `<option value="${escapeHtml(entry.id)}"${entry.id === action.id ? ' selected' : ''}>${escapeHtml(entry.label)}</option>`).join('');
  const presets = AI_ACTION_PRESETS.map((preset) => `<button type="button" data-eon-forge-ai-preset="${escapeHtml(preset.id)}">${escapeHtml(preset.label)}</button>`).join('');
  return `<section class="eon-forge-ai-card" aria-labelledby="eon-forge-ai-title">
    <p class="eon-forge-kicker">Forge AI Studio</p>
    <h2 id="eon-forge-ai-title">Build, repair and refine with AI.</h2>
    <p>Forge sends only the instruction and files you approve directly to your selected provider. The provider cannot reach the preview, Vault, browser storage, or saved project.</p>
    ${renderAiReadiness(readiness)}
    <label class="eon-forge-field">
      <span>Professional action</span>
      <select class="eon-forge-select" data-eon-forge-ai-action>${actions}</select>
      <small class="eon-forge-ai-action-help" data-eon-forge-ai-action-help>${escapeHtml(action.description)}</small>
    </label>
    <div class="eon-forge-ai-presets" aria-label="Quick professional briefs">${presets}</div>
    <label class="eon-forge-field">
      <span>Instruction</span>
      <textarea class="eon-forge-ai-instruction" data-eon-forge-ai-instruction maxlength="1800" placeholder="${escapeHtml(action.placeholder)}">${escapeHtml(workspaceState.aiInstruction)}</textarea>
    </label>
    <fieldset class="eon-forge-ai-files">
      <legend>Approved source files</legend>
      ${FORGE_AI_ALLOWED_FILES.map((path) => `<label><input type="checkbox" value="${escapeHtml(path)}" data-eon-forge-ai-file${selectedPaths.includes(path) ? ' checked' : ''} /> <span>${escapeHtml(path)}</span></label>`).join('')}
    </fieldset>
    <div class="eon-forge-ai-context${context.nearLimit ? ' is-warning' : ''}" data-eon-forge-ai-context>
      <div><strong>${context.fileCount} file${context.fileCount === 1 ? '' : 's'} selected</strong><span>${formatBytes(context.bytes)} source context</span></div>
      <div class="eon-forge-ai-context-track" aria-hidden="true"><span style="width:${Math.min(100, context.percent)}%"></span></div>
      <small>${context.percent}% of the bounded Forge input budget${context.nearLimit ? ' · select fewer files if the request is rejected' : ''}</small>
    </div>
    <label class="eon-forge-ai-consent"><input type="checkbox" data-eon-forge-ai-consent /> <span>I approve sending this instruction and the selected source files directly to ${escapeHtml(readiness.providerLabel || 'the selected provider')} for this one request.</span></label>
    <div class="eon-forge-ai-actions"><button type="button" class="eon-forge-button" data-eon-forge-ai-run ${readiness.ready && !busy && !context.overLimit ? '' : 'disabled'}>${busy ? 'Building proposal…' : escapeHtml(action.label)}</button>${busy ? '<button type="button" class="eon-forge-button-secondary" data-eon-forge-ai-cancel>Cancel request</button>' : ''}</div>
    <p class="eon-forge-ai-note">AI output is untrusted until Forge validates it. Nothing changes until you review the source comparison and press Apply Changes.</p>
  </section>`;
}

function renderAiDiffPane(title, side, { commonHeadLines = 0, commonTailLines = 0, totalLines = 0 } = {}) {
  const changedEnd = Math.max(commonHeadLines, totalLines - commonTailLines);
  const rows = side.lines.map((row) => {
    const changed = row.number > commonHeadLines && row.number <= changedEnd;
    return `<span class="eon-forge-ai-diff-row${changed ? ' is-changed' : ''}"><b>${row.number}</b><code>${escapeHtml(row.text || ' ')}</code></span>`;
  }).join('');
  return `<article class="eon-forge-ai-diff-pane is-${escapeHtml(side.kind)}"><header><strong>${escapeHtml(title)}</strong><span>Lines ${side.startLine}–${side.endLine}${side.clipped ? ' · clipped' : ''}</span></header><pre>${rows}</pre></article>`;
}

function renderAiReview(project) {
  const proposal = workspaceState.aiProposal;
  if (workspaceState.aiStatus === 'requesting') return `<section class="eon-forge-ai-review"><div class="eon-forge-ai-progress" role="status"><span class="eon-forge-ai-spinner" aria-hidden="true"></span><div><p>Trusted parent request</p><h3>Building a reviewable proposal…</h3><span>Forge is waiting for one request-bound JSON response. Saved files remain unchanged.</span></div><button type="button" class="eon-forge-button-secondary" data-eon-forge-ai-cancel>Cancel</button></div></section>`;
  if (!proposal) return `<section class="eon-forge-ai-review"><div class="eon-forge-empty"><strong>No AI proposal is open.</strong><br />Use Forge AI Builder in Project controls. A validated proposal will appear here before any file changes.</div>${workspaceState.aiError ? `<p class="eon-forge-ai-error">${escapeHtml(workspaceState.aiError)}</p>` : ''}</section>`;
  const nextReport = runProjectChecks(proposal.nextFiles);
  const reviewPath = proposal.changes.some((entry) => entry.path === workspaceState.aiReviewFile) ? workspaceState.aiReviewFile : proposal.changes[0]?.path || '';
  const reviewSource = proposal.changes.find((entry) => entry.path === reviewPath)?.content || '';
  const reviewBefore = String(workspaceState.aiBaseFiles?.[reviewPath] || '');
  const diff = buildForgeAiDiffWindow(reviewBefore, reviewSource);
  const action = getForgeAiAction(proposal.action || workspaceState.aiAction);
  return `<section class="eon-forge-ai-review" aria-labelledby="eon-forge-ai-review-title">
    <header class="eon-forge-ai-review-head">
      <div><p>Validated AI proposal · ${escapeHtml(action.shortLabel)}</p><h3 id="eon-forge-ai-review-title">${escapeHtml(proposal.summary)}</h3><span>${escapeHtml(proposal.providerLabel)} · ${escapeHtml(proposal.model)} · ${proposal.settlement?.elapsedMs || 0} ms</span></div>
      <div class="eon-forge-ai-actions"><button type="button" class="eon-forge-button-secondary" data-eon-forge-ai-discard>Discard</button><button type="button" class="eon-forge-button" data-eon-forge-ai-apply ${nextReport.errors.length ? 'disabled' : ''}>Apply Changes</button></div>
    </header>
    <div class="eon-forge-ai-change-grid">${proposal.changedFiles.map((entry) => `<article><div><strong>${escapeHtml(entry.path)}</strong><span>${entry.beforeLines} → ${entry.afterLines} lines</span></div><p>+${entry.added} · -${entry.removed} changed lines · ${formatBytes(entry.beforeBytes)} → ${formatBytes(entry.bytes)}</p><button type="button" data-eon-forge-ai-preview-file="${escapeHtml(entry.path)}">Review before / after</button></article>`).join('')}</div>
    ${reviewPath ? `<section class="eon-forge-ai-source-review"><div><p>Bounded source comparison</p><strong>${escapeHtml(reviewPath)}</strong></div><div class="eon-forge-ai-source-compare">${renderAiDiffPane('Current source', diff.before, { ...diff, totalLines: reviewBefore.split('\n').length })}${renderAiDiffPane('Proposed source', diff.after, { ...diff, totalLines: reviewSource.split('\n').length })}</div><small>Forge shows the changed region with nearby context. Large files are clipped in review but remain fully validated before Apply.</small></section>` : ''}
    <div class="eon-forge-ai-proposed-preview"><div><p>Proposed version</p><small>Still isolated · same restricted sandbox and network-disabled CSP</small></div><div class="${previewFrameClass()}"><iframe class="eon-forge-preview-frame" title="Proposed ${escapeHtml(project.title)} preview" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${escapeHtml(composePreview(proposal.nextFiles))}"></iframe></div></div>
    ${renderQuality(nextReport)}
    <p class="eon-forge-ai-note">Applying creates a saved revision and a sanitized AI receipt. The receipt records provider, model, request ID, changed filenames and validation totals—never the API key, prompt, source, or model response.</p>
  </section>`;
}

function selectedAiPaths() {
  const selected = Array.from(root?.querySelectorAll('[data-eon-forge-ai-file]:checked') || []).map((input) => input.value).filter((path) => FORGE_AI_ALLOWED_FILES.includes(path));
  return selected.length || root?.querySelector('[data-eon-forge-ai-file]') ? selected : [...(workspaceState.aiSelectedPaths || [])];
}

function updateAiContextMeter(project) {
  const meter = root?.querySelector('[data-eon-forge-ai-context]');
  if (!meter) return;
  const selected = selectedAiPaths();
  workspaceState.aiSelectedPaths = [...selected];
  const context = forgeAiContextSummary(workspaceState.draftFiles || project?.files || {}, selected);
  meter.classList.toggle('is-warning', context.nearLimit);
  const summary = meter.querySelector('div:first-child');
  if (summary) summary.innerHTML = `<strong>${context.fileCount} file${context.fileCount === 1 ? '' : 's'} selected</strong><span>${formatBytes(context.bytes)} source context</span>`;
  const bar = meter.querySelector('.eon-forge-ai-context-track span');
  if (bar) bar.style.width = `${Math.min(100, context.percent)}%`;
  const note = meter.querySelector('small');
  if (note) note.textContent = `${context.percent}% of the bounded Forge input budget${context.nearLimit ? ' · select fewer files if the request is rejected' : ''}`;
  const runButton = root?.querySelector('[data-eon-forge-ai-run]');
  const readiness = currentForgeAiReadiness();
  if (runButton && workspaceState.aiStatus !== 'requesting') runButton.disabled = !readiness.ready || context.overLimit || !context.fileCount;
}

function applyAiActionSelection(project, actionId = 'improve') {
  const action = getForgeAiAction(actionId);
  workspaceState.aiAction = action.id;
  workspaceState.aiSelectedPaths = [...action.files];
  root?.querySelectorAll('[data-eon-forge-ai-file]').forEach((input) => { input.checked = action.files.includes(input.value); });
  const input = root?.querySelector('[data-eon-forge-ai-instruction]');
  if (input) input.placeholder = action.placeholder;
  const help = root?.querySelector('[data-eon-forge-ai-action-help]');
  if (help) help.textContent = action.description;
  const runButton = root?.querySelector('[data-eon-forge-ai-run]');
  if (runButton && workspaceState.aiStatus !== 'requesting') runButton.textContent = action.label;
  updateAiContextMeter(project);
}

function applyAiPreset(project, presetId = '') {
  const preset = AI_ACTION_PRESETS.find((entry) => entry.id === presetId);
  const input = root?.querySelector('[data-eon-forge-ai-instruction]');
  if (!preset || !input) return;
  let instruction = preset.instruction;
  if (preset.id === 'repair') {
    const report = runProjectChecks(workspaceState.draftFiles || project?.files || {});
    const findings = [...report.errors, ...report.warnings].slice(0, 8).map((entry) => entry.title);
    if (findings.length) instruction += ` Current findings: ${findings.join('; ')}.`;
  }
  applyAiActionSelection(project, preset.action || 'improve');
  workspaceState.aiInstruction = instruction.slice(0, 1800);
  input.value = workspaceState.aiInstruction;
  input.focus();
  setStatus(`${preset.label} instruction loaded. Review it, choose files, approve consent, then start Forge AI.`);
}

async function requestAiProposal(project, { mode = 'improve', instruction = '', selectedPaths = null } = {}) {
  if (!project || workspaceState.aiStatus === 'requesting') return;
  const paths = selectedPaths || selectedAiPaths();
  const consent = root?.querySelector('[data-eon-forge-ai-consent]');
  const instructionInput = root?.querySelector('[data-eon-forge-ai-instruction]');
  const requestedInstruction = cleanText(instruction || instructionInput?.value || '', 1800);
  const requestedAction = getForgeAiAction(workspaceState.aiAction);
  workspaceState.aiInstruction = requestedInstruction;
  workspaceState.aiSelectedPaths = [...paths];
  const context = forgeAiContextSummary(workspaceState.draftFiles || project.files, paths);
  if (!paths.length) { setStatus('Choose at least one source file for Forge AI.'); return; }
  if (context.overLimit) { setStatus('The approved source exceeds the bounded Forge request budget. Select fewer files or shorten the project first.'); return; }
  if (!requestedInstruction || requestedInstruction.length < 8) { setStatus('Describe the build or improvement you want before starting Forge AI.'); instructionInput?.focus(); return; }
  if (mode !== 'generate' && !consent?.checked) { setStatus('Approve the one-time provider sharing consent before starting Forge AI.'); consent?.focus(); return; }
  const readiness = currentForgeAiReadiness();
  if (!readiness.ready) { setStatus(readiness.reason || 'Verify an AI provider in Vault first.'); return; }
  const baseFiles = cloneFiles(workspaceState.draftFiles || project.files);
  const requestId = uniqueId('forge-ai');
  const cancelToken = { cancelled: false };
  const abortController = new AbortController();
  workspaceState.aiBaseFiles = baseFiles;
  workspaceState.aiProposal = null;
  workspaceState.aiError = '';
  workspaceState.aiStatus = 'requesting';
  workspaceState.aiRequestId = requestId;
  workspaceState.aiCancelToken = cancelToken;
  workspaceState.aiAbortController = abortController;
  workspaceState.activeView = 'ai';
  setStatus(`Forge AI is requesting one structured proposal from ${readiness.providerLabel}. Saved files remain unchanged.`);
  renderWorkspace(project.id, { keepDraft: true });
  const result = await runForgeAiRequest({ mode, action: requestedAction.id, title: project.title, type: project.type, brief: project.brief, instruction: requestedInstruction, files: baseFiles, selectedPaths: paths, requestId, cancelToken, abortController });
  if (workspaceState.aiRequestId !== requestId) return;
  workspaceState.aiStatus = result.ok ? 'proposal-ready' : result.state || 'failed';
  workspaceState.aiCancelToken = null;
  workspaceState.aiAbortController = null;
  if (result.ok) {
    workspaceState.aiProposal = result.proposal;
    workspaceState.aiError = '';
    setStatus(`Validated AI proposal ready: ${result.proposal.changedFiles.length} changed file${result.proposal.changedFiles.length === 1 ? '' : 's'}. Review before applying.`);
  } else {
    workspaceState.aiProposal = null;
    workspaceState.aiError = result.error || 'Forge AI did not return a usable proposal.';
    setStatus(workspaceState.aiError);
  }
  renderWorkspace(project.id, { keepDraft: true });
}

function cancelAiRequest(project) {
  if (workspaceState.aiCancelToken) workspaceState.aiCancelToken.cancelled = true;
  try { workspaceState.aiAbortController?.abort('forge-cancelled'); } catch {}
  workspaceState.aiAbortController = null;
  workspaceState.aiRequestId = '';
  workspaceState.aiStatus = 'cancelled';
  workspaceState.aiProposal = null;
  workspaceState.aiBaseFiles = null;
  workspaceState.aiError = 'Forge AI was cancelled. Any late provider response will be ignored.';
  setStatus(workspaceState.aiError);
  renderWorkspace(project.id, { keepDraft: true });
}

function discardAiProposal(project) {
  workspaceState.aiProposal = null;
  workspaceState.aiBaseFiles = null;
  workspaceState.aiStatus = 'idle';
  workspaceState.aiError = '';
  setStatus('AI proposal discarded. The working copy and saved project were not changed.');
  renderWorkspace(project.id, { keepDraft: true });
}

function applyAiProposal(project) {
  const proposal = workspaceState.aiProposal;
  const baseFiles = workspaceState.aiBaseFiles;
  if (!proposal || !baseFiles) return;
  const currentFiles = cloneFiles(workspaceState.draftFiles || project.files);
  if (forgeAiFingerprint(currentFiles) !== proposal.baseFingerprint || !filesEqual(currentFiles, baseFiles)) {
    setStatus('The working copy changed after this AI request. Discard or rerun the proposal so Forge does not overwrite newer edits.');
    return;
  }
  const nextFiles = cloneFiles(mergeForgeAiChanges(currentFiles, proposal.changes));
  const report = runProjectChecks(nextFiles);
  if (report.errors.length) { setStatus('Forge blocked Apply because the proposed source no longer passes local safety checks.'); return; }
  const snapshot = snapshotFromFiles(nextFiles, `AI · ${cleanText(proposal.summary, 54)}`);
  const receipt = createChangeReceipt(project, project.files, nextFiles, report, snapshot.id, {
    requestId: proposal.requestId, providerId: proposal.providerId, model: proposal.model, proposedAt: proposal.requestedAt
  });
  const updated = {
    ...project,
    files: nextFiles,
    history: [snapshot, ...(project.history || [])],
    receipts: [receipt, ...(project.receipts || [])],
    updatedAt: new Date().toISOString()
  };
  if (!saveProject(updated)) { setStatus(forgeSaveFailureMessage('This browser could not save the AI revision. No saved project files were changed.')); return; }
  recordEonCoreOutcome({ kind: 'forge-source-applied', route: '/forge', source: 'forge-local-apply', receiptId: receipt.id, verified: true });
  workspaceState.draftFiles = cloneFiles(nextFiles);
  workspaceState.quality = report;
  workspaceState.aiProposal = null;
  workspaceState.aiBaseFiles = null;
  workspaceState.aiStatus = 'applied';
  workspaceState.activeView = 'changes';
  setStatus('AI changes applied as a saved local revision with a sanitized receipt. No repository or deployment was touched.');
  renderWorkspace(updated.id, { keepDraft: true });
}

function renderWorkspace(requestedId = '', { keepDraft = false } = {}) {
  if (!root) return;
  const requested = requestedId ? getProjectById(requestedId) : getActiveProject();
  if (!requested) { renderStart(); return; }
  if (requested.id !== workspaceState.projectId || !keepDraft || !workspaceState.draftFiles) resetWorkspaceState(requested);
  writeActiveId(requested.id);
  const active = getProjectById(requested.id) || requested;
  const dirty = isDirty(active);
  const selectedFiles = projectFileOrder(workspaceState.draftFiles || active.files).map((file) => `<button type="button" class="eon-forge-file-tree-row${workspaceState.activeFile === file ? ' is-active' : ''}" data-eon-forge-file="${escapeHtml(file)}" aria-current="${workspaceState.activeFile === file ? 'page' : 'false'}"><span aria-hidden="true">${safeAssetPath(file) ? '▧' : file.endsWith('.html') ? '◇' : file.endsWith('.css') ? '◌' : file.endsWith('.js') ? '⌁' : '≡'}</span><strong>${escapeHtml(file)}</strong><small>${safeAssetPath(file) ? `${Math.round(new Blob([String(workspaceState.draftFiles?.[file] || '')]).size / 1000)} KB` : `${String(workspaceState.draftFiles?.[file] || '').length} chars`}</small></button>`).join('');
  const mainContent = workspaceState.activeView === 'code' ? renderEditor(active) : workspaceState.activeView === 'changes' ? renderChanges(active) : workspaceState.activeView === 'ai' ? renderAiReview(active) : renderPreview(active);
  const nexusStage = renderEonForgeNexusStage({ projectSelected: true, fileCount: projectFileOrder(workspaceState.draftFiles || active.files).length, aiStatus: workspaceState.aiStatus, proposalReady: Boolean(workspaceState.aiProposal), validation: { checked: Boolean(workspaceState.quality), errorCount: workspaceState.quality?.errors?.length || 0 }, previewReady: true });
  root.innerHTML = `<section class="eon-forge" aria-labelledby="eon-forge-title"><header class="eon-forge-hero eon-forge-hero-compact"><div><p class="eon-forge-kicker">EON Forge · AI Developer Workspace</p><h1 id="eon-forge-title">Build with intelligence and control.</h1><p class="eon-forge-hero-copy">Generate or improve a local website with your verified AI provider, review every proposed file, edit freely, save revisions, and export only when you choose.</p></div><div class="eon-forge-hero-actions"><button type="button" class="eon-forge-button-secondary" data-eon-forge-import>Import local source</button><button type="button" class="eon-forge-button-secondary" data-eon-forge-new>New build</button><a class="eon-forge-button-secondary" href="/apps">All Apps</a></div></header>${renderIncomingHandoff()}${nexusStage}${renderImportReview()}<div class="eon-forge-workspace eon-forge-developer-workspace"><aside class="eon-forge-projects" aria-label="Local Forge projects and files"><div class="eon-forge-projects-head"><h2>Projects</h2><span class="eon-forge-note">${readProjects().filter((entry) => entry.lifecycleState === 'active').length}/${MAX_PROJECTS} active · ${readProjects().length} total</span></div><div class="eon-forge-project-list">${readProjects().map((project) => `<button type="button" class="eon-forge-project-row${project.id === active.id ? ' is-active' : ''}" data-eon-forge-project="${escapeHtml(project.id)}"><strong>${escapeHtml(project.title)}</strong><small>${project.lifecycleState === 'archived' ? 'Archived' : 'Active'} · updated ${escapeHtml(formatDate(project.updatedAt))}</small></button>`).join('')}</div><div class="eon-forge-file-tree"><div><h3>Files</h3><span>Local project</span></div>${selectedFiles}<button type="button" class="eon-forge-add-asset" data-eon-forge-add-asset>Add local image</button></div></aside><section class="eon-forge-main-panel"><div class="eon-forge-project-bar"><div><p class="eon-forge-project-eyebrow">${escapeHtml({ website: 'Website', landing: 'Landing page', portfolio: 'Portfolio', app: 'Simple web app' }[active.type] || 'Website')}</p><h2>${escapeHtml(active.title)}</h2><p>${escapeHtml(active.brief || 'Local EON Forge project.')}</p></div><div class="eon-forge-project-actions"><span class="eon-forge-save-state${dirty ? ' is-dirty' : ''}" data-eon-forge-dirty>${dirty ? 'Unsaved working edits' : 'Saved locally'}</span><button type="button" class="eon-forge-button-secondary" data-eon-forge-check>Check</button><button type="button" class="eon-forge-button" data-eon-forge-save${dirty ? '' : ' disabled'}>Save</button></div></div><nav class="eon-forge-view-tabs" role="tablist" aria-label="Forge views">${tabButton('preview', 'Preview')}${tabButton('code', 'Code')}${tabButton('changes', 'Changes')}${tabButton('ai', 'AI Review')}</nav>${mainContent}</section><aside class="eon-forge-inspector">${renderAiControls(active)}${renderForgeGitHubPublishWorkspace()}${renderEonPremiumCapabilityPreview('forge', { compact: true })}<section class="eon-forge-project-controls"><p class="eon-forge-kicker">Project controls</p><h2>Ship only when you choose.</h2><p>Source, images, revisions and AI proposals stay under your control. For static/client projects, GitHub publishing is review-first: branch, PR, CI, then a separate final publish approval.</p><div class="eon-forge-inspector-actions"><button type="button" class="eon-forge-button" data-eon-forge-export>Download source</button><button type="button" class="eon-forge-button-secondary" data-eon-forge-backup>Download backup</button><button type="button" class="eon-forge-button-secondary" data-eon-forge-share-pack>Prepare Share Pack</button><button type="button" class="eon-forge-button-secondary" data-eon-forge-remix-card>Prepare Remix Card</button><button type="button" class="eon-forge-button-secondary" data-eon-forge-chat>Plan in Chat</button><button type="button" class="eon-forge-button-secondary" data-eon-forge-lifecycle="${active.lifecycleState === 'archived' ? 'active' : 'archived'}">${active.lifecycleState === 'archived' ? 'Restore project' : 'Archive project'}</button></div></section>${renderQuality()}<section class="eon-forge-inspector-meta"><div><span>Storage</span><strong>Current browser</strong></div><div><span>Preview</span><strong>Sandboxed + CSP</strong></div><div><span>Provider requests</span><strong>Explicit consent only</strong></div><div><span>Change review</span><strong>${active.receipts?.length || 0} local receipt${active.receipts?.length === 1 ? '' : 's'}</strong></div></section><button type="button" class="eon-forge-danger" data-eon-forge-delete>Delete local project</button></aside></div><footer class="eon-forge-truth"><strong>RT89 truth:</strong><span>Forge is an AI-assisted local builder for websites and simple client-side browser apps. Provider calls run only in the trusted parent page after explicit file-sharing consent. Static/client projects may be published through the connected GitHub review lane only after source checks, a review branch and PR, exact-SHA CI success, and a separate final approval. GitHub credentials remain server-custodied. Backend/database creation and native mobile deployment are not implemented in this lane.</span></footer><p class="eon-forge-build-status" data-eon-forge-status aria-live="polite">${escapeHtml(workspaceState.status)}</p></section>`;
  bindWorkspaceEvents(active);
}

function updateEditorChrome() {
  const project = activeStoredProject();
  const dirty = isDirty(project);
  root?.querySelectorAll('[data-eon-forge-dirty]').forEach((node) => { node.classList.toggle('is-dirty', dirty); node.textContent = dirty ? 'Unsaved working edits' : 'Saved locally'; });
  root?.querySelectorAll('[data-eon-forge-save]').forEach((button) => { button.disabled = !dirty; });
  const editor = root?.querySelector('[data-eon-forge-editor]');
  const lines = root?.querySelector('[data-eon-forge-lines]');
  if (editor && lines) lines.textContent = lineNumbers(editor.value);
}

function refreshPreviewOnly() {
  const frame = root?.querySelector('.eon-forge-preview-frame');
  if (frame) frame.srcdoc = composePreview(workspaceState.draftFiles || {});
}

function bindEditor(editor) {
  const lines = root?.querySelector('[data-eon-forge-lines]');
  editor.addEventListener('input', () => {
    workspaceState.draftFiles[workspaceState.activeFile] = editor.value;
    workspaceState.quality = null;
    if (lines) lines.textContent = lineNumbers(editor.value);
    updateEditorChrome();
    window.clearTimeout(workspaceState.previewTimer);
    workspaceState.previewTimer = window.setTimeout(refreshPreviewOnly, 240);
  });
  editor.addEventListener('scroll', () => { if (lines) lines.scrollTop = editor.scrollTop; });
  editor.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      const project = activeStoredProject();
      if (project) saveDraft(project);
      return;
    }
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.setRangeText('  ', start, end, 'end');
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function copyAssetPath(path) {
  const value = safeAssetPath(path);
  if (!value) return;
  const complete = () => setStatus(`Copied ${value}. Add it to index.html or style.css when you are ready.`);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(complete).catch(() => setStatus(`Use this local path: ${value}`));
  } else setStatus(`Use this local path: ${value}`);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image in this browser.'));
    reader.readAsDataURL(file);
  });
}

function chooseFiles({ multiple = true, accept = '' } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = multiple; input.accept = accept; input.style.display = 'none';
    input.addEventListener('change', () => { const files = Array.from(input.files || []); input.remove(); resolve(files); }, { once: true });
    document.body.appendChild(input); input.click();
  });
}

async function addLocalImage(project) {
  const currentAssets = localAssetPaths(workspaceState.draftFiles || project.files);
  if (currentAssets.length >= MAX_LOCAL_ASSETS) { setStatus(`Forge keeps up to ${MAX_LOCAL_ASSETS} local images per project. Remove or export an image before adding another.`); return; }
  const [file] = await chooseFiles({ multiple: false, accept: ALLOWED_IMAGE_TYPES.join(',') });
  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { setStatus('Choose a PNG, JPEG, WebP, GIF or SVG image.'); return; }
  if (file.size > MAX_ASSET_BYTES) { setStatus(`Keep each local image under ${Math.round(MAX_ASSET_BYTES / 1000)} KB before adding it.`); return; }
  const basename = slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 72) || 'image';
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/svg+xml' ? 'svg' : file.type.replace('image/', '');
  let path = `assets/${basename}.${extension}`;
  let suffix = 2;
  while (workspaceState.draftFiles[path]) { path = `assets/${basename}-${suffix}.${extension}`; suffix += 1; }
  try {
    workspaceState.draftFiles[path] = await readFileAsDataUrl(file);
    workspaceState.activeFile = path;
    workspaceState.activeView = 'code';
    workspaceState.quality = null;
    setStatus(`${file.name} is added to this working copy. Save a revision to keep it locally.`);
    renderWorkspace(project.id, { keepDraft: true });
  } catch (error) { setStatus(error?.message || 'Could not add that local image.'); }
}

async function parseImportFiles(selectedFiles) {
  const files = Array.from(selectedFiles || []);
  if (!files.length) return { error: 'Choose a local backup or source files first.' };
  const backup = files.find((file) => file.name.toLowerCase().endsWith('.json'));
  if (files.length === 1 && backup) {
    try {
      const parsed = JSON.parse(await backup.text());
      if (parsed?.schema !== 'eon-forge-local-project-backup.v1' || !parsed?.project) return { error: 'This JSON is not an EON Forge local project backup.' };
      const candidate = normalizeProject({ ...parsed.project, id: uniqueId('import'), title: `Imported ${cleanText(parsed.project.title, 56) || 'Forge project'}`, updatedAt: new Date().toISOString() });
      if (!candidate) return { error: 'That backup does not contain a valid local Forge project.' };
      candidate.history = [snapshotFromFiles(candidate.files, 'Imported local project')];
      candidate.receipts = [];
      return { project: candidate, report: runProjectChecks(candidate.files) };
    } catch { return { error: 'Could not read that JSON backup.' }; }
  }
  const imported = {};
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (ALLOWED_SOURCE_FILES.includes(lower)) imported[lower] = await file.text();
    else if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      if (file.size > MAX_ASSET_BYTES) return { error: `${file.name} is larger than the local image limit.` };
      const basename = slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 72) || 'image';
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/svg+xml' ? 'svg' : file.type.replace('image/', '');
      let path = `assets/${basename}.${extension}`;
      let suffix = 2;
      while (imported[path]) { path = `assets/${basename}-${suffix}.${extension}`; suffix += 1; }
      imported[path] = await readFileAsDataUrl(file);
    }
  }
  if (!imported['index.html']) return { error: 'Choose index.html, or a single EON Forge local backup JSON.' };
  const title = cleanText(imported['index.html'].match(/<title>([^<]+)<\/title>/i)?.[1] || 'Imported Forge project', 72);
  const candidate = normalizeProject({ id: uniqueId('import'), title: `Imported ${title}`, brief: 'Imported local source for review in EON Forge.', type: 'website', style: 'graphite', files: imported, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: [], receipts: [] });
  return { project: candidate, report: runProjectChecks(candidate.files) };
}

async function beginImport(project) {
  const files = await chooseFiles({ multiple: true, accept: '.html,.css,.js,.md,.json,image/png,image/jpeg,image/webp,image/gif,image/svg+xml,text/html,text/css,text/javascript,text/markdown,application/json' });
  const result = await parseImportFiles(files);
  if (result.error) { setStatus(result.error); return; }
  workspaceState.importReview = result;
  setStatus('Local source import is ready for review. It will create a separate project only after you confirm.');
  renderWorkspace(project.id, { keepDraft: true });
}

function confirmImport() {
  const review = workspaceState.importReview;
  if (!review?.project) return;
  if (review.report.errors.some((entry) => entry.title === 'Possible secret found')) { setStatus('Import cannot continue until the possible secret is removed from the local source.'); return; }
  if (!saveProject(review.project)) { setStatus(forgeSaveFailureMessage('This browser could not save the imported local project. Check browser storage, then try again.')); return; }
  resetWorkspaceState(review.project);
  workspaceState.status = 'Imported project saved locally. No repository, connection, or publish action occurred.';
  renderWorkspace(review.project.id, { keepDraft: true });
}

function downloadReceipt(project, receiptId) {
  const receipt = project?.receipts?.find((entry) => entry.id === receiptId);
  if (!receipt) return;
  downloadText(`${slugify(project.title)}-change-receipt-${receipt.id.slice(-8)}.json`, JSON.stringify(receipt, null, 2), 'application/json;charset=utf-8');
  setStatus('Local change receipt downloaded. It includes file-level change counts and check totals, not your source content.');
}

function bindWorkspaceEvents(project) {
  root.querySelectorAll('[data-eon-forge-project]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.eonForgeProject || '';
    if (id === project.id) return;
    safelyLeaveDraft(() => { resetWorkspaceState(getProjectById(id)); renderWorkspace(id); });
  }));
  root.querySelectorAll('[data-eon-forge-file]').forEach((button) => button.addEventListener('click', () => {
    workspaceState.activeFile = button.dataset.eonForgeFile || 'index.html'; workspaceState.activeView = 'code'; renderWorkspace(project.id, { keepDraft: true });
  }));
  root.querySelectorAll('[data-eon-forge-view]').forEach((button) => button.addEventListener('click', () => { workspaceState.activeView = button.dataset.eonForgeView || 'preview'; renderWorkspace(project.id, { keepDraft: true }); }));
  root.querySelectorAll('[data-eon-forge-device]').forEach((button) => button.addEventListener('click', () => { workspaceState.previewDevice = button.dataset.eonForgeDevice || 'desktop'; renderWorkspace(project.id, { keepDraft: true }); }));
  root.querySelectorAll('[data-eon-forge-save]').forEach((button) => button.addEventListener('click', () => saveDraft(project)));
  root.querySelectorAll('[data-eon-forge-check]').forEach((button) => button.addEventListener('click', () => { workspaceState.quality = runProjectChecks(workspaceState.draftFiles || project.files); setStatus(`Source check complete: ${workspaceState.quality.errors.length} errors and ${workspaceState.quality.warnings.length} review items.`); renderWorkspace(project.id, { keepDraft: true }); }));
  root.querySelectorAll('[data-eon-forge-export]').forEach((button) => button.addEventListener('click', () => exportProject(project, workspaceState.draftFiles || project.files)));
  root.querySelector('[data-eon-forge-backup]')?.addEventListener('click', () => exportBackup(project, workspaceState.draftFiles || project.files));
  root.querySelector('[data-eon-forge-share-pack]')?.addEventListener('click', () => prepareForgeOutputShare(project, 'share-pack'));
  root.querySelector('[data-eon-forge-remix-card]')?.addEventListener('click', () => prepareForgeOutputShare(project, 'remix-card'));
  root.querySelector('[data-eon-forge-chat]')?.addEventListener('click', () => openChatWithProject(project, workspaceState.draftFiles || project.files));
  root.querySelector('[data-eon-forge-new]')?.addEventListener('click', () => safelyLeaveDraft(() => { resetWorkspaceState(null); renderStart({ brief: '' }); }));
  root.querySelector('[data-eon-forge-import]')?.addEventListener('click', () => beginImport(project));
  root.querySelector('[data-eon-forge-add-asset]')?.addEventListener('click', () => addLocalImage(project));
  root.querySelector('[data-eon-forge-cancel-import]')?.addEventListener('click', () => { workspaceState.importReview = null; setStatus('Local source import review cancelled.'); renderWorkspace(project.id, { keepDraft: true }); });
  root.querySelector('[data-eon-forge-confirm-import]')?.addEventListener('click', confirmImport);
  root.querySelector('[data-eon-forge-lifecycle]')?.addEventListener('click', (event) => {
    const nextState = event.currentTarget?.dataset?.eonForgeLifecycle === 'archived' ? 'archived' : 'active';
    if (!setForgeProjectLifecycle(project.id, nextState)) { setStatus(forgeSaveFailureMessage('This browser could not change the project lifecycle.')); return; }
    setStatus(nextState === 'archived' ? 'Project archived locally. Its source was preserved and the active slot is now available.' : 'Project restored to active local work.');
    renderWorkspace(project.id);
  });
  root.querySelector('[data-eon-forge-delete]')?.addEventListener('click', () => { if (!window.confirm(`Delete “${project.title}” from this browser? Download source or a backup first if you need it later.`)) return; deleteProject(project.id); resetWorkspaceState(null); renderWorkspace(); });
  root.querySelector('[data-eon-forge-revert]')?.addEventListener('click', () => { if (!window.confirm('Discard working edits and return to the last saved local revision?')) return; workspaceState.draftFiles = cloneFiles(project.files); workspaceState.quality = null; renderWorkspace(project.id, { keepDraft: true }); });
  root.querySelectorAll('[data-eon-forge-open-file]').forEach((button) => button.addEventListener('click', () => { workspaceState.activeFile = button.dataset.eonForgeOpenFile || 'index.html'; workspaceState.activeView = 'code'; renderWorkspace(project.id, { keepDraft: true }); }));
  root.querySelectorAll('[data-eon-forge-restore]').forEach((button) => button.addEventListener('click', () => restoreSnapshot(project, button.dataset.eonForgeRestore || '')));
  root.querySelectorAll('[data-eon-forge-download-receipt]').forEach((button) => button.addEventListener('click', () => downloadReceipt(project, button.dataset.eonForgeDownloadReceipt || '')));
  root.querySelectorAll('[data-eon-forge-copy-asset]').forEach((button) => button.addEventListener('click', () => copyAssetPath(button.dataset.eonForgeCopyAsset || '')));
  root.querySelectorAll('[data-eon-forge-ai-preset]').forEach((button) => button.addEventListener('click', () => applyAiPreset(project, button.dataset.eonForgeAiPreset || '')));
  root.querySelector('[data-eon-forge-ai-action]')?.addEventListener('change', (event) => applyAiActionSelection(project, event.currentTarget?.value || 'improve'));
  root.querySelector('[data-eon-forge-ai-instruction]')?.addEventListener('input', (event) => { workspaceState.aiInstruction = String(event.currentTarget?.value || '').slice(0, 1800); });
  root.querySelectorAll('[data-eon-forge-ai-file]').forEach((input) => input.addEventListener('change', () => updateAiContextMeter(project)));
  root.querySelector('[data-eon-forge-ai-run]')?.addEventListener('click', () => requestAiProposal(project));
  root.querySelectorAll('[data-eon-forge-ai-cancel]').forEach((button) => button.addEventListener('click', () => cancelAiRequest(project)));
  root.querySelector('[data-eon-forge-ai-discard]')?.addEventListener('click', () => discardAiProposal(project));
  root.querySelector('[data-eon-forge-ai-apply]')?.addEventListener('click', () => applyAiProposal(project));
  root.querySelectorAll('[data-eon-forge-ai-preview-file]').forEach((button) => button.addEventListener('click', () => {
    workspaceState.aiReviewFile = button.dataset.eonForgeAiPreviewFile || '';
    renderWorkspace(project.id, { keepDraft: true });
  }));
  void bindForgeGitHubPublishWorkspace(root, { projectId: project.id, title: project.title, projectSlug: slugify(project.title), files: cloneFiles(workspaceState.draftFiles || project.files), sourceCheckPassed: Boolean(workspaceState.quality && workspaceState.quality.errors.length === 0), dirty: isDirty(project), onStatus: setStatus });
  const editor = root.querySelector('[data-eon-forge-editor]');
  if (editor) bindEditor(editor);
}

function renderStart({ brief = readPendingBrief() } = {}) {
  if (!root) return;
  const readiness = currentForgeAiReadiness();
  const nexusStage = renderEonForgeNexusStage({ projectSelected: false, fileCount: 0, aiStatus: 'idle', proposalReady: false, validation: { checked: false, errorCount: 0 }, previewReady: false });
  root.innerHTML = `<section class="eon-forge" aria-labelledby="eon-forge-title"><header class="eon-forge-hero"><div><p class="eon-forge-kicker">EON Forge · AI Builder</p><h1 id="eon-forge-title">Turn an idea into working source.</h1><p class="eon-forge-hero-copy">Describe a website, landing page, portfolio, or simple browser app. Forge can ask your verified provider for a complete local project, validate it, show a restricted preview, and wait for your approval before applying anything.</p></div><div class="eon-forge-hero-actions"><a class="eon-forge-button-secondary" href="/vault">AI &amp; provider setup</a><a class="eon-forge-button-secondary" href="/apps">All Apps</a></div></header>${renderIncomingHandoff()}${nexusStage}<div class="eon-forge-start"><section class="eon-forge-panel eon-forge-start-main"><h2>What would you like to build?</h2><p>Include the audience, goal, style, important sections, and the main action people should take. Forge generates only four reviewable local files: HTML, CSS, JavaScript and README.</p>${renderAiReadiness(readiness)}<label class="eon-forge-field" for="eon-forge-brief"><span>Build brief</span><textarea id="eon-forge-brief" class="eon-forge-brief" maxlength="2200" placeholder="Build a premium website for a Goa beach café with a gallery, menu highlights, booking enquiry and WhatsApp call-to-action.">${escapeHtml(brief)}</textarea></label><div class="eon-forge-build-fields"><label class="eon-forge-field" for="eon-forge-title-input"><span>Project name (optional)</span><input id="eon-forge-title-input" class="eon-forge-title-input" maxlength="72" placeholder="For example: Sunset Café" /></label><label class="eon-forge-field" for="eon-forge-type"><span>Build as</span><select id="eon-forge-type" class="eon-forge-select"><option value="website">Website</option><option value="landing">Landing page</option><option value="portfolio">Portfolio</option><option value="app">Simple web app</option></select></label><label class="eon-forge-field" for="eon-forge-style"><span>Starter fallback style</span><select id="eon-forge-style" class="eon-forge-select"><option value="graphite">Graphite</option><option value="ocean">Ocean</option><option value="ember">Ember</option><option value="moss">Moss</option></select></label></div><label class="eon-forge-ai-consent eon-forge-ai-consent-start"><input type="checkbox" data-eon-forge-start-ai-consent /> <span>I approve sending this brief and the four generated starter files directly to ${escapeHtml(readiness.providerLabel || 'my selected provider')} for one AI build request.</span></label><div class="eon-forge-build-actions"><button type="button" class="eon-forge-button" data-eon-forge-create-ai ${readiness.ready ? '' : 'disabled'}>Build with AI</button><button type="button" class="eon-forge-button-secondary" data-eon-forge-create-manual>Create manual starter</button></div><p class="eon-forge-build-status" data-eon-forge-status aria-live="polite">AI output is reviewed before Apply. No GitHub, hosting, backend, or deployment starts here.</p></section><aside class="eon-forge-panel eon-forge-side" aria-label="EON Forge capabilities and boundaries"><section><h3>Flagship workflow</h3><ul><li>Verified BYOK or local provider</li><li>Request-bound structured source</li><li>File and secret validation</li><li>Restricted proposal preview</li><li>Apply, discard and undo</li><li>Local revisions and export</li></ul></section><section><h3>Deliberately separate</h3><p>Generated-site hosting, GitHub publishing, backend/database creation, terminal execution and native mobile builds are not silently bundled into this release.</p></section></aside></div></section>`;

  const readBuildInput = () => {
    const briefInput = root.querySelector('#eon-forge-brief');
    const briefValue = cleanText(briefInput?.value || '', 2200);
    if (briefValue.length < 12) { setStatus('Add a useful brief before Forge creates a project.'); briefInput?.focus(); return null; }
    return {
      briefInput,
      brief: briefValue,
      title: root.querySelector('#eon-forge-title-input')?.value || '',
      type: root.querySelector('#eon-forge-type')?.value || 'website',
      style: root.querySelector('#eon-forge-style')?.value || 'graphite'
    };
  };

  root.querySelector('[data-eon-forge-create-manual]')?.addEventListener('click', () => {
    const input = readBuildInput();
    if (!input) return;
    const project = buildProject(input);
    if (!saveProject(project)) { setStatus(forgeSaveFailureMessage()); return; }
    resetWorkspaceState(project);
    workspaceState.status = 'Manual starter created locally. You can use Forge AI from Project controls after provider setup.';
    renderWorkspace(project.id, { keepDraft: true });
  });

  root.querySelector('[data-eon-forge-create-ai]')?.addEventListener('click', async () => {
    const input = readBuildInput();
    if (!input) return;
    const liveReadiness = currentForgeAiReadiness();
    if (!liveReadiness.ready) { setStatus(liveReadiness.reason || 'Verify an AI provider first.'); return; }
    const consent = root.querySelector('[data-eon-forge-start-ai-consent]');
    if (!consent?.checked) { setStatus('Approve the one-time provider sharing consent before building with AI.'); consent?.focus(); return; }
    const project = buildProject(input);
    if (!saveProject(project)) { setStatus(forgeSaveFailureMessage('This browser could not create the safe local starter before the AI request.')); return; }
    resetWorkspaceState(project);
    renderWorkspace(project.id, { keepDraft: true });
    await requestAiProposal(project, {
      mode: 'generate',
      instruction: input.brief,
      selectedPaths: FORGE_AI_ALLOWED_FILES
    });
  });
}

async function initialize() {
  if (!root) return;
  const incoming = await consumeEonHandoffFromLocation({ receiverId: 'forge' });
  if (incoming.ok) {
    workspaceState.incomingHandoff = incoming;
    removeEonHandoffQuery();
    workspaceState.status = 'Incoming reference accepted for review. Nothing was applied automatically.';
  } else if (!['handoff-query-missing', 'handoff-not-found'].includes(incoming.reason)) {
    workspaceState.status = `Incoming reference was not accepted: ${String(incoming.reason || 'invalid handoff').replaceAll('-', ' ')}.`;
    removeEonHandoffQuery();
  }
  const existing = getActiveProject();
  if (existing) { resetWorkspaceState(existing); if (workspaceState.incomingHandoff?.ok) workspaceState.status = 'Incoming reference accepted for review. Nothing was applied automatically.'; renderWorkspace(existing.id, { keepDraft: true }); }
  else renderStart();
}

export const EON_FORGE_QUICK_BUILD = Object.freeze({
  STORE_KEY, ACTIVE_KEY, PENDING_BRIEF_KEY, FILE_ORDER, CORE_FILE_ORDER, PREVIEW_CSP, MAX_LOCAL_ASSETS,
  buildProject, buildFiles, composePreview, containsLikelySecret, runProjectChecks, lineDelta,
  createChangeReceipt, projectFileOrder, safeAssetPath, validateImport: parseImportFiles,
  saveProject, readProjects, deleteProject, setForgeProjectLifecycle, forgeProjectCapacityCounts,
  MAX_PROJECTS, MAX_SNAPSHOTS, MAX_RECEIPTS, getLastCapacityDecision: () => lastForgeCapacityDecision
});

if (root && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void initialize(); }, { once: true });
  else void initialize();
}
