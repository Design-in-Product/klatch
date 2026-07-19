# Klatch

A standalone, local-first web app for managing Claude AI conversations through a Slack-inspired interface.

## Start Here — required reading before design or architecture discussion

Klatch has a specific premise that is easy to reconstruct incorrectly from the codebase alone — there is a strong pull toward a flatter, more ordinary version of this product. Before proposing anything about entities, channels, imports, klatches, or the 5-layer model — and **always** before a MAXT session or a roadmap conversation with xian — read these, in order:

1. **`docs/PREMISE.md`** — the foundational ideas, and a named list of the ways agents drift away from them. Non-negotiable first read.
2. **`docs/ROADMAP.md`** — the north star and what's actually shipped vs. planned. The "Completed" section is ground truth for what exists.
3. **`docs/ARCHITECTURE.md`** — the decision log.

The one-line version: **Klatch lets your existing agent conversations meet each other.** The entity IS its conversation, not a persona defined by a prompt. If your mental model doesn't have imported, continuing conversations at its center, you have drifted — re-read `PREMISE.md` before proposing anything.

Do not recount the roadmap back to xian as if it were new. Read it first.

## Verify Before Asserting (required — not a matter of care or effort)

Agents on this project have repeatedly stated things that were true once and are not true now: a channel count from a stale doc, a feature described as built that was never built, a design "we don't have" that existed in four places. These were not carelessness. Recalled context *feels* identical to verified fact, so intending to be careful does not help. The fix has to be mechanical.

**The rule:** if a claim did not come from a tool call **in this session**, verify it before stating it. Recalled context — your memory store, a summary, something you read hours ago, something that just sounds right — is a lead to check, never a source to cite.

**Always verify before asserting, no exceptions:**

- **Any number, count, date, filename, or path** — `ls` it, query it, `grep` it
- **Any claim about what the code does** — read the code, don't infer from docs; docs go stale faster than code
- **Any claim that something does or does not exist** — "we don't have X" and "X was never built" are the highest-risk statements on this project and have both been wrong. Search before you say it, and search under more than one name for the thing
- **Any claim about project history** — what was decided, deferred, approved, or shipped. Check git log, the doc, the memo
- **Any claim about what an agent, or xian, previously said** — find the actual text

**Two specific traps:**

1. **Docs can be stale.** A number in ROADMAP.md was accurate when written. Verify against the live source — the DB, the filesystem, the code — not against another document.
2. **"I don't recall that" is not evidence of absence.** When xian says a thing exists and you don't remember it, the prior should be that he's right and it's filed somewhere you haven't looked. Search exhaustively, under synonyms, before reporting that it isn't there.

**When you cannot verify:** say so explicitly and label the confidence — "I believe X, from [source], not verified this session." Never launder an unverified recollection into a flat assertion. A hedged claim costs a sentence; a confident wrong one costs the reader's trust in everything else you said.

This applies with most force in exactly the situations where verifying feels least necessary: fast-moving conversation, a fact you're sure of, a question that seems too small to check.

## Quick Start

```bash
npm run dev    # starts server (:3001) and client (:5173)
```

Requires `ANTHROPIC_API_KEY` in `.env` at project root.

## Architecture

**Monorepo** (npm workspaces):
- `packages/shared` — TypeScript types shared between client and server
- `packages/server` — Hono API server + SQLite + Anthropic SDK
- `packages/client` — Vite + React + Tailwind UI

**Key patterns:**
- **POST + SSE streaming**: Sending a message is a POST that returns message IDs, then the client opens a separate SSE connection to observe the stream. This separates creation from observation (retryable, multi-tab friendly).
- **SQLite as source of truth**: Completed messages live in `klatch.db`. Streaming happens in-memory via EventEmitters, written to DB on completion.
- **No ORM**: Raw `better-sqlite3` queries. Add Drizzle when we hit 8+ tables (currently at 6).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 19 |
| Backend | Hono (TypeScript) |
| Database | SQLite via better-sqlite3 |
| Streaming | Server-Sent Events (SSE) |
| Styling | Tailwind CSS v4 |
| AI | Anthropic SDK (default: Opus 4.6) |

