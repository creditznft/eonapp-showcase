export const W137_WORKSTATION_SCHEMA = 'eonapp.w137.workstation-consolidation.v1';

export const W137_CANONICAL_WORKSTATION_ROUTE = '/eon-browser.html';

export const W137_REQUIRED_WORKSTATION_APPS = Object.freeze([
  { id: 'code-maker', label: 'Code Maker', route: '/code-maker.html', requiredText: ['Code Maker', 'preview'] },
  { id: 'chat', label: 'EONBOT Chat', route: '/chat.html', requiredText: ['EONBOT', 'chat'] },
  { id: 'vault', label: 'Vault', route: '/vault.html', requiredText: ['Vault'] },
  { id: 'market', label: 'Market', route: '/market.html', requiredText: ['Market'] },
  { id: 'realm', label: 'Realm / EON City', route: '/realm.html', requiredText: ['EON City'] },
  { id: 'automation', label: 'Automation OS', route: '/automation-studio.html', requiredText: ['Automation'] },
  { id: 'creator', label: 'Creator Studio', route: '/creator-studio.html', requiredText: ['Creator'] },
  { id: 'insights', label: 'Research Lab', route: '/insights', requiredText: ['Research Lab'] },
  { id: 'device-lab', label: 'Device Lab', route: '/workbench.html#device-lab', requiredText: ['Device Lab', 'explicit confirmation'] },
  { id: 'code-showcase', label: 'Code Showcase', route: '/realm-code-preview.html', requiredText: ['Code Showcase', 'code explorer'] }
]);

export const W137_ROUTE_ALIASES = Object.freeze([
  ['/build', '/eon-browser.html'],
  ['/create', '/creator-studio.html'],
  ['/trade', '/insights'],
  ['/device-lab', '/workbench.html#device-lab'],
  ['/device-lab.html', '/workbench.html#device-lab'],
  ['/code-showcase', '/realm-code-preview.html'],
  ['/code-explorer', '/realm-code-preview.html'],
  ['/code-preview', '/realm-code-preview.html']
]);

export const W137_BUTTON_MATRIX_GROUPS = Object.freeze([
  { id: 'command-deck', file: 'eon-browser.html', selector: 'data-ew-open', minimum: 10 },
  { id: 'legacy-workspace-bar', file: 'eon-browser.html', selector: 'data-w137-workspace-bar', minimum: 1 },
  { id: 'workstation-app-list', file: 'assets/js/eon-workstation-page.js', selector: 'WORKSTATION_APPS', minimum: 1 },
  { id: 'workbench-alias', file: 'workbench.html', selector: 'data-w137-workbench-alias', minimum: 1 },
  { id: 'device-lab-anchor', file: 'workbench.html', selector: 'id="device-lab"', minimum: 1 },
  { id: 'code-showcase-standalone', file: 'assets/js/realm3d/realm-code-preview.js', selector: 'data-w137-code-showcase="standalone-visible"', minimum: 1 }
]);

export const W137_NEXT_MAKEOVER_TARGETS = Object.freeze([
  'W138 Market + NFT starter drop truth repair',
  'W139 Vault persistence and backup proof',
  'W140 EON City command-center redesign',
  'W141 NPC movement and low-end mobile performance',
  'W142 Creator Studio safety and copy cleanup',
  'W143 legal/billing/trust/support final copy',
  'W144 final enterprise certification'
]);
