#!/usr/bin/env node
/** W127 compatibility gate — truthful interactive routes after W375. */
import fs from 'node:fs';
import path from 'node:path';
import { auditMarketIntelligenceSafety } from './w375-market-intelligence-safety-gate.mjs';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const criticalPages = ['telegram.html', 'chat.html', 'market.html', 'workspace.html', 'trade.html', 'support.html', 'realm-studio.html'];
const failures = [];
const requireContains = (file, pattern, label) => {
  if (!exists(file) || !pattern.test(read(file))) failures.push(`${file}: missing ${label}`);
};

for (const file of criticalPages) {
  if (!exists(file)) failures.push(`${file}: missing critical page`);
  else {
    const html = read(file);
    if (/href=["']#["']/i.test(html)) failures.push(`${file}: silent href="#" found`);
    if (/href=["']javascript:/i.test(html)) failures.push(`${file}: javascript: href found`);
  }
}

requireContains('market.html', /eon-market-v2|Market/, 'current Market surface');
requireContains('workspace.html', /Build OS|Workspace/i, 'workspace surface');
requireContains('trade.html', /Research Lab/, 'Research Lab label');
requireContains('trade.html', /Import your CSV/, 'local CSV research flow');
requireContains('trade.html', /Scenario Studio/, 'non-economic Scenario Studio');
requireContains('trade.html', /Export safety receipt/, 'local receipt export');
requireContains('support.html', /EONBOT Support Center/, 'EONBOT support center');
requireContains('assets/js/utils/button-truth-guard.js', /initButtonTruthGuard/, 'button truth runtime guard');
requireContains('assets/js/utils/button-truth-registry.js', /W127_CRITICAL_FLOWS/, 'button truth registry');
const marketSafety = auditMarketIntelligenceSafety({ root });
if (!marketSafety.ok) failures.push(`Research Lab safety gate: ${marketSafety.failures.map((item) => item.id).join(', ')}`);

const stats = {
  wave: 'W127_BUTTON_TRUTH_COMPATIBILITY_W375',
  generatedAt: new Date().toISOString(),
  score: failures.length ? 0 : 100,
  criticalPages: criticalPages.length,
  silentDeadHrefFailures: failures.filter((failure) => failure.includes('href')).length,
  marketIntelligence: marketSafety.boundary,
  failures
};
const outDir = path.join(root, 'artifacts');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'W127_BUTTON_TRUTH_STATS_W375.json'), JSON.stringify(stats, null, 2));
if (failures.length) {
  console.error('W127 button truth compatibility gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`W127 button truth compatibility gate passed: ${criticalPages.length} critical pages, no silent dead hrefs, score ${stats.score}.`);
