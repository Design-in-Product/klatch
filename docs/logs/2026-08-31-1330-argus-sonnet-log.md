# 2026-08-31 WORK fire — Argus (Sonnet 5)

## Context

Scheduled duty-cycle WORK fire. Pulled origin/main (already up to date at `b4e2438` on entry, then re-pulled `e07e806 → a45f68f` mid-fire for a Daedalus/Theseus Round 127 commit — zero `packages/` changes, verified via `git diff --stat`). Checked `docs/mail/` for anything addressed to Argus: found `daedalus-to-argus-cc-xian-sdk-bumped-and-mcp-v2-scoped-2026-08-31.md`, a reply to Argus's own 8/31 START-fire request (`argus-to-daedalus-sdk-gap-6-minors-2026-08-31.md`, already closed to `read/`).

## Work

1. **Re-verified the SDK bump independently, not on Daedalus's say-so.** `packages/server/package.json:15` and `package-lock.json` already correctly read `^0.122.0`/`0.122.0` — but this worktree's own `node_modules` was still on `0.116.0` (stale from before the bump landed; a fresh-worktree artifact, not a discrepancy in Daedalus's work). Ran `npm install` at root to sync. Confirmed after: installed `0.122.0`, `npm run typecheck` clean across all three workspaces, `npm test` **1447/1447 server (88 files), 239/239 client (13 skipped)** — matches the last verified baseline exactly, zero drift.

2. **Read the MCP SDK v2 migration scoping doc** (`docs/plans/mcp-sdk-v2-migration-scoping-2026-08-31.md`). Agree with the recommendation: schedule as its own fire, not against Oct 6 (no cliff — v1.x patched through ~Jan 2027 per my own 8/17 sweep). Nothing to add.

3. **Discharged the open item Daedalus left on my seat.** His mail hygiene note explicitly said the reply stayed in `docs/mail/` (not `read/`) because it "opens an item on the recipient's seat" — for Argus, the finding that the MCP test suite never exercises the real stdio transport (all four MCP test files use `InMemoryTransport.createLinkedPair()`; `bin.ts`'s `StdioServerTransport` has zero test callers). Confirmed directly with `grep -rn "StdioServerTransport\|StdioClientTransport" packages/server/src/` — one file, two lines, both in `bin.ts`.

   Considered writing an automated stdio smoke test this fire and decided against it: `scripts/probe-scratch-server.mjs`'s own docblock documents that a `tsx`-spawned child process re-execs into a grandchild, so a bare `child.kill()` (which is what `StdioClientTransport.close()` does by default) doesn't reap the real server process — the exact hazard Daedalus already had to solve for the scratch dev server with `detached: true` + process-group signaling. Landing an unmanaged subprocess spawn into the shared 1447-test suite without that same care risks a flaky or hanging `npm test`, which is a worse outcome than the coverage gap itself.

   Wrote up the finding and recommendation instead: `docs/research/mcp-stdio-transport-coverage-gap-2026-08-31.md` — fold into the v2 migration's step 4 (Daedalus already named this as the easy-to-skip step), or a standalone `scripts/` smoke script outside the vitest hot path.

4. **Closed the mail thread.** Filed `argus-to-daedalus-cc-xian-stdio-gap-tracked-thread-closed-2026-08-31.md`, then `git mv`'d both it and Daedalus's original memo into `docs/mail/read/` — no open ask remains on either side.

5. **Updated `docs/COORDINATION.md`** with this fire's status entry.

## Wrap verification

```
$ git log origin/claude/argus-cycle --oneline -6
```
(paste of actual output below, run after the final commit)

Deliverables:
- `ls docs/research/mcp-stdio-transport-coverage-gap-2026-08-31.md`
- `ls docs/mail/read/daedalus-to-argus-cc-xian-sdk-bumped-and-mcp-v2-scoped-2026-08-31.md`
- `ls docs/mail/read/argus-to-daedalus-cc-xian-stdio-gap-tracked-thread-closed-2026-08-31.md`

All confirmed present before this log was committed — see the wrap-verification commit that follows.
