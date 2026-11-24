# unit-510quotepathskip — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-23 STOP · **Pre-registration** written **17:19:14 PST**,
committed `b7e8a3b2` and pushed to `main` **before** any arm, synthetic repository, cell, cure or
capture existed. Arm driven 17:2x, cure landed 17:2x, confirmation leg 17:25.

**Headline.** The routed defect and its reason both reproduce. **Its cure, as routed, was wrong in
a way that would have shipped:** it was offered as "one flag — `-z` with a NUL split, or
`-c core.quotePath=false`", and those two are **not interchangeable** — `core.quotePath=false` is
**green on the cell that distinguishes it from `-z`**. And neither flag is sufficient, because a
third silent skip lives in the `.trim()` on the same two lines. **Four readers form a strictly
nested ladder seeing 2 / 3 / 4 / 5 of 6 cells.** The complete reader is landed; its measured price
on the live tree is **byte-identical output**. The sixth cell is a different mechanism that **no
reader candidate closes**, and it is left open on purpose with its reason recorded.

**Score: 14 of 14 registered predictions HIT, 0 refuted.** Plus 3 post-hoc findings, 2 of them
against my own instrument.

---

## 1. What was already true before this unit (inputs, not findings)

Stated in PRE-REGISTRATION §0 and re-listed here because the rest rests on it:

- `extname('"src/a\303\244.mjs"')` is **`.mjs"`** — read off `node`, not cited.
- Live tree: **7478** tracked paths, **8** quoted, all `QA/Screenshot …png` carrying **U+202F**,
  **0** with a code extension.
- `src/a b.mjs` — an ASCII space — has `extname` **`.mjs`**.

**Theseus's §5.3 finding is confirmed, and so is his reason** ("git quotes on NON-ASCII, not
whitespace"), at the character level. His H1/H2/H4 self-refutation is corroborated, not assumed.

## 2. The ladder — four readers × six cells, driven

`arm-quotepathskip.mjs`, gate sha `1ec34550` (the pre-cure file), captures
`captures/G{0,1,2,3}-A-*.{out,err}`. Content is byte-identical across all cells; cells differ
**only** in the path.

```
reader cell          rc  read  pop  UNG  OK
G0     A-ASCII        1     1    1    1  RED      ← control: the content IS a member
G0     A-SPACE        1     1    1    1  RED
G0     A-NONASCII     0     0    0    0  OK       ← the routed defect
G0     A-DQUOTE       0     0    0    0  OK
G0     A-UNLINKED     0     1    0    0  OK       ← read: 1, and nothing was read
G0     A-LEADSPACE    0     1    0    0  OK       [post-hoc]
G1     A-NONASCII     1     1    1    1  RED      ← cured by core.quotePath=false
G1     A-DQUOTE       0     0    0    0  OK       ← NOT cured. "either flag" is false
G2     A-DQUOTE       1     1    1    1  RED      ← cured by -z
G2     A-LEADSPACE    0     1    0    0  OK       ← -z alone does NOT close this
G3     A-LEADSPACE    1     1    1    1  RED      ← closed by dropping .trim()
G3     A-UNLINKED     0     1    0    0  OK       ← closed by NOTHING
```

(Rows omitted above are in `captures/arm-quotepathskip.json`; every omitted row is a control that
matched its G0 reading.)

```
G0: sees 2/6 [A-ASCII A-SPACE]
G1: sees 3/6 [+ A-NONASCII]
G2: sees 4/6 [+ A-DQUOTE]
G3: sees 5/6 [+ A-LEADSPACE]
```

**Strictly nested, no crossings.** Each rung adds exactly one cell.

### 2.1 Registered predictions

| id | claim | verdict |
|---|---|---|
| P1.a | `A-ASCII` G0: rc 1, read 1, pop 1, `UNGUARDED 1` | **HIT** |
| P1.b | `A-SPACE` G0: rc 1 — an ASCII space is not quoted | **HIT** |
| P1.c | `A-NONASCII` G0: rc 0, read 0, pop 0, `DECL-BODY SLICERS OK` | **HIT** |
| P1.d | `A-DQUOTE` G0: rc 0, read 0, pop 0 | **HIT** |
| P1.e | `A-UNLINKED` G0: rc 0, pop 0, **read 1** | **HIT** |
| P2.a | `A-NONASCII` G1: rc 1, pop 1 | **HIT** |
| P2.b | `A-DQUOTE` G1: rc 0 — **not** cured | **HIT** |
| P2.c | `A-ASCII`/`A-SPACE` G1 stdout byte-identical to G0 | **HIT** |
| P3.a | `A-NONASCII` G2: rc 1 | **HIT** |
| P3.b | `A-DQUOTE` G2: rc 1 — G2 ⊋ G1 | **HIT** |
| P3.c | `A-ASCII`/`A-SPACE` G2 stdout byte-identical to G0 | **HIT** |
| P4.a | `A-UNLINKED` under G1 **and** G2: unchanged from G0 | **HIT** (and under G3) |
| P5.a/b | live figures and `tracked files read` unmoved by the cure | **HIT** |
| P5.c | the stderr limb unchanged | **HIT** |

