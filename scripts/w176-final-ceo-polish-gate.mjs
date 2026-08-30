import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateSponsorBoostLaunchContract, buildSponsorBoostCodexLiveChecklist } from '../assets/js/ads/sponsor-boost-ceo-rules.js';
import { buildEonbotFeatureAnswerIndex, buildSponsorBoostOptInConversation } from '../assets/js/chat/eonbot-launch-assistant.js';

const root = process.cwd();
const requiredFiles = [
  'assets/js/chat/eonbot-launch-assistant.js',
  'assets/js/ads/sponsor-boost-ceo-rules.js',
  'assets/js/chat/chatbot.js',
  'assets/js/reward-access-page.js',
  'tests/unit/w176-final-ceo-polish.test.mjs',
  'LAUNCH/GPT55_W176_FINAL_CEO_POLISH_AND_CODEX_LAUNCH_PLAN_2026-06-15.md',
  'LAUNCH/GPT55_W176_CODEX_FINAL_MERGE_VERIFY_PROMPT_2026-06-15.txt'
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) failures.push(`Missing ${file}`);
}

const contract = validateSponsorBoostLaunchContract({ requireCspHosts: true });
if (!contract.ok) failures.push(...contract.failures);
const prompt = buildSponsorBoostOptInConversation();
if (!prompt.shouldAsk || !prompt.quickReplies.includes('No, keep app clean')) failures.push('EONBOT Sponsor Boost prompt must ask and offer clean-app opt-out.');
const index = buildEonbotFeatureAnswerIndex();
for (const key of ['rewards', 'sponsorBoost', 'eonCity', 'voice', 'operator', 'payments']) {
  if (!index.answers[key]) failures.push(`EONBOT feature answer index missing ${key}`);
}

const chatbot = readFileSync(join(root, 'assets/js/chat/chatbot.js'), 'utf8');
if (!chatbot.includes('buildSponsorBoostOptInConversation')) failures.push('Chatbot greeting does not include Sponsor Boost opt-in prompt.');
if (!chatbot.includes('No, keep app clean')) failures.push('Chatbot quick replies missing clean opt-out.');

const rewardAccess = readFileSync(join(root, 'assets/js/reward-access-page.js'), 'utf8');
if (!rewardAccess.includes('EONBOT can ask users')) failures.push('Reward access page missing EONBOT Sponsor Boost explanation.');

const cspPages = ['reward-access.html', 'market.html', 'realmworld.html', 'chat.html', 'games.html'];
for (const page of cspPages) {
  const html = readFileSync(join(root, page), 'utf8');
  if (!html.includes('https://quge5.com')) failures.push(`${page} CSP missing quge5.com for opt-in MultiTag testing.`);
}

const checklist = buildSponsorBoostCodexLiveChecklist();
if (checklist.checks.length < 6) failures.push('Codex Sponsor Boost live checklist too short.');

if (failures.length) {
  console.error('W176 final CEO polish gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, gate: 'w176-final-ceo-polish', requiredFiles: requiredFiles.length, sponsorContract: contract.ok, eonbotAnswers: Object.keys(index.answers), codexChecks: checklist.checks.length }, null, 2));
