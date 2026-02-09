/**
 * Puppeteer Export Engine v2
 * Uses flexible CSS layout instead of fixed pixel positions.
 * Detects text area bounding box and flows text naturally with dynamic font sizing.
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

/** Auto font size based on text length (same as v4 prototype) */
function autoFontSize(text, isStory) {
  const len = text.length;
  const base = isStory ? 1.15 : 1;
  if (len < 60) return Math.round(42 * base);
  if (len < 100) return Math.round(38 * base);
  if (len < 150) return Math.round(34 * base);
  if (len < 200) return Math.round(30 * base);
  if (len < 260) return Math.round(26 * base);
  if (len < 340) return Math.round(22 * base);
  if (len < 440) return Math.round(18 * base);
  if (len < 560) return Math.round(15 * base);
  return Math.round(13 * base);
}

async function renderAd(opts) {
  const { backgroundPath, fields, data, overrides = {}, width, height } = opts;
  const isStory = height > width;

  const bgBase64 = fs.readFileSync(backgroundPath).toString('base64');
  const bgMime = 'image/png';

  // Extract field info
  const headlineField = fields.find(f => f.label === 'headline');
  const testimonialField = fields.find(f => f.label === 'testimonial');
  const nameField = fields.find(f => f.label === 'name');

  // Text area = bounding box of all non-headline fields
  const textFields = fields.filter(f => f.label !== 'headline');
  const textAreaLeft = textFields.length > 0 ? Math.min(...textFields.map(f => f.x)) : Math.round(width * 0.5);
  const textAreaTop = textFields.length > 0 ? Math.min(...textFields.map(f => f.y)) : Math.round(height * 0.35);
  const textAreaRight = textFields.length > 0 ? Math.max(...textFields.map(f => f.x + f.width)) : Math.round(width * 0.95);
  const textAreaWidth = textAreaRight - textAreaLeft;

  // Font sizes
  const testimonialText = data.testimonial || '';
  const autoFs = autoFontSize(testimonialText, isStory);
  const fontSize = overrides.fontSize || autoFs;
  const headlineFontSize = overrides.headlineFontSize || (headlineField?.estimatedFontSize || 48);
  const nameFontSize = Math.max(14, Math.round(fontSize * 0.55));

  // Colors
  const headlineColor = headlineField?.color || '#FFFFFF';
  const testimonialColor = testimonialField?.color || textFields[0]?.color || '#FFFFFF';
  const nameColor = nameField?.color || testimonialColor;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${width}px; height:${height}px; overflow:hidden; }
  .c { position:relative; width:${width}px; height:${height}px; }
  .c > img { width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; }
  .headline {
    position:absolute;
    left:${headlineField ? headlineField.x : Math.round(width * 0.05)}px;
    top:${headlineField ? headlineField.y : Math.round(height * 0.05)}px;
    width:${headlineField ? headlineField.width : Math.round(width * 0.9)}px;
    color:${headlineColor};
    font-size:${headlineFontSize}px;
    font-weight:900;
    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
    line-height:1.15;
    text-align:center;
    text-transform:uppercase;
  }
  .text-area {
    position:absolute;
    left:${textAreaLeft}px;
    top:${textAreaTop}px;
    width:${textAreaWidth}px;
    display:flex;
    flex-direction:column;
  }
  .testimonial {
    color:${testimonialColor};
    font-size:${fontSize}px;
    font-weight:400;
    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
    line-height:1.3;
    word-wrap:break-word;
    overflow-wrap:break-word;
  }
  .name {
    color:${nameColor};
    font-size:${nameFontSize}px;
    font-weight:700;
    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
    margin-top:${Math.round(fontSize * 0.5)}px;
    line-height:1.3;
  }
</style>
</head>
<body>
<div class="c">
  <img src="data:${bgMime};base64,${bgBase64}" />
  ${data.headline ? `<div class="headline">${escapeHtml(data.headline)}</div>` : ''}
  <div class="text-area">
    ${data.testimonial ? `<div class="testimonial">${escapeHtml(data.testimonial)}</div>` : ''}
    ${data.name ? `<div class="name">-${escapeHtml(data.name)}</div>` : ''}
  </div>
</div>
</body>
</html>`;

  const b = await getBrowser();
  const page = await b.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.screenshot({ type: 'png', clip: { x:0, y:0, width, height } });
  await page.close();
  return buffer;
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>');
}

async function cleanup() { if (browser) { await browser.close(); browser = null; } }
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup().then(() => process.exit()); });

module.exports = { renderAd, cleanup };
