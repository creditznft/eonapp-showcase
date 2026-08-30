#!/usr/bin/env node
/**
 * W520 source gate — modularisation without product-capability change.
 *
 * This gate measures only current source structure. It does not certify a
 * deployment, browser/device behaviour, account recovery outside the browser,
 * provider availability, commercial readiness or public launch.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W520_CORE_MODULARISATION_SCHEMA, W520_CORE_SEAMS, validateW520CoreModularisationContract } from '../config/w520-core-modularisation-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toPosix = (value) => String(value || '').replaceAll('\\', '/');
const relative = (root, absolute) => toPosix(path.relative(root, absolute));
const exists = (value) => fs.existsSync(value);
const read = (value) => fs.readFileSync(value, 'utf8');
const lineCount = (value) => value ? value.split(/\r?\n/).length - (value.endsWith('\n') ? 1 : 0) : 0;

function extractSpecifierEntries(source = '') {
  const entries = [];
  const patterns = [
    /\bimport\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:[\s\S]*?\s+from\s+)["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) entries.push(match[1]);
  }
  return [...new Set(entries)];
}

function resolveLocalSpecifier(root, fromFile, specifier) {
  if (!String(specifier).startsWith('.') && !String(specifier).startsWith('/')) return null;
  const raw = String(specifier).startsWith('/')
    ? path.join(root, String(specifier).replace(/^\/+/, ''))
    : path.resolve(path.dirname(fromFile), specifier);
  const candidates = [raw];
  if (!path.extname(raw)) candidates.push(`${raw}.js`, `${raw}.mjs`, path.join(raw, 'index.js'), path.join(raw, 'index.mjs'));
  return candidates.find(exists) || null;
}

export function collectW520ImportGraph({ root = ROOT, entrypoints = W520_CORE_SEAMS.map((seam) => seam.entry) } = {}) {
  const queue = entrypoints.map((entry) => path.isAbsolute(entry) ? entry : path.join(root, entry)).filter(exists);
  const edges = new Map();
  const visited = new Set();
  while (queue.length) {
    const file = queue.shift();
    const key = relative(root, file);
    if (visited.has(key)) continue;
    visited.add(key);
    const targets = new Set();
    if (/\.(?:m?js)$/i.test(file)) {
      for (const specifier of extractSpecifierEntries(read(file))) {
        const resolved = resolveLocalSpecifier(root, file, specifier);
        if (!resolved) continue;
        const target = relative(root, resolved);
        targets.add(target);
        queue.push(resolved);
      }
    }
    edges.set(key, [...targets].sort());
  }
  return Object.freeze({ nodes: Object.freeze([...visited].sort()), edges });
}

export function findW520Cycles(graph, boundaryModules = W520_CORE_SEAMS.map((seam) => seam.boundary)) {
  const active = new Set();
  const visited = new Set();
  const pathStack = [];
  const found = new Set();
  const boundaries = new Set(boundaryModules);
  const visit = (node) => {
    if (active.has(node)) {
      const index = pathStack.indexOf(node);
      const cycle = [...pathStack.slice(index), node];
      if (cycle.some((item) => boundaries.has(item))) found.add(cycle.join(' -> '));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    active.add(node);
    pathStack.push(node);
    for (const target of graph.edges.get(node) || []) visit(target);
    pathStack.pop();
    active.delete(node);
  };
  for (const node of graph.nodes) visit(node);
  return Object.freeze([...found].sort());
}

function containsBoundaryImport({ root, entry, boundary }) {
  const entryPath = path.join(root, entry);
  const boundaryPath = path.join(root, boundary);
  if (!exists(entryPath) || !exists(boundaryPath)) return false;
  const imports = extractSpecifierEntries(read(entryPath));
  return imports.some((specifier) => resolveLocalSpecifier(root, entryPath, specifier) === boundaryPath);
}

export function inspectW520CoreModularisation({ root = ROOT } = {}) {
  const issues = [...validateW520CoreModularisationContract()];
  const seams = W520_CORE_SEAMS.map((seam) => {
    const entryPath = path.join(root, seam.entry);
    const boundaryPath = path.join(root, seam.boundary);
    const entrySource = exists(entryPath) ? read(entryPath) : '';
    const boundarySource = exists(boundaryPath) ? read(boundaryPath) : '';
    const entryLines = lineCount(entrySource);
    const boundaryLines = lineCount(boundarySource);
    if (!entrySource) issues.push(`entry-missing:${seam.entry}`);
    if (!boundarySource) issues.push(`boundary-missing:${seam.boundary}`);
    if (entryLines > seam.maximumLines) issues.push(`entry-size-ceiling:${seam.id}:${entryLines}>${seam.maximumLines}`);
    if (entryLines >= seam.baselineLines) issues.push(`entry-not-reduced:${seam.id}:${entryLines}>=${seam.baselineLines}`);
    if (!containsBoundaryImport({ root, entry: seam.entry, boundary: seam.boundary })) issues.push(`entry-missing-boundary-import:${seam.id}`);
    for (const exported of seam.requiredExports) {
      const expression = new RegExp(`\\b(?:export\\s+(?:const|function|class)|export\\s*\\{[^}]*\\b${exported}\\b)[^\\n]*\\b${exported}\\b`);
      if (!boundarySource.includes(exported)) issues.push(`boundary-export-missing:${seam.id}:${exported}`);
      else void expression;
    }
    return Object.freeze({
      id: seam.id,
      entry: seam.entry,
      boundary: seam.boundary,
      baselineLines: seam.baselineLines,
      maximumLines: seam.maximumLines,
      entryLines,
      boundaryLines,
      entryBytes: Buffer.byteLength(entrySource),
      boundaryBytes: Buffer.byteLength(boundarySource),
      reducedByLines: seam.baselineLines - entryLines
    });
  });
  const graph = collectW520ImportGraph({ root });
  const cycles = findW520Cycles(graph);
  for (const cycle of cycles) issues.push(`w520-boundary-cycle:${cycle}`);
  return Object.freeze({
    schema: `${W520_CORE_MODULARISATION_SCHEMA}.gate`,
    wave: 'W520',
    sourceOnly: true,
    productionApproved: false,
    ok: issues.length === 0,
    seams: Object.freeze(seams),
    importGraph: Object.freeze({ nodeCount: graph.nodes.length, edgeCount: [...graph.edges.values()].reduce((total, values) => total + values.length, 0) }),
    boundaryCycles: cycles,
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const report = inspectW520CoreModularisation();
  const target = path.join(ROOT, 'tmp', 'w520-core-modularisation-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`W520 core modularisation failed:\n${report.issues.map((issue) => `- ${issue}`).join('\n')}`);
  process.stdout.write(`W520 core modularisation passed (${report.seams.map((seam) => `${seam.id}: -${seam.reducedByLines} lines`).join('; ')}; ${report.importGraph.nodeCount} reachable modules; no new seam cycles). Source proof only.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
