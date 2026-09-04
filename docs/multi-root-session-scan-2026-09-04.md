# Multi-root session scanning: the scanner can see Piper Morgan now

**Round 149 · Daedalus · 2026-09-04 (MID/WORK fire, 13:17 PT)**
Code: `packages/server/src/import/session-scanner.ts`, `packages/client/src/api/client.ts`
Tests: `packages/server/src/__tests__/round149-multi-root-session-scan.test.ts` (15)
Instrument: `scripts/probe-multi-root-browse.mts` — **27 checks, 0 failed, 0 skipped**

---

## The problem, as Janus stated it

Claude Code keeps one config directory per Anthropic account. xian runs Klatch/DinP
under one account and Piper Morgan under another, so PM's eleven department heads
write their session JSONL to `~/.claude-pm/projects` while everything else goes to
`~/.claude/projects`. `session-scanner.ts` hardcoded the latter.

The failure mode was the bad kind. Not an error, not an empty list — Browse would
have returned Klatch's worktrees, DinP's, One Job, Globe, CoVa, Mediajunkie,
OpenLaws, and silently **zero** Piper Morgan sessions. xian would have opened the
screen expecting his department heads and found everything except them.

PM's cast is the corpus continuity #3 exists to demonstrate. So "look somewhere
other than the default" is a requirement, not a convenience.

## What shipped

Two environment variables, each with one job.

| Variable | Semantics | For |
|---|---|---|
| `CLAUDE_CONFIG_DIR` | **Replaces** the base root | Claude Code's own variable. Someone who relocated their whole config gets Klatch working with no Klatch-specific setup. |
| `KLATCH_EXTRA_SESSION_ROOTS` | **Adds** roots, `path.delimiter`-separated | The union — see both accounts in one Browse. This is the one xian wants. |

```
KLATCH_EXTRA_SESSION_ROOTS=~/.claude-pm
```

Entries are *config* dirs, matching `CLAUDE_CONFIG_DIR`; `projects` is appended.
A leading `~/` is expanded (`.env` is read by dotenv, not by a shell, so a `~`
written there would otherwise stay literal). A path already ending in `projects`
is taken as-is.

**Why additive is the default for the second one.** A misconfigured extra root
should add nothing. If it replaced, a typo would make the user's existing sessions
disappear — the same silent-wrong-directory failure this round exists to remove,
pointed the other way.

## Three design decisions that were not the obvious ones

### 1. Roots are merged by project path, not concatenated

`ImportDialog.tsx` keys its project rows on `projectPath` (`:722`) **and** stores
expand/collapse state in a `Set` of `projectPath` (`:289`, `:335`). Two roots can
hold the same encoded directory — the same working directory used under two
accounts — and emitting two groups with one path would give React duplicate keys
and make expanding one row expand the other.

So the merge is load-bearing, not tidiness. Measured on this machine today:
`~/.claude/projects` (16 project dirs) and `~/.claude-pm/projects` (76) collide on
**zero** encoded names. The merge path is latent. It is built because the collision
is one `cd` away and the failure it produces is silent.

Sessions are sorted newest-first **after** the merge, so a merged group reads as
one list rather than root-by-root — which is what appending two pre-sorted lists
would have given.

Within a merged group, `sessionId` is de-duplicated, first root winning. That UUID
is the import identity (`source_metadata.originalSessionId`), so two entries
carrying it are the same conversation and offering both is a choice with no
difference. Deliberately **not** global: a cross-project dedup would silently drop
a session from Browse on a UUID collision nobody has observed, and the merge is the
only place the ambiguity is actually created.

### 2. The channel resolver is built once across all roots, not once per root

Round 145 hoisted the dedup lookup out of the per-file loop, taking browse from
O(files × channels) to O(files + channels). Rebuilding the resolver per root would
have put the channels scan back in a loop — a quiet re-regression of the previous
round's finding, invisible until the channel count grew. One resolver spans the
whole walk.

### 3. `sourceRoot` is omitted entirely in the single-root case

`SessionInfo.sourceRoot` names the root a session came from. It is the only field
that distinguishes which *account* a session belongs to, so Iris will want it if
Browse ever labels that. Nothing renders it today.

It is **absent, not undefined**, when only one root is scanned. With one root every
session carries the same value, so it is pure payload. More usefully: it makes
"this change is invisible unless you opt in" a property a test can assert at the
byte level rather than a claim in a memo. The probe checks
`!text.includes('"sourceRoot"')` on the real endpoint response, and the unit suite
checks `Object.keys(session)` — `=== undefined` would not have distinguished an
absent key from a null-valued one.

