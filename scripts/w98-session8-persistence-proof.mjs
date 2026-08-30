import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION8');
const desktopReportPath = path.join(outputDir, 'W98_SESSION8_PUBLIC_BROWSER_PROOF.json');
const reportPath = path.join(outputDir, 'W98_SESSION8_PERSISTENCE_PROOF.json');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const prior = JSON.parse(fs.readFileSync(desktopReportPath, 'utf8'));
const initialStorage = prior.desktop?.final?.storedText;
if (!initialStorage) throw new Error('Desktop Session 8 proof storage is unavailable.');

const report = { schema: 'eon.w98.session8.persistence-proof.v1', capturedAt: new Date().toISOString(), baseURL, checks: {}, errors: [] };
const browser = await chromium.launch({
  headless: false,
  executablePath,
  chromiumSandbox: false,
  args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--disable-vulkan','--disable-features=Translate,OptimizationHints']
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|sandboxed and lacks/i.test(m.text())) report.errors.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => report.errors.push(`page: ${String(e?.message || e)}`));
await page.addInitScript(({ storage }) => {
  localStorage.setItem('eon:realm3d:mission-progress:v2', storage);
  localStorage.setItem('eonapp.test.secret-marker', 'SESSION8_SECRET_MUST_NOT_RENDER');
  localStorage.setItem('eonapp.api.key.test', 'REDACTED_OPENAI_KEY');
}, { storage: initialStorage });

function snapshot() {
  return page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const mission = engine.missions.getSnapshot();
    return {
      audience: mission.audience,
      activeMissionId: mission.activeMission?.id || null,
      objective: mission.currentObjective?.id || null,
      availableMissionIds: mission.availableMissions.map((item) => item.id),
      storedText: localStorage.getItem('eon:realm3d:mission-progress:v2') || '',
      panelOpen: engine.isPanelOpen(),
      playerEnabled: engine.player.enabled
    };
  });
}

try {
  const url = `${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session8-persistence-split`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.missions && document.querySelector('[data-session8-mission-hud]')), null, { timeout: 60000 });
  await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
  await page.waitForTimeout(500);
  report.resumed = await snapshot();

  await page.evaluate(() => window.EON_CITY_3D.switchWorld('private-workstation'));
  await page.waitForTimeout(300);
  if (await page.evaluate(() => window.EON_CITY_3D.isPanelOpen())) await page.evaluate(() => window.EON_CITY_3D.panels.close());
  report.owner = await snapshot();

  await page.evaluate(() => window.EON_CITY_3D.switchWorld('eon-city'));
  await page.waitForTimeout(300);
  if (await page.evaluate(() => window.EON_CITY_3D.isPanelOpen())) await page.evaluate(() => window.EON_CITY_3D.panels.close());
  report.publicRestored = await snapshot();

  report.checks = {
    resumedStatePersists: report.resumed.activeMissionId === prior.desktop.final.mission.activeMissionId && report.resumed.objective === prior.desktop.final.mission.currentObjectiveId,
    ownerProfileSeparated: report.owner.audience === 'owner-private' && report.owner.activeMissionId === 'owner-operator-check' && !report.owner.availableMissionIds.includes('first-arrival'),
    publicProfileRestored: report.publicRestored.audience === 'public-visitor' && report.publicRestored.activeMissionId === report.resumed.activeMissionId,
    progressionLedgerSecretSafe: !/SESSION8_SECRET_MUST_NOT_RENDER|REDACTED_OPENAI_KEY|apiKey|seedPhrase|privateKey|walletAddress/i.test(report.resumed.storedText),
    noBrowserErrors: report.errors.length === 0
  };
  report.ok = Object.values(report.checks).every(Boolean);
  report.score = Math.round(Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length * 100);
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
} finally {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1500))]);
}
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
