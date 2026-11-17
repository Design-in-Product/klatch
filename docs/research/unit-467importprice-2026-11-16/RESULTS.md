# unit-467importprice — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-16 STOP · **Arm:** A, two drives
**Pre-registration:** `PRE-REGISTRATION.md`, pushed to `origin/main` as **`81ea947e`** before
`arm-importprice-a.mts` existed. Arm + both drives: **`69650467`**.

| drive | verdict (verbatim from the captured file) | `.err` |
|---|---|---|
| 1 | `VERDICT/1 RED legs=10 red=[A1] refused=[] preds=6 refuted=[P2,P3] prefused=[]` | 0 bytes (`wc -c`) |
| 2 | `VERDICT/1 ok legs=12 red=[] refused=[] preds=6 refuted=[P3,P5] prefused=[P6]` | 0 bytes (`wc -c`) |

Drive 1 is **kept, not discarded**: its red is a defect in this seat's own reader and it is the more
useful half of the unit. Drive 2 is the measurement.

---

## §0 THE ANSWER: an import-route detector prices at ZERO over today's 155

Candidate cure, keyed on the **call** and not the import:

```
/\b(streamClaude|streamClaudeRoundtable)\s*\(/
```

with both names **derived from `packages/server/src/claude/client.ts` in the run**, not typed:
`direct=[streamClaudeCore]` (the function that owns `messages.stream`), `one-hop` inside the same
file `=[streamClaude,streamClaudeRoundtable]`, intersected with the file's exports.

**Measured price over the 155 probe files under `scripts/`: `hits 0 file(s) · movers 0`**
(`drive2.arma.out`, `PRICE —` block). `P4` **LANDED**.

Price is a **bucket** count, not a grep count: a mover is a file that matches the key **and** is in
the drivable pool (`DEFERRED`, not in `SWEPT`, both imported from `scripts/sweep-probes.mjs`)
**and** carries no non-exemptible hazard today (`EXEMPTIBLE = {db, homedir}`, read off the subject)
**and** is not literal-only. At zero hits the question does not arise, but the ladder is in the code
so the next re-run reports in the same currency Argus used for the `stream` widening
(`not driven (model): 12` both times).

**So this is the same shape as the `stream` widening and can be taken on the same terms:** it moves
no file today, and it closes `unit-467importroute`'s `B1` gap for the **direct** route — the probe
that imports `streamClaude` from `client.ts` and calls it. `A4b` re-measures that gap under the
subject's live detectors this fire: `hazards(import+call fixture) = [(none)]`.

Routed to **Argus** — `scripts/promote-probes.mts` is his file. `A9` asserts
`git status --porcelain packages scripts` **empty** on both drives; nothing under `packages/` or
`scripts/` was touched by this unit.

## §1 `P3` REFUTED, and the refutation is in the cure's favour

I predicted the model-reaching export surface would be **wider** than the pair
`unit-467importroute`'s `B1` hand-typed (`|S1| >= 3`). It is **exactly that pair**: `|S1| = 2`,
symmetric difference **EMPTY**. An independent derivation from source agrees with the hand-typed
names member-for-member — so `B1`'s hand key was not narrow, and a two-name alternation is the whole
direct surface rather than a sample of it.

## §2 `P5` REFUTED at zero — and the zero is MY KEY'S DECLARATION FORM, not the product

`S2` (other `packages/server/src` modules exporting a function that calls an `S1` member) came back
**0 names over 45 non-test `.ts` files**. Taken at face value that would say no product module
routes to the model except `client.ts` itself. **That is false, and here is the hand read that says
so** — labelled post-hoc, not a leg, run after drive 2:

```
$ grep -rn "streamClaude" packages/server/src | grep -v __tests__ | grep -v "claude/client.ts"
routes/messages.ts:17   import { streamClaude, streamClaudeRoundtable, … }
routes/messages.ts:113,137,174,254,290   five call sites
routes/files.ts:22      import { streamClaude, streamClaudeRoundtable }
routes/files.ts:189,200                  two call sites
```

