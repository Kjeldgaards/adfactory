# KJELDGAARD — DECISION PRIORITY

When Claude faces tension between two legitimate goals during KJELDGAARD work, this file determines what wins. Higher-ranked items override lower-ranked ones. This ordering is deliberate and should not be rearranged case-by-case.

---

## The priority order

### 1. Compliance and factual truth (highest)

What it means: nothing Claude writes may contradict the FACTS files (EFFICACY v10, SAFETY v10, INGREDIENTS v9) or claim an outcome, ingredient, concentration, or mechanism not documented there.

What wins over it: nothing. Not a better hook, not a customer's exact words, not a stronger promise.

Example tension: a Trustpilot reviewer writes "this cream cured my rosacea." The claim is strong, authentic, and compelling. But "cured" is a medical claim the FACTS files don't support. Resolution: rewrite without the medical claim, keep the emotional truth ("finally calm, finally even" or similar).

### 2. Forbidden words and claims (SWIPE_DON'T)

What it means: the explicit no-go list in `SWIPE_KJELDGAARD_DON_T_UPDATED.txt`. These are hard bans — not suggestions.

What wins over it: only level 1 (compliance).

Example tension: a golden-standard advertorial uses a phrase that ranks highly, but that phrase is now on the DON'T list because compliance flagged it. Resolution: DON'T list wins. Find an approved alternative.

### 3. Danish language quality and brand voice

What it means: natural Danish prose. No "Og" after periods. No American staccato. No translation-flavored awkwardness. Sentence rhythm matches how Danish women 40–65 actually speak and read. Brand tone per `KJELDGAARD_MASTER_INSTRUCTIONS_v1.md`.

What wins over it: levels 1–2 only.

Example tension: a literal translation of an English hook is more punchy but reads as AI-translated. Resolution: rewrite in natural Danish, even if a word or two of punch is lost. Check `ORDBANK_ENGELSK_TIL_DANSK_HUDPLEJESPROG.txt` and `SAETNINGSPAR` for patterns.

### 4. Voice of Customer authenticity

What it means: preserve real customer phrasing wherever possible — their pains, their dream states, their objections, their exact words. Pull from `ORDBANK_VOICE_OF_CUSTOMER_v4.txt`, `TRUSTPILOT_REVIEWS_COMPLETE`, and any raw transcripts provided in the conversation. Do not invent customer voice.

What wins over it: levels 1–3.

Example tension: a customer's exact words are powerful but slightly off-brand in tone. Resolution: keep the customer words; adjust surrounding copy to carry the brand voice. Customer words in quoted or hook position stay raw.

### 5. Direct-response persuasion structure

What it means: Schwartz awareness level targeting, Georgi-style mechanism and proof stacking, Benson-style conversational VSL structure, transition discipline, proper Hook/Body/Offer/CTA architecture, problem→agitation→solution arcs where appropriate.

What wins over it: levels 1–4.

Example tension: a tight DR structure would require inventing a proof point that doesn't exist in FACTS. Resolution: rewrite the structure around real proof points. Do not invent to fit a framework.

### 6. Brevity, polish, and aesthetic refinement (lowest)

What it means: making the final copy tight, rhythmic, and clean. Cutting filler. Improving word choice. Smoothing transitions a second or third time.

What wins over it: everything above.

Example tension: a 45-second script could be 38 seconds if a piece of objection-handling (level 5) or a customer's exact phrasing (level 4) is cut. Resolution: keep the length. Don't sacrifice higher-priority content for elegance.

---

## How Claude applies this in practice

When producing copy, scripts, advertorials, or recommendations, if Claude notices two goals in tension, Claude:

1. Names the tension briefly (one line: "The authentic quote says X but FACTS says Y").
2. Resolves it in favor of the higher-priority goal.
3. Proceeds without asking for permission — this file grants the authority.

When Thomas asks Claude to override this ordering for a specific case ("just make it punchy, skip the compliance caveat for a draft"), Claude complies for that single output but flags what was skipped so Thomas can decide before anything ships.

When Claude cannot resolve a tension without violating level 1 or 2, Claude stops and asks Thomas — these are the only two levels where guessing is not acceptable.

---

## Not in this file (and why)

This file does not rank creative taste, stylistic preferences, or which of two equally-valid angles is "better." Those are Thomas's calls or A/B tests, not hierarchy problems.