## 3. The cure's granularity — why "either flag" would have shipped a hole

`posthoc-quoting-and-identity.mjs` LEG 1 reads what `git` actually hands the reader, under the
gate's own invocation and under each candidate:

```
                                   quotes
plain (the gate as it stood)        2/5   [A-NONASCII A-DQUOTE]
core.quotePath=false (cand. B)      1/5   [A-DQUOTE]
-z (cand. A)                        0/5   []
```

- `core.quotePath=false` suppresses quoting of **non-ASCII bytes only**. `src/a"b.mjs` comes back
  as `"src/a\"b.mjs"` under it — **still quoted**, because a literal `"` in a path is not a
  `quotePath` concern. So candidate B closes the **instance that was measured** and leaves the
  **mechanism** open, and nothing in the routed memo distinguishes the two candidates because the
  cell that separates them did not exist until this unit built it.
- `-z` never quotes anything.

**This is the hazard both seats have been naming all week, arriving in a cure rather than a
reader:** a fix graded only on the cell that motivated it is green for the same reason the defect
was. The routed finding was right; the routed cure needed its own KP.

### 3.1 The third mechanism — `.trim()`, which no flag touches

The read was `.split('\n').map((l) => l.trim()).filter(Boolean)`. A path with a **leading space**
(` src/a.mjs`) is returned **verbatim by every one of the three invocations** — it is not a quoting
case at all — passes the extension filter, and is then **trimmed to `src/a.mjs`, which does not
exist**, so `readFileSync` throws into the loop's `catch { continue }`. Silent, rc 0.

`-z` alone does not close it (`G2 A-LEADSPACE` is green). NUL-delimited output has no padding to
strip, so the trim has nothing legitimate left to do; **dropping it is part of the cure, not a
tidy-up**, and `G3` is the first reader that sees the cell.

### 3.2 The identity controls, and why sameness alone would have been vacuous

LEG 2, on the cells each cure was **not** aimed at: **6 of 6 byte-identical** (`A-ASCII` and
`A-SPACE`, stdout `af32efdd`, 800 B, for all of G0/G1/G2/G3). A widening, not a rewrite.

A sameness-only control is **green on a cure that does nothing**, so the same leg asserts the
aimed-at cells **differ**: **6 of 6 differ**. Both directions, or neither means anything.

Extended past what was registered, after noticing that `A-ASCII` and `A-SPACE` have the **same**
stdout as each other: the filename is published on **stderr**, not stdout, so a stdout-only
identity check cannot see a path at all. Re-run on stderr: **byte-identical per cell across all
four readers** (`A-ASCII` 675 B `662e36d1`, `A-SPACE` 676 B `66e46988` — the extra byte is the
space), and the two cells **differ from each other** under every reader. The gate publishes two
documents and the identity claim now covers both.

## 4. The sixth cell — open, named, and not closed by this unit

`A-UNLINKED`: a tracked code file present in the index and **absent from the worktree**. Under
**all four readers**: rc **0**, population **0**, `DECL-BODY SLICERS OK`, and
**`tracked files read: 1`**.

The figure is `tracked.filter((f) => EXTS.has(extname(f))).length` — an **extension-filter survivor
count, not a read count**. So the published figure named "tracked files read" **asserts a read that
did not happen**, and the population loses a member silently at rc 0. **7 of the 24 arm rows** show
this signature.

**Not cured here, by PRE-REGISTRATION limit 1, and the reason is a decision rather than effort:**
both candidate fixes move a published string every seat holds pins on. Counting real reads changes
`tracked files read`; reddening on an unreadable member changes the verdict line. Either is a
figure migration needing its own KP set and a pin sweep — not a thing to do unilaterally in the
fire that named it, which is the same discipline that put *this* cure in *this* fire rather than in
Theseus's. **Unblocked for whichever seat takes it; no blocker attached.** Named at the site, in
the gate's own source, beside the `catch { continue }`.

