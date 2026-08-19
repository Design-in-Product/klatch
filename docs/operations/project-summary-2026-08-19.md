# Klatch project summary — 2026-08-19

**For:** xian, for a deep-dive catch-up pass (requested via Janus, 8/19). **From:** Calliope.

This is a narrative companion to `docs/operations/attention-rollup.md` (v54, current as of this morning's verification) — the rollup is demand-organized (what needs a decision from you, first); this is portfolio-organized, answering two things you asked Janus to make sure I addressed directly rather than leave implicit.

---

## 1. Is the team in one rabbit hole, or is this one thread among several?

**Both are true, and the honest shape is: yes, dominant, but not exclusive — and it's the highest-value use of Daedalus's and Theseus's time right now, not drift.**

Since **8/14**, essentially all of Daedalus's and Theseus's fire time — six days, Rounds 50 through 62 plus the N1 build — has gone into one continuous research thread: whether Klatch's "carried context" feature (an agent's own activity in other channels, summarized into a klatch it's currently in — continuity increment #3) can **silently disclose something an owner restricted**, if the restriction marker gets evicted from the context window while the fact itself survives. That's a real, load-bearing question — continuity #3 is already shipped and live in `buildSystemPrompt`, so this isn't speculative hardening, it's checking a shipped feature for a disclosure gap before more is built on top of it.

The shape of the work, so you can judge the depth for yourself: it's been run as a genuine instrumented experiment, not a design debate — pre-registered predictions, live model calls scored against them, findings that got corrected in the open when re-derivation disagreed with a published number (the Round 62 five-vs-six count is a good example: caught by arithmetic on the document, the underlying data had already been deleted, and both agents flagged that as a cost of the current practice rather than quietly living with it). It has produced two real findings: (1) a scope-gap marker can now be *read* live where it couldn't before (Round 56), and (2) anchoring was cleanly refuted and replaced with a real, measured finding — a model can decline to read a large offered excerpt and assert an absence anyway (Round 62). The thread converged this morning: **N1, the arm built to isolate the last confound (offer-size cost), is instrument-confirmed by both agents independently and you approved the live run this morning** (relayed by Janus). That is likely to close or substantially narrow this thread in the next 1–2 fires.

**It is not the only thing in flight.** Running in parallel, lower-intensity:
- **Import/dedup UX** (Daedalus + Iris) — a separate, smaller thread, largely wrapped: the claude.ai project-match dedup behavior was decided and shipped 8/18 (silent-attach-on-re-import, replacing a destructive default), and Daedalus verified this morning that the "silent attach" half is real and shipped; one small copy/design decision (a toast, or not) is the only open piece, sitting with Iris.
- **Argus and Iris are in steady-state verification**, not idle — re-running the full suite, checking diffs, confirming nothing regressed — but not opening new feature work, largely because their two standing items are both parked on you (see §3 below).
- **Routine AAXT/AXT infrastructure maintenance** continues underneath — e.g. Argus closed two probe-scoring holes 8/10–8/11, found and flagged a third (non-blocking) while verifying.

So: if you're picturing five agents each pulling a different thread, that's not the current shape. If you're picturing everyone staring at one whiteboard, that's closer but overstates it — two people are deep in the one thread, two are in maintenance mode waiting on you, and a smaller UX thread closed out around the edges this week.

---

## 2. The beta-blocker needing manual (MAXT) testing — front and center

**Status: still parked, and it's parked on you — specifically, on the same backfill decision that's been sitting in the rollup's 🔴 section since 8/12.**

Quick timeline, because "beta" has actually moved twice and the current state doesn't match either endpoint cleanly:
- **v1.0 shipped 6/29** — MAXT Session 03 ran live with you, 15/15 probes passed, beta gate read clear.
- **Withdrawn 7/19** — you and I found a composition continuity gap post-ship: the shipped composition gesture had no path for an agent to carry context from the channel it was imported into. The cut was retracted, not deleted, so the record shows the correction. Continuity increments #1–#3 exist to close that gap.
- **#1 and #2 are shipped.** **#3 (carried context) shipped 8/12** — but Daedalus measured it against your real March backup and it's carrying **1,583 characters** where a real department-head tail should carry **~12,000–22,000**. Root cause: all 65–72 already-imported channels (the count itself needed two corrections in transit, both now reconciled in the gap doc) are bound to one shared `default-entity`, so "this agent's own recent activity" is currently a mix across every import, not one agent's history.
- **MAXT Session 04** — the manual, live-with-you re-verification of composition + continuity — has been deferred since 7/19 for exactly this reason, and its real gate, per both Daedalus and Theseus, **is that backfill decision**, not more building. Running it now would test against known-wrong data.

**The concrete ask, unchanged since 8/12:** do you backfill entities for the existing imports, or is forward-only acceptable (re-import the ones you care about, e.g. the six department heads for the canonical demo)? Either answer unblocks it. It's the first item in the rollup's 🔴 section (full detail and sources there) — nothing new to add here except that it is genuinely the long pole on beta, not one option among several, and it is not resolved by anything in the N1/carried-context-eviction research thread above (related epic, different open question).

Two smaller items also parked on you, lower stakes:
- **Import-confirm-step UX** (Daedalus's server side has been ready since 8/09; your review of Iris's spec hasn't landed a commit yet).
- **The "ground-rules" discretion convention** — you answered the underlying model 8/08–8/09 (a 1-1 is direct, not private; discretion is convention-based, not platform-enforced) and I confirmed the reasoning; the UI surface for it hasn't been scoped because it's queued behind the same review bandwidth as the item above.

---

## 3. Full list of what's waiting on you right now

From the rollup's 🔴 section (3 items, unchanged since this morning):
1. **Backfill the 65–72 existing imports, or forward-only?** — blocks continuity #3's real demonstration and MAXT-04. (§2 above.)
2. **Carried-context eviction — build detection for an owner's restriction so it can't be silently evicted?** — the decision the whole Round 50–62/N1 thread has been building evidence toward; still explicitly undecided, both agents restate this every round.
3. **Commit live-round raw JSONs going forward, so a published count can be checked against data rather than re-argued from a document?** — a research-process question, raised because Round 62's own count discrepancy turned out unrecoverable once the underlying data was deleted per current practice.

Plus the two UX items in §2, and one long-dormant, non-urgent item: the CIO's 6/3 canonical-artifacts request, unverified since late June (needs an interactive session with network access to check).

---

*Sources: `docs/operations/attention-rollup.md` v54; `docs/COORDINATION.md` (Argus/Daedalus/Theseus/Iris sections); today's mail (`daedalus-to-theseus-...the-wall-was-a-command-form...`, `theseus-to-daedalus-...both-arms-reproduce...`, `janus-to-daedalus-...xian-approves-n1...`, `daedalus-to-iris-...project-match-verified...`); `docs/plans/composition-continuity-gap-2026-07-19.md`; `docs/plans/continuity-3-carried-context.md`. All read directly this session, not recalled.*
