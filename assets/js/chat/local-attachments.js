/**
 * W382 — local-only EONBOT attachment intake.
 *
 * Files live only in browser memory for the current request. This module never
 * uploads a Blob, writes file content to localStorage, or presents a binary
 * attachment as something EONBOT has analysed. Text/code snippets are included
 * only after the user presses Send; image and PDF files remain local metadata
 * in this first attachment wave.
 */

export const MAX_LOCAL_ATTACHMENT_COUNT = 8;
export const MAX_LOCAL_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_LOCAL_ATTACHMENT_TOTAL_BYTES = 12 * 1024 * 1024;
export const MAX_LOCAL_TEXT_CONTEXT_CHARS = 6000;
export const MAX_LOCAL_TEXT_READ_BYTES = 512 * 1024;

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'xml', 'yaml', 'yml',
  'html', 'htm', 'css', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'vue',
  'svelte', 'py', 'go', 'java', 'rb', 'php', 'sql', 'sh', 'bash', 'zsh',
  'ps1', 'toml', 'ini', 'conf', 'log', 'gitignore', 'dockerfile', 'env.example'
]);

const PDF_EXTENSIONS = new Set(['pdf']);
const DOCUMENT_EXTENSIONS = new Set(['doc', 'rtf', 'odt']);
const OFFICE_EXTENSIONS = new Set(['docx', 'ppt', 'pptx', 'xls', 'xlsx', 'xlsm', 'ods', 'odp']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv']);
const CODE_EXTENSIONS = new Set(['html', 'htm', 'css', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'py', 'go', 'java', 'rb', 'php', 'sql', 'sh', 'bash', 'zsh', 'ps1', 'toml', 'ini', 'conf', 'log', 'xml', 'yaml', 'yml']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']);
const BLOCKED_EXTENSIONS = new Set(['pem', 'key', 'p12', 'pfx', 'cer', 'crt', 'der']);
const SENSITIVE_NAME_PATTERN = /(^|[._-])(env|secret|secrets|credential|credentials|private|id_rsa|token)([._-]|$)/i;
const SECRET_CONTENT_PATTERN = /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|sk-proj)_[A-Za-z0-9_-]{16,}\b|\bsk-[A-Za-z0-9_-]{18,}\b|(?:api[-_ ]?key|access[-_ ]?token|secret[-_ ]?key|password)\s*[:=]\s*[^\s]{8,})/i;

/** @type {Array<Record<string, any>>} */
let queuedAttachments = [];

