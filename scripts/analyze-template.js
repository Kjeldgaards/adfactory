/**
 * Template Analyzer v2
 * Compares "with text" and "without text" images.
 * Detects 3 fields: headline, testimonial (full bounding box), name.
 * Merges all testimonial lines into one field.
 */
const sharp = require('sharp');

async function analyzeTemplate(withTextPath, withoutTextPath) {
  const withImg = sharp(withTextPath);
  const withoutImg = sharp(withoutTextPath);
  const withMeta = await withImg.metadata();
  const w = withMeta.width, h = withMeta.height;

  const withBuf = await withImg.raw().toBuffer();
  const withoutBuf = await withoutImg.resize(w, h).raw().toBuffer();

  // Find differing pixels
  const diffPixels = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const dr = withBuf[i] - withoutBuf[i];
      const dg = withBuf[i+1] - withoutBuf[i+1];
      const db = withBuf[i+2] - withoutBuf[i+2];
      if (Math.sqrt(dr*dr + dg*dg + db*db) > 30) {
        diffPixels.push({ x, y, r: withBuf[i], g: withBuf[i+1], b: withBuf[i+2] });
      }
    }
  }

  if (!diffPixels.length) throw new Error('No text differences detected');

  // Group into rows, then blocks (gap > 20px between rows)
  const rowMap = {};
  for (const p of diffPixels) { if (!rowMap[p.y]) rowMap[p.y] = []; rowMap[p.y].push(p); }
  const sortedYs = Object.keys(rowMap).map(Number).sort((a,b) => a-b);

  const rawBlocks = [];
  let bs = sortedYs[0], prev = sortedYs[0];
  for (let i = 1; i < sortedYs.length; i++) {
    if (sortedYs[i] - prev > 20) { rawBlocks.push({y1:bs, y2:prev}); bs = sortedYs[i]; }
    prev = sortedYs[i];
  }
  rawBlocks.push({y1:bs, y2:prev});

  // For each block, get x bounds and color
  const blocks = rawBlocks.map(b => {
    const px = diffPixels.filter(p => p.y >= b.y1 && p.y <= b.y2);
    const xs = px.map(p => p.x);
    const rs = px.map(p => p.r).sort((a,b)=>a-b);
    const gs = px.map(p => p.g).sort((a,b)=>a-b);
    const bs2 = px.map(p => p.b).sort((a,b)=>a-b);
    const mid = Math.floor(px.length/2);
    return {
      y1: b.y1, y2: b.y2,
      x1: Math.min(...xs), x2: Math.max(...xs),
      height: b.y2 - b.y1,
      color: '#' + [rs[mid],gs[mid],bs2[mid]].map(c=>c.toString(16).padStart(2,'0')).join('')
    };
  });

  // Classify: first block near top = headline, last small block = name, everything in between = testimonial
  const fields = [];

  // HEADLINE: first block if it's in top 30% of image
  let headlineIdx = -1;
  if (blocks[0].y1 < h * 0.3 && blocks.length > 2) {
    headlineIdx = 0;
    const b = blocks[0];
    fields.push({
      label: 'headline',
      x: b.x1, y: b.y1,
      width: b.x2 - b.x1, height: b.height,
      color: b.color,
      estimatedFontSize: Math.round(b.height * 0.45)
    });
  }

  // NAME: last block (usually small, single line)
  const nameIdx = blocks.length - 1;
  const nameBlock = blocks[nameIdx];
  if (nameIdx > headlineIdx) {
    fields.push({
      label: 'name',
      x: nameBlock.x1, y: nameBlock.y1,
      width: nameBlock.x2 - nameBlock.x1, height: nameBlock.height,
      color: nameBlock.color,
      estimatedFontSize: Math.round(nameBlock.height * 0.8)
    });
  }

  // TESTIMONIAL: everything between headline and name → merge into one bounding box
  const testStart = headlineIdx + 1;
  const testEnd = nameIdx - 1;
  if (testStart <= testEnd) {
    const testBlocks = blocks.slice(testStart, testEnd + 1);
    const tx1 = Math.min(...testBlocks.map(b => b.x1));
    const tx2 = Math.max(...testBlocks.map(b => b.x2));
    const ty1 = testBlocks[0].y1;
    const ty2 = testBlocks[testBlocks.length-1].y2;
    // Color from the block with most pixels (usually the main text)
    const mainColor = testBlocks.reduce((a,b) => b.height > a.height ? b : a).color;
    fields.push({
      label: 'testimonial',
      x: tx1, y: ty1,
      width: tx2 - tx1, height: ty2 - ty1,
      color: mainColor,
      estimatedFontSize: Math.round((ty2 - ty1) / testBlocks.length * 0.6)
    });
  }

  return { dimensions: { width: w, height: h }, fields };
}

module.exports = { analyzeTemplate };
