/**
 * W382 — minimal root EONBOT home interactions and local-only file intake.
 * No file leaves the browser until the user explicitly sends a message, and
 * this first wave passes only text/code context to the selected AI route.
 */
import {
  addLocalAttachments,
  clearQueuedLocalAttachments,
  formatLocalAttachmentBytes,
  listQueuedLocalAttachments,
  removeQueuedLocalAttachment
} from './chat/local-attachments.js';
import { openLocalFileViewer } from './chat/local-file-viewer.js';
import { consumeEonHandoffFromLocation, removeEonHandoffQuery } from './contracts/navigation/eon-handoff-authority.js';

function bySelector(selector) { return document.querySelector(selector); }

function closeSetup(dialog) {
  if (!dialog) return;
  try { dialog.close(); } catch { dialog.removeAttribute('open'); }
}

function openSetup(dialog) {
  if (!dialog) return;
  try {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  } catch { dialog.setAttribute('open', ''); }
}

function focusComposerWithPrompt(prompt = '') {
  const input = bySelector('#chat-input');
  if (!input) return;
  input.value = String(prompt || '').trim();
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function supportPromptFromHandoff(handoff) {
  if (handoff?.kind !== 'support-prefill') return '';
  const payload = handoff.payload || {};
  const evidence = Array.isArray(payload.evidence) ? payload.evidence.filter(Boolean).slice(0, 8).join(', ') : '';
  return [
    `Support topic: ${String(payload.label || handoff.reference?.label || 'EONAPP support').trim()}`,
    String(payload.description || '').trim(),
    evidence ? `Safe evidence checklist: ${evidence}.` : '',
    'Do not ask me for seed phrases, private keys, full API keys, passwords, or wallet backup files.'
  ].filter(Boolean).join('\n');
}

function readPendingComposerPrompt() {
  try {
    const value = sessionStorage.getItem('eon:chat:pending-composer-prompt:v1') || '';
    sessionStorage.removeItem('eon:chat:pending-composer-prompt:v1');
    return String(value || '').trim();
  } catch { return ''; }
}

function attachmentLabel(attachment) {
  const kind = attachment.kind === 'text' && attachment.textIncluded
    ? 'Text included on send'
    : attachment.kind === 'image'
      ? 'Local image preview'
      : attachment.kind === 'pdf'
        ? 'Local PDF preview'
        : attachment.kind === 'audio' || attachment.kind === 'video'
          ? 'Local media preview'
          : attachment.kind === 'office'
            ? 'Metadata preview only'
            : 'Document stays local';
  return `${attachment.name} · ${formatLocalAttachmentBytes(attachment.size)} · ${kind}`;
}

function rejectionMessage(reason = '') {
  const messages = {
    'file-limit': 'You can attach up to 8 files at once.',
    'duplicate-file': 'That file is already attached.',
    'sensitive-file': 'Potential secret files cannot be attached here. Use Vault instead.',
    'sensitive-content': 'This text appears to contain a credential, so it was not attached.',
    'file-too-large': 'Each file must be 5 MB or smaller.',
    'total-too-large': 'Attached files together must stay within 12 MB.',
    'unsupported-file': 'This file type is not supported in chat yet.',
    'invalid-file': 'That file could not be read.'
  };
  return messages[reason] || 'That file could not be attached.';
}

function renderAttachmentTray() {
  const tray = bySelector('#eonbot-attachment-tray');
  if (!tray) return;
  const attachments = listQueuedLocalAttachments();
  tray.hidden = attachments.length === 0;
  tray.innerHTML = '';
  if (!attachments.length) return;

  const head = document.createElement('div');
  head.className = 'eonbot-attachment-tray-head';
  const status = document.createElement('span');
  status.textContent = `${attachments.length} local file${attachments.length === 1 ? '' : 's'} attached`;
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'eonbot-attachment-clear';
  clear.textContent = 'Clear';
  clear.addEventListener('click', () => {
    clearQueuedLocalAttachments();
    renderAttachmentTray();
  });
  head.append(status, clear);
  tray.appendChild(head);

  const list = document.createElement('div');
  list.className = 'eonbot-attachment-list';
  attachments.forEach((attachment) => {
    const chip = document.createElement('div');
    chip.className = 'eonbot-attachment-chip';
    const label = document.createElement('span');
    label.textContent = attachmentLabel(attachment);
    label.title = attachmentLabel(attachment);
    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'eonbot-attachment-preview';
    preview.setAttribute('aria-label', `Preview ${attachment.name} locally`);
    preview.textContent = 'Preview';
    preview.addEventListener('click', () => { void openLocalFileViewer(attachment.id); });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'eonbot-attachment-remove';
    remove.setAttribute('aria-label', `Remove ${attachment.name}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      removeQueuedLocalAttachment(attachment.id);
      renderAttachmentTray();
    });
    chip.append(label, preview, remove);
    list.appendChild(chip);
  });
  tray.appendChild(list);
}

async function addFiles(files) {
  const result = await addLocalAttachments(files);
  renderAttachmentTray();
  if (result.rejected.length) {
    const first = result.rejected[0];
    window.dispatchEvent(new CustomEvent('eon:local-attachment-notice', { detail: { message: rejectionMessage(first.reason), tone: 'error' } }));
  }
  if (result.accepted.length) focusComposerWithPrompt(bySelector('#chat-input')?.value || '');
}

function bindLocalAttachments() {
  const input = /** @type {HTMLInputElement | null} */ (bySelector('#chat-attachment-input'));
  const attach = bySelector('#chat-attach');
  const dropZone = bySelector('[data-eonbot-file-drop-zone]');
  const container = bySelector('.eonbot-home-container');
  let dragDepth = 0;

  attach?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', async () => {
    if (input.files?.length) await addFiles(input.files);
    input.value = '';
  });

  const hasFiles = (event) => Array.from(event?.dataTransfer?.types || []).includes('Files');
  const onDragEnter = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth += 1;
    container?.classList.add('is-dropping-files');
    dropZone?.setAttribute('aria-hidden', 'false');
  };
  const onDragOver = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (event) => {
    if (!hasFiles(event)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      container?.classList.remove('is-dropping-files');
      dropZone?.setAttribute('aria-hidden', 'true');
    }
  };
  const onDrop = async (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth = 0;
    container?.classList.remove('is-dropping-files');
    dropZone?.setAttribute('aria-hidden', 'true');
    if (event.dataTransfer?.files?.length) await addFiles(event.dataTransfer.files);
  };

  document.addEventListener('dragenter', onDragEnter);
  document.addEventListener('dragover', onDragOver);
  document.addEventListener('dragleave', onDragLeave);
  document.addEventListener('drop', onDrop);
  window.addEventListener('eon:chat-attachments-consumed', renderAttachmentTray);
  window.addEventListener('eon:chat-new-thread', () => {
    clearQueuedLocalAttachments();
    renderAttachmentTray();
  });
}

async function initEonbotHome() {
  const dialog = bySelector('[data-eonbot-home-setup]');
  document.querySelectorAll('[data-eonbot-home-open-setup]').forEach((button) => {
    button.addEventListener('click', () => openSetup(dialog));
  });
  document.querySelectorAll('[data-eonbot-home-close-setup]').forEach((button) => {
    button.addEventListener('click', () => closeSetup(dialog));
  });
  dialog?.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) closeSetup(dialog);
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-eonbot-home-prompt]');
    if (button) focusComposerWithPrompt(button.dataset.eonbotHomePrompt || '');
  });
  window.addEventListener('eon:chat-new-thread', () => {
    window.requestAnimationFrame(() => focusComposerWithPrompt(''));
  });
  window.addEventListener('eon:composer-prompt', (event) => {
    const prompt = String(event?.detail?.prompt || '').trim();
    if (prompt) focusComposerWithPrompt(prompt);
  });
  bindLocalAttachments();
  renderAttachmentTray();
  const incoming = await consumeEonHandoffFromLocation({ receiverId: 'home' });
  const handoffPrompt = incoming.ok ? supportPromptFromHandoff(incoming.handoff) : '';
  if (incoming.ok || !['handoff-query-missing', 'handoff-not-found'].includes(incoming.reason)) removeEonHandoffQuery();
  const pending = handoffPrompt || readPendingComposerPrompt();
  if (pending) window.requestAnimationFrame(() => focusComposerWithPrompt(pending));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void initEonbotHome(); }, { once: true });
else void initEonbotHome();
