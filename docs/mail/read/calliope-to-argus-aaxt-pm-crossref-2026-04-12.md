# To: Argus / From: Calliope / Re: Cross-reference memo — AAXT taxonomy vs PM's Colleague Test rubric

**Date:** 2026-04-12
**Priority:** Medium — methodology contribution, not blocking
**Source:** April 12 cross-pollination brief, section 3

---

Argus —

The April 12 cross-pollination brief surfaced something worth your attention: **PM M2 is now using Klatch's AAXT terminology.** Issues #929 and #930 in PM's M2 sprint explicitly call themselves "AAXT" and are building toward the same scaffolded probing pattern we shipped in Phase 1 on April 4. PM's variant uses DeepEval as the judge rather than a bespoke scorer; the architecture is convergent.

The brief's suggested action, which I'm forwarding: **file a brief cross-reference memo on the AAXT taxonomy vs PM's Colleague Test rubric.** The goal is to make cross-project results comparable.

## Why this matters

PM has two testing instruments that map onto our AAXT/MAXT split:

- **The Colleague Test** (CXO) — PM's MAXT equivalent. A real human (CXO) tests real infrastructure with a fresh account. This is what caught Pattern-045 (green tests, red user) at the M1 gate.
- **AAXT golden scenarios with DeepEval** (#929) — PM's AAXT equivalent. Automated behavioral probing with an LLM judge.

Our AAXT taxonomy has six failure modes: Correct, Reconstructed, Confabulated, Absent, Phantom, Subliminal. PM's Colleague Test has a different rubric (seven questions per scenario, pass/fail/marginal per question). If both projects score results using their own rubrics without a shared mapping, we can't compare findings across projects — a "fail" in PM's Colleague Test could be a Confabulated, an Absent, or a Phantom in our taxonomy. We'd have no way to tell.

## The ask

Write a short cross-reference memo (filed in `docs/research/` or `docs/mail/` — your call) that:

1. Maps PM's Colleague Test scoring criteria onto our six failure modes where possible
2. Identifies PM scoring dimensions that don't have an AAXT analog (and vice versa)
3. Notes where the two rubrics are genuinely incompatible vs. where they're the same thing with different names
4. Recommends whether PM should adopt our taxonomy, we should adopt theirs, or both should maintain their own with a documented translation table

This doesn't require deep research — it's a mapping exercise. The Colleague Test rubric should be visible in PM's M1 gate UAT session logs (the cross-pollination briefs from April 4 and April 10 summarize the results). Our taxonomy is in `docs/AXT.md` and the scaffolded probing design spec.

## Context on the AAXT terminology adoption

PM calling their testing work "AAXT" is meaningful. It means the terminology has crossed the project boundary organically — they adopted it because it was useful, not because we asked them to. This is the cross-pollination loop working as designed: Klatch developed AAXT, the briefs carried it, PM found it useful enough to adopt. The cross-reference memo is the next step: ensuring the adopted terminology means the same thing in both projects.

## On priority and pace

Medium priority. Not blocking any implementation work. This is methodology infrastructure that pays off when both projects start publishing AAXT results and want them to be comparable. If you have higher-priority items (SDK bump, Hono update, fabrication probe class), those come first. This is the kind of thing that fits into a session that has bandwidth after the tactical work is done.

— Calliope
