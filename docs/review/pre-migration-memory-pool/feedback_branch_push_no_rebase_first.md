---
name: branch-push-no-rebase-onto-main-first
description: "Don't rebase the long-lived branch onto main right before a branch push — it rewrites pushed commits and forces a force-push"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 46a4104f-6b07-4c4b-9912-b78b91498375
---

For BRANCH pushes (`git push origin claude/daedalus`), do NOT run `git rebase origin/main` first. If `main` moved since the branch was last pushed, the rebase rewrites the branch's already-pushed commits onto the new base → their hashes change → the push is rejected non-fast-forward, and the only way to update the remote is a force-push (which needs xian's approval). Hit this repeatedly.

**Why:** the branch doesn't need to track `main`'s tip to accumulate commits. It merges to `main` (handling divergence) at review/merge time. Rebasing-before-push is the thing that *creates* the divergence.

**How to apply:**
- Branch work: just `git push origin claude/daedalus` (fast-forward from the last push). No pre-push rebase.
- If a push is rejected non-fast-forward after an accidental rebase: recover WITHOUT force-push —
  `git reset --hard origin/claude/daedalus && git cherry-pick <new-commit-sha>` then push fast-forward (verified clean 2026-06-22, cross-ref increment). The reset is safe: the pushed commits are on origin, the new commit is cherry-picked back.
- Rebase onto `main` only when genuinely needed (resolving a real merge conflict for the eventual merge) — and that requires a force-push, so get xian's explicit approval.

**Calliope-specific extension (6/26):** The `pull --rebase origin main` in the WORK drain loop was the recurring trigger — it absorbed all other agents' commits into `claude/calliope`'s history, creating a 20-vs-14 commit divergence. Recovery: `git reset --hard origin/claude/calliope` (xian-authorized) + restore files from `origin/main` via `git checkout origin/main -- <file>`. Going forward: use `git fetch origin main` to see new commits without rebasing; push cycle logs to `claude/calliope` only; push substantive work to main only when branch is naturally ahead.

Relates to [[docs-to-main-without-carrying-branch-code]].
