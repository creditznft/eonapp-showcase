import { SUPPORT_TOPICS, W133_SUPPORT_TOOLS_FOOTER_SCHEMA, buildSupportChatUrl, createSupportToolsFooterSummary, findSupportTopic } from './utils/support-tools-footer-proof.js';
import { writeEonHandoff } from './contracts/navigation/eon-handoff-authority.js';
import { EON_SUPPORT_CATEGORIES, getTrustPolicySet } from './trust/eon-trust-support-authority.js';
import { installPublicTrustConfig } from './trust/eon-trust-public-page.js';
import {
  createSupportEvidencePack,
  detectSupportBrowserClass,
  detectSupportDeviceClass,
  formatSupportEvidencePack,
  isSupportEvidencePackReadyForManualShare
} from './utils/support-evidence-pack.js';


function bindSupportTopicButtons() {
  document.querySelectorAll('[data-support-topic]').forEach((trigger) => {
    trigger.addEventListener('click', async (event) => {
      const topicId = trigger.getAttribute('data-support-topic');
      if (!topicId) return;
      const topic = findSupportTopic(topicId);
      if (trigger.tagName === 'A') event.preventDefault();
      const handoff = await writeEonHandoff({
        senderId: 'help',
        receiverId: 'home',
        kind: 'support-prefill',
        referenceId: topic.id,
        safeLabel: topic.label,
        payload: { topicId: topic.id, label: topic.label, description: topic.description, evidence: topic.evidence },
        sourceSchema: W133_SUPPORT_TOOLS_FOOTER_SCHEMA
      }, { explicitUserAction: true });
      if (trigger.tagName === 'A') window.location.assign(handoff.ok ? handoff.href : buildSupportChatUrl(topic.id));
    });
  });
}

function renderSupportProofPanel() {
  const root = document.querySelector('[data-w133-support-proof]');
  if (!root) return;
  const summary = createSupportToolsFooterSummary();
  root.innerHTML = `
    <div class="support-proof-grid" data-w133-schema="${W133_SUPPORT_TOOLS_FOOTER_SCHEMA}">
      <div><strong>${summary.supportTopicCount}</strong><span>triage topics</span></div>
      <div><strong>${summary.toolWorkflowCount}</strong><span>tool routes</span></div>
      <div><strong>${summary.footerGroupCount}</strong><span>footer groups</span></div>
      <div><strong>No secrets</strong><span>public proof only</span></div>
    </div>
  `;
}

function markTopicCards() {
  const known = new Set(SUPPORT_TOPICS.map((topic) => topic.id));
  document.querySelectorAll('[data-support-topic-card]').forEach((card) => {
    const id = card.getAttribute('data-support-topic-card') || '';
    card.setAttribute('data-support-topic-ready', known.has(id) ? '1' : '0');
  });
}

