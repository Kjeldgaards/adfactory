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

// Volume seeding: if data/ is empty (fresh volume mount), copy from data-seed/
const DATA_DIR = path.join(__dirname, 'data');
const SEED_DIR = path.join(__dirname, 'data-seed');

function seedDataIfEmpty() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  
  const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  
  if (dataFiles.length === 0 && fs.existsSync(SEED_DIR)) {
    console.log('  Volume empty — seeding from data-seed/...');
    const seedFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json'));
    seedFiles.forEach(f => {
      fs.copyFileSync(path.join(SEED_DIR, f), path.join(DATA_DIR, f));
      console.log(`    Seeded: ${f}`);
    });
    console.log(`  Seeded ${seedFiles.length} files`);
  } else {
    console.log(`  Data dir has ${dataFiles.length} files (volume OK)`);
  }
}

seedDataIfEmpty();

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
    alder: req.body.alder || null,
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
    dato: req.body.dato || new Date().toISOString().split('T')[0],
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
    alder: req.body.alder || null,
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
  "alder": null,
  "rating": 5,
  "tekst": "den fulde anmeldelsestekst",
  "temaer": ["tema1", "tema2"],
  "awareness": "product_aware"
}
Hvis alder nævnes i teksten (fx "jeg er 58 år"), ekstraher den som tal. Ellers null.
Temaer: Brug ALTID eksisterende temaer når de passer. Her er listen: rynker, fugt, glød, blød hud, fasthed, pigment, rosacea, poser under øjne, mørke rande, skeptiker, afhængig, genbestilling, anbefaling, overgangsalder, følelsesmæssig forandring, resultat, barriere, tør hud, sensitiv, rødme, anti-aging, enkelhed, prøvet alt. VIGTIGT: "prøvet alt" bruges når kunden fortæller at de har prøvet mange/andre produkter uden virkning, og at dette endelig virker. KUN hvis indholdet tydeligt handler om noget INGEN af disse dækker, må du oprette ét nyt kort tema (2-3 ord, dansk, lowercase). Opret IKKE nye temaer der overlapper med eksisterende.
Awareness skal være en af: problem_aware, solution_aware, product_aware, most_aware
Hvis datoen er relativ (fx "for 3 dage siden"), beregn den faktiske dato baseret på dags dato.`;
      userPrompt = 'Læs denne Trustpilot anmeldelse og returner data som JSON:';

    } else if (type === 'vid') {
      systemPrompt = `Du er en data-ekstraktor. Du læser screenshots af video-transskriptioner og returnerer struktureret JSON.
Returner ALTID gyldig JSON i dette format:
{
  "navn": "personens navn hvis nævnt",
  "dato": "${new Date().toISOString().split('T')[0]}",
  "alder": 64,
  "videoLængde": "~1:30",
  "hudbekymring": "rynker, tør hud",
  "transkription": "den fulde tekst",
  "temaer": ["tema1", "tema2"]
}
Temaer: Brug ALTID eksisterende temaer når de passer. Her er listen: rynker, fugt, glød, blød hud, fasthed, pigment, rosacea, poser under øjne, mørke rande, skeptiker, afhængig, genbestilling, anbefaling, overgangsalder, følelsesmæssig forandring, resultat, barriere, tør hud, sensitiv, rødme, anti-aging, enkelhed, prøvet alt. VIGTIGT: "prøvet alt" bruges når kunden fortæller at de har prøvet mange/andre produkter uden virkning, og at dette endelig virker. KUN hvis indholdet tydeligt handler om noget INGEN af disse dækker, må du oprette ét nyt kort tema (2-3 ord, dansk, lowercase). Opret IKKE nye temaer der overlapper med eksisterende.
Hvis alder ikke nævnes, sæt null. Hvis dato ikke fremgår, brug dags dato.`;
      userPrompt = 'Læs denne video-transskription og returner data som JSON:';

    } else if (type === 'meta') {
      systemPrompt = `Du er en data-ekstraktor. Du læser screenshots af Facebook/Instagram kommentarer og returnerer struktureret JSON.
Returner ALTID gyldig JSON i dette format:
{
  "navn": "personens navn",
  "dato": "${new Date().toISOString().split('T')[0]}",
  "alder": null,
  "tekst": "kommentarteksten",
  "kilde": "facebook",
  "sentiment": "positiv",
  "temaer": ["tema1", "tema2"]
}
Kilde skal være: facebook, instagram, eller messenger
Sentiment skal være: positiv, neutral, eller negativ
Hvis alder nævnes i teksten, ekstraher den som tal. Ellers null.
Hvis dato fremgår af screenshottet (fx "2 dage siden"), beregn faktisk dato. Ellers brug dags dato.
Temaer: Brug ALTID eksisterende temaer når de passer. Her er listen: rynker, fugt, glød, blød hud, fasthed, pigment, rosacea, poser under øjne, mørke rande, skeptiker, afhængig, genbestilling, anbefaling, overgangsalder, følelsesmæssig forandring, resultat, barriere, tør hud, sensitiv, rødme, anti-aging, enkelhed, prøvet alt, spørgsmål, pris, levering, kritik, ros. KUN hvis indholdet tydeligt handler om noget INGEN af disse dækker, må du oprette ét nyt kort tema (2-3 ord, dansk, lowercase). Opret IKKE nye temaer der overlapper med eksisterende.`;
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
// TEXT EXTRACTION (Claude text analysis for .txt/.md uploads)
// ============================================================
app.post('/api/extract-from-text', async (req, res) => {
  try {
    const { text, type, filename } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const temaList = 'rynker, fugt, glød, blød hud, fasthed, pigment, rosacea, poser under øjne, mørke rande, skeptiker, afhængig, genbestilling, anbefaling, overgangsalder, følelsesmæssig forandring, resultat, barriere, tør hud, sensitiv, rødme, anti-aging, enkelhed, prøvet alt';

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'tp') {
      systemPrompt = `Du er en data-ekstraktor. Du læser Trustpilot anmeldelser (tekst) og returnerer struktureret JSON.
