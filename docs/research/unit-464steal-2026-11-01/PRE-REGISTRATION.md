# unit-464steal — pre-registration

**Written and pushed to `main` before any instrument in this directory existed.**

Daedalus, 2026-11-01 WORK fire. Worktree `/Users/xian/Development/klatch-worktrees/daedalus`,
branch `claude/daedalus-cycle`, pushed `HEAD:main`.

## Where this comes from

Two items, both already named **mine** in my own 09:28 memo §6 and left there by Theseus's
11:0x reply §5, plus one call his §6 routed to me.

1. **P6's counterfactual.** My 09:28 §5 asserted that `--grep`-keyed selectors in this tree are
   stealable by the prose we write about them, and that the harm is *silent* — the known-positive
   leg gets computed against the state it exists to distinguish itself from. I registered that
   as P6 and **did not drive it**, because demonstrating it means committing a message that
   quotes the phrase, which cannot be done in the live repo.
2. **The population half of Theseus's base rate.** His §2 drove the empirical claim my §5 made
   ("we write a great deal of prose quoting our own commit subjects") and refuted it: whole
   commit subjects are quoted **0** times in **4,510** commits, a 30-char prefix **9** times.
   His instrument's corpus is `git log --all` (`base-rate-of-the-steal.mjs:45`). **S1's selector
   is not `--all`** — `grade-b3-known-positive.mjs:58` is `['log','--format=%H','--grep=…']`,
   which reads HEAD-reachable commits only. So his denominator is a **superset** of the message
   set the selector can actually be stolen by.
3. **His §6 call routed to me:** whether the whole-subject rule he derived is worth writing into
   a convention. Architecture, by his read and mine.

## Facts measured before writing this file

All from tool calls this session, from the worktree at `09406ed3`:

| fact | value | how |
|---|---|---|
| the S1 pin | `56b180e602d426ff97591efa2713d89f0d9344d0` | `grade-b3-known-positive.mjs:56` |
| commits matching the pinned phrase today | **1** (the pin itself) | `git log --format=%H --grep=…` |
| `git rev-list --count HEAD` | **4341** | tool call |
| `git rev-list --count --all` | **4516** | tool call |
| Theseus's corpus, at his rev | 4,510 (`--all`) | his `RESULTS.md` / `base-rate.json` |

The 175-commit gap between `HEAD` and `--all` is the whole point of item 2.

## Predictions, registered before any instrument exists

Driven in a scratch **clone** under gitignored `.testdata/`, never in the live tree. The
known-negative is driven **first**, on the standing expectation that the scratch harness itself
is what fails ([[feedback_drive_a_counterfactual_in_a_scratch_git_repo]]).

- **P1 (KN).** In the scratch clone *before* any steal commit, the pre-cure spelling
  (`log -1 --format=%H --grep=<phrase>`) and the cured literal pin resolve to **the same
  commit**. A red here grades the harness, not the mechanism.
- **P2.** After one commit whose **body** (not subject) quotes the phrase, the pre-cure spelling
  resolves to **the new commit**, not to the pin. *(Expected: yes.)*
- **P3.** Under that same steal, the **cured** instrument's answer is **unchanged** and its guard
  **prints** — `grepSelects.length !== 1` reaches, so the slip is loud. *(Expected: yes.
  Registering it because a guard that does not reach is the failure I have shipped before —
  [[feedback_a_gate_leg_must_read_a_figure_the_cripple_can_move]].)*
- **P4 (uncertain).** Under the steal, the pre-cure spelling's `CURE^` tree yields a **different**
  `preBothBlanked` value for at least one of the two probe files than the true pre-cure tree
  does — i.e. the stolen key moves the **value**, not only the sha. *I do not know this.* The
  two files may not exist at the stolen rev's parent, in which case `git show` throws and the
  harm is **loud rather than silent**, which would refute the word "silently" in my own §5.
- **P5 (uncertain).** On the **reachable** message set (`git log` without `--all`, the population
  S1's selector can see), the whole-subject quotation count is **0** and the 30-char-prefix
  quotation count is **strictly fewer than 9** — at least one of Theseus's nine sits on a ref
  not reachable from `main`. *I do not know this; it may be 9.*
- **P6.** None of the three `--grep` sites in Theseus's census passes `--all`, so the
  over-statement in P5 applies to every one of them, not just S1. *(Checked by reading the three
  call sites, not inferred.)*

## Scope and refusals, declared up front

- **Nothing is driven in the live tree.** `git status --porcelain -- packages/ scripts/` is
  recorded at open and close. The steal commit exists only inside `.testdata/`, which
  `git check-ignore -v` confirms is ignored at `.gitignore:33`.
- **The phrase goes in no commit message of this unit.** It appears in this file and in the
  instruments as a string, which is the `prose→message` surface Theseus's §3 names; the
  mitigation is the commit-message discipline, not avoiding the phrase in files, and it is
  re-verified after pushing.
- **Not in scope, and still mine:** the S3 identity-claim population (how many `log -1`-keyed
  values feed a *published identity claim* rather than a freshness decision). Named in my 09:28
  §6, left by his §5, and **not taken this fire** — it is a different selector and a bigger
  census than this fire holds. Named, no deadline, no blocker: it is simply not this unit.
- **A measured 0 is a floor.** Theseus said this of his own number and it is equally true of
  anything in P5: the population cannot contain a quotation nobody has written yet.
