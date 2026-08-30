import QRCode from 'qrcode';

const MAX_QR_VALUE_LENGTH = 2048;

function safeQrValue(value = '') {
  const source = String(value || '').trim();
  if (!source) throw new Error('qr_value_required');
  if (source.length > MAX_QR_VALUE_LENGTH) throw new Error('qr_value_too_long');
  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://eonapp.local';
    const url = new URL(source, baseOrigin);
    if (!/^https?:$/i.test(url.protocol)) throw new Error('qr_value_protocol_not_allowed');
    return url.toString();
  } catch (error) {
    if (String(error?.message || '') === 'qr_value_protocol_not_allowed') throw error;
    throw new Error('qr_value_invalid');
  }
}

export async function renderQrCanvas(canvas, value, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') throw new Error('qr_canvas_required');
  const safeValue = safeQrValue(value);
  const width = Math.max(96, Math.min(1024, Number(options.width) || 168));
  await QRCode.toCanvas(canvas, safeValue, {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    margin: Number.isFinite(Number(options.margin)) ? Number(options.margin) : 1,
    width,
    color: {
      dark: options.dark || '#101826',
      light: options.light || '#f8fafc'
    }
  });
  canvas.dataset.qrValue = safeValue;
  canvas.dataset.qrReady = 'true';
  return { ok: true, value: safeValue, width };
}

export async function createQrSvg(value, options = {}) {
  const safeValue = safeQrValue(value);
  return QRCode.toString(safeValue, {
    type: 'svg',
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    margin: Number.isFinite(Number(options.margin)) ? Number(options.margin) : 1,
    color: {
      dark: options.dark || '#101826',
      light: options.light || '#f8fafc'
    }
  });
}

export function getQrSafetySummary() {
  return Object.freeze({
    bundled: true,
    externalRuntimeCdn: false,
    acceptedProtocols: ['http:', 'https:'],
    maxValueLength: MAX_QR_VALUE_LENGTH
  });
}
