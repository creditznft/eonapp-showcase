#!/usr/bin/env node
/** W266 local-only automated visual capture runner. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import {
  W266_VISUAL_PROOF_LAB_SCHEMA,
  buildW266VisualProofPlan,
  classifyW266CaptureEnvironmentError,
  validateW266VisualProofPlan
} from '../assets/js/utils/w266-visual-proof-lab.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const argValue = (name, fallback = '') => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || fallback) : fallback;
};
const capture = args.has('--capture');
const serve = args.has('--serve');
const localOnly = args.has('--local-only');
const port = Number(argValue('--port', '4173')) || 4173;
const requestedBaseUrl = String(argValue('--base-url', `http://127.0.0.1:${port}`)).replace(/\/$/, '');
const outputDir = path.resolve(ROOT, argValue('--output-dir', path.join('artifacts', 'w266-visual-proof-lab')));

function assertLocalUrl(value) {
  const url = new URL(value);
  const allowed = new Set(['127.0.0.1', 'localhost', '::1']);
  if (!allowed.has(url.hostname)) throw new Error(`W266 local capture refuses non-local target: ${url.hostname}`);
  return url;
}

function safeFileName(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function writeCaptureRun(run, runDir) {
  run.ok = run.captures.length > 0 && run.captures.every((row) => row.status === 'captured');
  run.captureStatus = run.ok ? 'captured' : run.blockedByEnvironment ? 'blocked-environment' : 'failed';
  const manifestPath = path.join(runDir, 'visual-run.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(run, null, 2)}\n`);
  const captured = run.captures.filter((row) => row.status === 'captured').length;
  console.log(`[W266] ${run.ok ? 'PASS' : run.blockedByEnvironment ? 'BLOCKED' : 'FAIL'} local capture: ${captured}/${run.captures.length} screenshots.`);
  console.log(`[W266] manifest: ${path.relative(ROOT, manifestPath).replaceAll('\\', '/')}`);
  if (run.remoteRequestsObserved.length) console.log(`[W266] observed remote requests: ${run.remoteRequestsObserved.length} (recorded; investigate before any external claim).`);
  return run;
}

function blockedResult(captureDefinition, target, classification, error) {
  return {
    id: captureDefinition.id,
    route: captureDefinition.route,
    profileId: captureDefinition.profileId,
    url: `${target.origin}${captureDefinition.route}`,
    status: 'blocked-environment',
    blocker: classification.message,
    blockerCode: classification.code,
    error: String(error?.message || error).slice(0, 700),
    consoleErrors: []
  };
}

async function capturePlan(plan, { localServerPreflight = null } = {}) {
  if (!localOnly) throw new Error('W266 capture requires --local-only so it cannot be mistaken for external deployment evidence.');
  const target = assertLocalUrl(plan.baseUrl);
  const { chromium } = await import('playwright');
  fs.mkdirSync(outputDir, { recursive: true });
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(outputDir, runId);
  fs.mkdirSync(runDir, { recursive: true });
  const run = {
    schema: W266_VISUAL_PROOF_LAB_SCHEMA,
    type: 'local-automated-capture-run',
    runId,
    baseUrl: target.origin,
    localOnly: true,
    realDeviceEvidence: false,
    pwaEvidence: false,
    humanVisualApproval: false,
    captures: [],
    remoteRequestsObserved: [],
    blockedByEnvironment: false,
    localServerPreflight,
    limitations: [
      'This is local Chromium emulation only.',
      'No City Play action, mission, credential, Vault record, wallet, provider, payment, reward, token, loot, referral, or commerce flow is exercised.',
      'Screenshots do not certify visual quality, accessibility, PWA update/rollback, device support, or release readiness.'
    ]
  };

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  } catch (error) {
    const classification = classifyW266CaptureEnvironmentError(error);
    if (!classification.blocked) throw error;
    run.blockedByEnvironment = true;
    for (const captureDefinition of plan.captures) run.captures.push(blockedResult(captureDefinition, target, classification, error));
    return writeCaptureRun(run, runDir);
  }

  try {
    for (const captureDefinition of plan.captures) {
      const profile = {
        viewport: captureDefinition.viewport,
        deviceScaleFactor: captureDefinition.profileId === 'mobile-chrome-emulated' ? 2 : 1,
        isMobile: captureDefinition.profileId === 'mobile-chrome-emulated',
        hasTouch: captureDefinition.profileId === 'mobile-chrome-emulated'
      };
      const context = await browser.newContext(profile);
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('request', (request) => {
        try {
          const requestUrl = new URL(request.url());
          if (requestUrl.origin !== target.origin) {
            run.remoteRequestsObserved.push({ captureId: captureDefinition.id, origin: requestUrl.origin, resourceType: request.resourceType() });
          }
        } catch {}
      });
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(String(message.text()).slice(0, 500));
      });
      page.on('pageerror', (error) => consoleErrors.push(String(error?.message || error).slice(0, 500)));
      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem('eon:w266:local-visual-fixture:v1', JSON.stringify({ fixture: 'test-safe', noPrivateData: true }));
        } catch {}
      });
      if (captureDefinition.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
      const url = `${target.origin}${captureDefinition.route}`;
      const result = { id: captureDefinition.id, route: captureDefinition.route, profileId: captureDefinition.profileId, url, status: 'failed', consoleErrors };
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(500);
        if (!response || response.status() >= 400) throw new Error(`HTTP ${response?.status?.() || 'no-response'}`);
        const filename = `${safeFileName(captureDefinition.id)}.png`;
        await page.screenshot({ path: path.join(runDir, filename), fullPage: true });
        result.status = 'captured';
        result.file = filename;
        result.httpStatus = response.status();
      } catch (error) {
        result.error = String(error?.message || error).slice(0, 700);
        const classification = classifyW266CaptureEnvironmentError(error);
        if (classification.blocked) {
          result.status = 'blocked-environment';
          result.blocker = classification.message;
          result.blockerCode = classification.code;
          run.blockedByEnvironment = true;
        }
      } finally {
        run.captures.push(result);
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
  }
  return writeCaptureRun(run, runDir);
}

const plan = buildW266VisualProofPlan({ baseUrl: requestedBaseUrl });
const validation = validateW266VisualProofPlan(plan);
if (!validation.ok) {
  console.error('[W266] Invalid visual proof plan:');
  for (const error of validation.errors) console.error(` - ${error}`);
  process.exit(1);
}

if (!capture) {
  console.log(JSON.stringify({ schema: W266_VISUAL_PROOF_LAB_SCHEMA, ok: true, scope: plan.scope, captureCount: plan.captures.length, externalEvidence: 'not-collected', claimFence: plan.claimFence }, null, 2));
} else {
  let server = null;
  try {
    let preflight = null;
    if (serve) {
      const target = assertLocalUrl(plan.baseUrl);
      const targetPort = Number(target.port || (target.protocol === 'https:' ? 443 : 80));
      server = await createServer({
        root: ROOT,
        server: { host: target.hostname === 'localhost' ? '127.0.0.1' : target.hostname, port: targetPort, strictPort: true }
      });
      await server.listen();
      const response = await fetch(`${plan.baseUrl}/chat`, { redirect: 'manual' });
      preflight = { ok: response.ok, status: response.status, url: `${plan.baseUrl}/chat` };
      if (!preflight.ok) throw new Error(`W266 local Vite preflight failed: HTTP ${response.status}`);
      console.log(`[W266] local Vite server preflight: HTTP ${response.status} at ${plan.baseUrl}`);
    }
    const result = await capturePlan(plan, { localServerPreflight: preflight });
    process.exitCode = result.ok ? 0 : result.blockedByEnvironment ? 2 : 1;
  } finally {
    if (server) await server.close();
  }
}