## Measured at the endpoint

Every figure below is `GET /api/import/claude-code/sessions` against a real server
process — Theseus's Round 146 rule, that a tight loop underestimates in-situ cost,
so the endpoint is the only honest place to size this. Nothing was patched: every
arm is one environment variable, and `session-scanner.ts` is sha256'd before and
after to prove it.

| Arm | Roots | Projects | Sessions | Cold | Warm |
|---|---|---|---|---|---|
| B | shipped only | 16 | 517 | 2200 ms | **7 ms** |
| C | second only (`CLAUDE_CONFIG_DIR`) | 76 | 76 | 1948 ms | **5 ms** |
| D | **both** (`KLATCH_EXTRA_SESSION_ROOTS`) | 92 | **593** | 4099 ms | **9 ms** |
| F | shipped only, re-measured last | 16 | 517 | 2273 ms | 8 ms |

**The union costs 9 ms warm.** That is the number that matters: the cost of seeing
PM's department heads alongside everything else is a one-time ~4.1 s at server
start, and roughly nothing on every browse after. The fingerprint cache built in
Round 147 is what makes honoring a second root affordable at all — without it,
4.1 s would be the price of *every* browse, forever.

**Theseus's projection was right to 0.8%.** He combined his two single-root arms
arithmetically to ~4130 ms and labelled it a projection rather than a measurement,
noting "no build walks two roots." One now does: 4099 ms.

**Nothing is capped across all 593 sessions**, on either root. Max `turnCount` is
210 on the shipped corpus and 370 on the second — Theseus's figure, reproduced.

## A correction to my own Round 147 record: withdraw the 1477 ms

Round 147 (`dba7699`) reported cache-cold browse on the shipped root at **1477 ms**.
Theseus could not reproduce it, measuring 2164 and 2177 ms, and reported the gap
open rather than closing it by argument. **It does not reproduce here either:**
2200 ms (arm B) and 2273 ms (arm F), on a third instrument.

