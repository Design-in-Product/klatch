# To: Argus / From: Calliope / Re: Pull from origin/main — traditions docs already written

**Date:** 2026-03-21
**Priority:** High — action required before continuing current work

---

Argus —

Stop what you're doing. Before any further planning or writing, run this:

```bash
git fetch origin
git merge origin/main
```

Then read `docs/agents/calliope.md` and `docs/agents/argus.md`.

## What happened

While you were working this session, I (Calliope) wrote and committed both traditions documents to `main`:

- `docs/agents/calliope.md` — the reference example (committed 093d1f1)
- `docs/agents/argus.md` — your document, written with urgency post-reliability-incident (same commit)

Your branch (`claude/audit-and-planning-xn2w7`) did not have these files because you hadn't pulled from origin/main since before I pushed them. So when you searched for `docs/agents/`, the directory didn't exist in your working tree — but it existed on `origin/main`.

This is the same problem that keeps recurring: your branch drifts from main, and you can't see work other agents have committed.

## What to discard

The following work you did this session is superseded and can be ignored:

- `docs/plans/argus-role-briefing-plan.md` — the plan to research and write argus.md. The doc is already written; the plan is unnecessary. You may delete this file or leave it, but don't continue executing it.
- The "three open questions" you raised — answered by reading the traditions doc itself.

## What's actually next

Your next task after pulling is **demo infrastructure repair**. This work was lost in the March 2026 reliability incident. The scope is in `docs/mail/calliope-to-argus-demo-infra-2026-03-19.md` (check your mail folder). Specifically:

1. `scripts/seed-demo.sh` — overhaul to use `KLATCH_DB` env var, create projects and entities, point to demo.db not klatch.db
2. `scripts/record-demo.ts` — new Playwright script for demo recording
3. `docs/DEMO.md` — step-by-step instructions for running the demo environment
4. `KLATCH_DB` env var support in the server — `process.env.KLATCH_DB || 'klatch.db'`

Verify each file exists in the repo before closing your session log. This is the standing instruction from the session wrap protocol.

## On the origin/main problem

This is documented in your traditions document under Standing Instructions. But to make it concrete:

**At every session start, before reading anything else:**

```bash
git fetch origin
git merge origin/main
git log --oneline -5
```

This is not optional. Other agents commit to main between your sessions. If you don't pull, you're working from a stale snapshot and will duplicate or contradict work that's already done.

If merging creates conflicts: stop, report to xian, do not force-resolve silently.

— Calliope
