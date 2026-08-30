/** W626B–W626H — review-first Direct BYOK workspace embedded in Create. */
import { beginCreatorCompanionPairing, confirmCreatorCompanionPairing, listDirectProviders, scanCreatorCompanion } from './companion-client.js';
import { clearDirectHistory, downloadDirectHistoryExport, readDirectHistory } from './direct-history.js';
import { getDirectByokPrivacyTruth } from './byok-certification.js';
import { bindDirectMediaStudio, renderDirectMediaStudio } from './eon-direct-media-studio.js';


export function renderDirectByokWorkspace({ history = readDirectHistory(), mediaKind = '' } = {}) {
  const truth = getDirectByokPrivacyTruth();
  return `<section class="eon-direct-byok" data-eon-direct-byok aria-labelledby="eon-direct-byok-title">
    <div class="eon-direct-byok-head"><div><p class="eon-create-eyebrow">Direct BYOK · your provider connection</p><h2 id="eon-direct-byok-title">Use your provider directly through your own companion</h2><p>EONAPP does not proxy generation. The desktop companion holds provider credentials in OS secure storage, pairs through an approved loopback origin, and sends only jobs you explicitly review directly to supported providers. fal/Replicate Image/Video and ElevenLabs Music have reviewed connection rails. Each provider stays marked unverified until a real authenticated output check succeeds.</p></div><span data-eon-direct-status>Provider check required</span></div>
    <div class="eon-direct-byok-actions"><button type="button" class="eon-create-primary" data-eon-direct-scan>Scan companion</button><button type="button" class="eon-create-secondary" data-eon-direct-pair disabled>Start pairing</button><button type="button" class="eon-create-secondary" data-eon-direct-export ${history.length ? '' : 'disabled'}>Export redacted history</button><button type="button" class="eon-create-secondary" data-eon-direct-clear ${history.length ? '' : 'disabled'}>Delete local history</button></div>
    <form class="eon-direct-pair-form" data-eon-direct-pair-form hidden><label>Pairing code shown by the companion<input inputmode="numeric" pattern="[0-9]{6}" maxlength="6" data-eon-direct-code /></label><button type="submit" class="eon-create-primary">Confirm pairing</button></form>
    <div class="eon-direct-provider-list" data-eon-direct-providers><article><strong>fal image + video Direct BYOK</strong><p>Reviewed prompt-first models support queue/status/result/cancel with no automatic retry or fallback. Run a real authenticated output check before treating this provider as ready.</p></article><article><strong>Replicate image + video Direct BYOK</strong><p>Reviewed official-model submit/status/result/cancel is available with Companion-memory output. Run a real authenticated output check before treating this provider as ready.</p></article><article><strong>ElevenLabs Music v2 Direct BYOK</strong><p>Prompt-to-music uses paired OS-vault credential custody and Companion-memory output. Use the Music surface for explicit job review, and run a real authenticated output check before treating the provider as ready.</p></article></div>
    <p class="eon-create-guide-status" data-eon-direct-message aria-live="polite"></p>
    ${renderDirectMediaStudio({ mediaKind })}
    <details><summary>Privacy and spending boundary</summary><ul><li>Permanent provider keys are forbidden in ordinary browser storage.</li><li>No EONAPP Cloudflare generation proxy or media store exists.</li><li>Every paid job needs review, a budget warning and explicit confirmation.</li><li>No automatic paid retry.</li><li>Provider moderation, outage, quota and region responses stay visible.</li><li>A provider should be shown as ready only after its required real-output checks pass on the supported device path.</li></ul><p>Source code alone can mark a provider ready: ${truth.sourceIntegrationAloneCanPass ? 'yes' : 'no'}.</p></details>
    <p class="eon-direct-history-count">${history.length} redacted local receipt${history.length === 1 ? '' : 's'} stored. Prompts, credentials, references and media are excluded.</p>
  </section>`;
}

export function bindDirectByokWorkspace(root, { client = {}, mediaKind = '', rerender = null } = {}) {
  const host = root?.querySelector?.('[data-eon-direct-byok]');
  if (!host) return;
  bindDirectMediaStudio(root, { mediaKind, rerender });
  const message = host.querySelector('[data-eon-direct-message]');
  const status = host.querySelector('[data-eon-direct-status]');
  const pairButton = host.querySelector('[data-eon-direct-pair]');
  const form = host.querySelector('[data-eon-direct-pair-form]');
  let challenge = null;
  const api = {
    scan: client.scan || scanCreatorCompanion,
    begin: client.begin || beginCreatorCompanionPairing,
    confirm: client.confirm || confirmCreatorCompanionPairing,
    providers: client.providers || listDirectProviders
  };
  host.querySelector('[data-eon-direct-scan]')?.addEventListener('click', async () => {
    message.textContent = 'Scanning the approved 127.0.0.1 companion endpoint…';
    const result = await api.scan();
    status.textContent = result.ok ? 'Companion detected' : 'Companion not detected';
    pairButton.disabled = !result.ok;
    message.textContent = result.ok ? (result.payload?.signedRelease ? 'Signed companion detected. Pair before using a provider.' : 'Companion source build detected, but public signing proof is still pending.') : 'Start the EON Creator Companion on this computer. No LAN or public endpoint will be scanned.';
  });
  pairButton?.addEventListener('click', async () => {
    try { challenge = await api.begin(); form.hidden = false; message.textContent = 'Enter the six-digit code shown in the companion window.'; } catch (error) { message.textContent = String(error?.message || error); }
  });
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = host.querySelector('[data-eon-direct-code]')?.value || '';
    try {
      await api.confirm({ challengeId: challenge?.challengeId, code });
      const providers = await api.providers();
      status.textContent = 'Paired for this browser session';
      message.textContent = `${providers?.models?.filter((row) => row.enabled).length || 0} reviewed provider models enabled. No job will run without a separate review and budget confirmation.`;
      form.hidden = true;
    } catch (error) { message.textContent = String(error?.message || error); }
  });
  host.querySelector('[data-eon-direct-export]')?.addEventListener('click', () => { const result = downloadDirectHistoryExport(); message.textContent = result.ok ? 'Redacted receipt history exported.' : 'History export is unavailable in this browser.'; });
  host.querySelector('[data-eon-direct-clear]')?.addEventListener('click', () => { const result = clearDirectHistory({ explicitUserAction: true }); message.textContent = result.ok ? 'Local Direct BYOK receipt history deleted.' : 'History could not be deleted.'; });
}