## 5. The cure, landed — price and confirmation

**Landed** in `scripts/verify-decl-body-slicers.mjs`:

```js
tracked = execFileSync('git', ['-C', ROOT, 'ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean);
```

**Price, measured against a pre-action baseline rather than asserted** — `captures/LIVE-PRE-CURE.*`
captured **before** the edit, `captures/LIVE-POST-CURE.*` after:

```
out: pre 4390B b4953158   post 4390B b4953158   BYTE-IDENTICAL
err: pre    0B e3b0c442   post    0B e3b0c442   BYTE-IDENTICAL
     tracked files read: 1077 · population 65 · MARKED 4 / GUARDED 3 / UNGUARDED 58
     baseline entries: 58 · DECL-BODY SLICERS OK
```

Every published figure unmoved, both documents byte-identical. **This closes a reach, not a live
miss** — 0 of the 8 quoted live paths carry a code extension — which is exactly why it was landable
in a fire that was not the one that found it.

### 5.1 The leg that was missing until it was run

The arm graded `G3` as a **substituted copy** in a synthetic repo. `LIVE-POST-CURE` graded the
**landed** file against the **live tree, which contains no member**. Between them, **nothing had
driven the file that ships against a path that triggers the defect** — two green legs and an
untested cure. `confirm-landed.mjs` closes it: the gate copied **verbatim, no substitution**, with
its cured state asserted by slicing its own source first (so the leg could not pass on the uncured
file), driven against all six cells.

```
landed gate: sha dad3487f (78291 bytes) — copied verbatim, no substitution
landed gate verified by source slice: -z present, NUL split present, trimming split absent

A-ASCII  1 RED · A-SPACE  1 RED · A-NONASCII  1 RED · A-DQUOTE  1 RED · A-LEADSPACE  1 RED
A-UNLINKED  0  OK  (not cured, by declared limit)

CONFIRMED — reddens all five path-shaped cells; green on exactly the one cell declared open.
```

## 6. Against myself

1. **The arm's `git` column was vacuous, and it printed a reassuring word.** It compared the
   indexed path against the cell's path using **`ls-files -z`** — a reader that *by construction
   never quotes* — so the column could only ever read `verbatim`, and it read `verbatim` on all 24
   rows. It would have read `verbatim` on all 24 rows had git quoted every one of them. **A column
   whose value is forced by the reader that fills it measures the reader, not the subject**, and
   this one sat in a table about quoting. Caught by asking what would have to be true for the cell
   to say `differs`, not by it failing. Cured by LEG 1, which reads the quoting under the gate's
   **own** invocation — a reader that can disagree.
2. **My pre-registered identity control graded one of the gate's two documents.** P2.c/P3.c said
   "stdout byte-identical". Stdout does not contain the filename; stderr does. A path-shaped cure
   checked for path-shaped side effects on the document that cannot show a path. Extended in §3.2.
3. **My own pre-registration nearly joined the class it declared itself out of.** I named a cell
   `A-ABSENT` and wrote a limit claiming no cell name carries a vocabulary token — then checked,
   and `ABSENT` **is** in the stale-block vocabulary (`MARKED / GUARDED / UNGUARDED / ABSENT`, the
   gate's own source at `:419`). Renamed to `A-UNLINKED` **before the arm existed**, so the claim
   is true rather than repaired. The near-miss is the finding: the limit was written in the same
   minute as the violation, by the author of both.

## 7. Declared limits, restated not weakened

1. **`A-UNLINKED` is a KP for the second mechanism, not a cure for it.** §4. Still open.
2. **`.trim()`'s removal is graded by one cell.** `A-LEADSPACE` is a leading-space path. A
   **trailing**-space path is not graded here, because a code extension puts the dot last and a
   trailing space would already fail the extension filter — stated as reasoning, **not driven**.
3. **One harness shape.** `unit-503`…`-510` share it. Nothing here corroborates any general law;
   every figure is a per-instance construction.
4. **`A-DQUOTE` is filesystem-dependent.** APFS admits `"` in a basename; the arm `must()`s on
   creation rather than falling through, so a filesystem that refused it would BLOCK, not pass.
5. **Naming practice (Theseus's §4, continued).** No cell name and no capture filename carries a
   gate vocabulary token, so this unit adds **0** members to the token-bearing class — see §6.3 for
   how close that came to being false.

— Daedalus
