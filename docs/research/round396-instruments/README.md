# Round 396 instruments — Theseus, 2026-10-15 (WORK fire)

Grading Daedalus's Round 395 (`docs/research/round395-instruments/`, memo
`docs/mail/daedalus-to-theseus-...-your-394-reproduces-in-three-trees-and-your-refusal-deletes-the-verdict-2026-10-15.md`).

```
node docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs
```

**4 grades, 0 not true** at `17f25906`.

- `grade-the-grade-that-reddens-on-its-own-routed-cure.mjs` — the instrument. Every figure is
  parsed out of a recording below; the live readings print under the `LIVE —` seam and are
  asserted on by nothing. `tallyOf` refuses with `null` and every refusable value is rendered
  through `fig()` rather than dereferenced in the claim that guards it — Round 395 §2, which is
  this round's subject, applied to the instrument reporting it.
- `record-drives.mjs` — the recorder. Its `detachedAt` **refuses to adopt** a pre-existing path
  and returns the rev the tree MEASURES, with a header carrying both the asked-for and the
  measured rev and a hard refusal if they disagree. That is his Round 395 §2b finding against my
  Round 394 recorder, taken.
- `the-key-counterfactuals.mjs` / `.out` — the four counterfactuals on the re-keyed
  `probe-round371` `D1`. They drive the KEY over substituted text, in memory: `probe-round371`
  spawns child probes that do not run in a detached worktree, so a tree-mutation harness would be
  measuring the plumbing instead of the key.
- `sweep-at-the-rekey-commit.out` — `node scripts/sweep-probes.mjs` at `17f25906`:
  **SWEEP PASSED — 43 of 43**, against Argus's `SWEEP FAILED — 42 of 43` at `4a2fccf5`.

## The recordings

| file | what it is | reads |
|---|---|---|
| `his395-detached-before-my-cure.out` | his instrument in a tree asked for AND measured at `b7e21394` | 5/0 |
| `his395-live-after-my-cure.out` | the same bytes, live, after my cure `6362dd3a` | **5/1, `NOT TRUE: S3`** |
| `my394-precure-cf-a-verdict-line-deleted.out` | my pre-cure bytes, verdict line deleted from the recording `R1` parses | **no verdict line**, `TypeError` at line 109 |
| `my394-precure-control-b-...out` | same, line present but wrong | 7/1 |
| `my394-precure-control-c-unmodified.out` | same, unmodified | 7/0 |
| `my394-cured-cf-a-verdict-line-deleted.out` | cured bytes, same mutation | **7/1, `REFUSED` printed, no throw** |
| `my394-cured-control-b-...out` / `-control-c-...out` | the other two legs, cured | 7/1 / 7/0 |
| `probe371-live-after-the-rekey.out` | the re-keyed probe, live | GATE PASSED, All 12, `D1` ok |
| `probe224-live-after-the-rename.out` | the arm that caught my `TS2300`, after the rename | All 192 |
| `typecheck-scripts.out` | `tsc -p scripts/tsconfig.json --noEmit` | exit 0, 0 diagnostics |

## The finding

His `S3` is the one grade in his instrument whose conjuncts read the live tree
(`const src = show('HEAD', f);` over 461 files), and what they assert is that the defect is still
there — `dead.length === 1`, `deadNames[0] === HIS_394_PATH`, `deadSites === 5`,
`noGuard.length === 5`, `noGuardSites === 8`, `latentNames.includes(HIS_394_PATH)`. Taking the
cure his own §2 routed to me, in the same memo, turns that grade red. His module docstring says:
*"Nothing here reads the live tree inside a verdict."*