function downloadSupportEvidencePack(text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `eonapp-support-evidence-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function bindSupportEvidencePack() {
  const form = document.querySelector('[data-support-evidence-form]');
  if (!form) return;
  const topicInput = form.querySelector('[data-support-evidence-topic]');
  const routeInput = form.querySelector('[data-support-evidence-route]');
  const deviceInput = form.querySelector('[data-support-evidence-device]');
  const browserInput = form.querySelector('[data-support-evidence-browser]');
  const expectedInput = form.querySelector('[data-support-evidence-expected]');
  const actualInput = form.querySelector('[data-support-evidence-actual]');
  const reviewedInput = form.querySelector('[data-support-evidence-reviewed]');
  const previewButton = form.querySelector('[data-support-evidence-preview-button]');
  const copyButton = form.querySelector('[data-support-evidence-copy]');
  const downloadButton = form.querySelector('[data-support-evidence-download]');
  const resetButton = form.querySelector('[data-support-evidence-reset]');
  const status = form.querySelector('[data-support-evidence-status]');
  const preview = form.querySelector('[data-support-evidence-preview]');
  if (!topicInput || !routeInput || !deviceInput || !browserInput || !expectedInput || !actualInput || !reviewedInput || !previewButton || !copyButton || !downloadButton || !resetButton || !status || !preview) return;

  topicInput.replaceChildren(...SUPPORT_TOPICS.map((topic) => {
    const option = document.createElement('option');
    option.value = topic.id;
    option.textContent = topic.label;
    return option;
  }));
  topicInput.value = 'bug-security';
  routeInput.value = window.location.pathname || '/help';
  deviceInput.value = detectSupportDeviceClass(navigator.userAgent);
  browserInput.value = detectSupportBrowserClass(navigator.userAgent);

  let latestPack = null;
  const clearShareActions = () => {
    latestPack = null;
    copyButton.disabled = true;
    downloadButton.disabled = true;
  };
  const updatePreview = () => {
    latestPack = createSupportEvidencePack({
      topicId: topicInput.value,
      allowedTopicIds: SUPPORT_TOPICS.map((topic) => topic.id),
      routePath: routeInput.value,
      deviceClass: deviceInput.value,
      browserClass: browserInput.value,
      expected: expectedInput.value,
      actual: actualInput.value,
      reviewed: reviewedInput.checked
    });
    const content = formatSupportEvidencePack(latestPack);
    preview.textContent = content;
    preview.hidden = false;
    const ready = isSupportEvidencePackReadyForManualShare(latestPack);
    copyButton.disabled = !ready;
    downloadButton.disabled = !ready;
    const count = latestPack.review.automaticRedactionsApplied;
    status.textContent = ready
      ? `Local pack ready for manual copy or download${count ? `; ${count} automatic redaction${count === 1 ? '' : 's'} applied` : ''}. EONAPP has not sent it.`
      : `Preview only${count ? `; ${count} automatic redaction${count === 1 ? '' : 's'} applied` : ''}. Review the visible JSON, then confirm the checkbox to enable manual export.`;
  };

  previewButton.addEventListener('click', updatePreview);
  [topicInput, expectedInput, actualInput, reviewedInput].forEach((input) => input.addEventListener('input', clearShareActions));
  reviewedInput.addEventListener('change', () => {
    if (preview.hidden) return;
    updatePreview();
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  copyButton.addEventListener('click', async () => {
    if (!isSupportEvidencePackReadyForManualShare(latestPack)) return;
    try {
      await navigator.clipboard.writeText(formatSupportEvidencePack(latestPack));
      status.textContent = 'Redacted local pack copied. EONAPP has not sent it.';
    } catch {
      status.textContent = 'Clipboard access is unavailable. Select the visible JSON manually; EONAPP has not sent it.';
    }
  });
  downloadButton.addEventListener('click', () => {
    if (!isSupportEvidencePackReadyForManualShare(latestPack)) return;
    downloadSupportEvidencePack(formatSupportEvidencePack(latestPack));
    status.textContent = 'Redacted local pack downloaded. Review it again before manually sharing it.';
  });
  resetButton.addEventListener('click', () => {
    form.reset();
    topicInput.value = 'bug-security';
    routeInput.value = window.location.pathname || '/help';
    deviceInput.value = detectSupportDeviceClass(navigator.userAgent);
    browserInput.value = detectSupportBrowserClass(navigator.userAgent);
    preview.textContent = '';
    preview.hidden = true;
    status.textContent = 'Local draft cleared from this page.';
    clearShareActions();
  });
}


function downloadCaseAccessReceipt(receipt) {
  const text = `${JSON.stringify(receipt, null, 2)}\n`;
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `eonapp-support-case-${receipt.caseId}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function bindTrustSupportCases() {
  const form = document.querySelector('[data-trust-case-form]');
  if (!form) return;
  const category = form.querySelector('[data-trust-case-category]');
  const subject = form.querySelector('[data-trust-case-subject]');
  const description = form.querySelector('[data-trust-case-description]');
  const reviewed = form.querySelector('[data-trust-case-reviewed]');
  const submit = form.querySelector('[data-trust-case-submit]');
  const status = form.querySelector('[data-trust-case-status]');
  const receipt = form.querySelector('[data-trust-case-receipt]');
  const download = form.querySelector('[data-trust-case-download]');
  const lookupForm = document.querySelector('[data-trust-case-lookup-form]');
  const lookupStatus = document.querySelector('[data-trust-case-lookup-status]');
  if (!category || !subject || !description || !reviewed || !submit || !status || !receipt || !download) return;

  category.replaceChildren(...EON_SUPPORT_CATEGORIES.map((row) => {
    const option = document.createElement('option');
    option.value = row.id;
    option.textContent = row.label;
    return option;
  }));
  const requestedCategory = new URLSearchParams(location.search).get('caseCategory');
  if (EON_SUPPORT_CATEGORIES.some((row) => row.id === requestedCategory)) category.value = requestedCategory;
  let latestReceipt = null;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    latestReceipt = null;
    receipt.hidden = true;
    download.disabled = true;
    if (!reviewed.checked) { status.textContent = 'Review the no-secrets boundary before creating the case.'; return; }
    submit.disabled = true;
    status.textContent = 'Creating a private case ID…';
    try {
      const response = await fetch('/api/support/cases', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ categoryId: category.value, subject: subject.value, description: description.value, routePath: location.pathname })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || payload.status || 'case_create_failed');
      latestReceipt = Object.freeze({
        schema: 'eon.trust-support.case-access-receipt.a15.v1',
        caseId: payload.case.caseId,
        accessToken: payload.accessToken,
        createdAt: payload.case.createdAt,
        statusPath: `/api/support/cases/${encodeURIComponent(payload.case.caseId)}`,
        warning: 'This token is shown once. Store it privately. EONAPP does not place it in browser storage.'
      });
      receipt.textContent = JSON.stringify(latestReceipt, null, 2);
      receipt.hidden = false;
      download.disabled = false;
      status.textContent = `Case ${payload.case.caseId} created. Download the private access receipt now; the token is not stored in this browser.`;
      description.value = '';
      reviewed.checked = false;
    } catch (error) {
      status.textContent = `Case not created: ${String(error?.message || 'service unavailable')}. Keep your local evidence pack and try again later.`;
    } finally { submit.disabled = false; }
  });
  download.addEventListener('click', () => { if (latestReceipt) downloadCaseAccessReceipt(latestReceipt); });

  lookupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const caseId = lookupForm.querySelector('[data-trust-case-lookup-id]')?.value.trim() || '';
    const token = lookupForm.querySelector('[data-trust-case-lookup-token]')?.value.trim() || '';
    if (!caseId || !token) { if (lookupStatus) lookupStatus.textContent = 'Case ID and private token are required.'; return; }
    if (lookupStatus) lookupStatus.textContent = 'Checking private case status…';
    try {
      const response = await fetch(`/api/support/cases/${encodeURIComponent(caseId)}`, { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json', 'x-eon-case-token': token } });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'case_lookup_failed');
      if (lookupStatus) lookupStatus.textContent = `${payload.case.caseId}: ${payload.case.status}. ${payload.case.publicResponse || 'No public response has been added yet.'}`;
    } catch { if (lookupStatus) lookupStatus.textContent = 'Case not found, token invalid, or the case service is unavailable.'; }
  });

  const policy = getTrustPolicySet();
  document.querySelectorAll('[data-trust-policy-version]').forEach((node) => { node.textContent = policy.version; });
}

function initSupportPage() {
  bindSupportTopicButtons();
  renderSupportProofPanel();
  markTopicCards();
  bindSupportEvidencePack();
  bindTrustSupportCases();
  installPublicTrustConfig();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupportPage, { once: true });
} else {
  initSupportPage();
}
