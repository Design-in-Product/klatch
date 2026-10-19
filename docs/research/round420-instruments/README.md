# Round 420 instruments — grading Daedalus's Round 419

Theseus, 2026-10-19 WORK fire. Grading rev: `ee37abae` (his) at `501710c3`/`9aa2ffca` (mine).
Input for every changelog key: `.testdata/round419-sdk-changelog.md`, sha256
`d400af1d16903a5604d18343018ea8c2a9858de907e92f68f46f859fc7309391`, 3524 lines — fetched in this
fire with **his own** `fetch-changelog.mjs` and byte-identical to his published digest, so no
disagreement below is about the file.

## `drive-his-419.mjs` → `drive-his-419.out`

Drives his four instruments unmodified, from the repo root and from their own directory, and diffs
each live output against the output **extracted from his commit** (`git show`, not read off disk —
two of his instruments rewrite their own `.out` when driven). Restores his `.out` files afterwards.

```bash
node docs/research/round420-instruments/drive-his-419.mjs
```

**His headline figures all reproduce here:** denominator **191**, Klatch-reachable **32**,
behavioural **29**, `UNMODELLED` **98 → 90**, `GATE: true`, `PREDICTIONS: 3 landed, 1 refuted`.
All four are cwd-independent (same exit code from both cwds).

Normalisation rules are printed, and a CONTROL asserts the normaliser erases the volatile line while
preserving a non-volatile difference — so a diff of 0 cannot be the normaliser eating a real one.

## `his-old-cell-is-keyed-on-head.mjs` → `his-old-cell-is-keyed-on-head.out`

**GATE true, 7 predictions landed, 0 refuted.**

His Round 419 §5 presents a 2 × 2 and names what makes it evidence: *"the old cell is measured, not
asserted."* `grade-the-417-repairs.mjs:63` sources that old cell from `git rev-parse HEAD`, into a
variable named `prevRev`. Measured:

| | old cell reads | exit | verdict |
|---|---|---|---|
| his instrument unmodified, at my HEAD | `threw ENOENT: **false**` | 0 | `GATE: true`, `charge 1 cleared` |
| same, rev pinned to the property-derived `e2759907` | `threw ENOENT: **true**` | 0 | `GATE: true`, `charge 1 cleared` |

`oldThrew` appears in 2 lines: **1 inside `say()`, 0 inside `gate()`**. His own line 72 writes the
hazard out in prose — *"(if this reads false, the repair is already committed at that rev and the
OLD cell is unmeasurable from it)"* — where the gate should be. **His claim is true** (my own
Round 420 grader reproduces that the old spelling threw); the leg that proves it is dead from the
commit that landed the repair onward.

The cure is the derivation this instrument uses: pick the newest rev in the graded file's own
history whose blob **carries the defect needle**, refuse if none does, gate that the newest rev does
not — then `gate()` the old cell instead of printing it.

## `grade-the-418-repair.mjs` → `grade-the-418-repair.out`

**GATE true, 8 predictions landed, 0 refuted.** The 2 × 2 for the repair his §4 routed to me; see
`docs/research/round418-instruments/README.md` for the repair itself.

## `tool-surface-is-a-scope-label-not-a-censused-surface.mjs` → `tool-surface-scope-leg.out`

**GATE true, 3 predictions landed, 0 refuted.** Gated on reproducing his 191/32/29 before anything
else runs, so it grades his key and not my copy of it.

1. **My own hypothesis, refuted and recorded.** I expected his `hasEventName` key to over-report via
   the bare English word `text` (censused from `stream.on('text')`). At **his** spelling: **0 hits
   in 191 bullets**. The reason is one character — `hasEventName` is the one key in his instrument
   built without an `i` flag. The near-miss is still worth a sentence: the single row an `i` flag
   would admit is `**api:** mark the Text Completions API as deprecated`, and his `FOREIGN-SURFACE`
   bucket keys `\bcompletions\b` specifically to exclude it — but that bucket is at precedence 9 and
   `STREAM-EVENT-NAME` is at 7, so the exclusion would never be consulted. Measured, not argued.
2. **`TOOL-SURFACE` is keyed on a changelog scope label, not on a censused surface.** His docblock's
   first design claim is that the key is derived from Klatch source rather than named by him. His
   step-1 census finds `beta.messages.stream`, `messages.stream`, `messages.create`, `models.list`,
   `stream.on(...)`, `stream.finalMessage()`, `stream.abort()` — **no tool-runner surface**, and his
   own memo says Klatch hand-rolls its tool loop. But `hasToolSurface`'s first alternative is
   `^\s*\*\s+\*\*tools?:\*\*`, the changelog's scope label, and `TOOL-SURFACE` is the joint-largest
   first-bucket claimant of the 29 (8 of 29).
3. **The counterfactual, driven.** Drop the scope leg, keep only the census-adjacent legs
   (`tool-runner`, `tool input`, `tool_use`, `tool_changes`): **32 → 27 reachable, 29 → 24
   behavioural.** 6 rows are scope-leg-only; 5 are lost, 1 survives because `COMPACTION` also claims
   it — reconciled in the output rather than left as two numbers that don't add up.
4. **Every tool-runner identifier those rows name occurs 0× in Klatch non-test source** at a stamped
   rev, selected with `ls-tree` (never `ls-files`): `tool runner`, `tool-runner`, `addTools`,
   `compactBeforeNextTurn`, `agent-toolset`, `transformJSONSchema`, `betaTool`, `runTools`,
   `toolRunner`. Under a **confusion matrix**, not a known positive: `beta.messages.stream` and
   `finalMessage` must be found (TP 2, FN 0), `completions.create` and a nonexistent token must not
   (TN 2, FP 0).

**What is not claimed:** that those 5 rows cannot affect Klatch. "Klatch does not name the SDK
tool-runner" is a source fact; whether a change to it reaches Klatch through shared code inside the
SDK is not reachable from a source read, and is left `UNMEASURED`. **29 is a ceiling under his
published key; 24 is the ceiling under the census his docblock says the key comes from.** Neither is
a floor — `UNMODELLED 90` remains the floor on the key's blindness, and his §3 is right that it is
published as a floor and not as a count of things that do not matter.
