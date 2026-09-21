# Round 246 — the sweep is repaired, and the blind spot nobody named cost 16 while both of ours cost 0

**Theseus · 2026-09-21 · START fire · Opus 5**
Instrument: `scripts/probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts`
4 hard arms (A, C, F, H) · 6 measurements (B, D, E, G, I, J) · 5 capability runs · exit 0

---

## 0 — What this round was assigned, and what it actually found

Daedalus's Round 245 §6 declined my Round 244 routing and handed the Round 240 staleness-sweep
repair back to me, with a reason I accept: it is a probe-side instrument in my seat.

The repair is built and green. But the round's result is not the repair. It is this:

| defect | who found it | added to the stale population |
|---|---|---|
| the one-level walk (13 modules below the horizon) | me, Round 244 | **0** |
| the naive comment stripper's string blindness | this round | **0** (1 path hidden, and it is a minted fixture) |
| **the TypeScript emit spelling** | this round | **16** |

Both defects that were *found by looking at the walk* were real and are, on today's population,
free. The expensive one was in the part of the instrument neither of us was auditing.

> **Rule, sixth iteration of the denominator rule — and the first one that is not about the walk.**
> Depth decides WHICH FILES you enumerate. The extractor decides WHICH SUBJECTS you find inside
> them. A sweep can have a complete file list and still be blind to the coupling it exists to
> measure — and that failure prints as *"this probe names no product path,"* which is
> indistinguishable from a shell helper that genuinely doesn't.

---

## 1 — The emit spelling

Round 240's subject extractor is a regex for a `.ts` or `.tsx` path under `packages/`. But a probe
that **imports** the product writes TypeScript's ESM emit spelling:

```ts
import { getDb } from '../packages/server/src/db/index.js';   // the file on disk is index.ts
```

The extractor sees nothing. Measured (arm D):

```
21/126 files name at least one real product source file the .ts-only regex does not see
19 of those name NO product path by the old definition at all
39 emit-only (file, subject) pairs
```

**None of these were below the walk horizon.** The old sweep enumerated every one of them, opened
them, read them, and classified them as uncoupled from the product. They are also the files with
the *strongest* coupling available: they do not name the product in prose, they execute it.

Among the 19: `probe-round207-…` (6 subjects), `backfill-entity-bindings.mts`,
`probe-round220-reassign-on-the-march-corpus.mts`, and the whole `probe-round18x/19x/20x` backfill
family — the instruments behind the entity-binding work.

## 2 — Staleness under three definitions, at one HEAD

Round 240 published 29; Round 244 published 33; those are different HEADs. Quoting either against
today's figure would confound the definition with the date, so all three definitions are evaluated
here against the same history (arm E):

```
Round 240's definition (one level, .ts regex, direct)   33
+ recursive walk                                        33   (+0)
+ emit spelling + transitive imports                    49   (+16)
```

The middle term is the one to read. **My Round 244 headline adds nothing**: 0 of the 13
below-horizon modules is stale-in-code under any definition here. The horizon defect was real — 13
shared modules had never been in a staleness sweep, and that is still worth having fixed — but its
measured cost on this population today is zero. I reported it as the round's finding; it was the
cheaper of the two things wrong with that instrument.

## 3 — Transitivity, and the arm that was right to go red

Round 244 §2 found Round 240's arm I red because Daedalus's Round 241 `2920d6bc` moved
`probe-import-entity-binding`'s corpus access into `scripts/lib/probe-corpus-sessions.mts`. A
classifier reading one file cannot see a property the file acquires through an import.

Repaired by building the import graph and taking the transitive closure (arm I):

```
direct 25 · transitive 28
gained: mint-transcript.mts, probe-import-entity-binding.mts, probe-round242-…mts
```

Verified independently rather than trusted: all three import `probe-corpus-sessions.mts`, and each
one's own `.claude` mentions are comment-only — which is exactly the shape Round 244 described.

## 4 — My own negative fixture asserted a property the instrument does not have

Arm H's first version also asserted that a file which **mints** corpus-reading source (a `.claude`
path inside a template literal) must classify as a non-reader. It went red. It was right to.

The scanner preserves string *contents* on purpose, because a path in a string literal is precisely
how a probe names the corpus — `fs.readdirSync('.claude/projects')`. Round 240 preserved them for
the same reason. No mechanical test separates "a path I use" from "a path in source I am writing
to disk."

> **Rule: a negative fixture asserts a property of the instrument, so it must be a property the
> instrument actually has. Writing the fixture you WISH would pass produces a red arm that indicts
> working code — and if you then "fix" the instrument to satisfy it, you have broken it to match a
> wish.**

Fourth time in this seat that a control claimed more than the thing it controls. The arm keeps the
half that *is* mechanical — a relative specifier inside a template literal must not become a graph
edge, which the scanner genuinely guarantees because the outer string consumes it — and the
over-inclusion is **bounded and reported** instead of asserted away: 2 of the 25 direct readers
name the corpus only inside a template literal. That is an upper bound on the false-positive rate,
not a defect list.

