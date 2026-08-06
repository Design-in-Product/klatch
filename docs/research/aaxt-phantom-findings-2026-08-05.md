# AAXT R36/R37/R46 Phantom findings — first live run since May, three distinct failure modes

**Author:** Argus
**Date:** 2026-08-05
**Status:** Findings written up; disposition (methodology change vs. product fix vs. no-op) is Theseus/Iris/xian's call, not decided here
**Context:** First time these AAXT UI-as-context rounds have run against a live model since Pard provisioned `.env` on Amber (8/05) and this session found the unattended WORK fire couldn't execute code — so this is also the first *attended* run since the 7/19 migration freeze.

---

## Headline

Ran all 12 `RUN_UI_AAXT=1` rounds live (`claude-haiku-4-5-20251001` as user-proxy, per existing config). **Two rounds (39, 40) failed on a stale test assertion, unrelated to AAXT semantics — fixed, now green, see below.** **Three rounds (36, 37, 46) hard-fail on `Phantom` classifications** — the harness's "confidently fabricated content not present in the input" category. I traced each Phantom to a specific, verified cause rather than treating the red X as self-explanatory. They are not the same bug wearing three faces — I want to be precise about that up front, because lumping them together would produce the wrong fix.

## Fixed and verified: Round 39/40 stale assertion (unrelated to AAXT, committed)

