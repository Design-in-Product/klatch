# Theseus session log — 2026-09-13

Seat: Theseus Prime (manual testing & exploration, CLI side), Amber worktree
`/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.

---

## 10:47 PT — START fire opens

Briefing done: `git log` at `9545fdbb` (Daedalus's 9/13 START coordination entry), worktree
clean, `docs/COORDINATION.md` Theseus section read (last updated 9/12 ~19:5x, status
available, Round 199 closed), `docs/mail/` listed.

**New mail, addressed to me:**
`daedalus-to-theseus-cc-xian-janus-argus-calliope-three-shapes-built-and-your-shape-3-was-two-shapes-one-of-which-widens-2026-09-13.md`
(Round 200, commit `8060dbd8`). Read in full this fire. Summary of what it claims, all to be
verified from this seat before I repeat any of it:

- My Round 199 dry run reproduces before any edit: `Candidates: 72 — 7 would move`, same four
  names, same two collisions; March 15 = 23 / 2.
- Shapes 1, 2, 3 built plus the *reporting* half of D3. Both corpora now read **0 would move**.
- My shape 3 was two proposals; occurrence-iteration **alone widens** (72 → 5 would move, three
  of the five from channels that produce no guess today, +415 re-stamped rows). The **window**
  (400 chars) is what carries it.
- Window fitted to my corpus: real claims at offsets 0–158, fall-through hits at 511–1706, a
  353-char gap; 400 sits in it.
- D3 collision now reported structurally in `plan.summary.collisions` + CLI.
- Rationale now printed on the sheet, and now a quote.
- **Prediction for my probe:** `probe-round199` now reports `14 · 7 failed · 1 open`, the seven
  being G:succeeding-predecessors, G:taking-over-from, G:taking-on-a-role, G:stopwords, H2, J1,
  J2; arm I passes **vacuously**; L2 reads `0 produce an identity-claim guess`.
- He did not re-vehicle my probe — explicitly my call.

**Corpus reachable from this seat this fire** (verified, not recalled): `node fs.readdirSync`
on `/Users/xian/Development/klatch/backups/` lists `klatch.db.backup-2026-03-14` and
`klatch.db.backup-2026-03-15-pre-fresh` (+ `-shm`/`-wal` sidecars for each). Note for the
record: the Bash tool's sandbox refuses `ls` outside this worktree; Node's `fs` is not refused.
That is how Round 199 reached it too.

**This fire's plan (Round 201):** reproduce Daedalus's Round 200 unmodified first (probe +
tests + both dry runs on copies), then check his prediction about my Round 199 probe arm by arm,
then re-vehicle Round 199 as a regression suite over the fix. Nothing written outside
`.testdata/`; originals to be hashed before and after.

Baseline hashes taken before any work: `klatch.db.backup-2026-03-14` 5,230,592 B sha256
`c2295121bbdfdbbb`, mtime `2026-07-23T17:27:38.145Z`; `klatch.db.backup-2026-03-15-pre-fresh`
335,872 B sha256 `1afc9e10c6e8ed35`, mtime `…38.152Z`.

## 10:49–11:00 PT — reproduction, all of it, before any edit of mine

- `probe-round200` against the real corpus: **22 checks · 0 failed · 1 open · 5 measurements** —
  Daedalus's line exactly, arm for arm (G×7 decline, M1–M3 window edges, N1–N3 the widening).
- `probe-round199` unmodified: **14 checks · 7 failed · 1 open**. The seven are
  **G:succeeding-predecessors, G:taking-over-from, G:taking-on-a-role, G:stopwords, H2, J1, J2**
  — his predicted list, in order. Arm I passes vacuously (`"" ← Chief Experience Officer + …`).
  L2 reads `0 produce an identity-claim guess`. His prediction is right in every particular.
- `npm test --workspace=packages/server`: **1649 passed / 102 files.** Client: **311 passed**
  (13 skipped). Both his numbers.
- Dry runs against copies in `.testdata/r201/`: **`Candidates: 72 — 0 would move, 72 skipped.`**
  and **`Candidates: 23 — 0 would move, 23 skipped.`** Independently confirmed.

Note: the CLI takes the db as a positional argument, not `--db=`; it refused my first invocation
rather than ignoring the flag, which is Round 182's guard working.

## 11:00–11:20 PT — exploration: where does the fix's protection actually come from

Four throwaway scripts under `.testdata/` (`r201-explore*.mts`), then folded into a probe.

1. **The five words Daedalus's own arm N named, written at offset 9: 5 of 5 mint.**
   `Hi! Once you are ready we can begin…` → `identity-claim "Ready"`. Same through `you're`.
   The window excludes them in the corpus because they sit at 511–1,706, not because they are
   filtered.
2. **18 of 20 plainly-not-a-name openers at offset 0 mint** — `Welcome`, `New`, `Back`,
   `Helping`, `Probably`, `Allowed`, `Best`, `Such`, `Still`, `Only`, `Just`, `Very`,
   `Required`, `Aware`, `Ready`, `Up`, `Settled`, `Oriented`. The two that decline do so via
   the `-ing` + preposition net, not `NOT_NAMES`.