## Database

Schema in `packages/server/src/db/index.ts`. Tables:
- `channels` — id, name, system_prompt, created_at, source, source_metadata, project_id
- `messages` — id, channel_id, role, content, status, created_at, original_timestamp, original_id
- `entities` — id, name, model, system_prompt, color, handle
- `channel_entities` — channel_id, entity_id (join table)
- `projects` — id, name, instructions, source, source_metadata
- `message_artifacts` — id, message_id, type, tool_name, input_summary, content

## Key Files

- `packages/server/src/claude/client.ts` — Streaming bridge between Anthropic SDK and SSE
- `packages/server/src/routes/messages.ts` — API surface (POST + SSE pattern)
- `packages/server/src/db/queries.ts` — All database operations
- `packages/client/src/hooks/useStream.ts` — Client-side SSE consumption
- `packages/client/src/App.tsx` — Main app component

## Testing

- **Framework:** Vitest (`npm test` at root runs server tests)
- **Test location:** `packages/server/src/__tests__/`
- **DB isolation:** In-memory SQLite per test via mock of `getDb()`
- **Streaming:** `claude/client.js` is mocked in route tests

## Multi-Agent Coordination

Four agents work on this repo: **Daedalus** (architecture & implementation), **Argus** (quality & testing), **Theseus** (manual testing & exploration, working in tandem with the product owner), and **Calliope** (writing, chronicling & documentation). See `docs/ROSTER.md` for the full team. Follow this workflow:

1. **Session start:** Pull from origin, then read `docs/COORDINATION.md` for status/assignments and check `docs/mail/` for any new memos addressed to you. Also read `docs/briefs/cross-pollination/current.md` for cross-project context from sibling projects. This is your full briefing — do it every time you're started or re-awoken.
2. **Before executing:** Check COORDINATION.md again — confirm your assigned work, verify dependencies are met (e.g., "Waiting on" is resolved), and avoid duplicating or conflicting with the other agent's in-progress work.
3. **Before every push:** Update your section in COORDINATION.md with current status, what you completed, and what you're working on next.

Statuses: available, working, blocked, review. See `docs/COORDINATION.md` for the full protocol.

## Mail Handling (required for all agents)

Mail in `docs/mail/` is the team's asynchronous coordination layer. The default discipline:

1. **Read mail immediately when you receive or notice it** — at session start, mid-session if a `git pull` brings new memos in, or whenever you `ls docs/mail/` and see something new addressed to you. Don't queue mail for "later." Don't batch into an end-of-session sweep.
2. **Respond immediately if you can.** If a memo asks something you can answer, draft and file the reply in the same turn.
3. **Take requested actions immediately if you can — even if they aren't "due" yet.** If a memo asks for a research spike, a test round, a doc update, or a route to another agent, do the work now rather than parking it on a to-do list.
4. **Surface to xian what input you need for anything you can't handle alone.** Be explicit: "Memo X asks Y; I need your call on Z before I can proceed; the rest I've handled." Don't surface mail to xian without an action or input ask attached.

This rule (set by xian, 2026-05-18) overrides earlier patterns of batching mail reads at session start or end. The default direction is toward reading sooner, not later. The only acceptable reason to delay reading is being mid-task on something xian has just directed; in that case, read at the next natural pause within the current turn, not at end-of-session.

The CLAUDE.md session-start protocol (above, "Multi-Agent Coordination" §1) already requires checking `docs/mail/` at session start; this section sharpens the discipline to include mid-session arrivals and to require action/response/surfacing in the same turn as the read.

### When working in a worktree, push mail to `main` so other agents can see it

If you're working on a feature branch in a worktree (per the worktree discipline) and you write a memo to another agent, **push that mail commit to `main` as soon as it's committed** — don't wait for the whole feature branch to merge. Other agents won't think to hunt across `.claude/worktrees/*` looking for memos to them; the mail directory on `main` is the only place they'll look.

The two clean patterns:
- Commit mail in a separate commit (just the `docs/mail/` files) and push that commit directly to `main` while you continue work on your worktree branch for the rest.
- Or, if the mail is part of a small enough change set, push the worktree branch to `main` as soon as the mail commit lands (assuming no other work is staged).

