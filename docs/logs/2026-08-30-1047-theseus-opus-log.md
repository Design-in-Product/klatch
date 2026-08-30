# Theseus — 2026-08-30 (START fire, 10:47 PT)

Model: Opus 5 · Worktree: `/Users/xian/Development/klatch-worktrees/theseus` · Branch: `claude/theseus-cycle`

---

## 10:47 — Briefing

Wrapper synced the worktree to `origin/main` before the fire; `git status -sb` clean at
`cf7054a` (Daedalus's 8/30 log wrap). Read `docs/COORDINATION.md` and swept `docs/mail/`.

**Two memos dated 2026-08-30:**

1. `daedalus-to-theseus-cc-xian-team-it-is-limb-8b-and-your-own-fix-had-already-drifted-2026-08-30.md`
   — **addressed to me.** Rules my Round 118 candidate into rule **8b** (under 8, lettered) rather
   than minting rule 17; corrects my Round 118 fix (all three mutant sites re-expressed their
   check's predicate inline, one already drifted at commit time); leaves one open item in §6: the
   cross-file 8b sweep of the other `scripts/verify-*.mjs`, explicitly unrun.
2. `iris-to-xian-cc-team-import-confirm-step-scope-doc-21-days-idle-2026-08-30.md` — **cc me,
   addressed to xian.** Escalation on `docs/ux/import-confirm-step-scope-2026-08-09.md`, 21 days
   idle, asking xian for one of three calls. No action on my seat; it is xian's decision, not
   mine to make or to pre-empt. Read, not actioned, deliberately.

Work unit for this fire: **close Daedalus's §6 open item** — zero-spend, verification-shaped, and
the rule being swept for is one I proposed.

## 10:50 — The sweep

All twelve `scripts/verify-*.mjs` read for check/mutant pairs, under **three** vocabularies rather
than one (`MUTANT`/`mutation`; `negative control`; `blunted`/`stand-in`/`must be caught`). The
single-idiom grep would have missed two files. Raw hit counts measured, and they are not the signal:

| file | `mutation` hits | pair sites | verdict |
|---|---|---|---|
| `verify-rule-discrimination.mjs` | 35 | 2 (§f only) | clean — Round 119's shared bindings |
| `verify-verifier-exit-codes.mjs` | 29 | 2 (C, D3) | clean by a *different* mechanism |
| `verify-design-assertions-gated.mjs` | 13 | 2 (§a, §c) | **both defective** |
| `verify-premise-render.mjs` | 2 | 0 | prose references only |
| `verify-empty-tail-detector.mjs` | 0 | 2 | clean **by inspection — could not run** |
| `verify-recogniser-equivalence.mjs` | 0 | 1 | clean **by inspection — could not run** |
| other 7 | 0 | 0 | no pair to sweep |

Confirmed Daedalus's "§(f) only" claim by reading rather than trusting: every `MUTANT_*` binding in
`verify-rule-discrimination.mjs` is in the 860–910 range, i.e. §(f). No other section has a pair.

## 10:52 — Two defects found, both fixed

In `verify-design-assertions-gated.mjs` — the file that checks the rules document, re-run green at
29 by Daedalus this morning. Green was never the question.

- **§(a), as-of split (my own Round 118 fix).** LIVE predicate written inline, copied inline at the
  mutant site — identical today, one edit from uncoupling. And the mutant check's *sentence* is a
  conjunction (*"…while the frozen record is unchanged"*) whose *expression* evaluated only the
  first conjunct; `MUTANT_PROPS` had exactly one reader. The unevaluated conjunct is the
  independence of the two tenses — the whole point of the split.
- **§(c), WEAKENS use sites.** Mutant read `WEAKENING_USES[0].sites` while the live check loops the
  whole list. n=1 today so they agree; a second WEAKENS property widens the check and not the
  mutant. The n=1 condition is stated in the file three lines above, as a reason to trust it.

Fixed with named bindings applied to both inventories (`frozenFindingsIn`, `openTodayIn`,
`supportingSitesIn`), the §(c) mutant rebuilt to mutate the inventory rather than a slice, both
conjuncts evaluated, and four `BITES` checks — including two asserting each mutation does *not*
move the neighbouring expression.

**`node scripts/verify-design-assertions-gated.mjs` → PASS, all 33 self-checks (was 29).**

## 10:53 — Against myself: the rig reported five non-answers, twice

Self-mutation rig to prove the four new checks can go red. Versions **one and two** reported
`rc=2, failures=0` for all five mutants. Exit 2 in that file is *"an input document is not on this
seat"* — it derives `REPO` from `dirname(import.meta.url)/..`, so mutants in `/tmp` find no
`docs/`, and a `scripts/.r120-scratch/` subdir shifts `REPO` down one level and reproduces it.
Five patches applied, five INCOMPLETEs, zero information. I built an instrument that mistakes a
non-zero exit for a kill, in the fire whose subject is instruments reporting coverage they lack.

Caught by two things, neither of which was care: printing exit code and failure count *separately*,
and an **M0 unmutated control required to stay green**, which named the cause both times.

Version three, mutants written directly into `scripts/` and removed after:

```
M0 CONTROL (unmutated)                                   rc=0 green
M1 'P6u' -> 'NOPE' (mutation stops biting)               rc=1 KILLED, 2 failures
M2 non-P6u branch p -> {...p, gate: null}                rc=1 KILLED, 2 failures
M3 re-inline openTodayIn at mutant site, one clause off  rc=1 KILLED, 1 failure
M4 i === 2 -> i === 99 (reclassification stops biting)   rc=1 KILLED, 2 failures
M5 delete the site instead of reclassifying it           rc=1 KILLED, 3 failures
scratch mutants removed: true (6 files)
```

Each of the four new checks red under at least one mutant. Rig deleted; the mutants are recorded
verbatim in the round doc so this is reproducible without it.

## 10:54 — Verifier suite re-run (measured, not carried)

```
verify-design-assertions-gated.mjs   PASS — all 33 self-checks passed   (was 29)
verify-rule-discrimination.mjs       PASS — all self-checks passed      (unchanged, re-run)
verify-verifier-exit-codes.mjs       PASS — 19/19 assertions passed
verify-premise-render.mjs            PASS — 20/20 assertions passed
verify-empty-tail-detector.mjs       CRASH — ERR_MODULE_NOT_FOUND
verify-recogniser-equivalence.mjs    CRASH — ERR_MODULE_NOT_FOUND
```

Both crashes are `packages/server/src/db/queries.js` — a build artifact absent from this worktree.
**Pre-existing and unrelated to this fire:** `git status --short` showed exactly one modified file
(`scripts/verify-design-assertions-gated.mjs`); `packages/` was never touched. Consequence recorded
honestly rather than papered over: my clean 8b verdict on those two files is **inspection-only**,
not run, and it stays that way until someone on a built seat runs them.

## 10:55 — Deliverables and mail

- `docs/research/round120-the-sweep-found-two-more-and-my-own-rig-reported-five-non-answers-2026-08-30.md`
- `docs/mail/theseus-to-daedalus-cc-xian-team-sweep-closed-two-more-sites-and-a-third-way-to-discharge-the-structural-limb-2026-08-30.md`
  — closes his §6; reports both defects; and asks him to rule on a **third discharge route** for
  8b's structural limb that I found in `verify-verifier-exit-codes.mjs` D3: a string copy of the
  expression, where drift is **fail-loud** via 8a's `applied` guard rather than silent. Rules
  document **not** edited — 8b was his ruling, so the amendment is his call, same as when I
  proposed 8b and he ruled it.
- Mail hygiene: `git mv`'d my 8/29 outbound (the question Daedalus's 8/30 memo answers in full) to
  `docs/mail/read/`. His 8/30 memo **stays** in `docs/mail/` — §5 `fixedBy` mis-attribution is open
  on his seat and my §3 now asks him for a ruling.

**No count moves.** Region count 3, surviving discriminating shapes 10, four underived pre-spend
conditions still four. Zero API calls, zero model calls, zero live runs, no GO requested.

## 10:56 — Wrap verification

Steps 1–3 of the Session Wrap Protocol, run below rather than asserted.
