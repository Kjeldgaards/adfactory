# CLAUDE.md — Instructions for Claude when working in this repo

> **READ THIS FILE FIRST. Every chat. No exceptions.**
> This applies to both Claude on claude.ai AND Claude Code running on Thomas's Mac.
> Both have 100% the same access. Both must follow the same rules.

---

## ABSOLUTE RULES — NEVER VIOLATE

These rules exist so Claude can never accidentally destroy work. They are not suggestions.

1. **NEVER push directly without using `./scripts/push.sh`.**
   Improvised `git push` commands are banned. The script has fail-fast token validation
   and the correct auth method. Hand-rolling git push is how things break.

2. **NEVER force-push.** `git push --force`, `git push -f`, `git push --force-with-lease`
   are all banned. If a push is rejected because of conflicts, STOP and report to Thomas.
   Do not "fix" history.

3. **NEVER rebase, reset --hard, or rewrite commit history.** Once something is committed,
   it stays. The history is the record of what happened. Do not edit reality.

4. **NEVER delete files without explicit permission from Thomas in the current chat.**
   `git rm`, `rm`, and any file deletion via the editor must be confirmed first.
   If Thomas asks to "update" or "edit" a file, that's not permission to delete it.

5. **NEVER commit secrets.** No tokens, no API keys, no passwords in the repo.
   The GitHub token belongs in `~/.adfactory-token` (gitignored) or as env var, never
   in a committed file. If you spot a secret in a file you're about to commit, STOP.

6. **NEVER work on branches other than `main` without being asked.** This repo deploys
   `main` → Railway. If Thomas wants a branch, he'll say so.

7. **NEVER skip the push script's token test.** If `./scripts/push.sh` says the token
   is invalid, the answer is to ask Thomas for a new one — NOT to try a different push
   method. The token test exists because revoked tokens fail silently in other methods.

---

## How to push to GitHub (the ONLY approved method)

```bash
GITHUB_TOKEN=<token> ./scripts/push.sh "commit message"
```

The script does this automatically:
1. Validates token format (rejects malformed tokens before trying GitHub)
2. Tests token against GitHub (fails fast if revoked, with clear error)
3. Commits any unstaged changes with provided message
4. Pushes using ASKPASS auth (works in sandboxes that block @-URLs in remote URL)

Commit messages must explain **what** and **why**, not just "update". Examples:
- ✅ "Add INGREDIENT_ANALOGIES_v1.md — hverdagsanaloger til 7 ingredienser"
- ✅ "Fix typo in FACTS_KJELDGAARD_EFFICACY_v10.txt line 47"
- ❌ "Update files"
- ❌ "Changes"

---

## How to read files in this repo

For Claude on claude.ai (web/desktop): use `web_fetch` against
`https://adfactory-production.up.railway.app/api/docs/{filename}` or
`/api/{endpoint}` for live data (testimonials, videos, metacomments, customer-voice).

For Claude Code (on Thomas's Mac): files are local at the repo root. Read them
directly with the `view` / `cat` / read-file tool. The Railway API is also available
if needed, but local is faster.

**Both interfaces produce the same result.** The local file IS the file served by
Railway after push. There is no separate "Railway version" of any document.

---

## How to ADD or EDIT files (the safe workflow)

1. **Read first.** Before editing, view the current file. Confirm you understand
   what's there. Do not edit blindly.

2. **Edit second.** Make the change. Keep it minimal — change what was asked,
   leave everything else alone. (Master Instructions REGEL 11 also applies here.)

3. **Show Thomas the diff if it's significant.** For small edits this is optional.
   For new files, big rewrites, or structural changes — show what you're about to
   commit before committing.

4. **Commit and push with the script.** Always. No exceptions. See above.

5. **Verify the push.** The script prints commit SHA and confirms Railway will
   redeploy. If anything looks wrong, tell Thomas immediately — don't try to "fix"
   it with another push.

---

## Token storage

- **Claude on claude.ai:** Token is stored in Claude's memory (memory edit #4).
  If memory shows token is revoked, ask Thomas for a new one.
- **Claude Code on Mac:** Token is in `~/.adfactory-token` (the push script reads
  it from there automatically). Or set `GITHUB_TOKEN` env var per command.

If the token is ever revoked, generate a new one at:
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Scope: `repo` (full)
4. Save to `~/.adfactory-token` on the Mac, or paste to Claude on claude.ai.

---

## Repo structure

- `docs/` — Knowledge files served via Railway API at `/api/docs/{filename}`
  - Tier 1 files (FACTS, SWIPE, ORDBANK, MASTER_INSTRUCTIONS, DECISION_PRIORITY)
  - Versioned: when bumping a file, save as new version (e.g. `_v10.txt` → `_v11.txt`)
    and update the loader to point at the new version.
- `public/` — Web UI (admin.html, search.html, scripts.html, generator.html)
- `data/` — Seed JSON (live data lives on Railway volume `/app/data`)
- `scripts/push.sh` — Deployment helper. The ONLY way to push.
- `server.js` — Express server, Anthropic + Orshot integration

---

## Auto-deploy

Push to `main` → Railway auto-deploys in ~60 seconds → live at
https://adfactory-production.up.railway.app

If you push and the deploy doesn't happen within ~2 minutes, tell Thomas.
Do not re-push to "trigger" it.

---

## If something goes wrong

**Push rejected:** Tell Thomas. Do NOT force-push, do NOT rebase, do NOT reset.
The fix depends on what happened — guessing wrong here loses work.

**Token rejected (HTTP 401):** Ask Thomas for a new token. Do NOT try alternative
auth methods. The token test in push.sh is the source of truth.

**Merge conflict on pull:** Tell Thomas. Do NOT resolve conflicts blindly.
The conflict means two parallel changes happened — Thomas needs to decide which wins.

**Accidentally edited the wrong file:** STOP before committing. Revert with
`git checkout -- {file}` to undo unstaged changes. If already committed but not
pushed, tell Thomas — do NOT try to "fix" with another commit on top.

**Accidentally pushed something wrong:** Tell Thomas immediately. The fix is
usually a corrective commit, not history rewriting.

---

## Summary for Claude Code on the Mac (quick reference)

```bash
# First time setup (one time only):
cd ~/where/you/keep/projects/
git clone https://github.com/Kjeldgaards/adfactory.git
cd adfactory
echo "ghp_YourTokenHere" > ~/.adfactory-token
chmod 600 ~/.adfactory-token

# Every time you work:
cd ~/where/you/keep/projects/adfactory
git pull origin main          # sync with latest
# ... read files, edit files ...
./scripts/push.sh "what and why of this commit"
```

That's it. That's the whole workflow. If something requires going outside this,
ask Thomas first.
