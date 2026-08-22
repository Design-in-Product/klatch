# Round 74 — my own fix sent the operator to the wrong file, and two corrections to Round 72

**Theseus · 2026-08-22 (WORK fire) · zero API calls, zero live runs, no server started**

**Changed:** `scripts/lib/recall-tap.mjs` (the `UNREADABLE_SUMMARY` console line), the comment and
assertions in `round71-probe-tap-joins-the-wire-to-the-artifact.test.ts`, and a marked correction in
`round72-the-unknown-branch-is-reachable-today-2026-08-22.md`. No test added; three assertions added
to an existing test. Suite count unchanged at **1421**.

---

## 1. The defect, and it is in the fix I shipped six hours ago

Round 72 (mine, this morning) added `TAP_VERDICT.UNREADABLE_SUMMARY` so the tap would stop telling an
operator "no frame reached them" about rows whose frames the same run had captured. The fix was
right. The console line it introduced ended:

> The raw arguments the model sent ARE in this run's JSON (`tapInput`) — adjudicate from those, not
> from the summary. **Producer-side grammar drift is the likely cause.**

That last sentence is disproved by the *other half of the same commit*. Round 72's §2 measured that
the `unknown` branch fires on **today's producer, unchanged**, because `readExpandArg`
(`client.ts:599`) accepts any string name and any number position where `EXPAND_SUMMARY`
(`recall-call-kind.mjs:72`) requires a non-empty name and non-negative integers. Three of five
sampled argument shapes classify `unknown` with no reword anywhere.

So the only diagnostic sentence the operator gets points at the summary grammar in `client.ts` —
the cause that requires a future change — while the cause reachable now sits in the `tapInput` bytes
the same sentence just told them to open. It is the same failure mode as the defect Round 72 fixed:
the console names one cause with confidence and the operator stops looking. I found it while
verifying Daedalus's §3 correction, not by rereading my own commit, which is worth saying.

**This is not the change set I refused.** Round 72 §5 and Round 73 §1 defer four producer-side
changes to a round boundary. This is none of them: it changes no count, no verdict, no routing, and
no classification — it is the instrument's own console prose, in a function this fire's predecessor
already rewrote. If it required a producer edit I would have deferred it too.

## 2. The fix

Name both causes, argument-first, and hand the operator the discriminator instead of a guess:

> Two causes produce this and they need different responses. Check `tapInput.expand` **FIRST**: a
> **LOOSE ARGUMENT** the model sent (an empty or blank conversation name, a negative or fractional
> position) renders into a summary the classifier cannot parse with no producer change at all. Only
> if those arguments are well-formed has the producer's summary grammar drifted.

**The discriminator is stated, not computed.** Deciding in code whether `tapInput.expand` is
well-formed would mean reimplementing `readExpandArg` inside the tap — the Round 58 rule, and the
one-source-read-twice error the whole join exists to avoid. The tap hands over the bytes and the
test to run on them, and stops. Same restraint as `resolvedByTap` not moving in Round 72.

## 3. Three controls, run not argued

| Control | Mutation | Result |
|---|---|---|
| A | Restore the Round 72 sentence verbatim | **red** — `expected -1 to be greater than -1` |
| B | Name only the loose argument; delete the drift clause — *the lazy fix* | **red** — `expected -1 to be greater than 340` |
| C | Name both, drift first | **red** — `expected 335 to be greater than 365` |

B is the one worth having. The obvious over-correction is to swap one confident cause for the other,
which reads as a fix and loses a real cause: grammar drift remains the right diagnosis once the
arguments check out. The assertion is deliberately an *ordering* (`driftAt > argAt`), not
`not.toContain('grammar')`, so both the old text and its mirror-image fail.

Fourth instance in this arm of the pattern Daedalus named in Round 73 §5: the control, not the test
naming the finding, does the work.

## 4. Two corrections to Round 72, one from Daedalus and one to myself

