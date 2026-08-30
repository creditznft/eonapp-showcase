/**
 * W382B/W383B — Safe local attachment viewer.
 *
 * This renderer never uploads, indexes, executes, parses Office binaries, or
 * sends file contents to a model. Blob URLs are revoked on close. Text/table
 * previews use DOM textContent so local file contents are never interpreted as
 * markup.
 */
import { formatLocalAttachmentBytes, getQueuedLocalAttachmentPreview } from './local-attachments.js';

export const LOCAL_FILE_VIEWER_SCHEMA = 'eon.chat.local-file-viewer.w382b.w383b.v1';
export const MAX_LOCAL_VIEWER_TEXT_CHARS = 12000;
export const MAX_LOCAL_VIEWER_TABLE_ROWS = 24;
export const MAX_LOCAL_VIEWER_TABLE_COLUMNS = 8;

function element(documentRef, tag, className = '') {
  const node = documentRef.createElement(tag);
  if (className) node.className = className;
  return node;
}

function closeDialog(dialog) {
  try { dialog.close(); } catch { dialog.removeAttribute('open'); }
}

function formatViewerMeta(attachment) {
  return `${attachment.name} · ${formatLocalAttachmentBytes(attachment.size)} · local only`;
}

export function normalizeLocalViewerText(value = '') {
  return String(value || '').replace(/\r\n?/g, '\n').slice(0, MAX_LOCAL_VIEWER_TEXT_CHARS);
}

