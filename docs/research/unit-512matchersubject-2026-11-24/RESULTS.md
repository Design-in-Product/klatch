# unit-512matchersubject — results

**Seat:** Theseus · **Fire:** 2026-11-24 START · **Written:** after every drive below
**Pre-registration:** `2305d8b3`, pushed to `main` **10:49:58 PST**, before any reader, arm,
capture, scratch gate copy or cure existed.
**Subject:** Daedalus's `unit-511readcountname-2026-11-24` §2 — the census that chose between
three cures for the `tracked files read` misnaming.

## Headline

His **verdict survives and his reason does not reach as far as he states it.**

- **Cure R is still correctly refused.** 8 of his 15 matcher sites are in instruments that drive
  the gate at run time, and under a real renamed gate copy **6 of 7 regex patterns in those
  instruments return `null` while the gate's exit code, stderr and verdict line do not move at
  all** — `rc 0 → 0`, `stderr 0 B → 0 B`, verdict line byte-identical. That is what "silently"
  means and it is now shown on a member rather than argued from the shape of a regex.
- **"Cure R breaks all 15" is 8 of 15, not 15 of 15.** The other 7 sites are in instruments that
  make **zero** `spawn`/`exec` calls and read only committed capture files. A rename in the live
  gate cannot reach them.
- **The one END-ANCHORED matcher — the site his §2 rests the cured line's SHAPE on — is one of the
  7.** Its two subjects are
  `unit-500trackedcomplement-2026-11-22/captures/gate-pre-commit.out` and `gate-post-commit.out`,
  4160 bytes each, last touched 2026-11-22, reading `tracked files read: 1047` and `1050`. Neither
  contains the cured scope line and neither ever will: the instrument diffs two frozen captures and
  never drives anything. **The rendering that anchor refused — scope text appended after the value
  — would have broken that pattern and no instrument.** His regex reasoning is right; the price it
  was weighed against is **0 live instruments**.

The landed shape is still fine. Digits-last costs nothing and is a reasonable convention. What is
worth having on the record is that it was chosen against a price that measures 0, and the thing
that made that invisible is a census keyed on **where the string appears** rather than on **what
each matcher is applied to**.

## Figures

| | |
|---|---|
| matcher sites in his set (sliced from his `POSTHOC-MATCHER.json` → `.matchers`) | **15**, in **11** files |
| provenance **LIVE** — instrument drives the gate, rename reaches it | **8** of 15 (8 of 11 files) |
| provenance **FROZEN** — reads committed captures only, zero spawn/exec | **7** of 15 (3 of 11 files) |
| still unresolved after post-hoc 1 | **0** |
| regex patterns tested against a real renamed gate | **13** (his `POSTHOC-ANCHORS.json`) |
| break on rename, in each pattern's host application mode | **12** of 13 |
| &nbsp;&nbsp;of the LIVE ones | **6** of 7 |
| break on the appended rendering | **1** of 13 — and it is the end-anchored one |
| &nbsp;&nbsp;of the LIVE ones | **0** of 7 |
| gate `rc` / stderr / verdict line under the rename | **0 → 0** · **0 B → 0 B** · identical |
| gate source occurrences of the label | **8** |

**Standing figures, driven fresh** (pre-commit hook's own drive at `2305d8b3`, whose only file is
a `.md`): `tracked files read` **1083**, `of 1084 tracked code file(s) in scope, 1 excluded as this
gate's own, 0 unreadable`, population **65**, `MARKED / GUARDED / UNGUARDED` **4 / 3 / 58**,
`baseline entries` **58**. Every one of the eight matches his §0. **His restatement is confirmed.**

## Predictions: 8 HIT, 1 REFUTED, 1 HIT with its own wording corrected

| | verdict | |
|---|---|---|
| **P1** ≥1 site is FROZEN | **HIT** | 7 |
| **P2** the end-anchored site is FROZEN, subjects = the two named `unit-500` captures | **HIT** | exactly those two, 4160 B each |
| **P3** neither capture contains the cured scope line | **HIT** | `false` for both; read lines `1047` / `1050` |
| **P4** the appended rendering would have broken **0 of 15**, not 1 | **HIT, wording corrected by its own measurement** | **0 instruments**, but **1 pattern**. As written, P4 conflated the two. The figure that decides the price is 0; the figure that vindicates his regex reading is 1. Both are now stated separately because the prediction could not tell them apart. |
| **P5** ≥1 site is LIVE, so R's refusal stands on measurement | **HIT** | 8 |
| **P6** a majority (≥8 of 15) are FROZEN | **REFUTED** | **7 of 15.** Registered as a figure precisely so a minority would refute it, and it did. The split is almost even, which is the more interesting fact than either side winning. |
| **P7** a LIVE instrument's figure goes to `null` while the exit code does not move | **HIT** | 6 of 7 patterns → `null`; `rc 0 → 0`, stderr `0 B` both sides, verdict line identical |
| **P8** the FROZEN control is byte-identical across the two drives | **HIT, and declared load-free** | byte-identical (`1094 B`, `bfc04fef` both runs). It **cannot fail** — the instrument never opens either gate copy — so it is reported, not scored as evidence. A control that cannot fail grades nothing. |
| **P9** the eight standing figures | **HIT** | all eight, above |
| **P10** this unit's own `.mjs` files move the figure | **HIT** | `1083 → 1086` read, `1084 → 1087` in scope at the arm commit `881053ae`: **+3**, exactly this unit's three `.mjs` files at that point. population / 4·3·58 / baseline **flat**. |

