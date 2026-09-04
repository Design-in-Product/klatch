# Round 148 — browse against the second corpus, measured at the endpoint

**Theseus · 2026-09-04 (START fire) · instrument: `scripts/probe-browse-endpoint-second-corpus.mts`**
**34 checks, 0 failed, 0 skipped. Zero model calls. Nothing under `packages/` modified.**

## Why this exists

Three commits landed within an hour on the morning of 2026-09-04:

| commit | what |
|---|---|
| `dba7699` | fingerprint cache — steady-state browse 1430 ms → 7 ms, measured at the endpoint |
| `18d4631` | cap ruled removed — `FINGERPRINT_LINE_CAP` 1500 → 50,000, justified as ~3× headroom |
| `e1ee197` | correction, same day — that headroom was measured against the wrong corpus |

`e1ee197` is the one that opened this. Piper Morgan's department heads — the corpus continuity #3
exists to demonstrate, and the one xian is waiting to drive — live in a **second Claude config
directory, `~/.claude-pm/projects`**, because PM runs under its own account. `getClaudeProjectsDir()`
hardcodes `~/.claude/projects`, so the scanner does not see them: not an error, not an empty result,
just silently the wrong directory.

Which means **every latency number the team holds was measured on a corpus that excludes the corpus
that matters.** Daedalus named the two consequences — longer files cost more on first browse, and the
scanner cannot see the directory at all — routed `CLAUDE_CONFIG_DIR` support to his own seat, and
explicitly did not build or price it. This probe prices it, at the HTTP endpoint, on both roots.

## The corpora are nothing like each other

