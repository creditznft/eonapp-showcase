import {
  buildW143PageTrustCopyAudit,
  recordW143LegalTrustCopyReceipt
} from './utils/legal-trust-copy.js';

function getPageText() {
  const title = document.title || '';
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const body = document.body?.innerText || '';
  return [title, description, body].join('\n');
}

function markProofCard(audit) {
  const proof = document.querySelector('[data-w143-trust-copy-proof="true"]');
  if (!proof) return;
  proof.setAttribute('data-w143-trust-copy-status', audit.ok ? 'passed' : 'review');
  proof.setAttribute('data-w143-trust-copy-score', String(audit.score));
}

function initW143LegalTrustCopyProof() {
  try {
    const audit = buildW143PageTrustCopyAudit(getPageText());
    recordW143LegalTrustCopyReceipt(localStorage, { audit });
    markProofCard(audit);
  } catch (error) {
    console.warn('[W143] legal trust proof could not be recorded', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initW143LegalTrustCopyProof, { once: true });
} else {
  initW143LegalTrustCopyProof();
}
