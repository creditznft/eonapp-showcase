#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { inspectW652EntryFirstImpression } from './w652-eoncity-entry-first-impression-audit.mjs';
import { inspectW653ControlWorkspace } from './w653-eoncity-control-workspace-audit.mjs';
import { inspectW654TechnicalRedTeam } from './w654-eoncity-technical-update-red-team-audit.mjs';
const root = process.cwd();
const requiredDocs = [
  'docs/release-records/W652_ENTRY_FIRST_IMPRESSION_AUDIT_2026-07-14.md',
  'docs/release-records/W653_CONTROL_WORKSPACE_PRODUCTIVITY_ENTERTAINMENT_AUDIT_2026-07-14.md',
  'docs/release-records/W654_TECHNICAL_UPDATE_PERFORMANCE_RED_TEAM_2026-07-14.md',
  'docs/release-records/W652_W654_CEO_SCORECARD_AND_DECISIONS_2026-07-14.md',
  'docs/release-records/W654_CODEX_PREVIEW_VISUAL_CERTIFICATION_HANDOVER_2026-07-14.md'
];
export function inspectW654GrandCeoAudit() {
  const waves = [inspectW652EntryFirstImpression(), inspectW653ControlWorkspace(), inspectW654TechnicalRedTeam()];
  const failures = [];
  for (const wave of waves) if (!wave.ok || wave.executivePrevisualScore < 95) failures.push(`${wave.schema}:${wave.failures?.join(',') || wave.executivePrevisualScore}`);
  for (const file of requiredDocs) if (!fs.existsSync(path.join(root, file))) failures.push(`missing:${file}`);
  const weighted = Number((waves.reduce((sum, wave) => sum + wave.executivePrevisualScore, 0) / waves.length).toFixed(2));
  if (weighted < 95) failures.push(`weighted-score-below-95:${weighted}`);
  return Object.freeze({ schema: 'eonapp.w654.grand-ceo-audit-gate.v1', ok: failures.length === 0, generatedAt: new Date().toISOString(), weightedPrevisualReadiness: weighted, visualCertificationPending: true, productionBlocked: true, waveScores: Object.freeze(waves.map((wave) => Object.freeze({ schema: wave.schema, score: wave.executivePrevisualScore }))), failures: Object.freeze(failures) });
}
const report = inspectW654GrandCeoAudit();
const output = path.join(root, 'reports', 'w654', 'W654_GRAND_CEO_AUDIT_RECEIPT_2026-07-14.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, report: path.relative(root, output), weightedPrevisualReadiness: report.weightedPrevisualReadiness, visualCertificationPending: true, productionBlocked: true }, null, 2));