function stripControlCharacters(value) {
  return Array.from(String(value || '')).filter((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('');
}

function safeName(value) {
  return stripControlCharacters(value)
    .replace(/[\\/]+/g, '-')
    .trim()
    .slice(0, 140) || 'untitled-file';
}

function extensionOf(fileName = '') {
  const normalized = safeName(fileName).toLowerCase();
  if (normalized === 'dockerfile' || normalized === '.gitignore') return normalized.replace(/^\./, '');
  const index = normalized.lastIndexOf('.');
  return index > 0 && index < normalized.length - 1 ? normalized.slice(index + 1) : '';
}

function compactText(value) {
  return stripControlCharacters(value).replace(/\r\n?/g, '\n').slice(0, MAX_LOCAL_TEXT_CONTEXT_CHARS);
}

function totalQueuedBytes() {
  return queuedAttachments.reduce((total, attachment) => total + Number(attachment.size || 0), 0);
}

function createId(file, index = 0) {
  const seed = `${safeName(file?.name)}:${Number(file?.size || 0)}:${Number(file?.lastModified || 0)}:${Date.now()}:${index}`;
  let hash = 2166136261;
  for (let cursor = 0; cursor < seed.length; cursor += 1) {
    hash ^= seed.charCodeAt(cursor);
    hash = Math.imul(hash, 16777619);
  }
  return `local-file-${(hash >>> 0).toString(36)}`;
}

function classifyFile(file) {
  const name = safeName(file?.name);
  const extension = extensionOf(name);
  const type = String(file?.type || '').toLowerCase();
  if (type.startsWith('image/') || IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (type.startsWith('audio/') || AUDIO_EXTENSIONS.has(extension)) return 'audio';
  if (type.startsWith('video/') || VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (type === 'application/pdf' || PDF_EXTENSIONS.has(extension)) return 'pdf';
  if (OFFICE_EXTENSIONS.has(extension)) return 'office';
  if (type.startsWith('text/') || type === 'application/json' || type === 'application/javascript' || type === 'application/xml' || TEXT_EXTENSIONS.has(extension)) return 'text';
  if (DOCUMENT_EXTENSIONS.has(extension)) return 'document';
  return 'unsupported';
}

export function getLocalAttachmentViewerKind({ name = '', kind = '', type = '' } = {}) {
  const extension = extensionOf(name);
  if (kind === 'image') return 'image';
  if (kind === 'audio') return 'audio';
  if (kind === 'video') return 'video';
  if (kind === 'pdf') return 'pdf';
  if (kind === 'office') return 'office-metadata';
  if (kind === 'document') return 'document-metadata';
  if (extension === 'json' || String(type).toLowerCase() === 'application/json') return 'json';
  if (extension === 'csv' || extension === 'tsv') return 'table';
  if (extension === 'md' || extension === 'markdown') return 'markdown';
  if (CODE_EXTENSIONS.has(extension)) return 'code';
  return 'text';
}

async function readTextPreview(file) {
  const byteLimit = Math.min(Math.max(0, Number(file?.size || 0)), MAX_LOCAL_TEXT_READ_BYTES);
  let source = file;
  if (typeof file?.slice === 'function') source = file.slice(0, byteLimit || MAX_LOCAL_TEXT_READ_BYTES);
  if (!source || typeof source.text !== 'function') return '';
  try {
    return compactText(await source.text());
  } catch {
    return '';
  }
}

export function formatLocalAttachmentBytes(value) {
  const bytes = Math.max(0, Number(value || 0));
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isSensitiveLocalAttachmentName(fileName = '') {
  const name = safeName(fileName);
  return SENSITIVE_NAME_PATTERN.test(name) || BLOCKED_EXTENSIONS.has(extensionOf(name));
}

export function isSupportedLocalAttachment(file = {}) {
  if (isSensitiveLocalAttachmentName(file?.name)) return false;
  return classifyFile(file) !== 'unsupported';
}

export function listQueuedLocalAttachments() {
  return queuedAttachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    kind: attachment.kind,
    viewerKind: attachment.viewerKind,
    size: attachment.size,
    textIncluded: Boolean(attachment.textContext),
    previewAvailable: Boolean(attachment.previewAvailable)
  }));
}

/**
 * Returns an in-memory-only preview handle for the local viewer. It is never
 * included in chat history, localStorage, requests, or EONBOT routing context.
 */
export function getQueuedLocalAttachmentPreview(id = '') {
  const target = String(id || '');
  const attachment = queuedAttachments.find((entry) => entry.id === target);
  if (!attachment) return null;
  return {
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    kind: attachment.kind,
    viewerKind: attachment.viewerKind,
    size: attachment.size,
    textContext: attachment.textContext,
    file: attachment.file || null
  };
}

export function clearQueuedLocalAttachments() {
  queuedAttachments = [];
}

export function removeQueuedLocalAttachment(id = '') {
  const target = String(id || '');
  const before = queuedAttachments.length;
  queuedAttachments = queuedAttachments.filter((attachment) => attachment.id !== target);
  return before !== queuedAttachments.length;
}

export async function addLocalAttachments(files = []) {
  const accepted = [];
  const rejected = [];
  const list = Array.from(files || []);

  for (let index = 0; index < list.length; index += 1) {
    const file = list[index];
    const name = safeName(file?.name);
    const size = Math.max(0, Number(file?.size || 0));
    const duplicate = queuedAttachments.some((item) => item.name === name && item.size === size && item.lastModified === Number(file?.lastModified || 0));

    if (!file || !name) {
      rejected.push({ name: 'untitled file', reason: 'invalid-file' });
      continue;
    }
    if (queuedAttachments.length + accepted.length >= MAX_LOCAL_ATTACHMENT_COUNT) {
      rejected.push({ name, reason: 'file-limit' });
      continue;
    }
    if (duplicate) {
      rejected.push({ name, reason: 'duplicate-file' });
      continue;
    }
    if (isSensitiveLocalAttachmentName(name)) {
      rejected.push({ name, reason: 'sensitive-file' });
      continue;
    }
    if (size > MAX_LOCAL_ATTACHMENT_BYTES) {
      rejected.push({ name, reason: 'file-too-large' });
      continue;
    }
    if (totalQueuedBytes() + accepted.reduce((total, item) => total + item.size, 0) + size > MAX_LOCAL_ATTACHMENT_TOTAL_BYTES) {
      rejected.push({ name, reason: 'total-too-large' });
      continue;
    }

    const kind = classifyFile(file);
    if (kind === 'unsupported') {
      rejected.push({ name, reason: 'unsupported-file' });
      continue;
    }

    let textContext = '';
    if (kind === 'text') {
      textContext = await readTextPreview(file);
      if (SECRET_CONTENT_PATTERN.test(textContext)) {
        rejected.push({ name, reason: 'sensitive-content' });
        continue;
      }
    }

    accepted.push({
      id: createId(file, index),
      name,
      type: String(file?.type || '').slice(0, 120),
      kind,
      viewerKind: getLocalAttachmentViewerKind({ name, kind, type: file?.type }),
      size,
      lastModified: Number(file?.lastModified || 0),
      textContext,
      // Keep the File only in the current page's memory so a user can preview
      // it before sending. listQueuedLocalAttachments intentionally omits it.
      file,
      previewAvailable: true
    });
  }

  queuedAttachments.push(...accepted);
  return { accepted: listQueuedLocalAttachments().filter((item) => accepted.some((entry) => entry.id === item.id)), rejected };
}

function buildAttachmentCoverage(attachments = []) {
  const byKind = {};
  const omissionCounts = new Map();
  let includedText = 0;
  for (const attachment of attachments) {
    const kind = String(attachment?.kind || 'unknown');
    byKind[kind] = (byKind[kind] || 0) + 1;
    if (kind === 'text' && attachment?.textIncluded) {
      includedText += 1;
      continue;
    }
    const reason = kind === 'image' ? 'local-image-preview-only'
      : kind === 'pdf' ? 'local-pdf-preview-only'
        : kind === 'audio' || kind === 'video' ? 'local-media-preview-only'
          : kind === 'office' ? 'metadata-preview-only'
            : 'not-included-in-model-context';
    const key = `${kind}:${reason}`;
    omissionCounts.set(key, (omissionCounts.get(key) || 0) + 1);
  }
  const omissions = [...omissionCounts.entries()].map(([key, count]) => {
    const separator = key.indexOf(':');
    return { kind: key.slice(0, separator), count, reason: key.slice(separator + 1) };
  });
  return Object.freeze({
    total: attachments.length,
    includedText,
    omitted: Math.max(0, attachments.length - includedText),
    byKind: Object.freeze(byKind),
    omissions: Object.freeze(omissions),
    containsNames: false,
    containsContent: false
  });
}

export function getQueuedLocalAttachmentRequest() {
  const attachments = listQueuedLocalAttachments();
  const coverage = buildAttachmentCoverage(attachments);
  if (!attachments.length) return { attachments: [], context: '', hasTextContext: false, coverage };

  const textParts = queuedAttachments
    .filter((attachment) => attachment.kind === 'text' && attachment.textContext)
    .map((attachment) => `--- BEGIN LOCAL FILE: ${attachment.name} ---\n${attachment.textContext}\n--- END LOCAL FILE: ${attachment.name} ---`);

  const metadata = attachments.map((attachment) => {
    if (attachment.kind === 'text' && attachment.textIncluded) return `- ${attachment.name} (${formatLocalAttachmentBytes(attachment.size)} · text included for this request)`;
    if (attachment.kind === 'image') return `- ${attachment.name} (${formatLocalAttachmentBytes(attachment.size)} · local image preview only)`;
    if (attachment.kind === 'pdf') return `- ${attachment.name} (${formatLocalAttachmentBytes(attachment.size)} · local PDF preview only)`;
    if (attachment.kind === 'audio' || attachment.kind === 'video') return `- ${attachment.name} (${formatLocalAttachmentBytes(attachment.size)} · local media preview only)`;
    if (attachment.kind === 'office') return `- ${attachment.name} (${formatLocalAttachmentBytes(attachment.size)} · metadata preview only)`;
    return `- ${attachment.name} (${formatLocalAttachmentBytes(attachment.size)} · document stays local in this build)`;
  });

  const context = [
    'Local files attached by the user for this request:',
    ...metadata,
    ...textParts
  ].join('\n');

  return { attachments, context, hasTextContext: textParts.length > 0, coverage };
}

export function consumeQueuedLocalAttachmentRequest() {
  const payload = getQueuedLocalAttachmentRequest();
  clearQueuedLocalAttachments();
  return payload;
}
