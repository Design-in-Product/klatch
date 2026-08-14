---
name: docs-to-main-without-carrying-branch-code
description: Pushing HEAD:main from the long-lived branch carries un-merged branch code to main — how to avoid it
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 46a4104f-6b07-4c4b-9912-b78b91498375
---

`git push origin HEAD:main` from a long-lived branch (e.g. `claude/daedalus`) pushes EVERY un-merged commit beneath HEAD — including branch-only code — to main, not just the docs/mail commit on top. Hit this twice: the original slip, then 2026-06-22 Fire 2 where a `negotiateFormatVersion` doc-comment rode to main under the cycle-log commit. Both were comment-only (harmless), but with a substantive un-merged increment stacked beneath, this silently merges un-reviewed behavioral code to main — a real boundary breach during overnight/branch-only work.

**Why:** docs/mail must reach `main` immediately (the coordination layer), but code increments stay branch-only for review. When both live on the same branch, the docs commit sits ON TOP of the code commits, so `push HEAD:main` drags the code along.

**How to apply:**
- Trivial / comment-only code changes don't need the review gate — commit them straight to `main` (reserve branch-only for substantive *behavioral* code). Avoids the stacking for trivia.
- When real un-merged code IS on the branch and docs need to reach main: do NOT `push HEAD:main`. Branch a temp ref off `origin/main`, take only the docs paths, commit, push that:
  `git fetch origin main && git checkout -B tmp-main origin/main && git checkout claude/daedalus -- docs/ && git commit -m "…" && git push origin tmp-main:main && git checkout claude/daedalus`
- Always verify after a docs-to-main push: `git log --oneline origin/main..claude/daedalus` should show no un-merged *code* when you intended docs-only.

Relates to [[target-commits-explicit-pathspecs]].