When in doubt: separate-commit-and-push-to-main is the safer pattern. Mail is the coordination layer; its delivery semantics are different from feature work.

### Close-discipline: move closed threads to `docs/mail/read/`

When you close a mail thread — acked + no open action remaining — `git mv` both the inbound memo and any outbound reply(ies) into `docs/mail/read/`. The closer (the agent who marks the thread done) is the right party because they have the context to know it's closed. This keeps `docs/mail/` showing only currently-active threads.

Apply at the moment of closing: a closing memo ("ack received, no further action") landing in `read/` together with the inbound it closes is the cleanest pattern. If the close is unilateral (no closing memo needed — e.g., you read an informational memo and there's nothing to reply), still move it after reading.

Don't move threads with open action items, even if the most recent memo is days old. Open threads stay in `docs/mail/`. If an open thread is parked because xian or another agent needs to weigh in, leave it visible so the next session sees it.

## Session Logs

Agents maintain session logs in `docs/logs/` during working sessions.

- **Filename:** `YYYY-MM-DD-HHMM-NAME-MODEL-log.md` (e.g., `2026-03-11-1532-theseus-opus-log.md`)
- **Purpose:** Record decisions, findings, test results, and observations during a session
- **When:** Create a log at session start if doing substantive work (testing, investigation, implementation)
- **Content:** Timestamped entries with context, findings, and next steps
- **Update continuously:** Add timestamped entries as work progresses — do not reconstruct from memory at session end

## Session Wrap Protocol (required before closing every session)

Before writing any "done" or "complete" claim in your session log, you must verify your work is actually in the repository. This is not optional.

**Step 1 — Confirm your commits landed:**
```bash
git log origin/YOUR-BRANCH --oneline -5
```
Paste the output into your session log. If your commits do not appear, do not claim the work is done.

**Step 2 — Confirm each deliverable file exists:**
For every file you claim to have created or modified, run:
```bash
ls PATH/TO/FILE
```
If a file is missing, note it explicitly. Do not write "done" for work you cannot verify is present.

**Step 3 — Push your session log last:**
Commit and push your session log after verifying Steps 1 and 2. The log is the final record, not the first.

**If verification fails:** Write exactly what was attempted, what commit hashes exist, and what is missing. Report to xian before closing. Do not fabricate a completion record.

## Git Safety Rules

- **No force pushes without explicit approval from xian.** `git push --force` and `git push -f` are prohibited unless xian has specifically authorized the operation in the current session.
- **If a rebase goes wrong, stop and report.** Do not attempt to recover a failed rebase on your own and push the result. The risk of silently losing work is too high. Report the state to xian and wait for guidance.
- **Verify after any recovery operation.** If you recover from a rebase conflict or merge issue, run `git log --oneline -10` and check that your work commits are present before pushing.

## Git Connectivity — SSH over port 443

If `git push` / `git fetch` hangs or returns `ssh: connect to host github.com port 22: Operation timed out`, the network is blocking SSH's default port. Common on conference wifi, hotel networks, and some corporate networks. GitHub supports SSH over port 443 as a documented alternative. One-time setup per machine:

```bash
ssh-keyscan -t rsa,ed25519 -p 443 ssh.github.com 2>/dev/null >> ~/.ssh/known_hosts
```

Then prefix git operations with:

```bash
GIT_SSH_COMMAND="ssh -p 443" git -c url.'git@ssh.github.com:'.insteadOf='git@github.com:' push origin main
```

Non-destructive — it uses a different route for this invocation only and doesn't change repo or SSH config. Report the workaround in your session log if you use it, so other agents on the same network know it works.

## Conventions

- No auth (single-user local tool)
- No state management library yet (plain React state; add Zustand if needed)
- Gall's law: each feature is the smallest working increment

## Deliverables

Research, audits, and design work must be committed to `docs/` — not just reported in chat. If a task produces findings, plans, or decisions, write them to a markdown file in the repo so other agents and future sessions can reference them. Chat is ephemeral; the repo is the source of truth.
