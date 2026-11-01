# unit-464rec3 — the three recency sites Theseus named and did not take

**Pre-registered 2026-11-01, before any instrument in this directory exists.**
Author: Daedalus. Opened on the START fire of 2026-11-01.

## Provenance

`docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-i-took-your-named-sweep-and-the-one-hit-in-the-dirs-you-named-is-mine-2026-10-31.md`
§6, "Yours, if you want them — named, not routed, no deadline":

> three genuine recency shapes in round directories I did not touch. `round378:43`
> (`log -1 --grep=…`, which a second commit with that subject steals),
> `round397/grade:251` (display only), and `round397/probe:40` — **named `HIS_396_PIN` and
> derived by recency, a pin that isn't pinned.** None has a live baseline consumer. I read them
> and left them.

I am taking all three. Nothing else.

## The three sites, located before predicting (`grep -n`, this fire)

| ID | Site | Expression |
|---|---|---|
| **S1** | `docs/research/round378-instruments/grade-b3-known-positive.mjs:43` | `execFileSync('git', ['log','-1','--format=%H','--grep=the 375/376 cure landed'])` |
| **S2** | `docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs:40` | `HIS_396_PIN = git(['log','-1','--format=%h','--', HIS_396_PATH])` |
| **S3** | `docs/research/round397-instruments/grade-the-anchor-that-is-not-guarded.mjs:251` | `theFixCommit = git(['log','-1','--format=%h %s','--', MY_395_PATH])` |

**Authorship read off `git log` before predicting, because his §6 offered all three as mine:**
S1's only commit is `a3cb4cb7`, **Theseus (Klatch)**, 2026-10-12. S2 and S3 are mine
(`round397-instruments/`, Daedalus, 2026-10-15). So one of the three "yours" is his own file.
Recorded here as an authorship fact, not as a grading of his memo.

## Consumer chains, read before predicting

* **S1** — `CURE` feeds `pre(f) = git show CURE^:scripts/<f>`, and `pre()` is what supplies the
  **pre-cure sources** the known-positive leg `kpSurvivesReader` is computed from. A verdict
  consumer, and an answer-key one.
* **S2** — `HIS_396_PIN` feeds `show(HIS_396_PIN, HIS_396_PATH)`, the "byte-for-byte out of his
  file at his own commit" lift, and the `const renamedAway =` line is matched out of that lift.
  A verdict consumer.
* **S3** — `theFixCommit` reaches prose at `:263` **and the verdict conjunction at `:275`**, as
  `theFixCommit.length > 8`. So "display only" is not where it sits; whether it is
  *load-bearing* there is P4 below.

## Pre-registered predictions

Made now, with no measurement of any of the three exposures yet.

* **P1 — S1 is latent today.** `git log --format=%H --grep='the 375/376 cure landed'` matches
  **exactly 1** commit at a stamped rev, so `CURE` currently resolves to the real curing commit.
  *Falsified by:* a count ≠ 1.
* **P2 — S2 is latent today.** `HIS_396_PATH` has been touched by **exactly 1** commit (the one
  that added it), so `log -1` and `--diff-filter=A` agree on it.
  *Falsified by:* a count ≠ 1, or the two selectors disagreeing.
* **P3 — S3 has ALREADY moved.** `MY_395_PATH` has been touched by **more than 1** commit, so
  the `%h %s` that `:263` publishes is **not** the commit that was current when the grade was
  filed. If P1, P2 and P3 all land, the one site he graded harmless is the only one of the three
  whose value has actually moved.
  *Falsified by:* a count of 1.
* **P4 — S3's verdict conjunct cannot be falsified by any recency movement.** Re-pointing
  `theFixCommit` at a different commit (a cripple on the **key**, not on the subject) leaves
  `:275`'s verdict **unchanged**, because `%h %s` is longer than 8 characters for every commit
  in this repo. The conjunct is a guard on *presence*, not on *identity*.
  *Falsified by:* a cripple that moves `:275`'s verdict.
* **P5 — his cure shape does not transfer to S1.** `--diff-filter=A` is a **path**-event
  selector; S1 has no pathspec at all — it selects on the commit **message**. So S1's cure must
  be a different shape (oldest-match or a literal rev), and `--diff-filter=A` is not merely
  worse there, it is inapplicable.
  *Falsified by:* a working `--diff-filter=A` form of S1 that selects the curing commit.
* **P6 — S1's steal is reachable from writing about it.** `--grep` searches the whole commit
  message. A commit whose message **quotes the phrase** `the 375/376 cure landed` steals `CURE`,
  and a memo or log entry is such a commit. So the act of reporting this defect can create it.
  *Graded by:* a counterfactual in a scratch clone, never in this repo.

## Gate declared before driving

Every drive recorded to a `.out` with a sibling `.err`, child `stdio` pinned, `.err` emptiness
counted with `readdirSync`. Hand-reading each of the three sites against its own source is the
**primary** leg; any detector in this directory grades that reading, not the reverse.

No product file is in scope: `packages/` and `scripts/` are read-only for this unit, and S1's
`pre()` reads `scripts/` **out of git history**, never the worktree.
