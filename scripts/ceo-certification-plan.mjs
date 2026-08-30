#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildCEOCertificationPlan,
  validateCEOCertificationPlan
} from '../assets/js/utils/ceo-master-certification.js';

const plan = buildCEOCertificationPlan({ date: '2026-06-02' });
const validation = validateCEOCertificationPlan(plan);

function renderMarkdown(plan, validation) {
  const lines = [];
  lines.push('# EONAPP CEO Master Certification Plan — Waves 14/15/16');
  lines.push('');
  lines.push(`Date: ${plan.date}`);
  lines.push(`Schema: ${plan.schema}`);
  lines.push(`Launch stance: **${plan.launchStance}**`);
  lines.push('');
  lines.push('## Validation');
  lines.push(validation.ok ? '- Status: PASS' : '- Status: FAIL');
  if (!validation.ok) validation.problems.forEach((problem) => lines.push(`- ${problem}`));
  lines.push('');
  lines.push('## Three extra CEO waves');
  for (const wave of plan.extraWaves) {
    lines.push(`### ${wave.title}`);
    lines.push(`Objective: ${wave.objective}`);
    lines.push(`Outcome: ${wave.outcome}`);
    lines.push('Code focus:');
    wave.codeFocus.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }
  lines.push('## Old audit gap status');
  lines.push(`- Total tracked gaps: ${plan.oldAuditGapSummary.total}`);
  lines.push(`- Coded/improved: ${plan.oldAuditGapSummary.codedImproved}`);
  lines.push(`- Planned next in final waves: ${plan.oldAuditGapSummary.plannedNext}`);
  lines.push(`- External/live blockers: ${plan.oldAuditGapSummary.externalBlockers}`);
  lines.push('');
  lines.push('| ID | Source | Status | Remaining action | Owner |');
  lines.push('|---|---|---|---|---|');
  for (const gap of plan.oldAuditGaps) {
    lines.push(`| ${gap.id} | ${gap.sourceWave} | ${gap.currentStatus} | ${gap.remainingAction} | ${gap.owner} |`);
  }
  lines.push('');
  lines.push('## Short CEO checklist');
  plan.shortCEOChecklist.forEach((item) => lines.push(`- ${item}`));
  lines.push('');
  lines.push('## Hard stops');
  plan.hardStop.forEach((item) => lines.push(`- ${item}`));
  lines.push('');
  return `${lines.join('\n')}\n`;
}

mkdirSync('CodexDocs', { recursive: true });
const outPath = join('CodexDocs', 'EONAPP_WAVE14_15_16_CEO_MASTER_CERTIFICATION_PLAN_2026-06-02.md');
writeFileSync(outPath, renderMarkdown(plan, validation));
console.log(`Wrote ${outPath}`);
console.log(validation.ok ? 'CEO certification plan: PASS' : `CEO certification plan: FAIL (${validation.problems.join('; ')})`);
if (!validation.ok) process.exit(1);
