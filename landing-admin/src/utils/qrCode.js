import QRCode from 'qrcode';

/**
 * Generate a PNG data URL for absolute https (or http) text.
 * Rejects empty / non-URL strings.
 */
export async function toDataUrl(text, options = {}) {
  const value = String(text ?? '').trim();
  if (!value) {
    throw new Error('QR text is empty');
  }
  if (!/^https?:\/\//i.test(value)) {
    throw new Error('QR text must be an absolute http(s) URL');
  }

  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: options.width ?? 512,
    color: {
      dark: '#2A342D',
      light: '#FFFFFF',
    },
    ...options,
  });
}

export function downloadPng(dataUrl, filename = 'qr-code.png') {
  const href = String(dataUrl ?? '').trim();
  if (!href.startsWith('data:image/')) {
    throw new Error('Invalid PNG data URL');
  }
  const safeName = String(filename || 'qr-code.png').replace(/[^\w.\-]+/g, '_');
  const link = document.createElement('a');
  link.href = href;
  link.download = safeName.endsWith('.png') ? safeName : `${safeName}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