Five measurements now cluster at 2.15–2.27 s and one sits at 1.48 s. **The 1477 ms
should not be quoted, including by me.** Nothing downstream depended on it — the
204× headline was warm-path, and 7 ms reproduces exactly (7 ms and 8 ms today,
after 7 and 8 in Theseus's run).

**A lead on the cause, labelled as a lead.** Theseus suspected his equalisation
pass — reading 989 MB across both corpora before timing — of evicting part of the
shipped corpus, and said discriminating it "needs a run that touches one corpus
only, which I have not done." Round 147 *was* that run: it equalised over the
shipped corpus alone, ~531 MB, and got 1477 ms. Every run that equalised over both
(his 989 MB, my 992 MB today) reports ~2.2 s. So the two conditions differ in
exactly the suspected variable and the numbers differ 1.47×.

That is suggestive and it is not a controlled experiment: different probe,
different day, different process. I am recording it as the next thing to test, not
as the cause. The test is cheap — re-run arm B without arm A's second-root read.

## A defect I introduced in my own instrument, and caught

The first version of this probe asserted exact cross-arm equality:
`D.sessions === B.sessions + C.sessions`, and `E.sessions === B.sessions`.

The first run passed. The second run failed three checks **with the code
unchanged** — the shipped root went 518 → 517 sessions between arm B and arm E.

`~/.claude/projects` is not a fixture. It is the live session store of the machine
the probe runs on, including the agent session running the probe, which is
appending to a file inside it. A file crossing the scanner's own 100-byte floor, or
a temp-directory project being cleaned up, is enough to move the count.

Exact cross-arm equality is therefore not a property of correct code — it is a
property of a corpus that holds still, which this one does not. **The first run
passed by luck.** Recording it because a green instrument that is green by luck is
worse than a red one: I would have shipped those assertions and the next person to
run the probe would have spent a fire diagnosing a phantom regression, exactly the
thing I flagged to Theseus about his own guard yesterday.

Repaired by asserting only drift-surviving relationships (bounded set differences,
offending ids always printed), and by adding **arm F**, which re-measures the
shipped root last so the run *reports* the drift instead of hoping it is zero.
Today's run: 0. The tolerance is 8.

**And one assertion that looked like a test and was not.** Arm E names the default
root twice and checks that Browse is unchanged. If root de-duplication were
removed, the scanner would walk that root twice — but the per-project `sessionId`
dedup inside the merge would swallow the second pass entirely, so the session count
would be *identical* and arm E would pass with the defect live. The real
discriminator is `sourceRoot`: it is stamped when `getSessionRoots()` returns more
than one root, which is precisely what the dedup prevents. Confirmed by mutation in
the unit suite — removing the realpath resolve fails exactly one test.

## A pre-existing defect this exposes: `decodeProjectPath` is lossy, and not rarely

Claude Code encodes a project's cwd by replacing every `/` with `-`, with no escape.
`decodeProjectPath` inverts it by replacing every `-` with `/`. **A real directory
name containing a hyphen cannot round-trip.**

Measured through the endpoint:

| Root | Decoded project paths that do not exist on disk |
|---|---|
| `~/.claude/projects` | **10 of 16** |
| `~/.claude-pm/projects` | **76 of 76** |

And the instance that matters: PM's worktrees live under a directory literally named
`piper-morgan-worktrees`, so **all eleven department heads decode wrong** —

```
-Users-xian-Development-piper-morgan-worktrees-arch
  ->  /Users/xian/Development/piper/morgan/worktrees/arch     (does not exist)
```

This is not caused by Round 149; it has been true of the shipped root all along, on
59% of its projects, and nobody noticed. The reason nobody noticed is that
`projectName` is `path.basename(projectPath)` — `arch`, `cio`, `comms` — which is
correct, and `projectName` is what Browse renders and what `guessEntityName` reads.
`projectPath` is used as a key, not as a label.

**It is safe as a merge key**, which I checked rather than assumed: encoded → decoded
is injective (encoded names cannot contain `/`, so two distinct encoded names always
decode differently). Two real projects can only collide if they already share one
encoded directory, in which case Claude Code has already merged them on disk. So the
merge cannot fuse projects that the filesystem kept apart.

**Not fixed this fire, and the reason is that the fix is a search, not an
inversion.** The information is genuinely destroyed by the encoding; recovering it
means enumerating candidate splittings and picking one that exists on disk — which
is what `decodeProjectPath`'s own docblock claims already happens ("We validate by
checking if the decoded path exists on the filesystem") and which the code does not
do. That stale claim is the most misleading thing in the file. Scoped, not built.

## Honest limits

- **No cold-page-cache measurement.** Arm A reads 992 MB across both corpora before
  any timing, deliberately, because arm order was the entire finding once already
  (Round 147: a 28% "regression" that was one arm paying disk while the next read
  RAM). Every cold figure here is therefore a *parse* cost, not a disk cost.
- **One machine, one pair of corpora, one run** for the headline table. Cold figures
  are single samples; warm is a median of 5.
- **Import is not exercised.** Browse is fingerprint-only. Whether a 40,458-line PM
  session imports cleanly is a different path and Janus's sizing question about it
  is still open — the largest session the import path has been run against is 604
  messages.
- **The merge path is not exercised by the real corpus** (zero collisions today).
  It is covered by unit tests and mutation-tested, not by production data.
- **`decodeProjectPath` is unfixed** and now demonstrably wrong on 76/76 of the
  second root.
- **Windows is untested.** `path.delimiter` is used rather than a hardcoded `:`, but
  nothing here has run off macOS.

## Test and suite state

- New: 15 tests, all passing. Mutation-tested — breaking the merge fails exactly the
  merge test; breaking realpath dedup fails exactly the symlink test.
- Server suite **1489 → 1504** (92 → 93 files). The delta is exactly my +15.
  *(Note: Round 147 recorded the post-change baseline as 1487. Measured on a clean
  tree today it is 1489. I cannot reconstruct the discrepancy and am recording the
  measured number rather than the remembered one.)*
- Client **249 passed / 13 skipped**, unchanged.
- `npm run typecheck` clean across all three workspaces.

## What this needs from xian

**Nothing, to work.** The default is unchanged; today's behaviour is byte-identical
unless a variable is set.

**One line in `.env` to turn it on:**

```
KLATCH_EXTRA_SESSION_ROOTS=~/.claude-pm
```

Then Browse shows 593 sessions across 92 projects, including all eleven department
heads, at 9 ms warm.

Still open from earlier fires, unchanged and not re-opened here:

1. Merge or assign a reviewer for `origin/claude/cowork-import-hardening` — still
   unmerged, blocking two addendum items.
2. One read-only run of `scripts/probe-backfill-entity-sizing.mts` against the real
   `klatch.db`. Not runnable from this seat — no DB in this worktree; fifth fire to
   hit the same wall. This is seat access, not effort.
