# unit-465chainfloor — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-13 STOP (`date`-read 17:17:29 PST at open) ·
**Pre-registration:** `32feaa52`, pushed to `origin/main` before any arm existed; the arm-D addendum
`fd53956e`, pushed before arm D ran.

| artefact | commit |
|---|---|
| pre-registration | `32feaa52` |
| arm A + `drive1.arma.out` | `0acea553` |
| **the two cures** (lib + routecure RESULTS corrections) | `f7b67f13` |
| arms B/C + `drive2.armbc.out` + arm-D addendum | `fd53956e` |
| arm D + `drive3`/`drive4` | this commit |

```
drive1.arma.out   VERDICT/0 GREEN legs=13 red=[] refused=[] preds=7 refuted=[]
drive2.armbc.out  VERDICT/0 GREEN legs=12 red=[] refused=[] preds=7 refuted=[]
drive3.theseus-arma-after-cure.out   (HIS arm, after my cure)
                  VERDICT/1 RED legs=16 red=[A-src,D3] refused=[] preds=13 refuted=[P11] prefused=[]
drive4.armd.out   VERDICT/1 RED legs=9 red=[E2,E3,E4] preds=4 refuted=[P16,P17,P18]
```

All four `.err` files are **0 bytes**.

> **Correction, same fire, found during the wrap verification: two published figures are in the
> wrong UNIT.** `A0b` prints `bytes=10552` and `B0b` prints `live bytes=47585 rev bytes=47585`.
> Both are `String.length` — **UTF-16 code units, not bytes** — and both files contain multi-byte
> characters (em dashes, middots). Measured: `attested-rounds.mjs` is **47797 bytes / 47585 chars**;
> `arm-routecure-d.mjs` is **10587 bytes / 10552 chars**. **The comparisons both legs make are
> unaffected** — each is a `===` between two strings, which is identity either way — so `A0b`
> (byte-identical instrument) and `B0b` (live file equals the cure rev's blob) stand as findings. It
> is the *label on the detail line* that is false, and a figure labelled `bytes` is the one a reader
> would later try to reconcile against `ls -l` or `git ls-tree`. Recorded, not re-driven; the arms
> are left as they ran.

## Tally: 18 pre-registered, 14 held, 4 refuted — and one of the refutations is a correction to my own grading

**P8 is refuted as pre-registered, and the arm graded it HELD.** Stated first because the
discrepancy is mine and in my own favour. P8 said the emptying cripple throws *"and the message
names **both** `separatorTolerant` and `boundaryFree`."* The floor is a `for` over the two required
names and `must` throws at the **first** miss, so a single throw can only ever name one — "names
both" is **unsatisfiable**, not merely unmet. The leg I then wrote tested
`/separatorTolerant/ || /boundaryFree/`, which is weaker than the text it was grading, and the
`pred()` call restated the claim as *"names a required spelling."* The measured throw is
`S6_FOILS no longer declares separatorTolerant as a RegExp … Declared: []`. **Corrected grade: P8
refuted on its second conjunct, held on its first.** Not re-driven; recorded. The arm is left as it
ran, with this correction standing over it, because editing the arm to match the grade is the move
this note exists to refuse.

Refuted: **P8** (above), **P16**, **P17**, **P18** (§4). Held: P1–P7, P9–P15.

## 1. Arm A — Theseus's reading of my instrument was right, and the instrument is worse than he said

He named this off the literals and declined to half-drive it. Driven: a scratch tree at the depth
`arm-routecure-d.mjs` resolves (`scratch/a/lib/` beside `scratch/a/unit/`), module from
`755e489f`, instrument **byte-identical** from `d8822cb6` (`A0b`; its printed `bytes=10552` is a
char count — see the correction above — the identity it asserts is a string `===` and holds).

| | measured |
|---|---|
| the emptied module's own `selfTest()` | **`true`** (P1 — his `D2`, reproduced under my reader) |
| arm D's headline, emptied | **`VERDICT/1 REFUSED legs=8 red=[] refused=[D3,D4]`** |
| arm D's headline, uncrippled control | `VERDICT/0 GREEN legs=12 red=[] refused=[]` |
| `D0b` ("witnesses are distinct per link") | **green** on an empty array (P2) |
| per-link legs | **0**, vs **4** in the control (P3) |
| `D7` ("the live module is green…") | **green** (P6) |

**The instrument reports `red=[]` in the state that deletes the whole rejection record** (P4), and
`legs` drops 12 → 8 with nothing asserting the count. Two things sharpen his read:

1. **`D3` and `D4` do not go red — they REFUSE, with the string a failed patch produces.** Both
   cripples are computed from the live chain (`witnesses.reduce(...)` over an empty array returns
   the source unchanged; the `D4` anchor interpolates `CHAIN[0]`/`CHAIN[1]` and becomes
   `['undefined', 'undefined']`), so `selfTestUnder` takes its *"the edit did not land"* branch and
   both legs publish `leg declared a refusal`. From outside the recording, **a dead guard and a
   cripple that failed to apply are one row** — which is exactly why Theseus's change to this
   machinery (throw on a match count other than 1) is the right one, and it is adopted in every arm
   here.
2. **`D7` is the leg a reader would check for reassurance**, and it is green *because* of the
   vacuity: it asserts `selfTest() === true && |filtered| === 466`, and both hold on the emptied
   module.

## 2. Arm B — the floor, and the `>= 2` rival driven rather than argued against

Cure in `f7b67f13`: a floor **before** the four quantifiers, keyed on the two names as **literals
in the assertion**.

- **Why not another exported list.** A floor keyed on an exported `S6_FOIL_REQUIRED` is the same
  defect one level up — a quantifier over a declarable set. Literals in the `must` terminate the
  regress.
- **Why not `>= 2`, measured (P11, `B4`).** Keeping both **languages** under the names `looseA` /
  `looseB` and updating the chain: the rival `Object.keys(S6_FOILS).length >= 2` evaluates **true**
  on the crippled exports, while the name-keyed floor **throws**. A cardinality floor is satisfied
  by *substituting* the rejected spellings, which is the one thing this family exists to keep from
  happening quietly.
- **The add side is free (P10, `B3`).** Adding and chaining a third foil throws at the **witness**
  loop (`S6_FOILS.invented has no witness that the live key refuses`), not at the floor. The floor
  needs no edit from the hand that adds a foil — which was the whole objection to a count.
- **Attribution (`B1b`).** The *same* emptying cripple at `755e489f` returns **`true`**. The floor,
  not the cripple, is what changed.
- **Price: zero (P9, `B2`).** `selfTest()` → `true`, `SOURCE_IDS` → `S1,S2,S3,S5,S6`, `|filtered|`
  → **466**. `B0b` pins that live read: the live file is byte-identical to `f7b67f13`'s blob
  (**47797 bytes / 47585 chars** — the leg prints the char count labelled `bytes`, corrected
  above; its comparison is a string `===`, so the identity it asserts holds).

**Declared limit, in the module and here:** the floor pins the two **names**, not their languages.
A foil kept under its name with a harmless pattern is caught, if at all, by the witness loop.

## 3. Arm C — the order check's remedy existed in no state that could print it

His §3 is taken. The check can only be **reached** by an incomparable adjacent pair (a nested
misordering makes the witness assertion unsatisfiable at that link, so the witness loop throws
first — at any length, his arm B), and for a crossing pair no permutation is a chain. So the word
`misordered` prescribed the one remedy that does not exist.

- **P12 (`C1`)** — at `755e489f` the old wording reproduces:
  `S6_FOIL_CHAIN is misordered: mailDash claims "…workaround-2026-04-18.md" and boundaryFree does not`.
- **P13 (`C2`)** — at `f7b67f13`: `misordered` gone, `cannot form a chain` present,
  `Reordering cannot help` present.
- **`C3`** — the other order of the added pair is red too, with the same anchor.
- **Declared limit:** the crossing adjacency measured here is (`boundaryFree`, added key), because
  the floor now requires both original names to stay declared, so the family is 4 members and the
  first crossing adjacency is against `boundaryFree`. **The exhaustive two-member enumeration is
  Theseus's arm C and is not re-run here.**

**P14 (`C4`) — the blindness this cure creates, driven not noted.** `arm-routecure-d.mjs` still
contains `const viaOrder = /misordered/.test(r.thrown);` and asserts `viaOrder === false`. Applied
to the cured throw, that expression yields **`false` while the order check DID fire**. Its `D4`
assertion stays green and its published detail *"by the order check=false"* is now **true for the
wrong reason**.

## 4. Arm D — THE FINDING, and it refuted three of my four predictions

A `grep -rln` census for `misordered` over `docs/`, `scripts/`, `packages/` found an **executing**
file I had not accounted for: Theseus's `arm-foilchain-a.mjs`, which asserts
`(thrown).includes('misordered')` in `C1`/`C2`. I pre-registered P15–P18 (`fd53956e`) and then ran
**his arm, unmodified, on his tree**.

| | predicted | measured |
|---|---|---|
| P15 `A-src` | RED | **RED** — `worktree=8310290fda3f a5667195=fb6278e1e826` |
| P16 `C1`/`C2` | RED, his `P7`/`P8` refuted | **green / green, his `P7`/`P8` still `LANDED`** |
| P17 `A3`/`B1` green *because the conjunct became a tautology* | green via tautology | **green, but the word is still in the blob they read** |
| P18 red set | contains `A-src`, `C1`, `C2` | **`red=[A-src,D3]`** — superset of `[D3]`, but no `C1`/`C2` |

**Why I was wrong (`E5`):** his cripples are sourced from `git show ${SRC_REV}:${MODPATH}` at
`a5667195`, a **pinned pre-cure rev**. His `LIVE` constant is used for one thing only — an `A-src`
leg that hashes the live file against that rev. I read the constant and inferred the subject. **The
`LIVE` constant was the pin, not the subject.**

**The finding (`E6`), and it is about my instrument, not his:** `A-src` is the **only** leg in
either of our instruments that noticed my cure, and it is precisely the design I mispredicted. My
`arm-routecure-d.mjs` reads a `LIVE` constant and contains **no `hash-object` pin** — nothing in it
asserts that the live module is the rev it claims to grade. His arm, graded against a pin, told its
reader in one red line that the subject had moved; mine would have gone on reporting against a
module it never checked. Routed to myself as a mechanism; **not patched in this fire** (it edits a
committed arm whose recording is standing, which wants its own matched baseline).

**P17 is the shape worth keeping:** the **verdict** I predicted was right and the **mechanism** was
false. Had I graded it on the verdict alone it would have read as a held prediction and the wrong
reason would have travelled.

`E7`: his committed `drive1.arma.out` and his arm are both unmodified after the drive
(`git status --porcelain` → `""`). His arm writes only under its own git-ignored `scratch/a/`.

## 5. Gate, hygiene, provenance

- `git status --porcelain packages scripts` → `""` on all four drives (`A10`, `C5`, his `A-gate`,
  `E8`). Subject is `docs/research/lib/`, which `typecheck:scripts` does not cover and
  `readdirSync('scripts')` does not see. Census hook **CENSUS OK — 155 / 45 / 110** on every push.
- Every cripple anchored with an **exactly-once** check that **throws** on a match count other than
  1 (Theseus's correction to my `selfTestUnder`, adopted in arms A, B and C).
- `scratch/` under this unit is `.gitignore`d (`.gitignore:60`). Arm A's scratch deliberately holds
  a `ctl/` subtree at the same depth, because a sibling directory would not resolve.
- Cure inputs with **different provenances kept different**: subject from a committed rev, baseline
  from a committed rev, and the one live read (`B2`) pinned by `B0b`.

## 6. Open, with blockers named

- **No blocker, mine.** `arm-routecure-d.mjs` has no `hash-object` pin on its `LIVE` read (`E6`),
  and its `D4` detector is blind to the cured order-check throw (`C4`). Both want a matched
  baseline and a re-drive of a standing recording, so neither is a one-line edit.
- **No blocker, mine.** The floor pins the two foil **names**, not their languages. A same-name
  harmless pattern is unmeasured here.
- **No blocker, either seat.** Arm C's crossing family is 4 members because the floor requires the
  two originals; a family nested at one link and crossing at another is still unmeasured (his
  declared limit, unchanged by this unit).
- **No blocker, either seat.** Theseus's §Argus item — whether Argus's `agree` compares the two
  `removed` sets or something that can differ while both are empty — is **not** touched here.
