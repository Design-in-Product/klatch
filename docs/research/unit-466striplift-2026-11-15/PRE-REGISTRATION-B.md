# unit-466striplift — pre-registration B

**Seat:** Theseus · **Date:** 2026-11-15 (START fire, same fire as arm A) · **Pin:** `70e58f2a`
**Arm A's recording is frozen at `e3f14be1`** (`git log origin/main --oneline -1` read back after the
push, not drafted). This file is pushed **before `arm-striplift-b.mjs` exists**.

## Why there is a B at all

Arm A came back `VERDICT/0 GREEN legs=11 red=[] preds=6 refuted=[] prefused=[]` — **6 of 6 landed,
0 red**. That is the result that should be audited hardest, not celebrated: a clean sweep usually
means the predictions were safe, not that the subject is sound. Auditing arm A's own output found
two defects in it and one coincidence that could have been read as validation. Arm B exists to
land those three, and it grades **arm A**, not the corpus.

### A-defect-1 — the member-path proxy is wrong on its entire residue

Arm A classed member-path-ness with a name proxy: the stripped token's last identifier segment
matching `/^(p|f|path|rel|abs|file|fp|target|subject)$/i`. It reported `NOT_A_MEMBER_PATH = 5`,
`UNEXTRACTED = 1`. I then hand-read all 6 at the pin. **The proxy is right about 1 of 6, and that
one is right for a false reason.**

The hand verdicts, recorded here before arm B exists, keyed on `path:line` (unique; a bare line
number is ambiguous when the id repeats across files):

| site | proxy | HAND | why |
|---|---|---|---|
| `round411-instruments/cure-the-wrapped-call-and-the-body-key.mjs:628` | `UNEXTRACTED` | `MEMBER_PATH` / `LOSSY_BASENAME` | `(r.path ?? R408).split('/').pop()` — the receiver is a parenthesised expression, so the token regex matched nothing |
| `round456-instruments/drift-census-over-the-verdict-publishing-population.mjs:361` | `NOT_A_MEMBER_PATH` | `MEMBER_PATH` / `LOSSY_BASENAME` | `o` is a recording path; the proxy only objects to its *name* |
| `unit-464addarm-2026-11-04/grade-addarm.mjs:451` | `NOT_A_MEMBER_PATH` | `MEMBER_PATH` / `INVERTIBLE_PREFIX` | `r` is a repo-relative path |
| `unit-464addarm-2026-11-04/grade-addarm.mjs:478` | `NOT_A_MEMBER_PATH` | `MEMBER_PATH` / `INVERTIBLE_PREFIX` | same |
| `unit-464class-2026-11-02/enumerate-legs.mjs:275` | `NOT_A_MEMBER_PATH` | `NOT_A_MEMBER_PATH` | **right verdict, false reason** — see below |
| `unit-464sat-2026-10-31/grepro.mjs:133` | `NOT_A_MEMBER_PATH` | `MEMBER_PATH` / `LOSSY_BASENAME` | `r.from` is a recording path |

`enumerate-legs.mjs:275` is the instructive one. The line is
`…${KP_G.replace('docs/research/', '')} [${kpGLegs.map((l) => l.id).join(',')}]`. The `.map(`
publishes **leg ids**, and the strip applies to `KP_G`, a single path that is not the mapped list at
all. So this is a **false positive of `K-strip` itself** — a `.map(` and a strip merely co-located
on one physical line. The proxy excluded it because `KP_G` is not in `PATHISH`; but `KP_G` *is* a
path. The verdict agrees with hand and the reason is false, which is the shape this seat has
already been burned by (`feedback_a_legs_reason_string_drifts_false_while_its_predicate_stays_true`).

**The cure is a key, not a longer name list.** `K-strip2` requires the stripped token's **root
identifier to be a parameter of the `.map(` callback** — extracted from `.map((X) =>`,
`.map(({a, b}) =>`, `.map((X, i) =>`. That excludes `enumerate-legs.mjs:275` for the *right* reason
(`KP_G` is not a callback parameter) and admits every site the hand read admits.

**Declared, with its reach to be measured, not implied:** I hand-read the proxy's 6 *negatives*. I
did **not** hand-read its 54 *positives*, and a proxy scoring 1-of-6 on its negatives has not
earned trust on its positives. `K-strip2` is what probes the positives, because it is an
independent key rather than a longer version of the same one; `B-cure2` reports every positive it
disagrees with and those are hand-sliced in `RESULTS.md`.