export function parseLocalDelimitedText(value = '', delimiter = ',') {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = normalizeLocalViewerText(value);
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (!quoted && character === delimiter) { row.push(cell); cell = ''; continue; }
    if (!quoted && character === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.slice(0, MAX_LOCAL_VIEWER_TABLE_ROWS).map((entry) => entry.slice(0, MAX_LOCAL_VIEWER_TABLE_COLUMNS));
}

export function formatLocalJsonPreview(value = '') {
  try { return JSON.stringify(JSON.parse(String(value || '')), null, 2).slice(0, MAX_LOCAL_VIEWER_TEXT_CHARS); } catch { return normalizeLocalViewerText(value); }
}

async function resolveText(attachment) {
  if (attachment?.textContext) return normalizeLocalViewerText(attachment.textContext);
  try {
    const source = attachment?.file?.slice?.(0, MAX_LOCAL_VIEWER_TEXT_CHARS * 4) || attachment?.file;
    return source?.text ? normalizeLocalViewerText(await source.text()) : '';
  } catch { return ''; }
}

function addNotice(documentRef, body, text) {
  const notice = element(documentRef, 'p', 'eonbot-local-file-viewer-note');
  notice.textContent = text;
  body.appendChild(notice);
}

function addTextPreview(documentRef, body, value, viewerKind) {
  const pre = element(documentRef, 'pre', 'eonbot-local-file-viewer-text');
  pre.textContent = viewerKind === 'json' ? formatLocalJsonPreview(value) : normalizeLocalViewerText(value);
  body.appendChild(pre);
}

function addTablePreview(documentRef, body, value, name) {
  const delimiter = String(name || '').toLowerCase().endsWith('.tsv') ? '\t' : ',';
  const rows = parseLocalDelimitedText(value, delimiter);
  if (!rows.length) { addNotice(documentRef, body, 'No rows could be previewed from this local table.'); return; }
  const wrap = element(documentRef, 'div', 'eonbot-local-file-viewer-table-wrap');
  const table = element(documentRef, 'table', 'eonbot-local-file-viewer-table');
  const head = element(documentRef, 'thead');
  const headRow = element(documentRef, 'tr');
  const columnCount = Math.max(...rows.map((row) => row.length), 0);
  for (let index = 0; index < columnCount; index += 1) {
    const cell = element(documentRef, 'th');
    cell.scope = 'col';
    cell.textContent = rows[0]?.[index] || `Column ${index + 1}`;
    headRow.appendChild(cell);
  }
  head.appendChild(headRow);
  table.appendChild(head);
  const tbody = element(documentRef, 'tbody');
  rows.slice(1).forEach((row) => {
    const tr = element(documentRef, 'tr');
    for (let index = 0; index < columnCount; index += 1) {
      const cell = element(documentRef, 'td');
      cell.textContent = row[index] || '';
      tr.appendChild(cell);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  body.appendChild(wrap);
  addNotice(documentRef, body, `Showing the first ${Math.max(0, rows.length - 1)} local data rows. Nothing was uploaded or indexed.`);
}

function addBlobPreview(documentRef, body, attachment, kind, cleanup) {
  if (!attachment?.file || typeof URL?.createObjectURL !== 'function') { addNotice(documentRef, body, 'This browser cannot create a local preview for this file.'); return; }
  const url = URL.createObjectURL(attachment.file);
  cleanup.push(() => { try { URL.revokeObjectURL(url); } catch {} });
  if (kind === 'image') {
    const image = element(documentRef, 'img', 'eonbot-local-file-viewer-image');
    image.src = url; image.alt = `Local preview of ${attachment.name}`; image.decoding = 'async';
    body.appendChild(image); return;
  }
  if (kind === 'pdf') {
    const frame = element(documentRef, 'iframe', 'eonbot-local-file-viewer-pdf');
    frame.src = `${url}#toolbar=0&navpanes=0`; frame.title = `Local PDF preview: ${attachment.name}`; frame.setAttribute('sandbox', 'allow-same-origin');
    body.appendChild(frame); return;
  }
  const media = element(documentRef, kind === 'audio' ? 'audio' : 'video', 'eonbot-local-file-viewer-media');
  media.src = url; media.controls = true; media.preload = 'metadata';
  if (kind === 'video') { media.playsInline = true; }
  body.appendChild(media);
}

/** Opens a transient, in-memory local viewer. Returns false when no preview is available. */
export async function openLocalFileViewer(id, { documentRef = globalThis.document } = {}) {
  const attachment = getQueuedLocalAttachmentPreview(id);
  if (!attachment || !documentRef?.createElement) return false;
  const cleanup = [];
  const dialog = element(documentRef, 'dialog', 'eonbot-local-file-viewer');
  dialog.setAttribute('aria-label', `Local preview: ${attachment.name}`);
  const header = element(documentRef, 'header', 'eonbot-local-file-viewer-header');
  const title = element(documentRef, 'div');
  const kicker = element(documentRef, 'p', 'eonbot-local-file-viewer-kicker');
  kicker.textContent = 'Local file preview';
  const heading = element(documentRef, 'h2'); heading.textContent = attachment.name;
  const meta = element(documentRef, 'p', 'eonbot-local-file-viewer-meta'); meta.textContent = formatViewerMeta(attachment);
  title.append(kicker, heading, meta);
  const close = element(documentRef, 'button', 'eonbot-local-file-viewer-close');
  close.type = 'button'; close.textContent = 'Close'; close.setAttribute('aria-label', `Close preview for ${attachment.name}`);
  header.append(title, close);
  const body = element(documentRef, 'section', 'eonbot-local-file-viewer-body');
  const viewerKind = attachment.viewerKind;
  if (viewerKind === 'text' || viewerKind === 'markdown' || viewerKind === 'code' || viewerKind === 'json' || viewerKind === 'table') {
    const value = await resolveText(attachment);
    if (viewerKind === 'table') addTablePreview(documentRef, body, value, attachment.name);
    else addTextPreview(documentRef, body, value, viewerKind);
  } else if (['image', 'pdf', 'audio', 'video'].includes(viewerKind)) {
    addBlobPreview(documentRef, body, attachment, viewerKind, cleanup);
    addNotice(documentRef, body, 'Previewed only in this browser. It is not uploaded, analyzed, or retained after you remove the attachment or leave this page.');
  } else if (viewerKind === 'office-metadata') {
    addNotice(documentRef, body, 'This Office file is recognized, but EONAPP does not parse or execute it yet. Only the local name, type, and size are shown.');
  } else {
    addNotice(documentRef, body, 'This document can be attached as local metadata, but no content preview is available yet.');
  }
  dialog.append(header, body);
  const dispose = () => { cleanup.splice(0).forEach((fn) => fn()); dialog.remove(); };
  close.addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', dispose, { once: true });
  dialog.addEventListener('cancel', () => closeDialog(dialog));
  documentRef.body.appendChild(dialog);
  try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
  return true;
}
