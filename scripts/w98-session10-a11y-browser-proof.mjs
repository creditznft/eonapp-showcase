import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION10');
const reportPath = path.join(outputDir, 'W98_SESSION10_A11Y_BROWSER_PROOF.json');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(outputDir, { recursive: true });
const report = {
  schema: 'eon.w98.session10.a11y-browser-proof.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  data: {},
  checks: {},
  errors: [],
  ok: false
};
let browser;
try {
  browser = await chromium.launch({
    headless: process.env.W98_HEADLESS !== '0',
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-software-rasterizer']
  });
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon\.ico/i.test(message.text())) report.errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => report.errors.push(`page: ${String(error?.message || error)}`));
  await page.goto(`${baseURL}/realm.html?proof=session10-a11y`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  report.data = await page.evaluate(async () => {
    localStorage.removeItem('eon:realm3d:comfort-preferences:v1');
    const { Session10ComfortRuntime, SESSION10_COMFORT_STORAGE_KEY } = await import('/assets/js/realm3d/engine/EonCitySession10ComfortRuntime.js');
    const host = document.createElement('section');
    host.id = 'session10-a11y-proof-host';
    host.innerHTML = '<span data-realm3d-a11y-live role="status" aria-live="polite"></span>';
    document.body.append(host);
    const live = host.querySelector('[data-realm3d-a11y-live]');
    const basicCalls = [];
    const playerProfiles = [];
    const camera = { fov: 72, updated: 0, updateProjectionMatrix() { this.updated += 1; } };
    const runtime = new Session10ComfortRuntime({
      root: host,
      camera,
      player: { setControlsProfile(profile) { playerProfiles.push(profile); } },
      storage: localStorage,
      getState: () => ({
        map: { kind: 'eon-city', label: 'EON City' },
        player: { x: 6.2, z: 11.6 },
        objective: { label: 'Visit the Workstation' },
        nearest: 'Nearest: Workstation Tower'
      }),
      onBasicDeviceChange: (enabled, meta) => basicCalls.push({ enabled, initial: Boolean(meta?.initial) })
    });
    runtime.mount();
    runtime.setPreference('mouseSensitivity', 1.4);
    runtime.setPreference('fov', 81);
    runtime.setPreference('highContrast', true);
    const summary = runtime.describeWorld();
    await new Promise((resolve) => setTimeout(resolve, 40));
    const result = {
      summary,
      liveText: live.textContent,
      telemetry: runtime.getTelemetry(),
      basicCalls,
      camera: { fov: camera.fov, updated: camera.updated },
      playerProfileCount: playerProfiles.length,
      stored: localStorage.getItem(SESSION10_COMFORT_STORAGE_KEY) || ''
    };
    runtime.destroy();
    host.remove();
    return result;
  });
  report.checks = {
    runtimeRunsInRealBrowser: report.data?.telemetry?.schema === 'eon.realm3d.session10.comfort.v1',
    worldSummaryAnnouncedToLiveRegion: /World summary\. EON City/i.test(report.data?.liveText || '') && report.data?.liveText === report.data?.summary,
    telemetryMatchesLiveAnnouncement: report.data?.telemetry?.lastAnnouncement === report.data?.summary && report.data?.telemetry?.descriptionsRequested === 1,
    basicDeviceCallbackDoesNotRepeat: Array.isArray(report.data?.basicCalls) && report.data.basicCalls.length === 1 && report.data.basicCalls[0]?.initial === true,
    ordinarySettingsStillApply: report.data?.camera?.fov === 81 && report.data?.playerProfileCount >= 4,
    safeStorageOnly: !/apiKey|seedPhrase|privateKey|wallet|token|secret|email/i.test(report.data?.stored || ''),
    noBrowserErrors: report.errors.length === 0
  };
  report.ok = Object.values(report.checks).every(Boolean);
  report.score = Math.round(Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length * 100);
  await context.close();
} catch (error) {
  report.error = String(error?.stack || error);
  report.ok = false;
} finally {
  await browser?.close().catch(() => {});
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
process.exit(report.ok ? 0 : 1);
