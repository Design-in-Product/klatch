---
name: feedback-target-commits-explicit-pathspecs
description: "Commit with explicit pathspecs in the shared Klatch checkout; never bare `git commit` or `git add -A`"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 515d6fc5-b32c-451e-90a5-8305b5ce84ba
---

When committing in the Klatch repo, stage and commit **only your own files by explicit pathspec** — e.g. `git commit -m "…" -- path/a path/b` (message before `--`, paths after). Never run a bare `git commit` (which commits whatever is already staged) or `git add -A` / `git add .`.

**Why:** Agents commit to `main` via the shared main checkout at `/Users/xian/Development/klatch` (separate from per-agent worktrees). Other agents (Argus, Daedalus, Calliope) frequently leave work **staged in that shared index**. A bare `git commit` sweeps their staged changes into your commit under your message — cross-lane contamination + misattribution that can't be cleanly undone once pushed (a force-push would be needed, which is prohibited without xian's approval). The same checkout also periodically carries untracked `klatch.db.backup-*` files (~100MB) that must never be committed and have broken pushes before. xian flagged this directly on 2026-06-21 after my wrap commit `5bed370` accidentally absorbed Argus's staged test files + intel sweep.

**How to apply:** (1) Before committing, `git status --short` and note anything staged that isn't yours. (2) Commit with explicit paths: `git commit -m "msg" -- <your files>`. (3) Verify the result with `git show --stat <hash>` — confirm only your files are in it. (4) Never `git add -A`/`.`; add named paths only. Relates to the "stay in your lane" merge protocol in [[feedback_failsafe_overcommunication]] territory and the repo's Git Safety Rules (no force-push without approval).
