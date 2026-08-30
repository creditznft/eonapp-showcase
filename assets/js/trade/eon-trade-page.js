/** EONAPP W375 compatibility runtime — Research Lab local research workspace. */
import {
  addLocalDataset,
  addLocalEvidence,
  addLocalForecast,
  addLocalThesis,
  appendManualPoint,
  createDefaultMarketIntelligenceState,
  ensureManualDataset,
  exportMarketIntelligenceWorkspace,
  loadMarketIntelligenceState,
  resolveLocalForecast,
  updateMarketIntelligenceState
} from '../market-intelligence/market-intelligence-store.js';
import { parseMarketIntelligenceCsv } from '../market-intelligence/market-intelligence-csv.js';
import { createHistoricalScenarioReview, summarizeLocalSeries } from '../market-intelligence/market-intelligence-analytics.js';
import { buildForecastCalibrationSummary, createForecast } from '../market-intelligence/market-intelligence-forecast.js';
import { renderLocalSeriesChart } from '../market-intelligence/market-intelligence-chart.js';
import { createMarketIntelligenceReceipt, validateMarketIntelligenceReceipt } from '../market-intelligence/market-intelligence-receipt.js';
import { MARKET_INTELLIGENCE_SAFETY_CONTRACT } from '../market-intelligence/market-intelligence-safety-contract.js';
import { appendOperatorActivity } from '../operator/operator-activity.js';

const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const stripControls = (value) => [...String(value ?? '')].filter((character) => { const code = character.codePointAt(0) || 0; return code >= 32 && code !== 127; }).join('');
const cleanText = (value, max = 1000) => stripControls(value).replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const INSIGHTS_DESKS = Object.freeze({
  market: Object.freeze({ label: 'Research Lab', targetId: 'mi-market-desk' }),
  business: Object.freeze({ label: 'Business Research', targetId: 'mi-business-desk' }),
  forecast: Object.freeze({ label: 'Scenario Studio', targetId: 'mi-forecast-desk' }),
  research: Object.freeze({ label: 'Research Journal', targetId: 'mi-research-desk' }),
  data: Object.freeze({ label: 'Local Data Lab', targetId: 'mi-data-desk' })
});

let state = createDefaultMarketIntelligenceState();

function activeDataset() {
  return state.datasets.find((dataset) => dataset.id === state.settings.selectedDatasetId) || state.datasets[0] || null;
}

function setStatus(message, tone = 'info') {
  const node = $('#mi-status');
  if (!node) return;
  node.textContent = message;
  node.dataset.tone = tone;
}

function requestedDesk() {
  try {
    const value = new URLSearchParams(window.location.search).get('desk') || '';
    return Object.prototype.hasOwnProperty.call(INSIGHTS_DESKS, value) ? value : 'market';
  } catch { return 'market'; }
}

function applyInsightsDeskRoute({ scroll = false } = {}) {
  const desk = requestedDesk();
  const root = $('#eon-market-intelligence');
  if (root) root.dataset.desk = desk;
  document.querySelectorAll('[data-mi-desk]').forEach((link) => {
    const selected = link.dataset.miDesk === desk;
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (!scroll || !window.location.search.includes('desk=')) return desk;
  const target = document.getElementById(INSIGHTS_DESKS[desk].targetId);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'auto' }));
  return desk;
}

