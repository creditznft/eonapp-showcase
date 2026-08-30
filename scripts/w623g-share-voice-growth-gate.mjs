import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { calculateEonViralReadiness, getEonViralShareTruth } from '../assets/js/share/eon-viral-share-kit.js';
import { getEonVoiceFallbackTruth } from '../assets/js/chat/eon-voice-fallback-strategy.js';
import { W623G_LOCAL_SPEECH_COMPANION_CONTRACT, validateW623gLocalSpeechCompanionContract } from '../config/w623g-local-speech-companion-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const checks = [];
const check = (id, ok, detail = '') => {
  checks.push({ id, ok: Boolean(ok), detail });
  if (!ok) failures.push(`${id}${detail ? `: ${detail}` : ''}`);
};

const shell = read('assets/js/eon-app-shell.js');
const siteShell = read('assets/js/utils/site-shell.js');
const socialCss = read('assets/css/social-missions.css');
const navigation = read('assets/js/shell/eon-shell-navigation.js');
const shareSheet = read('assets/js/utils/eon-share-sheet.js');
const viralKit = read('assets/js/share/eon-viral-share-kit.js');
const profile = read('profile.html');
const profileJs = read('assets/js/profile-page.js');
const voiceGateway = read('assets/js/chat/eonbot-voice-capability-gateway.js');
const chatPage = read('assets/js/chat-page.js');
const homeBootstrap = read('assets/js/eonbot-home-bootstrap.js');

