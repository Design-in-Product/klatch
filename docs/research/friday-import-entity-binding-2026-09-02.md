# Does a fresh import mint per-agent entities? Measured, not inferred

**Theseus, 2026-09-02 WORK fire (14:47 PT). Round 139.**
**Answers:** Calliope's Q1 in `docs/mail/calliope-to-daedalus-theseus-cc-team-xian-urgent-friday-piper-morgan-test-2026-09-02.md`.
**Instrument:** `scripts/probe-import-entity-binding.mts` — 31 checks against real sessions from `~/.claude/projects`, a scratch SQLite DB, zero model calls, zero API spend, no shipped file changed.

---

## The one-line answer

**Half right, and the half that's wrong is the half Friday runs on.**

The *server* mints per-agent entities correctly, exactly as Increment #1 claims. The *client never asks it to.* Every import driven through the Klatch UI today — Claude Code or claude.ai — lands on `default-entity`, which is the same shape as the 72 March imports Calliope is trying to avoid, just fresher.

A fresh import does **not** sidestep the backfill question by itself. It sidesteps it only if the import is driven with a confirmed entity name, and today only one caller can do that, and it isn't the UI.

## What was measured

Five real sessions from five distinct agent worktrees (Argus, Calliope, Daedalus, Iris, Theseus) stood in for the Piper Morgan cast: five named agents with real, independently-authored transcripts. Each was POSTed to the live import route against a scratch DB.

| Arm | What it drove | Result |
|---|---|---|
| **A** | 5 sessions, each POSTed **with** `entityName` | 22/22 — five distinct entities minted, each channel bound to exactly its own, every assistant message carrying its `entity_id` |
| **B** | A 2nd Argus session with the same `entityName` | 4/4 — `matched-by-name`, entity count unchanged, Argus owns two channels |
| **C** | A session with **no** entity fields — *the shape the shipped client actually sends* | Bound to `default-entity`; no entity minted; response carries no `entityDisposition` at all |
| **D** | claude.ai export ZIP (the fixture export) | Every channel → `default-entity`; no entities minted |
| **E** | claude.ai ZIP **with** `entityName: 'PiperCXO'` | **201, silently ignored** — no entity minted, no error, channels still on `default-entity` |

Arms A and B are the good news and they are unambiguous: `resolveImportEntity`'s reuse-by-name rule works, including the five-sessions-one-agent case xian assumed by default.

## Why the UI lands on the default

Verified in source this session, not recalled:

- `packages/client/src/api/client.ts:621` — `importClaudeCodeSession(sessionPath, channelName?, forceImport?)`. No entity parameter exists; the POST body is `{ sessionPath, channelName, forceImport }`.
- `packages/client/src/api/client.ts:588` — `uploadClaudeCodeSession` likewise appends only `file`, `channelName`, `forceImport`.
- `grep -rn entityGuess packages/client/src` → **zero hits.** The server computes and returns `entityGuess` on `GET /import/claude-code/sessions`; nothing in the client reads it.
- `packages/server/src/db/queries.ts:1280` — `const boundEntityId = params.entityId || DEFAULT_ENTITY_ID`. Absent an entity, the default is not an error state, it's the silent fallback.

This independently reproduces what **Iris reported on 2026-08-30** (`iris-to-xian-cc-team-import-confirm-step-scope-doc-21-days-idle-2026-08-30.md`): the confirm step was scoped on 8/09, the server half shipped the same day, the client half was never built, and the scope doc has been waiting on a review session for 21 days — now 24.

**The stalled item and the Friday blocker are the same item.** That is the thing worth knowing.

## The claude.ai path is a harder gap than the Claude Code one

Arms D and E are the sharper finding, and it depends on a fact I could not verify: **where the Piper Morgan cast actually lives.**

- If those conversations are **Claude Code sessions**, the gap is client-only. The server accepts `entityName` today (arm A proves it), so the UI work is the whole job — and there is a scripted workaround for Friday (below).
- If they are **claude.ai conversations** exported as a ZIP, there is no path at all. `processImport` in `packages/server/src/routes/import.ts:663` calls `importSession({...})` with **no `entityId` argument** — the entity plumbing was never added to that route. Arm E shows it accepts `entityName` in the body and discards it without complaint: HTTP 201, no entity, no warning. A demo run this way would produce a channel per department head, all owned by one entity named "Claude."

I did not find a record establishing which of the two it is. Someone should answer that before Friday is planned around either branch.

## What actually works today, if Friday needs a fallback

Arms A and B are a working recipe that needs no new code:

```bash
curl -s localhost:3001/api/import/claude-code \
  -H 'Content-Type: application/json' \
  -d '{"sessionPath":"/Users/xian/.claude/projects/<dir>/<session>.jsonl","entityName":"Chief of Staff"}'
```

Repeat once per session, using the same `entityName` for every session belonging to the same department head — that is what collapses them into one agent whose transcript spans all of them. The response carries `entityDisposition`, which reads `minted` the first time and `matched-by-name` after, so the operator can see which happened rather than trusting it.

**Verified at the route level, not against a listening server.** The probe drives the same Hono route the dev server mounts, with a scratch DB. I did not stand up `npm run dev` and curl it. That is the one step between this recipe and a proven Friday path, and it is small.

## Scope limits, stated plainly

- **The corpus is a proxy.** My five agents are duty-cycle sessions — one human turn and one long assistant turn each (2 messages, 7–36 artifacts). They exercise entity binding faithfully, which is what was under test, but they are not conversationally deep the way the real cast is. Nothing here measures how a 400-message department-head transcript imports.
- **Carried context (Continuity #3) was not tested.** Calliope's memo asserts it "already ships and works correctly once an entity's imports are properly separated." Arm A establishes the separation precondition; it does not establish the claim. Untested this fire.
- **The unmerged `origin/claude/cowork-import-hardening` branch changes none of this.** `git diff origin/main origin/claude/cowork-import-hardening -- packages/server/src/routes/import.ts | grep -cE '^[+-].*(entityId|entityName|resolveImportEntity)'` → **0**. The finding holds whether or not that branch merges.
- **Baseline:** `npm test` exit 0 before the probe. Nothing under `packages/` was touched; the only new file is `scripts/probe-import-entity-binding.mts`.

## The probe is the acceptance test

`scripts/probe-import-entity-binding.mts` separates two kinds of check on purpose, because conflating them is how an instrument lies. Arms A/B assert **behavior that must hold** — a failure there is a regression, and the script exits 1. Arms C/D/E assert **a gap that is currently present** — they report `GAP-OPEN` today, and when someone builds the confirm step or adds entity plumbing to the claude.ai route they flip to `GAP-CLOSED`, which is the good news, not a regression. It exits 2 with a clear message on a machine without the live corpus, rather than reporting a fleet of failures that only mean "wrong laptop."

Re-run it after the confirm step lands. Arm C flipping is the acceptance signal.
