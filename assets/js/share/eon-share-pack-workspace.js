/** W388A.1 + W479-P0 workspace surface for local, universal Share Packs. */
import { buildEonSharePackExport, buildEonSharePackText, createEonSharePack, EON_SHARE_PACK_FORMATS, EON_UNIVERSAL_POST_DESTINATIONS, getEonSharePackTruth, shareEonSharePack } from './eon-share-pack.js';
import { clearEonShareIntent, readEonShareIntent } from './eon-share-intent.js';
import { clearEonOutputShareHandoff, readEonOutputShareHandoff } from './eon-output-share-handoff.js';

const session = { pack: null, intent: null, output: null };

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function downloadJson(payload, title = 'share-pack') {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eonapp-${String(title || 'share-pack').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'share-pack'}.json`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatCards(pack) {
  if (!pack) return '<p class="eon-hub-empty">No Share Pack in this page session yet. Create one from a public-safe brief.</p>';
  return `<div class="eon-share-pack-output">${pack.formats.map((format) => `<article class="eon-share-pack-format"><p class="eon-creator-engine-eyebrow">${escapeHtml(format.frame)} · ${escapeHtml(format.use)}</p><h3>${escapeHtml(format.label)}</h3><label>Caption<textarea readonly>${escapeHtml(format.caption)}</textarea></label><label>Visual brief<textarea readonly>${escapeHtml(format.visualBrief)}</textarea></label><label>${format.id.includes('video') || format.id === 'story-card' ? 'Video beat' : 'Review note'}<textarea readonly>${escapeHtml(format.videoBeat)}</textarea></label></article>`).join('')}</div>`;
}

function selectedFormatValues(form) {
  return [...form.querySelectorAll('input[name="formats"]:checked')].map((input) => input.value);
}

function destinationOptions() {
  return EON_UNIVERSAL_POST_DESTINATIONS.map((destination) => `<option value="${escapeHtml(destination.id)}">${escapeHtml(destination.label)}</option>`).join('');
}

function render(root, status = '') {
  if (!root) return;
  if (!session.intent) session.intent = readEonShareIntent();
  session.output = readEonOutputShareHandoff();
  const intent = session.intent;
  const output = session.output;
  const prefill = output || intent;
  const pack = session.pack;
  root.innerHTML = `<section id="eon-share" class="eon-hub-card eon-hub-card-full eon-share-pack" aria-labelledby="eon-share-pack-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">EON Share Pack · W388A.1 + W479-P0</p><h2 id="eon-share-pack-title">Prepare one post kit for any platform</h2><p>Write the caption, CTA, hashtags/credit and format notes once. Then either pass the finished image, video or audio file to your device share sheet or copy/export the complete kit for manual upload. This page does not connect an account, generate media, publish, schedule, track clicks, award a referral, or claim reach.</p></div><span class="eon-record-status">Manual-first / native share</span></div>${output ? `<section class="eon-share-intent-note"><strong>${escapeHtml(output.sourceLabel)} ready to package</strong><p>Only title, audience and a short public-safe outcome were passed in this browser session. No source files, media, chats, credentials, links or account data came with it.</p><button type="button" class="eon-record-button" data-eon-share-pack-clear-output>Clear output handoff</button></section>` : ''}${intent ? `<section class="eon-share-intent-note"><strong>EONBOT share draft available</strong><p>Only this short typed request is in the browser-session handoff. Review every field before creating a pack.</p><button type="button" class="eon-record-button" data-eon-share-pack-clear-intent>Clear chat draft</button></section>` : ''}<form class="eon-record-form eon-share-pack-form" data-eon-share-pack-form><label>Share Pack title<input name="title" maxlength="120" required value="${escapeHtml(prefill?.title || '')}" placeholder="Launch reel concept for my creator brand" /></label><label>Where will you post?<select name="destination">${destinationOptions()}</select></label><label>Audience<input name="audience" maxlength="160" value="${escapeHtml(prefill?.audience || '')}" placeholder="Creators who want a simple content workflow" /></label><label>Useful outcome / message<textarea name="goal" maxlength="360" placeholder="Show the result clearly and explain why someone would want to remix or try the workflow.">${escapeHtml(prefill?.usefulOutcome || '')}</textarea></label><label>Public link (optional)<input name="link" inputmode="url" maxlength="2048" placeholder="https://example.com/your-public-preview" /></label><label>Clear CTA<input name="cta" maxlength="160" value="${escapeHtml(prefill?.firstRemixStep || '')}" placeholder="Open the preview and make your own version." /></label><label>Optional creator credit / hashtags<input name="credit" maxlength="120" placeholder="#yourhashtag · Created by @yourname" /></label><fieldset><legend>Post formats</legend><div class="eon-share-pack-format-options">${EON_SHARE_PACK_FORMATS.map((format, index) => `<label><input type="checkbox" name="formats" value="${escapeHtml(format.id)}" ${index < 2 ? 'checked' : ''} /> ${escapeHtml(format.label)} · ${escapeHtml(format.frame)}</label>`).join('')}</div></fieldset><label>Optional final image, video or audio for the device share sheet<input type="file" accept="image/*,video/*,audio/*,.wav,.mp3,.m4a,.aac,.ogg,.opus,.flac,.webm" data-eon-share-pack-file /></label><p class="eon-record-form-note">Manual-first: choose the final image, video or audio file only when you press Share via device. EONAPP does not upload, host, retain, scan, or post the file; your device lets you choose the destination app. On desktop or an unsupported browser, copy/export the completed post kit and upload manually.</p><p class="eon-record-form-note">A link is optional and never generated automatically. Do not paste private work, chats, credentials, access links, or account details. A Share Pack is creative direction—not legal, rights, performance, or posting approval.</p><p class="eon-record-form-error" data-eon-share-pack-status>${escapeHtml(status)}</p><div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">Create local post kit</button><button type="button" class="eon-record-button" data-eon-share-pack-copy ${pack ? '' : 'disabled'}>Copy post text</button><button type="button" class="eon-record-button" data-eon-share-pack-native ${pack ? '' : 'disabled'}>Share via device…</button><button type="button" class="eon-record-button" data-eon-share-pack-export ${pack ? '' : 'disabled'}>Download post kit</button><button type="button" class="eon-record-button is-danger" data-eon-share-pack-clear ${pack ? '' : 'disabled'}>Clear page pack</button></div></form><section class="eon-share-pack-disclosure"><strong>Disclosure reminder</strong><p>${escapeHtml(pack?.disclosureReminder || 'If a creator receives a material benefit for promoting content, use a clear disclosure appropriate to the destination and relationship. This Share Pack does not create a benefit or approve a claim.')}</p></section><div data-eon-share-pack-output>${formatCards(pack)}</div></section>`;
}