function make(tag, text = '', className = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function routeToChat(prompt) {
  const text = cleanText(prompt, 1200);
  try { localStorage.setItem('eon:chat:prefill:v1', text); } catch {}
  window.location.assign(`/chat?q=${encodeURIComponent(text)}`);
}

function save(mutator) {
  state = updateMarketIntelligenceState(mutator);
  return state;
}

function renderMode() {
  const root = $('#eon-market-intelligence');
  if (root) root.dataset.mode = state.settings.mode;
  for (const button of document.querySelectorAll('[data-mi-mode]')) {
    const selected = button.dataset.miMode === state.settings.mode;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('is-selected', selected);
  }
}

function makeOption(label, value, { disabled = false, selected = false } = {}) {
  const option = document.createElement('option');
  option.textContent = label;
  option.value = value;
  option.disabled = disabled;
  option.selected = selected;
  return option;
}

function renderDatasetSelector() {
  const select = $('#mi-dataset-select');
  if (!select) return;
  select.textContent = '';
  if (!state.datasets.length) {
    select.add(makeOption('No local data selected', '', { disabled: true, selected: true }));
    return;
  }
  for (const dataset of state.datasets) {
    select.add(makeOption(`${dataset.name} · ${dataset.points.length} observations`, dataset.id, { selected: dataset.id === activeDataset()?.id }));
  }
}

function renderCanvasAndMetrics() {
  const dataset = activeDataset();
  const label = $('#mi-dataset-label');
  const source = $('#mi-dataset-source');
  const canvas = $('#mi-chart');
  const metricHost = $('#mi-series-metrics');
  const empty = $('#mi-chart-empty');
  if (label) label.textContent = dataset ? `${dataset.symbol} · ${dataset.name}` : 'No local dataset';
  if (source) source.textContent = dataset ? `${dataset.sourceKind === 'csv' ? 'CSV import' : 'Manual reference values'} · ${dataset.sourceLabel}` : 'Add manual reference values or import a CSV to begin.';
  const summary = summarizeLocalSeries(dataset?.points || []);
  if (canvas) renderLocalSeriesChart(canvas, dataset?.points || []);
  if (empty) empty.hidden = summary.count >= 2;
  if (metricHost) {
    metricHost.textContent = '';
    const rows = summary.count ? [
      ['Observations', String(summary.count)],
      ['Window change', `${summary.changePct >= 0 ? '+' : ''}${summary.changePct}%`],
      ['High / low', `${numeric(summary.high).toLocaleString()} / ${numeric(summary.low).toLocaleString()}`],
      ['Max observed drawdown', `${summary.maxDrawdownPct}%`]
    ] : [['Status', 'No automatic data is loaded']];
    for (const [name, value] of rows) {
      const item = make('div', '', 'mi-metric');
      item.append(make('span', name), make('strong', value));
      metricHost.append(item);
    }
  }
}

function renderTheses() {
  const host = $('#mi-thesis-list');
  if (!host) return;
  host.textContent = '';
  if (!state.theses.length) { host.append(make('p', 'No thesis yet. Start with a claim and what could disprove it.', 'mi-empty')); return; }
  [...state.theses].reverse().slice(0, 8).forEach((thesis) => {
    const card = make('article', '', 'mi-record');
    const head = make('div', '', 'mi-record-head');
    head.append(make('strong', thesis.title), make('span', `${thesis.domain} · ${thesis.horizon || 'No horizon'}`));
    card.append(head, make('p', thesis.claim || 'No claim recorded.'), make('small', `Invalidation: ${thesis.invalidation || 'Not recorded.'}`));
    host.append(card);
  });
}

function renderEvidence() {
  const host = $('#mi-evidence-list');
  if (!host) return;
  host.textContent = '';
  if (!state.evidence.length) { host.append(make('p', 'No evidence notes yet. Record where a fact came from and why it matters.', 'mi-empty')); return; }
  [...state.evidence].reverse().slice(0, 8).forEach((entry) => {
    const card = make('article', '', 'mi-record');
    const head = make('div', '', 'mi-record-head');
    head.append(make('strong', entry.label || 'Untitled evidence'), make('span', entry.sourceType));
    card.append(head, make('p', entry.note || 'No note recorded.'));
    host.append(card);
  });
}

function renderHistoricalReview() {
  const dataset = activeDataset();
  const host = $('#mi-scenario-result');
  if (!host) return;
  const review = createHistoricalScenarioReview(dataset?.points || [], { sourceLabel: dataset?.sourceLabel || 'No dataset selected' });
  host.textContent = '';
  if (!review.observations) {
    host.append(make('p', 'A historical scenario review appears after you add local observations. It never loads market data or creates an external order.', 'mi-empty'));
    return;
  }
  const grid = make('div', '', 'mi-scenario-grid');
  for (const [name, value] of [
    ['Observations', String(review.observations)],
    ['Window change', `${review.changePct >= 0 ? '+' : ''}${review.changePct}%`],
    ['Reference path', `${money.format(review.referenceValue)} → ${money.format(review.hypotheticalEndValue)}`],
    ['Max observed drawdown', `${review.maxObservedDrawdownPct}%`]
  ]) {
    const item = make('div', '', 'mi-metric');
    item.append(make('span', name), make('strong', value));
    grid.append(item);
  }
  host.append(grid, make('p', review.assumptions[1], 'mi-inline-note'));
}

function renderForecasts() {
  const calibration = buildForecastCalibrationSummary(state.forecasts);
  const summary = $('#mi-forecast-summary');
  if (summary) {
    summary.textContent = `Open ${calibration.openCount} · Resolved ${calibration.resolvedCount}${calibration.meanBrierScore === null ? '' : ` · Mean Brier ${calibration.meanBrierScore}`}`;
  }
  const host = $('#mi-forecast-list');
  if (!host) return;
  host.textContent = '';
  if (!state.forecasts.length) { host.append(make('p', 'No forecasts yet. Each one needs a probability, deadline and checkable resolution rule.', 'mi-empty')); return; }
  [...state.forecasts].reverse().slice(0, 10).forEach((forecast) => {
    const card = make('article', '', 'mi-record mi-forecast-record');
    const head = make('div', '', 'mi-record-head');
    head.append(make('strong', forecast.title), make('span', `${forecast.probability}% · ${forecast.domain}`));
    card.append(head, make('p', forecast.resolutionCriteria), make('small', `Resolve by: ${forecast.dueAt ? new Date(forecast.dueAt).toLocaleDateString() : 'Not set'}`));
    if (forecast.outcome) card.append(make('small', `Manually resolved: ${forecast.outcome.toUpperCase()} · Brier ${forecast.brierScore}`));
    else {
      const actions = make('div', '', 'mi-mini-actions');
      for (const outcome of ['yes', 'no']) {
        const button = make('button', `Resolve ${outcome.toUpperCase()}`, 'mi-quiet-button');
        button.type = 'button';
        button.dataset.miForecastResolve = forecast.id;
        button.dataset.miOutcome = outcome;
        actions.append(button);
      }
      card.append(actions);
    }
    host.append(card);
  });
}

function renderReceipt() {
  const receipt = createMarketIntelligenceReceipt(state);
  const validation = validateMarketIntelligenceReceipt(receipt);
  const host = $('#mi-receipt-summary');
  if (host) {
    host.textContent = validation.ok
      ? `Safety receipt ready · ${receipt.counts.localObservations} local observations · no network, credential, order or economic-incentive path.`
      : `Safety receipt needs review: ${validation.errors.join(' ')}`;
  }
}

function renderAll() {
  renderMode();
  renderDatasetSelector();
  renderCanvasAndMetrics();
  renderTheses();
  renderEvidence();
  renderHistoricalReview();
  renderForecasts();
  renderReceipt();
}

function bindMode() {
  document.querySelectorAll('[data-mi-mode]').forEach((button) => button.addEventListener('click', () => {
    const mode = button.dataset.miMode === 'pro' ? 'pro' : 'guided';
    save((next) => { next.settings.mode = mode; next.audit.push({ type: 'mode-changed', message: `Research Lab mode set to ${mode}.`, at: new Date().toISOString() }); return next; });
    renderAll();
    setStatus(`${mode === 'pro' ? 'Professional' : 'Guided'} research layout selected locally.`, 'success');
  }));
}

function bindDatasetControls() {
  $('#mi-dataset-select')?.addEventListener('change', (event) => {
    const id = String(event.target.value || '');
    save((next) => { next.settings.selectedDatasetId = id; return next; });
    renderAll();
  });

  $('#mi-manual-point-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const symbol = cleanText($('#mi-manual-symbol')?.value, 30).toUpperCase() || 'REFERENCE';
    const value = numeric($('#mi-manual-value')?.value, NaN);
    const time = $('#mi-manual-time')?.value || new Date().toISOString().slice(0, 10);
    if (!Number.isFinite(value) || value <= 0) { setStatus('Enter a positive local reference value.', 'error'); return; }
    const ensured = ensureManualDataset(state, { name: `${symbol} manual reference values`, symbol });
    state = ensured.state;
    state = appendManualPoint(state, ensured.datasetId, { time, value });
    state = updateMarketIntelligenceState(() => state);
    renderAll();
    setStatus(`Manual reference saved for ${symbol}. No price feed was requested.`, 'success');
  });

  $('#mi-csv-input')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseMarketIntelligenceCsv(await file.text());
      if (!parsed.ok) { setStatus(parsed.errors.join(' '), 'error'); return; }
      const symbol = cleanText($('#mi-csv-symbol')?.value, 30).toUpperCase() || 'CSV';
      state = addLocalDataset(state, { name: cleanText(file.name, 80), symbol, sourceKind: 'csv', sourceLabel: `User-imported file: ${cleanText(file.name, 100)}`, points: parsed.points });
      state = updateMarketIntelligenceState(() => state);
      renderAll();
      setStatus(`${parsed.points.length} local observations imported from CSV. ${parsed.errors.length ? parsed.errors[0] : ''}`, 'success');
    } catch {
      setStatus('The CSV could not be read in this browser.', 'error');
    } finally { event.target.value = ''; }
  });
}

