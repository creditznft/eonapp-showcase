import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.W126_AUDIT_BASE_URL || 'https://eonapp.ch';
const outDir = process.env.W126_AUDIT_SCREENSHOT_DIR || '/mnt/data/w126_live_screenshots';
fs.mkdirSync(outDir, { recursive: true });

const routes = [
  { name: 'home', url: `${base}/` },
  { name: 'realm', url: `${base}/realm` },
  { name: 'realm-html', url: `${base}/realm.html` },
  { name: 'eon-browser', url: `${base}/eon-browser` },
  { name: 'chat', url: `${base}/chat` },
  { name: 'market', url: `${base}/market` },
  { name: 'telegram', url: `${base}/telegram.html` },
  { name: 'reward-access-telegram', url: `${base}/reward-access.html?mode=telegram` },
  { name: 'workbench', url: `${base}/workbench.html` },
  { name: 'trade', url: `${base}/trade` },
  { name: 'vault', url: `${base}/vault` },
  { name: 'support', url: `${base}/support` },
  { name: 'tools', url: `${base}/tools` }
];

const viewports = [
  { label: 'desktop', width: 1365, height: 900, isMobile: false },
  { label: 'mobile', width: 390, height: 844, isMobile: true }
];

function normalizeText(s='') { return s.replace(/\s+/g, ' ').trim(); }

async function summarizePage(page) {
  return await page.evaluate(() => {
    const text = document.body?.innerText || '';
    const interactive = [...document.querySelectorAll('a, button, [role="button"], input, textarea, select')].map((el, i) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        i,
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        role: el.getAttribute('role') || '',
        text: (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g,' ').trim().slice(0,90),
        href: el.href || el.getAttribute('href') || '',
        disabled: Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true'),
        visible: r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        small: r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 36),
        deadHref: el.tagName.toLowerCase() === 'a' && (!el.getAttribute('href') || ['#','javascript:void(0)','javascript:;'].includes((el.getAttribute('href') || '').trim().toLowerCase()))
      };
    });
    const iframes = [...document.querySelectorAll('iframe')].map((el) => {
      const r = el.getBoundingClientRect();
      return { src: el.src || el.getAttribute('src') || '', rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, ratio: Number(((r.width * r.height) / (window.innerWidth * window.innerHeight)).toFixed(3)) };
    });
    const fixedOverlays = [...document.querySelectorAll('body *')].filter((el) => {
      const s = getComputedStyle(el); const r = el.getBoundingClientRect();
      return ['fixed','sticky'].includes(s.position) && r.width > 100 && r.height > 60 && r.y < window.innerHeight && r.x < window.innerWidth;
    }).slice(0,25).map(el => {
      const r = el.getBoundingClientRect();
      return { cls: el.className?.toString().slice(0,80), id: el.id, text: (el.innerText || '').replace(/\s+/g,' ').trim().slice(0,120), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, z: getComputedStyle(el).zIndex };
    });
    return {
      title: document.title,
      url: location.href,
      bodyTextSample: text.replace(/\s+/g,' ').trim().slice(0,800),
      bodyTextLength: text.length,
      scroll: { y: window.scrollY, innerHeight: window.innerHeight, scrollHeight: document.documentElement.scrollHeight, bodyOverflow: getComputedStyle(document.body).overflow, htmlOverflow: getComputedStyle(document.documentElement).overflow },
      interactivesCount: interactive.length,
      visibleInteractives: interactive.filter(x=>x.visible).length,
      deadLinks: interactive.filter(x=>x.deadHref && x.visible).slice(0,40),
      smallTargets: interactive.filter(x=>x.visible && x.small).slice(0,40),
      buttons: interactive.filter(x=>x.visible && (x.tag === 'button' || x.role === 'button')).slice(0,80),
      links: interactive.filter(x=>x.visible && x.tag === 'a').slice(0,80),
      iframes,
      fixedOverlays,
      hasCanvas: Boolean(document.querySelector('canvas')),
      canvases: [...document.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), ratio: Number(((r.width*r.height)/(window.innerWidth*window.innerHeight)).toFixed(3)) }; }),
      keywords: {
        unlockAccess: /Unlock access/i.test(text),
        rewarded: /rewarded|Monetag|sponsor|ad gateway/i.test(text),
        preparing: /preparing|nothing appears|no items|empty/i.test(text),
        photoMode: /Photo Mode|screenshot proof|desktop 1365px|mobile 390px|developer/i.test(text),
        buildOS: /Build OS/i.test(text),
        deviceLab: /Device Lab/i.test(text),
        codeShowcase: /Code Showcase|Code Explorer/i.test(text),
        dailyFree: /daily free|free guide|25/i.test(text),
        fullScreenWorkspace: /full-screen|workspace|minimize/i.test(text)
      }
    };
  });
}

