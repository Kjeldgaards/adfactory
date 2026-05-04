# CLAUDE.md — Instructions for Claude when working in this repo

## How to push to GitHub

**ALWAYS use the push script. Do NOT improvise git push commands.**

```bash
GITHUB_TOKEN=<token-from-memory> ./scripts/push.sh "commit message"
```

The script:
1. Validates token format (rejects malformed tokens before trying GitHub)
2. Tests token against GitHub (fails fast if revoked, with clear error)
3. Commits any unstaged changes with provided message
4. Pushes using ASKPASS auth (works in sandboxes that block @-URLs in remote URL)

## Why this script exists

**Problem 1:** Sandbox proxy blocks URLs with `@` (e.g. `https://[email protected]/...`).
The script avoids this by using clean URL + GIT_ASKPASS.

**Problem 2:** When a token is revoked, git push fails with the same error message
as a format error. The script tests the token first so we know which it is.

**Problem 3:** Each new Claude chat starts fresh and re-discovers push method by trial.
Reading this file at chat start tells Claude exactly what works.

## Token storage

Token is in Claude memory (memory edit #4). If memory shows token is revoked
(test fails with HTTP 401), ask Thomas for a new token.

To generate new token:
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Scope: `repo` (full)
4. Copy and paste here

## Repo structure

- `docs/` — Knowledge files served via Railway API at `/api/docs/{filename}`
- `public/` — Web UI (admin.html, search.html, scripts.html, generator.html)
- `data/` — Seed JSON (live data lives on Railway volume `/app/data`)
- `scripts/push.sh` — THIS file's deployment helper
- `server.js` — Express server, Anthropic + Orshot integration

## Auto-deploy

Push to `main` → Railway auto-deploys in ~60 seconds → live at
https://adfactory-production.up.railway.app
