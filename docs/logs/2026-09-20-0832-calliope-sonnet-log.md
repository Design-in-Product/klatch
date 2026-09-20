# 2026-09-20 — Calliope (Sonnet) session log

## START fire, ~08:32 PT

No-op fire, verified not assumed. Worktree pre-synced by the wrapper at `688e365d` (Iris's own 9/20 START
fire entry) — no pull needed, confirmed via `git pull --ff-only` reporting already up to date.

`git log --oneline af4597b5..HEAD` (my own 9/19 STOP checkpoint, rollup v143) showed two new commits,
neither mine: the hub's 9/20 cross-pollination brief (`bad0c853`) and Iris's own 9/20 START-fire no-op
(`688e365d`). `git diff --stat af4597b5..HEAD -- packages/ scripts/ docs/mail/` empty across all three —
nothing landed in code, probes, or mail since my last checkpoint.

Mail sweep: `ls docs/mail | grep '^xian-to'` empty — no new mail from xian. `ls docs/mail | grep -i
to-calliope` shows only the already-tracked Janus logbook-shape thread (8/28), still open, nothing new.

Cross-pollination brief read in full — both insights (Klatch's own env-var-lever pattern from Rounds
235/237/238, and One Job's audit-instrument-carries-the-defect finding) are process/infra lessons; the
Klatch insight is our own work already carried in the v143 rollup banner, correctly not double-counted.

Rollup re-checked directly, not recalled — still v143, accurate. Needs-you count unchanged at 3.

Standing blockers re-checked directly:
- Janus's logbook-shape thread — parked on xian since 2026-08-28, **23 days**.
- rollup-html-mirror-drift — flagged 2026-09-07, **13 days** (`git log -1 --format=%ad --date=short --
  docs/operations/attention-rollup.html` → 2026-08-23; same command against the `.md` → 2026-09-19).
- ground-rules standing/per-klatch question — parked on xian since 2026-08-09, **42 days**.

All three unchanged in substance from the 9/19 STOP-fire entry; day counts advanced by exactly one day
each, consistent with Iris's own 9/20 START-fire entry.

**Verified myself, not trusted:** `npm test` run fresh, full output captured to a file and read directly
(not piped to `tail`) — server **1918/1919 (122 files, 1 skipped)**, client **324/337 (13 skipped, 38
files)** — both unchanged, matching v143's own cited figures exactly. `npm run typecheck` clean across all
three workspaces. `git status --porcelain` clean before and after.

No refresh warranted — nothing has landed since v143 was written. No new decision items for xian.

Commits stay local per this cycle's fire instructions — the wrapper owns delivery to `origin/main` and logs
the outcome. Not claiming delivered. End of entry.

## MID fire

Pulled: already up to date. `git log --oneline 688e365d..HEAD` (my own START-fire checkpoint above) showed
6 new commits, none mine: Argus's own START-fire sweep (`57b8fa8c`), Daedalus's Round 239 (mail `04012457`
+ round work `42c72306` + wrap `75f9363c`), Theseus's Round 240 (mail `400b4ccb` + round work `b208d553` +
wrap `f8ff7566`).

`git diff --stat 688e365d..HEAD -- packages/ scripts/ docs/mail/`: 1 file under `packages/`
(`session-scanner.ts`) + 1 new test file (Daedalus's Round 239, the only `packages/` change); 3 files under
`scripts/` (2 edited — `probe-browse-cold-figure-gap.mts`, `probe-fingerprint-cache-endpoint.mts` — plus 1
new instrument, `probe-round240-a-probe-pinned-to-a-moved-subject-is-failing-silently.mts`); 2 new files in
`docs/mail/`.

Both new mail memos read in full (`daedalus-to-theseus-...-i-priced-both-and-one-of-them-had-been-refusing-
to-run-since-september-4-2026-09-20.md`, `theseus-to-daedalus-...-your-sweep-found-a-third-pin-class-and-it-
has-a-30-day-fuse-2026-09-20.md`) — both cc'd to this seat, neither addressed by name, no reply owed.

**Round 239 (Daedalus):** split his own Round 237 pairing of two probes into two classes — one wanted a
behaviour the code still has (lever built via `resolveFingerprintLineCap`'s existing switch, probe
converted, 16/16), the other wanted a behaviour the code no longer has (declined). Found the first probe
had been dead since 2026-09-04 (pinned to a commit for a clean A/B, disarmed by every later scanner
commit) — a third pin-class failure mode, silent in the same shape Rounds 236-238 kept re-finding.
Reviving it surfaced a second staleness (a scratch-write path Round 234 had already relocated), fixed with
`KLATCH_EXPORT_ROOT`. First real measurement of the cache's value: 2844 ms cold, 2888 ms first-fill (0.8%
cost), 13 ms every repeat — 222x, corroborated by a second drive at 211x. Red-capability driven twice
(unwired lever: 4/34 fail; read-without-write: a different 3/34 fail). Rule, third iteration: removing a
still-live behaviour is a missing lever (build it); restoring a dead one is reconstructing history (needs a
validated transform, never a flag).

**Round 240 (Theseus):** built a sweep instrument (not a grep) over all 108 scripts (`readdirSync`) for
probes whose named product paths moved since the probe's own last commit — 29/108 show drift in code, 5
comment-only, 4 carry a commit SHA that isn't itself a defect (one uses its pair as a validation fixture,
the opposite of a pin). Drove the top of the list and found a fourth pin class with a schedule:
`probe-import-entity-binding` pins seven session UUIDs under `~/.claude/projects`, a corpus outside version
control. Measured two-sided that Claude Code deletes a session file 30 days after its last append (oldest
surviving mtime 30.00 days, zero older; 14 older-birthtime files survive) — a pinned UUID has a computable
expiry, one of the seven named expiring in under a day. The probe refuses loudly (exit 2) but misattributes
its own cause ("wrong machine" vs. the true "right machine, expired corpus") — fourth rule iteration: a
guard that can pass but misdiagnoses its failure is worse than one that can't pass, since it sends the
reader to an unavailable fix. Caught three defects in his own instrument via its own controls (a regex
truncating `.tsx`→`.ts`, an invented 50% threshold, a non-unique comment marker) and corrected his own Round
238 "monotonic growth" claim — true for one day's observation, false generally, since the corpus is
truncated at the tail on the same 30-day schedule.

Neither round filed a new xian-facing item — the corpus-pin remedy (Theseus's, unclaimed) and the 29-probe
stale population (named, not graded) are both within-team backlog.

**Verified myself, not trusted:** `npm test` run fresh, full output read, not piped to `tail` — server
**1952/1953 (123 files, 1 skipped)**, up from 1918/1919 by exactly Daedalus's 34 new tests; client
**324/337 (13 skipped, 38 files)**, unchanged — matches both memos' figures exactly. `npm run typecheck`
clean across all three workspaces. `git status --porcelain` clean before and after.

Standing blockers re-checked, all three unchanged in substance from the START-fire entry: Janus's
logbook-shape thread (23 days since 8/28), rollup-html-mirror-drift (13 days since 9/7, `.html` still last
committed 8/23), ground-rules standing/per-klatch question (42 days since 8/9). `ls docs/mail | grep
'^xian-to'` empty.

**Rollup refreshed to v144** — new banner synthesizing Round 239/240; v143 preserved verbatim under
"superseded"; metrics-strip 🟡 note added (still 8, unchanged); v144 changelog entry added. Needs-you count
unchanged at 3.

Commits stay local per this cycle's fire instructions — the wrapper owns delivery to `origin/main` and logs
the outcome. Not claiming delivered. End of entry.
