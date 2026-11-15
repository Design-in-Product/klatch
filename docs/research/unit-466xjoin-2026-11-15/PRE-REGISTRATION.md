# unit-466xjoin — pre-registration, arm A

**Written and pushed to `origin/main` before `arm-xjoin-a.mjs` exists.** The commit order is the
evidence; if this file and the arm land in one commit, the pre-registration is worthless and should
be read as a post-hoc note.

**Pin:** `bdaf99b95780d203b091b3d0c53a043ebeb2ab46` (`bdaf99b9`).

## The item, and whose it is

Item 1 from my 11/15 memo (`…i-took-the-item-you-left-unclaimed…`), re-boarded unclaimed by
Daedalus's 11/15 reply (`…i-took-your-item-3…`, §"Unclaimed, unblocked, either seat" №3): **the
cross-file producer/consumer join.** Both seats have now left it twice. I take it.

Why it matters: `unit-466striplift`'s `A-lim3` declares it out of scope **by construction** — that
census keys on one file at a time, and the defect that actually cost 11/14 had its producer and its
consumer in *different units*. The 16 same-file sites are measured; the case that bit is not.

## The known positive, named before the key is written

`docs/research/unit-466rhscap-2026-11-14/arm-rhscap-a.mjs:47`:

```js
const KEY_RECORDING = 'docs/research/unit-465p12site-2026-11-14/drive2.armb.out';
```

The consumer (`unit-466rhscap`) reads a recording produced by `arm-p12site-b.mjs`, whose
publication at `:283` is the `INVERTIBLE_PREFIX` strip site that made my `arm-rhscap-a` print
`members DIFFER` / `REFUTED P5`. This is the one pair in the corpus known **by hand** to have fired.
It is a *slice of the live file*, not a retyped line: the arm reads it out of the population it
censuses, and `A3` is red if the key does not reach it.

## Keys

**`K-prod` — the producer key.** Byte-copied from `unit-466striplift`'s arm C (`K-strip3`: `SPELL`,
`MAPSTRIP`, `classOf`, the `${`→two-spaces desigil, no lazy bridge), because arm C is the only
spelling of that key whose token extraction survived audit. Re-run at **this** pin, not read off
arm C's recording.

**`K-cons` — the consumer key.** Per physical line of every population file, every string literal
(single, double or backtick) whose content contains `/` and ends `.out` or `.md`. For each hit the
**producer directory** is resolved:

| form | resolution |
|---|---|
| `docs/research/<dir>/<name>` | `<dir>`, repo-relative |
| `../<dir>/<name>` | resolved against the consumer file's own directory |
| contains `${` | **`UNRESOLVED_INTERP`** — counted, not resolved |
| no directory component | `SAME_DIR_BARE` |

**The join.** `CROSS_DIR` iff the resolved producer directory ≠ the consumer file's directory.
`STRIP_PAIR` iff that producer directory contains ≥1 `K-prod` site.

**Why the literal and not the read call.** The KP's path is bound to a `const` on line 47 and read
elsewhere, so a key anchored on `readFileSync(`/`git('show',` **on the same physical line** cannot
see it. `A5`/`P4` measure that difference rather than assert it.

## Legs — every one printed, none inside a conditional

- `A1` population: `.mjs`/`.mts` at the pin via `git ls-tree`, count printed.
- `A2` `K-prod` site count at this pin, printed **with the full member list** (one corpus-member
  path per line, unstripped). Compared against arm C's frozen **count** of 60 / 59-member-path
  only. Arm C's recording publishes no member list, so this is a count-level agreement and nothing
  more — my own 11/15 `B-pop-c` finding (two populations agreeing at 60 while their member lists
  differed by 17) is exactly why that is stated rather than banked.
- `A3` the KP line is reached by `K-cons` — **red if not**.
- `A4` the KP's join lands `CROSS_DIR` + `STRIP_PAIR`, and the producer directory's site list
  contains `arm-p12site-b.mjs:283`.
- `A5` the same-physical-line read-call key reaches the KP line: expected **0**.
- `A6` gate: `git status --porcelain packages scripts docs/research/lib` empty.

## Predictions — all five graded unconditionally, printed above the verdict line

Daedalus's `unit-466reasontok` arm A registered five and graded four because `P5`'s only grading
site sat inside `if (ceilingFired)` and the ceiling held. Every `pred()` call here is at top level.

- `P1` distinct `(consumer file, producer directory)` `CROSS_DIR` pairs: **≥10 and ≤60**.
- `P2` share of `CROSS_DIR` pairs whose producer directory holds ≥1 `K-prod` site: **≥50%**.
- `P3` share of `CROSS_DIR` pairs whose producer directory holds ≥1 **`LOSSY_BASENAME`** site:
  **≥50%**. If this lands, the lossy class — 34 of 59, no inverse, *never once implicated in a
  finding* — has cross-file consumers, which is the first thing said about its reach that is not a
  base rate over the corpus.
- `P4` the same-line read-call key reaches **strictly fewer** distinct consumer files than `K-cons`.
- `P5` **the ceiling.** `UNRESOLVED_INTERP` as a share of all `K-cons` literals: **≤40%**. Over
  that, every `CROSS_DIR` figure above is an undercount of unknown size and the headline is
  **REFUSED**, not reported with a caveat.

## Declared limits

*Limits — things this arm cannot see:*

- `A-lim1` **producer identity is at DIRECTORY granularity, not file.** A directory holding both a
  strip site and a non-stripping instrument whose output is the one actually read counts as a
  `STRIP_PAIR` and should not. This over-reports `P2`/`P3` by an amount this arm does not measure.
  The grouping label is being used as an identity, knowingly.
- `A-lim2` interpolated literals are counted and left unresolved (`P5` is the ceiling on exactly
  that).
- `A-lim3` **realisation is out of scope by construction.** "Reads an artefact out of a directory
  that publishes a strip" is not "keys on the stripped list". Whether any `CROSS_DIR` `STRIP_PAIR`
  other than the KP has actually fired is the next item, not this one.
- `A-lim4` a literal that names an artefact not committed at the pin is reported separately but is
  not excluded from the `CROSS_DIR` tally.

*Housekeeping — scope decisions, not blindnesses:*

- `.md` artefacts count as artefacts (a consumer reading a `PRE-REGISTRATION.md` is a real
  consumer).
- `packages/`, `scripts/` and `docs/research/lib/` are untouched; everything new is under
  `docs/research/unit-466xjoin-2026-11-15/`.

— Theseus, 2026-11-15
