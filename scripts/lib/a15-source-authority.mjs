import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const A15_REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const A15_A14_BASELINE_COMMIT = 'a6cf226d39073701b3d3b04c1f8d4582aec495a3';
export const A15_W802B_SOURCE_COMMIT = 'fdc92595ca6d8fb941f45afb598a4a282dc70e62';
export const A15_W802B_ARCHIVE_SHA256 = '76ea76c72f55f75a0d371116a65b675abe35265b3438ac092bb42bc04e2542ec';
export const A15_CITY_RUNTIME_ROOT = 'assets/js/city/eon-city-play-core.js';
export const A15_CITY_PREFIX = 'assets/js/city/';

export const A15_PRIMARY_CORE_ROUTES = Object.freeze([
  Object.freeze({ id: 'chat', html: 'index.html' }),
  Object.freeze({ id: 'create', html: 'create.html' }),
  Object.freeze({ id: 'projects', html: 'projects.html' }),
  Object.freeze({ id: 'library', html: 'library.html' }),
  Object.freeze({ id: 'workspace', html: 'workspace.html' }),
  Object.freeze({ id: 'forge', html: 'forge.html' }),
  Object.freeze({ id: 'insights', html: 'trade.html' }),
  Object.freeze({ id: 'automations', html: 'automations.html' }),
  Object.freeze({ id: 'profile', html: 'profile.html' }),
  Object.freeze({ id: 'vault', html: 'vault.html' }),
  Object.freeze({ id: 'capsule', html: 'capsule.html' }),
  Object.freeze({ id: 'local-ai', html: 'local-ai.html' }),
  Object.freeze({ id: 'realm-studio', html: 'realm-studio.html' })
]);

const JS_EXTENSION_CANDIDATES = Object.freeze(['', '.js', '.mjs', '.cjs', '/index.js', '/index.mjs']);
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.css', '.md', '.txt', '.csv', '.toml', '.yml', '.yaml', '.sql']);

export function normalizeRepoPath(value = '') {
  return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/^\//, '');
}

export function absoluteRepoPath(repoPath = '', root = A15_REPOSITORY_ROOT) {
  return path.join(root, normalizeRepoPath(repoPath));
}

export function readRepoText(repoPath, root = A15_REPOSITORY_ROOT) {
  return readFileSync(absoluteRepoPath(repoPath, root), 'utf8');
}

export function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

export function sha256File(filePath) {
  return sha256(readFileSync(filePath));
}

export function git(args, { root = A15_REPOSITORY_ROOT } = {}) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

export function parseLiteralModuleSpecifiers(source = '') {
  const specifiers = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of String(source).matchAll(pattern)) specifiers.add(match[1]);
  }
  return [...specifiers];
}

export function resolveLocalModule(importer, specifier, { root = A15_REPOSITORY_ROOT } = {}) {
  const value = String(specifier || '').split('?')[0].split('#')[0];
  if (!value.startsWith('.') && !value.startsWith('/')) return null;
  const unresolved = value.startsWith('/')
    ? normalizeRepoPath(value)
    : path.posix.normalize(path.posix.join(path.posix.dirname(normalizeRepoPath(importer)), value));
  for (const suffix of JS_EXTENSION_CANDIDATES) {
    const candidate = normalizeRepoPath(`${unresolved}${suffix}`);
    const absolute = absoluteRepoPath(candidate, root);
    if (existsSync(absolute) && statSync(absolute).isFile()) return candidate;
  }
  return null;
}

export function inspectModuleImports(repoPath, { root = A15_REPOSITORY_ROOT } = {}) {
  const source = readRepoText(repoPath, root);
  const resolved = [];
  const unresolved = [];
  for (const specifier of parseLiteralModuleSpecifiers(source)) {
    const local = resolveLocalModule(repoPath, specifier, { root });
    if (local) resolved.push(local);
    else if (specifier.startsWith('.') || specifier.startsWith('/')) unresolved.push(specifier);
  }
  return Object.freeze({
    file: normalizeRepoPath(repoPath),
    imports: Object.freeze([...new Set(resolved)].sort()),
    unresolved: Object.freeze([...new Set(unresolved)].sort())
  });
}