**Two product files, seven live call sites.** `fnsOf` matches one declaration form —
`export? async? function NAME(` — and a Hono route body is an **arrow callback inside a route
registration**, so every one of those seven sites is invisible to it. `S2 = 0` is a property of the
reader, measured here, and the cross-file hop is therefore **unmeasured, not absent**.

Two consequences, stated separately because they are different:

1. **The `P5` zero carries no information about the wider price.** Do not quote it as "no probe
   reaches the model through a product module." The right next measurement keys the hop on the
   **file** (which modules contain an `S1` call at all → 2) and then on **what those modules
   export**, and asks how many of the 155 import from them.
2. **It does not weaken §0.** The `S1` key and its zero price are derived and graded independently
   of `S2`; `P4` rests on `A1`/`A2`/`P1`/`P2`, none of which touch the cross-file hop.

`P6` is **REFUSED, exactly as registered** — with an empty match set, "at least one match is
literal-only" is unsatisfiable, not false. The floor fired because it was written in before the
numbers existed.

## §3 FINDINGS AGAINST MY OWN INSTRUMENT — the whole of drive 1

**(a) An alternation assembled from an EMPTY array is not empty; it is SATURATED.** Drive 1's `S1`
came back `[]`, so `buildKey` produced `/\b()\s*\(/`, **which matches every call in every file**.
The run then reported, with a straight face:

- `S2` = **141** exported names drawn from 33 server modules,
- **56 of 155** probes "hit",
- **23 drivable-and-clean "movers"**, each printed with a file, a line and a hazard list.

Twenty-three named movers is exactly what a real finding looks like in this corpus. Every one is a
phantom. `A2c` now measures the mechanism rather than asserting it
(`new RegExp('\\b()\\s*\\(').test('anythingAtAll(') === true`), and `buildKey` **throws** on an
empty array instead of returning a saturated key (`A2b`).

**(b) The leg written to prove the key was not hand-typed passed on the saturated key.** Drive 1's
`A2` compares `KEY.source` against the alternation rebuilt from the derived array — and `\b()\s*\(`
rebuilt from `[]` matches itself. The leg's property ("assembled, not typed") was **true**, and the
key was still worthless. Provenance and content are different claims about a key, and only one of
them was under a leg.

**(c) The known positive LANDED VACUOUSLY, and only the two-sided negative control caught it.**
Drive 1's `P1` — *"the key fires on the import+call fixture"* — was **true**, because the key fires
on everything. The KP alone would have blessed the saturated key. **`P2`, the negative control, is
what reddened** (`fires on import-WITHOUT-call fixture = true`, REFUTED), and `P2` exists only
because "an import is not a call site" had to be written as a leg rather than trusted as a habit.
This is the first time in this seat's units that the *negative* limb of a two-sided control has
caught a live defect instead of confirming a known one.

**(d) The root cause, repaired in place with drive 1 kept.** `bodyFrom` took the first `{` after the
declaration. In every annotated signature in this codebase that `{` is a **parameter type literal**
(`opts: { … }`), so the extracted "body" was a parameter type and `messages.stream` was never inside
it. Repair: paren-match the parameter list, then take the first `{` after its closing `)`. Drive 2's
`A1` prints the derivation in full so the next reader grades it rather than trusting it.

## §4 Declared limits, carried

- **One hop at each level.** A probe → module X → module Y → `S1` route is not measured. Named, not
  claimed absent.
- **`fnsOf` reads one declaration form** (`function NAME`). Arrow consts, class methods and object
  literal methods are invisible to it — §2 is the measured instance of that, and it is this unit's
  largest blind spot.
- **`blankStrings` is mine, not the subject's `stripSource`** (which is not exported). It does not
  model nested template interpolation, so a `literalOnly` value here is a **report**, never a graded
  leg.
- **`P3`'s grading is contaminated and this is the disclosure.** `P3` was registered in `81ea947e`
  before the arm existed, but I then ran `grep -n "^export…" packages/server/src/claude/client.ts`
  **to write the reader's parser**, and that output showed the export list — so `P3`'s outcome was
  visible to me before the arm ran. The prediction stands as registered and the drive grades it; the
  call is recorded as contaminated rather than claimed clean. *A grep run to build a reader can leak
  the answer to a prediction already on the board.*
