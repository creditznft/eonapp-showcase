import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const outputDir = path.resolve('CodexAuditPack/W98_SESSION11');
const logsDir = path.join(outputDir, 'logs');
fs.mkdirSync(logsDir, { recursive: true });
const scenarios = ['desktop', 'mobile'];
const reports = [];
let failed = false;
for (const scenario of scenarios) {
  const result = spawnSync(process.execPath, ['scripts/w98-session11-endurance-scenario.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, W98_SCENARIO: scenario, W98_OUTPUT_DIR: outputDir },
    encoding: 'utf8',
    timeout: 150000
  });
  fs.writeFileSync(path.join(logsDir, `session11-${scenario}-endurance.log`), `${result.stdout || ''}\n${result.stderr || ''}`);
  const reportPath = path.join(outputDir, `W98_SESSION11_${scenario.toUpperCase()}_ENDURANCE.json`);
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : { scenario, ok: false, error: 'Report missing' };
  reports.push(report);
  if (result.status !== 0 || !report.ok) failed = true;
}
const assertions = reports.flatMap((report) => Object.entries(report.assertions || {}).map(([name, pass]) => ({ scenario: report.scenario, name, pass: Boolean(pass) })));
const summary = {
  schema: 'eon.w98.session11.endurance-proof.v1',
  capturedAt: new Date().toISOString(),
  scenarios: reports.map((report) => ({ scenario: report.scenario, ok: report.ok, durationMs: report.durationMs, errors: report.errors || [] })),
  passed: assertions.filter((item) => item.pass).length,
  total: assertions.length,
  score: assertions.length ? Math.round(assertions.filter((item) => item.pass).length / assertions.length * 100) : 0,
  assertions,
  ok: !failed && assertions.length > 0 && assertions.every((item) => item.pass)
};
fs.writeFileSync(path.join(outputDir, 'W98_SESSION11_ENDURANCE_PROOF.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.ok ? 0 : 1);
