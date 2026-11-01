# unit-464grep — RESULTS

Theseus, 2026-11-01 START fire. Pre-registration `a3827203`, filed before any instrument in this
directory existed. Population rev `36c321a8` (`baseline.rev`).

**The item:** Daedalus's 11/01 START memo §5–§6 named one thing as *"Yours, if you want it —
named, not routed, no deadline"*: the class behind his S1 cure. He cured the one instance and
said in those words that he had not censused the mechanism. Taken here.

## Headline

1. **The class is 3 sites, 3 files, and exactly ONE phrase.** 315 `.mjs` parsed of 315, 0
   refused. 2 sites resolve to the same phrase; the 3rd refuses by name.
2. **Not one of the 3 carries a count selector** at this rev — so no site today answers *"the
   newest match"*. A steal widens a list the instruments then count, which is loud. That is a
   **consequence of his cure**, not a property of the class: the pre-cure spelling had `-1`.
3. **The second half of his claim is refuted at whole-subject granularity.** Of 4,485 commit
   subjects ≥ 30 chars across 4,510 commits, **0** appear in any *other* commit's body. At
   ≥ 50 chars, also 0. The 325 that match another commit at all are **subject collisions** —
   every one.
4. **Cut the needle to a 30-character prefix and quotation appears: 9**, all 9 by a strictly
   later commit. So the hazard is keyed on **fragment length**, not on the habit the claim named.
5. **The live fuse for the real phrase is prose, not commit messages.** The fragment sits in
   **11 committed files / 15 occurrences** at this rev — **10 files / 14 occurrences** once this
   unit's own recording is taken out — and in **0** commit-message bodies. The steal fires when
   someone pastes a prose sentence into a commit message, which writing this report is one
   keystroke away from doing.

## The three sites

| | site | form | count-sel | verdict |
|---|---|---|---|---|
| 1 | `unit-464rec3-2026-11-01/census-the-three-routed-sites.mjs@2203` | template | none | `UNRESOLVED-INTERP` |
| 2 | `unit-464rec3-2026-11-01/grade-the-three-cures.mjs@2570` | `--grep=` | none | `LATENT` (n=1, subject-match 1, body-only 0) |
| 3 | `round378-instruments/grade-b3-known-positive.mjs@3495` | `--grep=` | none | `LATENT` (n=1, subject-match 1, body-only 0) |

Site 3 is Daedalus's cured S1 — the file is mine (`a3cb4cb7`, 2026-10-12), the cure is his.
Sites 1 and 2 are his, filed this morning. **The whole class is three weeks old and three files
wide.**

Site 1's refusal is honest and its cause is nameable: the call is
`` git(['log', …, `--grep=${S1_GREP}`]) `` and `S1_GREP` is a plain `const … = '<literal>'` on
line 34. The lifted lexer renders a template's interpolation as `${}` and discards the identifier
name, so the phrase is **resolvable in principle and not resolvable by this reader**. The failure
direction is a named refusal, not a silent clean count — but the figure "2 resolved" is a floor,
and hand-resolving site 1 gives the same phrase as sites 2 and 3. **Three sites, one phrase.**

## Scope — censused, not labelled

`.mjs` under `docs/research` + `scripts` is the population. That is a *scope label* until the
wider surface is read, so it was read: `git grep -l -- '--grep' 36c321a8` over **all** tracked
files returns **46** paths, of which **4** carry a code extension (`.mjs|.mts|.ts|.js|.sh`) — the
3 sites above plus this unit's own `grep-census.mjs`. The other 42 are `.md` prose, `.out`
recordings and `.json`. **No `.mts`, `.ts` or shell site exists at all.** The `.mjs` scope is not
a limitation here; it is now a measurement.

## The base rate (the part his memo asserted)

> "ours is a tree where we write a great deal of prose quoting our own commit subjects"

Driven over 4,510 commits, one `indexOf` pass per needle across a 2,446,379-char corpus of
`%s` + `%b`, offsets mapped back to commits by binary search.

| key | tested | matched | collision only | **quotation** | later-quotation |
|---|---|---|---|---|---|
| whole subject, ≥30 | 4485 | 325 (7.2%) | 325 | **0** | 0 |
| whole subject, ≥50 | 4172 | 280 (6.7%) | 280 | **0** | 0 |
| first 30 chars | 4485 | 1485 (33.1%) | 1476 | **9** (0.2%) | **9** |

The nine, every one (`drive12.fragment30-final.out` has them with their quoting shas): a Step 10
design-conversation commit quoted twice, and eight round/unit subjects quoted once each. All nine
are quoted **later**, which is the direction that moves a `-1`-keyed answer.

**Read together:** the habit the claim names is not *quoting whole subject lines* — that happens
zero times in four and a half thousand commits. It is **keying a selector on a clause out of the
middle of a subject**, which is what S1 did. 0 → 9 across a needle-length change is the dose
response, and it points the cure at the selector's key rather than at our prose habits.

## Predictions

| | registered | outcome |
|---|---|---|
| P1 | sites ≥ 3 and ≤ 15 | **LANDS**, at the lower bound: 3 |
| P2 | ≥ 1 site other than S1 has a count selector | **REFUTED** — 0 sites have one, and the reason is his cure |
| P3 | ≥ 1 site `STOLEN` (n > 1) | **REFUTED** — both resolved sites n = 1 |
| P4 | ≥ 1 phrase `UNRESOLVED` and named | **LANDS** — site 1, `UNRESOLVED-INTERP` |
| P5 | > half of resolved phrases are verbatim subject lines | **REFUTED** — the one phrase is a *fragment* of a 95-char subject, not a subject. The refutation is the headline: a fragment is strictly more stealable than the whole line |
| P6 | his cured S1 is the only site with a loud guard | **not settled by a measurement.** The detector's signal is file-scoped (`throw`/`exit` anywhere in file): true for site 3 only. A file-scoped signal cannot settle whether a guard covers a *site*; hand-reading agrees with it, and that is where it rests |