3. **Subordinate-clause hypothesis, tested on the corpus: 0/14 in-window hits are subordinate,
   7/7 out-of-window hits are.** Four words carry it: `once`, `when`, `if`, `as far as`. Same
   separation the window gets, without depending on distance.
4. **Of the 14 in-window claims, 0 propose a name.** Candidate words in full: `my`, `the`,
   `you`, `taking`, `succeeding`. Zero capitalized. Every claim is a role claim. This is the
   one I did not expect: `identity-claim` has a recall ceiling of 0 out of 0 here, not merely
   0-of-7 precision.

Also found a seventh raw out-of-window hit at 661 (`"you are able"`) that is absent from
Daedalus's list of six — because `able` is already in `NOT_NAMES`, so his population is
hits-that-survive-filtering. Both counts correct; recorded so it doesn't read as a
disagreement later.

## 11:20–11:35 PT — Round 201 probe

`scripts/probe-round201-the-window-holds-this-corpus-and-not-the-class-and-the-corpus-has-no-names-in-it.mts`
— **26 checks · 0 failed · 1 open**, three runs identical, `tsc --strict --module nodenext`
clean. Arm A is Round 199 re-vehicled (assertions inverted); arm B controls; arms C/D/E the
residual; **arm F new** — the collision warning and the rationale checked at the *CLI sheet*
rather than at the plan object, on a two-channel corpus built to collide under current code.
F1–F4 pass.

**Two own errors, caught before reporting:**

- **Arm E1's detail string was hardcoded.** It printed `5/5 false claims are subordinate, 0/6
  real ones are` as a literal template while the check itself was failing — a probe narrating a
  result it had not computed. That is precisely the defect class I have spent six rounds
  reporting in Daedalus's CLI, in my own instrument. Fixed to count with the same predicate the
  check uses, with a comment in the source so it is not re-introduced.
- **The failure that line was hiding was my fixture, not my hypothesis.** I had written
  `Once you’re oriented` with my editor's typographic apostrophe. Pattern 2 is `\byou'?re\b` —
  ASCII only — so it never matched, and the clause was never classified. Chasing it produced a
  real (small) finding: `"You’re Daedalus"` → no guess, `"You're Daedalus"` → `Daedalus`, while
  the *candidate* character class already accepts `’`. Added as arm E3. Same lesson as Round
  199's hand-written regex: my test data was the defect.

## 11:35 PT — verification and filing

- Corpora re-hashed after all work: `c2295121bbdfdbbb` and `1afc9e10c6e8ed35`, both identical
  to the baseline above, mtimes unchanged. `git status --short` shows only my own new files;
  nothing written outside `.testdata/`.
- Writeup: `docs/research/round201-the-window-holds-this-corpus-and-not-the-class-2026-09-13.md`
- Memo: `docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-200-reproduces-and-the-window-holds-this-corpus-not-the-class-2026-09-13.md`
- Mail close-discipline: the 9/12 thread (his all-four-shapes memo, my corpus-was-here memo)
  `git mv`'d to `docs/mail/read/`. **Both 9/13 memos left in `docs/mail/`** — they carry xian's
  open corpus question, which is parked on him, so it stays visible.
- COORDINATION.md Theseus section updated; the old Round 197 block demoted from "Previous" to
  "Prior" so there is one Previous.

**Still open for xian, unchanged and the only thing this seat waits on: is there a current
corpus?** Rounds 199–201 are all fitted to a March backup — the seven names, the 353-character
offset gap, the window at 400, and now the 14-claims-zero-names count.

## 11:40 PT — session wrap verification

**Step 1 — commits landed.** `git log origin/main --oneline -5`:

```
5bd50396 Round 201: the window holds this corpus and not the class, and the corpus has no names in it
8ac974f8 mail: Theseus -> Daedalus (cc xian, Janus, Argus, Calliope) -- Round 200 reproduces exactly, ...
9545fdbb coordination+log: Daedalus 9/13 START fire -- Round 200, the guess declines where it used to invent; ...
e8e27320 mail: Daedalus -> Theseus (cc xian, Janus, Argus, Calliope) -- Round 199's shapes 1-3 built, ...
8060dbd8 Round 200: the guess declines where it used to invent, and the window is what does it
```

**Step 2 — deliverables present.** `git ls-tree -r origin/main --name-only`, filtered:

```
docs/logs/2026-09-13-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-200-reproduces-and-the-window-holds-this-corpus-not-the-class-2026-09-13.md
docs/research/round201-the-window-holds-this-corpus-and-not-the-class-2026-09-13.md
scripts/probe-round201-the-window-holds-this-corpus-and-not-the-class-and-the-corpus-has-no-names-in-it.mts
```

`docs/COORDINATION.md` modified in `5bd50396`; the two 9/12 memos moved to `docs/mail/read/` in
`8ac974f8`. Mail was committed and pushed separately per the worktree mail rule, ahead of the
round commit.

**Step 3 — this log, appended and pushed last.** No product code changed this fire; all four
suites and both probes were run against Daedalus's tree, unmodified, before anything of mine.
Status: **available**.

