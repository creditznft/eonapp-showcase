import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  EONBOT_COMMAND_HUB_ACTIONS,
  EONBOT_COMMAND_HUB_VERSION,
  buildEonbotCommandHubPlan,
  detectEonbotCommandHubAction
} from '../../assets/js/chat/eonbot-command-hub.js';
import { EON_ROUTE_MANIFEST } from '../../assets/js/chat/eonbot-context-registry.js';
import { buildEonbotCommandPlan } from '../../assets/js/chat/eonbot-command-center.js';
import { buildOperatorActionPlan } from '../../assets/js/chat/eonbot-app-operator.js';
import { buildEonbotLaunchAssistantGuide } from '../../assets/js/chat/eonbot-launch-assistant.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const canonicalRoute = (url) => new URL(url, 'https://eonapp.invalid').pathname;

test('W230 resolves real Chat-first destinations through one deterministic command registry', () => {
  const cases = [
    ['start a new chat', 'new-chat', '/?new=1', 'local-thread-create'],
    ['open my projects', 'open-projects', '/projects', 'navigation'],
    ['open library', 'open-library', '/library', 'navigation'],
    ['build a website', 'open-workspace', '/create', 'navigation'],
    ['create automation workflow', 'open-automations', '/automations', 'navigation'],
    ['set up ollama local ai', 'open-local-ai', '/local-ai#eonbot-local-ai-setup', 'navigation'],
    ['generate preview in market', 'open-market', '/create?mode=image', 'navigation'],
    ['open vault', 'open-vault', '/vault#provider-check', 'navigation'],
    ['open research lab', 'open-insights', '/insights', 'navigation'],
    ['open EON City', 'open-eon-city', '/eoncity', 'navigation'],
    ['open 3D EON City', 'open-eon-city', '/eoncity', 'navigation'],
    ['create my realm', 'open-realm-studio', '/eoncity', 'navigation'],
    ['open share center', 'open-share-center', '/profile#eon-profile-share-center', 'navigation'],
    ['show reward status', 'open-access-status', '/rewards', 'navigation'],
    ['use microphone', 'open-voice-chat', '/?voice=1', 'navigation']
  ];

  for (const [input, commandId, route, actionType] of cases) {
    const plan = buildEonbotCommandHubPlan(input);
    assert.equal(plan.version, EONBOT_COMMAND_HUB_VERSION);
    assert.equal(plan.matched, true, input);
    assert.equal(plan.commandId, commandId, input);
    assert.equal(plan.route, route, input);
    assert.equal(plan.actionType, actionType, input);
    assert.equal(plan.commandReceipt.execution, plan.proposal ? 'prepared-review-required' : 'prepared-user-tap', input);
    assert.equal(plan.commandReceipt.completed, false, input);
    assert.equal(plan.commandReceipt.externalEffect, false, input);
    if (plan.proposal) {
      assert.equal(plan.toolCTA, null, input);
      assert.equal(plan.proposal.route, route, input);
      assert.equal(plan.commandReceipt.proposalRequired, true, input);
    } else {
      assert.equal(plan.toolCTA.url, route, input);
    }
  }
});

test('W230 prefers specific My Realm phrases while every City phrase resolves to the canonical Babylon route', () => {
  assert.equal(detectEonbotCommandHubAction('open my realm in eon city').id, 'open-realm-studio');
  assert.equal(detectEonbotCommandHubAction('play city in 3d').id, 'open-eon-city');
  assert.equal(detectEonbotCommandHubAction('open the eon city operator map').id, 'open-eon-city');
});

