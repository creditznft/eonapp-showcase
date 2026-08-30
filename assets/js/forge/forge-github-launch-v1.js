/**
 * RT89 — launch-safe Forge -> GitHub -> CI -> GitHub Pages contract.
 *
 * This module is projection/generation only. It never reads credentials and
 * never performs a network request. Remote mutation belongs to the signed-in,
 * same-origin server action lane after explicit review.
 */
export const EON_FORGE_GITHUB_LAUNCH_SCHEMA = 'eonapp.forge.github-launch.rt89.v1';
export const EON_FORGE_GITHUB_CI_WORKFLOW_PATH = '.github/workflows/eonapp-ci-pages.yml';
export const EON_FORGE_GITHUB_VALIDATOR_PATH = '.eonapp/validate-static.mjs';
export const EON_FORGE_GITHUB_PUBLISHER_PATH = '.eonapp/build-pages.mjs';
export const EON_FORGE_GITHUB_MANIFEST_PATH = '.eonapp/publish-manifest.json';
export const EON_FORGE_GITHUB_MANIFEST_SCHEMA = 'eonapp.forge.github-manifest.rt89.v1';
export const EON_FORGE_GITHUB_CONTROL_PATHS = Object.freeze([EON_FORGE_GITHUB_CI_WORKFLOW_PATH, EON_FORGE_GITHUB_VALIDATOR_PATH, EON_FORGE_GITHUB_PUBLISHER_PATH, EON_FORGE_GITHUB_MANIFEST_PATH]);

