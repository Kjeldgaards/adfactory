/**
 * Puppeteer Export Engine
 * Renders a template background + text overlay → PNG
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browser;
}

/**
 * Generate a PNG ad from template + text data
 * @param {Object} opts
 * @param {string} opts.backgroundPath - Path to background PNG (without text)
 * @param {Array} opts.fields - Text field definitions from template config
 * @param {Object} opts.data - { headline, testimonial, name }
 * @param {Object} opts.overrides - { fontSize, headlineFontSize } optional overrides
 * @param {number} opts.width - Output width (1080)
 * @param {number} opts.height - Output height (1080 or 1920)
 * @returns {Buffer} PNG buffer
 */
async function renderAd(opts) {
  const { backgroundPath, fields, data, overrides = {}, width, height } = opts;

  // Read background as base64
  const bgBase64 = fs.readFileSync(backgroundPath).toString('base64');
  const bgMime = 'image/png';

  // Build HTML with text overlays
  const textElements = fields.map(field => {
    const text = data[field.label] || '';
    if (!text) return '';

    const fontSize = field.label === 'headline' && overrides.headlineFontSize
      ? overrides.headlineFontSize
      : field.label === 'testimonial' && overrides.fontSize
        ? overrides.fontSize
        : field.estimatedFontSize || 36;

    const fontWeight = field.label === 'headline' ? 'bold' : 
                       field.label === 'name' ? 'bold' : 'normal';

    return `
      <div style="
        position: absolute;
        left: ${field.x}px;
        top: ${field.y}px;
        width: ${field.width}px;
        color: ${field.color || '#FFFFFF'};
        font-size: ${fontSize}px;
        font-weight: ${fontWeight};
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.25;
        word-wrap: break-word;
        overflow-wrap: break-word;
      ">${escapeHtml(text)}</div>
    `;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${width}px; height: ${height}px; overflow: hidden; }
    .container {
      position: relative;
      width: ${width}px;
      height: ${height}px;
    }
    .container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="data:${bgMime};base64,${bgBase64}" />
    ${textElements}
  </div>
</body>
</html>`;

  const b = await getBrowser();
  const page = await b.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width, height }
  });

  await page.close();
  return buffer;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

async function cleanup() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup().then(() => process.exit()); });

module.exports = { renderAd, cleanup };
