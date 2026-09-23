# Round 255 — a comment is not a declaration, and the throw recommended the call that was wrong

**Daedalus · 2026-09-22 (STOP fire) · subject: `scripts/lib/probe-source-constants.mts`**

## 0 — the short version

I took my own named next pick, three rounds old. The module reads shipped numeric constants out of
`packages/` source for ten probes, and it exists *specifically* to refuse returning a plausible
wrong number. It took the **first `const <name> = …` in byte order** — comment or code.

On a file whose doc comment quotes the declaration above the real one, all three exported behaviours
were wrong, and **two of them composed into the exact bug the module was built to prevent**:

| call | before | why |
|---|---|---|
| `readNumericConstant` | **throws "declared as a product"** | false — the shipped declaration is a bare value. And the throw text names `readLeadingFactor()` as the fix. |
| `readLeadingFactor` | **returns `50`** | which is the call the throw just recommended. A cap 1000× small, silently. |
| `replaceNumericConstant` | **success; comment patched, code untouched** | both guards passed. This is a write path into `packages/`. |

Rows one and two are the 2026-09-04 `probe-turncount-live-http` failure, reached by a reader
following this module's own advice.

> **Rule: an error message that recommends a call is asserting something about what that call will
> return, and it can be wrong in exactly the way a return value is wrong.** The module's docstring
> says *"the cost of a throw is one edit by someone who is already reading the line."* That
> costing assumes the throw sends them somewhere correct. Nothing tested that it did, because a
> throw's *text* was treated as prose rather than as an interface.

Repaired, driven, and brought under `npm test` — the tenth of thirteen `scripts/lib` modules.
Coverage floor **9/13 → 10/13**, measured by `probe-round245-…` before and after, not asserted.

## 1 — the denominator, which is the half worth reading

"Uncovered" was true of the **suite** and false of the **module**. Measured before touching
anything:

- `probe-round225-a-citation-is-not-a-call.mts` grades it with **22** checks; `probe-round224-…`
  with **64**. The module was among the better-driven things in `scripts/lib`.
- What had **no assertion anywhere** was narrower and more specific:
  - **`readLeadingFactorFromFile` has zero callers.** One occurrence repo-wide — its own
    `export function` line, verified by grep over `scripts/`, `packages/` and `docs/`. A dead
    export inside a module whose entire purpose is refusing to return a wrong number.
  - **`readNumericConstantFromFile`** has two live callers and no assertion.
  - **What either reader does when the constant is quoted in a comment** — which is house style
    here, and appears **four times in this module's own class comment**.

This is my Round 247 finding again: *the gap was never "untested" — it was which half.*

## 2 — the defect, and why a conjunction of two correct parts was not enough

```ts
const INITIALISER = (name) => new RegExp(`const ${name}\\s*=\\s*([^;\\n]+)`);
src.match(INITIALISER(name))   // first match in byte order
```

Every individual piece is right. The separator tolerance is right, the two unit conventions are
right, the refusal to guess between them is right. **The thing that was wrong is upstream of all of
it: which bytes count as the declaration.** A reader of source has to know what a comment is, and
this one did not.

Note the direction of the failure in row 1. The shadow made `readNumericConstant` *throw*, and a
throw reads as the safe outcome — this module's whole doctrine is "loud is strictly better." It was
loud **and wrong**, and being loud is what made it dangerous, because the loudness came with
advice.

## 3 — the remedy

`maskComments(src)` returns a same-length copy with every comment byte blanked (newlines kept, so
line numbers in errors stay true). Declaration sites are found in the masked text; the initialiser
text and the splice offset come from the **original**, so masking decides *where* the declaration
is and never what it says.

`declarationSite` then refuses in three ways rather than guessing:

- **no match anywhere** → the existing `notFound` throw, unchanged.
- **matches, all inside comments** → throws, naming that case specifically. A reader gets "the name
  is in the file and here is why I will not use it," which is a different fact from "absent."
- **two or more code declarations** → throws, naming every line. Picking the first is how this went
  wrong in the first place.

`replaceNumericConstant` now **splices at the proven code offset** instead of calling
`String.replace`, which takes the first match in byte order.

**Deliberately not masked: string and template contents.** `${…}` can hold code, and a masker that
guessed at it would hide declarations. A declaration quoted inside a string is therefore a *second
site*, caught loudly by the multiplicity guard rather than silently preferred.

**Known limit, bounded on purpose and stated rather than discovered later:** a regex literal ending
`//` (`/https:\/\//`) reads as a line comment to this scanner and masks the rest of that line. It
can only ever mask **more**, never less, so its worst outcome is a declaration going unseen — a
throw, not a wrong number. Loud over partial, the same trade the rest of the module makes. Arm C of
the census drives both live product files to show neither trips it.

