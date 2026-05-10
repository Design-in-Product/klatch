# MemPalace — Step 11 Design Reference (Delta on April 12 Synthesis)

**Filed by:** Argus
**Date:** 2026-05-10
**Scope:** What's new about MemPalace since the April 12 Janus memory-research synthesis, plus verification of specific MemPalace claims now that we've read the actual sources.
**Triggering brief:** Intel sweep 2026-05-04, item #4 (which presented MemPalace as a fresh research finding — it isn't)
**Primary prior reference:** `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md`

---

## Why this is a delta and not a fresh reading

The April 12 Janus synthesis already covered MemPalace as one of 14
systems evaluated under Leonard Lin's six-tier framework, with a
specific "Best Of" composite-model recommendation for Klatch:

> Step 10's canonical context package format should include the
> three-sub-tier Layer 3 model. The format spec needs fields for
> `valid_from`, `type`, `source`, and `trust_level` on memory entries.
> Daedalus should read Lin's ANALYSIS.md directly — it's the most
> rigorous survey of the design space Step 10 is entering.

That memo's core organizing thesis (Lin's): **"storage technology is
irrelevant; write governance is everything."** That framing supersedes
my own initial read of MemPalace as a "borrow these architectural
patterns" exercise — write governance, not architecture, is the
load-bearing question.

The April 12 synthesis also already filed the **Jovovich/Sigman**
authorship correction (the earlier Labrador research had attributed
MemPalace to Erika Flowers; `erikaflowers/mempalace` is a fork). My
Cybernews verification today (Jovovich + Ben Sigman, built with
Claude Code, motivated by frustration with Mem0/Zep) is consistent
with the corrected attribution.

**This document only adds what is new since April 12.** For the full
landscape, the synthesis is the primary reference. For the design
recommendation, the synthesis's "Best Of" composite model stands.

---

## What's new since April 12

### 1. The benchmark numbers were tainted (caught in May)

Independent reviewers (Nicholas Rhodes Substack; SDxCentral; arXiv
critique #2604.21284) found the MemPalace team hand-tuned to specific
failing test cases — phrase-boosting on "sexual compulsions,"
name-boosting on "Rachel" — then re-ran the benchmark. The team's own
`BENCHMARKS.md` "integrity section" warns against exactly this. They
did it anyway.

**Honest numbers to anchor on:**

- 60.3% R@10 with no reranking
- 88.9% R@10 with hybrid retrieval and no LLM
- The headline 96.6% R@5 LongMemEval number requires the contested
  configurations
- The honest ceiling for the LoCoMo benchmark is ~93–94% after dataset
  corrections (not 100%)

For Klatch's eventual Step 11 evaluation: **measure end-to-end
question-answering correctness, not just retrieval recall.** This is
the metric distinction the arXiv critique makes (`recall_any@5` says
the right memory was in the candidate set, not that the system used
it correctly). Recall is necessary but not sufficient.

### 2. The "local-only / zero API costs" framing has an asterisk

Highest-scoring configurations require Claude API calls (reranking,
answer synthesis). The "zero API costs" framing applies to **raw
retrieval mode only**. The actual high-quality outputs need an LLM in
the loop, like everyone else.

Not a problem for Klatch (we have an LLM in the loop already), but
relevant when comparing claimed performance.

### 3. Origin-story validation

The Cybernews / Bitcoin News pieces confirm: Milla Jovovich designed
the architecture after frustration with Mem0/Zep deciding what's
worth remembering for her. Ben Sigman implemented. Claude Code was
the build environment. This matters because **the "no AI summarization
at write time" design choice is not a coincidence — it's the entire
motivation.** The verbatim-storage posture is load-bearing for the
project's identity, not a pluggable choice.

This validates the April 12 synthesis's framing: write governance is
the differentiator, and MemPalace's specific contribution is "remove
the LLM from the write path."

---

## What I cannot verify from the public material

The April 12 synthesis worked from earlier-stage public material;
several specifics in my own initial pass also could not be confirmed
from the README I fetched today:

- **The actual SQLite schema** (README points to
  `mempalaceofficial.com/concepts/the-palace`; not fetched)
- **The 170-token startup-cost figure** the 5/04 sweep cited (not in
  the README; treat as unverified)
- **The backend abstraction's actual decoupling quality** (would
  require reading `mempalace/backends/base.py`)
- **Whether the "invalidate" operation is reversible** (would require
  reading source)

If any of these become load-bearing for Step 11 design, ~20 minutes
of source-reading would settle them. None of them changes the April
12 synthesis's conclusions.

---

## Open question for Step 10 / Step 11 sequencing

The April 12 synthesis recommended that **Step 10's canonical context
package format incorporate the three-sub-tier Layer 3 model**, with
specific schema fields:

- `valid_from`
- `type` (fact / decision / preference / episode)
- `source` (which session/conversation/brief)
- `trust_level` (agent-observed / cross-pollination / external)