async function clickText(page, texts, timeout=1200) {
  const results = [];
  for (const text of texts) {
    const beforeUrl = page.url();
    const beforeText = normalizeText(await page.locator('body').innerText({ timeout: 3000 }).catch(()=>''));
    let result = { text, found: false, clicked: false, urlChanged: false, textChanged: false, error: null, afterUrl: beforeUrl };
    try {
      const loc = page.getByText(text, { exact: false }).first();
      await loc.waitFor({ state: 'visible', timeout: 2500 });
      result.found = true;
      await loc.click({ timeout: 2500, force: true });
      result.clicked = true;
      await page.waitForTimeout(timeout);
      result.afterUrl = page.url();
      result.urlChanged = result.afterUrl !== beforeUrl;
      const afterText = normalizeText(await page.locator('body').innerText({ timeout: 3000 }).catch(()=>''));
      result.textChanged = afterText !== beforeText;
    } catch (e) {
      result.error = e.message.split('\n')[0];
    }
    results.push(result);
  }
  return results;
}

async function auditRoute(browser, route, vp) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.isMobile, userAgent: vp.isMobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' : undefined });
  const page = await context.newPage();
  const consoleMessages = [];
  const failedRequests = [];
  page.on('console', msg => {
    const type = msg.type();
    if (['error','warning'].includes(type)) consoleMessages.push({ type, text: msg.text().slice(0,300) });
  });
  page.on('requestfailed', req => failedRequests.push({ url: req.url(), method: req.method(), failure: req.failure()?.errorText || '' }));
  let status = null, navError = null;
  try {
    const resp = await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    status = resp?.status() || null;
    await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(()=>{});
  } catch (e) { navError = e.message; }
  const summary = navError ? null : await summarizePage(page).catch(e => ({ error: e.message }));
  const shotName = `${route.name}-${vp.label}.png`;
  if (!navError) await page.screenshot({ path: path.join(outDir, shotName), fullPage: false }).catch(()=>{});

  const flow = {};
  if (!navError) {
    if (route.name === 'chat') {
      flow.clicks = await clickText(page, ['Help me launch a simple website', '➤', 'Need more', 'Watch ad'], 1000);
      const inputInfo = await page.evaluate(() => {
        const candidates = [...document.querySelectorAll('textarea,input:not([type="hidden"]),[contenteditable="true"]')];
        return candidates.map((el)=>{ const r=el.getBoundingClientRect(); return {tag:el.tagName, type:el.type||'', placeholder:el.getAttribute('placeholder')||'', visible:r.width>0&&r.height>0, rect:{w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y)}}}).slice(0,10);
      }).catch(e=>({error:e.message}));
      flow.inputInfo = inputInfo;
    }
    if (route.name === 'market') {
      flow.clicks = await clickText(page, ['Genesis', 'Templates', 'Agents', 'Prompts', 'List Template', 'List Agent Pack', 'List Prompt Pack', 'Mint & List'], 800);
      flow.catalogStats = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          cards: document.querySelectorAll('[class*="card"], [data-market-card], article, .marketplace-card, .catalog-card').length,
          listingDrawerVisible: /List an Item|Submit Listing|Cancel/i.test(text),
          preparingText: /preparing|nothing appears|no items/i.test(text)
        };
      }).catch(e=>({error:e.message}));
    }
    if (route.name === 'eon-browser') {
      flow.clicks = await clickText(page, ['Vault', 'Market', 'EONBOT', 'Show EONBOT', 'Hide EONBOT', 'Automate'], 1200);
      flow.workspace = await page.evaluate(() => {
        const vw = innerWidth, vh = innerHeight;
        const els = [...document.querySelectorAll('iframe, [class*="workspace"], [class*="browser"], [class*="frame"], [data-app-workspace]')].map(el => {
          const r=el.getBoundingClientRect();
          return { tag: el.tagName, cls: el.className?.toString().slice(0,80), id: el.id, rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, ratio:Number(((r.width*r.height)/(vw*vh)).toFixed(3)), text:(el.innerText||'').replace(/\s+/g,' ').slice(0,120)};
        }).filter(x=>x.rect.w>0 && x.rect.h>0).slice(0,25);
        return els;
      }).catch(e=>({error:e.message}));
    }
    if (route.name.includes('telegram') || route.name.includes('reward')) {
      flow.clicks = await clickText(page, ['Watch rewarded ad', 'Claim reward', 'Claim rewards', 'Open EON Apps Bot', 'Join', 'Earn rewards'], 1000);
      flow.rewardLinks = await page.evaluate(() => [...document.querySelectorAll('a,button')].map(el => ({ text:(el.innerText||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim(), href:el.href||el.getAttribute('href')||'', disabled:!!el.disabled || el.getAttribute('aria-disabled')==='true' })).filter(x=>/reward|bot|join|claim|ad/i.test(x.text+x.href)).slice(0,20)).catch(e=>({error:e.message}));
    }
    if (route.name.startsWith('realm')) {
      flow.clicks = await clickText(page, ['Enter EON City', 'Activate EON City', 'Use', 'Enter', 'Workstation', 'Vault', 'Market', 'Device Lab'], 1000);
    }
    if (route.name === 'workbench') {
      flow.clicks = await clickText(page, ['Build OS', 'Code Maker', 'Device Lab', 'Automation', 'Code Showcase', 'Ask EONBOT'], 900);
    }
  }
  await context.close();
  return { route: route.name, requestedUrl: route.url, viewport: vp.label, status, navError, summary, consoleMessages: consoleMessages.slice(0,30), failedRequests: failedRequests.slice(0,30), screenshot: navError ? null : shotName, flow };
}

