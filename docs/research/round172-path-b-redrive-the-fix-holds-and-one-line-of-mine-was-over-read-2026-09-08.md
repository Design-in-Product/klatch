# Round 172 — Path B re-driven after the Round 171 fix: the fix holds, and one line of my own report was over-read

**Theseus · 2026-09-08 (MID fire) · browser-level drive, zero model calls**

- **Instrument:** `scripts/probe-round172-path-b-confirm-step-redrive.mts`
- **Under test:** Daedalus's Round 171 fix, `70b9ba1` (`docs/ux/round171-manual-import-identity-fixed-2026-09-08.md`), on top of Path B (`32e00a0`)
- **Working tree at run:** `bc044e5`
- **Result:** **29/29 regression checks pass, 25 measurements.** Zero open items failing.
- **Screenshots (repo copies):** `docs/research/round172-shots/` · full set under `.testdata/round172-confirm-step/shots/`

---

## Why this round exists

Daedalus asked for it by name, in
`docs/mail/daedalus-to-theseus-iris-cc-janus-calliope-argus-xian-you-found-it-and-i-took-both-shapes-2026-09-08.md`:

> "App's *wiring* to `resolveJitSeat` is still typecheck-and-hand-read — the decision is
> tested, the call site isn't. If you have an arm to spare: re-run your arm B and arm F."

Round 171's arm B drove exactly one case, because the field it now drives did not exist.
The fix turns that one route into four distinguishable outcomes, and the two worth the most
are not the happy path — they are the branches a *careless* version of this fix breaks.

`resolveJitSeat` refuses `DEFAULT_ENTITY_ID` when it arrives via the channel fallback. Place
that guard one branch too high and it also refuses a user who deliberately **typed** the
default agent's name. Place it one branch too low and it refuses a **legitimate** recovery
on the duplicate path. Daedalus pinned the first in a unit test and named it as the thing
he'd expect to break. Neither is driven at the endpoint anywhere in the repo.

## Arms

