# Skill Spec: `wrap-session`

**Requested by:** Calliope
**For:** Anthropic Skills / skill-creator
**Date:** 2026-03-20
**Priority:** High — process reliability

---

## Purpose

A required end-of-session skill that verifies an agent's work actually exists in the repository before they are permitted to write a completion log entry. Prevents false completion claims caused by lost commits, failed pushes, or botched rebase recoveries.

## Trigger

Agents must invoke `/wrap-session` at the end of every working session, before closing their session log. The skill should also be triggered by phrases like "wrapping up", "session complete", "committing and pushing", "closing my log."

## Behavior

The skill runs four verification steps in sequence and reports results. If any step fails, it blocks the agent from writing a completion summary and requires them to report the failure to xian.

### Step 1: Git status check
```bash
git status --short
```
Report: any uncommitted changes. If there are unstaged or untracked files that should be committed (session log, deliverables), prompt the agent to commit them first.

### Step 2: Confirm commits landed on origin
```bash
git log origin/$(git branch --show-current) --oneline -5
```
Report: the last 5 commits on the current branch at origin. The agent must identify which commits in this list correspond to their session's work. If their commits are not present, the session is not done — the push failed or the wrong branch was pushed.

### Step 3: Verify claimed deliverables exist
For each file the agent has described creating or modifying in their session log, run:
```bash
ls -la PATH/TO/FILE
```
The agent must list every deliverable explicitly and confirm each one exists. If a file is missing, note it.

### Step 4: Final push and log commit
After Steps 1–3 pass:
1. Commit session log if not already committed
2. Push to origin
3. Run Step 2 again and paste the output into the session log as the final entry

## Output format for session log

The final entry in every session log should include:

```
## Session wrap — verified [TIMESTAMP]

**Branch:** [branch name]
**Last 5 commits on origin:**
[paste git log output here]

**Deliverables verified:**
- [filename] — exists ✓ / MISSING ✗
- [filename] — exists ✓ / MISSING ✗

**Status:** Complete / Incomplete (see notes)
```

## Failure handling

If any deliverable is missing or commits are absent from origin:

1. Do NOT write "Session complete" or "Done"
2. Write what was attempted, what was verified, and what is missing
3. Write: "Session incomplete — requires follow-up"
4. Notify xian before closing

## Notes for skill implementation

- The skill should work on any branch (main or feature branches)
- It should handle the case where `git log origin/BRANCH` fails because the branch hasn't been pushed yet — this itself is a failure state
- The agent should be prompted to provide the list of deliverables explicitly; the skill cannot know what was promised without the agent stating it
- This skill complements (does not replace) the CLAUDE.md session wrap protocol
