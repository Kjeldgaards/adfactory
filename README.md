# KJELDGAARD Ad Factory v5

Testimonial ad generator. Upload Canva template backgrounds, select Trustpilot reviews, generate production-ready PNG ads.

## Quick Start

```bash
npm install
node server.js
# Open http://localhost:3000
```

## Deploy to Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Railway auto-detects the Dockerfile and deploys
4. Set PORT env variable if needed (default: 3000)

## Template Upload

Templates come from your Canva designer. For each template, export 2-4 files:

| File | Description |
|------|-------------|
| `templatename-1080.png` | Background WITHOUT text (1080×1080) |
| `templatename-1080-ref.png` | Reference WITH text (1080×1080) |
| `templatename-1920.png` | Background WITHOUT text (1080×1920) — optional |
| `templatename-1920-ref.png` | Reference WITH text (1080×1920) — optional |

The system automatically detects text positions, colors, and font sizes by comparing the two images.

### Naming Rules
- All files for the same template must share the same prefix (e.g., `luksus-testimonial`)
- Use `-1080` for square (1080×1080) and `-1920` for story (1080×1920)
- Add `-ref` suffix for the "with text" reference version

## How It Works

1. **Upload templates** — Go to Templates tab, upload background + reference PNGs
2. **Auto-detect** — System compares images to find text regions, colors, sizes
3. **Create ads** — Search testimonials, select template, edit text, set font sizes
4. **Export** — Puppeteer renders final 1080×1080 or 1080×1920 PNG

## Stack

- **Frontend:** Vanilla JS (single HTML file)
- **Backend:** Node.js + Express
- **Export:** Puppeteer (headless Chrome)
- **Analysis:** Sharp (image processing)

## Fonts

The Docker image includes standard Google Fonts. If your designer uses a custom font, add the `.ttf` or `.otf` file to `/usr/share/fonts/` in the Dockerfile and run `fc-cache -f -v`.

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/testimonials` | GET | All 161 reviews |
| `/api/templates` | GET | All uploaded templates |
| `/api/templates/upload` | POST | Upload template files (multipart) |
| `/api/templates/:id` | DELETE | Remove template |
| `/api/preview` | POST | Generate preview (returns base64) |
| `/api/export` | POST | Generate final PNG (returns file) |
