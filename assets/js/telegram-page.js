import { getMonetizationPublicStatus } from './utils/monetization-decision-gate.js';
import { getPublicProductScopeSummary } from './product/eonapp-product-scope.js';

const status = getMonetizationPublicStatus();
const scope = getPublicProductScopeSummary();
const node = document.getElementById('telegram-status');
if (node) {
  node.textContent = `${status.reason} Telegram is optional for onboarding, help, updates and explicit deep links; the full browser app remains available without Telegram.`;
}
document.documentElement.dataset.monetization = status.active ? 'active' : 'retired';
document.documentElement.dataset.telegramRewardMechanics = String(scope.telegram.rewardMechanics);
