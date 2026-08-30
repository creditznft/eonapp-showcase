/** Local CSV parsing only. No remote market-data request is made here. */
import { normalizeSeries } from './market-intelligence-store.js';

const TIME_HEADERS = new Set(['time', 'timestamp', 'date', 'datetime', 'day']);
const VALUE_HEADERS = new Set(['value', 'price', 'close', 'last', 'reference', 'amount']);

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(current.trim()); current = '';
    } else current += character;
  }
  cells.push(current.trim());
  return cells;
}

function headerIndex(headers, candidates, fallback) {
  const found = headers.findIndex((header) => candidates.has(header));
  return found >= 0 ? found : fallback;
}

function parseValue(value) {
  const normalized = String(value ?? '').trim().replace(/[$₹€£\s]/g, '').replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function parseMarketIntelligenceCsv(text, { maxRows = 10000 } = {}) {
  const lines = String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { ok: false, errors: ['Provide a CSV with a header and at least one data row.'], points: [] };
  const first = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const likelyHeader = first.some((cell) => TIME_HEADERS.has(cell) || VALUE_HEADERS.has(cell));
  const headers = likelyHeader ? first : ['time', 'value'];
  const start = likelyHeader ? 1 : 0;
  const timeIndex = headerIndex(headers, TIME_HEADERS, 0);
  const valueIndex = headerIndex(headers, VALUE_HEADERS, 1);
  const rawPoints = [];
  const errors = [];

  for (const [offset, line] of lines.slice(start, start + maxRows).entries()) {
    const cells = splitCsvLine(line);
    const value = parseValue(cells[valueIndex]);
    const time = cells[timeIndex];
    if (!time || !Number.isFinite(value) || value <= 0) {
      if (errors.length < 6) errors.push(`Row ${offset + start + 1} was skipped because it lacks a valid time/value pair.`);
      continue;
    }
    rawPoints.push({ time, value });
  }

  const points = normalizeSeries(rawPoints);
  if (!points.length) return { ok: false, errors: [...errors, 'No valid time/value pairs were found.'], points: [] };
  return { ok: true, errors, points, detected: { timeColumn: headers[timeIndex] || 'column 1', valueColumn: headers[valueIndex] || 'column 2' } };
}