export function parseHtmlModuleEntries(htmlPath, { root = A15_REPOSITORY_ROOT } = {}) {
  const source = readRepoText(htmlPath, root);
  const entries = new Set();
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of source.matchAll(scriptPattern)) {
    const attributes = match[1] || '';
    const body = match[2] || '';
    if (!/\btype\s*=\s*["']module["']/i.test(attributes)) continue;
    const src = attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (src) entries.add(normalizeRepoPath(src.split('?')[0].split('#')[0]));
    for (const specifier of parseLiteralModuleSpecifiers(body)) {
      const local = resolveLocalModule(htmlPath, specifier, { root });
      if (local) entries.add(local);
    }
  }
  return Object.freeze([...entries].sort());
}

export function buildModuleClosure(entries, { root = A15_REPOSITORY_ROOT } = {}) {
  const queue = [...entries].map(normalizeRepoPath);
  const modules = new Set();
  const edges = [];
  const unresolved = [];
  while (queue.length) {
    const file = queue.pop();
    if (!file || modules.has(file)) continue;
    const absolute = absoluteRepoPath(file, root);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      unresolved.push(Object.freeze({ importer: null, specifier: file }));
      continue;
    }
    modules.add(file);
    if (!/\.(?:mjs|cjs|js)$/i.test(file)) continue;
    const imports = inspectModuleImports(file, { root });
    for (const imported of imports.imports) {
      edges.push(Object.freeze({ from: file, to: imported }));
      if (!modules.has(imported)) queue.push(imported);
    }
    for (const specifier of imports.unresolved) unresolved.push(Object.freeze({ importer: file, specifier }));
  }
  return Object.freeze({
    entries: Object.freeze([...new Set(entries.map(normalizeRepoPath))].sort()),
    modules: Object.freeze([...modules].sort()),
    edges: Object.freeze(edges.sort((a, b) => `${a.from}\0${a.to}`.localeCompare(`${b.from}\0${b.to}`))),
    unresolved: Object.freeze(unresolved.sort((a, b) => `${a.importer}\0${a.specifier}`.localeCompare(`${b.importer}\0${b.specifier}`)))
  });
}

export function inspectCoreCityBoundary({ root = A15_REPOSITORY_ROOT } = {}) {
  const routes = A15_PRIMARY_CORE_ROUTES.map((route) => {
    const entries = parseHtmlModuleEntries(route.html, { root });
    const closure = buildModuleClosure(entries, { root });
    const cityModules = closure.modules.filter((file) => file.startsWith(A15_CITY_PREFIX));
    return Object.freeze({
      ...route,
      entries,
      moduleCount: closure.modules.length,
      cityModuleCount: cityModules.length,
      cityModules: Object.freeze(cityModules),
      unresolved: closure.unresolved
    });
  });
  const distinctCityModules = [...new Set(routes.flatMap((route) => route.cityModules))].sort();
  return Object.freeze({
    schema: 'eonapp.a15.core-city-boundary-baseline.v1',
    routes: Object.freeze(routes),
    routeCount: routes.length,
    coupledRouteCount: routes.filter((route) => route.cityModuleCount > 0).length,
    distinctCityModuleCount: distinctCityModules.length,
    distinctCityModules: Object.freeze(distinctCityModules),
    target: Object.freeze({ coupledRouteCount: 0, distinctCityModuleCount: 0 })
  });
}