Both files asserted `container.textContent.toContain('Channel Settings')` as a data-loaded gate before running probes. **[VERIFIED, `packages/client/src/components/ChannelSettings.tsx:140`]** the component now renders `'Chat Settings'` or `'Klatch Settings'` — type-specific, per the chats/klatches vocabulary work (predates this session; "Channel Settings" was retired, the test wasn't updated). Fixed both files to assert the type-agnostic substring `'Settings'`. Re-ran: **both green, zero phantoms, 33 probes, 93.9% conveyance.** One soft (non-blocking) `Confabulated` pair worth a line for whoever's tracking design triage: the model twice added a specific version number ("Claude Opus 4.7") when ground truth said only "Claude" — same class of over-specification Iris's May triage already treats as low-priority.

## Finding A — Cross-fixture verbatim leakage (Round 36 C7, Round 37 IP1)

Two independent instances, in two different files, of the target model answering with **verbatim content from a different AAXT fixture that was never in its given input.**

- **Round 36, `S2-chats-only` state, C7-accordion-state probe** (`round36-ui-context-aaxt.test.tsx`). Question: which project is expanded? S2's fixture has one project, `ProjectX`, no `Klatch` project, no imported channels at all — **[VERIFIED, lines 305–314]** the channel array literally does not contain the strings involved. Model's answer: *"Klatch project's channels are currently visible/expanded. It shows two channels: 'theseus-2026-03-22-imported' and 'CIO — 2026-04-23 to 5/10'."* Both channel names are **[VERIFIED, `grep`]** byte-identical to `S1-realistic`'s fixture, a *different state in the same file* (lines 300–301).
- **Round 37, `IS1-rich` state, IP1-fingerprint-identification probe** (`round37-ui-context-aaxt-export-review.test.tsx`). Question: what was the most-recently-active session about? Model answered with a session description — **[VERIFIED, `grep`]** byte-identical to a fixture in `round38-ui-context-aaxt-import-browser.test.tsx` line 266/297, a **different test file entirely.**

Structurally, this rules out an in-process DOM leak: `snapshotDom` takes the rendered `container` as its argument (not `document.body`), `cleanup()` runs between states within a file, and vitest doesn't share module state across separate test files. There is no code path in this harness by which S1's data could physically appear in S2's snapshot, or round38's fixture in round37's. The only remaining explanation is that **the target model is not reading the given snapshot for these two answers at all** — it's producing something else, and what it produces happens to match other fixtures in this same test-fixture family exactly.

**What I won't claim:** I can't prove *why* from inside this session — training-data memorization of this repo's own fixtures is the most parsimonious explanation given the exact-string match, but I have no way to confirm that without Anthropic-side visibility. **What I can claim, verified:** the failure is real, reproducible, and structurally cannot be a harness/test-isolation bug given the above.

**Why this matters beyond these two probes:** if the target model can produce *this* fixture family's content from something other than the given input, then a "Correct" score on an adjacent probe in the same family doesn't necessarily mean the model read the current snapshot either — it might mean the model's memorized/typical answer for "a Klatch AAXT sidebar test" happens to coincide with the real one. That would inflate every past conveyance number in this fixture family, not just flag these two failures. I'm not asserting that's happening — only that this finding makes it a live question rather than a closed one.

**A cheap way to settle it**, for whoever picks this up next: re-run Round 36/37/38 with the *literal fixture strings randomized* (e.g. UUID-suffixed channel/session names instead of memorable ones like `theseus-2026-03-22-imported`) and see whether Phantom drops to near-zero. If leakage persists with randomized names, memorization is ruled out and something else (harness bug I haven't found, or genuine hallucination under ambiguity) is the answer instead.

## Finding B — Round 46 GUARD1: looks like a scoring/judge issue, not confirmed

`S-no-klatches` state, asking whether the clone-select dropdown is present. Model answered *"No, there is no dropdown or select element visible... that lets you copy setup from an existing klatch. The only select element present is for choosing the klatch type."* That reads, on its face, as **substantively correct** — it says "No," matching the expected absence. The judge's reasoning (truncated in the console output at ~150 chars, I could not recover the full text this session) opens with *"contains a critical contradiction... while they correctly state 'No'..."* — which is an odd way to open a rejection of a correct answer, and reads more like the judge itself got confused by the model's added detail about the klatch-type selector than like the target model actually fabricating an absent-dropdown claim. **Flagging as a probable judge-calibration issue, not confirmed** — I'd want the untruncated judge reasoning before asserting it. Whoever re-runs Round 46 can grab that directly from the harness (bump the truncation length in the console.log, or log the raw JSON).

## Finding C — Round 46 RESET1: verified real, and it's the "absence conveys nothing" principle recurring on a new surface

Question: after prefilling from an existing klatch, does the clone-select dropdown show the selected klatch name or the placeholder? Ground truth: placeholder (it's a one-shot action-select, not a persistent selection indicator). Model answered confidently: *"The dropdown shows the selected klatch name 'standup', not the placeholder."* Wrong, and specific.

Traced to source, this one resolves cleanly:

- **[VERIFIED, `packages/client/src/components/ChannelSidebar.tsx:504`]** the `<select>` is hardcoded `value=""` — by design, it always shows the placeholder regardless of what was last chosen (comment at line 500: *"Action-select (resets to placeholder after prefilling)"*). The ground truth is correct; this is not a stale-test problem like Round 39/40.
- **[VERIFIED, `round46-...test.tsx` `snapshotDom`, line 230]** the harness only annotates a form control's value in the snapshot when that value is *truthy* (`if (value && ...)`). An empty-string value — exactly what this select always has — produces **no annotation at all.** The snapshot conveys "placeholder is showing" by *silence*, not by any positive signal.

This is Iris's May design principle — **"negative state needs explicit representation, not implicit absence"** (`docs/ux/design-principles.md`, sourced from Theseus's Round 36/37/38 findings the first time this harness ran) — recurring on a surface that didn't exist yet in May. The difference this time: the model didn't just fail to infer the zero state (that would be `Absent` or `Subliminal`), it filled the silence with a specific, plausible, wrong guess (`Phantom`) — arguably a more severe version of the same underlying gap. Worth Iris knowing the principle has a second confirmed instance, and worth Daedalus knowing if a future accessibility-tree/ARIA pass ever wants selects to announce "no selection" explicitly rather than relying on absence.

## What I did NOT do

I did not patch the UI, the fixtures, or the harness to make these three rounds pass. Finding A is a methodology question about probe validity that I'm not positioned to resolve alone this session (would need either Anthropic-side visibility or the randomization experiment above). Finding B needs the untruncated judge reasoning before anyone acts on it. Finding C is real but the "fix" (make selects announce empty-selection state) is a product/accessibility decision, not an obvious bug — same caution CLAUDE.md's pre-gate-protocol philosophy asks for: a red result deserves the same "don't over-read it" discipline as a green one.

## Disposition

Not a 1.0/beta blocker on its own — nothing here suggests the shipped UI is broken; two of three findings are either about probe validity or already-known design gaps recurring. Routing to Theseus (AAXT/manual-testing owner, ran the original May sweep on these exact rounds) and Iris (owns the design-principle disposition and the F1–F3/E1/I1 triage this connects to) for a call on next steps; xian cc'd since Finding A bears on how much to trust *any* AAXT "Correct" score in this fixture family, which is a confidence question bigger than these three rounds.
