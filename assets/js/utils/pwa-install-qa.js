/**
 * pwa-install-qa.js
 * W26 install readiness checks for Android/iPhone QA handoff.
 */

export const PWA_INSTALL_QA_VIEWPORTS = Object.freeze([
  { id: 'android-portrait', width: 390, height: 844, platform: 'Android', orientation: 'portrait' },
  { id: 'android-landscape', width: 844, height: 390, platform: 'Android', orientation: 'landscape' },
  { id: 'iphone-portrait', width: 393, height: 852, platform: 'iPhone', orientation: 'portrait' },
  { id: 'iphone-landscape', width: 852, height: 393, platform: 'iPhone', orientation: 'landscape' },
  { id: 'small-phone', width: 360, height: 740, platform: 'Android', orientation: 'portrait' }
]);

export function validateManifestForInstall(manifest = {}) {
  const errors = [];
  const warnings = [];
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const shortcuts = Array.isArray(manifest.shortcuts) ? manifest.shortcuts : [];
  const screenshots = Array.isArray(manifest.screenshots) ? manifest.screenshots : [];

  if (!manifest.name || !manifest.short_name) errors.push('Manifest needs name and short_name.');
  if (!['standalone', 'fullscreen', 'minimal-ui'].includes(String(manifest.display || ''))) warnings.push('Display should be standalone/minimal-ui/fullscreen.');
  if (!['any', 'natural', 'portrait', 'landscape'].includes(String(manifest.orientation || ''))) warnings.push('Orientation should be flexible for Realm landscape and portrait fallback.');
  if (!icons.some((icon) => String(icon.sizes || '').includes('192'))) errors.push('Missing 192x192 icon.');
  if (!icons.some((icon) => String(icon.sizes || '').includes('512'))) errors.push('Missing 512x512 icon.');
  if (!icons.some((icon) => String(icon.purpose || '').includes('maskable'))) warnings.push('Add a maskable icon for Android adaptive icons.');
  if (String(manifest.start_url || '') !== '/?source=pwa') errors.push('PWA must keep the root Chat surface as the install entry.');
  if (!shortcuts.some((item) => String(item.url || '').includes('/eoncity'))) warnings.push('Add EON City shortcut for installed app.');
  if (!shortcuts.some((item) => String(item.url || '').includes('/local-ai'))) warnings.push('Add Local AI setup shortcut for installed app.');
  if (screenshots.length < 2) warnings.push('Add mobile and desktop PWA screenshots.');

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    iconCount: icons.length,
    shortcutCount: shortcuts.length,
    screenshotCount: screenshots.length,
    orientation: manifest.orientation || 'unspecified'
  };
}

export function buildInstallQAChecklist(manifest = {}) {
  const validation = validateManifestForInstall(manifest);
  return {
    validation,
    manualChecks: [
      'Install from Chrome Android and open in portrait.',
      'Keep Chat usable in portrait; enter 3D City only by an explicit landscape action.',
      'Install from iPhone Safari using Add to Home Screen and open in portrait.',
      'Open Chat, Workspace, Vault, Trade, Local AI and EON City shortcuts after install.',
      'Confirm no horizontal clipping at 360, 390, 430, 768, and desktop widths.',
      'Confirm reduced-motion users still see static Realm fallback.'
    ],
    viewports: PWA_INSTALL_QA_VIEWPORTS
  };
}
