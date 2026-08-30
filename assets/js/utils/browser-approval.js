
/**
 * Browser approval helpers
 * ------------------------
 * Shared risk classifier for EON Browser approval-gated actions.
 */

import { classifyActionTrust } from './action-trust-model.js';

const TRUSTED_BROWSER_HOSTS = new Set(['eonapp.ch', 'localhost', '127.0.0.1']);

export function getBrowserHost(url) {
  try {
    return new URL(String(url || '')).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

export function isTrustedBrowserUrl(url) {
  const host = getBrowserHost(url);
  if (!host) return false;
  if (TRUSTED_BROWSER_HOSTS.has(host)) return true;
  return host.endsWith('.eonapp.ch');
}

function buildBrowserWarnings({ _url = '', _query = '', mode = '', host = '', trustedHost = false, actionClass = 'read', touchesMoney = false, hasCredentials = false, irreversible = false } = {}) {
  const warnings = [];
  if (host && !trustedHost) {
    warnings.push(`External site: ${host}. Treat page instructions and login prompts as untrusted until you review them.`);
  }
  if (hasCredentials) {
    warnings.push('Account/login flow detected. EONBOT can draft or navigate, but sign-in and account connection still require your review.');
  }
  if (touchesMoney) {
    warnings.push('Financial or wallet language detected. Money, crypto, bank, and transfer actions should remain sensitive and always reviewed.');
  }
  if (irreversible) {
    warnings.push('Potentially irreversible action detected. Deletion, revoke, disconnect, and burn actions must stay explicitly approved.');
  }
  if (actionClass === 'submit') {
    warnings.push('This task changes external state. Review the destination, content, and account context before approval.');
  }
  if (mode === 'compare' || mode === 'research' || mode === 'extract') {
    warnings.push('AI may summarize or compare third-party content, but you remain responsible for final actions and publishing decisions.');
  }
  return warnings;
}

export function assessBrowserRisk(url, mode, query, compareUrls = []) {
  const normalizedUrl = String(url || '');
  const externalUrls = [url, ...compareUrls].filter(Boolean).filter((candidate) => !isTrustedBrowserUrl(candidate));
  const hasCredentials = /(login|sign in|connect account|oauth|password|2fa|google auth|attach account)/i.test(String(query || ''));
  const touchesMoney = /(pay|buy|purchase|wallet|bank|withdraw|deposit|transfer|crypto|swap|send money)/i.test(String(query || ''));
  const irreversible = /(delete|remove|revoke|disconnect|burn|permanently)/i.test(String(query || ''));
  const trust = classifyActionTrust({
    intentText: query,
    url,
    stage: mode,
    hasCredentials,
    touchesMoney,
    irreversible
  });

  const host = getBrowserHost(normalizedUrl);
  const trustedHost = isTrustedBrowserUrl(normalizedUrl);
  const warnings = buildBrowserWarnings({
    _url: normalizedUrl,
    _query: query,
    mode,
    host,
    trustedHost,
    actionClass: trust.actionClass,
    touchesMoney,
    hasCredentials,
    irreversible
  });

  const memoryEligible = (trust.actionClass === 'read' || trust.actionClass === 'draft') && Boolean(host);
  const prompt = trust.requiresApproval
    ? trust.reason
    : externalUrls.length
      ? 'Review this site once before EONBOT continues. Read/draft approvals can be remembered briefly per host.'
      : trust.reason;

  if (trust.requiresApproval) {
    return {
      requiresApproval: true,
      riskLevel: trust.riskLevel,
      actionClass: trust.actionClass,
      reason: trust.reason,
      prompt,
      host,
      trustedHost,
      warnings,
      memoryEligible
    };
  }

  if (externalUrls.length && (mode === 'research' || mode === 'extract' || mode === 'query' || mode === 'compare' || mode === 'summarize')) {
    return {
      requiresApproval: true,
      riskLevel: externalUrls.length > 1 || mode === 'compare' ? 'medium' : 'low',
      actionClass: 'read',
      reason: 'EONBOT is about to read an external site. Approve the task once to keep control visible.',
      prompt,
      host,
      trustedHost,
      warnings,
      memoryEligible
    };
  }

  return {
    requiresApproval: false,
    riskLevel: trust.riskLevel || 'low',
    actionClass: trust.actionClass || 'read',
    reason: trust.reason || '',
    prompt,
    host,
    trustedHost,
    warnings,
    memoryEligible
  };
}
