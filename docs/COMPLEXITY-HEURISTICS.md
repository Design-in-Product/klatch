# Complexity Heuristics

*Working document. First draft 2026-04-11 by Argus, in conversation with xian.*
*Status: provisional reference. Iterate as we use it.*

---

## Purpose

A short list of tests for "are we over-engineering this?" Designed to be applied to any feature, infrastructure, or methodology decision where we're tempted to add structure beyond the immediate need. Not rules. Not gates. Tests we can hold a proposal up against to surface honest questions.

The heuristics are most useful **when complexity is creeping in incrementally** — each addition seems small but the total weight starts to feel wrong. They're less useful for greenfield design decisions where the question is "what shape should this be?" rather than "have we added too much?"

We expect these to evolve. If a heuristic stops being useful, drop it. If a new pattern keeps catching us, add one.

---

## When to apply

Run through these any time you notice yourself doing one of:

- Adding a second tier, layer, mode, or category to something that originally had one
- Defending a design choice with "but in the future we might want…"
- Building infrastructure to support tests, metrics, or telemetry that don't exist yet
- Writing more documentation than implementation
- Designing for users or use cases you don't have yet

None of those are necessarily wrong. They're just signals that the heuristics are worth a few minutes of attention.

---

## The heuristics

### 1. The bug-catching ratio

> If we ship this added complexity and find that 95% of real failures are caught by the simpler version alone, the addition was over-engineered.

**The test:** After the feature has been in use for a meaningful period, count the bugs / failures / problems each layer of complexity actually catches. If the added layer catches a small fraction, it didn't earn its weight.

**The action:** Simplify or cut the layer. Move its functionality into the simpler version, or remove it entirely.

**Example application:** Argus's dual-track fidelity testing for Step 10 (structural binary + behavioral distributional). The behavioral track is justified only if it catches bug classes the structural track can't see. After Phase 2 ships, count: how many round-trip failures does the behavioral track surface that structural would have missed? If fewer than 10%, the dual track wasn't worth it.

**Failure mode this catches:** Adding sophistication that feels rigorous but doesn't move the needle on actual quality.

---

### 2. The postcard test

> If we hand this to a new agent or a new team member, can they understand it from a single page? Can they explain it back?

**The test:** Try to write a one-paragraph description of the design. If it requires three pages of methodology before anyone can use it, it's too complex for what it's doing.

**The action:** Either simplify the design until the postcard works, or accept that the design is fundamentally complex and invest in really good documentation. The wrong move is to ship complex design with thin documentation.

**Example application:** AXT methodology vs. AXT instruments. The methodology *is* a postcard ("specifically probe known answers, classify failure modes, the human bridge is unique"). The Fork Continuity Quiz is the heavier instrument. Keeping those separate is what makes AXT teachable. If the methodology became "five pages of preconditions before you can run a probe," that's a signal to simplify.

**Failure mode this catches:** Designs that only work because their author holds the whole structure in their head. Anything that breaks when its author leaves.

---

### 3. The user-visible value test

> Does this complexity produce information or behavior that changes a real user's real decisions?

**The test:** Trace the complexity to a user-facing outcome. Who looks at the data this produces? What do they do differently because of it? If the answer is "nobody" or "nothing," the complexity is vanity.

**The action:** Either remove the complexity, or build the user-facing surface that makes it valuable. Don't ship infrastructure for telemetry no one reads.

**Example application:** A fidelity score of 0.73. What does that number mean to anyone? If it doesn't drive a "regenerate this package" or "don't trust this round-trip" decision, it's a vanity metric. The information needs to feed into a user-visible action or it's not worth measuring.

**Failure mode this catches:** Building data pipelines, scoring systems, or test harnesses whose output never reaches a decision-maker.

---

### 4. The deadline pressure test

> If we imagine ourselves three weeks before a real release, would this be the first thing we cut?

**The test:** Mentally simulate the moment when scope has to shrink. Is this part of the design you'd defend, or the part you'd quietly drop? Be honest. The answer is information.

**The action:** If you'd cut it under pressure, consider cutting it now and getting the simpler thing right. The best time to descope is during design, not during a crunch. If you wouldn't cut it, you've identified a load-bearing piece — and you can defend it on the merits if anyone asks.

**Example application:** This was the test that pushed Argus to soften the Phase 2 fidelity proposal. Original plan: structural + behavioral testing in Phase 2. After running this heuristic: behavioral testing would absolutely be cut under deadline pressure. Revised plan: Phase 2 ships structural fidelity + the data shape required to support behavioral fidelity later. Phase 3 builds the behavioral harness on top, when we have evidence it's needed.

**Failure mode this catches:** Plans that look comprehensive on paper but get gutted in execution, leaving incomplete infrastructure with no clear way to finish.

---

## How to use these together

The heuristics aren't a gate — they're a checklist. Most designs will pass three of four, fail one, and that's okay. The interesting case is when a design fails two or more. That's when you should slow down and ask whether the design is the right shape at all.

The honest answer is sometimes "we don't know yet whether this is over-engineered." That's fine. The heuristics give you something to *check back against later*. If you ship something and three months later the bug-catching ratio is bad, that's the heuristic doing its job.

---

## What this is not

- **Not a rule that complexity is bad.** Some problems are genuinely complex. Tesler's Law (DP8) acknowledges that the complexity exists; the question is where to put it. These heuristics help us avoid putting complexity where it doesn't belong.
- **Not a substitute for design taste.** If a design feels off but passes all four heuristics, trust the feeling and dig deeper.
- **Not a gate to ship.** Don't use these as bureaucracy. Use them as a tool to surface honest questions before you've committed too much to a path.

---

## Iteration log

- **2026-04-11:** First draft, drawn from Argus's Step 10 fuzzy-fidelity work and conversation with xian. Four heuristics, no priority order.

If you apply these to something and they help, write a sentence about it here. If they fail you, write that down too. Both are signal.

---

## Related

- `docs/AXT.md` — methodology that benefited from staying simple (the postcard test would have caught bloat early)
- `docs/plans/STEP-10-EXPORT-META-MODEL.md` — Step 10 phasing, where the heuristics are being actively applied
- Gall's Law (cited throughout `CLAUDE.md`) — the principle these heuristics serve
