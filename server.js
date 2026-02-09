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
app.use(express.json());
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

/**
 * Upload template images
 * Expects 2 or 4 files:
 * - name-1080.png (background without text, square)
 * - name-1080-ref.png (reference with text, square)
 * - name-1920.png (background without text, story) [optional]
 * - name-1920-ref.png (reference with text, story) [optional]
 */
app.post('/api/templates/upload', upload.array('files', 4), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 files: background (-1080.png) and reference (-1080-ref.png)' });
    }

    // Parse file names to determine template name and type
    const fileMap = {};
    for (const file of req.files) {
      const name = file.originalname;
      // Pattern: templatename-1080.png, templatename-1080-ref.png, templatename-1920.png, templatename-1920-ref.png
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

    // Rename files to permanent locations
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

    // Auto-analyze text regions
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

    // Save template config
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
// API: Preview (same as export but returns base64 for UI)
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
    // Render at smaller size for preview
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
// Serve frontend for all non-API routes
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// Start
// ============================================================
app.listen(PORT, () => {
  console.log(`\n  KJELDGAARD AD FACTORY`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  Templates: ${loadTemplates().length}`);
  console.log(`  Testimonials: ${loadTestimonials().length}\n`);
});