Returner ALTID gyldig JSON: {"navn":"","dato":"YYYY-MM-DD","alder":null,"rating":5,"tekst":"","temaer":[],"awareness":"product_aware"}
Temaer: ${temaList}. "prøvet alt" bruges når kunden har prøvet mange andre produkter uden virkning.
Awareness: problem_aware, solution_aware, product_aware, most_aware
Hvis alder nævnes i teksten (fx "jeg er 58 år"), ekstraher den. Ellers null.
Hvis datoen er relativ (fx "for 3 dage siden"), beregn faktisk dato.`;
      userPrompt = 'Analysér denne Trustpilot anmeldelse og returner JSON:\n\n' + text;

    } else if (type === 'vid') {
      systemPrompt = `Du er en data-ekstraktor. Du analyserer video-transskriptioner og returnerer struktureret JSON.
Returner ALTID gyldig JSON: {"navn":"","dato":"YYYY-MM-DD","alder":null,"videoLængde":"","hudbekymring":"","transkription":"","temaer":[]}
Temaer: ${temaList}. "prøvet alt" bruges når kunden har prøvet mange andre produkter uden virkning.
Hvis alder/navn nævnes i teksten, ekstraher dem. Ellers brug filnavnet som hint for navn.
For dato: brug dags dato hvis ikke angivet.
For videoLængde: se efter timestamps i teksten for at beregne længden.
For hudbekymring: ekstraher de specifikke hudproblemer kunden nævner.
Transkription: den rene danske tekst UDEN timestamps og UDEN engelsk oversættelse.`;
      userPrompt = (filename ? 'Filnavn: ' + filename + '\n\n' : '') + 'Analysér denne video-transskription og returner JSON:\n\n' + text;

    } else if (type === 'meta') {
      systemPrompt = `Du er en data-ekstraktor. Du analyserer sociale medier kommentarer og returnerer struktureret JSON.