### A-defect-2 — `A-lim2`'s reach figure is a substring artefact

`A-lim2` published "**322** local strip-named helpers" from
`/^\s*(?:const|function)\s+(\w*(?:strip|short|display|pretty|rel|base)\w*)\s*[=(]/i`. The `rel`
alternative is a bare substring, so it matches `unrelated`, `relocated`, `relevant`, `released`.
`322` is not a reach; it is noise with a reach hidden inside it. Arm A's own printed sample contains
`BASE`, `relocated`, `short` and `unrelated`.

This is my own instance of the undifferentiated-containment-match defect, committed inside a
*declared limit* — the place it does most damage, because a declared limit is the number nobody
re-derives. `B-lim2cure` re-keys on the declaration's **body**: brace-balanced from the declaration
line, does the body contain a strip spelling. Both figures are published side by side.

### A-coincidence — 60 and 60 over populations differing by 17 files

The scoping read in `PRE-REGISTRATION.md` walked the working tree and found **488** source files;
arm A's `ls-tree` at `70e58f2a` found **472**. Both keys enumerated **exactly 60 sites**. The
difference is 17 paths — 14 gitignored `scratch/` sandbox copies, 2 `.sliced.mjs` artefacts, and
(now) this unit's own arm.

Had I read "60 = 60" as confirming the scoping key, I would have validated nothing: the **counts**
agree while the **member lists** diverge by 17. This is
`feedback_two_keys_sharing_a_denominator_agree_vacuously` with the denominators *not* shared, which
is worse — the agreement looks like independent corroboration.

It also shows the walk key censuses its own source. `arm-striplift-a.mjs` itself contains
`.map(` + strip lines, so the walk key re-run **now** must enumerate more than 60; the pinned key
cannot, structurally.

## Predictions — each about a figure no run has printed

- **`Q1`** — `K-strip2` reproduces the HAND verdict on **all 6** residue sites: it excludes
  `enumerate-legs.mjs:275` and admits the other 5.
- **`Q2`** — the `enumerate-legs.mjs:275` shape (a `.map(` and a strip co-located but unrelated) is
  **not unique**: `K-strip2` excludes **≥1 further site** from among arm A's 54 positives.
- **`Q3`** — arm A's headline **survives** the correction: `LOSSY_BASENAME` is still ≥50% of
  member-path sites under HAND + `K-strip2`. If this refutes, arm A's `P1` was carried by the
  proxy's errors.
- **`Q4`** — of the 322 name-matched declarations, a **majority (≥50%)** have no strip spelling in
  their brace-balanced body, i.e. `A-lim2`'s published reach is mostly artefact.
- **`Q5`** — at least one committed `*.out` recording in the corpus publishes a JSON string array
  containing a **literal duplicate entry** — ambiguity realised in a published artefact rather than
  argued in principle.

## Declared limits of arm B (limits only; housekeeping is in the section after)

1. **`K-strip2` is still single-line and still regex.** A callback parameter destructured across
   lines, or a strip applied to a value assigned from a parameter one statement earlier, is
   invisible. **Reach to be measured** (`B-lim1`): count of sites where `K-strip2` finds parameters
   but no strip token root among them, printed with their text so the residue is hand-checkable
   rather than assumed empty.
2. **The hand map covers 6 of 60 sites.** Its 54 unchecked positives are probed by `K-strip2`, an
   independent key, not by a second reading of the same one. **Reach: 6/60 = 10% hand-covered**,
   stated as a fraction rather than as "hand-verified".
3. **`Q5`'s duplicate scan is keyed on JSON-rendered string arrays only.** A member list published
   as a ` | `- or `, `-joined string is invisible to it. Declared; not measured, and **boarded**.

## Housekeeping (not limits)

- Arm B reads arm A's recording **frozen at `e3f14be1`** via `git show`, and re-derives the same
  figure live from `PIN`. Two provenances; the agreement is the gate (`B1`). A leg reading a frozen
  artefact *and* the live subject as one reading would be neither pin nor gate, so they are
  separate legs.
- Arm B drives and edits nothing in any other unit. `unit-465p12site`'s arm B is not re-driven.
- `B-gate`: `git status --porcelain packages scripts docs/research/lib` empty.
- A crashed drive is kept, not overwritten.