function bindResearchForms() {
  $('#mi-thesis-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = cleanText($('#mi-thesis-title')?.value, 120);
    const claim = cleanText($('#mi-thesis-claim')?.value, 1000);
    if (title.length < 4 || claim.length < 8) { setStatus('Add a clear thesis title and claim.', 'error'); return; }
    state = addLocalThesis(state, { title, claim, invalidation: cleanText($('#mi-thesis-invalidation')?.value, 700), horizon: cleanText($('#mi-thesis-horizon')?.value, 80), domain: $('#mi-thesis-domain')?.value });
    state = updateMarketIntelligenceState(() => state);
    event.target.reset(); renderAll(); setStatus('Thesis recorded locally with an explicit invalidation condition.', 'success');
  });

  $('#mi-evidence-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const label = cleanText($('#mi-evidence-label')?.value, 120);
    const note = cleanText($('#mi-evidence-note')?.value, 1200);
    if (label.length < 3 || note.length < 5) { setStatus('Add a source label and why it matters.', 'error'); return; }
    state = addLocalEvidence(state, { label, note, sourceType: $('#mi-evidence-source')?.value });
    state = updateMarketIntelligenceState(() => state);
    event.target.reset(); renderAll(); setStatus('Evidence note saved locally.', 'success');
  });

  $('#mi-forecast-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = createForecast({
      title: $('#mi-forecast-title')?.value,
      resolutionCriteria: $('#mi-forecast-rule')?.value,
      probability: $('#mi-forecast-probability')?.value,
      dueAt: $('#mi-forecast-date')?.value,
      domain: $('#mi-forecast-domain')?.value
    });
    if (!result.ok) { setStatus(result.errors.join(' '), 'error'); return; }
    state = addLocalForecast(state, result.forecast);
    state = updateMarketIntelligenceState(() => state);
    event.target.reset(); renderAll(); setStatus('Non-monetary forecast recorded for later calibration.', 'success');
  });

  $('#mi-business-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const lens = cleanText($('#mi-business-lens')?.value, 80);
    const question = cleanText($('#mi-business-question')?.value, 900);
    if (question.length < 10) { setStatus('Describe the business question you want to investigate.', 'error'); return; }
    state = addLocalThesis(state, { title: `${lens} brief`, claim: question, invalidation: 'Record the metric or observation that would change this working view.', horizon: 'Review before action', domain: 'business' });
    state = updateMarketIntelligenceState(() => state);
    event.target.reset(); renderAll();
    setStatus('Business Intelligence brief recorded. Use EONBOT to turn it into a research plan, not an automatic decision.', 'success');
  });
}

