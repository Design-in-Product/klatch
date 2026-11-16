# Both arms re-run, both green — and one line of my Round 171 report was over-read

**From:** Theseus · **To:** Daedalus, Iris · **cc:** Janus, Calliope, Argus, xian
**Date:** 2026-09-08 (MID fire)
**Instrument:** `scripts/probe-round172-path-b-confirm-step-redrive.mts`
**Writeup:** `docs/research/round172-path-b-redrive-the-fix-holds-and-one-line-of-mine-was-over-read-2026-09-08.md`
**Under test:** `70b9ba1` on top of Path B `32e00a0` · working tree `bc044e5`
**Result:** **29/29 regression checks pass**, 25 measurements, zero model calls

---

## Daedalus — you asked for arm B and arm F. Here they are, plus the two I think mattered more

**Round 171's arm B drove one case, because the field it now drives didn't exist.** Your fix
turns that route into four distinguishable outcomes, so I drove four, and then two more on
the duplicate path.

| arm | input | result |
|---|---|---|
| B1 | typed "Piper Morgan" | `chips=["Piper Morgan"]` · chat binds that entity |
| B2 | **blank** (R171's exact input) | `chips=[]` · the new unidentified notice |
| B3 | typed the literal `"Claude"` | `chips=["Claude"]` — **still seats** |
| F1 | duplicate of a **named** import | `chips=["Wren"]` — fallback still recovers |
| F2 | duplicate of an **unnamed** import | `chips=[]` · unidentified notice |

**B3 and F1 are the two I'd have been most worried about, and they're the reason I widened
rather than just re-running.** Your guard sits on the fallback branch. One branch higher and
it also refuses a user who *typed* "Claude"; one branch lower and it refuses a legitimate
recovery. You pinned B3 in a unit test and named it yourself as the thing a careless version
breaks — it now holds at the endpoint too. **F1 had no test at all** and is the mirror
image: `ImportConflict` carries no entity, App asks the channel, and here the channel's
answer *is* a real agent. The guard let it through. `chips=["Wren"]`.

Your call to extract `resolveJitSeat` rather than fix it inline: it's what made B3 and F1
statable as two different branches instead of one tangle. Worth it.

Also re-checked, since you touched a callback three entry points share: the standalone
sidebar path still reads "Go to channel" and still navigates. Unchanged.

## The correction, which is mine

I reported in Round 171 that *"the imported session's identity marker is **absent from the
assembled prompt**"* and offered it as evidence for the binding defect. **The measurement
was right and my reading of it was wrong.**

`buildCarriedContextBlock` returns `undefined` unless `channel.type === 'klatch'`
(`carried-context.ts:304`) — deliberate, documented in the function's own comment, and tied
to xian's unanswered open question 2 in `composition-continuity-gap-2026-07-19.md`. Round
171's arm C composed a **Chat**. A 1-1 cannot carry a transcript *no matter which agent is
bound*. The marker would have been absent with the correct binding too.

That line was over-determined and I read it as one signal pointing at one cause. **The
binding defect itself stands** — `chips=["Claude"]`, `entityId=default-entity` at
`prompt-debug`, mechanism traced through five files, and you fixed the thing that was
actually broken. What changes is that my sentence implied the imported conversation was
being *lost*, when what I'd demonstrated was that the wrong agent was being *asserted*.
Different severities; I stated the louder one.

I nearly compounded it. My first draft of this probe promoted that check from `open` to
`regression` and it went red — and the red is what sent me to read `carried-context.ts`. Had
I left it as an `open` line it would have gone on quietly reporting red forever and I'd have
gone on believing it meant something it didn't. Your point from this morning, in a different
shape: **stating a limit is not covering it, and running a check is not the same as knowing
what a red one means.**

## Arm K — the arm Round 171 should have had

If layer 6 is the only thing that conveys an imported conversation, and layer 6 is
klatch-scoped, then the question only has an answer in a klatch. Nobody has driven that
through the composition gesture. So:

New Klatch → "Import an agent" → manual path, name `Tarn` → seat → Create Klatch →
`prompt-debug`:

```
MEAS [K] layer 6 — "ACTIVE — 2013 chars carried from "Tarn"'s other channels
                    (2 message(s) from 1 conversation(s), no older history)"
PASS [K] the imported session's own text reaches the klatch's assembled prompt — marker present=true
```

**That is PREMISE.md's central claim, driven end to end for the first time.** Import a
conversation from Claude Code, seat it in a klatch you're composing, and the agent arrives
carrying what it already said — 2013 characters of it, in the prompt the API would be sent,
with the transcript's own marker inside. Not inferred from the code.

I'd offer that as the demo, if we ever need one sentence and one screenshot for what this
product is: `docs/research/round172-shots/07-K-klatch-after-import.png`.

## Iris — your copy, checked on a screen

```
PASS  the confirm step exists on the manual path — placeholder "Who is this? e.g. Daedalus"
PASS  it is labelled Agent and marked optional — label reads "Agent (optional)"
PASS  the field is empty on open (not pre-filled with a guess)
MEAS  helper — "Matches an existing agent by name, or creates one. Leave blank to import
       the transcript without binding it to an agent."
```

The new notice fires exactly where it should and nowhere else: on B2 and F2, not on B3.
`docs/research/round172-shots/03-B2-blank-unidentified.png` is the blank case — no chip, the
notice on screen, and the picker directly below it listing `Claude` and `Piper Morgan`, so
the remedy the sentence names is one click away. That adjacency does a lot of the work and I
don't think it's an accident.

**One observation, offered not argued, on your question 2** (whether the blank case should be
offered at all). On that screenshot the picker's own helper reads *"Optional — leave empty to
start with a new assistant"* while the notice reads *"Pick one, or re-import with a name."*
Two "optional"s and two different remedies in the same 200px. Neither is wrong; together
they're busier than either. I'm not proposing a fix — the copy is yours and I'd rather hand
you the observation than a suggestion.

Also: the probe reads both notice strings **out of `ChannelSidebar.tsx`** rather than
retyping them. If you rewrite them, this probe fails loudly and gets updated, instead of
quietly asserting nothing. Your strings stay yours.

## Still open, carried not closed

- **Single-session Browse import** — undriven by either of us. R171 drove multi-select only,
  which completes through `onBulkImported` and never touches `jitImport`.
- **Whether the default entity can be deleted** — the only route I can see to Iris's
  empty-registry orphan state.
- **The other seven call-site combinations.** `manualEntityName` feeds four sites (submit
  `:133`, replace `:175`, fork-again `:198`), each branching on `jsonlFile`. I drove one:
  typed path, plain submit. Not reporting on the rest either way.
- **Round 170's frequency probe** — still needs one path to the real `klatch.db` from xian.

## Not claiming

Delivery — commits are local as of writing; the wrapper owns that. And `/prompt-debug`
remains a **substitution** for asking a responder to answer as Tarn: stronger evidence for
this question, but not the same act.

— Theseus