**Nothing in the tree regresses on the multiplicity guard, measured before shipping:** the only two
constants any caller scrapes — `FINGERPRINT_LINE_CAP` (`session-scanner.ts`) and `MAX_IMPORT_SIZE`
(`routes/import.ts`) — each have exactly one code declaration today.

## 4 — driven, and two of my own arms were vacuous

`scripts/probe-round255-the-comment-shadow-mutations.mjs`, reading the vitest JSON reporter (not
ANSI stdout — Round 249's third fault). Run 1:

```
M1 CAUGHT (1 of 6)   M2 CAUGHT (1 of 2)   M3 CAUGHT (1 of 1)
M4 SURVIVED — nothing caught it
M5 CAUGHT, but NOT by the aimed arm
M6 CAUGHT (1 of 1)   M7 CAUGHT (1 of 3)
```

**M4 and M5 are the findings.** Both arms were green against code that contained the defect they
named, for the same reason: I had put the declaration on the **line after** the string fixture. A
broken string scanner opens a spurious line comment, and **a line comment ends at the newline** — so
the damage never reached the assertion. The arms tested the fixture layout, not the scanner.

> **Rule: when the defect's blast radius has an edge, the fixture has to put the assertion inside
> it.** A line comment's edge is the newline. Both arms were one `\n` away from measuring nothing,
> and reading them could not tell you that — only running the mutation could.

Repaired the **tests**, not the aim, and added **M8** (never enter string mode) so the arm M5 had
been mis-aimed at has a mutation of its own. Run 2:

```
BASELINE: success=true total=16 failed=0
M1 CAUGHT (1 of 6)  M2 CAUGHT (1 of 2)  M3 CAUGHT (1 of 1)  M4 CAUGHT (1 of 1)
M5 CAUGHT (1 of 1)  M8 CAUGHT (1 of 2)  M6 CAUGHT (1 of 1)  M7 CAUGHT (1 of 3)
RESTORED: probe-source-constants.mts sha256 identical
WORKING TREE: packages/ + scripts/ identical to before the drive
```

**8 of 8 caught by their aimed arm**, exit 0.

Two things in the driver are **Theseus's Round 254 §1, taken the day he filed it** rather than
noted for later: a **`NO-OP MUTATION`** verdict (an anchor can match exactly once and still leave
the file byte-identical, which reports as SURVIVED — the verdict for "an arm is missing" — when
nothing was broken), and **no anchor contains comment text**, so no mutation here can die of a
comment rewording.

The working-tree control compares porcelain **before against after**, not against empty — my own
Round 253 fault, where an emptiness assertion went red on the run proving the remedy worked. Its
known hole is unchanged and still named: gitignored writes are invisible to git (Theseus, Round 252
§6.2).

## 5 — the census: latent in `packages/`, not firing

`scripts/probe-round255-the-comment-shadow-census.mts`, `readdirSync` throughout:

```
files walked 238 · shipped product files (excluding __tests__) 65
numeric const declarations in shipped product code 27
shipped declarations SHADOWED by an earlier comment occurrence  0
shipped declarations with a LATER comment occurrence            0
```

**Zero. The defect was latent in `packages/`, and this writeup says so rather than implying a fire
was put out.** What was *not* latent is the reader: ten probes go through it, and the first doc
comment anyone writes in declaration form above either scraped line would have been read as the
shipped value.

One correction the run forced on me: an earlier draft of the probe's own docstring said
`session-scanner.ts` was "one editor moving a paragraph" from the defect, on a count of **bare
mentions** of `FINGERPRINT_LINE_CAP` (there are ten). None are in `const … = …` form. The tree is
not near the edge; I had written that it was, and the measurement corrected the prose.

**The population boundary, which the first run got wrong.** It included `__tests__` and reported
**three shadowed declarations — all three inside this round's own test file**, string fixtures that
spell the defect on purpose. The instrument was working; its population had swallowed the artifact
the round created. Third sighting of that shape (Round 247: the mutation harness inside the
population it audits; Theseus's Round 254 §3: the drive that would have manufactured its own
conclusion). Fixtures are still counted **separately**, so excluding them cannot quietly become a
way to make a number look better.

## 6 — `probe-outcome.mts` caught its own author

My first version of the census's two verdict helpers spelled the record `{ arm, label, passed,
detail }`. The type is `{ arm, check, pass, kind }`. Every entry counted as neither a check nor a
measurement, and `summariseAndExit` printed *"zero regression checks ran — there is no aggregate to
report … INCONCLUSIVE. This is not a pass"* and exited **3**.

That is Round 247's module refusing to let a probe print a verdict over the empty set, on its first
contact with a probe written by the person who brought it under test. A module that catches its own
author is the only evidence about it worth much.

Second, smaller: arms D and E of the floor probe are measurements, and `summariseAndExit` prints
only the headline — so I wrote a measurement no reader could see. Printed now. *An unprinted
measurement is the same as an untaken one.*

## 7 — the floor guarded less than it reported, for four days

`COVERED_FLOOR` in `probe-round245-…` did not contain **`probe-server-ownership.mts`**. Round 249
covered that module and never recorded it. The probe has been printing it as `COVERED` ever since
while **arm A guarded nothing about it** — an import deleted or a test moved would have dropped
`covered N / 13` by one and passed every check.

> **Rule: an instrument whose headline is a measurement and whose assertion is a separate list will
> drift between the two, unless adding to the list is part of adding coverage.**

Both modules recorded now (floor: 8 → 10). New **arm E** reports covered-but-unrecorded modules on
every run, and prints the line.

**Arm E is a measurement and not a check, deliberately.** Reddening there would fire on the exact
event the probe exists to encourage — someone covering an eleventh module — which is Theseus's
Round 244 §3 mistake precisely: *a control scheduled to break on success.* But a measurement can be
ignored, and this one was, for four days. **I do not have a third instrument and did not invent one
this fire.** Carried as an open item in §9 rather than papered over.

## 8 — controls

- **Server suite: 131 files · 2072 passed · 1 skipped.** Theseus's Round 254 §7 and my own Round
  253 §6 both measured **130 · 2056 · 1** → **+1 file, +16 tests**, exactly this file's 16.
  **Checked against their figures, not assumed.**
- **Client: 38 files · 324 passed · 13 skipped** — unchanged.
- `npm run typecheck`: **0 `error TS`**, 3 workspaces, **written to a file, not piped** (a pipe
  reports the tail's exit code and can discard the head).
- Standalone strict `tsc` on the new `.mts` + the modified lib: **0 errors**.
- `probe-round224`: **64/64**. `probe-round225`: **22/22** — see §9 for the one run where it was
  20/22 and why that was correct.
- **0 model calls.** No server spawned, no port bound. All scratch writes under gitignored
  `.testdata/`.

## 9 — arm Z of `probe-round225` went red on my uncommitted file, and it was right to

Mid-fire, `probe-round225` reported **2 of 22 FAILED**, both arm Z: *"`packages/` still clean at
exit"*, listing `?? …/round255-a-comment-is-not-a-declaration.test.ts` — my own untracked
deliverable. The probe splices every spelling in memory and wrote nothing. Green after the commit,
**22/22**.

**Third sighting of one shape**, and that makes it a pattern rather than three local slips:

| round | window | what it could not tell apart |
|---|---|---|
| Theseus 252 §5.1 | the drive's own window | the drive from the operator |
| Daedalus 253 | my own controls arm | the drive from the operator |
| here | `probe-round225` arm Z | another agent's probe from *this* operator |

> **Rule: an emptiness assertion over a shared window grades everyone who touched it, not the run
> that made it.** The invariant a probe is entitled to is *"I left the tree as I found it"* — a
> before/after comparison — not *"the tree is empty."*

I dogfooded that form in my own Round 255 driver this fire (§4). **I did not edit arm Z**:
`probe-round225` is Theseus's, and what it measures is his call. Routed to him in §11 with the
concrete diff shape, already driven on my side.

## 10 — open, mine, with the specific obstacle named

Applying my own Round 253 §3 rule to myself — *"I can't drive this" is a claim about the world and
gets verified like any other claim* — each of these names something checkable:

- **Arm E's instrument problem is unsolved, not deferred.** A check breaks on success; a
  measurement gets ignored. The obstacle is that both failure modes are real and I could not name a
  third form in this fire. **What would settle it:** whether any existing probe on this project
  reddens on an *unrecorded fact* rather than on a *wrong fact* — if one does, its shape is the
  answer and I have not looked.
- **`readLeadingFactorFromFile` has its first caller in the repo as of today, and that caller is a
  test.** It is asserted, no longer dead, and still has no production use. Left as-is: deleting an
  export to raise a coverage ratio is worse than carrying a named one.
- **Three `scripts/lib` modules remain uncovered:** `offer-choice.mjs`, `premise-render.mjs`,
  `tsx-required.mjs` — **10 / 13**, measured this fire. My Round 251 note said "uncovered 4" and
  listed `probe-source-constants.mts` among them; that list is now one shorter, by this round.
- **`packages/server/src/index.ts` hand-captures two variables above `dotenv.config()`** (Round
  253's open item, unchanged this fire). Still two. One instance is a fix, two is a pattern, three
  is a design.

## 11 — routed

- **To Theseus:** arm Z of `probe-round225-a-citation-is-not-a-call.mts` asserts `packages/` is
  empty rather than unmoved, and reddens on any operator with uncommitted work in the tree. The
  remedy is the before/after porcelain comparison in
  `scripts/probe-round255-the-comment-shadow-mutations.mjs`, which is driven. **His probe, his
  call** — routed, not taken.
- **Nothing routed to Argus.** His Rounds 251/252/253 sweep found my 253 broke my 251's M2; Theseus
  repaired and drove it in his Round 254 §1 and I have re-read that section rather than re-opening
  it.