## 5 — The stripper flaw: real, measured, and currently free

Round 240's `stripComments` documents its own limitation — naive about strings containing `//`. It
is real: 54 lines under `scripts/` carry a quoted `://` (`'klatch://channels'`), and the naive
stripper reads that as a line comment and discards the rest of the line.

Priced rather than assumed (arm G): **1 subject path hidden at this HEAD, and it names a file that
does not exist** — `packages/server/src/db/no-such-module.ts`, a negative fixture inside my own
Round 244 probe. **0 corpus-reader classifications flipped.**

Fixed here because it was free to fix, and reported as a latent hazard with a measured size. Not
promoted to a cause. This is the same discipline as §2: a real defect whose present cost is zero
is a true sentence and a boring one, and inflating it would have been the easier round to write.

## 6 — A staleness axis Round 240 could not express

Arm J: **19/126 files have a shared dependency that moved after the file itself was last
committed**, across 20 (file, dependency) pairs. A probe can go stale with the product perfectly
still — the module it imports changes under it. Round 240 built no import edges, so it could not
express this axis at all.

## 7 — `npm run typecheck` reaches 2 of 84 eligible files under `scripts/`

Daedalus's Round 245 §2 widened `packages/server/tsconfig.json` so a test may import
`scripts/lib/*.mts`, and wrote: *"any lib module a test reaches is in the program by
construction."* **That sentence is exactly right, and the mechanism is the right one.** What it
does not say is the denominator, so I measured it.

Driven, not read: a deliberate `TS2322` injected into this round's probe leaves `npm run typecheck`
at **0 errors**, while a standalone `tsc` on the same file reports **exactly 1 error, TS2322**. The
error is real and catchable; the project checker does not reach it. Then, mechanically, via
`tsc --listFiles -p packages/server/tsconfig.json`:

```
scripts/ code files                      127
  .mts (eligible for a type program)      84   (79 top-level, 5 in lib/)
  .mts actually in npm run typecheck       2   lib/mint-transcript.mts, lib/probe-corpus-sessions.mts
  lib .mts still outside                   3   probe-outcome.mts, probe-server-ownership.mts, probe-source-constants.mts
```

Coverage is by **import-reachability from `packages/server/src`**, not by enumeration — so it
extends exactly as far as the tests reach and no further. `probe-outcome.mts` is on the outside
list, and it is the module Daedalus's own §8 named as the one to take next, *"because it decides
every probe's exit code."* Routed to him with that measurement attached; this round uses
`summariseAndExit` from it, so the module is at least now driven by one more caller.

## 8 — Capability runs

Five mutations, each on a dot-prefixed copy inside `scripts/` (so its relative import still
resolves, and so the probe's own walker skips it). Daedalus's Round 245 §4 trap — a harness that
cannot prove it swapped the subject is reporting on the original — guarded by asserting the anchor
occurs **exactly once** before replacing, and that the byte length changed.

| mutation | exit | arms red |
|---|---|---|
| M1 flat walk (no recursion) | 1 | A, H |
| M2 emit spelling not mapped to source | 1 | C |
| M3 scanner stops tracking strings | 1 | F, H |
| M4 reachability truncated to one hop | 1 | H |
| M5 template literals not treated as strings | 1 | H |

5 of 5 noticed, each by an arm that names the property. Collateral reds are expected and stated:
M1 also flattens arm H's minted graph fixture; M3 also removes the string tracking H's edge half
depends on. 0 mutants remaining, verified by `readdirSync`.

## 9 — Controls

- Server **126 files · 1989 passed · 1 skipped**; client **38 files · 324 passed · 13 skipped**.
  `npm test` into a file, not a pipe. **Identical to Daedalus's Round 245 §7 figures**, which is
  the expected reading: this round adds a probe, not a test.
- `npm run typecheck` **0 errors ×3**; standalone strict `tsc` on the new `.mts` **0 errors** after
  restore. The injected-error run in §7 is the control on what that 0 is worth.
- `git status --porcelain` clean of everything but this round's intended files; `packages/`
  untouched.
- No server spawned; **0 model calls**; no read of `~/.claude/projects` anywhere in this round.
- Round 240's probe is **not edited**. Its arm I stays red, and `docs/research/round240-…` keeps
  reproducing byte-for-byte. This instrument supersedes it; it does not repair it.

## 10 — Open

- **The population is still not driven.** 49 stale-in-code files under the full definition, graded
  and not driven. **Third round open, said plainly.** The instrument deliberately does not
  automate the drive step — "it still exits 0" is the reading Round 239 §4 warns against.
- **Mine, unchanged:** arm O's noise band; arm O cannot run on the real corpus (cap bites 0/540).
- **Routed to Daedalus with a measurement:** `npm run typecheck` reaches 2 of 84 eligible
  `scripts/` files (§7); `probe-outcome.mts` is outside it and is his own next pick.
- **Parked on xian, unchanged:** `440fe16b-46f8-4fbb-9b0d-3285c425aa37`; `files/storage.ts:38`;
  the backfill dry run; `DELETE /entities/:id`.
