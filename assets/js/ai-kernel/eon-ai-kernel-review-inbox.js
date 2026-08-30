/** W318 — merged, non-executing local review summary. */

import { readEonKernelForegroundSession } from './eon-ai-kernel-session-store.js';

function clean(value = '', max = 160) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function listEonKernelForegroundReviewItems({ storage, legacyCards = [] } = {}) {
  const session = readEonKernelForegroundSession({ storage });
  const kernelItems = session.records
    .filter((record) => record.reviewStatus === 'review-needed' || record.state === 'review-needed')
    .map((record) => Object.freeze({
      id: record.reviewId || `kernel:${record.taskId}`,
      source: 'foreground-kernel',
      title: clean(record.title || 'Local task review', 120),
      summary: 'Foreground local review only. No account, provider, schedule, publish, send, deploy, or payment action can occur here.',
      route: '/workspace',
      expiresAt: record.reviewExpiresAt || '',
      externalEffect: false,
      canApproveExternalEffect: false
    }));
  const legacyItems = Array.isArray(legacyCards) ? legacyCards.map((card) => Object.freeze({
    id: clean(card?.id, 160),
    source: 'local-action-card',
    title: clean(card?.title, 120),
    summary: clean(card?.summary, 300),
    route: clean(card?.route, 120) || '/workspace',
    expiresAt: clean(card?.expiresAt, 64),
    externalEffect: false,
    canApproveExternalEffect: false
  })).filter((item) => item.id) : [];
  return Object.freeze([...kernelItems, ...legacyItems]);
}

export function getEonKernelReviewInboxTruth() {
  return Object.freeze({
    mergedView: true,
    foregroundSessionOnly: true,
    externalApproval: false,
    autoExecution: false,
    rawContent: false,
    directNetwork: false
  });
}
