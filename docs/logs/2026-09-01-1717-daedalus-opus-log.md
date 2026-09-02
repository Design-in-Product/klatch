# Daedalus — 2026-09-01 session log (17:17 STOP fire)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Today's earlier fires have their own logs: `2026-09-01-0917-daedalus-opus-log.md` (START, Round 131)
and `2026-09-01-1317-daedalus-opus-log.md` (WORK, Round 133).

---

## 17:17 PT — STOP fire. Briefing.

Worktree synced by the wrapper; `git log` at `46f50e6` (Round 133-134 rollup), tree clean. Read
`docs/COORDINATION.md`. Checked `docs/mail/` — one inbound addressed to me,
`theseus-to-daedalus-cc-xian-team-classifyspecifier-is-wrong-in-both-directions-2026-09-01.md`, read
in full in this fire.

**Baseline reproduced before touching anything:** `node scripts/verify-tsx-guard.mjs` →
`PASS — all 185 checks passed`; `node scripts/probe-import-sites.mjs` → `0 site(s)`.

**Round 135 target.** Theseus's Round 134 deferred the repair on its own reasoning ("the round that
finds the reason is not the round that does it") and flagged its §5 lead as wanting to be a round
rather than a footnote. Both are mine; taking them in the fire that received the memo.

## 17:2x PT — reproduced both of Theseus's claims before acting on either

§1, on my own fixture (`.testdata/r135/`, gitignored): a directory holding a side-effect-free
`index.ts`, imported dynamically.

| fixture | runner | result |
|---|---|---|
| unguarded `await import('./fixt')` | `node` | `ERR_UNSUPPORTED_DIR_IMPORT`, raw stack at `finalizeResolution` |
| the same, wrapped in Round 126's exact guard shape | `node` | **identical raw stack** — `explainTsxRequirement` re-threw |
| the same guarded file | `npx tsx` | `D2 loaded loaded`, rc 0 |

The third row is what makes it a wrong-runner failure rather than a bad fixture.

§2: node here is **v26.5.0**; `node` on an unguarded `import('../../packages/shared/src/types.ts')`
printed `loaded string claude-opus-5`, rc 0. Over-fire confirmed.

## 17:3x PT — the conjunct I had wrong first, caught by measuring rather than by care

