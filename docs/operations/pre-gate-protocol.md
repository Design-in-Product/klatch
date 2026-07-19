# Pre-Gate Protocol — Klatch

**Filed:** 2026-07-19  
**Author:** Argus, with Calliope and Iris  
**Trigger:** The composition continuity gap — a beta gate was declared clear when the canonical use case was unrunnable. The suite was green; the feature was tested; the gap was invisible to any existing check.  
**Status:** Proposed. Not yet applied to a gate. Apply before the next "gate clear" declaration.

---

## What went wrong

The composition gesture shipped green tests, green AAXT coverage, and Iris review. The gate was declared clear. The first time anyone tried to use the feature for its stated purpose — running the weekly leadership review — they found it couldn't be done.

The test suite proved "what we built works." It said nothing about whether what we built achieved the intended use case. These are different questions, and only one of them was being asked.

---

## The protocol — two passes, run before any "gate clear"

### Pass 1: Capability Inventory (Argus + xian)

**Anchor question:** Can we run the canonical use case from `docs/PREMISE.md`?

For the current beta gate (1.0), that use case is: **Piper Morgan's weekly leadership review.** Six department-head agents, each with an ongoing conversation and accumulated context about their workstream, convene, report, and a synthesis comes out the other end.

Walk through each required capability as a yes/no:

| # | Required capability | Verifiable by | Status |
|---|---|---|---|
| 1 | Import an agent conversation from Claude Code / claude.ai | Daedalus | ☐ |
| 2 | Import mints a distinct entity (not bound to DEFAULT_ENTITY_ID) | Daedalus | ☐ |
| 3 | Entity links to its source channel (`source_channel_id`) | Daedalus | ☐ |
| 4 | Agent arrives in klatch with source-channel context (seed + optional depth) | Daedalus | ☐ |
| 5 | Multiple agents can participate in the same klatch | Daedalus | ☐ |
| 6 | A synthesis agent can read all participants' contributions | Daedalus | ☐ |
| 7 | Klatch output is accessible for post-session reference | Daedalus | ☐ |

**Rule:** every row must be ✅ before the gate is declared clear. A row that is "mostly done" or "close" is ☐. A missing capability at checklist time is a scope surfacing, not a blocker to the checklist itself — surface it, get a call from xian, record the call explicitly.

This is a capability question, not a behavioral question. You're asking "does this exist and can it run?" — not "does it behave correctly in edge cases?" AAXT handles the latter; this handles the former.

---

### Pass 2: Scope Reconciliation (any agent declaring complete)

Before declaring any feature "complete" or any increment "the last one":

1. Find xian's stated scope for the feature (beta definition, increment list, spec §N scope section, or explicit approval in a memo).
2. List every named item in that scope.
3. For each item: ✅ shipped | ⏸ deferred-with-approval | ❌ not built, no call made.
4. Any ❌ must become an explicit call — either "defer to post-X" (with xian's sign-off) or "add to current scope."
5. **"Not now" said in passing is not an approved deferral.** Only a recorded decision in a memo, COORDINATION.md, or ROADMAP.md counts.

**How this would have caught the gap:** On 6/27, before declaring "composition gesture is complete," a scope reconciliation against xian's 6/26 beta definition would have flagged Paths B/C as ❌ — not shipped, no call recorded. That would have prompted a decision before the merge, not a discovery two weeks later.

---

## When to run this protocol

| Event | Pass 1 | Pass 2 |
|---|---|---|
| Declaring a feature increment "complete" | — | ✅ required |
| Declaring a milestone/gate "clear" | ✅ required | ✅ required |
| Merging a branch that closes a spec section | — | ✅ required |
| Drafting release notes | ✅ required | ✅ required |

---

## Relationship to existing checks

| Check | What it covers | What it doesn't |
|---|---|---|
| Unit + integration suite | Behavioral correctness of what's built | Whether the right things were built |
| AAXT | Behavioral delivery of shipped UI claims | Whether capabilities exist at all |
| Iris design review | Visual + UX conformance to spec | Whether spec scope was fully implemented |
| **Pass 1 (capability inventory)** | Whether the canonical use case can run | Behavioral correctness |
| **Pass 2 (scope reconciliation)** | Whether all named scope items were built or explicitly deferred | Nothing — it's a bookkeeping check |

None of these checks subsume each other. All four need to run.

---

## Note on AAXT limitations

AAXT probes surface-level behavioral claims: "does the UI show X when condition Y is true?" It cannot detect that a capability was never built, because it has nothing to probe against. It can only find misbehavior in what exists.

The composition continuity gap was invisible to AAXT by nature, not by insufficient coverage. No additional AAXT probes would have found it. Only a question like "can we actually do the weekly leadership review?" — which requires standing the system up and trying — would have surfaced it.

This is why the capability inventory (Pass 1) is a human + real-system check, not a synthetic probe. It asks "can we use this?" — which is a different question than "does it behave correctly?"

---

*Protocol filed following the 2026-07-19 composition continuity gap discovery. See `docs/plans/composition-continuity-gap-2026-07-19.md` and `docs/PREMISE.md` for context.*