**Verification needed:** did Step 10 Phase 1's format actually
incorporate these fields, or did the April 12 recommendation get
filed and not picked up? If the latter, Step 11 design has more
upstream cleanup to do than was visible from the 5/04 sweep alone.

(Verifying this would be a 5-minute spike: read
`docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` and
`packages/server/src/export/package-builder.ts` for the field set
on memory entries. Not done in this session — flagging as a follow-up.)

---

## Cheap things Klatch could do today, regardless

Independent of Step 11 sequencing, two patterns from the April 12
synthesis are small-effort:

1. **`validUntil` (or `ended`) on `MicroReflection`.** The Zep/Graphiti
   temporal-validity pattern. Klatch's reflections have `createdAt`
   but no expiry. Reflections from a year ago aren't "wrong" but
   they may have been superseded; a nullable `validUntil` plus
   default queries that filter to currently-valid would preserve
   auditability while keeping prompt injection clean.

2. **Trust tagging on cross-pollination injection.** The April 12
   synthesis explicitly recommended trust-tagging memory by source
   so cross-pollination briefs get weighted differently from
   agent-observed facts. Klatch already has `ingress` on
   reflections (`klatch-ui` / `mcp` / `import`); extending this to
   memory entries would be the same shape.

Both are pre-Step-11 readiness moves. Both are also pre-existing
April 12 recommendations; the only thing this 5/10 doc adds is "MemPalace
in the wild does the temporal-validity pattern, and the benchmarks say
it works (within the 60–89% R@10 envelope)."

---

## Process finding for the intel sweep methodology

The 5/04 automated sweep presented MemPalace as a fresh research
find — Item #4, Medium priority, "design reference for Step 11."
**The sweep had no awareness of the April 12 Janus synthesis.** Both
documents existed in the same repo; the sweep didn't cross-reference.

This is a cross-reference gap in the sweep methodology, not a
catastrophic failure (the sweep wasn't wrong about MemPalace's
relevance, just about its novelty for our project). But it's worth
flagging: **the sweep should grep `docs/mail/`, `docs/research/`, and
`docs/intel/` for prior mentions before flagging "research finds."**

A minimum implementation: a pre-curation step that lists any prior
docs mentioning the keyword, so the curating agent (me) can frame
new findings as deltas rather than fresh discoveries.

I'll route this to whoever owns the sweep automation as a separate
follow-up.

---

## Recommendation

1. **The April 12 synthesis is the primary reference for Klatch
   memory architecture.** This document is supplementary.
2. **Verify whether Step 10's format spec adopted the
   `valid_from` / `type` / `source` / `trust_level` fields** the
   synthesis recommended. (5-min spike.)
3. **Adopt `validUntil` on MicroReflection** as a pre-Step-11
   readiness move (small change, real auditability gain).
4. **Anchor any benchmark targets in the 60–89% R@10 range**, not
   MemPalace's contested 96.6% headline.
5. **Don't borrow the wings/halls/rooms vocabulary** (conflicts with
   our existing channel/entity/project model).

---

## References

**Primary (April 12 synthesis and prior research):**

- `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md` —
  primary reference; six-tier framework + Best-Of composite + Klatch
  recommendations
- `docs/mail/calliope-to-mnemosyne-mempalace-2026-04-11.md` — initial
  routing memo
- `docs/mail/calliope-to-daedalus-memory-research-2026-04-12.md`
- `docs/mail/calliope-to-mnemosyne-correction-2026-04-12.md` — the
  Jovovich/Sigman authorship correction
- `docs/mail/memo-janus-to-calliope-labrador-research-2026-04-11.md`

**External (read in this session):**

- [MemPalace/mempalace (canonical repo)](https://github.com/MemPalace/mempalace)
- [README on develop branch](https://github.com/MemPalace/mempalace/blob/develop/README.md)
- [Nicholas Rhodes review — benchmark methodology critique](https://nicholasrhodes.substack.com/p/mempalace-ai-memory-review-benchmarks)
- [arXiv: Spatial Metaphors for LLM Memory — A Critical Analysis](https://arxiv.org/html/2604.21284v1)
- [SDxCentral: things MemPalace would rather forget](https://www.sdxcentral.com/news/milla-jovovichs-ai-memory-project-has-a-few-things-it-would-rather-forget/)
- [Bitcoin News: Jovovich + Ben Sigman origin](https://news.bitcoin.com/resident-evil-star-milla-jovovich-builds-ai-memory-tool-with-engineer-ben-sigman/)
- [Lin's agentic-memory ANALYSIS.md](https://github.com/lhl/agentic-memory/blob/main/ANALYSIS.md) (cited in April 12 synthesis as the definitive survey; not re-read in this session)

**Triggering brief:**

- `docs/intel/2026-05-04-sweep.md` (item #4) +
  `docs/intel/2026-05-04-sweep-curated.md`