The obvious predicate reuses `TS_EXTENSIONS` (Round 128's one binding, rule 8b route (i)). Measured
instead — one directory per extension, both runners:

```
.tsx  node ERR_UNSUPPORTED_DIR_IMPORT   tsx ok
.ts   node ERR_UNSUPPORTED_DIR_IMPORT   tsx ok
.mts  node ERR_UNSUPPORTED_DIR_IMPORT   tsx ERR_MODULE_NOT_FOUND
.cts  node ERR_UNSUPPORTED_DIR_IMPORT   tsx ERR_MODULE_NOT_FOUND
.js / .json → tsx ok;  .mjs / .cjs → tsx ERR_MODULE_NOT_FOUND
```

Confirmed outside the harness on `index.mts`; `tsx`'s own error names `…/index.json` as its last
candidate, which is its probe order stated by the tool. **Two of `TS_EXTENSIONS`' four members are
extensions for which "re-run under `tsx`" is a false remedy** — reusing the shared binding would
have produced header item 1, the over-fire, via the rule meant to prevent drift. Ships as its own
binding, `TS_DIR_INDEX_EXTENSIONS = ['.tsx', '.ts']`.

## 17:4x PT — repair, and Theseus's §5 lead demonstrated rather than argued

`scripts/lib/tsx-required.mjs`: `isTsDirImportFailure` + a named `shape` discriminant in
`explainTsxRequirement` (third shape, its own explanation body per Round 128's rule). Verified:
`index.ts` dir → exit-2 explanation, no stack; `index.mts` dir → **re-thrown untouched**, the
over-fire conjunct working.

`scripts/verify-tsx-guard.mjs`: §(a) third-predicate block; three-way partition precondition
replacing the pairwise one; §(b2) `WRONG_RUNNER_CODES` gains the third code with a live positive
control.

The demonstration that §(b2) had a live hole — mutant `verify-r135-dirmutant.mjs`, unguarded
directory import, against the detector as it stood:

```
ok    verify-r135-dirmutant.mjs — under plain node: no raw resolution stack trace   — {"rc":1}
```

A file printing a raw stack trace, reported **ok**. With the third code added, same mutant, same
tree: `FAIL`. Mutant deleted afterwards.

## 17:5x PT — tree state and deliverables

Scratch (`.testdata/r135/`) and the mutant deleted. Clean tree after:
`node scripts/verify-tsx-guard.mjs` → **`PASS — all 196 checks passed`** (185 before, 11 new);
`node scripts/probe-import-sites.mjs` → `0 site(s)`, exit 0.

- `docs/research/round135-a-third-wrong-runner-shape-and-the-one-binding-rule-had-to-be-broken-2026-09-01.md`
- `docs/mail/daedalus-to-theseus-cc-xian-team-a-third-shape-and-the-one-binding-rule-had-to-be-broken-2026-09-01.md`
- `scripts/lib/tsx-required.mjs`, `scripts/verify-tsx-guard.mjs`
- Theseus's Round 134 inbound `git mv`'d to `docs/mail/read/` — its ask is discharged.
- Mail committed separately and pushed to `main` first, per the worktree mail discipline.

**Not done, written down rather than guessed at** (full list in §6 of the research doc): a directory
holding only `index.mts` still crashes raw (correctly — `tsx` cannot load it either; it wants a
different message, not a wider predicate); §(c)/the anchor were not extended to directory specifiers
(latent — no live script imports a directory, checked); Theseus's M4 untouched; and **Theseus's M6
lead is only half-closed** — I fixed the code list but did not measure whether node 26 moves other
failures one module inward in ways `isTsResolutionFailure`'s conjunct mis-describes.

## Wrap verification

Per CLAUDE.md Session Wrap Protocol — run below, output pasted, before any "done" claim.

**Step 1 — `git log origin/main --oneline -5`:**

```
744d7f1 Round 135: a third wrong-runner shape the guard re-threw, and the crash detector that could not see it
2593901 mail: Round 135 reply to Theseus -- a third wrong-runner shape, and the one-binding rule had to be broken to fix it
46f50e6 rollup+log+coordination: Round 133-134 folded in -- a live crash gets guarded, then the fourth-limb reading that verifies it is shown wrong in both directions on the same fire
c48a446 log: Round 134 wrap verification, commits and deliverables confirmed present
024e5d6 research+log+coordination: Round 134 -- classifySpecifier is wrong in both directions, and one of them fires on a correct file
```

Both Round 135 commits present on `origin/main`. Mail committed separately and pushed first.

**Step 2 — `ls` on every deliverable:** all six present.

```
docs/logs/2026-09-01-1717-daedalus-opus-log.md
docs/mail/daedalus-to-theseus-cc-xian-team-a-third-shape-and-the-one-binding-rule-had-to-be-broken-2026-09-01.md
docs/mail/read/theseus-to-daedalus-cc-xian-team-classifyspecifier-is-wrong-in-both-directions-2026-09-01.md
docs/research/round135-a-third-wrong-runner-shape-and-the-one-binding-rule-had-to-be-broken-2026-09-01.md
scripts/lib/tsx-required.mjs
scripts/verify-tsx-guard.mjs
```

`git status --porcelain` empty after the log+coordination commit;
`node scripts/verify-tsx-guard.mjs` → `PASS — all 196 checks passed` on the clean tree.

**Step 3 —** this wrap section committed and pushed last. Delivery is the wrapper's to claim, not
mine; what is verified here is that the commits and files are present in the repository.

**Suite, run rather than assumed:** `npm run typecheck` clean across all three workspaces;
`npm test` — server **1447/1447**, client **239/239 (13 skipped)**, matching Argus's 13:32 reading
exactly. `git diff --stat` confirmed two files changed, both under `scripts/`; nothing in
`packages/` imports the changed lib (grep).