export function classifyCoreModule(file = '') {
  const normalized = normalizeRepoPath(file);
  const rules = [
    ['ai-runtime', /^assets\/js\/(?:chat\/ai-runtime|ai-kernel|providers|local-ai)\//],
    ['ai-runtime', /^assets\/js\/chat\/ai-runtime\.js$/],
    ['projects-library', /^assets\/js\/(?:projects|create\/creator-library|utils\/eon-workspace-store)/],
    ['automation-workflow', /^assets\/js\/(?:automation|utils\/automation-os-store|operator|action)/],
    ['billing-capability', /^assets\/js\/(?:billing|capabilities|account|referrals)/],
    ['share-capture', /^assets\/js\/(?:share|creator)/],
    ['shell-nexus', /^assets\/js\/(?:shell|nexus|eon-app-shell)/],
    ['shared-utility', /^assets\/js\/utils\//],
    ['configuration', /^config\//]
  ];
  return rules.find(([, pattern]) => pattern.test(normalized))?.[0] || 'other-core';
}

export function inspectCityCoreBoundary({ root = A15_REPOSITORY_ROOT } = {}) {
  const closure = buildModuleClosure([A15_CITY_RUNTIME_ROOT], { root });
  const cityModules = closure.modules.filter((file) => file.startsWith(A15_CITY_PREFIX));
  const nonCityModules = closure.modules.filter((file) => !file.startsWith(A15_CITY_PREFIX));
  const allowedContractRoots = Object.freeze(['assets/js/contracts/', 'config/']);
  const allowedContractModules = nonCityModules.filter((file) => allowedContractRoots.some((root) => file.startsWith(root)));
  const nonCityImplementationModules = nonCityModules.filter((file) => !allowedContractRoots.some((root) => file.startsWith(root)));
  const nonCityByCategory = {};
  for (const file of nonCityImplementationModules) {
    const category = classifyCoreModule(file);
    (nonCityByCategory[category] ||= []).push(file);
  }
  for (const files of Object.values(nonCityByCategory)) files.sort();
  return Object.freeze({
    schema: 'eonapp.a15.city-core-boundary-baseline.v1',
    runtimeRoot: A15_CITY_RUNTIME_ROOT,
    moduleCount: closure.modules.length,
    cityModuleCount: cityModules.length,
    nonCityModuleCount: nonCityModules.length,
    allowedContractModuleCount: allowedContractModules.length,
    nonCityImplementationModuleCount: nonCityImplementationModules.length,
    cityModules: Object.freeze(cityModules),
    nonCityModules: Object.freeze(nonCityModules),
    allowedContractModules: Object.freeze(allowedContractModules),
    nonCityImplementationModules: Object.freeze(nonCityImplementationModules),
    nonCityByCategory: Object.freeze(nonCityByCategory),
    unresolved: closure.unresolved,
    target: Object.freeze({ nonCityImplementationModuleCount: 0, allowedContractRoots })
  });
}

export function walkFiles(directory, { root = A15_REPOSITORY_ROOT } = {}) {
  const absolute = absoluteRepoPath(directory, root);
  if (!existsSync(absolute)) return [];
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) visit(next);
      else if (entry.isFile()) files.push(normalizeRepoPath(path.relative(root, next)));
    }
  };
  visit(absolute);
  return files.sort();
}

