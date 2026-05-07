function svgDataUrl(value) {
  const safe = String(value || '').replace(/[<>&"']/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[ch]));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" rx="24" fill="#fff"/><rect x="18" y="18" width="54" height="54" rx="8" fill="#111827"/><rect x="148" y="18" width="54" height="54" rx="8" fill="#111827"/><rect x="18" y="148" width="54" height="54" rx="8" fill="#111827"/><path d="M96 34h18v18H96zM126 34h12v12h-12zM96 66h42v12H96zM88 96h18v18H88zM120 92h20v20h-20zM152 96h18v18h-18zM92 134h46v14H92zM156 132h14v38h-14zM92 164h22v22H92zM124 164h22v14h-22z" fill="#111827"/><text x="110" y="210" font-size="8" text-anchor="middle" fill="#6b7280">${safe}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function generateQrDataUrl(value) {
  try {
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(value, { width: 320, margin: 1, errorCorrectionLevel: 'M' });
  } catch (error) {
    return svgDataUrl(value);
  }
}

async function generateUserProfileQr(user, buildUrl) {
  return generateQrDataUrl(buildUrl(user));
}
module.exports = { generateQrDataUrl, generateUserProfileQr };
