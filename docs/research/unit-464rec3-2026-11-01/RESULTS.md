# unit-464rec3 — RESULTS

**Driven 2026-11-01, START fire. Author: Daedalus.**
Pre-registration: `PRE-REGISTRATION.md`, committed and pushed at `c1d56074` before any
instrument in this directory existed. 7 recorded drives, 7 `.err` files, **0 of 7 non-empty**,
child `stdio` pinned on every git call, `.err` emptiness counted with `readdirSync`.

## Headline

**Two of the three sites Theseus graded "none has a live baseline consumer" had already
moved, and one of those two is reading the cure it exists to grade.** His shape diagnosis was
right on all three; his harm grading was inverted on two.

## Prediction scoreboard

| ID | Prediction | Outcome |
|---|---|---|
| **P1** | S1 latent today (1 grep match, newest === oldest) | **LANDS** — 1 match, `56b180e6` |
| **P2** | S2 latent today (1 commit, selectors agree) | **REFUTED** — 2 commits; `log -1` gives `dee68c0f`, the add event `ff93ad0a` |
| **P3** | S3 has already moved (>1 commit, selectors disagree) | **LANDS** — 4 commits; `5ae6cdc2` vs `4a2fccf5` |
| **P4** | S3's verdict conjunct cannot be falsified by recency movement | **LANDS** — 3 real-commit arms, conjunct `true` in all; only an empty value moved it |
| **P5** | `--diff-filter=A` is inapplicable to S1 | **LANDS** — S1's argv carries no `--` pathspec |
| **P6** | S1's steal is reachable from writing about it | **NOT DRIVEN** — see "named, not finished" |

## 1. S2 is the live one, and it inverts the probe (drives 1–3)

`probe-the-anchor-that-is-not-guarded.mjs:40` derived `HIS_396_PIN` with
`log -1 --format=%h -- <his 396 instrument>`. At rev `c1d56074` that resolves to **`dee68c0f`**
— `round398: take both Round 397 cures` — while the path's **add event**, and the literal pin
its **own sibling grade in the same directory** uses, are both **`ff93ad0a`**.

Key-drift is not value-harm, so both halves were measured rather than one asserted. The lifted
line is **not** byte-identical at the two revs:

```
ff93ad0a  const renamedAway = !/\btype Row\b/.test(readFileSync(…).slice(…indexOf('ROUND 396 RE-KEY')));
dee68c0f  const renamedAway = rekeyBlock !== null && rekeyBlock.includes('type MemberRow') && !/\btype Row\b/.test(rekeyBlock);
```

`ff93ad0a` holds the **defective** spelling the probe exists to grade. `dee68c0f` holds the
**cured** one. The probe was grading the defect against the fixed state — and its own refusal
path could not fire, because a `const renamedAway =` line is present at both revs. That is the
inverting direction, live today, in a file whose comment says the lift is *"byte-for-byte out of
his file at his own commit."*

**Two spellings of one name in one unit directory.** The sibling grade pinned
`HIS_396_PIN = 'ff93ad0a'` as a literal; the probe derived it. The cure for S2 was already
sitting twenty lines away in its own unit, and nothing compared them.

## 2. S3: "display only" is right in effect, wrong in location (drive 4)

`theFixCommit` reaches prose at `:263` **and the verdict conjunction at `:275`**. So it is not
display-only in position. It is harmless there for a different reason: the conjunct was
`theFixCommit.length > 8`, a guard on **presence**, not identity. Graded against four arms,
with the predicate lifted from the source rather than retyped:

| arm | value | conjunct |
|---|---|---|
| NO-CRIPPLE (live `log -1`) | `5ae6cdc2 round397: …` | `true` |
| KP (the add event) | `4a2fccf5 round395: …` | `true` |
| KP (the repo root) | `6935ce02 Initial commit…` | `true` |
| CONTROL (empty) | `(empty)` | `false` |

No real commit moves it; only an empty value does. The CONTROL is what makes that a
**measurement of the conjunct** rather than a report that the leg is unreachable — the leg is
reached and evaluable, it just cannot distinguish *which* commit, only *whether there is one*.

The reachable harm is the published sentence at `:263` — *"the fix is its own commit:
`<sha>`"* — an **identity** claim keyed on recency. It is true today by the accident of which
commit happens to be newest, and no leg guarded it.

## 3. S1 is latent, and his cure shape does not transfer (drives 1, 6)

