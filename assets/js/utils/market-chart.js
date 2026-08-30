/**
 * market-chart.js
 * Lightweight canvas chart renderer for OHLC close price trends.
 */

function formatCompact(/** @type {any} */ value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (Math.abs(n) >= 1) return n.toFixed(2);
  return n.toPrecision(4);
}

export function renderPriceChart(/** @type {any} */ canvas, /** @type {any} */ points = [], /** @type {any} */ options = {}) {
  if (!canvas) return;
  const /** @type {any} */
ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const width = canvas.clientWidth || 760;
  const height = canvas.clientHeight || 280;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!Array.isArray(points) || points.length < 2) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = '13px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('No chart data available for this selection.', 16, 24);
    return;
  }

  const /** @type {any} */
padding = { top: 18, right: 56, bottom: 28, left: 18 };
  const chartW = Math.max(40, width - padding.left - padding.right);
  const chartH = Math.max(40, height - padding.top - padding.bottom);
  const closes = points.map((/** @type {any} */ p) => Number(p.close)).filter((/** @type {any} */ v) => Number.isFinite(v));
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = Math.max(1e-9, max - min);

  const toX = (/** @type {any} */ i) => padding.left + (i / (points.length - 1)) * chartW;
  const toY = (/** @type {any} */ price) => padding.top + ((max - price) / span) * chartH;

  const startClose = closes[0];
  const endClose = closes[closes.length - 1];
  const upTrend = endClose >= startClose;
  const lineColor = options.lineColor || (upTrend ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)');
  const fillColor = upTrend ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)';

  // Grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
  }

  // Fill under line
  ctx.beginPath();
  points.forEach((/** @type {any} */ p, /** @type {any} */ idx) => {
    const x = toX(idx);
    const y = toY(Number(p.close));
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Trend line
  ctx.beginPath();
  points.forEach((/** @type {any} */ p, /** @type {any} */ idx) => {
    const x = toX(idx);
    const y = toY(Number(p.close));
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Last point marker
  const lastX = toX(points.length - 1);
  const lastY = toY(endClose);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();

  // Axis labels
  ctx.fillStyle = 'rgba(148, 163, 184, 0.95)';
  ctx.font = '11px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(String(options.leftLabel || ''), padding.left, height - 8);
  ctx.textAlign = 'right';
  ctx.fillText(String(options.rightLabel || ''), padding.left + chartW, height - 8);

  // Price labels on right
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(203, 213, 225, 0.95)';
  ctx.fillText(formatCompact(max), padding.left + chartW + 8, padding.top + 8);
  ctx.fillText(formatCompact((max + min) / 2), padding.left + chartW + 8, padding.top + chartH / 2 + 4);
  ctx.fillText(formatCompact(min), padding.left + chartW + 8, padding.top + chartH);

  // Header summary
  const changePct = startClose > 0 ? ((endClose - startClose) / startClose) * 100 : 0;
  const summary = `${formatCompact(endClose)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`;
  ctx.textAlign = 'left';
  ctx.fillStyle = upTrend ? 'rgba(134, 239, 172, 0.95)' : 'rgba(252, 165, 165, 0.95)';
  ctx.font = '12px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(summary, padding.left, 13);
}
