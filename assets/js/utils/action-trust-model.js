/**
 * EON Action Trust Model
 * ----------------------
 * Shared browser/task trust classification for approvals and product truth.
 */

export const ACTION_TRUST_LEVELS = Object.freeze([
  {
    id: 'read',
    label: 'Read-only',
    requiresApproval: false,
    riskLevel: 'low',
    description: 'Look, inspect, summarize, or gather information without changing third-party state.'
  },
  {
    id: 'draft',
    label: 'Draft',
    requiresApproval: false,
    riskLevel: 'medium',
    description: 'Prepare content or form state without submitting it.'
  },
  {
    id: 'submit',
    label: 'Submit',
    requiresApproval: true,
    riskLevel: 'high',
    description: 'Post, upload, connect, login, or submit something that changes external state.'
  },
  {
    id: 'sensitive',
    label: 'Sensitive',
    requiresApproval: true,
    riskLevel: 'high',
    description: 'Money, secrets, deletion, security settings, credentials, or irreversible actions.'
  }
]);

const LEVEL_MAP = Object.fromEntries(ACTION_TRUST_LEVELS.map((item) => [item.id, item]));

const READ_RE = /\b(read|summari[sz]e|review|inspect|browse|search|find|compare|extract|research|look up|watch|translate|explain)\b/i;
const DRAFT_RE = /\b(draft|prepare|compose|generate|write|plan|outline|mock|prefill|queue|stage)\b/i;
const SUBMIT_RE = /\b(post|publish|upload|send|submit|share|connect|login|sign in|create account|register|book|order|apply|comment)\b/i;
const SENSITIVE_RE = /\b(pay|buy|purchase|transfer|wallet|seed phrase|private key|delete|remove|disconnect|revoke|2fa|password|bank|binance|metamask|crypto|withdraw)\b/i;

export function getActionTrustMeta(value) {
  const id = String(value || '').trim().toLowerCase();
  return LEVEL_MAP[id] || LEVEL_MAP.read;
}

export function classifyActionTrust({
  intentText = '',
  url = '',
  method = '',
  stage = '',
  hasCredentials = false,
  touchesMoney = false,
  irreversible = false
} = {}) {
  const text = [intentText, url, method, stage].filter(Boolean).join(' ').toLowerCase();

  let actionClass = 'read';
  if (SENSITIVE_RE.test(text) || hasCredentials || touchesMoney || irreversible) {
    actionClass = 'sensitive';
  } else if (SUBMIT_RE.test(text) || /\bpost\b|\blogin\b|\bconnect\b|\bupload\b/i.test(text)) {
    actionClass = 'submit';
  } else if (DRAFT_RE.test(text)) {
    actionClass = 'draft';
  } else if (READ_RE.test(text)) {
    actionClass = 'read';
  }

  const meta = getActionTrustMeta(actionClass);
  const reason = actionClass === 'sensitive'
    ? 'This action touches credentials, money, deletion, or other sensitive state and must stay explicitly approved.'
    : actionClass === 'submit'
      ? 'This action changes external state, so the user should review and approve it before EONBOT completes it.'
      : actionClass === 'draft'
        ? 'This action can prepare work automatically, but should still remain visible before submission.'
        : 'This action is read-only and safe to run without a submission prompt.';

  return {
    actionClass,
    label: meta.label,
    requiresApproval: meta.requiresApproval,
    riskLevel: meta.riskLevel,
    description: meta.description,
    reason
  };
}
