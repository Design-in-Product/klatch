# Round 353 — the routed wording fix is landed as a FIXTURE, and his own key scores `undefined` against a stale table

**Daedalus, 2026-10-08 WORK fire.** Baseline `origin/main` at `0156511a`, worktree clean at fire
start. Round 352 (Theseus) routed one item to this seat: F10's narrowed reason misnames F9's own
predicate. This round lands it, converts it from prose into a graded fixture, reproduces every
Round 352 figure under its own key, and reports one defect found in the instrument that carried the
finding.

Commit author checked with `%an` (Round 326), and the check earned itself immediately — my first
draft of this line attributed two of the five to the wrong seat from memory. Read at the source:
`0156511a` **Calliope (Klatch)**, `6fdbe294` **Pard (Mediajunkie)**, `41a37f79`/`b536fd03`/`f35e80e8`
**Theseus (Klatch)**. **None of the five are mine**, and three of them are in a shape I write.

---

## 1 — Round 352 reproduces whole, re-driven rather than read

Theseus's key is committed and re-drivable at `docs/research/round352-valuation-leg-key.mjs`. Driven
from its committed path **before any edit of mine**:

| His figure | Mine | Match |
|---|---|---|
| 6 grades, all `true` | all 6 `true` | ✓ |
| population 194 code files under `scripts/` (`readdirSync` walk) | 194 | ✓ |
| offsets preserved on every file | `true` | ✓ |
| assign-leg class = 11 members | 11 | ✓ |
| member lists: live class === declared hand reading | `true` | ✓ |
| crude leg wrong on **2 of 11** — `round269:621` `HOISTED_TERNARY_SITE`, `round269:825` `HOISTED_KP`, both `array` by hand | same two, same names | ✓ |
| (A) crude vs code-paren leg disagree on **1** — `round269:992` `SWALLOW_KP` | same | ✓ |
| (B) crude leg calls **6** label-valued | 6, same member list | ✓ |
| `'MEAS (inner)'` is OUTSIDE the class (unreachable) | `gradeUnreachable` `true` | ✓ |

**No discrepancy.** His §4 decomposition also holds at source: 4 label + 4 call (`:428`, `280:476`,
`281:221`, `282:617`) + 3 array (`:621`, `:825`, `:992`) = 11, no residue, and my Round 351 `0 of 3`
is untouched because the valuation leg is only ever applied to the three non-bare **paired** members.

## 2 — His §2 is correct at source, and now it is DRIVEN

Read at the line rather than inferred. `hoistedTagSites`'s assign leg (`:780` as the file now
stands; all other line numbers in this section are **pre-edit**, which is where I found them) is:

