/**
 * Compatibility facade for pre-W230 operator imports.
 * W230 removes the duplicate action list; Chat now uses the Command Hub.
 */
import {
  EONBOT_COMMAND_HUB_VERSION,
  EONBOT_COMMAND_HUB_ACTIONS,
  detectEonbotCommandHubAction,
  buildEonbotCommandHubPlan,
  getEonbotCommandHubRoadmap
} from './eonbot-command-hub.js';

export const EONBOT_OPERATOR_VERSION = EONBOT_COMMAND_HUB_VERSION;
export const EONBOT_OPERATOR_ACTIONS = EONBOT_COMMAND_HUB_ACTIONS;

export function detectOperatorAction(input = '') {
  return detectEonbotCommandHubAction(input);
}

export function buildOperatorActionPlan(input = '', options = {}) {
  const plan = buildEonbotCommandHubPlan(input, options);
  return Object.freeze({
    ...plan,
    actionId: plan.commandId || null,
    compatibilityFacade: true
  });
}

export function getEonbotOperatorRoadmap() {
  return getEonbotCommandHubRoadmap();
}

export default Object.freeze({
  EONBOT_OPERATOR_VERSION,
  EONBOT_OPERATOR_ACTIONS,
  detectOperatorAction,
  buildOperatorActionPlan,
  getEonbotOperatorRoadmap
});