const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-dev-shm-usage'] });
const results = [];
for (const route of routes) {
  for (const vp of viewports) {
    console.log(`[audit] ${route.name} ${vp.label}`);
    results.push(await auditRoute(browser, route, vp));
  }
}
await browser.close();

const bySeverity = [];
for (const r of results) {
  if (r.navError || (r.status && r.status >= 400)) bySeverity.push({ sev:'P0', route:r.route, viewport:r.viewport, issue:`Navigation/status problem ${r.status || ''} ${r.navError || ''}` });
  const s = r.summary;
  if (!s || s.error) continue;
  if (s.keywords.unlockAccess && r.route === 'chat') bySeverity.push({ sev:'P0', route:r.route, viewport:r.viewport, issue:'Chat still shows blocking unlock/access language' });
  if (s.keywords.preparing && r.route === 'market') bySeverity.push({ sev:'P0', route:r.route, viewport:r.viewport, issue:'Market still shows preparing/empty fallback instead of visible starter NFTs' });
  if (s.iframes?.some(f => f.ratio < 0.55 && f.ratio > 0) && r.route === 'eon-browser') bySeverity.push({ sev:'P0', route:r.route, viewport:r.viewport, issue:'EON Browser uses a small/clipped frame/workspace' });
  if (s.keywords.photoMode) bySeverity.push({ sev:'P1', route:r.route, viewport:r.viewport, issue:'Developer/photo-mode wording visible in public UI' });
  if (s.deadLinks?.length) bySeverity.push({ sev:'P1', route:r.route, viewport:r.viewport, issue:`Visible dead href controls: ${s.deadLinks.length}` });
  if (s.smallTargets?.length > 10 && r.viewport === 'mobile') bySeverity.push({ sev:'P1', route:r.route, viewport:r.viewport, issue:`Many small mobile touch targets: ${s.smallTargets.length}` });
  if ((s.scroll.scrollHeight > s.scroll.innerHeight + 80) && ['hidden','clip'].includes(s.scroll.bodyOverflow)) bySeverity.push({ sev:'P0', route:r.route, viewport:r.viewport, issue:`Page content tall but body overflow is ${s.scroll.bodyOverflow}` });
  if (r.failedRequests?.length) bySeverity.push({ sev:'P1', route:r.route, viewport:r.viewport, issue:`Failed requests observed: ${r.failedRequests.length}` });
  if (r.consoleMessages?.some(m => m.type === 'error')) bySeverity.push({ sev:'P1', route:r.route, viewport:r.viewport, issue:`Console errors observed: ${r.consoleMessages.filter(m=>m.type==='error').length}` });
}
const report = { generatedAt: new Date().toISOString(), base, routesAudited: routes.length, viewports, results, findings: bySeverity };
fs.writeFileSync('/mnt/data/W126_LIVE_GRAND_AUDIT_REPORT_2026-06-12.json', JSON.stringify(report, null, 2));
const md = [`# W126 Live Grand Audit`, '', `Generated: ${report.generatedAt}`, `Base: ${base}`, '', `Routes audited: ${routes.length} x ${viewports.length} viewports`, '', '## Findings', ...bySeverity.map(f=>`- **${f.sev}** ${f.route} / ${f.viewport}: ${f.issue}`), '', '## Screenshots', ...results.filter(r=>r.screenshot).map(r=>`- ${r.route} / ${r.viewport}: ${r.screenshot}`)].join('\n');
fs.writeFileSync('/mnt/data/W126_LIVE_GRAND_AUDIT_REPORT_2026-06-12.md', md);
console.log(JSON.stringify({ findings: bySeverity.length, report: '/mnt/data/W126_LIVE_GRAND_AUDIT_REPORT_2026-06-12.json', md: '/mnt/data/W126_LIVE_GRAND_AUDIT_REPORT_2026-06-12.md' }, null, 2));