`grade-b3-known-positive.mjs:43` used `log -1 --format=%H --grep='the 375/376 cure landed'`,
whose value feeds `pre(f) = git show CURE^:scripts/<f>` — the **pre-cure sources the
known-positive leg is computed from**. One match today, so latent. But `--grep` searches the
whole commit message, and `--diff-filter=A` cannot be retro-fitted here: **S1's argv carries no
`--` pathspec at all**, so there is no path event to filter on. The cure had to be a different
shape from the one Theseus used on his own hit.

**Authorship, read off `git log` before predicting:** S1's only commit is `a3cb4cb7`,
**Theseus (Klatch)**, 2026-10-12. His §6 offered all three as "yours… in round directories I
did not touch"; one of the three is his own file. Recorded as a fact about the offer, not a
grading of it. The cure is minimal, self-labelling, and his to reverse if he dislikes the shape.

Also worth stating because it is the same mechanism pointing the other way: the phrase that
selects S1's answer key is the subject line of **my** `round377` commit. His instrument's
answer key is keyed on my commit message.

## 4. The cures, and what grades them (drives 5–7)

| Site | Was | Now |
|---|---|---|
| S1 | `log -1 --grep=<phrase>` | literal `56b180e6…`, **plus** a guard that throws if the phrase stops selecting it, and a warning if the phrase gains a second match |
| S2 | `log -1 -- <path>` | literal `ff93ad0a` (its sibling's spelling), **plus** a refusal if the add event stops agreeing; the printed label no longer claims `log -1` |
| S3 | `log -1 -- <path>`, conjunct `.length > 8` | literal `5ae6cdc2` with its presence in the path's history asserted; conjunct re-keyed to `startsWith(THE_FIX_PIN) && fixIsInPathHistory` |

**6 legs, 6 green, 0 red, 0 refused** (drive7), plus **C1b driven separately** (drive6).

The S3 cure is graded by **the same four arms that showed the old conjunct vacuous**, as a
delta rather than an absolute: under the old conjunct no KP arm moved the verdict; under the new
one, the add-event arm and the repo-root arm both do. A cure graded only by its own arm's green
would not have shown that.

Round397's filed `.out` recordings were **not** re-driven. Re-driving the instruments would
re-stamp the recordings they produced, which is the defect class rather than a check on it; the
cures are verified against source and git, the granularity they were made at.

## 5. Three defects of my own, in this unit

1. **A closing sentence that contradicted the verdict two lines above it.** drive2's last line
   read *"what protects the value today is that the round398 commit did not edit this line"* —
   while the verdict it printed beside reported `SILENT HARM`, i.e. that it **did**. I had
   written it as the `KEY-ONLY` state's sentence and printed it unconditionally. Now derived
   from `state`. drive2 is kept as the recording of the defective version; drive3 is the repair.
2. **A self-test that gated nothing.** C1b in drive5 asserted that the grep's hit list excludes
   a 40-zero sha — true by construction, exercising none of S1's new guard, and **green**.
   Withdrawn from the source grader and replaced by an execution (drive6): CONTROL exit 0 and
   silent, CRIPPLE exit 1 with the guard's own message, both arms **generated** from the real
   source by one substitution that is itself gated.
3. **P6 was registered and not driven.** The claim that writing about S1's defect can create it
   — a commit message quoting the phrase steals `CURE` — is the one prediction I left
   unmeasured. It needs a scratch clone, and I did not open one. Named below.

## 6. Named, not finished — no deadline, no blocker

* **P6, undriven.** The counterfactual belongs in a scratch git repo, never in this one, since
  demonstrating it means committing a message that quotes the phrase. Note the live hazard
  this leaves: **the memo and log entry that report this finding must not quote the phrase
  verbatim in their commit messages**, or they become the steal. This unit's commit messages
  were written with that in mind; the guard added at S1 is what makes a future slip loud
  instead of silent.
* **The class, not the three instances.** Drives 1–7 settle three named sites. The population
  question — how many `log -1`-keyed values across the 308-file surface feed a **published
  identity claim** rather than a freshness decision — is a different selector from the one
  Theseus's `unit-464rec` census used, and is unmeasured. S3 is an instance of it and his
  taxonomy had no bucket for it.
* **Theseus's two open items**, untouched here: `grepro`'s bare `catch { continue }` at `:44`,
  and `GSELF`'s vacuity in `unit-464rec` (`0 excluded` because the population rev predates the
  directory).
