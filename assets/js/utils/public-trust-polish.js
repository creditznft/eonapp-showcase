export const PUBLIC_TRUST_POLISH_VERSION = 'w174-public-trust-polish-v1';

export const TRUST_COPY_LOCKS = Object.freeze({
  rewards: 'No reward, referral-value, ad, sponsor, or offerwall campaign is active in this release.',
  sponsorBoost: 'No sponsor-boost, Direct Link, or MultiTag value path is active in this release.',
  trading: 'Trade tools are research and paper-trading helpers, not financial advice and never a profit promise.',
  ai: 'AI features depend on configured providers, browser capability, model limits, and user permissions. Outputs require user review.',
  payments: 'No checkout, subscription, wallet payment, or payment activation is active in this release.',
  privacy: 'Vault backups, API keys, receipts, generated NFTs, settings, and rewards must survive Cloudflare updates and remain user controlled.'
});

export function buildPublicTrustChecklist() {
  return {
    version: PUBLIC_TRUST_POLISH_VERSION,
    requiredPages: ['/support', '/legal', '/privacy', '/terms', '/billing'],
    copyLocks: TRUST_COPY_LOCKS,
    checks: [
      'No guaranteed income language.',
      'No payment, wallet, reward, or referral-value entitlement is active.',
      'No trading profit claims.',
      'No universal voice-recognition promise.',
      'No secret/API-key exposure in DOM.',
      'Billing status and support boundaries are visible from current policy pages.',
      'Experimental City, provider, and local-runtime limitations are explained honestly.'
    ]
  };
}

export function auditTrustCopy(sourceMap = {}) {
  const risky = [/guaranteed\s+(income|profit|earnings)/i, /risk[- ]?free/i, /lifetime\s+unlock\s+from\s+(direct|multitag|social)/i, /voice\s+works\s+in\s+every\s+browser/i];
  const findings = [];
  Object.entries(sourceMap).forEach(([file, text]) => {
    risky.forEach((pattern) => {
      if (pattern.test(String(text || ''))) findings.push({ file, pattern: String(pattern), severity: 'blocker' });
    });
  });
  return { ok: findings.length === 0, findings, checklist: buildPublicTrustChecklist() };
}

export default { PUBLIC_TRUST_POLISH_VERSION, TRUST_COPY_LOCKS, buildPublicTrustChecklist, auditTrustCopy };
