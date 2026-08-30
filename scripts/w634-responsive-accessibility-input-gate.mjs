#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getW634PublicFiles,
  validateW634ResponsiveAccessibilityInputContract,
  W634_ROUTE_LAYOUT_OWNERS
} from '../config/w634-responsive-accessibility-input-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function tags(source, pattern) { return [...String(source).matchAll(pattern)].map((match) => match[0]); }
function ids(source) { return [...String(source).matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]); }
function staticDocumentIssues(file) {
  const source = read(file);
  const issues = [];
  const editorialGuide = /\/assets\/css\/eon-guides\.css/.test(source) && /\beon-guide-page\b/.test(source);
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(source)) issues.push('missing-lang');
  if (!/<meta\b[^>]*\bname=["']viewport["']/i.test(source)) issues.push('missing-viewport');
  if (tags(source, /<title\b[^>]*>/gi).length !== 1) issues.push('title-count');
  if (tags(source, /<main\b[^>]*>/gi).length !== 1) issues.push('main-count');
  if (tags(source, /<h1\b[^>]*>/gi).length !== 1) issues.push('h1-count');
  const documentIds = ids(source);
  const duplicates = [...new Set(documentIds.filter((id, index) => documentIds.indexOf(id) !== index))];
  if (duplicates.length) issues.push(`duplicate-id:${duplicates.join(',')}`);
  const skip = source.match(/<a\b[^>]*class=["'][^"']*(?:skip-to-content|eon-guide-skip)[^"']*["'][^>]*href=["']#([^"']+)["'][^>]*>/i)
    || source.match(/<a\b[^>]*href=["']#([^"']+)["'][^>]*class=["'][^"']*(?:skip-to-content|eon-guide-skip)[^"']*["'][^>]*>/i);
  if (!skip) issues.push('missing-skip-link');
  else if (!documentIds.includes(skip[1])) issues.push(`missing-skip-target:${skip[1]}`);
  const images = tags(source, /<img\b[^>]*>/gi).filter((tag) => !/\balt=["'][^"']*["']/i.test(tag));
  if (images.length) issues.push(`missing-image-alt:${images.length}`);
  const unnamedButtons = [...String(source).matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)].filter((match) => {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, 'x').trim();
    return !text && !/\baria-label=["'][^"']+["']/i.test(attrs) && !/\baria-labelledby=["'][^"']+["']/i.test(attrs);
  });
  if (unnamedButtons.length) issues.push(`unnamed-button:${unnamedButtons.length}`);
  if (!/\/assets\/css\/base\.css/.test(source) && !editorialGuide) issues.push('missing-base-css');
  const shellOwned = /data-eon-app-shell=["']1["']/.test(source);
  const directAutoload = /accessibility-autoload\.js/.test(source);
  if (!shellOwned && !directAutoload && !editorialGuide) issues.push('missing-w634-bootstrap-path');
  return Object.freeze(issues);
}

export function inspectW634ResponsiveAccessibilityInput({ writeArtifact = false } = {}) {
  const contract = validateW634ResponsiveAccessibilityInputContract();
  const publicFiles = getW634PublicFiles();
  const documentIssues = Object.freeze(publicFiles.flatMap((file) => staticDocumentIssues(file).map((reason) => Object.freeze({ file, reason }))));
  const moduleSource = read('assets/js/utils/responsive-accessibility-input.js');
  const autoload = read('assets/js/utils/accessibility-autoload.js');
  const baseCss = read('assets/css/base.css');
  const shellCss = read('assets/css/eon-app-shell.css');
  const safetyForbidden = /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|mediaDevices|getUserMedia|getDisplayMedia|requestFullscreen|orientation\.lock|new\s+Audio|AudioContext|getGamepads\s*\(/;
  const checks = [
    Object.freeze({ id: 'contract', pass: contract.ok, detail: `${contract.passed}/${contract.total}` }),
    Object.freeze({ id: 'public-documents', pass: documentIssues.length === 0, detail: `${publicFiles.length} documents; ${documentIssues.length} issues` }),
    Object.freeze({ id: 'layout-owners', pass: Object.keys(W634_ROUTE_LAYOUT_OWNERS).length === 6, detail: `${Object.keys(W634_ROUTE_LAYOUT_OWNERS).length} owners` }),
    Object.freeze({ id: 'autoload-binding', pass: /bindEonResponsiveAccessibilityInput\(\{ announce \}\)/.test(autoload), detail: 'shared bootstrap' }),
    Object.freeze({ id: 'safe-capability-bridge', pass: !safetyForbidden.test(moduleSource), detail: 'no network, permissions, fullscreen, orientation lock, audio or polling' }),
    Object.freeze({ id: 'input-modes', pass: /keyboard/.test(moduleSource) && /pointer/.test(moduleSource) && /touch/.test(moduleSource) && /controller/.test(moduleSource) && /voice/.test(moduleSource), detail: 'five descriptive modes' }),
    Object.freeze({ id: 'form-error-announcement', pass: /aria-invalid/.test(moduleSource) && /validationMessage/.test(moduleSource) && /announce/.test(moduleSource), detail: 'native invalid/input bridge' }),
    Object.freeze({ id: 'touch-target-css', pass: /pointer:\s*coarse/.test(baseCss) && /min-height:\s*44px/.test(baseCss) && /min-width:\s*44px/.test(baseCss), detail: '44px coarse-pointer foundation' }),
    Object.freeze({ id: 'focus-contrast-css', pass: /focus-visible/.test(baseCss) && /forced-colors:\s*active/.test(baseCss), detail: 'visible focus and forced colors' }),
    Object.freeze({ id: 'reduced-motion-css', pass: /prefers-reduced-motion:\s*reduce/.test(baseCss) && /scroll-behavior:\s*auto/.test(baseCss), detail: 'motion preference honored' }),
    Object.freeze({ id: 'zoom-wrap-css', pass: /overflow-wrap:\s*anywhere/.test(baseCss) && /min-width:\s*0/.test(baseCss), detail: 'narrow/zoom overflow foundation' }),
    Object.freeze({ id: 'short-landscape-shell', pass: /max-height:\s*520px/.test(shellCss) && /orientation:\s*landscape/.test(shellCss) && /safe-area-inset-top/.test(shellCss), detail: 'bounded mobile shell' }),
    Object.freeze({ id: 'physical-evidence-honest', pass: contract.physicalEvidenceCertified === false, detail: 'source only; real devices pending' })
  ];
  const result = Object.freeze({
    schema: 'eonapp.gate.w634-responsive-accessibility-input.2026-07-11.v1',
    wave: 'W634',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks: Object.freeze(checks),
    documentIssues,
    publicFileCount: publicFiles.length,
    physicalEvidenceCertified: false,
    limitations: Object.freeze(['Static source certification only.', 'Physical device, browser, PWA, zoom, screen-reader, speech and controller evidence remains pending.'])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts/w634-responsive-accessibility-input');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

const result = inspectW634ResponsiveAccessibilityInput({ writeArtifact: process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) });
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} — ${check.detail}`);
  for (const issue of result.documentIssues) console.log(`FAIL document ${issue.file} — ${issue.reason}`);
  console.log(`\nW634 responsive/accessibility/input: ${result.passed}/${result.total}`);
  if (!result.ok) process.exitCode = 1;
}
