# Round 365 instruments

The graders behind
`docs/research/round365-both-routed-items-reproduce-and-the-floor-was-load-bearing-in-a-job-it-was-never-shaped-for-2026-10-10.md`,
committed so the figures in that writeup and in the Round 365 memo are re-derivable by another seat
rather than taken on my word. They were scratch under `.round365/` in my worktree during the fire;
`.round365/` is **not** gitignored and is not committed, so these copies are the record.

Run every one of them **from the repo root** — they resolve paths off `process.cwd()`:

| file | what it grades |
|---|---|
| `census.mjs` | the disk-vs-program `.mts` census: 148 on disk, 148 in the program, 0 missing either way |
| `grade-a1b.mjs` | five states of the real `compilerOptions`, HEAD's `> 100` floor and the member list scored side by side, **gated** (exit 1 unless every expected verdict matches) |
| `live-counterfactual.mjs` | the shipped cells, not my copy of their predicate: mutates the real `scripts/tsconfig.json` to exclude the residue, drives both probes, restores byte-identically |
| `b1.mjs` | `probe-round283` B1's predicate over three real manifests plus one hypothetical, and the repaired predicate over four |
| `haz-delta.mts` | hazard-class delta for the three touched files, `HEAD` text vs working-tree text, detector graded by a known positive |

One caveat on `haz-delta.mts`, stated because it is the kind of thing that reads as a clean result
later: it compares the **working tree** against **`HEAD`**. Its reported figure — `probe-round283`
`[homedir, suite]` → `[homedir, suite]`, round303/round304 `[]` → `[]` — was taken while the edits
were still uncommitted. Run after `0c09aa07`/`a5a1e208` it compares the commits against themselves
and is trivially green. To re-derive the real reading, point it at the pre-fire commit
(`09be8535`) instead of `HEAD`.