Returner ALTID gyldig JSON: {"navn":"","dato":"YYYY-MM-DD","alder":null,"tekst":"","kilde":"facebook","sentiment":"positiv","temaer":[]}
Temaer: ${temaList}, spørgsmål, pris, levering, kritik, ros. "prøvet alt" bruges når kunden har prøvet mange andre produkter.
Kilde: facebook, instagram, messenger. Sentiment: positiv, neutral, negativ.
Hvis alder nævnes i teksten, ekstraher den. Ellers null.
For dato: brug dags dato hvis ikke angivet i teksten.`;
      userPrompt = 'Analysér denne kommentar og returner JSON:\n\n' + text;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(400).json({ error: 'Could not extract data from text' });

    res.json(JSON.parse(jsonMatch[0]));

  } catch (err) {
    console.error('Text extraction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DOCS API (for Claude Projects + external access)
// ============================================================
const DOCS_DIR = path.join(__dirname, 'docs');

app.get('/api/docs', (req, res) => {
  if (!fs.existsSync(DOCS_DIR)) return res.json({ docs: [] });
  const files = fs.readdirSync(DOCS_DIR).filter(f => !f.startsWith('.'));
  const docs = files.map(f => {
    const stat = fs.statSync(path.join(DOCS_DIR, f));
    return { filename: f, size: stat.size, modified: stat.mtime.toISOString() };
  });
  res.json({ docs, total: docs.length });
});

app.get('/api/docs/:filename', (req, res) => {
  const filepath = path.join(DOCS_DIR, req.params.filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Document not found' });
  // Prevent directory traversal
  if (!filepath.startsWith(DOCS_DIR)) return res.status(403).json({ error: 'Forbidden' });
  const content = fs.readFileSync(filepath, 'utf8');
  const ext = path.extname(req.params.filename).toLowerCase();
  if (ext === '.json') {
    res.json(JSON.parse(content));
  } else {
    res.type('text/plain').send(content);
  }
});

// ============================================================
// MASTER INDEX (Claude Projects fetches this to get everything)
// ============================================================
app.get('/api/master', (req, res) => {
  const tp = loadJSON(DATA_FILES.testimonials);
  const vdo = loadJSON(DATA_FILES.videos);
  const meta = loadJSON(DATA_FILES.metacomments);
  const templates = loadTemplates();
  
  let docs = [];
  if (fs.existsSync(DOCS_DIR)) {
    docs = fs.readdirSync(DOCS_DIR)
      .filter(f => !f.startsWith('.'))
      .map(f => ({ filename: f, url: `/api/docs/${f}` }));
  }

  res.json({
    updated: new Date().toISOString(),
    counts: {
      testimonials: tp.length,
      videos: vdo.length,
      metacomments: meta.length,
      templates: templates.length,
      docs: docs.length
    },
    endpoints: {
      testimonials: '/api/testimonials',
      videos: '/api/videos',
      metacomments: '/api/metacomments',
      templates: '/api/templates',
      docs: '/api/docs',
      search: '/api/search?q=keyword',
      temaer: '/api/temaer',
      stats: '/api/stats'
    },
    docs
  });
});

// ============================================================
// SEARCH API ENDPOINT
// ============================================================

// ============================================================
// Concept/synonym map for smart search (Danish)
// ============================================================
const CONCEPT_MAP = {
  'økonomi': ['penge', 'sparer', 'spar', 'spare', 'pris', 'prisen', 'billig', 'billigere', 'dyr', 'dyrt', 'koster', 'koste', 'investering', 'budget', 'råd til', 'pengene værd', 'økonomisk', 'erstattet', 'erstatter', 'erstatning', 'ét produkt', 'et produkt', 'kun én', 'kun en', 'slipper for', 'tre cremer', 'flere produkter', 'mange produkter', 'behøver ikke', 'undvære'],
  'penge': ['sparer', 'spar', 'spare', 'pris', 'prisen', 'billig', 'dyr', 'koster', 'budget', 'økonomi', 'økonomisk', 'pengene værd', 'råd til', 'erstattet', 'erstatter', 'erstatning'],
  'overgangsalder': ['menopause', 'klimakteriet', 'hedeture', 'hormoner', 'hormon', 'østrogen'],
  'alder': ['år', 'årene', 'alderen', 'ældre', 'aldring', 'aldersforandring', 'moden', 'modne'],
  'rynker': ['linjer', 'furer', 'fine linjer', 'rynke', 'rynkerne', 'panderynker', 'øjenrynker', 'kragetæer'],
  'tør hud': ['tørhed', 'tør', 'tørre', 'skæl', 'skaller', 'flager', 'plamager', 'sprukken', 'fugtig', 'fugt'],
  'fugt': ['fugtig', 'fugtighed', 'hydrering', 'hydreret', 'tør', 'tørhed', 'fugter'],
  'sensitiv': ['følsom', 'irriteret', 'irritation', 'reaktion', 'reagerer', 'overfølsom', 'ømfindtlig', 'sensitiv hud'],
  'rødme': ['rød', 'røde', 'rosacea', 'irriteret', 'betændelse', 'pletter'],
  'resultat': ['virker', 'virkning', 'effekt', 'forskel', 'forbedring', 'forandring', 'resultat', 'hjælper', 'hjulpet', 'gavner'],
  'skeptiker': ['skeptisk', 'tvivl', 'tvivlede', 'troede ikke', 'tiltro', 'ikke tro', 'overrasket', 'overraskende'],
  'anbefaling': ['anbefaler', 'anbefale', 'foreslår', 'prøv', 'køb', 'bestil', 'veninder', 'veninde', 'familie', 'datter', 'mor', 'søster'],
  'prøvet alt': ['prøvet mange', 'prøvet alt muligt', 'andre cremer', 'andre produkter', 'ingenting hjulpet', 'intet virker', 'intet har virket', 'prøvet samtlige', 'prøvet alverdens'],
  'hurtig': ['hurtigt', 'få dage', 'få uger', 'med det samme', 'straks', 'allerede', 'kort tid', 'første gang'],
  'glød': ['glow', 'stråler', 'stråle', 'lysende', 'frisk', 'friskhed', 'udstråling'],
  'fasthed': ['fast', 'stram', 'stramhed', 'strammere', 'elastisk', 'elasticitet', 'løs hud', 'slap'],
  'enkelhed': ['enkel', 'simpel', 'simpelt', 'nemt', 'let', 'ukompliceret', 'en creme', 'ét produkt', 'et produkt', 'rutine', 'erstattet', 'erstatter', 'bare et', 'kun én', 'slipper for', 'behøver ikke'],
  'pigment': ['pigmentering', 'pigmentpletter', 'mørke pletter', 'solskader', 'alders pletter', 'misfarvning'],
  'søvn': ['sover', 'nat', 'natcreme', 'nattevågen', 'søvnløs'],
  'selvtillid': ['selvværd', 'tryg', 'selvsikker', 'glad', 'tilfreds', 'stolt', 'spejl', 'spejlet', 'tør gå ud'],
  'mand': ['mænd', 'kæreste', 'manden', 'ham', 'hans', 'mandlig'],
  'gave': ['julegave', 'fødselsdagsgave', 'gaveide', 'overraskelse'],
  'genbestilling': ['bestilt igen', 'købt igen', 'genbestilt', 'anden gang', 'tredje gang', 'fjerde', 'abonnement'],
};

// Expand a query into multiple search terms using concept map
function expandQuery(q) {
  const lower = q.toLowerCase().trim();
  const terms = [lower];
  
  // Direct concept match
  if (CONCEPT_MAP[lower]) {
    terms.push(...CONCEPT_MAP[lower]);
  }
  
  // Also check if query is a synonym that maps to a concept
  for (const [concept, synonyms] of Object.entries(CONCEPT_MAP)) {
    if (synonyms.includes(lower) && !terms.includes(concept)) {
      terms.push(concept);
      // Also add sibling synonyms
      synonyms.forEach(s => { if (!terms.includes(s)) terms.push(s); });
    }
  }
  
  return [...new Set(terms)];
}

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const source = (req.query.source || 'all').toLowerCase();
  const tema = (req.query.tema || '').toLowerCase().trim();
  const mode = (req.query.mode || 'exact').toLowerCase();
  
  if (!q && !tema) {
    return res.json({ results: [], total: 0 });
  }
  
  // Expand query using concept map only in concept mode
  const searchTerms = q ? (mode === 'concept' ? expandQuery(q) : [q]) : [];
  const isExpanded = searchTerms.length > 1;
  
  const results = [];
  
  function matches(item, textFields) {
    let matchesQuery = !q;
    let matchesTema = !tema;
    
    if (q && searchTerms.length > 0) {
      // Check all expanded terms against text fields
      for (const term of searchTerms) {
        for (const field of textFields) {
          if (item[field] && item[field].toLowerCase().includes(term)) { matchesQuery = true; break; }
        }
        if (matchesQuery) break;
        if (!matchesQuery && item.temaer) {
          matchesQuery = item.temaer.some(t => t.toLowerCase().includes(term));
        }
        if (!matchesQuery && item.navn && item.navn.toLowerCase().includes(term)) {
          matchesQuery = true;
        }
        if (matchesQuery) break;
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
  
  res.json({ results, total: results.length, query: q, source, tema, expanded: isExpanded ? searchTerms : null });
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
// CONCEPT SEARCH (Claude-powered semantic search)
// ============================================================
app.get('/api/search-concept', async (req, res) => {
  const q = (req.query.q || '').trim();
  const source = (req.query.source || 'all').toLowerCase();
  
  if (!q) return res.json({ results: [], total: 0 });
  
  try {
    // Load all entries
    const allEntries = [];
    
    if (source === 'all' || source === 'tp') {
      const tp = loadJSON(DATA_FILES.testimonials);
      tp.forEach(item => allEntries.push({
        id: item.id, src: 'tp', srcLabel: 'Trustpilot',
        navn: item.navn || '', tekst: item.tekst || '',
        temaer: item.temaer || [], dato: item.dato || '',
        alder: item.alder, rating: item.rating,
        hudbekymring: item.hudbekymring || '',
        awareness: item.awareness, _full: item
      }));
    }
    
    if (source === 'all' || source === 'vdo') {
      const vdo = loadJSON(DATA_FILES.videos);
      vdo.forEach(item => allEntries.push({
        id: item.id, src: 'vdo', srcLabel: 'Video',
        navn: item.navn || '', tekst: item.transkription || '',
        temaer: item.temaer || [], dato: item.dato || '',
        alder: item.alder, hudbekymring: item.hudbekymring || '',
        _full: item
      }));
    }
    
    if (source === 'all' || source === 'meta') {
      const meta = loadJSON(DATA_FILES.metacomments);
      meta.forEach(item => allEntries.push({
        id: item.id, src: 'meta', srcLabel: 'Meta',
        navn: item.navn || '', tekst: item.tekst || '',
        temaer: item.temaer || [], dato: item.dato || '',
        alder: item.alder, hudbekymring: item.hudbekymring || '',
        _full: item
      }));
    }
    
    // Build detailed compact list for Claude — include ALL structured data
    const compactList = allEntries.map((e, idx) => {
      const parts = [`[${idx}] ${e.src.toUpperCase()}`];
      parts.push(e.navn || 'Anonym');
      if (e.alder) parts.push('Alder: ' + e.alder);
      if (e.hudbekymring) parts.push('Hudbekymring: ' + e.hudbekymring);
      if (e.rating) parts.push('Rating: ' + e.rating + '/5');
      if (e.awareness) parts.push('Stage: ' + e.awareness);
      if (e.temaer && e.temaer.length) parts.push('Temaer: ' + e.temaer.join(', '));
      // Use more text — 400 chars gives much better context
      const shortText = e.tekst.substring(0, 400).replace(/\n/g, ' ');
      parts.push('Tekst: "' + shortText + (e.tekst.length > 400 ? '...' : '') + '"');
      return parts.join(' | ');
    }).join('\n');
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `Du er en intelligent søgemaskine for en testimonial-database. Du forstår naturligt sprog og finder de rigtige testimonials.