const htmlEntrypoints = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
const shellPages = htmlEntrypoints.filter((name) => /data-eon-app-shell=["']1["']/.test(read(name)));
const missingShellShare = shellPages.filter((name) => {
  const html = read(name);
  if (/assets\/js\/eon-app-shell\.js/.test(html)) return false;
  // The Chat-first home intentionally lazy-hydrates the canonical app shell through
  // eonbot-home-bootstrap to keep first paint small. Treat that owned bootstrap as
  // equivalent shell coverage rather than requiring a duplicate eager script tag.
  return !(name === 'index.html'
    && /assets\/js\/eonbot-home-bootstrap\.js/.test(html)
    && /import\(['"]\.\/eon-app-shell\.js['"]\)/.test(homeBootstrap));
});
const siteShellPages = htmlEntrypoints.filter((name) => /assets\/js\/site-shell-bootstrap\.js/.test(read(name)));
check('universal-shell-pages', shellPages.length >= 20 && missingShellShare.length === 0, `${shellPages.length} shell pages; missing ${missingShellShare.join(', ') || 'none'}`);
check('top-right-share-command', /eon-chat-header-share/.test(shell) && /eon-app-global-share/.test(shell) && /installGlobalShareCommandCenter/.test(shell) && /openEonShareSheet/.test(shell), 'global command plus native chat/city ownership');
check('legacy-site-shell-top-right-share', siteShellPages.length >= 5 && /ensureGlobalShareLauncher\(utilityRail\)/.test(siteShell) && /utilityRail \|\| document\.body/.test(siteShell) && /eon-global-share-launcher\{position:static/.test(socialCss), `${siteShellPages.length} site-shell pages use header utility rail`);
check('legacy-site-shell-language-hidden', !/^[^\n]*ensureLanguagePicker\(utilityRail\)/m.test(siteShell) && /Profile → Voice & language/.test(siteShell), 'no permanent header language picker');
check('legacy-site-shell-canonical-nav', ['EONBOT', 'Create', 'Projects', 'Library', 'EON City'].every((label) => siteShell.includes(`label: '${label}'`)), 'same five beginner destinations');
check('beginner-navigation-preserved', [/id: 'chat'/, /label: 'EONBOT'/, /label: 'Create'/, /label: 'Projects'/, /label: 'Library'/, /label: 'EON City'/].every((pattern) => pattern.test(navigation)), 'five canonical destinations');
check('share-command-center', /Share Command Center/.test(shareSheet) && /Open Command Center/.test(shareSheet), 'full and compact entry');
check('four-viral-surfaces', ['Invite to EONAPP', 'Share a creation', 'Celebrate progress', 'Build a share campaign'].every((label) => viralKit.includes(label)), 'invite, creation, milestone, campaign');
check('local-media-share', /shareEonLocalMedia/.test(shareSheet) && /local image or video/i.test(shareSheet) && /nativeShare/.test(viralKit), 'explicit local file handoff');
check('progress-card-generator', /createEonShareCardFile/.test(shareSheet) && ['creation', 'project', 'city', 'vault'].every((id) => viralKit.includes(`id: '${id}'`)), 'four local card presets');
check('platform-handoffs', ['WhatsApp', 'Telegram', 'X', 'LinkedIn', 'Facebook', 'Reddit', 'Email'].every((label) => shareSheet.includes(label)), 'manual platform launch options');
check('campaign-review-boundary', /reviewable-draft-only/.test(viralKit) && /automaticPosting:\s*false/.test(viralKit) && /directPublishing:\s*false/.test(viralKit), 'no background social posting');
check('referral-reward-proof-gated', /EON_VIRAL_SHARE_PROGRAM_ACTIVE = false/.test(viralKit) && /programmeStateAuthority:\s*['"]\/api\/referrals['"]/.test(viralKit) && /clientCanActivateProgramme:\s*false/.test(viralKit) && /eonKeyGrant:\s*false/.test(viralKit) && /paidAdPromotionRecommended:\s*false/.test(viralKit), 'client share primitives cannot activate rewards; server status is authoritative');
check('promotion-safety-copy', /EONAPP contains no ads/.test(viralKit) && /independent external promotion/.test(viralKit) && /material EONKEY benefit/.test(viralKit) && /No spam/.test(viralKit), 'no in-app ads plus disclosure and anti-spam guardrails');
check('private-data-boundary', /Private chats, files, Vault secrets, provider keys/.test(viralKit) && /containsPrivateData:\s*false/.test(viralKit), 'public-safe only');

const viralTruth = getEonViralShareTruth();
const viralReadiness = calculateEonViralReadiness({
  universalShareAccess: true,
  signedPublicLinks: true,
  nativeFileShare: true,
  creatorHandoffs: true,
  brandedProgressCards: true,
  campaignDrafts: true,
  platformVariants: true,
  clearDisclosure: true,
  serverAttribution: false,
  qualifiedRewardLedger: false,
  abuseReversal: false,
  privacySafeMeasurement: false
});
check('viral-score-honest', viralReadiness.score === 7.2 && viralReadiness.launchClaimAllowed === false, `${viralReadiness.score}/10; blockers ${viralReadiness.blockers.join(', ')}`);
check('viral-truth-server-authoritative', viralTruth.programActive === false && viralTruth.programActiveMeansClientSourceClaimOnly === true && viralTruth.programmeStateAuthority === '/api/referrals' && viralTruth.defaultProgrammeState === 'unverified' && viralTruth.clientCanActivateProgramme === false && viralTruth.referralQualification === false && viralTruth.eonKeyGrant === false, 'sharing live; reward state comes from server authority');

const voiceTruth = getEonVoiceFallbackTruth();
const companionValidation = validateW623gLocalSpeechCompanionContract();
check('no-key-voice-fallback', voiceTruth.noKeyBrowserBaseline && voiceTruth.osDictationFallback && voiceTruth.deviceReadAloudFallback, 'browser + OS/device fallback ladder');
check('no-cloud-speech-proxy', voiceTruth.eonappCloudSpeechProxy === false && /noCloudSpeechProxy:\s*true/.test(read('assets/js/chat/eon-voice-fallback-strategy.js')), 'EONAPP does not proxy speech');
check('profile-voice-reach', /eon-profile-voice-reach-status/.test(profile) && /Best available no-key path/.test(profileJs), 'hidden under Profile → Voice & language');
check('chat-voice-fallback-connected', /resolveEonVoiceFallbackPlan/.test(voiceGateway) && /device fallback/.test(chatPage), 'gateway and chat status');
check('local-companion-design-safe', companionValidation.ok && W623G_LOCAL_SPEECH_COMPANION_CONTRACT.active === false && W623G_LOCAL_SPEECH_COMPANION_CONTRACT.proofRequired.includes('airplane-mode-stt') && W623G_LOCAL_SPEECH_COMPANION_CONTRACT.proofRequired.includes('airplane-mode-tts'), companionValidation.errors.join(', ') || 'design-only');

const report = {
  schema: 'eonapp.w623g-share-voice-growth-gate.v1',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'failed' : 'passed',
  shellPages: shellPages.length,
  siteShellPages: siteShellPages.length,
  totalShareCoveredPages: new Set([...shellPages, ...siteShellPages]).size,
  viralReadiness,
  viralTruth,
  voiceTruth,
  localSpeechCompanion: { valid: companionValidation.ok, active: W623G_LOCAL_SPEECH_COMPANION_CONTRACT.active },
  checks
};
const reportDir = path.join(root, 'reports', 'w623g-share-voice-growth');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'launch-board.json'), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(`W623G gate failed (${failures.length}/${checks.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`W623G gate passed ${checks.length}/${checks.length}.`);
console.log(`Universal Share coverage: ${new Set([...shellPages, ...siteShellPages]).size} active app/site-shell pages.`);
console.log(`Source viral readiness: ${viralReadiness.score}/10; referral activation remains server-authoritative and proof-gated.`);