| arm | input | outcome |
|---|---|---|
| **B1** | manual path + typed name "Piper Morgan" | seats `Piper Morgan`; chat binds that entity |
| **B2** | manual path + **blank** (Round 171's exact input) | seats **nothing**, shows the unidentified notice |
| **B3** | manual path + the literal `"Claude"` | **still seats Claude** — a choice is not a placeholder |
| **F1** | duplicate of a **named** import | channel fallback still recovers `Wren` |
| **F2** | duplicate of an **unnamed** import | unidentified notice, no `Claude` chip |
| **K** | Path B into a **klatch** | the imported conversation reaches the assembled prompt |
| **S** | isolation + cleanliness guards | scratch DB, synthetic session tree, both asserted |

## What the drive found

### The Round 171 defect is closed, at the endpoint, on both routes

```
MEAS [B1] what the form seated after a NAMED manual-path import — chips=["Piper Morgan"] · notice=null
PASS [B1] a named manual-path import seats the agent that was named — (Round 171 got ["Claude"] here)
MEAS [B1] the composed chat resolves to — entityId=34c34133-… entityName="Piper Morgan"

MEAS [B2] what the form seated after a BLANK manual-path import —
          chips=[] · notice="Imported — the session didn't name an agent. Pick one, or re-import with a name."
PASS [B2] it does NOT seat the shared default entity (the Round 171 defect)

MEAS [F2] after "View existing" on an UNNAMED import —
          chips=[] · notice="Imported — the session didn't name an agent. Pick one, or re-import with a name."
PASS [F2] the duplicate path no longer seats the placeholder as if it were an agent
```

Screenshot of the blank case: `docs/research/round172-shots/03-B2-blank-unidentified.png` — no
chip, the notice on screen, and the picker below it listing `Claude` and `Piper Morgan` so
the remedy the notice names is one click away.

### Both branches a careless fix would have broken are intact

```
MEAS [B3] what the form seated when "Claude" was typed deliberately — chips=["Claude"] · notice=null
PASS [B3] typing the default agent's name still seats it — a choice is not a placeholder

MEAS [F1] after "View existing" on a NAMED import — still in the form=true · chips=["Wren"] · notice=null
PASS [F1] the guard did not break legitimate recovery — the real agent still seats
```

B3 is the case Daedalus called out as "the thing a careless version of this fix would
break." It survives at the endpoint, not just in the unit test: typing `Claude` resolves
`matched-by-name` (`entity-resolve.ts:82-85`), which puts the id **on the import result**, and
`resolveJitSeat` treats an id that arrived with the import as an answer regardless of which
id it is (`jitSeat.ts:38`).

F1 is the mirror image, and the one that had no test at all. The duplicate path's
`ImportConflict` carries no entity, so App asks the channel — and here the channel's answer
is a real agent. The guard let it through.

### The pre-existing sidebar path is unchanged

`PASS [F1] outside compose mode the button still reads "Go to channel"` and
`PASS [F1] the sidebar import path still navigates to the imported channel`. The fix touched
a callback three entry points share; the standalone one still behaves as it did.

### Iris's copy, checked on screen rather than in source

```
PASS [B1] it is labelled Agent and marked optional — label reads "Agent (optional)"
PASS [B1] the field is empty on open (not pre-filled with a guess) — value=""
MEAS [B1] the helper line under it — "Matches an existing agent by name, or creates one.
          Leave blank to import the transcript without binding it to an agent."
```

Both notice strings are read out of `ChannelSidebar.tsx` by the probe rather than retyped
into it, so a copy edit by Iris surfaces as a probe that needs updating rather than a probe
that quietly stops asserting anything.

---

## The correction I owe on my own Round 171 report

Round 171's finding had three parts. Two were right. One I over-read, and I want it in the
record in the same place the original claim lives.

I reported: *"the imported session's identity marker is **absent from the assembled
prompt**"* — and presented it as part of the evidence for the binding defect. The
measurement was accurate. The reading was not.

`buildCarriedContextBlock` returns `undefined` unless `channel.type === 'klatch'`
(`packages/server/src/claude/carried-context.ts:304`). That scoping is deliberate and
documented in the function's own doc comment — carrying klatch content back into an agent's
1-1 is bidirectionality, open question 2 in `composition-continuity-gap-2026-07-19.md`, which
xian has not answered. Round 171's arm C composed a **Chat**. A 1-1 Chat cannot carry a
transcript *no matter which agent is bound*. The marker would have been absent there even
with the correct binding.

So that line was **over-determined**, and I read it as one signal pointing at one cause.

What this does **not** change: the binding defect was real and independently established —
`chips=["Claude"]`, `entityId=default-entity` at `prompt-debug`, and the mechanism traced
through five files. Daedalus fixed the thing that was actually broken. What it changes is
that one sentence of my write-up implied the imported conversation was being *lost*, when
what was demonstrated was that the wrong agent was being *asserted*. Those are different
severities and I stated the louder one.

I nearly compounded it: my first draft of this probe promoted that check from `open` to
`regression`, and it failed. The failure is what sent me to read `carried-context.ts`. Had I
left it as an `open` line it would have gone on quietly reporting red and I would have gone
on believing it meant something it didn't.

## Arm K — the arm Round 171 should have had

If layer 6 is the only thing that conveys an imported conversation, and layer 6 is
klatch-scoped, then the question *"does the imported session's own content reach the model"*
has an answer only in a klatch. It has never been driven through the composition gesture.

Driven now: New Klatch → "Import an agent" → manual path, name `Tarn` → seat → Create Klatch
→ `prompt-debug`.

```
PASS [K] Path B seats the imported agent in a klatch composition too — chips=["Tarn"]
PASS [K] the composed klatch was created — type=klatch
MEAS [K] layer 6 as prompt-debug reports it —
         "ACTIVE — 2013 chars carried from \"Tarn\"'s other channels
          (2 message(s) from 1 conversation(s), no older history)"
PASS [K] the imported session's own text reaches the klatch's assembled prompt — marker present=true
```

**This is PREMISE.md's central claim, driven end to end through the composition gesture for
the first time.** You bring an existing conversation in from Claude Code, seat it in a
klatch you are composing, and the agent arrives carrying what it already said. Not inferred
from the code — 2013 characters of it in the prompt the API would be sent, with the
transcript's own marker string inside.

Screenshot: `docs/research/round172-shots/07-K-klatch-after-import.png`.

## What I am not claiming

- **Zero model calls.** Binding and carried context are read from `/prompt-debug`, which
  assembles the prompt the API *would* be sent and returns it unsent. No responder was ever
  asked to answer as the imported agent. This remains a substitution, and a strong one for
  this question — but it is not the same as watching a model behave as Tarn.
- **The `.jsonl` upload path, and the replace / fork-again paths.** The same
  `manualEntityName` feeds four call sites, not one: submit (`ImportDialog.tsx:133`),
  replace (`:175`), fork-again (`:198`), each branching on `jsonlFile` to either
  `uploadClaudeCodeSession` or `importClaudeCodeSession`. I drove **one** of the eight
  resulting combinations — typed path, plain submit. The others are the same field and the
  same call shape, and I did not put a file or a conflict-resolution through any of them.
  Not reporting on them either way.
- **Single-session Browse import.** Still undriven by either of us — Round 171 drove
  multi-select only, which completes through `onBulkImported` and never touches `jitImport`.
  Carried forward, unchanged.
- **Whether the default entity can be deleted** — the only route I can see to the
  empty-registry orphan state Iris was asked about. Still unchecked.
- **Delivery.** Commits are local as of writing; the wrapper owns delivery.

## Isolation

`KLATCH_DB` on a scratch file under `.testdata/`, `CLAUDE_CONFIG_DIR` on a synthetic session
tree — the second because this probe drives the dialog's own Browse scanner, which without
it would enumerate xian's real `~/.claude/projects`. Arm S asserts the scan count equals the
fixture count written (`totalSessions=1`), so the isolation is checked rather than trusted.
`git diff --stat -- packages/` unchanged across the run.

Two browser console errors, both `409 (Conflict)` — those are arms F1 and F2 deliberately
re-importing an already-imported session. Expected, and accounted for.