const freeze = Object.freeze;
const MAX_FILES = 96;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const encoder = new TextEncoder();
const SECRET_PATTERNS = freeze([
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
]);
const BACKEND_MARKERS = freeze([
  /(^|\/)functions\//i,
  /(^|\/)server\.(?:js|mjs|cjs|ts)$/i,
  /(^|\/)api\//i,
  /(^|\/)worker\.(?:js|mjs|ts)$/i,
  /(^|\/)wrangler\.(?:toml|jsonc?)$/i
]);
const CONTROL_CHARACTERS = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`, 'g');

function cleanText(value = '', max = 120) {
  return String(value ?? '').replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function slug(value = '') {
  return cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'forge-project';
}
function safeNonce(value = '') {
  const compact = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  return compact.length >= 6 ? compact : 'review01';
}
export function isEonForgeGitHubSafePath(value = '') {
  const path = String(value || '');
  if (!path || path.length > 180 || path.startsWith('/') || path.endsWith('/') || path.includes('\\') || path.includes('\0')) return false;
  if (path.split('/').some((part) => !part || part === '.' || part === '..')) return false;
  if (!/^[A-Za-z0-9._/-]+$/.test(path)) return false;
  if (/^(?:\.git|node_modules)(?:\/|$)/i.test(path)) return false;
  if (/^(?:\.env|\.npmrc|\.netrc)(?:\.|$)/i.test(path)) return false;
  return true;
}
function normalizeEntries(files = {}) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) return freeze([]);
  return freeze(Object.entries(files).slice(0, MAX_FILES + 1).map(([path, body]) => freeze({ path: String(path || ''), body: typeof body === 'string' ? body : '' })));
}
function secretHit(body = '') { return SECRET_PATTERNS.some((pattern) => pattern.test(String(body || ''))); }

export function inspectEonForgeGitHubProject({ title = '', files = {}, sourceCheckPassed = false } = {}) {
  const entries = normalizeEntries(files);
  const blockers = [];
  let totalBytes = 0;
  if (!cleanText(title)) blockers.push('project-title-required');
  if (!entries.length) blockers.push('source-files-required');
  if (entries.length > MAX_FILES) blockers.push('too-many-source-files');
  if (sourceCheckPassed !== true) blockers.push('forge-source-check-required');
  for (const entry of entries.slice(0, MAX_FILES)) {
    if (!isEonForgeGitHubSafePath(entry.path)) blockers.push(`unsafe-path:${entry.path.slice(0, 60)}`);
    if (EON_FORGE_GITHUB_CONTROL_PATHS.includes(entry.path)) blockers.push(`reserved-path:${entry.path}`);
    const bytes = encoder.encode(entry.body).byteLength;
    totalBytes += bytes;
    if (bytes > MAX_FILE_BYTES) blockers.push(`file-too-large:${entry.path.slice(0, 60)}`);
    if (secretHit(entry.body)) blockers.push(`secret-like-content:${entry.path.slice(0, 60)}`);
  }
  if (totalBytes > MAX_TOTAL_BYTES) blockers.push('source-bundle-too-large');
  const paths = new Set(entries.map((entry) => entry.path));
  const hasIndex = paths.has('index.html');
  if (!hasIndex) blockers.push('static-index-required');
  const backendMarkers = entries.filter((entry) => BACKEND_MARKERS.some((pattern) => pattern.test(entry.path))).map((entry) => entry.path);
  const staticEligible = hasIndex && backendMarkers.length === 0;
  return freeze({
    schema: EON_FORGE_GITHUB_LAUNCH_SCHEMA,
    ok: blockers.length === 0,
    title: cleanText(title),
    projectSlug: slug(title),
    fileCount: Math.min(entries.length, MAX_FILES),
    totalBytes,
    staticEligible,
    backendMarkers: freeze(backendMarkers),
    blockers: freeze([...new Set(blockers)]),
    remoteMutationPerformed: false,
    credentialsRead: false
  });
}

export function buildEonForgeGitHubBranchName({ title = '', nonce = '' } = {}) {
  return `eonapp/${slug(title)}-${safeNonce(nonce)}`.slice(0, 96);
}

export function buildEonForgeGitHubStaticValidator() {
  return `import fs from 'node:fs';\nimport path from 'node:path';\n\nconst root = process.cwd();\nconst ignored = new Set(['.git','node_modules']);\nconst secretPatterns = [/\\bgh[pousr]_[A-Za-z0-9]{20,}\\b/,/\\bgithub_pat_[A-Za-z0-9_]{20,}\\b/,/\\bAKIA[0-9A-Z]{16}\\b/,/\\bsk-[A-Za-z0-9_-]{20,}\\b/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];\nif (!fs.existsSync(path.join(root,'index.html'))) throw new Error('EONAPP Forge CI: index.html is required.');\nlet count = 0; let total = 0;\nconst walk = (dir) => { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { if (ignored.has(entry.name)) continue; const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else { count++; const body=fs.readFileSync(full); total+=body.byteLength; if(body.byteLength>524288) throw new Error('EONAPP Forge CI: file exceeds 512 KiB: '+path.relative(root,full)); if(/\\.(?:pem|key|p12|pfx)$/i.test(entry.name)) throw new Error('EONAPP Forge CI: credential-like file blocked: '+path.relative(root,full)); const text=body.toString('utf8'); if(secretPatterns.some((pattern)=>pattern.test(text))) throw new Error('EONAPP Forge CI: secret-like content blocked: '+path.relative(root,full)); } } };\nwalk(root);\nif(count>100) throw new Error('EONAPP Forge CI: file count exceeds launch-safe static limit.');\nif(total>5*1024*1024) throw new Error('EONAPP Forge CI: source bundle exceeds 5 MiB.');\nconsole.log('EONAPP Forge CI source validation PASS', {count,total});\n`;
}

export function buildEonForgeGitHubPagesPublisher() {
  return `import fs from 'node:fs';\nimport path from 'node:path';\n\nconst root=process.cwd(); const out=path.join(root,'_site'); const manifestPath=path.join(root,${JSON.stringify(EON_FORGE_GITHUB_MANIFEST_PATH)});\nconst schema=${JSON.stringify(EON_FORGE_GITHUB_MANIFEST_SCHEMA)};\nif(!fs.existsSync(manifestPath)) throw new Error('EONAPP Forge Pages: managed publish manifest is missing.');\nconst manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));\nif(manifest?.schema!==schema || !Array.isArray(manifest?.generatedPaths) || !manifest.generatedPaths.length) throw new Error('EONAPP Forge Pages: managed publish manifest is invalid.');\nfs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});\nconst safe=(value)=>{ const p=String(value||''); return p && p.length<=180 && !p.startsWith('/') && !p.endsWith('/') && !p.includes('\\\\') && !p.split('/').some((part)=>!part||part==='.'||part==='..') && /^[A-Za-z0-9._/-]+$/.test(p) && !p.startsWith('.git/') && !p.startsWith('.eonapp/') && !p.startsWith('.github/'); };\nconst seen=new Set();\nfor(const value of manifest.generatedPaths){ const rel=String(value||''); if(!safe(rel)||seen.has(rel)) throw new Error('EONAPP Forge Pages: unsafe managed path: '+rel); seen.add(rel); const from=path.join(root,...rel.split('/')); const to=path.join(out,...rel.split('/')); if(!fs.existsSync(from)) throw new Error('EONAPP Forge Pages: managed file missing: '+rel); const stat=fs.lstatSync(from); if(stat.isSymbolicLink()||!stat.isFile()) throw new Error('EONAPP Forge Pages: managed path is not a regular file: '+rel); fs.mkdirSync(path.dirname(to),{recursive:true}); fs.copyFileSync(from,to); }\nif(!seen.has('index.html')||!fs.existsSync(path.join(out,'index.html'))) throw new Error('EONAPP Forge Pages: index.html missing from managed publish set.');\nfs.writeFileSync(path.join(out,'.nojekyll'),'');\nconsole.log('EONAPP Forge Pages artifact ready', {path:'_site',files:seen.size});\n`;
}

export function buildEonForgeGitHubCiPagesWorkflow() {
  return `name: EONAPP Forge CI and Pages\n\non:\n  push:\n  pull_request:\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\nconcurrency:\n  group: eonapp-forge-\${{ github.workflow }}-\${{ github.ref }}\n  cancel-in-progress: true\n\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v6\n      - name: Validate Forge static source\n        run: node ${EON_FORGE_GITHUB_VALIDATOR_PATH}\n      - name: Build isolated Pages artifact\n        run: node ${EON_FORGE_GITHUB_PUBLISHER_PATH}\n      - name: Upload Pages artifact\n        uses: actions/upload-pages-artifact@v4\n        with:\n          path: '_site'\n\n  deploy-pages:\n    if: github.event_name == 'push' && github.ref == format('refs/heads/{0}', github.event.repository.default_branch)\n    needs: validate\n    runs-on: ubuntu-latest\n    permissions:\n      contents: read\n      pages: write\n      id-token: write\n    environment:\n      name: github-pages\n      url: \${{ steps.deployment.outputs.page_url }}\n    steps:\n      - name: Configure Pages\n        uses: actions/configure-pages@v5\n      - name: Deploy Pages\n        id: deployment\n        uses: actions/deploy-pages@v4\n`;
}

export function buildEonForgeGitHubPublishBundle({ title = '', files = {}, sourceCheckPassed = false, nonce = '' } = {}) {
  const inspection = inspectEonForgeGitHubProject({ title, files, sourceCheckPassed });
  if (!inspection.ok) return freeze({ ok: false, inspection, files: freeze({}), branchName: '', requiresExplicitFinalApproval: true });
  if (!inspection.staticEligible) return freeze({ ok: false, inspection, reason: 'static-pages-v1-only', files: freeze({}), branchName: '', requiresExplicitFinalApproval: true });
  const managedPaths = normalizeEntries(files).slice(0, MAX_FILES).map((entry) => entry.path).sort((a,b)=>a.localeCompare(b));
  const source = Object.fromEntries(normalizeEntries(files).slice(0, MAX_FILES).map((entry) => [entry.path, entry.body]));
  source[EON_FORGE_GITHUB_VALIDATOR_PATH] = buildEonForgeGitHubStaticValidator();
  source[EON_FORGE_GITHUB_PUBLISHER_PATH] = buildEonForgeGitHubPagesPublisher();
  source[EON_FORGE_GITHUB_CI_WORKFLOW_PATH] = buildEonForgeGitHubCiPagesWorkflow();
  source[EON_FORGE_GITHUB_MANIFEST_PATH] = JSON.stringify({schema:EON_FORGE_GITHUB_MANIFEST_SCHEMA,projectSlug:inspection.projectSlug,generatedPaths:managedPaths}, null, 2) + '\n';
  return freeze({
    schema: EON_FORGE_GITHUB_LAUNCH_SCHEMA,
    ok: true,
    inspection,
    branchName: buildEonForgeGitHubBranchName({ title, nonce }),
    files: freeze(source),
    fileCount: Object.keys(source).length,
    managedPaths: freeze(managedPaths),
    publicationMode: 'branch-pr-ci-merge-pages',
    requiresExplicitFinalApproval: true,
    defaultBranchWriteBeforeApproval: false,
    forcePushAllowed: false,
    rollbackMode: 'reviewed-revert-commit',
    credentialMode: 'server-custodied-github-app-user-token'
  });
}

export function getEonForgeGitHubLaunchTruth() {
  return freeze({
    schema: EON_FORGE_GITHUB_LAUNCH_SCHEMA,
    sourceContractReady: true,
    liveGitHubConnectionProven: false,
    liveRemoteMutationProven: false,
    launchV1: 'static-client-only',
    reviewBeforeRemoteWrite: true,
    branchBeforeDefault: true,
    ciBeforePublish: true,
    forcePushAllowed: false,
    patPasteDefault: false,
    requiredGitHubAppPermissions: freeze({
      contents: 'write',
      workflows: 'write',
      pullRequests: 'write',
      actions: 'read',
      pages: 'write',
      administration: 'write-for-new-repo-and-pages-settings'
    })
  });
}
