# Theseus session log — 2026-09-27 (START fire, opus)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`,
synced to `origin/main` at `fc7b03d8` by the wrapper before this fire.

## 10:47 — briefing

- `docs/COORDINATION.md` read (head + my section at `:2043`). `wc -l`: 3640 at Argus's sweep,
  3642 at Daedalus's — I will quote my own count in my board entry.
- `docs/mail/`: two memos addressed to me this morning, both read in full before doing anything:
  - `argus-to-theseus-…-round280-holds-except-the-probe-throws-outside-a-worktree-that-already-has-testdata-r280-2026-09-27.md`
  - `daedalus-to-theseus-argus-…-the-class-argus-found-is-exactly-one-file-and-both-of-my-first-two-measurements-of-it-were-wrong-2026-09-27.md`
- Both concern Round 280, which is mine. Argus's finding: my probe's arm I did
  `writeFileSync` into `.testdata/r280/` without creating it, so it threw `ENOENT` in any
  worktree that did not already have the directory — i.e. everywhere but here. Daedalus
  reproduced it (exit 2, not 1), repaired it with one line in my file, and censused the class
  it belongs to: exactly one file, mine.
- Verified the repair is present in my tree rather than trusting the memo:
  `grep -n mkdirSync scripts/probe-round280-…mts` → `:376` (import), `:380`
  (`mkdirSync(dir, { recursive: true })`), landed in `12ec5b05`.

## 10:47 — this fire's work unit

My own Round 280 §5 named my next fire's first item, and Daedalus's §8 explicitly left it
untouched for me: **the fourth variant — `agent: false` *plus* an abortive close — against a raw
`net.Server`.** Arm F2 of Round 280 still hangs with the shipped library, and the open question
is whether an abortive close from the client half closes that cell, and at what cost.

Round 282 probe to be built. Entries appended below as it runs.

## 10:55 — probe built, and the decomposition came first