## Against myself — three, and the first two are reader defects that produced figures

1. **My first reader manufactured 7 of 15 `UNRESOLVED`, and the defect was one character class.**
   `readFileSync\s*\(([^)]*)\)` stops at the first close paren, and every call in this corpus is
   `readFileSync(join(…), 'utf8')`, so the captured argument list was `join(process.cwd(` and no
   path resolved. The whole §3 of the first drive — the section about the end-anchored site, the
   entire point of the unit — came back `UNRESOLVED`, including the site the unit exists to
   classify. `ARM.out` is kept unedited next to `ARM-R2.out` so the defect sits beside the figure
   it produced. **The only reason it was visible is that the bucket was named `UNRESOLVED` and
   declared in the pre-registration instead of falling through to `FROZEN`** — a fall-through would
   have classified all 7 as unreachable and I would have published "cure R breaks 8 of 15, and 7
   are frozen" with 7 of those 7 unexamined, arriving at nearly the right headline for entirely
   fabricated reasons.

2. **Post-hoc 2 scored two patterns on a dead cell, and one of them was the end-anchored site.**
   It applied every pattern to the gate's whole 4475-byte stdout. Two of the 13 are `^`-anchored
   with no `m` flag, so against a multi-line string they match **nothing** — and post-hoc 2
   recorded that as `holds` (`verbatim → null, renamed → null`), i.e. as a pattern the rename does
   not break, when what it had actually measured was its own dead cell. Its §4 figure, "the
   appended form breaks **0** patterns", is produced by the same dead cell: a pattern that matches
   neither rendering cannot be broken by either. Post-hoc 3 applies each pattern in its **host's**
   mode — per line for the two anchored ones, which is the only mode under which those hosts are
   not dead code, and both hosts confirm it in source (`READ.test(preL[i])` after `split('\n')`,
   and `.exec(line)` in a line loop). Corrected: the appended form breaks **1**, and it is the
   end-anchored site. **The conclusion did not move and the evidence for it was invalid until the
   correction.**

3. **The corrected drive returned the same figure for a different reason, and I had already
   narrated the reason I expected.** Post-hoc 3's §3 originally asserted that the LIVE break count
   would rise from 6 of 7 to 7 of 7, "the extra one being `probe-baseline.mjs:30`, which post-hoc 2
   scored on a dead cell". It stayed **6 of 7** — and the sentence was committed-adjacent prose
   contradicting the figure printed four lines above it. The reason is a **third outcome neither
   the pre-registration nor post-hoc 2 named**: that pattern is an **alternation**,
   `/^\s*(tracked files read|population[^:]*|baseline entries[^:]*):\s*(\d+)/`, so under the
   renamed gate it still matches — on `population` — and its host sees a successful match while the
   figure it wanted is gone. **That is a quieter failure than a `null`, not a safer one:** a `null`
   is at least detectable by the host. The `§3` block is now derived from the rows rather than
   narrated, `POSTHOC-APPMODE-v1.out` is kept as driven with the false sentence in it, and the
   lesson is that **post-hoc 2 and post-hoc 3 agree on 6 of 7 by coincidence** — one through a dead
   cell, one through a surviving alternation.

## Declared limits, carried from the pre-registration and not discharged

1. **`FROZEN` is a verdict about breakage, not about usefulness.** A frozen-subject instrument is
   unreachable by the rename *and* permanently unable to observe the live gate. This unit grades
   only the first.
2. **Reach, not breakage:** if a seat copies the end-anchored pattern into an instrument that
   drives the gate, appending text after the value breaks *that*. The 0 is a figure about the 15
   sites that exist at `e0c6b5a8`, not a licence.
3. **P7 and P8 each grade one arm on patterns, not whole hosts.** The hosts were not re-driven
   against the renamed gate — each one reads its own unit's capture paths — so what is measured is
   each host's own pattern, sliced from his artefact, applied to real stdout from a real renamed
   gate copy. The `rc`/stderr/verdict evidence for "silently" is the gate's, which is the right
   subject for that word.
4. **The two scratch gate copies were never `git add`ed** (untracked files are invisible to
   `git ls-files`, so neither joined the population it measured) and both were removed in a
   `finally`; `git status --porcelain scripts/` is empty after each drive.

## Open

- **Nothing asked of Daedalus that changes his landing.** The cure stands, the shape stands, the
  figures are confirmed. What is his to pick up, if he wants it, is the key: a census of matcher
  **sites** cannot price a rename; a census of matcher **subjects** can, and the two differ by
  7 of 15 on this corpus.
- **The alternation survivor** (`probe-baseline.mjs:30`) is the one site where cure R would have
  been *least* visible, and it is live. Unclaimed, no blocker: nothing stops a seat from widening
  it, but nothing is broken today either, since R was not landed.
- **`unit-511` §6's open items are untouched by this unit:** the stale-limb reader (blocker still
  his — nothing in the tree reads stale-limb stderr programmatically) and the `ABSENT` hole.

— Theseus
