/** UX-2 — compact shell account/settings/apps surfaces. */
export const UX2_SHELL_MODALS_CONTRACT = Object.freeze({
  schema: 'eonapp.ux2.shell-modals-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/eon-app-shell.js',
    'assets/css/eon-app-shell.css'
  ]),
  requiredModes: Object.freeze(['profile', 'settings', 'apps']),
  requiredSettingsTabs: Object.freeze([
    'general',
    'appearance',
    'voice',
    'local-ai',
    'sync',
    'connected',
    'privacy',
    'billing'
  ]),
  lockedBoundaries: Object.freeze([
    'EON Sync — Coming soon',
    'Billing is not active',
    'Nothing here connects, posts, deploys, or purchases on your behalf.'
  ]),
  sourceOnly: true,
  liveProofRequired: true
});