test('W230 has no command side effect from text and keeps sensitive/device operations truthful', () => {
  const unknown = buildEonbotCommandHubPlan('do something magical without telling me');
  assert.equal(unknown.matched, false);
  assert.equal(unknown.commandReceipt.completed, false);
  assert.equal(unknown.commandReceipt.externalEffect, false);

  const vault = buildEonbotCommandHubPlan('open vault');
  assert.equal(vault.sensitive, true);
  assert.equal(vault.approvalRequired, false);
  assert.equal(vault.proposal?.vaultReturnContext, true);
  assert.equal(vault.commandReceipt.proposalRequired, true);
  assert.match(vault.truthNote, /Do not paste passwords, recovery phrases, private keys, exchange secrets, or API keys into Chat/i);

  const voice = buildEonbotCommandHubPlan('use microphone');
  assert.equal(voice.approvalRequired, true);
  assert.equal(voice.commandReceipt.needsUserApproval, true);
  assert.match(voice.truthNote, /browser and device/i);

  const city3d = buildEonbotCommandHubPlan('open 3d eon city');
  assert.equal(city3d.route, '/eoncity');
  assert.equal(city3d.toolCTA?.url, '/eoncity');
  assert.equal(city3d.requiresDeviceReview, false);
  assert.equal(city3d.commandReceipt.needsDeviceReview, false);

  const access = buildEonbotCommandHubPlan('rewards');
  assert.match(access.truthNote, /No raw click, share, ad view, copied link, Pool Point, EON Lite, or chat activity creates value/i);
});

test('W230 command destinations are all real current route-manifest entries and never legacy product URLs', () => {
  const routes = new Set(EON_ROUTE_MANIFEST.map((entry) => entry.route));
  for (const action of EONBOT_COMMAND_HUB_ACTIONS) {
    assert.ok(routes.has(canonicalRoute(action.route)), `${action.id} must use a current route: ${action.route}`);
    assert.doesNotMatch(action.route, /realmworld|eon-browser|workbench|reward-access|campaign-admin|nowpayments/i);
    assert.equal(/^https?:\/\//i.test(action.route), false, `${action.id} must not navigate to an external URL`);
  }
});

test('W230 keeps older command imports as thin compatibility facades, not competing registries', () => {
  const center = buildEonbotCommandPlan('open workspace');
  const operator = buildOperatorActionPlan('open workspace');
  const launch = buildEonbotLaunchAssistantGuide('open workspace');
  assert.equal(center.commandId, 'open-workspace');
  assert.equal(operator.actionId, 'open-workspace');
  assert.equal(operator.compatibilityFacade, true);
  assert.equal(launch.topicId, 'open-workspace');
  assert.equal(launch.compatibilityFacade, true);

  const chatbot = read('assets/js/chat/chatbot.js');
  assert.match(chatbot, /buildEonbotCommandHubPlan/);
  assert.doesNotMatch(chatbot, /buildEonbotCommandPlan/);
  assert.doesNotMatch(chatbot, /buildOperatorActionPlan/);
  assert.doesNotMatch(chatbot, /buildEonbotLaunchAssistantGuide/);

  for (const file of ['assets/js/chat/eonbot-command-center.js', 'assets/js/chat/eonbot-app-operator.js', 'assets/js/chat/eonbot-launch-assistant.js']) {
    const source = read(file);
    assert.match(source, /eonbot-command-hub\.js/);
    assert.doesNotMatch(source, /const TOPICS = Object\.freeze\(/);
    assert.doesNotMatch(source, /const EONBOT_OPERATOR_ACTIONS = Object\.freeze\(/);
    assert.doesNotMatch(source, /const EONBOT_COMMANDS = Object\.freeze\(/);
  }
});

test('W230 command hub uses the canonical root ?new=1 Chat route instead of a fake New Chat promise', () => {
  const chatPage = read('assets/js/chat-page.js');
  const newChat = buildEonbotCommandHubPlan('start a new chat');
  assert.equal(newChat.route, '/?new=1');
  assert.match(chatPage, /params\.get\('new'\) === '1'/);
  assert.match(chatPage, /startNewChatThread\(\)/);
  assert.match(chatPage, /updateChatThreadUrl\(thread\.id\)/);
});
