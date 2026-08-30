import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const scenario = process.env.W98_SCENARIO || 'city';
const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4182';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION1');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(path.join(outputDir, 'screenshots'), { recursive: true });
const viewport = scenario === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const result = { scenario, checks: {}, metrics: {}, consoleErrors: [], pageErrors: [] };
let browser;
try {
  browser = await chromium.launch({ headless: process.env.W98_HEADLESS !== '0', executablePath, chromiumSandbox: false, args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--disable-features=Translate,OptimizationHints'] });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error' && !/ERR_CONNECTION_REFUSED/.test(msg.text())) result.consoleErrors.push(msg.text()); });
  page.on('pageerror', error => { const text=String(error?.message || error); if (!/serviceWorker.*sandboxed.*allow-same-origin/i.test(text)) result.pageErrors.push(text); });
  const query = scenario === 'workstation' ? '?world=private-workstation&quality=standard' : scenario === 'mobile' ? '?world=eon-city&quality=low' : '?world=eon-city&quality=standard';
  await page.goto(`${baseURL}/tests/fixtures/realm3d-w98.html${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.running && window.EON_CITY_3D?.renderer?.domElement), null, { timeout: 30000 });
  await page.waitForTimeout(scenario === 'mobile' ? 350 : 500);
  await page.evaluate(() => { const e=window.EON_CITY_3D; e.running=false; cancelAnimationFrame(e.raf); e.renderer.render(e.scene,e.camera); });

  if (scenario === 'city') {
    await page.screenshot({ path: path.join(outputDir,'screenshots','01-city-launch-desktop.png') });
    const data = await page.evaluate(() => {
      const e=window.EON_CITY_3D, c=e.renderer.domElement;
      const before=e.player.yaw;
      e.dismissIntro(); e.root.classList.add('realm3d-game-active'); e.player.releasePointerLock('qa');
      c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:91,clientX:500,clientY:380}));
      c.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:91,clientX:680,clientY:330,movementX:180,movementY:-50}));
      c.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:91,clientX:680,clientY:330}));
      e.renderer.render(e.scene,e.camera);
      return { webgl:Boolean(c.getContext('webgl2')||c.getContext('webgl')), world:e.map.kind, sourceBlocks:e.map.blocks.length, renderedLimit:e.preset.maxBlocks, screens:e.map.workstationScreens.length, npcs:e.map.npcs.length, scene:e.world.flagshipStats, yawDelta:Math.abs(e.player.yaw-before), fullscreenAPI:typeof document.documentElement.requestFullscreen==='function', layout:{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,canvasHeight:c.getBoundingClientRect().height}, collision:e.collision.getDebugStats?.() };
    });
    result.metrics=data;
    result.checks={ webglReady:data.webgl, cityWorld:data.world==='eon-city', flagshipEnvironment:Number(data.scene?.objectCount||0)>=100&&Number(data.scene?.animatedCount||0)>=20, systems:data.screens>=8&&data.npcs>=5, dragLook:data.yawDelta>.02, fullscreenAPI:data.fullscreenAPI, noOverflow:data.layout.scrollWidth<=data.layout.clientWidth+1, fullViewport:data.layout.canvasHeight>=760, spatialCollision:Number(data.collision?.buckets||0)>0 };
    await page.screenshot({ path:path.join(outputDir,'screenshots','02-city-world-desktop.png') });
  } else if (scenario === 'workstation') {
    await page.evaluate(() => { window.EON_CITY_3D.dismissIntro(); window.EON_CITY_3D.renderer.render(window.EON_CITY_3D.scene,window.EON_CITY_3D.camera); });
    const info=await page.evaluate(()=>({world:window.EON_CITY_3D.map.kind,screens:window.EON_CITY_3D.map.workstationScreens.length,companions:window.EON_CITY_3D.world.companionObjects.length,scene:window.EON_CITY_3D.world.flagshipStats}));
    result.metrics.workstation=info;
    result.checks.privateWorld=info.world==='private-workstation'; result.checks.designedWorkstation=Boolean(info.scene?.workstationDesigned); result.checks.screens=info.screens>=8; result.checks.companion=info.companions>=1;
    await page.screenshot({path:path.join(outputDir,'screenshots','03-private-workstation-desktop.png')});
    await page.evaluate(()=>{const e=window.EON_CITY_3D; const screen=e.map.workstationScreens.find(x=>x.id==='screen-code'); e.focusWorkstationScreen(screen);});
    await page.locator('[data-realm-code-widget]').waitFor({state:'visible',timeout:10000});
    await page.locator('[data-run-realm-code]').click();
    const frame=page.frameLocator('[data-realm-code-preview]');
    await frame.locator('h1').waitFor({state:'visible',timeout:10000});
    const heading=(await frame.locator('h1').textContent())||'';
    await frame.locator('#pulse').click();
    const activated=(await frame.locator('#pulse').textContent())||'';
    result.checks.codeMaker=heading.includes('EON City')&&activated.includes('Workstation active');
    await page.screenshot({path:path.join(outputDir,'screenshots','04-code-maker-widget-desktop.png')});
    await page.locator('[data-panel-close]').first().click();
    await page.evaluate(()=>window.EON_CITY_3D.panels.openEonBot({world:window.EON_CITY_3D.map}));
    await page.locator('[data-eonbot-form] input').fill('Where is Code Maker?');
    await page.locator('[data-eonbot-form]').evaluate(form=>form.requestSubmit());
    const transcript=await page.locator('[data-eonbot-transcript]').innerText();
    result.checks.eonbot=/Code Maker is available/i.test(transcript);
    await page.screenshot({path:path.join(outputDir,'screenshots','05-eonbot-companion-panel.png')});
  } else {
    await page.screenshot({path:path.join(outputDir,'screenshots','06-city-launch-mobile.png')});
    const data=await page.evaluate(()=>{const e=window.EON_CITY_3D,c=e.renderer.domElement;e.dismissIntro();e.renderer.render(e.scene,e.camera);return{webgl:Boolean(c.getContext('webgl2')||c.getContext('webgl')),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,canvasWidth:c.getBoundingClientRect().width,canvasHeight:c.getBoundingClientRect().height,mobileControls:Boolean(document.querySelector('.realm3d-mobile-controls'))};});
    result.metrics=data;
    result.checks={webglReady:data.webgl,noOverflow:data.scrollWidth<=data.clientWidth+1,canvasFits:data.canvasWidth<=391&&data.canvasHeight>=700,launchActions:await page.locator('[data-realm3d-launch]').isVisible()};
    await page.screenshot({path:path.join(outputDir,'screenshots','07-city-world-mobile.png')});
  }
  result.ok=Object.values(result.checks).every(Boolean)&&result.pageErrors.length===0;
  result.score=Math.round(Object.values(result.checks).filter(Boolean).length/Object.keys(result.checks).length*100);
  fs.writeFileSync(path.join(outputDir,`W98_${scenario.toUpperCase()}_PROOF.json`),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
} catch(error) {
  result.error=String(error?.stack||error);
  fs.writeFileSync(path.join(outputDir,`W98_${scenario.toUpperCase()}_PROOF.json`),JSON.stringify(result,null,2));
  console.error(result.error);
  process.exitCode=1;
} finally {
  if (browser) await Promise.race([browser.close().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,2500))]);
}
