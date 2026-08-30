#!/usr/bin/env node
/**
 * W104 compatibility entry point.
 * The original Trading Lab gate depended on retired connector and live-execution
 * modules. W375 replaces it with the Research Lab safety gate.
 */
import { auditMarketIntelligenceSafety } from './w375-market-intelligence-safety-gate.mjs';

const report = auditMarketIntelligenceSafety();
const compatibility = {
  schema: 'eon.w104.retired-trading-lab-compatibility.v2',
  replacement: 'eonapp.w375.market-intelligence-safety-gate.v1',
  ok: report.ok,
  score: report.score,
  note: 'W104 Trading Lab is retired. Current certification is local-only Research Lab.'
};
console.log(JSON.stringify(compatibility, null, 2));
process.exitCode = compatibility.ok ? 0 : 1;
