import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'docs/qa/realm3d-screenshots');
const viewports = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1365', width: 1365, height: 900 }
];

if (!fs.existsSync(dist)) {
  console.error('dist/ not found. Run npm run build first.');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const strict = process.argv.includes('--strict');
const server = startStaticServer();
await wait(1600);
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (message) => {
      if (!['error', 'warning'].includes(message.type())) return;
      const text = message.text();
      if (shouldIgnoreConsoleMessage(message.type(), text)) return;
      errors.push(`${message.type()}: ${text}`);
    });
    await page.goto('http://127.0.0.1:4173/realm', { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('[data-eon-city-3d-root]').waitFor({ state: 'visible', timeout: 12000 });
    await page.screenshot({ path: path.join(outDir, `${viewport.name}-realm3d.png`), fullPage: true });
    const hasCanvas = await page.locator('.realm3d-canvas-host canvas').count();
    const shellVisible = await page.locator('.realm3d-shell').isVisible().catch(() => false);
    await page.close();
    if (!shellVisible || !hasCanvas) throw new Error(`${viewport.name}: Realm3D canvas did not render.`);
    if (errors.length) throw new Error(`${viewport.name}: console errors/warnings: ${errors.join('\n')}`);
    console.log(`✅ ${viewport.name} Realm3D screenshot captured`);
  }
  console.log(`\nScreenshots saved to ${outDir}`);
} catch (error) {
  const message = String(error?.message || error);
  if (/Executable doesn't exist|playwright install|browserType\.launch/i.test(message) && !strict) {
    const note = {
      ok: true,
      skipped: true,
      reason: 'Playwright browser binary is not installed in this environment. Run npx playwright install chromium, then npm run qa:realm3d-screenshots -- --strict locally.',
      expectedScreenshots: viewports.map((viewport) => `${viewport.name}-realm3d.png`)
    };
    fs.writeFileSync(path.join(outDir, 'realm3d-screenshot-qa-skipped.json'), JSON.stringify(note, null, 2));
    console.warn(`⚠️ ${note.reason}`);
  } else {
    throw error;
  }
} finally {
  await browser?.close?.();
  server.kill('SIGTERM');
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function startStaticServer() {
  if (process.platform === 'win32') {
    return spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx serve -l 4173 -n --cors dist'], {
      stdio: 'ignore'
    });
  }
  return spawn('npx', ['serve', '-l', '4173', '-n', '--cors', 'dist'], { stdio: 'ignore' });
}

function shouldIgnoreConsoleMessage(type, text) {
  return type === 'warning' && /GPU stall due to ReadPixels/i.test(text);
}