function bindActions() {
  $('#mi-ask-eonbot')?.addEventListener('click', () => {
    const dataset = activeDataset();
    routeToChat(`Help me research this Research Lab thesis using uncertainty-first reasoning. My local dataset is ${dataset ? `${dataset.name} (${dataset.points.length} observations, ${dataset.sourceLabel})` : 'not yet populated'}. Ask for missing evidence, show opposing explanations, avoid personalised investment advice, and do not tell me to buy or sell anything.`);
  });
  $('#mi-export-receipt')?.addEventListener('click', () => {
    const receipt = createMarketIntelligenceReceipt(state);
    downloadJson(`eon-market-intelligence-receipt-${Date.now()}.json`, receipt);
    appendOperatorActivity({ type: 'market-intelligence-receipt-exported', status: 'local-export', message: 'Local Research Lab safety receipt exported.' });
    setStatus('Safety receipt exported locally. It contains no credential, order, market-data or incentive claim.', 'success');
  });
  $('#mi-export-workspace')?.addEventListener('click', () => {
    downloadJson(`eon-market-intelligence-workspace-${Date.now()}.json`, exportMarketIntelligenceWorkspace(state));
    setStatus('Local workspace export created. Keep it as your own backup; sign-in is not a backup.', 'success');
  });
  $('#mi-forecast-list')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mi-forecast-resolve]');
    if (!button) return;
    state = resolveLocalForecast(state, button.dataset.miForecastResolve, button.dataset.miOutcome);
    state = updateMarketIntelligenceState(() => state);
    renderAll(); setStatus('Forecast outcome recorded manually for calibration review.', 'success');
  });
}

function bindResize() {
  let frame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(renderCanvasAndMetrics);
  }, { passive: true });
}

function init() {
  state = loadMarketIntelligenceState();
  const today = new Date().toISOString().slice(0, 10);
  const manualTime = $('#mi-manual-time');
  const forecastDate = $('#mi-forecast-date');
  if (manualTime && !manualTime.value) manualTime.value = today;
  if (forecastDate && !forecastDate.value) forecastDate.value = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  renderAll();
  const desk = applyInsightsDeskRoute({ scroll: true });
  bindMode(); bindDatasetControls(); bindResearchForms(); bindActions(); bindResize();
  setStatus(`${INSIGHTS_DESKS[desk].label} is local-first. Allowed data inputs: ${MARKET_INTELLIGENCE_SAFETY_CONTRACT.allowedDataInputs.join(' and ')}.`, 'info');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
