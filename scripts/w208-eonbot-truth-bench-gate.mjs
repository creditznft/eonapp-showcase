import { EONBOT_ACCEPTANCE_TASKS, runEonbotAcceptanceBench } from '../assets/js/chat/eonbot-acceptance-bench.js';
import { listEonbotTruthCapabilities, buildEonbotTruthSystemPrompt } from '../assets/js/chat/eonbot-truth-contract.js';

const bench = runEonbotAcceptanceBench();
const capabilities = listEonbotTruthCapabilities();
const prompt = buildEonbotTruthSystemPrompt();

const failures = [];
if (EONBOT_ACCEPTANCE_TASKS.length !== 100) failures.push(`Expected exactly 100 EONBOT acceptance tasks, found ${EONBOT_ACCEPTANCE_TASKS.length}.`);
if (!bench.ok) failures.push(...bench.failures.map((entry) => `${entry.id}: ${entry.failures.join('; ')}`));
if (capabilities.length < 10) failures.push(`Expected at least 10 public truth capabilities, found ${capabilities.length}.`);
if (!/Never request, repeat, store or expose seed phrases/i.test(prompt)) failures.push('Truth system prompt lacks secret-protection rule.');
if (!/Trade is research and paper simulation only/i.test(prompt)) failures.push('Truth system prompt lacks live-trade boundary.');
if (!/Voice is browser-dependent/i.test(prompt)) failures.push('Truth system prompt lacks typed voice fallback rule.');

if (failures.length) {
  console.error('W208 EONBOT truth bench failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(JSON.stringify({
  wave: 'W208',
  status: 'pass',
  acceptanceTasks: bench.total,
  passed: bench.passed,
  capabilities: capabilities.length
}, null, 2));
