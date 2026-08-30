import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const redirects = read('_redirects');
const support = read('support.html');
const tools = read('tools.html');
const toolPage = read('assets/js/tool-page.js');
const supportProof = read('assets/js/utils/support-tools-footer-proof.js');
const hustle = read('hustle.html');
const materialAtlas = read('assets/js/realm3d/engine/EonCityMaterialAtlas.js');
const session12 = read('assets/js/realm3d/engine/EonCitySession12PresentationRuntime.js');
const engineBoot = read('assets/js/realm3d/engine/EngineBoot.js');
const realmCss = read('assets/css/realm3d.css');
const apiVault = read('assets/js/utils/api-key-vault.js');

const checks = {
  telegramLoopRemoved: !/^\/telegram\s+\/telegram\.html\s+200/m.test(redirects)
    && !/^\/telegram\/\s+\/telegram\.html\s+200/m.test(redirects)
    && !/^\/telegram\.html\s+\/telegram\.html\s+200/m.test(redirects)
    && !/^\/reward-access\s+\/reward-access\.html\s+200/m.test(redirects)
    && !/^\/reward-access\/\s+\/reward-access\.html\s+200/m.test(redirects)
    && !/^\/reward-access\.html\s+\/reward-access\.html\s+200/m.test(redirects)
    && /Cloudflare Pages clean URLs already canonicalize \.html routes/i.test(redirects)
    && !/^\/telegram\S*\s+\/telegram\S*\s+30[1278]/m.test(redirects),
  telegramFolderFallback: exists('telegram/index.html') && /Fast Telegram gateway for EONAPP/.test(read('telegram/index.html')),
  supportGenericCta: /href="\/chat\.html\?support=1" data-support-generic="1">Ask EONBOT now/.test(support) && !/Ask EONBOT now<\/a>/.test(support.match(/data-support-topic="bug-security"[^>]*>Ask EONBOT now<\/a>/)?.[0] || ''),
  publicWaveCopyRemoved: !/W127 compatibility|Support \/ Tools \/ Footer cleanup|AI Tools Hub/.test([support, tools, toolPage].join('\n')),
  footerRefundRemoved: !/Refund Policy|Refund policy/.test([supportProof, read('index.html'), read('market.html'), read('subscription.html')].join('\n')),
  hustleRuntimeSafe: /data-w135-hustle-repaired="true"/.test(hustle) && ['hh-grid', 'hh-empty', 'hh-cat-tabs', 'hh-search', 'hh-clear-search'].every((id) => hustle.includes(`id="${id}"`)) && /getElementById\('hh-cat-tabs'\)\?\.addEventListener/.test(hustle),
  threeClearcoatSafe: /MeshPhysicalMaterial/.test(materialAtlas) && /if \(usePhysical\)/.test(materialAtlas) && !/clearcoat: options\.clearcoat \?\? 0,\n\s*clearcoatRoughness/.test(materialAtlas),
  eonCityMobileRescue: /W135_MOBILE_FIRST_IMPRESSION_SCHEMA/.test(session12) && /compactMobile && requested === 'guided'/.test(session12) && /W135 live mobile first-impression rescue/.test(realmCss),
  eonCityDesktopMouse: /clickToLock: true/.test(engineBoot) && /Click once to lock mouse look/.test(engineBoot) && /Click\/E<\/kbd> interact/.test(engineBoot),
  apiKeyPersistence: /stable random device secret/.test(apiVault) && /Legacy identity-derived passphrases/.test(apiVault) && /stableDeviceSecretPrimary/.test(apiVault),
  toolsRouterModernized: /Workflow Router Workspace/.test(toolPage) && !/window\.location\.href = '\/marketplace\.html'/.test(toolPage)
};

const score = Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100);
const stats = {
  schema: 'eonapp.w135.live-hotfix.v1',
  ok: Object.values(checks).every(Boolean),
  score,
  checks,
  productionBoundary: [
    'Source gate proves hotfix structure only.',
    'Live proof still needs Cloudflare deploy, Telegram bot link check, and browser console/screenshot audit on eonapp.ch.'
  ]
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w135-live-hotfix-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!stats.ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`W135 live hotfix gate passed: score ${score}`);
