/**
 * Template Analyzer
 * Compares "with text" and "without text" images to auto-detect:
 * - Text region positions (headline, testimonial, name)
 * - Text colors
 * - Approximate font sizes
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function analyzeTemplate(withTextPath, withoutTextPath) {
  const withImg = sharp(withTextPath);
  const withoutImg = sharp(withoutTextPath);

  const withMeta = await withImg.metadata();
  const w = withMeta.width;
  const h = withMeta.height;

  // Get raw pixel data
  const withBuf = await withImg.raw().toBuffer();
  const withoutBuf = await withoutImg.resize(w, h).raw().toBuffer();

  // Find differing pixels
  const diffPixels = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const dr = withBuf[i] - withoutBuf[i];
      const dg = withBuf[i + 1] - withoutBuf[i + 1];
      const db = withBuf[i + 2] - withoutBuf[i + 2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist > 30) {
        diffPixels.push({
          x, y,
          r: withBuf[i],
          g: withBuf[i + 1],
          b: withBuf[i + 2]
        });
      }
    }
  }

  if (diffPixels.length === 0) {
    throw new Error('No text differences detected between images');
  }

  // Group into rows
  const rowMap = {};
  for (const p of diffPixels) {
    if (!rowMap[p.y]) rowMap[p.y] = [];
    rowMap[p.y].push(p);
  }

  // Find raw blocks (gap > 15px between rows)
  const sortedYs = Object.keys(rowMap).map(Number).sort((a, b) => a - b);
  const rawBlocks = [];
  let blockStart = sortedYs[0];
  let prev = sortedYs[0];
  for (let i = 1; i < sortedYs.length; i++) {
    if (sortedYs[i] - prev > 15) {
      rawBlocks.push({ y1: blockStart, y2: prev });
      blockStart = sortedYs[i];
    }
    prev = sortedYs[i];
  }
  rawBlocks.push({ y1: blockStart, y2: prev });

  // Merge blocks with gap < 50px
  const merged = [];
  let gs = rawBlocks[0].y1, ge = rawBlocks[0].y2;
  for (let i = 1; i < rawBlocks.length; i++) {
    if (rawBlocks[i].y1 - ge < 50) {
      ge = rawBlocks[i].y2;
    } else {
      merged.push({ y1: gs, y2: ge });
      gs = rawBlocks[i].y1;
      ge = rawBlocks[i].y2;
    }
  }
  merged.push({ y1: gs, y2: ge });

  // For each merged block, find x bounds and dominant color
  const fields = [];
  for (let i = 0; i < merged.length; i++) {
    const block = merged[i];
    const blockPixels = diffPixels.filter(p => p.y >= block.y1 && p.y <= block.y2);
    const xs = blockPixels.map(p => p.x);
    const x1 = Math.min(...xs);
    const x2 = Math.max(...xs);
    const bw = x2 - x1;
    const bh = block.y2 - block.y1;

    // Dominant color (median of pixel colors)
    const rs = blockPixels.map(p => p.r).sort((a, b) => a - b);
    const gs2 = blockPixels.map(p => p.g).sort((a, b) => a - b);
    const bs = blockPixels.map(p => p.b).sort((a, b) => a - b);
    const mid = Math.floor(blockPixels.length / 2);
    const color = `rgb(${rs[mid]}, ${gs2[mid]}, ${bs[mid]})`;
    const hexColor = '#' + [rs[mid], gs2[mid], bs[mid]].map(c => c.toString(16).padStart(2, '0')).join('');

    // Classify
    let label;
    if (i === 0 && block.y1 < h * 0.25) {
      label = 'headline';
    } else if (bh > 100) {
      // Check if we can split testimonial and name
      // Find sub-blocks within this block
      const subYs = [...new Set(blockPixels.map(p => p.y))].sort((a, b) => a - b);
      const subs = [];
      let ss = subYs[0], sp = subYs[0];
      for (let j = 1; j < subYs.length; j++) {
        if (subYs[j] - sp > 15) { subs.push({ y1: ss, y2: sp }); ss = subYs[j]; }
        sp = subYs[j];
      }
      subs.push({ y1: ss, y2: sp });

      if (subs.length >= 2) {
        // Last sub is name, rest is testimonial
        const nameSub = subs[subs.length - 1];
        const testY2 = subs[subs.length - 2].y2;
        const namePixels = blockPixels.filter(p => p.y >= nameSub.y1);
        const testPixels = blockPixels.filter(p => p.y <= testY2);

        // Testimonial
        const txs = testPixels.map(p => p.x);
        const trs = testPixels.map(p => p.r).sort((a, b) => a - b);
        const tgs = testPixels.map(p => p.g).sort((a, b) => a - b);
        const tbs = testPixels.map(p => p.b).sort((a, b) => a - b);
        const tmid = Math.floor(testPixels.length / 2);
        fields.push({
          label: 'testimonial',
          x: Math.min(...txs), y: block.y1,
          width: Math.max(...txs) - Math.min(...txs),
          height: testY2 - block.y1,
          color: '#' + [trs[tmid], tgs[tmid], tbs[tmid]].map(c => c.toString(16).padStart(2, '0')).join(''),
          estimatedFontSize: Math.round((testY2 - block.y1) / subs.slice(0, -1).length * 0.6)
        });

        // Name
        const nxs = namePixels.map(p => p.x);
        const nrs = namePixels.map(p => p.r).sort((a, b) => a - b);
        const ngs = namePixels.map(p => p.g).sort((a, b) => a - b);
        const nbs = namePixels.map(p => p.b).sort((a, b) => a - b);
        const nmid = Math.floor(namePixels.length / 2);
        fields.push({
          label: 'name',
          x: Math.min(...nxs), y: nameSub.y1,
          width: Math.max(...nxs) - Math.min(...nxs),
          height: nameSub.y2 - nameSub.y1,
          color: '#' + [nrs[nmid], ngs[nmid], nbs[nmid]].map(c => c.toString(16).padStart(2, '0')).join(''),
          estimatedFontSize: Math.round((nameSub.y2 - nameSub.y1) * 0.8)
        });
        continue;
      }
      label = 'testimonial';
    } else {
      label = 'name';
    }

    fields.push({
      label,
      x: x1, y: block.y1,
      width: bw, height: bh,
      color: hexColor,
      estimatedFontSize: label === 'headline' ? Math.round(bh * 0.45) : Math.round(bh * 0.6)
    });
  }

  return {
    dimensions: { width: w, height: h },
    fields
  };
}

module.exports = { analyzeTemplate };
