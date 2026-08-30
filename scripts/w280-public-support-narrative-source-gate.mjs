#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { W280_PUBLIC_SUPPORT_NARRATIVE_CONTRACT as CONTRACT } from '../config/w280-public-support-narrative-contract.mjs';
import { SUPPORT_TOPICS } from '../assets/js/utils/support-tools-footer-proof.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const supportHtml = read('help.html');
const supportPage = read('assets/js/support-page.js');
const plan = read('docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
const packageJson = JSON.parse(read('package.json'));
const topicIds = SUPPORT_TOPICS.map((topic) => topic.id);
const expectedIds = [...CONTRACT.requiredSupportTopicIds];
const topicCards = [...supportHtml.matchAll(/data-support-topic-card="([^"]+)"/g)].map((match) => match[1]);
const topicButtons = [...supportHtml.matchAll(/data-support-topic="([^"]+)"/g)].map((match) => match[1]);
const lowerHtml = supportHtml.toLowerCase();

const checks = {
  boundaryCard: /data-w280-public-support-boundary="true"/.test(supportHtml),
  explicitCurrentBoundary: CONTRACT.requiredBoundaryTerms.every((term) => supportHtml.includes(term)),
  recoveryLinks: CONTRACT.requiredRecoveryLinks.every((href) => supportHtml.includes(`href="${href}"`)),
  publicProofAndNoSecrets: /public, redacted evidence/i.test(supportHtml)
    && /Never send secrets/i.test(supportHtml)
    && /Never include passwords, recovery phrases, private keys, wallet backup files, or full API keys\./.test(supportHtml),
  noStaleCommercialSupportCopy: CONTRACT.bannedStalePhrases.every((phrase) => !lowerHtml.includes(phrase)),
  noSupportSlaClaim: !/\b(?:24\/?7\s+(?:human\s+)?support|response\s+within\s+\d|support sla|service-level agreement)\b/i.test(supportHtml),
  exactCanonicalTopics: topicIds.length === expectedIds.length
    && expectedIds.every((id) => topicIds.includes(id))
    && topicCards.length === expectedIds.length
    && topicButtons.length === expectedIds.length
    && expectedIds.every((id) => topicCards.includes(id) && topicButtons.includes(id)),
  chatPrefillUsesCanonicalTopics: /findSupportTopic/.test(supportPage) && /buildSupportChatUrl/.test(supportPage),
  boundedCommercialSupport: /data-monetization="subscription"/.test(supportHtml)
    && /data-billing-provider="dodo"/.test(supportHtml)
    && /signed Dodo events and the server entitlement ledger/.test(supportHtml)
    && /No wallet or chain payment/.test(supportHtml),
  noGoPreserved: /EONAPP is \*\*NO-GO for public launch\*\*/.test(plan) && /W260 \| Release certification board \| Remains NO-GO/.test(plan),
  packageScript: Boolean(packageJson.scripts?.['qa:w280-public-support-narrative'])
};
const ok = Object.values(checks).every(Boolean);
const stats = {
  schema: 'eonapp.w280.public-support-narrative-source-gate.v2',
  wave: CONTRACT.wave,
  ok,
  score: ok ? 100 : 0,
  scope: CONTRACT.scope,
  topicIds,
  topicCards,
  topicButtons,
  checks,
  claimFence: CONTRACT.claimFence,
  releaseDependency: 'W260 remains NO-GO'
};
const artifactDir = path.join(root, 'artifacts', 'w280-public-support-narrative-source-gate');
fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`W280 public-support narrative source gate passed: ${topicIds.length} canonical topics, score ${stats.score}`);
