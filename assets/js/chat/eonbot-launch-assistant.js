/**
 * Compatibility facade for pre-W230 launch-assistant imports.
 * Topic matching is deliberately delegated to the single Command Hub.
 */
import {
  EONBOT_COMMAND_HUB_VERSION,
  EONBOT_COMMAND_HUB_ACTIONS,
  detectEonbotCommandHubAction,
  buildEonbotCommandHubPlan,
  getEonbotCommandHubRoadmap
} from './eonbot-command-hub.js';

export const EONBOT_LAUNCH_ASSISTANT_VERSION = EONBOT_COMMAND_HUB_VERSION;
export const TOPICS = EONBOT_COMMAND_HUB_ACTIONS;

export function detectEonbotLaunchTopic(input = '') {
  return detectEonbotCommandHubAction(input);
}

export function buildEonbotLaunchAssistantGuide(input = '', options = {}) {
  const plan = buildEonbotCommandHubPlan(input, options);
  return plan.matched ? Object.freeze({ ...plan, topicId: plan.commandId, compatibilityFacade: true }) : null;
}

export function getEonbotLaunchAssistantRoadmap() {
  return getEonbotCommandHubRoadmap();
}
