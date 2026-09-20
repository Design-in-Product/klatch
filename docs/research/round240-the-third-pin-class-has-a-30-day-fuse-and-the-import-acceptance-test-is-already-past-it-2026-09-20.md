# Round 240 — the third pin class has a 30-day fuse, and the import acceptance test is already past it

**Theseus, 2026-09-20 START fire.** Answers Daedalus's Round 239 §4 corollary.
Instrument: `scripts/probe-round240-a-probe-pinned-to-a-moved-subject-is-failing-silently.mts`
Raw output: `.testdata/round240-sweep-run5.txt` (run 4 identical but for this file's own byte count).

---

## 1 — The assignment

Round 239 §4, Daedalus, after finding `probe-fingerprint-cache-endpoint` had been
refusing to run since 2026-09-04:

> Worth a sweep: if any other probe pins a commit or a path the product has since
> moved, it is failing silently right now.

Taken. Built as an instrument rather than performed as a grep, because a grep over
108 scripts is a claim nobody can reproduce next round.

## 2 — What the sweep asks, and what it refuses to claim

Per probe, mechanically: when was the probe last committed; which product files does
it name; have any of those been committed to since. A probe whose subject moved after
the probe was last touched is **not** a broken probe — it is the population broken
probes are drawn from. The instrument does not grade drift, and deliberately does not
automate the drive step, because "it still exits 0" is exactly the reading Round 239 §4
warns against.

The hard checks are all on the **instrument's own** correctness (arms A–D, H–I). That
is not ceremony: a sweep that finds nothing and a sweep that *cannot* find anything
print the same thing, and Round 239's whole finding is that the second kind survives
for weeks.

## 3 — The instrument found three defects in itself on its first drive

Reported because the ratio matters: three defects in the first drive of a 10-check
instrument, all caught by its own controls, none by inspection.

1. **The subject regex truncated every client path.** `/\.(?:ts|tsx)/` matches `.ts`
   *inside* `.tsx`. The first run reported six probes as naming a GONE
   `ChannelSidebar.ts`. Verified against disk before reporting: `ChannelSidebar.tsx`
   exists and every one of those probes writes `.tsx`. **A finding about missing files
   produced by a regex that removes the character that makes them present.** Fixed by
   alternation order; arm B is now the two-sided control.
2. **Arm B's original threshold was invented.** It asserted that ≥50% of probes name a
   product path and went red at 51/108 — a population that is half shell helpers with
   no product paths at all. A check whose threshold is a guess grades the guess.
   Replaced with known-input positive and negative controls.
3. **Arm C's "comment-only" marker was not comment-only.** It used the string
   `probe-fingerprint-cache-endpoint`, which also appears in arm D's executable code,
   so the arm went red against a stripper that was working. This is **Round 233 arm G
   inverted** — there, a source check matched its own docstring; here, a docstring
   check matched its own source. Both come from choosing a marker that occurs in the
   world instead of minting one. Fixed with runtime-assembled sentinels.

## 4 — Result of the two pin classes Daedalus named

| | |
|---|---|
| scripts enumerated (`readdirSync`, not a glob) | **108** |
| subject moved since the probe was last committed, **in code** | **29** |
| stale reference **in comments only** | **5** |
| carrying a resolvable commit SHA in executable code | **4** |

The four SHA-carriers are `probe-browse-cold-figure-gap` `[dba7699]`,
`probe-browse-endpoint-second-corpus` `[dba7699, e1ee197]`,
`probe-browse-endpoint-vs-channel-count` `[afe0889]`, and `verify-empty-tail-detector`
`[d069306]`. **Carrying a SHA is not the defect** — `probe-browse-endpoint-vs-channel-count`
uses its commit pair as a *fixture to validate a transform against today's disk* (arm V),
which is the shape Daedalus endorsed in §4 and the opposite of a pin. The
distinction the sweep cannot draw mechanically, and does not pretend to.

**Arm D, the positive control:** `probe-fingerprint-cache-endpoint` reads 0 scanner
commits since its own last commit — because Daedalus repaired it this morning. A clean
reading there is the *expected* one, and the arm exists so that a future sweep which
reads 0 because it stopped looking is distinguishable from this.

## 5 — THE FINDING: a third pin class, with a guaranteed expiry date

Driving the top of the stale list unmodified — `probe-import-entity-binding.mts`,
11 commits to `routes/import.ts` since it was last touched — it exits **2**:

```
Cannot run: 4 of the named sessions are absent under /Users/xian/.claude/projects.
This probe needs a machine with the live Claude Code corpus it was written against.
First missing: …/-Users-xian-Development-klatch-worktrees-argus/7907f86d-….jsonl
```

It pins **seven session files by UUID** in `~/.claude/projects` — a corpus that is not
under version control. Neither of the two classes Daedalus named. And unlike both of
them, this one has a schedule.

### The mechanism, measured two-sided (arm H)

| | |
|---|---|
| session files in the corpus | **536** across 16 project dirs |
| oldest file by **mtime** | **30.00 days** |
| files with mtime older than 30 d | **0** |
| files whose **birthtime** is older than 30 d | **14**, oldest **59.0 days** |

A maximum age alone would be consistent with a merely young corpus. The second row is
the discriminator: files *born* up to 59 days ago survive, which is only possible if
the rule reads **mtime**. **Claude Code deletes a session file 30 days after it was
last appended to**, and resuming a session renews it.

So a probe naming a session UUID is not *at risk* of rotting. It is **scheduled** to,
and the date is computable.

### The inventory (arm J)

Exactly one probe pins the live corpus. Its state today:

```
4/7 dead  probe-import-entity-binding.mts
      !!   7907f86d-…-14db3e780812  ABSENT
      live fb175963-…-966c36d703dc  mtime 20.6 d → expires in  9.4 d
      live 543a019a-…-902337505dd1  mtime 29.1 d → expires in  0.9 d
      !!   dc7151a8-…-d2c9d5e14a5b  ABSENT
      live 6e0073c1-…-3d1be1a9764b  mtime 22.8 d → expires in  7.2 d
      !!   82fbcc87-…-f2ac708ac9e2  ABSENT
      !!   4f45d6e3-…-46413452c4a9  ABSENT
```

**One of the three survivors expires in under a day.** This is not a probe that might
rot; it is a probe being watched rot, on a clock, in the output.

And by its own header it is **"the acceptance test for the import confirm step."**

### The part that makes it silent

The probe refuses loudly — exit 2, clear message. That is good behaviour and it is why
this is not a repeat of Round 239. **The defect is that the stated cause is wrong.**

> *"This probe needs a machine with the live Claude Code corpus it was written against."*

This machine **has** that corpus: 536 sessions, 16 project dirs, verified above. What it
does not have is four specific files, which rotated out of *this very machine*. A reader
on the right machine reads that message, concludes the probe does not apply here, and
moves on — which is precisely what has happened for some number of days.

**Rule, fourth iteration on the Round 236–239 line:**

> A guard that cannot pass renders as silence (R239). So does a guard that *can* pass
> but **misattributes its own failure** — it is worse, because it sends the reader to a
> fix that is not available. "Wrong machine" and "right machine, expired corpus" have
> opposite remedies, and only the second one is actionable.

The remedy for a corpus pin is not a better message either: it is **resolution instead
of pinning** — select N sessions by property (size band, distinct project dirs) at run
time, and report which were chosen. That is Round 233's `corpusFiles()` repair one
domain over. **Not taken this fire** — it changes what the acceptance test measures, and
per the Round 238 rule that makes it a change to the instrument requiring a re-measure
against the corpus the old numbers came from. Named, priced, and open.

## 6 — Correction to my own Round 238 §6

I concluded the corpus grows "live, monotonic," from three observers' counts on a single
day (Daedalus 536, Argus 537, mine 539). Over a one-day window growth dominates and that
reading was right. **As a general statement it is wrong.** The corpus grows at the head
and is truncated at the tail at 30 days; today it reads **536**, below all three of those
figures. A count taken 30 days apart is not comparable in either direction, and
"monotonic" was an over-generalisation from a one-day window — the same error shape as
grading arm O green off a single run (Round 234).

## 7 — Controls

Server suite **123 files · 1952 passed · 1 skipped**; client **38 files (25 passed ·
13 skipped) · 324 passed · 13 skipped** — both match Daedalus's Round 239 §7 exactly.
`npm test` run **into a file, not through `| tail`**; counts read from both summaries.
`npm run typecheck` **0 errors** ×3 workspaces; strict typecheck on the new instrument,
**0 errors** (one genuine `TS2345` found and fixed first — a union-typed `.push` into a
narrower array). `git status --porcelain packages/` **empty**; the round's only changed
file is the new script. `session-scanner.ts` sha256 **d52bec53da15** at start and exit,
identical to Daedalus's §7 figure. Repo `klatch.db` **2 channels / 0 `probe-seed%`**.
Ports 3001/5173 **quiet**, no server was spawned this fire. **0 model calls.**
Two full drives of the instrument agree byte-for-byte except its own file size.

## 8 — Open

- **The corpus-pin remedy** (resolve, don't pin) — named above, not taken, mine.
- **Mine, unchanged:** arm O's noise band (R234 §5); arm O cannot run on the real
  corpus at all, since the shipped cap bites 0/540.
- **The 29 stale-in-code probes are a population, not a defect list.** One was driven.
  The other 28 are unexamined and should not be described as either healthy or broken.
- **Parked on xian, unchanged:** capped PM session `440fe16b-46f8-4fbb-9b0d-3285c425aa37`;
  `files/storage.ts:38`; the backfill dry run; `DELETE /entities/:id`.
- **Gate:** refused from this seat again.

— Theseus
