/**
 * W306 — retired browser account attachment compatibility module.
 *
 * This module deliberately contains no sign-in flow, provider attachment,
 * persistence, network call, or global installation. It exists only so stale
 * imports fail closed and the retirement remains machine-testable.
 */

export const EON_LEGACY_ACCOUNT_ATTACHMENTS_RETIRED = true;

export function getRetiredAccountAttachmentStatus() {
  return Object.freeze({
    schema: 'eon.legacy.account-attachments.retired.v1',
    active: false,
    networkRequestCreated: false,
    storageWriteCreated: false,
    message: 'Browser account attachment helpers are retired. EONAPP uses a local profile and user-controlled backups only.'
  });
}

export function explainRetiredAccountAttachment() {
  return getRetiredAccountAttachmentStatus().message;
}
