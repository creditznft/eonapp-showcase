import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION9');
const screenshotsDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W98_SESSION9_AUDIO_MOBILE_PROOF.json');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(screenshotsDir, { recursive: true });
const report = { schema:'eon.w98.session9.audio-mobile-proof.v1',capturedAt:new Date().toISOString(),baseURL,checks:{},errors:[] };
const browser = await chromium.launch({headless:false,executablePath,chromiumSandbox:false,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--disable-vulkan','--autoplay-policy=no-user-gesture-required','--disable-features=Translate,OptimizationHints']});
const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
const page = await context.newPage();
page.on('console',(m)=>{if(m.type()==='error'&&!/favicon|sandboxed and lacks/i.test(m.text()))report.errors.push(`console: ${m.text()}`)});
page.on('pageerror',(e)=>report.errors.push(`page: ${String(e?.message||e)}`));
await page.addInitScript(()=>localStorage.removeItem('eon:realm3d:audio-preferences:v1'));
try{
  const url=`${baseURL}/realm.html?world=eon-city&quality=low&qa=w98-session9-audio-mobile`;
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.EON_CITY_3D?.audio&&window.EON_CITY_3D?.renderer?.domElement),null,{timeout:60000});
  await page.evaluate(()=>window.EON_CITY_3D.dismissIntro());
  await page.waitForTimeout(650);
  await page.evaluate(()=>document.querySelector('.realm3d-topbar [data-realm3d-audio-toggle]')?.click());
  await page.waitForFunction(()=>window.EON_CITY_3D?.audio?.getTelemetry?.().unlocked===true,null,{timeout:10000});
  await page.evaluate(()=>{const menu=document.querySelector('.realm3d-world-menu');if(menu)menu.open=true;});
  await page.waitForTimeout(150);
  report.layout=await page.evaluate(()=>{
    const menu=document.querySelector('.realm3d-world-menu-popover');
    const settings=document.querySelector('[data-session9-audio-settings]');
    const toggle=document.querySelector('.realm3d-topbar [data-realm3d-audio-toggle]');
    const mr=menu.getBoundingClientRect(),sr=settings.getBoundingClientRect(),tr=toggle.getBoundingClientRect();
    return {viewport:{width:innerWidth,height:innerHeight},menu:{x:mr.x,y:mr.y,right:mr.right,bottom:mr.bottom,width:mr.width,height:mr.height},settings:{x:sr.x,y:sr.y,right:sr.right,bottom:sr.bottom,width:sr.width,height:sr.height},toggle:{x:tr.x,y:tr.y,right:tr.right,bottom:tr.bottom,width:tr.width,height:tr.height},overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,telemetry:window.EON_CITY_3D.audio.getTelemetry(),stateText:document.querySelector('[data-realm3d-audio-state]')?.textContent||''};
  });
  await page.screenshot({path:path.join(screenshotsDir,'02-session9-audio-controls-mobile.png'),fullPage:false});
  report.checks={
    mobileToggleFits:report.layout.toggle.x>=0&&report.layout.toggle.right<=report.layout.viewport.width+1,
    mobileMenuFits:report.layout.menu.x>=0&&report.layout.menu.right<=report.layout.viewport.width+1&&report.layout.menu.bottom<=report.layout.viewport.height+1,
    mobileSettingsReadable:report.layout.settings.width>200&&report.layout.settings.right<=report.layout.viewport.width+1&&report.layout.stateText.includes('Spatial sound active'),
    mobileNoHorizontalOverflow:report.layout.overflow<=1,
    mobileGestureUnlocks:report.layout.telemetry.unlocked===true&&report.layout.telemetry.contextState==='running',
    audioRemainsOptional:report.layout.telemetry.audioIsOptional===true&&report.layout.telemetry.userGestureRequired===true,
    noBrowserErrors:report.errors.length===0
  };
  report.ok=Object.values(report.checks).every(Boolean);report.score=Math.round(Object.values(report.checks).filter(Boolean).length/Object.keys(report.checks).length*100);
}catch(error){report.ok=false;report.error=String(error?.stack||error)}finally{fs.writeFileSync(reportPath,JSON.stringify(report,null,2));await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,1500))])}
console.log(JSON.stringify(report,null,2));process.exit(report.ok?0:1);
