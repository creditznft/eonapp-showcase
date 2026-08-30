export const R4_PROGRAM_LEDGER_SCHEMA = 'eonapp.r4.program-ledger.v1';
export const R4_PROGRAM_LEDGER_PATH = 'program/R4_PROGRAM_LEDGER_2026-06-26.json';
export const R4_PROGRAM_LEDGER_ALLOWED_STATUSES = Object.freeze([
  'complete-source',
  'planned',
  'blocked-external',
  'hold-governance'
]);
export const R4_PROGRAM_LEDGER_REQUIRED_IDS = Object.freeze([
  'R4-00', 'R4-01', 'R4-02', 'A-00', 'A-01', 'A-02', 'A-03',
  'I-01', 'S-00', 'S-01', 'C-00', 'M-00A', 'M-00', 'M-01', 'M-02'
]);
export const R4_PROGRAM_LEDGER_NO_GO_IDS = Object.freeze(['C-00', 'M-01']);
export const R4_PROGRAM_LEDGER_COMMERCE_HOLD_IDS = Object.freeze(['M-00', 'M-02']);
