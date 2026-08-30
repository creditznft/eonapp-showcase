export const REAL_PAYMENT_PROOF_VERSION = 'w175-real-payment-proof-v1';

export const PAYMENT_PROOF_STEPS = Object.freeze([
  { id: 'nowpayments-low-value', label: 'NOWPayments low-value proof', liveOnly: true, maxTestValueUsd: 2, requiresReceipt: true },
  { id: 'evm-low-value', label: 'Funded EVM low-value proof', liveOnly: true, maxTestValueUsd: 2, requiresReceipt: true },
  { id: 'admin-wallet-route', label: 'Admin wallet route proof', liveOnly: true, requiresAdminRecipient: true },
  { id: 'vault-receipt-persistence', label: 'Vault receipt persistence proof', liveOnly: false, requiresLocalPersistence: true },
  { id: 'refund-support-link', label: 'Refund/support path visible', liveOnly: false, requiresSupportLink: true }
]);

export function buildRealPaymentProofPlan(options = {}) {
  return {
    version: REAL_PAYMENT_PROOF_VERSION,
    decision: 'Do not claim real-money launch complete until low-value NOWPayments and funded EVM receipts are proven on live infrastructure.',
    safety: {
      lowValueOnly: true,
      maxTestValueUsd: Number(options.maxTestValueUsd || 2),
      noMainnetLargeValueTest: true,
      receiptMustPersistInVault: true,
      supportRefundPathRequired: true,
      neverExposeSecrets: true,
      serverTruthEndpointsRequired: true,
      noFrontendOnlyPaymentActivation: true
    },
    steps: PAYMENT_PROOF_STEPS,
    requiredEvidence: [
      'payment creation response',
      'payment status callback/IPN or chain receipt',
      'Vault receipt record after reload',
      'Cloudflare deploy did not erase receipt',
      'support/refund link visible from receipt UI',
      'Cloudflare /api/nowpayments/status returns a finished verified payment before entitlement activation',
      'Cloudflare /api/ad-rewards/status returns valued provider postback before account-wide reward credit'
    ]
  };
}

export function evaluatePaymentProofEvidence(evidence = {}) {
  const nowpayments = Boolean(evidence.nowpaymentsReceipt);
  const evm = Boolean(evidence.evmReceipt);
  const vault = Boolean(evidence.vaultReceiptPersisted);
  const support = Boolean(evidence.supportRefundVisible);
  return {
    ok: nowpayments && evm && vault && support,
    liveMoneyComplete: nowpayments && evm,
    vaultSafe: vault,
    supportReady: support,
    missing: [
      !nowpayments && 'nowpaymentsReceipt',
      !evm && 'evmReceipt',
      !vault && 'vaultReceiptPersisted',
      !support && 'supportRefundVisible'
    ].filter(Boolean),
    plan: buildRealPaymentProofPlan()
  };
}

export default { REAL_PAYMENT_PROOF_VERSION, PAYMENT_PROOF_STEPS, buildRealPaymentProofPlan, evaluatePaymentProofEvidence };