```ts
if (!/['"`]MEAS['"`]/.test(rhs)) continue;       // quote-delimited: MEASURED cannot match
```

That is the whole RHS requirement. **There is no valuation test anywhere in the leg.** The phrase
*label-valued, bare, `console.log`* stood in two places — the F10 docblock at `:921` and F10's
**detail string** at `:1039` — and named 4 of the 11 members F9 admits.

Both are corrected to his wording: *a swallowed site is one whose RHS carries a quote-delimited
`MEAS` before the first `;`, interpolated BARE into a code `console.log`*. The docblock also records
why the term travelled: the Round 348 correction landed as a fact about **his key** and not as a fact
about **F9's predicate**, so it did not move the twenty lines from `:943` up to `:921`.

**A wording fix cannot fail, which is why this one did not stay a wording fix.** `HOISTED_KP` now
carries a third known positive — `round280:476`'s live neighbourhood with **only the emitter's span
varied** from `${meas.length}` to bare:

```ts
"const meas = rows.filter((r) => r.outcome === 'MEAS');\nconsole.log(`${meas} [A] measured arms`);",
```

This is CALL-valued, not label-valued. Driven through the **landed detector itself** (not a copy of
its leg): F9 reports `3 known positives … all flag=true`. A future narrowing of this predicate back
to label-valued now reds F9 instead of being merely wrong in prose. The span is varied and the
valuation is not, which is the same discipline Round 339 forced on his dimension-7 row.

The fixture does **not** mint a 12th assign-leg member: `HOISTED_KP`'s RHS is cut at the first `;`,
which falls inside element 1, so adding element 3 is invisible to the leg. Confirmed — the class is
still 11 after the edit.

## 3 — The defect: his key scores `undefined` against a stale table, and prints a figure anyway

Adding a fixture moved two members down — `HOISTED_KP` `:825 → :834`, `SWALLOW_KP` `:992 → :1017`,
both re-read at source. His member-list guard **fired correctly**, as designed:

```
MEMBER LISTS: live class === declared hand reading: false
  live only: …:834, …:1017
  hand only: …:825, …:992
```

**And the score below it still printed `wrong on 2 of 11` — the same figure as the clean run.** The
mechanism, read out of his key rather than guessed at:

```js
const h = handOf.get(`${m.file}:${m.line}`);
return m.crude !== (h === 'label');
```

For a moved member `handOf.get()` returns `undefined`; `(undefined === 'label')` is `false`. So an
**unscored** member is counted as *wrong* whenever the crude leg says label-valued and as *right*
whenever it does not. A stale table therefore moves this figure in **both** directions silently. It
read 2 here only by coincidence — one true miss (`:621`) plus one `undefined` mismatch (`:834`). Had
`:621` moved too, the figure would have stayed 2 with **both** entries unscored.

This is my own Round 352 §2 argument turned on the key that carried it: the thing a reader sees is
the figure, not the guard line printed above it.

**Cure, landed in his file:** the score now **refuses** rather than printing beside a mismatch —
member lists unequal ⇒ `CRUDE LEG vs HAND READING: REFUSED …` and `process.exit(2)`.

Graded both ways before being believed, in a gitignored scratch copy at the same directory depth
(Round 332), with the mutation anchor asserted to occur exactly once first (Round 347):

- **KP (stale table):** one HAND line number mutated `:834 → :835` ⇒ **exit 2**, `REFUSED`, **no
  score printed**.
- **KN (clean copy, same depth):** **exit 0**, all 6 grades `true`, class 11, `wrong on 2 of 11`,
  (A) 1, (B) 6 — so the refusal is not an artifact of running from the scratch path.
- **Real key at its committed path after reconciliation:** **exit 0**, every figure above restored.

I edited another seat's instrument. The line-number reconciliation was caused by my own tree edit and
is maintenance his guard demanded; **the refusal is a design change to his key and is routed back for
his call** — revert it if he disagrees, the figures do not depend on it.

## 4 — Gate, exact to his

| Leg | Result |
|---|---|
| `tsc -p packages/server --noEmit`, own file | rc 0, **0 bytes** |
| `tsc -p packages/client --noEmit`, own file | rc 0, **0 bytes** |
| `npm test`, unpiped to a file, ANSI-stripped | rc 0 — server **140 files / 2178 passed / 1 skipped (2179)**; client **26 passed \| 13 skipped (39) / 333 passed \| 13 skipped (346)**; `CENSUS OK`, `census PASSED` |
| `probe-round269` alone, exit code via `spawnSync` | **EXIT CODE = 0**, `All 56 regression checks passed, 3 measurements, 0 skips`, F9 **PASS**, F10 **PASS** |
| F9's derived line | byte-identical to Round 351/352 — **4 sites / 194 files**, same four pairs |
| Full sweep, read by its **verdict line** | **exit 2** — `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred` |

The pin did not restage: `sweep-probes.mjs:439` is `expect: /All 56 regression checks passed/`, read
at the line. A COUNT pin, and the count did not move — a known positive added to an existing array is
consumed by one existing check.

`npm test` is not the sweep gate (it drives zero probes and says so in its own output); the sweep was
run separately, as above.

## 5 — Ports, with a before-reading this time, which settles his :8080 item

`lsof` is not permitted in this session, so this is the `probe-server-ownership` lib instrument.
**Before** the sweep and **after** it, all six readings are identical:

| Port | accepts | wildcard bind would succeed |
|---|---|---|
| 3001 | true | false |
| 3002 | false | true |
| 4001 | false | true |
| 4100 | false | true |
| 4321 | false | true |
| 8080 | true | true |

Two things follow. **The sweep leaked nothing** — after equals before on all six. And **Theseus's
unattributed `:8080` loopback-only occupant is not a sweep leak**: it was already there before this
fire's sweep, which is what his fire could not say for lack of a before-reading. Whose process it is
I do not know and cannot find out without `lsof`, so that part stays unattributed.

`:3001` is occupied — `accepts=true / wildcardBindWouldSucceed=false`, consistent with both prior
rounds. The PID-level read (47533, xian's dev server) is **Round 351's, carried as mine from that
round and not re-derived here**. `probe-round225` BLOCKED is this occupant, as in the last three
rounds.

## 6 — Limits

- Rows 1–6 of the dimension table are still **Theseus's Round 350 measurement, attributed and not
  re-derived**. Six fresh keys returning 0 is the exact shape my own false zeros have taken.
- The four declared sites and the **109 DEFERRED** probes were not driven. Promotion is a deliberate
  per-probe path, not a sweep flag.
- `array` remains a **hand** class in his table and I am not proposing a third column either. The
  leg is correct on 7 of 7 members it is ever applied to.
- His §3 limit — the crude valuation leg is wrong on 2 of 11 and a code-aware paren leg already
  disagrees on a third — is **recorded, not cured**. Re-key before the leg is pointed at a wider
  class. No arm today: the leg is never applied to any member it gets wrong.
- The fixture I added lives in `scripts/`, so it IS in the population it is measured against — by
  design, and the reason it is safe is the same one Theseus gave for keeping his key out of
  `scripts/`: the assign leg sees it, the emitter leg does not, because a `console.log` inside a
  string literal is not code. That is asserted by his own `KN_FLAGS_ASSIGN_LEG_ONLY` split, which
  still grades `true`.

**Nothing in this round needs xian.** Argus's 10/06 Laya/AAXT memo to the CIO remains the one thread
parked on his scheduling call.
