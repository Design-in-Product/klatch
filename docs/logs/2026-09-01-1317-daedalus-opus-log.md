# Daedalus — 2026-09-01 session log (13:17 WORK fire)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Note: today's 09:17 START fire has its own log at `docs/logs/2026-09-01-0917-daedalus-opus-log.md`.

---

## 13:17 PT — WORK fire. Briefing.

Worktree synced by the wrapper; `git log` at `0ccf18f` (v88 rollup), tree clean. Read
`docs/COORDINATION.md` (Daedalus section — last fire 9/1 09:17 START / Round 131). Checked
`docs/mail/` — one inbound addressed to me,
`theseus-to-daedalus-cc-xian-team-i-took-132-and-the-fourth-file-was-the-scanner-2026-09-01.md`,
read in full.

**Baseline reproduced before touching anything:** `node scripts/verify-tsx-guard.mjs` →
`PASS — all 185 checks passed`. Matches Theseus's Round 132 wrap.

**Round 133 target: the fourth limb for the read-only three.** Theseus's §6 hands it to me
explicitly ("You said you would take it if I took 132 on the heuristic. I took 132; it is yours"),
and it is my own Round 129 open item and Round 131 §5. Taking it in the fire that received the memo.

Entries below are appended as work progresses.

## 13:2x PT — the read-only three under plain `node`, measured before reasoning

`.testdata/r133/rc-three.mjs` (spawn + observe, gitignored scratch):

```
{"f":"measure-marker-floor.mjs","rc":2,"ms":73,"rawCrash":false,"saysIncomplete":true}
{"f":"probe-recall-tool.mjs",   "rc":2,"ms":75,"rawCrash":false,"saysIncomplete":true}
{"f":"serve-scratch.mjs",       "rc":2,"ms":84,"rawCrash":false,"saysIncomplete":true}
```

Read each file's top-level body first: in all three the guarded import is the first statement that
can reach anything expensive. So §(b2)'s "safe to execute" bound is a fact about running them under
`tsx`, and §(b2) runs under plain `node`.

## 13:3x PT — the run limb cannot be ungated, and the hazard set says so

`readable` 37, `swept` 12, incremental **25** (3 read-only importers, 22 not). Capability scan by
reading, not running: 6 files make outbound requests (`probe-carried-context*` ×5,
`probe-scratch-server.mjs`), 3 shell out, 5 write files, 5 open DBs. A file that imports no
TypeScript runs to completion under plain `node`.

## 13:4x PT — the finding that was not gone looking for

The hazard scan flagged `probe-expand-continuation.mts` as having a dynamic import. Following it:

- `packages/server/src/claude/` holds `carried-context.ts`, `client.ts`, `recall.ts` — **no `recall.js`**.
- Zero `explainTsxRequirement`, zero `try {` in the file. **Unguarded.**
- `node scripts/probe-expand-continuation.mts` → `ERR_MODULE_NOT_FOUND` + raw `    at ` frame.
- At the same moment `node scripts/verify-tsx-guard.mjs` → **`PASS — all 185 checks passed`**.

Single-variable control, two read-only mutants one line apart:

| mutant | specifier extension | verdict |
|---|---|---|
| `probe-r133-jsspec.mjs` | `.js` | `PASS — all 185`, never named, count unmoved |
| `probe-r133-tsspec.mjs` | `.ts` | `FAIL — 1 of 186`, `UNGUARDED …(read-only: outside the run population)` |

Cause: `ANCHOR_SOURCE` requires a `TS_EXTENSIONS` member **in the specifier text**.

## 13:5x PT — repair to the live file

Guard added in Round 126's shape. Verified: plain `node` → `INCOMPLETE — nothing was verified…`, no
stack trace; `npx tsx` → reaches its real work and prints; `npm run typecheck` clean across all three
workspaces. **`node scripts/verify-tsx-guard.mjs` → `PASS — all 185`, byte-identical to before the
fix** — the instrument could not see the defect and cannot see the repair.

## 14:0x PT — the fourth limb, built as a reading

`scripts/probe-import-sites.mjs`. `typescript` 5.9.3 verified resolvable from the repo root, so no
new dependency. On the clean tree: 37 modules, 16 dynamic-import sites, 0 parse diagnostics; agrees
with §(b) on all 7 files §(b) sees, names `probe-expand-continuation.mts:59` — 0 after the repair.

One mid-round correction, caught by the measurement rather than by care: the first
`classifySpecifier` asked `existsSync(abs)` and called a hit "resolves". `../x.ts` exists on disk,
so every known-guarded site came back clean and the limb reported nothing about the four files §(c)
certifies. Tell: no `typescript` rows at all in the output, which no correct reading of this tree
produces. Fixed and noted in the file.

## 14:1x PT — Round 125 shapes 1 and 2, measured at last

| mutant | shape | `verify-tsx-guard.mjs` | `probe-import-sites.mjs` |
|---|---|---|---|
| `probe-r133-computed.mjs` | 1 — `import(parts.join('/'))` | `PASS — all 185` | `UNREADABLE …:5 <computed>` |
| `probe-r133-bound.mjs` | 2 — literal bound first | `PASS — all 185` | `UNREADABLE …:4 <computed>` |

Shape 2 also produced **no `CONTAINMENT` row and no bucket entry** — the bucket is keyed on
`a.broad && !a.narrow` and shape 2's anchor is neither. Correction to Round 130's note filed.

## 14:2x PT — tree state and deliverables

All four mutants deleted. After removal: `node scripts/verify-tsx-guard.mjs` → `PASS — all 185`;
`node scripts/probe-import-sites.mjs` → `0 site(s)`, exit 0. `packages/` never touched.

- `docs/research/round133-a-live-file-crashed-raw-under-plain-node-and-the-anchor-is-spelled-by-extension-2026-09-01.md`
- `docs/mail/daedalus-to-theseus-cc-xian-team-a-live-file-was-crashing-raw-and-the-anchor-is-spelled-by-extension-2026-09-01.md`
- `scripts/probe-import-sites.mjs`, `scripts/probe-expand-continuation.mts` (repaired)
- Theseus's Round 132 inbound `git mv`'d to `docs/mail/read/` — its ask is discharged; my reply opens the new item.
- Mail committed separately and pushed to `main` first, per the worktree mail discipline.
- This log; COORDINATION.md updated.
