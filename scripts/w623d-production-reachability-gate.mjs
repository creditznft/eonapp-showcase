#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  W623D_ARCHITECTURE_RULES,
  W623D_QUARANTINED_EXACT_PATHS,
  W623D_QUARANTINED_PREFIXES,
  W623D_REACHABILITY_SCHEMA,
  isW623DQuarantinedPath,
  validateW623DReachability
} from '../config/w623d-production-reachability-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'w623d-production-reachability');
const REPORT_FILE = path.join(REPORT_DIR, 'graph.json');
const normalize = (value = '') => String(value || '').replaceAll('\\', '/').replace(/^\.\//, '');
const relative = (value = '') => normalize(path.relative(ROOT, value));

function listFunctionEntries() {
  const root = path.join(ROOT, 'functions');
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && /\.(?:m?js)$/i.test(entry.name)) files.push(absolute);
    }
  };
  if (fs.existsSync(root)) walk(root);
  return files.sort();
}

function scriptEntriesFromHtml(htmlFiles) {
  const entries = [];
  const direct = [];
  const expression = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  for (const file of htmlFiles) {
    const absolute = path.join(ROOT, file);
    if (!fs.existsSync(absolute)) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    let match;
    while ((match = expression.exec(source))) {
      const specifier = String(match[1] || '').split(/[?#]/)[0];
      let resolved = null;
      if (specifier.startsWith('/')) resolved = path.join(ROOT, specifier.slice(1));
      else if (specifier.startsWith('.')) resolved = path.resolve(path.dirname(absolute), specifier);
      if (!resolved) continue;
      entries.push(resolved);
      direct.push(Object.freeze({ html: file, script: relative(resolved) }));
    }
  }
  return { entries, direct };
}

function resolveImport(specifier, importer) {
  const value = String(specifier || '').split(/[?#]/)[0];
  if (value.startsWith('/')) return path.join(ROOT, value.slice(1));
  if (value.startsWith('.')) return path.resolve(path.dirname(importer), value);
  return null;
}

function buildGraph(entries) {
  const reachable = new Set();
  const missing = new Set();
  const edges = [];
  const queue = [...new Set(entries)];
  const expression = /(?:import|export)\s+(?:[^'"()]*?\s+from\s*)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while (queue.length) {
    const absolute = queue.shift();
    if (reachable.has(absolute)) continue;
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
      missing.add(relative(absolute));
      continue;
    }
    reachable.add(absolute);
    if (!/\.(?:m?js)$/i.test(absolute)) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    let match;
    while ((match = expression.exec(source))) {
      const specifier = match[1] || match[2];
      const target = resolveImport(specifier, absolute);
      if (!target) continue;
      edges.push(Object.freeze({ from: relative(absolute), to: relative(target) }));
      if (!reachable.has(target)) queue.push(target);
    }
  }
  return {
    reachable: [...reachable].map(relative).sort(),
    missing: [...missing].sort(),
    edges: edges.sort((a, b) => `${a.from}>${a.to}`.localeCompare(`${b.from}>${b.to}`))
  };
}

const routeContract = await import(pathToFileURL(path.join(ROOT, 'config', 'route-contract.mjs')).href);
const routeRows = [
  ...routeContract.PRIMARY_APP_ROUTES,
  ...routeContract.INFORMATIONAL_ROUTES,
  ...routeContract.COMPATIBILITY_ROUTES
];
const htmlFiles = [...new Set(routeRows.map((row) => row.file).filter(Boolean).concat(['404.html', 'offline.html']))].sort();
const html = scriptEntriesFromHtml(htmlFiles);
const functionEntries = listFunctionEntries();
const entries = [...html.entries, ...functionEntries, path.join(ROOT, 'sw.js')];
const graph = buildGraph(entries);
const validation = validateW623DReachability({ reachable: graph.reachable });
const directQuarantine = html.direct.filter((entry) => isW623DQuarantinedPath(entry.script));
const reachableQuarantine = graph.reachable.filter(isW623DQuarantinedPath);
const missingEntrypoints = graph.missing.filter((entry) => entries.some((absolute) => relative(absolute) === entry));
const errors = [
  ...validation.errors,
  ...directQuarantine.map((entry) => `Production HTML ${entry.html} directly loads quarantined script ${entry.script}.`),
  ...missingEntrypoints.map((entry) => `Production entrypoint is missing: ${entry}.`)
];

const report = {
  schema: W623D_REACHABILITY_SCHEMA,
  generatedAt: new Date().toISOString(),
  ok: errors.length === 0,
  architecture: W623D_ARCHITECTURE_RULES,
  counts: {
    htmlFiles: htmlFiles.length,
    browserScriptEntries: html.entries.length,
    cloudflareFunctionEntries: functionEntries.length,
    totalEntries: new Set(entries).size,
    reachableFiles: graph.reachable.length,
    importEdges: graph.edges.length,
    quarantinedReachable: reachableQuarantine.length
  },
  htmlFiles,
  directHtmlScripts: html.direct,
  functionEntries: functionEntries.map(relative),
  reachable: graph.reachable,
  edges: graph.edges,
  missing: graph.missing,
  quarantine: {
    exact: W623D_QUARANTINED_EXACT_PATHS,
    prefixes: W623D_QUARANTINED_PREFIXES,
    reachable: reachableQuarantine,
    sourcePresentButUnreachable: W623D_QUARANTINED_EXACT_PATHS.filter((entry) => fs.existsSync(path.join(ROOT, entry)) && !graph.reachable.includes(entry))
  },
  errors
};
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  schema: report.schema,
  ok: report.ok,
  counts: report.counts,
  report: relative(REPORT_FILE),
  errors: report.errors
}, null, 2));
if (!report.ok) process.exit(1);