| | `~/.claude/projects` | `~/.claude-pm/projects` |
|---|---|---|
| project dirs | 16 (17 entries) | 76 |
| session files (scanner's filters) | **516** | **76** |
| bytes | **533 MB** | **456 MB** |
| longest file | 15,371 lines | **40,458 lines** |
| max `turnCount` | 210 | **370** |

The second corpus is **86% of the bytes in 15% of the files.** Many few-thousand-line sessions on one
side; eleven very long ones on the other. Any per-file intuition about scan cost transfers badly
between them, which is exactly why this needed measuring rather than scaling.

## What it costs at the endpoint

Both roots, real HTTP against `/api/import/claude-code/sessions`, scratch DB carrying zero imported
sessions (asserted, so no dedup cost is folded in). Arm C reaches the second root by rewriting
`getClaudeProjectsDir()` for one server generation, sha256-restored before exit and verified.

| root | cache-cold browse | steady state | ratio |
|---|---|---|---|
| `~/.claude/projects` | 2164 ms | **7 ms** | 303× |
| `~/.claude-pm/projects` | 1966 ms | **4 ms** | 480× |
| `~/.claude/projects` again (control) | 2177 ms | 8 ms | 277× |

**Three findings.**

**1. The second corpus costs about the same as the first, cache-cold — and that is the answer to
Daedalus's open question.** He asked whether files 2.6× longer cost more on first browse. They cost
more *per file* and almost exactly the same *per byte*: **4.31 ms/MB against 4.06 ms/MB, 1.06×.** Scan
cost tracks bytes, not line length, and does not degrade on the long files. Nothing superlinear is
waiting in the guard's new headroom.

**2. Steady state does not care.** 4 ms on the second corpus, 7 ms on the first — the smaller-file-count
corpus is *faster* warm, because warm cost is per-file Map lookups and response assembly, not bytes.
This is the property that makes the merge affordable: **the cache is what makes a second corpus
possible at all.** Without it, honoring `CLAUDE_CONFIG_DIR` would have put ~2 s onto every browse
forever; with it, it is a one-time server-start cost.

**3. Projected combined cache-cold browse: ~4130 ms.** Labelled as a projection and not a measurement —
it assumes the walk is additive over roots, and no build exists that walks two. It is the number to
check against when `CLAUDE_CONFIG_DIR` lands, not a number to quote as measured.

## I did not reproduce Round 147's cache-cold figure, and I am not claiming a cause

`dba7699` reports cache-cold browse on `~/.claude/projects` at **1477 ms**. I measure **2164 ms**, and on
a second fresh server at the end of the run, **2177 ms** — 1% apart. **1.47× his figure, stable.**

The warm figure reproduces exactly: his 7 ms, my 7 ms and 8 ms on the same root. The number that
carries the Round 147 headline is solid; it is the cold number that does not match.

**What arm F does and does not rule out.** It was built to test one hypothesis: that arm A's reading of
989 MB across both corpora had evicted part of the shipped corpus, making my cold number an artefact
of page-cache residency — the inverse of the confound Daedalus caught, where *equalising* by reading
both is not the same as *leaving* both resident. Two cold browses 1% apart rules out transient
variance. **It does not rule out that hypothesis**, because arm F ran after arm C and is under the same
run-wide memory pressure. A control that shares the suspected cause with the thing it is controlling
is not a clean control, and I am recording that as a limitation of my own instrument rather than
resolving the gap by argument. Discriminating it properly needs a run that touches one corpus only.

**So: the 2164 ms figure is reproducible within this probe and unexplained against Round 147.** Neither
number should be quoted as the cache-cold cost until the gap is closed. Nothing in the findings above
depends on it — findings 1 and 2 are ratios measured within a single run under identical conditions.

## The cap ruling: confirmed at the endpoint, on both corpora, with one moving part

xian's monitoring trigger was `capped === true` on any real session. Run for real rather than reasoned
about:

**`fingerprintCapped` is false on all 592 sessions across both corpora.** 516 on the shipped root, 76 on
the second. `turnCount` is exact everywhere, which is the payload of the ruling and the thing Iris's
held labelling call was waiting on.

Daedalus's line-count claims check out, with one that moved:

- The scanner comment's **15,371 lines** for the shipped root: exact.
- `e1ee197`'s **13,054–40,397** for the eleven department heads: **11 files at or over 13k lines, running
  13,054–40,458.** Floor exact, count exact, top moved.

**The top moved because the file is live.** 40,458 now against 40,397 recorded a few hours earlier —
**+61 lines on the largest known session, within one morning.** That is not a discrepancy in his
measurement; it is the corpus growing while we measure it.

**This sharpens the correction rather than contradicting it.** `e1ee197` already downgraded the guard's
headroom from ~3× to ~24%. The measured figure now is **23.6% and falling** — the margin is against a
file that is still being appended to, not against a static corpus. The ruling still holds (40,458 <
50,000, nothing capped), and I am not asking to reopen it. But "24% headroom" describes a moving
target, and the `capped === true` monitor is the thing that will notice, so it matters that it is
already wired to real data and currently silent.

## Open state, written down rather than guessed at

**Round 146's probe (`probe-browse-endpoint-vs-channel-count.mts`) is refusing to run, correctly, and
the obvious fix is wrong.** Daedalus flagged that `dba7699` changed `session-scanner.ts`, so the probe's
on-disk-equals-`afe0889` guard now fires every run. It does — verified this session.

The trap: arm S gets its pre-hoist code by restoring `afe0889^` **wholesale**. That isolates the hoist
only while disk equals `afe0889`. With `dba7699`, `18d4631` and `e1ee197` since, `afe0889^` is missing
those too — so simply re-pinning `HOIST_COMMIT` to HEAD would silently measure **hoist + cache + cap**
and report it as the hoist. It would not error. It would produce a plausible number.

The correct re-pin is to apply the **inverse of the hoist** to the bytes currently on disk (three
mechanical, assertable single-occurrence edits: the import, and one resolver hoist in each of
`scanClaudeCodeSessions` / `scanExportedSessions`). That also makes it a better measurement than Round
146's: under the cache, the dedup scan is no longer 13% of browse, it is nearly all of it — which is
what Daedalus predicted in the `afe0889` message and what his "29× the floor" line reasons about but
does not measure.

**Scoped, not built.** The probe's refusal message now carries this reasoning inline so the next fire
that hits it does not re-pin naively. Building and running the transform-based arm S is the next unit
on this seat.

## What I did not measure

- **Two roots in one process.** The 4130 ms combined figure is arithmetic on two arms, not a walk over
  two roots. There is no build that does this.
- **A genuinely cold machine.** Every number here is page-cache-warm by construction — arm A streams
  both corpora before any timing. These measure parse cost, not disk. First boot after a restart is
  larger by an unmeasured amount.
- **The cap's cost on the second corpus.** I measured at the shipped 50,000 guard only. The +645 ms
  cap delta from `docs/scan-cap-latency-2026-09-03.md` was measured on the shipped root; whether it
  scales the same way on eleven 40k-line files is unmeasured, and per-byte parity (finding 1) is
  suggestive but not a substitute.

## Reproducing

```bash
npx tsx scripts/probe-browse-endpoint-second-corpus.mts
```

Needs `~/.claude-pm/projects` to exist; arm C skips cleanly if it does not, and skips rather than
guessing if `getClaudeProjectsDir()` no longer matches the shape the patch expects. `packages/` is
byte-identical before and after (`git diff --stat -- packages/` empty, verified this session).
