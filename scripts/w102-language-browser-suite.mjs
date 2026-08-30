#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve('CodexAuditPack/W102_LANGUAGE_TRUTH_REBUILD/browser');
const reportPath = path.join(outputDir, 'W102_LANGUAGE_BROWSER_PROOF.json');
const runnerPath = path.resolve('scripts/w102-language-browser-proof.mjs');
fs.mkdirSync(outputDir, { recursive: true });

const parts = [
  { name: 'route', output: 'W102_LANGUAGE_BROWSER_ROUTE.json', phases: 'route' },
  { name: 'pairs-a', output: 'W102_LANGUAGE_BROWSER_PAIRS_A.json', phases: 'pairs', langs: 'en,es,zh,ja,ko,fr' },
  { name: 'pairs-b', output: 'W102_LANGUAGE_BROWSER_PAIRS_B.json', phases: 'pairs', langs: 'de,pt,ru,ar,hi' },
  { name: 'restore', output: 'W102_LANGUAGE_BROWSER_RESTORE.json', phases: 'restore' },
  { name: 'mobile', output: 'W102_LANGUAGE_BROWSER_MOBILE.json', phases: 'mobile' }
];

const reports = [];
for (const part of parts) {
  console.log(`\n[W102 browser suite] starting ${part.name}`);
  const result = spawnSync(process.execPath, [runnerPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      W102_PHASES: part.phases,
      ...(part.langs ? { W102_LANGS: part.langs } : {})
    },
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    console.error(`[W102 browser suite] ${part.name} failed with status ${result.status}`);
    process.exit(result.status || 1);
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const partPath = path.join(outputDir, part.output);
  fs.writeFileSync(partPath, `${JSON.stringify(report, null, 2)}\n`);
  reports.push({ part, report });
}

const first = reports[0].report;
const aggregate = {
  schema: 'eon.w102.language-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL: first.baseURL,
  releaseLanguages: first.releaseLanguages,
  execution: {
    mode: 'isolated phased browser matrix',
    parts: parts.map((part) => part.output),
    externalPolicy: 'Third-party scripts blocked; packaged app assets only. This prevents Telegram/ad/provider availability from contaminating deterministic language proof.'
  },
  routeSweep: [],
  languagePairs: [],
  englishRestore: [],
  mobileLayout: [],
  screenshots: [],
  checks: [],
  unexpectedErrors: [],
  expectedEnvironmentNotes: []
};

for (const { report } of reports) {
  aggregate.routeSweep.push(...(report.routeSweep || []));
  aggregate.languagePairs.push(...(report.languagePairs || []));
  aggregate.englishRestore.push(...(report.englishRestore || []));
  aggregate.mobileLayout.push(...(report.mobileLayout || []));
  aggregate.screenshots.push(...(report.screenshots || []));
  aggregate.unexpectedErrors.push(...(report.unexpectedErrors || []));
  aggregate.expectedEnvironmentNotes.push(...(report.expectedEnvironmentNotes || []));
  aggregate.checks.push(...(report.checks || []).filter((check) => check.name !== 'zero unexpected browser errors'));
}

aggregate.screenshots = [...new Set(aggregate.screenshots)];
aggregate.unexpectedErrors = [...new Set(aggregate.unexpectedErrors)];
aggregate.expectedEnvironmentNotes = [...new Set(aggregate.expectedEnvironmentNotes)].slice(0, 100);
aggregate.checks.push({
  name: 'zero unexpected browser errors',
  passed: aggregate.unexpectedErrors.length === 0,
  detail: aggregate.unexpectedErrors
});
aggregate.passedChecks = aggregate.checks.filter((check) => check.passed).length;
aggregate.totalChecks = aggregate.checks.length;
aggregate.ok = aggregate.passedChecks === aggregate.totalChecks;
aggregate.summary = {
  routeSweep: aggregate.routeSweep.length,
  languagePairs: aggregate.languagePairs.length,
  englishRestore: aggregate.englishRestore.length,
  mobileLayout: aggregate.mobileLayout.length,
  screenshots: aggregate.screenshots.length,
  unexpectedErrors: aggregate.unexpectedErrors.length
};

fs.writeFileSync(reportPath, `${JSON.stringify(aggregate, null, 2)}\n`);
console.log('\n[W102 browser suite] aggregate result');
console.log(JSON.stringify({
  ok: aggregate.ok,
  passedChecks: aggregate.passedChecks,
  totalChecks: aggregate.totalChecks,
  ...aggregate.summary
}, null, 2));
process.exit(aggregate.ok ? 0 : 1);