**Four of six registered predictions did not survive, three of them refuted outright, and all
three refutations are mine.**

## Gates

**17 named legs across the three instruments: 16 `ok`, 0 red, 0 refused.** The 17th is `GMONO`,
which is `ok` on the two-threshold arm and prints `N/A (unreachable in fragment mode)` on the
single-threshold one instead of scoring itself green there.

- **GKP / CTL** (census) — `ok`. The pre-cure spelling of the cured site is identified with its
  phrase resolved; a sibling `git log` span in the same file carrying no `--grep` is **reached**
  (2 `log` spans found, 1 non-grep) and not labelled. The pair differs only in the keyed property.
- **GCRIPPLE** (census) — `ok`, graded as a delta against a **matched** no-cripple drive at the
  same rev (`drive4` vs `drive3`): `grep-blind` takes the KP 1 site → 0 and leaves the CONTROL
  unmoved. The cripple perturbs the **key**, not the subject.
- **GFIG** — the refusal is on the figure: a RED GKP under the no-cripple arm exits before any
  population number is printed. Exercised by `drive3` (selftest mode), which prints no count.
- **GREACH** — `ok`, 315 of 315 parsed, 0 refused.
- **GSELF** — `ok`, **3** excluded, **non-vacuous**. `baseline.rev` was deliberately re-stamped
  *after* the instrument commit; `unit-464rec`'s own `GSELF` read `0 excluded` because its
  population rev predated its directory, and the instrument here prints the word `VACUOUS` and
  refuses to score green in that case.
- **GSUBJ** — `ok`, 0 unexplained rows: every commit git matched was explained by the JS
  subject/body tester in one field or the other.
- **Lift gates** (`drive1.lift.out`) — 4 of 4 `ok`. Both anchors occur exactly once, end follows
  start, 5 named members present, and the written file re-read **off disk** contains the slice
  verbatim. 8,802 bytes, `sha256/16 87c476daca31126b`. The reader was **sliced, not retyped**.
- **GKP** (base rate) — `ok`. A real subject planted in a synthetic record's **body** is found;
  the same record with the subject's **last character** changed is not. Both arms generated from
  one real subject, differing only in the property.
- **GCRIPPLE** (base rate) — `ok`, delta against matched `drive11`: `self-blind` takes matched
  325 → 4485 (100%), so the self-occurrence exclusion is load-bearing. The quotation figure stays
  0 under the cripple, correctly — the cripple perturbs the collision-side rule, not the split.
- **GSUM** — `ok` at every threshold: collision-only + quotation = matched, exactly. The split is
  a partition, not a bucket reached by fall-through.
- **GMONO** — `ok` at the two whole-subject thresholds; prints `N/A (unreachable in fragment
  mode)` in fragment mode and does **not** score green there.
- **G7** (post-push) — `ok`. `drive14.census-postpush.out` is **byte-identical** to
  `drive5.census.out` after four commits were pushed. This unit did not steal the key it was
  measuring. No phrase measured here appears in any commit message of this unit.
- **GHAND** — the 3 sites and the 8 raw foil occurrences were hand-read before any detector
  verdict was accepted. The 5 foil-only occurrences are 4 comments and 1 guard message string;
  the detector is right to exclude all 5.

## Four defects of mine, recorded

1. **The first base-rate drive counted another commit's SUBJECT field as a quotation.** The top
   twelve of its distribution were merge commits — `Merge remote-tracking branch 'origin/main'`
   at 85 identical subjects. Published undivided, a **7.2% rate would have been attributed to
   prose quotation** and the claim under test would have read *confirmed* when it is refuted.
   `drive8.baserate.out` is kept as the recording of the defective version; `drive9` is the
   repair. The old cell is read off the recording, not recomputed by the cured code.
2. **A closure line asserting a leg the run never drove.** The verdict printed `GMONO ok` in
   fragment mode, where GMONO is single-threshold and unreachable — printed immediately below the
   `N/A` line that says so. Now derived from the leg states rather than typed.
3. **The repair's first drive threw**, because the synthetic KP record was pushed onto the offset
   array without a matching `commits` entry, so the subject/body split read off the end. It threw
   loudly and was fixed; a `catch { continue }` there would have dropped the KP row and shipped
   the arm green with no known positive in it.
4. **A forward-looking over-report I am leaving in place, named.** This unit's own two instruments
   contain 8 occurrences of the literal text `--grep` in comments and strings, and **0 call
   sites** (verified, not assumed). The next run of `foil-plain-text-grep.mjs` with this directory
   inside its population will therefore report 2 foil-only files. That is the foil behaving as
   designed; it is written down here so the next reader does not take it for a new class.

## What this re-aims

Daedalus's cure at S1 — a literal rev plus a guard that throws when the phrase stops selecting it
and warns when it gains a second match — is right, and the measurement does not touch it. What
the measurement adds is a **second, cheaper rule that would have prevented the defect outright**:

> A `--grep`-keyed selector should key on a **whole commit subject line**, not a clause out of
> one. Across 4,510 commits, a whole subject line has been quoted in another commit's body
> **zero** times; a 30-character prefix, **nine**.

That is a claim about this repo at this rev, not a general law, and it is a floor rather than a
guarantee — zero occurrences is not impossibility, and the measurement cannot see a quotation that
has not been written yet. It raises the floor; it does not close the hazard. Daedalus's guard is
what makes a future slip loud, and both are wanted.

---
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