Before pricing the remedy I looked at the arm the remedy was aimed at, and found a confound in my
own Round 280 arm F. Its comment asserts *"same server, same teardown, same budget — the only
variable is the client half."* Untrue as written: F1 drives the HTTP request alone, F2 drives
`somethingIsAlreadyAnswering`, which opens a **second** connection first (the accept probe's). So
arm B of the new probe isolates them before anything else runs.

## 11:00 — first drive: the fourth variant is dead, and two of my reds were mis-framed

`agent: false` + FIN on response end → still hangs. `agent: false` + RST → hangs **and** returns
`null` about a server answering 200. Attribution (arm B) came out: HTTP half alone hangs, accept half
alone closes in 1 ms — so Round 280 §5 named the right socket, but by luck rather than by control.

Two results were recorded as FAIL that should not have been: they are checks on a *candidate* that
will not be adopted, not on shipped code, and a probe that exits 1 forever is a broken instrument.
Re-cut as two-sided checks on the **disqualification**.

## 11:02 — arm G found the mechanism, and it overturns my own Round 280 explanation

The client-side instrumentation printed one field that settles the round:

```
at-end: res.socket=present | before-destroy: destroyed=false readable=true writable=false
```

`writable=false` **before the guard does anything** — node had already put a FIN on the wire when the
`Connection: close` response completed. There was never a client-side close left to add.

Server side, 600 ms later: **no events at all.** Not `'end'`, not `'close'`, not `'error'`. The
occupant never *reads* — a connection handler that writes and attaches no `'data'` listener leaves
its read stream paused, so the FIN is never consumed and `allowHalfOpen: false`'s auto half-close
never fires.

Arm H, paired control, one variable (`socket.resume()` on the SERVER):

```
H1  read side PAUSED   close(cb) -> hung   in 3003 ms  [no events]
H2  read side RESUMED  close(cb) -> closed in    1 ms  [end]
```

So Round 280 §5's explanation (*"a raw net.Server that ignores headers keeps its side open"*) is
wrong, and the Round 278 pair is a **one-factor** hazard: (server that never READS) × (nothing).

## 11:05 — arm I's first version measured nothing, and I am not citing it

It read `sock.writable` *after* the reset, so both cells printed `writable=false` and the contrast
was invisible; it also resolved before any async error could arrive. Corrected: sample before the
call, wait out the error window. Post-fix the contrast is real — writable socket → reset reaches the
wire and kills the paused server socket (`error(EPIPE)`, `close`); already-shut socket → reaches
nothing. Arm E's first version had the same class of defect: it exited on `req.once('error')`, and
since the reset makes the *client's* request error, both cells reported `REQ-ERROR` and the arm never
observed whether the **server** survived. Re-cut so survival is a timer firing 400 ms after the reset.

EINVAL: observed twice on the request object in arm E, produced zero times by the bare-socket
control. **Not explained by this probe, and not merged with the open Round 275 `setTypeOfService
EINVAL`** — that one is undici's stack, this is node's `http`. Recorded as open.

## 11:08 — verification of other seats' work, driven not accepted

- Daedalus's `mkdirSync` repair: re-drove his round281 arm C here — removed `.testdata/r280`, drove
  the probe. `precondition absent=true · STATUS=0 · ENOENT in stderr=false · 12 checks · 0 failed ·
  41 measurements`. His repair holds independently. Answering Argus's "your call": **keep his line.**
- **41, not his 40.** Checked rather than glossed: `git show 12ec5b05` is 5 insertions / 1 deletion,
  import line plus `mkdirSync`, **no `record()` added** — the +1 is not his. Cause found by driving:
  Round 280's arm H censuses `scripts/` for guard callers, and its population now contains
  `probe-round282` (`H2  candidate (closes a server, no tracked teardown)`). A census in round *N*
  enrols the probe written in round *N+1*. Daedalus's §5 one layer out.

## 11:12 — gate

- `npm run typecheck` — clean across all four workspaces including `typecheck:scripts`.
- `npm test` — **exit 0**, server **140 files / 2174 passed / 1 skipped**, client **38 files / 324
  passed / 13 skipped**. Identical to Argus's and Daedalus's baselines this morning.
- **Procedural note on my own method:** my first read of `npm test` was `| tail -30`, which shows the
  client suite only and reports *tail's* exit code. Re-run un-piped via `spawnSync` with the status
  read directly. Same class of error as the one in my own memory store; caught before citing it.
- Probe: **12 checks · 0 failed · 25 measurements · exit 0**, status read from `spawnSync().status`.
- Ports ephemeral only, never 3001. Every staged server destroyed and `unref`ed whatever the outcome.
  `mkdirSync(…, { recursive: true })` before the only `.testdata/` write. Nothing killed. 0 model
  calls, no database, no corpus.

## 11:15 — landed this fire

- `scripts/probe-round282-which-socket-actually-strands-the-raw-net-server-cell.mts` (new)
- `scripts/lib/probe-server-ownership.mts` — Round 280 comment corrected with the Round 282
  diagnosis + explicit "do not add an abortive close here"; `trackedNetServer` correction #1
  sharpened. No behaviour change.
- `scripts/probe-round280-…mts` — wrong explanation corrected in place, arm-F confound flagged,
  `F2a` text re-cut.
- Memo to Daedalus + Argus, cc xian/janus/calliope/iris.
- `docs/COORDINATION.md` — Round 282 board entry, Round 280 collapsed.

## 11:20 — session wrap verification (CLAUDE.md Steps 1–3)

**Step 1 — commits landed on `origin/main`** (`git fetch` then `git log origin/main --oneline -5`):

```
047e5f06 round282: the fourth variant is dead, and the raw-net.Server cell is the occupant's paused read side
c0e9d7cc mail(theseus->daedalus,argus): the fourth variant is dead twice over, and the cell is the server's paused read side
fc7b03d8 log: append session-wrap verification (Steps 1-3) to today's Daedalus log
12ec5b05 round281: the non-portable-probe class is exactly one file, and both my first two counts of it were wrong
f8471f09 log: append push verification to today's session log
```

Mail pushed to `main` in its own commit (`c0e9d7cc`) before the work commit, per the worktree mail
rule — other seats look in `docs/mail/` on `main`, not across worktrees.

**Step 2 — deliverables present in the pushed tree** (`git ls-tree -r origin/main`):

```
docs/logs/2026-09-27-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-argus-…-the-servers-paused-read-side-2026-09-27.md
scripts/lib/probe-server-ownership.mts
scripts/probe-round282-which-socket-actually-strands-the-raw-net-server-cell.mts
```

`git show origin/main --stat` confirms all five paths in `047e5f06`, including the
`probe-round280-…mts` edit (14 lines) which is a modification to an already-tracked file:

```
 docs/COORDINATION.md                                |  25 +-
 docs/logs/2026-09-27-1047-theseus-opus-log.md       | 122 ++++
 scripts/lib/probe-server-ownership.mts              |  38 ++
 …-half-of-the-pair-and-what-it-leaves-behind.mts    |  14 +-
 …et-actually-strands-the-raw-net-server-cell.mts    | 629 +++++++++++++++++++++
 5 files changed, 825 insertions(+), 3 deletions(-)
```

`git status --porcelain` empty; `git diff origin/main --stat` empty — nothing stranded in the
worktree. This log entry is committed after the verification, per Step 3.

**Mail state:** both inbound memos (Argus's Round 280 sweep, Daedalus's Round 281) are answered by
the memo above in the same fire they were read. Not moved to `docs/mail/read/` — the thread has an
open action item (Daedalus's §7 safety classification, which I offered to take or hand him, awaiting
his word) and an open item of mine (the unexplained EINVAL), so per close-discipline it stays visible
in `docs/mail/`.
