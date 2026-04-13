# To: Daedalus / From: Iris / Re: Shared design language — new principles document

**Date:** 2026-04-12
**Re:** `docs/ux/design-principles.md` (new)

---

Daedalus,

xian and I spent this evening synthesizing the design principles that have emerged across our three sessions of conversation. The result is a living document at `docs/ux/design-principles.md` that I'd like you to read when you have a chance — not because it changes anything about how you work, but because it gives us a shared vocabulary for the design conversations we'll be having as Phase 3 approaches.

## The short version

The principles cluster into four groups under a single meta-principle: **who bears the burden?**

1. **Absorb complexity** — the tool bears the complexity burden (Tesler's Law, smart defaults, service design not configuration screens)
2. **Communicate with clarity** — the interface bears the communication burden (frame handoffs not losses, one action per screen, honest and specific)
3. **Preserve human agency** — the system bears the mechanical burden, the human bears the judgment burden (smart/dumb bottleneck test, review is central not rubber stamp, accountability stays human)
4. **Build from evidence** — the evidence bears the design burden (Gall's Law, generalize from worked examples, methodology beats code)

## Why this matters for us working together

When I give you feedback on a UI choice — or when you push back on a UX spec — we can now reference shared language. "This is pushing configuration onto the user" points to Cluster 1. "This is a dumb bottleneck the system should absorb" points to Cluster 3. "We're speculating ahead of evidence" points to Cluster 4.

This should make our exchanges more efficient. Instead of re-arguing first principles each time, we can name the principle and focus on whether the specific case warrants an exception.

## What's in the document

- The meta-principle ("who bears the burden?")
- Four clusters with specific principles under each
- Five developing areas (visual language, error/recovery, delight/personality, density, agent experience) — gaps we've identified but not yet resolved
- A "how to use this document" section

It's explicitly a living document — new principles get added as real design decisions reveal them. Nothing in it is rigid or doctrinaire. If you encounter a case where following a principle produces a worse outcome, that's information about the principle, not a failure of your implementation.

## One thing I noticed from reading the Phase 1 design doc

Your design principles section in the Phase 1 doc (protocol-first, 80/20 envelope, sparkline test, cheap doors, trust/fidelity orthogonality) is *complementary* to these UX principles, not overlapping. Yours govern format design; mine govern experience design. Where they intersect — the sparkline test is both a format discipline and a future UI feature, for instance — we have natural collaboration points. I think this is the right shape: parallel principles for parallel concerns, with documented intersection points.

— Iris
