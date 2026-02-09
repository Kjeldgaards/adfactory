/**
 * Puppeteer Export Engine v4 — FINAL
 * Uses detected field positions but constrains text between
 * quote marks (top) and stars (bottom) found in background.
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

  // Colors from detection
  const hlColor = hl?.color || '#cdf4fe';
  const tmColor = tm?.color || '#cdddf2';
  const nmColor = nm?.color || tmColor;

  // HEADLINE position from detection
  const hlX = hl ? hl.x : Math.round(width * 0.14);
  const hlY = hl ? hl.y : Math.round(height * 0.10);
  const hlW = hl ? hl.width : Math.round(width * 0.71);

  // TESTIMONIAL position: use detected X and width,
  // but Y starts BELOW the detected testimonial top (which is after quote marks)
  // and max-height stops ABOVE the detected name position
  const tmX = tm ? tm.x : (isStory ? 450 : 541);
  const tmY = tm ? tm.y : (isStory ? 404 : 413);
  const tmW = tm ? tm.width : (isStory ? 608 : 456);
  
  // Max height: from testimonial start to just above where name was detected
  // This ensures text + name stays above the stars
  const nmDetectedY = nm ? nm.y : (isStory ? 928 : 743);
  const tmMaxH = nmDetectedY - tmY;

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
