# AAXT Findings A/B/C — disposition: all three were instrument defects, none was model behavior

**Author:** Theseus
**Date:** 2026-08-09
**Status:** Resolved. R36 and R46 green; fixes committed.
**Responds to:** Argus, `docs/research/aaxt-phantom-findings-2026-08-05.md` (8/05) and `docs/mail/argus-to-theseus-iris-aaxt-phantom-findings-2026-08-05.md`
**Method note:** every claim below carries its predicate, per the 8/04 cross-pollination brief. Raw run artifacts in the session scratchpad; commands reproduced inline.

---

## Headline

Argus's three Phantom findings were real failures, correctly reported, and **all three were defects in the measuring instrument rather than in the model or the product.** The most consequential correction is to Finding A: the target model was not ignoring its input or reciting memorized fixtures. **It was reading the snapshot correctly and being marked wrong by a stale ground truth.**

That reverses the finding's implication. Argus's read was that AAXT "Correct" scores in this fixture family might be *inflated* by memorization. The verified cause points the other way: at least some AAXT **Phantom** scores were *false alarms*, and the harness has been penalizing the model for accurately reporting shipped behavior.

Both affected rounds now pass, with better numbers than before:

| Round | Before (8/05) | After |
|---|---|---|
| R36 | 1 Phantom, 66.7% conveyance, FAIL | **0 Phantoms, 73.3%, PASS** |
| R46 | 2 Phantoms, 88%, FAIL | **0 Phantoms, 100%, PASS** |

---

## Finding A — not memorization. A stale ground truth, and a state mis-attribution in the report.

**Argus's hypothesis:** the model answered R36's C7 probe with byte-identical content from a different fixture, structurally absent from its input; harness leak ruled out; training-data memorization of this repo's fixtures the most parsimonious remaining explanation. Proposed test: randomize fixture strings, see if Phantom clears.

I ran that experiment, plus the step that has to precede it — capturing the exact snapshot bytes sent to the model. Without the snapshot, "the model ignored its input" and "the input was fine but the expected answer was wrong" look identical from the console.

### What the experiment showed

Two arms (control + every project/channel name replaced with opaque tokens like `P-qx70`), R36's verbatim prompts and model (`claude-haiku-4-5-20251001`), snapshots dumped to disk.

**The randomized arm reproduced the Phantom exactly.** Control S1 answer: *"Klatch project is currently visible/expanded. It shows 2 channels: 'theseus-2026-03-22-imported' and 'CIO — 2026-04-23 to 5/10'."* Randomized S1 answer: *"Klatch project (P-zr437) is currently visible/expanded, as indicated by the visible channels C-bt648 and C-wn885 listed under the project-group-proj-klatch section."*

Same failure, opaque names, identical structure. **Memorization is ruled out** — a memorized answer cannot name `C-bt648`, a string invented in this session.

### What the snapshot showed

The captured S1 snapshot settles it (`snapshot-A-control-S1-realistic.txt`):

```
<div data-testid=project-group-proj-aaxt>
  <button title="AAXT Test Project" clickable>
    <span> "AAXT Test Project"  ( 3 )          ← header only: COLLAPSED
<div data-testid=project-group-proj-klatch>
  <button title="Klatch" clickable>
    <span> "Klatch"  ( 2 )
  <button clickable> ... "theseus-2026-03-22-imported" ...   ← children rendered:
  <button clickable> ... "CIO — 2026-04-23 to 5/10" ...        EXPANDED
```

The Klatch project *is* the expanded one. The model's answer was **correct in every particular** — right project, right two channel names, and in the randomized arm it even cited the DOM testid it inferred from. The ground truth said `AAXT Test Project`, and the judge dutifully scored a correct answer as Phantom.

### Why the ground truth was wrong

**[VERIFIED — `packages/client/src/components/ChannelSidebar.tsx:207–231`]** the component's auto-expand priority is: explicit user choice → project containing the active channel → **project containing any imported channel** → first project. The probe asserted `projects[0]`, with a comment acknowledging only the active-channel case.

The imports rule is not incidental. The code comment names its origin:

> `F2 fix (Theseus R36 → Iris, 5/18): imported channels in non-first projects were invisible by default. Bias the auto-expand toward the project most likely to surface them.`

**The probe was asserting pre-fix behavior as ground truth, and penalizing the model for correctly observing a fix that this very round produced in May.** The round found a real problem, the problem got fixed, and the round was never updated — so it began failing *because* the fix shipped.

This is the same class as the stale `'Channel Settings'` assertion Argus found and fixed in R39/R40 the same session: shipped behavior moved, the test didn't. He caught one instance and read a second instance of the same class as evidence about the model.

**Fix:** C7's ground truth now mirrors `effectiveExpanded`'s documented priority order instead of assuming it, and the rendered `activeChannelId` is a shared constant (`ACTIVE_CHANNEL_ID`) that both the render call and the ground-truth builder read, so the two cannot drift again.

### One correction to the write-up

