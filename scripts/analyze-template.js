/**
 * Template Analyzer v3
 * Compares "with text" and "without text" images.
 * Detects headline, testimonial area, and name as separate fields.
 * Uses gap analysis to properly separate text blocks.
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
  const diffRows = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const dr = withBuf[i] - withoutBuf[i];
      const dg = withBuf[i+1] - withoutBuf[i+1];
      const db = withBuf[i+2] - withoutBuf[i+2];
      if (Math.sqrt(dr*dr + dg*dg + db*db) > 30) {
        if (!diffRows[y]) diffRows[y] = [];
        diffRows[y].push({ x, r: withBuf[i], g: withBuf[i+1], b: withBuf[i+2] });
      }
    }
  }

  const sortedYs = Object.keys(diffRows).map(Number).sort((a,b) => a-b);
  if (!sortedYs.length) throw new Error('No text differences detected');

  // Build sub-blocks (gap > 10px between rows)
  const subBlocks = [];
  let bs = sortedYs[0], prev = sortedYs[0];
  for (let i = 1; i < sortedYs.length; i++) {
    if (sortedYs[i] - prev > 10) { subBlocks.push({y1:bs, y2:prev}); bs = sortedYs[i]; }
    prev = sortedYs[i];
  }
  subBlocks.push({y1:bs, y2:prev});

  // Enrich sub-blocks with x bounds and color
  for (const sb of subBlocks) {
    let allX = [], allR = [], allG = [], allB = [];
    for (let y = sb.y1; y <= sb.y2; y++) {
      if (diffRows[y]) {
        for (const p of diffRows[y]) {
          allX.push(p.x); allR.push(p.r); allG.push(p.g); allB.push(p.b);
        }
      }
    }
    sb.x1 = Math.min(...allX);
    sb.x2 = Math.max(...allX);
    allR.sort((a,b)=>a-b); allG.sort((a,b)=>a-b); allB.sort((a,b)=>a-b);
    const mid = Math.floor(allR.length / 2);
    sb.color = '#' + [allR[mid], allG[mid], allB[mid]].map(c => c.toString(16).padStart(2,'0')).join('');
  }

  // Group sub-blocks into major blocks (gap > 30px)
  const majorBlocks = [];
  let group = [subBlocks[0]];
  for (let i = 1; i < subBlocks.length; i++) {
    if (subBlocks[i].y1 - subBlocks[i-1].y2 > 30) {
      majorBlocks.push(group);
      group = [subBlocks[i]];
    } else {
      group.push(subBlocks[i]);
    }
  }
  majorBlocks.push(group);

  // Classify major blocks
  const fields = [];

  if (majorBlocks.length >= 2) {
    // First major block = headline (if in top 35% of image)
    const first = majorBlocks[0];
    const firstY1 = first[0].y1;
    const firstY2 = first[first.length-1].y2;
    
    if (firstY1 < h * 0.35) {
      const firstX1 = Math.min(...first.map(s => s.x1));
      const firstX2 = Math.max(...first.map(s => s.x2));
      fields.push({
        label: 'headline',
        x: firstX1, y: firstY1,
        width: firstX2 - firstX1, height: firstY2 - firstY1,
        color: first[0].color,
        estimatedFontSize: Math.round((firstY2 - firstY1) / first.length * 0.7)
      });
    }

    // Last major block: check if it's just 1 sub-block (= name)
    // or if last sub-block in last major block is name
    const last = majorBlocks[majorBlocks.length - 1];
    
    if (last.length === 1 && last[0].y2 - last[0].y1 < 40) {
      // Single small block = name
      fields.push({
        label: 'name',
        x: last[0].x1, y: last[0].y1,
        width: last[0].x2 - last[0].x1, height: last[0].y2 - last[0].y1,
        color: last[0].color,
        estimatedFontSize: Math.round((last[0].y2 - last[0].y1) * 0.8)
      });
      
      // Everything in between = testimonial
      const midBlocks = majorBlocks.slice(1, -1);
      if (midBlocks.length > 0) {
        const allSubs = midBlocks.flat();
        const tx1 = Math.min(...allSubs.map(s => s.x1));
        const tx2 = Math.max(...allSubs.map(s => s.x2));
        const ty1 = allSubs[0].y1;
        const ty2 = allSubs[allSubs.length-1].y2;
        fields.push({
          label: 'testimonial',
          x: tx1, y: ty1,
          width: tx2 - tx1, height: ty2 - ty1,
          color: allSubs[Math.floor(allSubs.length/2)].color,
          estimatedFontSize: Math.round((ty2 - ty1) / allSubs.length * 0.6)
        });
      }
    } else {
      // Last sub-block in last group = name, rest = testimonial
      const nameSub = last[last.length - 1];
      const testSubs = [];
      
      // Collect all subs from non-headline blocks except last sub
      for (let i = (fields.some(f=>f.label==='headline') ? 1 : 0); i < majorBlocks.length; i++) {
        const blk = majorBlocks[i];
        for (let j = 0; j < blk.length; j++) {
          if (i === majorBlocks.length - 1 && j === blk.length - 1) continue; // skip name
          testSubs.push(blk[j]);
        }
      }

      if (testSubs.length > 0) {
        const tx1 = Math.min(...testSubs.map(s => s.x1));
        const tx2 = Math.max(...testSubs.map(s => s.x2));
        const ty1 = testSubs[0].y1;
        const ty2 = testSubs[testSubs.length-1].y2;
        fields.push({
          label: 'testimonial',
          x: tx1, y: ty1,
          width: tx2 - tx1, height: ty2 - ty1,
          color: testSubs[Math.floor(testSubs.length/2)].color,
          estimatedFontSize: Math.round((ty2 - ty1) / testSubs.length * 0.6)
        });
      }

      fields.push({
        label: 'name',
        x: nameSub.x1, y: nameSub.y1,
        width: nameSub.x2 - nameSub.x1, height: nameSub.y2 - nameSub.y1,
        color: nameSub.color,
        estimatedFontSize: Math.round((nameSub.y2 - nameSub.y1) * 0.8)
      });
    }
  }

  return { dimensions: { width: w, height: h }, fields };
}

module.exports = { analyzeTemplate };
