/**
 * HISTORICAL ONLY — quarantined during W525A Google Drive/Vault clarification.
 *
 * This file is retained solely for source-history review. It is not imported by
 * the active product and must never be restored as a transport, provider,
 * wallet, NFT, or cloud-backup implementation.
 *
 * Active product truth now lives in:
 * - assets/js/local-first/eon-data-continuity.js
 * - assets/js/local-first/eon-google-drive-backup-foundation.js
 * - assets/js/utils/cloud-backup-connectors.js
 */

export const BACKUP_HANDOFF_PROVIDERS = Object.freeze([
  { id: 'google-drive', label: 'Google Drive', url: 'https://drive.google.com', type: 'cloud-drive' },
  { id: 'icloud', label: 'iCloud Drive', url: 'https://www.icloud.com', type: 'cloud-drive' },
  { id: 'onedrive', label: 'OneDrive', url: 'https://onedrive.live.com', type: 'cloud-drive' },
  { id: 'dropbox', label: 'Dropbox', url: 'https://www.dropbox.com', type: 'cloud-drive' },
  { id: 'email', label: 'Encrypted email copy', url: '', type: 'manual' },
  { id: 'usb', label: 'Offline USB copy', url: '', type: 'manual' }
]);

export function buildCloudBackupHandoffPlan({ encrypted = true, hasPassphrase = false } = {}) {
  return {
    encrypted,
    hasPassphrase,
    recommendation: encrypted && hasPassphrase
      ? 'Upload the encrypted backup to one or more cloud drives and keep one offline copy.'
      : 'Do not upload plain backups to cloud storage. Export an encrypted backup first.',
    providers: BACKUP_HANDOFF_PROVIDERS,
    checklist: [
      encrypted && hasPassphrase
        ? 'Export the encrypted backup file first.'
        : 'Set a strong passphrase before exporting.',
      'Upload it to one or more private storage locations you control.',
      'Keep one extra offline copy (USB or device storage).',
      'Test restore on a second device before trusting the backup fully.'
    ]
  };
}

// W90: NFT/lootbox generated assets must be part of the encrypted account backup.
export function buildNftAssetBackupHandoffPlan({ hasOwnedNfts = false, hasOwnedLootboxes = false, encrypted = true } = {}) {
  return {
    schema: 'eon.nft-asset-backup-handoff.w90.v1',
    encrypted,
    includesOwnedNfts: true,
    includesOwnedLootboxes: true,
    includesGeneratedImages: true,
    includesMetadata: true,
    recoverWithoutMainnetMint: true,
    recommendation: encrypted
      ? 'Export one encrypted backup that includes wallet state, owned utility NFTs, unopened lootboxes, generated images and metadata.'
      : 'Create an encrypted backup before storing generated NFT or lootbox images in cloud storage.',
    checklist: [
      'Include owned utility NFT records and feature entitlement metadata.',
      'Include unopened internal lootboxes with sealed metadata and generated image previews.',
      'Include generated SVG/data-URI previews so assets recover even before Arweave or mainnet minting.',
      'Refresh optional on-chain ownership before granting utility after restore.',
      'Never include API keys, seed phrases, raw IP, country, user-agent or fingerprint in NFT asset backups.'
    ],
    status: hasOwnedNfts || hasOwnedLootboxes ? 'asset-backup-required' : 'ready-when-assets-exist'
  };
}