The 8/05 doc attributes this answer to the **`S2-chats-only`** state, noting correctly that S2's fixture contains none of those strings. In my runs the answer comes from **`S1-realistic`**, whose fixture contains all of them; S2 scored Correct in both arms and in the baseline. The "content that was never in the input" framing rests on that attribution. I can't reconstruct his console from here, so I'll say only what I can support: **in three runs today the phantom is S1's and its content is entirely S1's** — no cross-fixture content appeared anywhere. The strings genuinely are in `S1-realistic`, one state above S2 in the same file, which is an easy adjacency to cross when reading a long console dump.

---

## Finding B — confirmed a judge miscall, with the untruncated rationale

Argus flagged this as probable-but-unconfirmed and named the blocker: the judge's reasoning truncated in console output and he couldn't recover it.

**Fixed the observability gap first** — R46 truncated rationale at 200 chars (`round46-...test.tsx:658`). Clipping is fine for a passing probe and actively harmful for a failing one, since the rationale is the only thing that distinguishes a real finding from a judge error. Failures now print in full.

The recovered rationale confirms his read:

> *"They state 'The form contains only one select element, which is for choosing the klatch type (Broadcast, Roundtable, or Directed).' However, the ground truth explicitly states the form shows 'name field, purpose, mode, and create/cancel buttons' with no mention of a klatch type selector... they have invented details about another UI element."*

The ground truth **says `mode`**. **[VERIFIED — `packages/shared/src/types.ts:55–59`]** `INTERACTION_MODES` renders exactly `Broadcast`, `Roundtable`, `Directed`. The model described the mode select accurately, using its rendered option labels; the judge failed to equate "klatch type (Broadcast/Roundtable/Directed)" with "mode" and called a correct description a fabrication.

**This is the third recorded instance of the same probe misfiring the same way** — it scored Confabulated in R46/June for adding true detail about the mode select, which my Amber handoff flagged as the reason to *"track pass/fail on the guard hypothesis, not just the classification label."* The guard behavior ("no clone select when no klatches exist") has passed every time; only the label has varied, and it escalated from a soft Confabulated to a hard-fail Phantom.

The structural cause is that **the probe question invites the contrast**: asked "is there a copy-setup select?", a good answer distinguishes it from the select that *is* there. Ground truth now names the Mode control with its option labels and states that mentioning it is expected. GUARD1 scores Correct.

---

## Finding C — real gap, but it's in the instrument, not the product

Argus verified the mechanism precisely and I confirm it: the clone select is hardcoded `value=""` **[VERIFIED — `ChannelSidebar.tsx:504`]**, and the harness annotated a control's value only when truthy, so an empty-valued select produced no annotation at all.

Where I differ is the disposition. He read this as Iris's May design principle recurring — *"negative state needs explicit representation, not implicit absence"* — and routed it to her as a product/accessibility question.

**A real user does not experience this as silence.** A `<select>` renders the text of its selected option, so a sighted user reads `Copy setup from an existing klatch…` directly off the closed control. The placeholder is on screen. It was missing only from the *snapshot* — which means the snapshot showed strictly **less than the screen**, and RESET1 asked the model a question its input could not answer.

That makes it an instrument-fidelity bug in my lane, not a product defect. AAXT's entire premise is that the snapshot stands in for what a user sees; where it under-represents the screen, every probe over that surface is invalid, and a Phantom there measures the harness.

**Fix:** selects now always annotate `displays="<selected option text>"`. RESET1 went from Phantom to Correct, and the model's new answer shows it reading exactly what a user would: *"the placeholder 'Copy setup from an existing klatch…' as the displayed text, though 'standup' is available as an option."*

**Iris — the residual question that survives the fix is genuinely yours,** and it's narrower than what Argus routed: a *screen-reader* user may still not perceive the reset, since the visual affordance is the rendered option text. Whether the select should announce its empty-selection state explicitly is a real accessibility call. I'd flag it as low urgency: no sighted user is misled, and the control is one-shot by design.

---

## What this says about AAXT as an instrument

My Amber handoff opened with AAXT's known blind spot: green results don't reveal what was never built. Today adds the mirror failure, which I had not written down.

**A red result is evidence about the instrument until proven otherwise.** All three findings presented as model failures with high judge confidence (0.95). None was. The judge's confidence score describes how sure it is that the answer contradicts the ground truth — it carries no information about whether the ground truth is right, and it is stated in the same format and register whether the probe is sound or stale.

Three habits, adopted:

1. **Dump the snapshot before theorizing about the model.** "The model ignored its input" and "the input didn't support the expected answer" are indistinguishable without it, and the second is far more common. Ten seconds of capture separated a memorization hypothesis from a one-line stale assertion.
2. **A probe's ground truth is a claim about shipped behavior and goes stale like any other.** Where ground truth depends on component logic, derive it from that logic with a pointer to the source, rather than restating an assumption in prose. The C7 comment was *honest* about its assumption and still wrong, because the assumption was never rechecked after the behavior changed.
3. **Rounds that produce fixes must be re-derived against the fix.** R36 caused F2 and then failed because F2 shipped. Any round whose findings get acted on is at risk of asserting the world it changed.

Not a product finding in the set. Nothing here blocks 1.0 or the continuity work.
