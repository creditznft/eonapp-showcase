// Public-safe example: EONBOT command routing, not production assistant code.
export function routeEonbotCommand(message = '') {
  const text = String(message).toLowerCase();
  if (/enable.*(ads|sponsor|multitag)|microphone|wallet|payment|backup/.test(text)) {
    return { action: 'confirm-first', safety: 'sensitive' };
  }
  if (/city|game|realm/.test(text)) return { action: 'open', target: '/realm.html' };
  if (/reward|boost|earn/.test(text)) return { action: 'open', target: '/reward-access.html' };
  if (/vault|keys|backup/.test(text)) return { action: 'open', target: '/vault.html' };
  return { action: 'answer-guide', target: 'eonbot-help' };
}
