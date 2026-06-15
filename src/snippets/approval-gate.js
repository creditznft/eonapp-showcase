// Public-safe example: approval classification, not production source.
export function classifyAction(action = {}) {
  const text = `${action.kind || ''} ${action.label || ''}`.toLowerCase();
  if (/wallet|payment|backup|secret|api key|microphone|ads|sponsor/.test(text)) {
    return { approval: 'required', reason: 'sensitive-user-controlled-action' };
  }
  if (/submit|purchase|claim|postback/.test(text)) {
    return { approval: 'required', reason: 'external-state-change' };
  }
  return { approval: 'low-risk', reason: 'navigation-or-guide' };
}
