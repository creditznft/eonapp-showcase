/**
 * Compatibility facade for pre-W230 imports.
 * Canonical EONBOT command logic lives in eonbot-command-hub.js.
 */
import {
  EONBOT_COMMAND_HUB_VERSION,
  EONBOT_COMMAND_HUB_ACTIONS,
  detectEonbotCommandHubAction,
  buildEonbotCommandHubPlan,
  getEonbotCommandHubRoadmap
} from './eonbot-command-hub.js';

export const EONBOT_COMMAND_CENTER_VERSION = EONBOT_COMMAND_HUB_VERSION;
export const EONBOT_COMMANDS = EONBOT_COMMAND_HUB_ACTIONS;

export function detectEonbotCommand(text = '') {
  return detectEonbotCommandHubAction(text);
}

export function buildEonbotCommandPlan(text = '', options = {}) {
  return buildEonbotCommandHubPlan(text, options);
}

export function getEonbotCommandCenterRoadmap() {
  return getEonbotCommandHubRoadmap();
}