OPGAVE: Analysér brugerens søgeforespørgsel og find testimonials der matcher. Forespørgslen kan være:
- Enkelt tema: "rynker", "fugt", "overgangsalder"
- Demografisk: "kvinder over 60", "unge kvinder"
- Kombineret: "kvinder over 60 med rynker", "skeptikere der blev overbevist"
- Vinkel/narrativ: "testimonials om at spare penge på hudpleje", "folk der har prøvet alt andet"
- Emotionelt: "testimonials om selvtillid", "folk der er blevet glade"

REGLER:
- Find ALT der er relevant — hellere for mange end for få
- Brug ALLE informationer: tekst, temaer, alder, hudbekymring, awareness stage
- Alder-filtre: "over 60" = alder >= 60. Hvis alder ikke er angivet men teksten nævner alder/pension/menopause, inkluder den
- Tema-filtre: Match mod temaer OG indhold i teksten
- Returnér op til 30 resultater sorteret efter relevans (mest relevant først)
- Returnér tom array [] KUN hvis absolut intet matcher

Returner JSON array med index-numre: [3, 17, 42]
KUN JSON, intet andet.`,
      messages: [{
        role: 'user',
        content: `Søgeforespørgsel: "${q}"\n\nTestimonials (${allEntries.length} stk):\n${compactList}`
      }]
    });
    
    // Parse Claude's response
    const responseText = response.content[0].text.trim();
    let matchedIndices = [];
    try {
      matchedIndices = JSON.parse(responseText);
      if (!Array.isArray(matchedIndices)) matchedIndices = [];
    } catch (parseErr) {
      const arrayMatch = responseText.match(/\[[\d,\s]*\]/);
      if (arrayMatch) {
        matchedIndices = JSON.parse(arrayMatch[0]);
      }
    }
    
    // Build results from matched indices
    const results = matchedIndices
      .filter(idx => idx >= 0 && idx < allEntries.length)
      .map(idx => {
        const entry = allEntries[idx];
        const fullItem = entry._full;
        return {
          ...fullItem,
          _source: entry.src,
          _sourceLabel: entry.srcLabel,
          _preview: entry.tekst.substring(0, 200)
        };
      });
    
    res.json({
      results,
      total: results.length,
      query: q,
      source,
      conceptSearch: true,
      matchedCount: matchedIndices.length,
      totalSearched: allEntries.length
    });
    
  } catch (e) {
    console.error('Concept search error:', e);
    res.status(500).json({ error: 'Concept search failed: ' + e.message });
  }
});

// ============================================================
// TEMPLATE CONFIG — Character limits per Orshot template field
// ============================================================
const TEMPLATE_CONFIG_PATH = path.join(__dirname, 'data', 'template-configs.json');

function loadTemplateConfigs() {
  if (fs.existsSync(TEMPLATE_CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(TEMPLATE_CONFIG_PATH, 'utf8')); } catch (e) {}
  }
  return {};
}

function saveTemplateConfigs(configs) {
  fs.writeFileSync(TEMPLATE_CONFIG_PATH, JSON.stringify(configs, null, 2));
}

// GET all template configs
app.get('/api/template-configs', (req, res) => {
  res.json(loadTemplateConfigs());
});

// GET single template config
app.get('/api/template-configs/:id', (req, res) => {
  const configs = loadTemplateConfigs();
  const config = configs[req.params.id];
  if (!config) return res.json({ fields: {}, note: 'No config for this template — using defaults' });
  res.json(config);
});

// PUT/create template config (for when Upwork freelancer data comes in)
app.put('/api/template-configs/:id', (req, res) => {
  const configs = loadTemplateConfigs();
  configs[req.params.id] = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  saveTemplateConfigs(configs);
  res.json({ success: true, config: configs[req.params.id] });
});

// ============================================================
// ORSHOT IMAGE GENERATION API
// ============================================================
const ORSHOT_BASE = 'https://api.orshot.com/v1';

// Read key at request time (Railway may inject late) + config file fallback
function getOrshotKey() {
  if (process.env.ORSHOT_API_KEY) return process.env.ORSHOT_API_KEY;
  // Fallback: read from config file on volume
  const configPath = path.join(__dirname, 'data', 'orshot-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.apiKey || '';
    }
  } catch (e) {}
  return '';
}

// Set Orshot API key via config file (backup for when Railway env vars don't work)
app.post('/api/orshot/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'apiKey required' });
  const configPath = path.join(__dirname, 'data', 'orshot-config.json');
  fs.writeFileSync(configPath, JSON.stringify({ apiKey }, null, 2));
  res.json({ success: true, keyLength: apiKey.length, keyPrefix: apiKey.substring(0, 5) });
});

// Debug: check if env var is loaded
app.get('/api/orshot/debug', (req, res) => {
  const key = getOrshotKey();
  res.json({
    keySet: !!key,
    keyLength: key.length,
    keyPrefix: key.substring(0, 5),
    source: process.env.ORSHOT_API_KEY ? 'env' : (key ? 'config-file' : 'none'),
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('ORSHOT') || k.includes('API'))
  });
});

// List all studio templates (try multiple endpoints)
app.get('/api/orshot/templates', async (req, res) => {
  try {
    const ORSHOT_API_KEY = getOrshotKey();
    if (!ORSHOT_API_KEY) return res.status(500).json({ error: 'ORSHOT_API_KEY not configured' });
    
    const endpoints = [
      `${ORSHOT_BASE}/studio/templates/all`,
      `${ORSHOT_BASE}/studio/templates`
    ];
    
    for (const url of endpoints) {
      try {
        console.log(`  Orshot: trying ${url}`);
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${ORSHOT_API_KEY}` }
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`  Orshot: ${url} returned OK`);
          return res.json(data);
        }
        console.log(`  Orshot: ${url} returned ${response.status}`);
      } catch (e) {
        console.log(`  Orshot: ${url} failed: ${e.message}`);
      }
    }
    
    res.json({ data: [], error: 'Could not list templates from Orshot API' });
  } catch (err) {
    console.error('Orshot list templates error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single template details (includes modifications/parameters)
app.get('/api/orshot/templates/:id', async (req, res) => {
  try {
    const ORSHOT_API_KEY = getOrshotKey();
    if (!ORSHOT_API_KEY) return res.status(500).json({ error: 'ORSHOT_API_KEY not configured' });
    const response = await fetch(`${ORSHOT_BASE}/studio/templates/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${ORSHOT_API_KEY}` }
    });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Orshot API: ${response.status}`, detail: text.substring(0, 200) });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Orshot get template error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Render image from studio template
app.post('/api/orshot/render', async (req, res) => {
  try {
    const ORSHOT_API_KEY = getOrshotKey();
    if (!ORSHOT_API_KEY) return res.status(500).json({ error: 'ORSHOT_API_KEY not configured' });
    const { templateId, modifications } = req.body;
    if (!templateId) return res.status(400).json({ error: 'templateId required' });

    console.log(`  Orshot render: template=${templateId}, mods=${JSON.stringify(modifications).substring(0, 200)}`);

    const response = await fetch(`${ORSHOT_BASE}/studio/render`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ORSHOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId: parseInt(templateId) || templateId,
        modifications: modifications || {},
        response: {
          type: 'url',
          format: 'png',
          scale: 1
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Orshot render API error:', response.status, text.substring(0, 300));
      return res.status(response.status).json({ error: `Orshot render: ${response.status}`, detail: text.substring(0, 300) });
    }

    const data = await response.json();
    console.log(`  Orshot render result: ${data.data?.content ? 'SUCCESS' : 'FAILED'} (${data.data?.responseTime || '?'}ms)`);
    res.json(data);
  } catch (err) {
    console.error('Orshot render error:', err);
    res.status(500).json({ error: err.message });
  }
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

// ============================================================
// CHAT — Interactive Claude conversation with KJELDGAARD context
// ============================================================

function loadDoc(filename) {
  const filepath = path.join(DOCS_DIR, filename);
  if (!fs.existsSync(filepath)) return '';
  return fs.readFileSync(filepath, 'utf8');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, selectedIds, history, templateInfo } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    // Build testimonial context if any selected
    let testimonialsContext = '';
    if (selectedIds && selectedIds.length > 0) {
      const tp = loadJSON(DATA_FILES.testimonials);
      const vdo = loadJSON(DATA_FILES.videos);
      const meta = loadJSON(DATA_FILES.metacomments);
      const allItems = [
        ...tp.map(t => ({ ...t, _source: 'tp' })),
        ...vdo.map(v => ({ ...v, _source: 'vdo' })),
        ...meta.map(m => ({ ...m, _source: 'meta' }))
      ];
      const selected = allItems.filter(item => selectedIds.includes(item._source + '-' + item.id));
      if (selected.length > 0) {
        testimonialsContext = '\n\n=== VALGTE KUNDECITATER (' + selected.length + ' stk) ===\n' +
          selected.map(t => {
            const src = t._source === 'tp' ? 'Trustpilot' : t._source === 'vdo' ? 'Video' : 'Meta';
            const text = t.tekst || t.transkription || '';
            return '[' + src + '] ' + (t.navn || 'Anonym') + ':\n"' + text + '"';
          }).join('\n\n');
      }
    }

    // Template context
    let templateContext = '';
    if (templateInfo) {
      templateContext = '\n\n=== VALGT TEMPLATE ===\nTemplate: ' + (templateInfo.name || templateInfo.id) + 
        (templateInfo.dims ? ' (' + templateInfo.dims + ')' : '') +
        '\nTemplate ID: ' + templateInfo.id;
      
      if (templateInfo.fields && templateInfo.fields.length > 0) {
        const textFields = templateInfo.fields.filter(f => f.type !== 'image');
        if (textFields.length > 0) {
          templateContext += '\n\nDYNAMISKE TEKSTFELTER I TEMPLATE:';
          textFields.forEach(f => {
            templateContext += '\n- "' + f.key + '": maks ' + f.maxChars + ' tegn';
          });
          
          if (templateInfo.charLimitsEnabled) {
            templateContext += '\n\n⚠️ TEGNGRÆNSER ER AKTIVERET: Når du genererer tekst til dette template, SKAL hver tekst overholde feltets tegngrænse. Angiv altid antal tegn brugt.';
          } else {
            templateContext += '\n\n(Tegngrænser er DEAKTIVERET — brugeren ønsker frit tekstformat uden begrænsning)';
          }
        }
      }
    }

    // Load core docs for context (abbreviated to fit in context window)
    const doRegler = loadDoc('SWIPE_KJELDGAARD_DO_txt_UPDATED.txt');
    const dontRegler = loadDoc('SWIPE_KJELDGAARD_DON_T_UPDATED.txt');
    const ordbank = loadDoc('ORDBANK_VOICE_OF_CUSTOMER_v4.txt');
    const efficacy = loadDoc('FACTS_KJELDGAARD_EFFICACY_FINAL_v10.txt');
    const hooks = loadDoc('SWIPE_KJELDGAARD_HOOKS_BEST.txt');
    const benefits = loadDoc('SWIPE_KJELDGAARD_BENEFITS_BEST.txt');
    const benson = loadDoc('jon-benson-copychief-master-system_v3.md');

    const systemPrompt = `Du er KJELDGAARD's kreative AI-assistent integreret i Ad Factory.
Du hjælper med at skabe ads, copy, headlines og kreativt indhold til KJELDGAARD Barrier Defense Serum.
Du skriver på dansk til danske kvinder 40-65 med mindre du bliver bedt om andet.
Du har adgang til kundens egne ord og testimonials.
Du scorer output med Benson 12-factor systemet når relevant.

BRAND: KJELDGAARD — dansk premium skincare. Hero product: Barrier Defense Serum.
Klinisk testet: 27% reduktion af fine linjer, 100% forbedring, 0% bivirkninger.
14.000+ kunder, 4.7/5 Trustpilot, ~70 ordrer/dag.

=== DO REGLER ===
${doRegler.substring(0, 3000)}

=== DON'T REGLER ===
${dontRegler.substring(0, 2000)}

=== ORDBANK (Kundesprog) ===
${ordbank.substring(0, 4000)}

=== HOOKS EKSEMPLER ===
${hooks.substring(0, 2000)}

=== BENEFITS EKSEMPLER ===
${benefits.substring(0, 2000)}

=== EFFICACY FACTS ===
${efficacy.substring(0, 2000)}

=== BENSON SCORING (kort) ===
${benson.substring(0, 3000)}
${testimonialsContext}${templateContext}

Svar klart og direkte. Når du genererer copy/tekst, giv det som færdige varianter der kan bruges med det samme.
Brug kundeord fra testimonials når de er tilgængelige.`;

    // Build messages array with history
    const messages = [];
    if (history && history.length > 0) {
      for (const msg of history.slice(-10)) {  // Keep last 10 messages
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: message });

    console.log(`  Chat: msg="${message.substring(0, 80)}...", selected=${selectedIds?.length || 0}, history=${history?.length || 0}`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages,
      system: systemPrompt
    });

    const responseText = response.content[0].text;
    res.json({ response: responseText });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GENERATE CONTENT FROM SELECTED TESTIMONIALS
// ============================================================

const GENERATION_TYPES = {
  headlines: {
    label: 'Meta Headlines / Hooks',
    docs: ['SWIPE_KJELDGAARD_HOOKS_BEST.txt', 'SWIPE_KJELDGAARD_DO_txt_UPDATED.txt', 'SWIPE_KJELDGAARD_DON_T_UPDATED.txt', 'ORDBANK_VOICE_OF_CUSTOMER_v4.txt'],
    instruction: `Skriv {{count}} Meta ad headlines (hooks) til KJELDGAARD Barrier Defense Serum.
Brug sprog og vendinger fra de valgte kundecitater herunder.
Følg DO/DON'T reglerne nøje. Brug HOOKS_BEST som kvalitetseksempler.
Hvert headline skal scores med Benson 12-factor systemet og have minimum {{minScore}}/10.`
  },
  benefits: {
    label: 'Benefit Statements',
    docs: ['SWIPE_KJELDGAARD_BENEFITS_BEST.txt', 'SWIPE_KJELDGAARD_DO_txt_UPDATED.txt', 'SWIPE_KJELDGAARD_DON_T_UPDATED.txt', 'ORDBANK_VOICE_OF_CUSTOMER_v4.txt'],
    instruction: `Skriv {{count}} benefit statements til KJELDGAARD Barrier Defense Serum.
Brug sprog og vendinger fra de valgte kundecitater herunder.
Følg DO/DON'T reglerne nøje. Brug BENEFITS_BEST som kvalitetseksempler.
Hvert statement skal scores med Benson 12-factor systemet og have minimum {{minScore}}/10.`
  },
  adcopy: {
    label: 'Meta Ad Copy (komplet)',
    docs: ['SWIPE_KJELDGAARD_HOOKS_BEST.txt', 'SWIPE_KJELDGAARD_BENEFITS_BEST.txt', 'SWIPE_KJELDGAARD_MECHANISMS_BEST.txt', 'SWIPE_KJELDGAARD_CTA_SOCIALPROOF_BEST.txt', 'SWIPE_KJELDGAARD_INTEREST_PROBLEM_DESIRE_BEST.txt', 'SWIPE_KJELDGAARD_DO_txt_UPDATED.txt', 'SWIPE_KJELDGAARD_DON_T_UPDATED.txt', 'ORDBANK_VOICE_OF_CUSTOMER_v4.txt', 'FACTS_KJELDGAARD_EFFICACY_FINAL_v10.txt'],
    instruction: `Skriv {{count}} komplette Meta ad copy varianter til KJELDGAARD Barrier Defense Serum.
Hver variant skal have: Hook → Problem/Interest → Mechanism → Benefit → Social Proof → CTA.
Brug sprog og vendinger fra de valgte kundecitater herunder.
Følg DO/DON'T reglerne nøje. Brug SWIPE-filerne som kvalitetseksempler.
Hver ad copy skal scores med Benson 12-factor systemet og have minimum {{minScore}}/10.`
  },
  custom: {
    label: 'Frit prompt',
    docs: ['SWIPE_KJELDGAARD_DO_txt_UPDATED.txt', 'SWIPE_KJELDGAARD_DON_T_UPDATED.txt', 'ORDBANK_VOICE_OF_CUSTOMER_v4.txt', 'FACTS_KJELDGAARD_EFFICACY_FINAL_v10.txt'],
    instruction: `{{customPrompt}}`
  },
  template_ad: {
    label: 'Ad-tekst til template',
    docs: ['SWIPE_KJELDGAARD_HOOKS_BEST.txt', 'SWIPE_KJELDGAARD_BENEFITS_BEST.txt', 'SWIPE_KJELDGAARD_DO_txt_UPDATED.txt', 'SWIPE_KJELDGAARD_DON_T_UPDATED.txt', 'ORDBANK_VOICE_OF_CUSTOMER_v4.txt'],
    instruction: `Du skal generere tekst til et ad-billede (Orshot template) for KJELDGAARD Barrier Defense Serum.

VIGTIGT: Du har strenge tegngrænser per felt. Teksten SKAL passe inden for disse grænser.

{{fieldLimits}}

OPGAVE:
- Kondensér de valgte kundecitater til den stærkeste, mest overbevisende version for hvert felt
- Bevar kundens egne ord og vendinger så meget som muligt
- Hvert felt SKAL overholde sin tegngrænse — tæl tegnene nøje
- "anmeldelse"/"review" feltet skal lyde som en ægte kunde, ikke som markedsføring
- "navn"/"name" feltet er kundens navn — brug det direkte
- "ratingtext" er typisk "X/5 Stars" eller lignende

Returner PRÆCIS ét JSON objekt (ikke array) med felt-navne som keys og den optimerede tekst som values.
Tilføj også en _meta key med scoring info.

Eksempel format:
{
  "anmeldelse": "Min hud har aldrig følt sig så blød og beskyttet...",
  "navn": "Gitte M.",
  "ratingtext": "5/5 Stars",
  "_meta": {
    "score": 9.2,
    "scoring_notes": "Stærkt customer language, autentisk tone",
    "chars_used": { "anmeldelse": 145, "navn": 9, "ratingtext": 11 }
  }
}`
  }
};

app.post('/api/generate', async (req, res) => {
  try {
    const { type, count = 3, minScore = 9.0, customPrompt, selectedIds, fieldLimits } = req.body;
    
    if (!type || !GENERATION_TYPES[type]) {
      return res.status(400).json({ error: 'Invalid type. Options: ' + Object.keys(GENERATION_TYPES).join(', ') });
    }
    if (!selectedIds || !selectedIds.length) {
      return res.status(400).json({ error: 'No testimonials selected' });
    }

    const config = GENERATION_TYPES[type];
    
    // Load selected testimonials from all sources
    const tp = loadJSON(DATA_FILES.testimonials);
    const vdo = loadJSON(DATA_FILES.videos);
    const meta = loadJSON(DATA_FILES.metacomments);
    
    const allItems = [
      ...tp.map(t => ({ ...t, _source: 'tp' })),
      ...vdo.map(v => ({ ...v, _source: 'vdo' })),
      ...meta.map(m => ({ ...m, _source: 'meta' }))
    ];
    
    const selected = allItems.filter(item => {
      const itemId = item._source + '-' + item.id;
      return selectedIds.includes(itemId);
    });
    
    if (!selected.length) {
      return res.status(400).json({ error: 'No matching testimonials found for given IDs' });
    }

    // Load docs
    const docsContent = config.docs.map(f => {
      const content = loadDoc(f);
      return content ? `\n=== ${f} ===\n${content}` : '';
    }).filter(Boolean).join('\n');

    // Always load Benson scoring
    const benson = loadDoc('jon-benson-copychief-master-system_v3.md');

    // Build testimonials context
    const testimonialsText = selected.map(t => {
      const src = t._source === 'tp' ? 'Trustpilot' : t._source === 'vdo' ? 'Video' : 'Meta';
      const text = t.tekst || t.transkription || '';
      const temaer = (t.temaer || []).join(', ');
      return `[${src}] ${t.navn || 'Anonym'}${temaer ? ` (${temaer})` : ''}:\n"${text}"`;
    }).join('\n\n');

    // Build field limits string for template_ad type
    let fieldLimitsStr = '';
    if (type === 'template_ad' && fieldLimits) {
      fieldLimitsStr = 'TEGNGRÆNSER PER FELT:\n' + 
        Object.entries(fieldLimits)
          .map(([key, max]) => `- "${key}": maks ${max} tegn`)
          .join('\n');
    }

    // Build instruction
    let instruction = config.instruction
      .replace('{{count}}', count)
      .replace('{{minScore}}', minScore)
      .replace('{{customPrompt}}', customPrompt || '')
      .replace('{{fieldLimits}}', fieldLimitsStr);

    const systemPrompt = `Du er KJELDGAARD's senior copywriter. Du skriver på dansk til danske kvinder 40-65.
Du scorer ALT output med Benson 12-factor systemet. Minimum score: ${minScore}/10.
Brug kundens eget sprog (customer language) fra de valgte testimonials.
Overhold ALTID DO/DON'T reglerne.

${benson ? '=== BENSON SCORING SYSTEM ===\n' + benson.substring(0, 8000) : ''}

${docsContent}`;

    let userPrompt;
    if (type === 'template_ad') {
      userPrompt = `${instruction}

=== VALGTE KUNDECITATER (${selected.length} stk) ===
${testimonialsText}

Returner KUN ét JSON objekt (IKKE array), intet andet.`;
    } else {
      userPrompt = `${instruction}

=== VALGTE KUNDECITATER (${selected.length} stk) ===
${testimonialsText}

Returner output som JSON array:
[
  {
    "text": "Den genererede tekst",
    "score": 9.2,
    "scoring_notes": "Kort begrundelse for scoren",
    "customer_words_used": ["ord1", "ord2"]
  }
]

Returner KUN JSON array, intet andet.`;
    }

    console.log(`  Generate: type=${type}, count=${count}, minScore=${minScore}, selected=${selected.length}${type === 'template_ad' ? ', fields=' + Object.keys(fieldLimits || {}).join(',') : ''}`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    });

    const responseText = response.content[0].text;
    
    // Parse response based on type
    if (type === 'template_ad') {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.json({ result: null, raw: responseText, error: 'Could not parse JSON from response' });
      }
      const result = JSON.parse(jsonMatch[0]);
      res.json({ result, type: 'template_ad' });
    } else {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return res.json({ results: [], raw: responseText, error: 'Could not parse JSON from response' });
      }
      const results = JSON.parse(jsonMatch[0]);
      res.json({ 
        results,
        meta: {
          type: config.label,
          count: results.length,
          selectedTestimonials: selected.length,
          minScore,
          averageScore: results.length ? (results.reduce((s, r) => s + (r.score || 0), 0) / results.length).toFixed(1) : 0
        }
      });
    }

  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`\n  KJELDGAARD AD FACTORY`);
  console.log(`  Running on http://localhost:${PORT}`);
  await autoDiscoverTemplates();
  console.log(`  Templates: ${loadTemplates().length}`);
  console.log(`  Testimonials: ${loadTestimonials().length}`);
  console.log(`  Orshot API: ${getOrshotKey() ? '✅ configured' : '❌ ORSHOT_API_KEY not set'}\n`);
});
