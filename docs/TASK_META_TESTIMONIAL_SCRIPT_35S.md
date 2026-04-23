# TASK — META TESTIMONIAL SCRIPT (35–45 seconds)

A reusable task specification for generating Danish testimonial-style video ads for Meta. Reference this file in chat when you want Claude to produce scripts consistently without re-explaining the format each time.

**How to invoke in chat:**

> "Apply TASK_META_TESTIMONIAL_SCRIPT_35S.md. Inputs below."
>
> Then paste: 1–5 raw testimonial transcripts + awareness level + any performance context.

---

## What Claude must do

Produce 3–5 Danish Meta video scripts, each 35–45 seconds when read aloud at natural pace, using the provided testimonial transcripts as primary raw material.

## Required inputs (from Thomas)

1. **Raw transcripts** — 1–5 testimonials in Danish or English. Can be full interviews, voice notes, or curated quotes.
2. **Awareness level** of the target audience — unaware / problem-aware / solution-aware / product-aware / most-aware. Default: problem-aware.
3. **Optional**: which angle or mechanism to emphasize (e.g., "lead with encapsulated retinol" or "focus on sensitivity relief"), existing winning scripts to match the tone of, any compliance notes.

## Required Claude behavior

1. Fetch all Tier 1 core files + the ad/script on-demand files (HOOKS, BENEFITS, MECHANISMS, INTEREST_PROBLEM_DESIRE, CTA_SOCIALPROOF, GOLDEN_STANDARD_ADVERTORIALS).
2. Fetch DECISION_PRIORITY.md and apply it when any tension arises.
3. Mine the provided transcripts for VoC — pains, dream states, objections, exact phrases. Preserve the strongest authentic phrasing in hook and result sections.
4. Inject mechanism, objection handling, and CTA from the approved libraries — do not invent.
5. Produce each script in the structure below.
6. Follow Danish language rules from `KJELDGAARD_MASTER_INSTRUCTIONS_v1.md` (no "Og" after periods, no American staccato, natural prose).

## Output structure per script

```
SCRIPT [N] — [ANGLE NAME IN 2–4 WORDS]
Awareness: [level]
Primary VoC source: [which transcript, which lines]

[00:00–00:05] HOOK
[Danish text — 1–2 sentences, scroll-stopping, ideally customer's own words]

[00:05–00:15] BEFORE / PROBLEM
[Danish text — specific frustration in natural phrasing, pulled from transcript]

[00:15–00:27] DISCOVERY & MECHANISM
[Danish text — "Så fandt jeg Barrier Defense…" + layered-in unique mechanism from INGREDIENTS/CORE_SALES_PITCH]

[00:27–00:37] RESULT / TRANSFORMATION
[Danish text — concrete outcomes, pulled from transcript where possible]

[00:37–00:45] RECOMMENDATION + CTA
[Danish text — "Hvis din hud er [situation], så prøv det" + one clear action]

NOTES
- Total read time: ~[X]s at natural pace
- Which DECISION_PRIORITY tensions arose, and how resolved
- Any objection-handling or proof that was added (not in original transcript)
- Flag anything requiring Thomas's compliance review before shipping
```

## Quality bar before Claude delivers

Before outputting, Claude self-checks:

- [ ] Every script reads as natural spoken Danish, not translated or AI-flavored
- [ ] Hook within first 5 seconds uses customer phrasing or mirrors it closely
- [ ] Mechanism section names a specific approved ingredient/mechanism, not generic "hydration"
- [ ] No forbidden claims from SWIPE_DON'T
- [ ] All factual claims traceable to FACTS files
- [ ] Transitions are smooth — each section answers the implicit question from the previous
- [ ] CTA is one action, not a menu
- [ ] Total read time is 35–45 seconds

If any self-check fails, fix before delivering. Don't ship scripts that need Thomas to catch the miss.
