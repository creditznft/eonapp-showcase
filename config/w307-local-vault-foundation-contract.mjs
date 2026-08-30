/** W307 contract — encrypted local record foundation, with no implicit migration or cloud relay. */
export const W307_LOCAL_VAULT_FOUNDATION_CONTRACT = Object.freeze({
  schema: 'eonapp.w307.local-vault-foundation-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/local-first/eon-local-vault-crypto.js',
    'assets/js/local-first/eon-encrypted-record-store.js'
  ]),
  forbiddenPatterns: Object.freeze([
    'localStorage.',
    'sessionStorage.',
    'fetch(', 
    'XMLHttpRequest',
    'WebSocket',
    'exportKey('
  ]),
  requiredTruth: Object.freeze({
    directNetwork: false,
    localStorage: false,
    keyExport: false,
    passphrasePersistence: false
  })
});
