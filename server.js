const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { analyzeTemplate } = require('./scripts/analyze-template');
const { renderAd } = require('./scripts/export-engine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/templates', express.static('templates'));

// ============================================================
// DATA
// ============================================================
const TESTIMONIALS_PATH = path.join(__dirname, 'data', 'testimonials.json');
const TEMPLATES_PATH = path.join(__dirname, 'data', 'templates.json');

function loadTestimonials() {
  return JSON.parse(fs.readFileSync(TESTIMONIALS_PATH, 'utf8'));
}

function loadTemplates() {
  if (!fs.existsSync(TEMPLATES_PATH)) return [];
  return JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf8'));
}

function saveTemplates(templates) {
  fs.writeFileSync(TEMPLATES_PATH, JSON.stringify(templates, null, 2));
}

// ============================================================
// API: Testimonials
// ============================================================
app.get('/api/testimonials', (req, res) => {
  const testimonials = loadTestimonials();
  res.json(testimonials);
});

// ============================================================
// API: Templates
// ============================================================
app.get('/api/templates', (req, res) => {
  const templates = loadTemplates();
  res.json(templates);
});

app.get('/api/templates/:id', (req, res) => {
  const templates = loadTemplates();
  const tpl = templates.find(t => t.id === req.params.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  res.json(tpl);
});

app.delete('/api/templates/:id', (req, res) => {
  let templates = loadTemplates();
  const tpl = templates.find(t => t.id === req.params.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });

  // Delete image files
  for (const format of ['square', 'story']) {
    if (tpl.backgrounds?.[format]) {
      const fp = path.join(__dirname, tpl.backgrounds[format]);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    if (tpl.references?.[format]) {
      const fp = path.join(__dirname, tpl.references[format]);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  }

  templates = templates.filter(t => t.id !== req.params.id);
  saveTemplates(templates);
  res.json({ ok: true });
});

// ============================================================
// API: Template Upload
// ============================================================
const upload = multer({
  dest: 'templates/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPEG files are allowed'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

app.post('/api/templates/upload', upload.array('files', 4), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 files: background (-1080.png) and reference (-1080-ref.png)' });
    }

    const fileMap = {};
    for (const file of req.files) {
      const name = file.originalname;
      const match = name.match(/^(.+?)-(1080|1920)(-ref)?\.png$/i);
      if (!match) {
        return res.status(400).json({
          error: `Invalid filename: ${name}. Expected format: name-1080.png, name-1080-ref.png, name-1920.png, name-1920-ref.png`
        });
      }
      const [, templateName, size, isRef] = match;
      const key = `${size}${isRef ? '-ref' : ''}`;
      fileMap[key] = file;
      if (!fileMap._name) fileMap._name = templateName;
    }

    const templateName = fileMap._name;
    const templateId = templateName.toLowerCase().replace(/\s+/g, '-');

    const backgrounds = {};
    const references = {};
    const configs = {};

    for (const [key, file] of Object.entries(fileMap)) {
      if (key.startsWith('_')) continue;
      const ext = path.extname(file.originalname) || '.png';
      const newName = `${templateId}-${key}${ext}`;
      const newPath = path.join(__dirname, 'templates', newName);
      fs.renameSync(file.path, newPath);

      if (key === '1080') backgrounds.square = `templates/${newName}`;
      if (key === '1920') backgrounds.story = `templates/${newName}`;
      if (key === '1080-ref') references.square = `templates/${newName}`;
      if (key === '1920-ref') references.story = `templates/${newName}`;
    }

    if (references.square && backgrounds.square) {
      const squareConfig = await analyzeTemplate(
        path.join(__dirname, references.square),
        path.join(__dirname, backgrounds.square)
      );
      configs.square = squareConfig;
    }

    if (references.story && backgrounds.story) {
      const storyConfig = await analyzeTemplate(
        path.join(__dirname, references.story),
        path.join(__dirname, backgrounds.story)
      );
      configs.story = storyConfig;
    }

    const templates = loadTemplates();
    const existing = templates.findIndex(t => t.id === templateId);
    const templateData = {
      id: templateId,
      name: req.body.name || templateName,
      backgrounds,
      references,
      configs,
      createdAt: new Date().toISOString()
    };

    if (existing >= 0) {
      templates[existing] = { ...templates[existing], ...templateData };
    } else {
      templates.push(templateData);
    }

    saveTemplates(templates);

    res.json({
      ok: true,
      template: templateData,
      message: `Template "${templateName}" uploaded. Detected fields: ${JSON.stringify(configs.square?.fields?.map(f => f.label) || [])}`
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Export (Generate PNG)
// ============================================================
app.post('/api/export', async (req, res) => {
  try {
    const { templateId, format, testimonial, name, headline, fontSize, headlineFontSize } = req.body;

    if (!templateId || !format) {
      return res.status(400).json({ error: 'templateId and format required' });
    }

    const templates = loadTemplates();
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });

    const formatKey = format === 'story' ? 'story' : 'square';
    const bgPath = path.join(__dirname, tpl.backgrounds[formatKey]);
    if (!fs.existsSync(bgPath)) {
      return res.status(404).json({ error: `No ${formatKey} background for this template` });
    }

    const config = tpl.configs[formatKey];
    if (!config) {
      return res.status(400).json({ error: `No text config for ${formatKey} format. Upload reference image.` });
    }

    const isStory = format === 'story';
    const width = 1080;
    const height = isStory ? 1920 : 1080;

    const buffer = await renderAd({
      backgroundPath: bgPath,
      fields: config.fields,
      data: { headline: headline || '', testimonial: testimonial || '', name: name || '' },
      overrides: { fontSize, headlineFontSize },
      width,
      height
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="kjeldgaard-ad-${templateId}-${format}-${Date.now()}.png"`,
      'Content-Length': buffer.length
    });
    res.send(buffer);

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Preview
// ============================================================
app.post('/api/preview', async (req, res) => {
  try {
    const { templateId, format, testimonial, name, headline, fontSize, headlineFontSize } = req.body;

    const templates = loadTemplates();
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });

    const formatKey = format === 'story' ? 'story' : 'square';
    const bgPath = path.join(__dirname, tpl.backgrounds[formatKey]);
    const config = tpl.configs[formatKey];

    if (!fs.existsSync(bgPath) || !config) {
      return res.status(400).json({ error: 'Template not configured for this format' });
    }

    const isStory = format === 'story';
    const buffer = await renderAd({
      backgroundPath: bgPath,
      fields: config.fields,
      data: { headline: headline || '', testimonial: testimonial || '', name: name || '' },
      overrides: { fontSize, headlineFontSize },
      width: 1080,
      height: isStory ? 1920 : 1080
    });

    const base64 = buffer.toString('base64');
    res.json({ image: `data:image/png;base64,${base64}` });

  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ADMIN DATA FILES CONFIG
// ============================================================
const DATA_FILES = {
  testimonials: path.join(__dirname, 'data', 'testimonials.json'),
  videos: path.join(__dirname, 'data', 'video-master.json'),
  metacomments: path.join(__dirname, 'data', 'meta-comments.json')
};

Object.entries(DATA_FILES).forEach(([key, filepath]) => {
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, '[]', 'utf8');
    console.log(`Created empty ${key} file`);
  }
});

function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
}

function getNextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
}

// ============================================================
// TRUSTPILOT TESTIMONIALS API (Admin)
// ============================================================
app.post('/api/testimonials', (req, res) => {
  const data = loadJSON(DATA_FILES.testimonials);
  const newItem = {
    id: getNextId(data),
    navn: req.body.navn || 'Anonym',
    dato: req.body.dato || new Date().toISOString().split('T')[0],
    rating: req.body.rating || 5,
    tekst: req.body.tekst || '',
    temaer: req.body.temaer || [],
    awareness: req.body.awareness || 'product_aware',
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  saveJSON(DATA_FILES.testimonials, data);
  res.json({ success: true, item: newItem, total: data.length });
});

app.put('/api/testimonials/:id', (req, res) => {
  const data = loadJSON(DATA_FILES.testimonials);
  const idx = data.findIndex(t => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...data[idx], ...req.body, id: data[idx].id, updatedAt: new Date().toISOString() };
  saveJSON(DATA_FILES.testimonials, data);
  res.json({ success: true, item: data[idx] });
});

app.delete('/api/testimonials/:id', (req, res) => {
  let data = loadJSON(DATA_FILES.testimonials);
  const initialLength = data.length;
  data = data.filter(t => t.id !== parseInt(req.params.id));
  if (data.length === initialLength) return res.status(404).json({ error: 'Not found' });
  saveJSON(DATA_FILES.testimonials, data);
  res.json({ success: true, remaining: data.length });
});

app.post('/api/testimonials/bulk', (req, res) => {
  const data = loadJSON(DATA_FILES.testimonials);
  const newItems = req.body.items || [];
  newItems.forEach(item => {
    data.push({
      id: getNextId(data),
      navn: item.navn || 'Anonym',
      dato: item.dato || new Date().toISOString().split('T')[0],
      rating: item.rating || 5,
      tekst: item.tekst || '',
      temaer: item.temaer || [],
      awareness: item.awareness || 'product_aware',
      createdAt: new Date().toISOString()
    });
  });
  saveJSON(DATA_FILES.testimonials, data);
  res.json({ success: true, added: newItems.length, total: data.length });
});

// ============================================================
// VIDEO MASTER API
// ============================================================
app.get('/api/videos', (req, res) => res.json(loadJSON(DATA_FILES.videos)));

app.post('/api/videos', (req, res) => {
  const data = loadJSON(DATA_FILES.videos);
  const newItem = {
    id: getNextId(data),
    navn: req.body.navn || 'Ukendt',
    alder: req.body.alder || null,
    hudbekymring: req.body.hudbekymring || null,
    videoLængde: req.body.videoLængde || null,
    transkription: req.body.transkription || '',
    filename: req.body.filename || null,
    quotes: req.body.quotes || [],
    temaer: req.body.temaer || [],
    awareness: req.body.awareness || 'product_aware',
    score: req.body.score || null,
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  saveJSON(DATA_FILES.videos, data);
  res.json({ success: true, item: newItem, total: data.length });
});

app.put('/api/videos/:id', (req, res) => {
  const data = loadJSON(DATA_FILES.videos);
  const idx = data.findIndex(v => v.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...data[idx], ...req.body, id: data[idx].id, updatedAt: new Date().toISOString() };
  saveJSON(DATA_FILES.videos, data);
  res.json({ success: true, item: data[idx] });
});

app.delete('/api/videos/:id', (req, res) => {
  let data = loadJSON(DATA_FILES.videos);
  const initialLength = data.length;
  data = data.filter(v => v.id !== parseInt(req.params.id));
  if (data.length === initialLength) return res.status(404).json({ error: 'Not found' });
  saveJSON(DATA_FILES.videos, data);
  res.json({ success: true, remaining: data.length });
});

// ============================================================
// META COMMENTS API
// ============================================================
app.get('/api/metacomments', (req, res) => res.json(loadJSON(DATA_FILES.metacomments)));

app.post('/api/metacomments', (req, res) => {
  const data = loadJSON(DATA_FILES.metacomments);
  const newItem = {
    id: getNextId(data),
    navn: req.body.navn || 'Anonym',
    dato: req.body.dato || new Date().toISOString().split('T')[0],
    tekst: req.body.tekst || '',
    kilde: req.body.kilde || 'facebook',
    adId: req.body.adId || null,
    postUrl: req.body.postUrl || null,
    sentiment: req.body.sentiment || 'positiv',
    temaer: req.body.temaer || [],
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  saveJSON(DATA_FILES.metacomments, data);
  res.json({ success: true, item: newItem, total: data.length });
});

app.put('/api/metacomments/:id', (req, res) => {
  const data = loadJSON(DATA_FILES.metacomments);
  const idx = data.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...data[idx], ...req.body, id: data[idx].id, updatedAt: new Date().toISOString() };
  saveJSON(DATA_FILES.metacomments, data);
  res.json({ success: true, item: data[idx] });
});

app.delete('/api/metacomments/:id', (req, res) => {
  let data = loadJSON(DATA_FILES.metacomments);
  const initialLength = data.length;
  data = data.filter(c => c.id !== parseInt(req.params.id));
  if (data.length === initialLength) return res.status(404).json({ error: 'Not found' });
  saveJSON(DATA_FILES.metacomments, data);
  res.json({ success: true, remaining: data.length });
});

// ============================================================
// STATS
// ============================================================
app.get('/api/stats', (req, res) => {
  res.json({
    testimonials: loadJSON(DATA_FILES.testimonials).length,
    videos: loadJSON(DATA_FILES.videos).length,
    metacomments: loadJSON(DATA_FILES.metacomments).length
  });
});

// ============================================================
// IMAGE EXTRACTION (Claude Vision)
// ============================================================
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/extract-from-image', async (req, res) => {
  try {
    const { image, type } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = image.match(/^data:(image\/\w+);/)?.[1] || 'image/png';

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'tp') {
      systemPrompt = `Du er en data-ekstraktor. Du læser screenshots af Trustpilot anmeldelser og returnerer struktureret JSON.
Returner ALTID gyldig JSON i dette format:
{
  "navn": "kundens navn",
  "dato": "YYYY-MM-DD",
  "rating": 5,
  "tekst": "den fulde anmeldelsestekst",
  "temaer": ["tema1", "tema2"],
  "awareness": "product_aware"
}
Temaer: Brug ALTID eksisterende temaer når de passer. Her er listen: rynker, fugt, glød, blød hud, fasthed, pigment, rosacea, poser under øjne, mørke rande, skeptiker, afhængig, genbestilling, anbefaling, overgangsalder, følelsesmæssig forandring, resultat, barriere, tør hud, sensitiv, rødme, anti-aging, enkelhed. KUN hvis indholdet tydeligt handler om noget INGEN af disse dækker, må du oprette ét nyt kort tema (2-3 ord, dansk, lowercase). Opret IKKE nye temaer der overlapper med eksisterende.
Awareness skal være en af: problem_aware, solution_aware, product_aware, most_aware
Hvis datoen er relativ (fx "for 3 dage siden"), beregn den faktiske dato baseret på dags dato.`;
      userPrompt = 'Læs denne Trustpilot anmeldelse og returner data som JSON:';

    } else if (type === 'vid') {
      systemPrompt = `Du er en data-ekstraktor. Du læser screenshots af video-transskriptioner og returnerer struktureret JSON.
Returner ALTID gyldig JSON i dette format:
{
  "navn": "personens navn hvis nævnt",
  "alder": 64,
  "videoLængde": "~1:30",
  "hudbekymring": "rynker, tør hud",
  "transkription": "den fulde tekst",
  "temaer": ["tema1", "tema2"]
}
Temaer: Brug ALTID eksisterende temaer når de passer. Her er listen: rynker, fugt, glød, blød hud, fasthed, pigment, rosacea, poser under øjne, mørke rande, skeptiker, afhængig, genbestilling, anbefaling, overgangsalder, følelsesmæssig forandring, resultat, barriere, tør hud, sensitiv, rødme, anti-aging, enkelhed. KUN hvis indholdet tydeligt handler om noget INGEN af disse dækker, må du oprette ét nyt kort tema (2-3 ord, dansk, lowercase). Opret IKKE nye temaer der overlapper med eksisterende.
Hvis alder ikke nævnes, sæt null.`;
      userPrompt = 'Læs denne video-transskription og returner data som JSON:';

    } else if (type === 'meta') {
      systemPrompt = `Du er en data-ekstraktor. Du læser screenshots af Facebook/Instagram kommentarer og returnerer struktureret JSON.
Returner ALTID gyldig JSON i dette format:
{
  "navn": "personens navn",
  "tekst": "kommentarteksten",
  "kilde": "facebook",
  "sentiment": "positiv",
  "temaer": ["tema1", "tema2"]
}
Kilde skal være: facebook, instagram, eller messenger
Sentiment skal være: positiv, neutral, eller negativ
Temaer: Brug ALTID eksisterende temaer når de passer. Her er listen: rynker, fugt, glød, blød hud, fasthed, pigment, rosacea, poser under øjne, mørke rande, skeptiker, afhængig, genbestilling, anbefaling, overgangsalder, følelsesmæssig forandring, resultat, barriere, tør hud, sensitiv, rødme, anti-aging, enkelhed, spørgsmål, pris, levering, kritik, ros. KUN hvis indholdet tydeligt handler om noget INGEN af disse dækker, må du oprette ét nyt kort tema (2-3 ord, dansk, lowercase). Opret IKKE nye temaer der overlapper med eksisterende.`;
      userPrompt = 'Læs denne social media kommentar og returner data som JSON:';
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: userPrompt }
        ]
      }]
    });

    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(400).json({ error: 'Could not extract data from image' });

    res.json(JSON.parse(jsonMatch[0]));

  } catch (err) {
    console.error('Image extraction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SEARCH API ENDPOINT
// ============================================================

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const source = (req.query.source || 'all').toLowerCase();
  const tema = (req.query.tema || '').toLowerCase().trim();
  
  if (!q && !tema) {
    return res.json({ results: [], total: 0 });
  }
  
  const results = [];
  
  function matches(item, textFields) {
    let matchesQuery = !q;
    let matchesTema = !tema;
    
    if (q) {
      for (const field of textFields) {
        if (item[field] && item[field].toLowerCase().includes(q)) { matchesQuery = true; break; }
      }
      if (!matchesQuery && item.temaer) {
        matchesQuery = item.temaer.some(t => t.toLowerCase().includes(q));
      }
      if (!matchesQuery && item.navn && item.navn.toLowerCase().includes(q)) {
        matchesQuery = true;
      }
    }
    
    if (tema && item.temaer) {
      matchesTema = item.temaer.some(t => t.toLowerCase().includes(tema));
    }
    
    return matchesQuery && matchesTema;
  }
  
  if (source === 'all' || source === 'tp') {
    const tp = loadJSON(DATA_FILES.testimonials);
    tp.forEach(item => {
      if (matches(item, ['tekst'])) {
        results.push({ ...item, _source: 'tp', _sourceLabel: 'Trustpilot', _preview: (item.tekst || '').substring(0, 200) });
      }
    });
  }
  
  if (source === 'all' || source === 'vdo') {
    const vdo = loadJSON(DATA_FILES.videos);
    vdo.forEach(item => {
      if (matches(item, ['transkription'])) {
        results.push({ ...item, _source: 'vdo', _sourceLabel: 'Video', _preview: (item.transkription || '').substring(0, 200) });
      }
    });
  }
  
  if (source === 'all' || source === 'meta') {
    const meta = loadJSON(DATA_FILES.metacomments);
    meta.forEach(item => {
      if (matches(item, ['tekst'])) {
        results.push({ ...item, _source: 'meta', _sourceLabel: 'Meta', _preview: (item.tekst || '').substring(0, 200) });
      }
    });
  }
  
  res.json({ results, total: results.length, query: q, source, tema });
});

app.get('/api/temaer', (req, res) => {
  const counts = {};
  const tp = loadJSON(DATA_FILES.testimonials);
  const vdo = loadJSON(DATA_FILES.videos);
  const meta = loadJSON(DATA_FILES.metacomments);
  
  [...tp, ...vdo, ...meta].forEach(item => {
    if (item.temaer && Array.isArray(item.temaer)) {
      item.temaer.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    }
  });
  
  const temaer = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tema, count]) => ({ tema, count }));
  
  res.json({ temaer });
});

// ============================================================
// Serve frontend for all non-API routes
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// Start
// ============================================================
async function autoDiscoverTemplates() {
  const tplDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(tplDir)) return;
  const files = fs.readdirSync(tplDir);

  const templateFiles = files.filter(f => /^.+-(1080|1920)(-ref)?\.png$/i.test(f));
  if (templateFiles.length === 0) return;

  const groups = {};
  for (const f of templateFiles) {
    const match = f.match(/^(.+?)-(1080|1920)(-ref)?\.png$/i);
    if (!match) continue;
    const [, name, size, isRef] = match;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (!groups[id]) groups[id] = { name, id };
    const key = `${size}${isRef ? '-ref' : ''}`;
    groups[id][key] = f;
  }

  const templates = loadTemplates();
  let changed = false;

  for (const [id, g] of Object.entries(groups)) {
    if (templates.find(t => t.id === id)) continue;

    const backgrounds = {};
    const references = {};
    for (const key of ['1080', '1080-ref', '1920', '1920-ref']) {
      if (!g[key]) continue;
      if (key === '1080') backgrounds.square = `templates/${g[key]}`;
      if (key === '1920') backgrounds.story = `templates/${g[key]}`;
      if (key === '1080-ref') references.square = `templates/${g[key]}`;
      if (key === '1920-ref') references.story = `templates/${g[key]}`;
    }

    const configs = {};
    try {
      if (references.square && backgrounds.square) {
        configs.square = await analyzeTemplate(
          path.join(__dirname, references.square),
          path.join(__dirname, backgrounds.square)
        );
      }
      if (references.story && backgrounds.story) {
        configs.story = await analyzeTemplate(
          path.join(__dirname, references.story),
          path.join(__dirname, backgrounds.story)
        );
      }
    } catch (e) { console.error(`  Auto-analyze failed for ${id}:`, e.message); }

    templates.push({ id, name: g.name, backgrounds, references, configs, createdAt: new Date().toISOString() });
    changed = true;
    console.log(`  Auto-discovered template: ${g.name}`);
  }

  if (changed) saveTemplates(templates);
}

app.listen(PORT, async () => {
  console.log(`\n  KJELDGAARD AD FACTORY`);
  console.log(`  Running on http://localhost:${PORT}`);
  await autoDiscoverTemplates();
  console.log(`  Templates: ${loadTemplates().length}`);
  console.log(`  Testimonials: ${loadTestimonials().length}\n`);
});
