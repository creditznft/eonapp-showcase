#!/usr/bin/env node
import fs from 'node:fs';
import { buildW621LiveRolloutChecklist, validateW621LiveDodoRolloutContract } from '../config/w621-live-dodo-cloudflare-rollout-contract.mjs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => fs.existsSync(new URL(`../${path}`, import.meta.url));

export function inspectW621LiveDodoCloudflareRolloutGate() {
  const errors = [];
  const contract = validateW621LiveDodoRolloutContract();
  if (!contract.ok) errors.push(...contract.errors);
  const checklist = buildW621LiveRolloutChecklist();
  const requiredFiles = [
    'assets/js/billing/eon-dodo-live-runtime.js',
    'migrations/billing/0001_billing_command_entitlement_authority.sql',
    'config/w621-live-dodo-cloudflare-rollout-contract.mjs',
    'functions/api/billing/status.js',
    'functions/api/billing/checkout.js',
    'functions/api/billing/webhooks/dodo.js',
    'functions/api/billing/referral-status.js',
    'tests/unit/w621-live-dodo-cloudflare-rollout.test.mjs'
  ];
  for (const file of requiredFiles) if (!exists(file)) errors.push(`Missing W621 file: ${file}`);
  const runtime = read('assets/js/billing/eon-dodo-live-runtime.js');
  const billingMigration = read('migrations/billing/0001_billing_command_entitlement_authority.sql');
  const checkoutRoute = read('functions/api/billing/checkout.js');
  const webhookRoute = read('functions/api/billing/webhooks/dodo.js');
  const statusRoute = read('functions/api/billing/status.js');
  if (!runtime.includes('https://live.dodopayments.com')) errors.push('Live Dodo API base missing.');
  if (!runtime.includes('/checkouts')) errors.push('Checkout creation endpoint missing.');
  if (!runtime.includes('webhook-id') || !runtime.includes('webhook-signature') || !runtime.includes('webhook-timestamp')) errors.push('Webhook signature headers missing.');
  if (!billingMigration.includes('CREATE TABLE IF NOT EXISTS eon_billing_events') || !billingMigration.includes('CREATE TABLE IF NOT EXISTS eon_entitlements') || !billingMigration.includes("VALUES ('billing', 1")) errors.push('Versioned D1 billing migration authority missing.');
  if (/\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|VIEW)\b/i.test(runtime)) errors.push('Request-time billing DDL must remain absent.');
  if (!runtime.includes('EON_BILLING_ROLLOUT') || !runtime.includes('production')) errors.push('Production rollout config missing.');
  if (!runtime.includes('trial_period_days') || !runtime.includes('W621_TRIAL_DAYS')) errors.push('7-day trial checkout payload missing.');
  if (!runtime.includes('subscription.plan_changed')) errors.push('Plan-change event mapping missing.');
  if (!runtime.includes('refund.succeeded') || !runtime.includes('dispute.lost') || !runtime.includes('dispute.expired')) errors.push('Revocation event mapping incomplete.');
  if (!checkoutRoute.includes('createDodoCheckoutSession') || !checkoutRoute.includes('same_origin_required') || !checkoutRoute.includes('login_required')) errors.push('Checkout route must be live, same-origin protected, and account-bound.');
  if (!webhookRoute.includes('processDodoWebhook') || !webhookRoute.includes('dodo-webhook-route-live')) errors.push('Webhook route must use live signed adapter and GET health check.');
  if (!statusRoute.includes('buildBillingStatusPayload')) errors.push('Status route must expose W621 live readiness.');
  if (/dodo-webhook-adapter-disabled|route contract|later activation wave|checkoutCreated:\s*false/.test(webhookRoute + checkoutRoute)) errors.push('W621 live routes still contain W619 disabled placeholder language.');
  if (runtime.includes('DODO_PAYMENTS_API_KEY=') || runtime.includes('DODO_WEBHOOK_SECRET=')) errors.push('Secret value assignment found in source.');
  if (!checklist.codexMustProve.includes('Dodo checkout URL returned for all seven paid products')) errors.push('Codex proof checklist missing seven-product checkout proof.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w621.live-dodo-cloudflare-rollout-gate.v1', checks: 46 });
}

const report = inspectW621LiveDodoCloudflareRolloutGate();
if (!report.ok) {
  console.error(`[W621] Live Dodo/Cloudflare rollout gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W621] Live Dodo/Cloudflare rollout gate passed (${report.checks}/46).`);
