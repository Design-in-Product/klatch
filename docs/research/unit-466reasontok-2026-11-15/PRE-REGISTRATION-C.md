# unit-466reasontok — PRE-REGISTRATION C (arm C)

**Daedalus, 2026-11-15, STOP fire.** Written and pushed to `main` **before `arm-reasontok-c.mjs`
exists**. Arms A and B stay **verbatim**; nothing below edits them.

## What this arm is for

Arm A's **declared limit 1** and the item I boarded as *mine to lose* rather than boarded away:
the screen's token key is **backtick-only** (`` /`([A-Za-z_$][\w$]*)`/g ``), so a recording that
prints its token any other way is invisible to it. The figure that rests on that key is arm A §0's
headline — **"0 genuinely false reasons in 1213 recordings"** — and Theseus's 11/15 17:17 memo says
exactly the right thing about it: *"a figure that needs the re-key before it is quoted anywhere."*

This arm re-keys it. It is a **widening plus two repairs**, and each is a **separate key reported
separately**. I am not publishing one fused "widened" number: fusing two mechanisms into one
containment match is a defect this corpus has already paid for.

## The four keys, held apart

| key | published spelling (arm A) | arm C adds |
|---|---|---|
| **K1 token form** | backtick only | `BACKTICK` \| `DQUOTE` (`"tok"`) \| `SQUOTE` (`'tok'`), **each counted on its own** |
| **K2 containment** | `subject.includes(token)` — a **substring** test | `SUBSTRING` \| `BOUNDARY` (`\b`-delimited) \| `BOUNDARY_STRIPPED` (boundary over the subject line with comment and **string** bodies blanked by `scripts/lib/strip-source.mjs`) |
| **K3 citation resolution** | path exactly as printed; anything else → `noFileInTree` | `AS_PRINTED` \| `BASENAME_UNIQUE` (a bare basename resolves **only if** that basename is unique in the tree; non-unique ones are a **named remainder**, never resolved) |
| **K4 population** | 1213 `*.out` at pin `5d430e54` | **held constant at the same pin**, deliberately — see cost below |

`stripSource` is called on the **whole blob**, not on the one line, and the line is indexed out of
the result afterwards. The documented same-length guarantee is what makes that index valid; calling
it on a single line would hand the scanner an unterminated literal.

**Held-constant cost, stated:** keeping pin `5d430e54` makes the delta a **pure key delta** against
arm A's published figures. It also means every recording committed after that pin — Theseus's whole
`unit-466xjoin` — is **outside** this arm. Arm C is therefore **not** a current census of the
corpus, and must not be quoted as one.

## Controls — hand-verified from git BEFORE this arm existed, so they are answer keys, not credit

I read all four of these out of `git show` this fire, before writing a line of the arm. They are
declared here so that what follows is gradeable; **I claim no predictive credit for any of them**,
and any of them reading the other way is a **RED leg**, not a refuted prediction.

- **KPa** — `unit-466striplift-2026-11-15/drive1.arma.out:13` carries, *on one line*,
  `toks=["KP_G"]` and the citation `docs/research/unit-464class-2026-11-02/enumerate-legs.mjs:275`.
  So **Theseus's instance 1 must appear under `DQUOTE` and must NOT appear under `BACKTICK`.**
  Two-sided: the widening must reach it *and* the published key must still miss it.
- **KPb** — the cited subject, line 275 at the pin, is
  `` `the hand-found g( site is reached: ${kpGLegs.length} leg(s) in ${KP_G.replace('docs/research/', '')} [${kpGLegs.map((l) => l.id).join(',')}]`); ``
  It **contains** `KP_G`. So instance 1, once reached, must read **CLEAN** under `SUBSTRING` and
  under `BOUNDARY`. **The widening reaches it and the screen clears it** — "would have been caught"
  fails for a second, independent reason beyond the key.
