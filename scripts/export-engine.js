/**
 * Puppeteer Export Engine v3
 * Text flows within detected bounding boxes.
 * Auto font-size based on text length.
 * Testimonial stays within its detected area, name below it.
 */
const puppeteer = require('puppeteer');
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

function autoFontSize(text, isStory) {
  const len = text.length;
  const base = isStory ? 1.15 : 1;
  if (len < 60) return Math.round(42 * base);
  if (len < 100) return Math.round(36 * base);
  if (len < 150) return Math.round(30 * base);
  if (len < 200) return Math.round(26 * base);
  if (len < 260) return Math.round(23 * base);
  if (len < 340) return Math.round(20 * base);
  if (len < 440) return Math.round(17 * base);
  if (len < 560) return Math.round(15 * base);
  return Math.round(13 * base);
}

async function renderAd(opts) {
  const { backgroundPath, fields, data, overrides = {}, width, height } = opts;
  const isStory = height > width;

  const bgBase64 = fs.readFileSync(backgroundPath).toString('base64');

  const hl = fields.find(f => f.label === 'headline');
  const tm = fields.find(f => f.label === 'testimonial');
  const nm = fields.find(f => f.label === 'name');

  // Font sizes
  const tText = data.testimonial || '';
  const fontSize = overrides.fontSize || autoFontSize(tText, isStory);
  const hlFontSize = overrides.headlineFontSize || (hl ? hl.estimatedFontSize : 48);
  const nmFontSize = Math.max(14, Math.round(fontSize * 0.55));

  // Colors
  const hlColor = hl?.color || '#FFFFFF';
  const tmColor = tm?.color || '#cdddf2';
  const nmColor = nm?.color || tmColor;

  // Positions - use detected positions, with the testimonial as a constrained box
  const hlX = hl ? hl.x : Math.round(width * 0.14);
  const hlY = hl ? hl.y : Math.round(height * 0.10);
  const hlW = hl ? hl.width : Math.round(width * 0.72);

  const tmX = tm ? tm.x : Math.round(width * 0.50);
  const tmY = tm ? tm.y : Math.round(height * 0.38);
  const tmW = tm ? tm.width : Math.round(width * 0.42);
  const tmMaxH = nm ? (nm.y - tmY - 10) : Math.round(height * 0.35);

  const nmX = nm ? nm.x : tmX;
  // Name goes right after testimonial text (dynamic), but we use CSS flex for this

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
    left:${hlX}px; top:${hlY}px; width:${hlW}px;
    color:${hlColor};
    font-size:${hlFontSize}px;
    font-weight:900;
    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
    line-height:1.15;
    text-align:center;
    text-transform:uppercase;
  }
  
  .text-box {
    position:absolute;
    left:${tmX}px; top:${tmY}px; width:${tmW}px;
    max-height:${tmMaxH}px;
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    overflow:hidden;
  }
  
  .testimonial {
    color:${tmColor};
    font-size:${fontSize}px;
    font-weight:400;
    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
    line-height:1.3;
    word-wrap:break-word;
    overflow-wrap:break-word;
  }
  
  .name {
    color:${nmColor};
    font-size:${nmFontSize}px;
    font-weight:700;
    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
    margin-top:${Math.round(fontSize * 0.4)}px;
    line-height:1.3;
  }
</style>
</head>
<body>
<div class="c">
  <img src="data:image/png;base64,${bgBase64}" />
  ${data.headline ? `<div class="headline">${esc(data.headline)}</div>` : ''}
  <div class="text-box">
    ${data.testimonial ? `<div class="testimonial">${esc(data.testimonial)}</div>` : ''}
    ${data.name ? `<div class="name">-${esc(data.name)}</div>` : ''}
  </div>
</div>
</body>
</html>`;

  const b = await getBrowser();
  const page = await b.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.screenshot({ type:'png', clip:{x:0,y:0,width,height} });
  await page.close();
  return buffer;
}

function esc(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>');
}

async function cleanup() { if (browser) { await browser.close(); browser = null; } }
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup().then(() => process.exit()); });

module.exports = { renderAd, cleanup };