async function copyText(value) {
  const text = String(value || '');
  if (!text) return false;
  if (globalThis.navigator?.clipboard?.writeText) {
    try { await globalThis.navigator.clipboard.writeText(text); return true; } catch {}
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand?.('copy') === true;
  area.remove();
  return copied;
}

export function renderEonSharePackWorkspace() {
  return '<section data-eon-share-pack-workspace></section>';
}

export function bindEonSharePackWorkspace(root) {
  const host = root?.querySelector?.('[data-eon-share-pack-workspace]');
  if (!host) return;
  const rerender = (status = '') => { render(host, status); bind(); };
  const bind = () => {
    const form = host.querySelector('[data-eon-share-pack-form]');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        session.pack = createEonSharePack({
          title: form.elements.title.value,
          destination: form.elements.destination.value,
          audience: form.elements.audience.value,
          goal: form.elements.goal.value,
          link: form.elements.link.value,
          cta: form.elements.cta.value,
          credit: form.elements.credit.value,
          formats: selectedFormatValues(form)
        });
        rerender('Local post kit created. Review the wording before copying, downloading, or using your device share sheet.');
      } catch (error) {
        const status = host.querySelector('[data-eon-share-pack-status]');
        if (status) status.textContent = String(error?.message || 'The Share Pack could not be created.');
      }
    });
    host.querySelector('[data-eon-share-pack-copy]')?.addEventListener('click', async () => {
      const ok = await copyText(buildEonSharePackText(session.pack));
      rerender(ok ? 'Post text copied locally. Copying does not publish anything.' : 'Copy is unavailable in this browser. Download the post kit instead.');
    });
    host.querySelector('[data-eon-share-pack-native]')?.addEventListener('click', async () => {
      try {
        const file = form?.querySelector?.('[data-eon-share-pack-file]')?.files?.[0] || null;
        const result = await shareEonSharePack(session.pack, { file, userGesture: true });
        if (result.ok && result.fileShared) {
          rerender('Your device share sheet opened with the selected file and draft caption. Choose the destination app and complete the post there. EONAPP cannot confirm a post or track what happens next.');
        } else if (result.ok) {
          rerender('Your device share sheet opened with the draft caption. Choose the destination app and complete the post there. EONAPP cannot confirm a post or track what happens next.');
        } else if (result.reason === 'native-file-share-unavailable') {
          rerender('This browser cannot pass the selected file to the share sheet. The file stayed local—copy or download the post kit, then upload manually.');
        } else {
          rerender('Native share is unavailable here. Copy or download the completed post kit, then upload manually.');
        }
      } catch {
        rerender('Native share was dismissed or unavailable. Nothing was published and your chosen file stayed local.');
      }
    });
    host.querySelector('[data-eon-share-pack-export]')?.addEventListener('click', () => {
      try { downloadJson(buildEonSharePackExport(session.pack), session.pack?.title); rerender('Post kit downloaded as local JSON. No media or platform credential was included.'); }
      catch { rerender('The post kit could not be downloaded in this browser.'); }
    });
    host.querySelector('[data-eon-share-pack-clear]')?.addEventListener('click', () => { session.pack = null; rerender('Page-only post kit cleared.'); });
    host.querySelector('[data-eon-share-pack-clear-output]')?.addEventListener('click', () => { clearEonOutputShareHandoff(); session.output = null; rerender('Creator/Forge browser-session handoff cleared.'); });
    host.querySelector('[data-eon-share-pack-clear-intent]')?.addEventListener('click', () => { clearEonShareIntent(); session.intent = null; rerender('EONBOT browser-session draft cleared.'); });
  };
  render(host);
  bind();
}

export function getEonSharePackWorkspaceTruth() {
  return Object.freeze({ ...getEonSharePackTruth(), pageSessionOnly: true, transientSelectedFileOnly: true, externalPostingProof: false, localExportOnly: true });
}
