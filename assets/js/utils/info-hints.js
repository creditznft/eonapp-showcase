function injectStylesOnce() {
  // Styles are provided in static CSS to avoid CSP inline-style violations.
}

function askEonbot(/** @type {any} */ contextText) {
  const prompt = `Explain this feature in simple language: ${contextText}`;
  try {
    localStorage.setItem('eon:chat:prefill:v1', prompt);
  } catch {}
  window.dispatchEvent(new CustomEvent('eonbot:ask', { detail: { prompt } }));
  if (!document.getElementById('eon-widget-btn')) {
    window.location.href = `/chat.html?q=${encodeURIComponent(prompt)}`;
  }
}

function createInfoPanel(/** @type {any} */ host, /** @type {any} */ infoText) {
  const /** @type {any} */
panel = document.createElement('div');
  panel.className = 'eon-info-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <p>${infoText}</p>
    <div class="eon-info-actions">
      <button type="button" class="btn btn-outline btn-sm" data-info-expand="1">Hide</button>
      <button type="button" class="btn btn-primary btn-sm" data-info-ask="1">Ask EONBOT</button>
    </div>
  `;

  panel.querySelector('[data-info-expand="1"]')?.addEventListener('click', () => {
    panel.hidden = true;
  });

  panel.querySelector('[data-info-ask="1"]')?.addEventListener('click', () => {
    askEonbot(infoText);
  });

  host.appendChild(panel);
  return panel;
}

export function initInfoHints(/** @type {any} */ root = document) {
  injectStylesOnce();

  const /** @type {any} */
sections = root.querySelectorAll('[data-info-title][data-info-body]:not([data-info-ready="1"])');
  sections.forEach((/** @type {any} */ section) => {
    const title = section.getAttribute('data-info-title') || 'Feature';
    const body = section.getAttribute('data-info-body') || '';
    const /** @type {any} */
heading = section.querySelector('h1, h2, .wb-section-title, .vlt-panel-title, .vault-panel-toggle, .rl-section-title, .card-title');
    if (!heading || !body) return;

    const /** @type {any} */
infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'eon-info-btn';
    infoBtn.setAttribute('aria-label', `More info about ${title}`);
    infoBtn.textContent = 'i';

    heading.insertAdjacentElement('afterend', infoBtn);
    const panel = createInfoPanel(section, body);

    infoBtn.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
    });

    section.setAttribute('data-info-ready', '1');
  });
}
