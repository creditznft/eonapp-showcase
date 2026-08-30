import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const gamesRoot = path.join(root, 'games');
const reportDir = path.join(root, 'docs');
const reportPath = path.join(reportDir, 'GAMEPLAY-QUALITY-PASS.md');

function safeRead(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function collectJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const stats = statSync(abs);
    if (stats.isDirectory()) {
      out.push(...collectJsFiles(abs));
      continue;
    }
    if (entry.toLowerCase().endsWith('.js')) {
      out.push(abs);
    }
  }
  return out;
}

function checkSignals(content) {
  const fps = /requestAnimationFrame|setInterval|gameLoop|render\(/i.test(content);
  const restart = /restart|resetGame|newGame|playAgain|startGame|retry/i.test(content);
  const persistence = /localStorage|bestScore|highscore|save|load/i.test(content);
  const mobile = /touchstart|touchend|pointerdown|ontouch|mobile|swipe/i.test(content);
  const share = /navigator\.share|clipboard|challenge|share|copy/i.test(content);
  return { fps, restart, persistence, mobile, share };
}

function scoreChecklist(checks) {
  return Number(checks.fps) + Number(checks.restart) + Number(checks.persistence) + Number(checks.mobile) + Number(checks.share);
}

function icon(value) {
  return value ? 'PASS' : 'WARN';
}

function collectGameEntries() {
  const entries = [];
  for (const name of readdirSync(gamesRoot)) {
    const abs = path.join(gamesRoot, name);
    if (!statSync(abs).isDirectory()) continue;
    const jsFiles = collectJsFiles(abs);
    const content = jsFiles.map((file) => safeRead(file)).join('\n');
    const checks = checkSignals(content);
    entries.push({
      game: name,
      checks,
      score: scoreChecklist(checks),
      files: jsFiles.length
    });
  }
  return entries.sort((a, b) => b.score - a.score || a.game.localeCompare(b.game));
}

function recommendations(entry) {
  const out = [];
  if (!entry.checks.fps) out.push('Add stable frame loop instrumentation');
  if (!entry.checks.restart) out.push('Add explicit restart/play-again action');
  if (!entry.checks.persistence) out.push('Persist best score and session summary');
  if (!entry.checks.mobile) out.push('Add mobile-first pointer/touch controls');
  if (!entry.checks.share) out.push('Add challenge/share CTA with copy link');
  return out.length ? out.join('; ') : 'No blockers detected by static checklist';
}

function buildReport(entries) {
  const lines = [];
  lines.push('# Gameplay Quality Pass');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Checklist: FPS stability, restart loop, score persistence, mobile controls, share/challenge flow.');
  lines.push('');
  lines.push('| Game | FPS | Restart | Score Persist | Mobile | Share | Score/5 | JS Files | Recommendation |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const entry of entries) {
    lines.push(`| ${entry.game} | ${icon(entry.checks.fps)} | ${icon(entry.checks.restart)} | ${icon(entry.checks.persistence)} | ${icon(entry.checks.mobile)} | ${icon(entry.checks.share)} | ${entry.score} | ${entry.files} | ${recommendations(entry)} |`);
  }
  lines.push('');
  lines.push('## Priority Targets');
  entries
    .filter((entry) => entry.score < 4)
    .slice(0, 6)
    .forEach((entry, idx) => {
      lines.push(`${idx + 1}. ${entry.game} (${entry.score}/5): ${recommendations(entry)}`);
    });
  return lines.join('\n');
}

const entries = collectGameEntries();
const report = buildReport(entries);

if (!existsSync(reportDir)) {
  mkdirSync(reportDir, { recursive: true });
}
writeFileSync(reportPath, report, 'utf8');
console.log(`Gameplay quality report written to ${path.relative(root, reportPath)}`);