export function inspectCityStorage({ root = A15_REPOSITORY_ROOT } = {}) {
  const candidateTokens = Object.freeze(['localStorage', 'sessionStorage', 'indexedDB', 'CacheStorage', 'caches', 'navigator.storage']);
  const directPatterns = Object.freeze([
    Object.freeze({ id: 'localStorage', pattern: /\blocalStorage\b/ }),
    Object.freeze({ id: 'sessionStorage', pattern: /\bsessionStorage\b/ }),
    Object.freeze({ id: 'indexedDB', pattern: /\bindexedDB\b/ }),
    Object.freeze({ id: 'CacheStorage', pattern: /\bCacheStorage\b|\bcaches\b/ }),
    Object.freeze({ id: 'navigator.storage', pattern: /\bnavigator\s*\.\s*storage\b/ })
  ]);
  const rows = [];
  const keys = new Set();
  for (const file of walkFiles(A15_CITY_PREFIX, { root }).filter((entry) => /\.(?:mjs|js)$/i.test(entry))) {
    const source = readRepoText(file, root);
    const references = candidateTokens.filter((token) => source.includes(token));
    if (!references.length) continue;
    const mechanisms = directPatterns.filter(({ pattern }) => pattern.test(source)).map(({ id }) => id);
    const fileKeys = [...new Set([...source.matchAll(/["'`]((?:eon|EON)[^"'`\s]{2,160})["'`]/g)].map((match) => match[1]))].sort();
    fileKeys.forEach((key) => keys.add(key));
    rows.push(Object.freeze({ file, references: Object.freeze(references), mechanisms: Object.freeze(mechanisms), directAccess: mechanisms.length > 0, keys: Object.freeze(fileKeys) }));
  }
  const sortedRows = rows.sort((a, b) => a.file.localeCompare(b.file));
  return Object.freeze({
    schema: 'eonapp.a15.city-storage-inventory.v1',
    planningStaticModuleCount: 40,
    observedReferenceModuleCount: sortedRows.length,
    directAccessModuleCount: sortedRows.filter((row) => row.directAccess).length,
    nonAccessReferenceModuleCount: sortedRows.filter((row) => !row.directAccess).length,
    planningCountDiscrepancy: sortedRows.length - 40,
    rows: Object.freeze(sortedRows),
    namedKeys: Object.freeze([...keys].sort())
  });
}

export function inspectA14ToW802BDelta({ root = A15_REPOSITORY_ROOT } = {}) {
  const range = `${A15_A14_BASELINE_COMMIT}..${A15_W802B_SOURCE_COMMIT}`;
  const nameStatus = git(['diff', '--name-status', '--find-renames', range], { root }).split('\n').filter(Boolean);
  const numstatRows = new Map(git(['diff', '--numstat', range], { root }).split('\n').filter(Boolean).map((line) => {
    const [insertions, deletions, ...parts] = line.split('\t');
    return [normalizeRepoPath(parts.at(-1)), { insertions: insertions === '-' ? null : Number(insertions), deletions: deletions === '-' ? null : Number(deletions) }];
  }));
  const rows = nameStatus.map((line) => {
    const [status, ...parts] = line.split('\t');
    const file = normalizeRepoPath(parts.at(-1));
    const stats = numstatRows.get(file) || { insertions: 0, deletions: 0 };
    return Object.freeze({ status, file, ...stats });
  }).sort((a, b) => a.file.localeCompare(b.file));
  return Object.freeze({
    schema: 'eonapp.a15.a14-w802b-delta.v1',
    baseCommit: A15_A14_BASELINE_COMMIT,
    targetCommit: A15_W802B_SOURCE_COMMIT,
    changedFiles: rows.length,
    insertions: rows.reduce((sum, row) => sum + (row.insertions || 0), 0),
    deletions: rows.reduce((sum, row) => sum + (row.deletions || 0), 0),
    rows: Object.freeze(rows)
  });
}

export function classifyA15Ownership(file = '') {
  const normalized = normalizeRepoPath(file);
  if (/^(?:package(?:-lock)?\.json|vite\.config\.|config\/route-contract|eoncity\.html|assets\/js\/eon-app-shell|assets\/js\/eon-work-surface|assets\/js\/share\/eon-share-sheet|assets\/js\/city\/city-(?:world-state|work-mission|mode-transition)|assets\/js\/city\/w659g\/eon-city-w659g-(?:creator-capture|membership-console|progression-ledger))/.test(normalized)) {
    return Object.freeze({ zone: 'red', owner: 'A15 serialized authority', disposition: 'extract-or-edit-serially', reason: 'Cross-product authority or high-collision contract.' });
  }
  if (normalized.startsWith('assets/js/city/')) return Object.freeze({ zone: 'amber', owner: 'EONCITY runtime', disposition: 'keep-active-adapt-no-rewrite', reason: 'Active City/Expanse source with Core-boundary review required.' });
  if (/^(?:assets\/city|public\/city-assets|public\/assets\/city)/.test(normalized)) return Object.freeze({ zone: 'green', owner: 'EONCITY authored assets', disposition: 'keep-content-addressed', reason: 'Isolated authored City/Expanse asset.' });
  if (/^(?:tests|e2e)\//.test(normalized)) return Object.freeze({ zone: 'amber', owner: 'A15 certification', disposition: 'keep-current-test', reason: 'Release evidence must follow current authority.' });
  if (normalized.startsWith('scripts/')) return Object.freeze({ zone: 'amber', owner: 'A15 release tooling', disposition: 'keep-current-tooling', reason: 'Gate/tool changes can affect launch authority.' });
  if (/^(?:docs|release-evidence|evidence|artifacts)\//.test(normalized)) return Object.freeze({ zone: 'green', owner: 'Evidence archive', disposition: 'keep-historical-or-current-evidence', reason: 'Non-runtime evidence or handover material.' });
  if (/^(?:assets\/js|config|functions|migrations|sw\.js|public\/sw\.js)/.test(normalized)) return Object.freeze({ zone: 'red', owner: 'Core/shared authority', disposition: 'review-before-change', reason: 'Shared runtime, backend, storage or release surface.' });
  return Object.freeze({ zone: 'amber', owner: 'Repository authority', disposition: 'review-and-disposition', reason: 'Current delta file requires explicit owner confirmation.' });
}

export function dispositionA15Delta(delta) {
  return Object.freeze(delta.rows.map((row) => Object.freeze({ ...row, ...classifyA15Ownership(row.file) })));
}

export function isTextFile(file = '') {
  return TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
}