**(a) His §3, verified and taken.** Round 72's doc and the Round 71 test comment both described
`{conversation: '', from: 12, to: 38}` as an expand the server "accepted and **executed**". It is
accepted by `readExpandArg` and then **refused** by the executor — `expandConversationRange` trims at
`claude/recall.ts:688` and returns the address error at `:713`. Read in the shipped file this fire,
not taken from his memo; his line reference (`:718-731`) points at the error body, the guard is `:713`.
The row that is accepted *and* executed is `from: -1`, which was already in my own table one row
down. Corrected in both places, marked as corrections rather than silently rewritten.

Nothing in Round 72's fix or assertions changes: both rows classify `unknown`, which is all the tap
turns on. What was wrong was the prose explaining why the row matters — and prose is what the next
reader reasons from.

**(b) A question I left open rather than closed.** `from: -1` is the stronger fixture for the Round 71
tap test — unreadable summary *and* eight real rows returned, so it exercises "the operator is
holding a successful expand the classifier cannot score." I have **not** swapped it in. Changing what
a test measures mid-round to make its comment truer is the same class of move as changing a producer
mid-experiment. Recorded in the test comment; whoever lands the change set can decide.

## 5. Daedalus's §4 finding, re-verified independently

His Round 73 §4: `expandConversationRange`'s continuation clause fires on
`shownRows < all.length || lastShown < to` (`claude/recall.ts:810` in the file as shipped, not `:793`),
so a `to` past the end of a conversation tells a **complete** answer it was truncated and offers a
continuation address that reads nothing.

I ran his Control A myself rather than accept the measurement — deleted the second disjunct, ran the
full server suite:

```
× tells a complete answer it was truncated when `to` runs past the end
Test Files  1 failed | 85 passed (86)
     Tests  1 failed | 1420 passed (1421)
```

Exactly one red, his own characterization test. Confirms his correction-to-himself: no test guards
the disjunct, so the one-line deletion is the whole fix, and his first draft's claim that deleting it
would restore a silent-truncation failure was wrong. Reverted; `git status --porcelain` empty before
any of this fire's edits.

**Agreed and not acted on.** It is item (4) in the change set, it belongs at a round boundary, and it
is his file's finding to land. I note the asymmetry he named and agree with his conclusion: his edit
deletes a false clause and mine would have altered routing, so his is the more defensible — and
"defensible" is the argument every mid-experiment edit has.

## 6. Verified this fire, not recalled

- `claude/recall.ts:688` (trim), `:713` (empty-name guard), `:810` (continuation clause) — read in
  the shipped file.
- `recall-call-kind.mjs:72` (`EXPAND_SUMMARY`), `recall-tap.mjs:368` (`readTapVerdict`'s `unknown`
  branch), `:401` (`adjudicated`), `:425`, `:462-467` — read this fire.
- Daedalus's four Round 73 tests: run green in the shipped tree before I touched anything (31 tests
  in `round56-recall-expand.test.ts`).
- Controls A/B/C in §3 and the §5 control: each mutation applied, suite run, output pasted above,
  mutation reverted.
- Suite after the final revert: **1421/1421 server** (86 files) — unchanged, because this fire added
  assertions to an existing test rather than tests. Typecheck clean across shared, server, client.
  `node --check` clean on `recall-tap.mjs` and `probe-recall-tool.mjs`.

## 7. Still open, and none of it moved this fire

**xian's, unchanged: the distance arm go/no-go.** `F=17, L=20, G=8`, 80 rows, five opus runs. Third
consecutive fire across two agents to find defects in instruments and prose rather than in data. My
own sentence, now on its fourth outing and still true: *that is not a reason to run one.*

**The change set, parked on xian's and my sequencing call, not Daedalus's:** (3) `input_schema`
`number` → `integer`, (1) don't-touch `readExpandArg`, (2) loosen `EXPAND_SUMMARY` — in that order,
one commit, at a round boundary — plus (4) the continuation-clause deletion, independent of the other
three.

Also open and not mine: per-condition reporting; the K-vs-J miss case; the 0/12 non-expansion path;
the per-run JSON ruling, option (2), the backfill.

Nothing here requests spend. Nothing here was spent.

— Theseus
