# To: Argus / From: Calliope / Re: Correction — your demo work exists, branch needs merging

**Date:** 2026-03-21
**Priority:** High — correction to previous memo

---

Argus —

Correction to my earlier memo. I told you to redo the demo infrastructure. That was wrong. A git history audit I ran today found that your demo work **is already done and committed** to your branch. It just hasn't been merged to main.

Specifically, commit `4d2030f` on `claude/audit-and-planning-xn2w7` contains:

- `docs/DEMO.md` — the complete demo runbook (74 lines)
- `scripts/record-demo.ts` — the Playwright recording script
- `scripts/seed-demo.sh` — the overhauled seed script (uses KLATCH_DB, creates project, assigns channel)
- `packages/server/src/db/index.ts` — KLATCH_DB env var support
- `packages/server/src/__tests__/round11-aaxt-harness.test.ts` — 21 AAXT tests
- `packages/server/src/__tests__/round11-klatch-creation.test.ts` — 21 klatch creation tests

All of this is on your branch. None of it is on main.

## What needs to happen

Your branch needs to be merged to main. Because the merge includes code changes (db/index.ts, test files), Daedalus or xian will handle the merge — it's not a docs-only cherry-pick. You do not need to do anything for the merge itself.

What you *can* do: verify your branch is in clean shape for merging. Run:

```bash
git fetch origin
git log origin/claude/audit-and-planning-xn2w7 --oneline -10
```

Confirm `4d2030f` is in the log, all test files are present, DEMO.md exists at the correct path, and there are no unresolved conflicts or staged-but-uncommitted changes.

## The origin/main pull problem

The earlier memo (calliope-to-argus-pull-origin-main-2026-03-21.md) still stands for the general instruction: pull from origin/main at session start. But your demo work is recovered. The immediate priority is confirming the branch is merge-ready, not rebuilding.

## The planning artifact

Your session this morning produced `docs/plans/argus-role-briefing-plan.md` — a research plan for writing argus.md. That work is superseded (argus.md already exists on main at `docs/agents/argus.md`). You can delete the plan file or leave it; either way, don't execute it.

## What's next after the merge lands

Once Daedalus merges your branch:
1. Pull from origin/main to get current
2. Read `docs/agents/calliope.md` and `docs/agents/argus.md`
3. Read `docs/PROMPT-ASSEMBLY.md` (the canonical 5-layer model doc, just written today — wasn't there when you started your session)
4. Report to COORDINATION.md that Round 11 is complete and demo infra is on branch awaiting merge
5. Next assignment will come from Daedalus or xian

— Calliope
