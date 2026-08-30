/** Canvas-only chart renderer for local user data. */
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function renderLocalSeriesChart(canvas, points = []) {
  if (!canvas || typeof canvas.getContext !== 'function') return { ok: false, reason: 'Canvas unavailable.' };
  const series = [...(Array.isArray(points) ? points : [])].filter((point) => finite(point?.value, NaN) > 0).sort((left, right) => String(left.time).localeCompare(String(right.time)));
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(280, Math.round(bounds.width || 680));
  const height = Math.max(220, Math.round(bounds.height || 320));
  const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext('2d');
  if (!context) return { ok: false, reason: '2D context unavailable.' };
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#07111f';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(148, 163, 184, .16)';
  context.lineWidth = 1;
  for (let index = 1; index < 5; index += 1) {
    const y = Math.round((height / 5) * index);
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
  if (series.length < 2) {
    context.fillStyle = '#a7b7cf';
    context.font = '600 14px system-ui, sans-serif';
    context.fillText('Add at least two local observations to draw a research chart.', 18, Math.round(height / 2));
    return { ok: true, plotted: 0, empty: true };
  }
  const values = series.map((point) => finite(point.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, Math.max(max * 0.02, 1));
  const padding = { top: 22, right: 22, bottom: 30, left: 54 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = (index) => padding.left + (index / (series.length - 1)) * plotWidth;
  const y = (value) => padding.top + (1 - ((value - min) / spread)) * plotHeight;
  context.strokeStyle = '#7dd3fc';
  context.lineWidth = 2;
  context.beginPath();
  series.forEach((point, index) => {
    if (!index) context.moveTo(x(index), y(point.value)); else context.lineTo(x(index), y(point.value));
  });
  context.stroke();
  context.fillStyle = '#93a7c3';
  context.font = '12px system-ui, sans-serif';
  context.fillText(String(max.toLocaleString(undefined, { maximumFractionDigits: 2 })), 8, padding.top + 4);
  context.fillText(String(min.toLocaleString(undefined, { maximumFractionDigits: 2 })), 8, height - padding.bottom + 4);
  context.fillText(new Date(series[0].time).toLocaleDateString(), padding.left, height - 8);
  context.textAlign = 'right';
  context.fillText(new Date(series.at(-1).time).toLocaleDateString(), width - padding.right, height - 8);
  context.textAlign = 'left';
  return { ok: true, plotted: series.length, min, max };
}