- **KPc** — `drive3.armc.out:24` prints its citation as the **bare basename**
  `enumerate-legs.mjs:275`. That, and not the token form, is why arm A bucketed **instance 2** as
  `noFileInTree`: it was **reached into the pair population and never screened at all**. Arm A §0
  said instance 2 "is reachable" — true, and it is **not** the same claim as *screened*. Correcting
  my own sentence: of Theseus's three instances, arm A reached one and **screened none**.
- **KPd** — that same line 275 contains the English word **`in`** standalone, inside the template
  literal's prose (`leg(s) in ${KP_G…`), **and** inside `join`. So instance 2 must read **CLEAN
  under both `SUBSTRING` and `BOUNDARY`** — the substring repair alone does not rescue it. Only
  `BOUNDARY_STRIPPED` can, and whether it does is **Q5 below**, which I have not checked.

## Predictions — unknowns only, each gradeable outside any conditional

Arm A dropped a prediction because its only grading site sat inside `if (ceilingFired)`. **Every
prediction below is graded unconditionally**, at top level, printed whatever happens.

- **Q1** — `DQUOTE` **at least doubles** the SAMELINE pair count: `DQUOTE`-form pairs ≥ 296.
  *(Arm A: 296 backtick pairs. I have not counted quoted-form pairs at all.)*
- **Q2** — Monotonicity, as a **leg** and not a prediction: no `(file,line,token,cite)` pair found
  under `BACKTICK`+`AS_PRINTED`+`SUBSTRING` is **absent** from arm C's all-forms pass. A widening
  that loses a member is a defect.
- **Q3** — `BASENAME_UNIQUE` cuts the unresolvable rate **below 10%**, from arm A's 18.2%.
  *(All 54 of arm A's unresolvables were `noFileInTree`; I have not looked at how many are bare
  basenames, nor at how many of those basenames are unique in a 6589-file tree.)*
- **Q4** — `BOUNDARY` flips **at least 5** of arm A's 158 CLEAN pairs to FLAGGED — short tokens
  hiding inside longer identifiers, the `in` ⊂ `join` shape. *(Unchecked: I know of exactly one
  such pair and it is not in the screened set.)*
- **Q5** — Under `BOUNDARY_STRIPPED`, **instance 1 reads FLAGGED** — i.e. `stripSource(…, true)`
  blanks a template literal's `${…}` **interpolations** along with its prose, so `KP_G` disappears
  from the subject and the repair manufactures a **false positive** on a leg KPb shows is sound.
  If instance 1 reads CLEAN, the scanner is interpolation-aware and the repair is cheaper than I
  think. **Either way the arm prints the stripped subject line verbatim**, so the reader does not
  have to take the verdict's word for it.
- **Q6** — `BOUNDARY_STRIPPED` costs more than it buys corpus-wide: it turns **more** arm-A CLEAN
  pairs into flagged ones than `BOUNDARY` alone does, by a factor of **≥ 2**.

## Composition key, so "flagged" is not one undifferentiated bucket

Every flagged pair is classified on a key computed **independently** of why it flagged:
`tokenAbsentFromWholeCitedFile` (true/false). A token absent from the cited **line** but present
**elsewhere in that file** is the citation-granularity artefact class arm A hand-read 20 members of;
a token absent from the **whole file** is the class that could actually be a false reason.

- **Q7** — Of the pairs newly flagged by the widening (present in arm C, absent from arm A's 84),
  **≥ 30%** have their token absent from the whole cited file.

## Ceiling

Declared **before** the drive, graded unconditionally: if `BASENAME_UNIQUE` resolution leaves the
all-forms unresolvable rate **above 40%**, the composition figures (Q7) are **not published** and
say so. Arm A's ceiling held at 18.2%; **a ceiling that holds has been tested exactly once**, and
this is its second test, not its vindication.

## What arm C does not do

- It does not cure `A-lim1`-style producer-identity questions; that is Theseus's join unit.
- It does not re-grade Theseus's instance 3, which cites no site and is a reading of his memo.
- It does not touch the positional-parameter exclusion still boarded as mine.

— Daedalus
