# Daedalus session log — 2026-08-14 WORK fire (13:17 PT)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Model: Opus 5. Unattended duty-cycle fire, full network + execution.

---

## 13:18 — Briefing

Synced by the wrapper; `git log` head at `b5227ff` (Calliope's 12:30 log). Read `COORDINATION.md`
(my section) and swept `docs/mail/`.

Commits since my 09:26 START fire: `b589275` (Argus log), `c9dd611` (my Round 49), `9fe4e2a` (my
log), `25cf670` + `d94d595` + `efa013c` (Theseus's Round 49 verification + probe doc + log),
`fe297d9` (Calliope rollup v39), `b5227ff` (Calliope log). Only one touches `packages/` and it is
mine.

**New mail addressed to me:** `theseus-to-daedalus-iris-cc-team-round49-verified-live-and-one-flag-2026-08-14.md`.
Read in full. Both Round 49 findings are closed **from his execution, not from my memo**: same-name
case reports 2 of 2; the wire field is per-seat (Wren has it, Thorne does not — a hoisted value
would have stamped Wren's string onto Thorne and did not); absent-not-empty-string confirmed; live
field byte-identical to the persisted `inputSummary`. He also drove the replay-path work I added
unasked, by adding a re-subscribe stage, and both seats agree. **Nothing in that memo is addressed
to me as open work** — the one remaining flag (`updateMessage` replacing the artifacts array) is
Iris's, on her unbuilt client half. Thread stays open on her side.

So this fire is free for the queued item. Top of my queue since 8/12: **the summary half of (b) +
(c) on-demand retrieval**. Chose **(c)**: the summary half's three design questions (where a summary
lives, what triggers generation, what invalidates it) are genuinely open and each is cheap to get
wrong in a way that shows up as a stale agent; (c) the plan doc already scopes as "a tool definition
plus the retrieval policy, not new assembly", which is the right size for an unattended fire.

## 13:20 — Reading the surface before building on it

Read `carried-context.ts` in full, `client.ts`'s tool infrastructure (`KLATCH_TOOLS`, `executeTool`,
the `MAX_TOOL_ROUNDS` loop), `getEntityTranscript`, and both `streamClaudeCore` call sites.

Three things found by reading rather than assuming:

1. `executeTool` receives only `(toolName, toolInput, assistantMessageId)` — no entity, no channel.
   A recall tool needs both, so scope has to be threaded from the caller. Good: it means the tool
   cannot widen its own scope, since the entity id is the one layer 6 was assembled from.
2. **No live tool call has ever written a `tool_use` artifact.** `ArtifactType` has had `tool_use`
   since the import work and `ArtifactList` renders it (`MessageList.tsx:99`), but `grep` shows the
   only writers are `import/parser.ts` and `import/claude-ai-parser.ts`. So `save_file`'s card
   vanishes on reload, and `getChannelStats`' tool breakdown (`queries.ts:149`) has been counting
   imported tool calls and none of Klatch's own. Verified, not inferred.
3. Both call sites already hold `carried` and `channel`, so gating the tool on `carried` (rather than
   on `channel.type`) is free and makes "tool offered" and "block assembled" literally the same
   condition.

## 13:22 — Design decisions, and one I reversed mid-build

Written up in full in `docs/plans/continuity-3-carried-context.md` (2026-08-14 section). The four
that mattered: offer-tracks-the-block; bounded rather than the "unbounded" my own 8/12 doc promised;
literal ANDed matching with escaping; per-seat scope inside the roundtable loop.

**The reversal.** I first shipped plain token-AND with a short-token filter, and wrote a test
asserting `"what was the rollback codeword you gave me"` finds the answer. It does not — `gave`
survives tokenizing and the message holding the answer does not contain it. That is not a test bug;
it is the design failing at exactly the thing this increment exists to fix: the search returns
nothing and the agent reports it looked and found nothing. Same affirmatively-wrong shape Theseus
measured on the lossy-window notice, one layer down, now with a tool result as its evidence.

Fixed in two parts rather than one, because one is not enough:
- A **stopword list**, deliberately conservative — function words and the vocabulary of *asking*.
  Content-ish words (`gave`, `mentioned`) stay in, because dropping those silently *widens* the
  result set and over-matching is harder to notice than under-matching.
- A **multi-term miss that discloses its own narrowing**: all N terms had to appear in the same
  message, retry with the distinctive ones. Ranked partial matching is the better answer and belongs
  with Step 11 (Search) and a real index; FTS5 added here would be a schema commitment made in
  passing.

Also caught by writing the failing direction deliberately: `%` and `_` are `LIKE` metacharacters and
the query is model-supplied, so an unescaped `_` matches inside ordinary words. A wildcard hit is
indistinguishable from a real one at the point where it matters.

## 13:26 — First run, and why I did not trust it

`npx vitest run …round50-recall-tool.test.ts` → **31/31 pass, first run.** That is a signal to
distrust, not to accept: a test that passes immediately may be passing by never running (my own
Round 49 `setInterval` watcher, and the stale-probe class Argus named in
`AAXT-SCAFFOLDED-PROBING.md`).

Applied **six independent reverts together**, one run:

| revert | expected to fail |
|---|---|
| `escapeLike` → identity | wildcards-are-literal (1) |
| stopword filter disabled | tokenize-to-distinctive-terms, sentence-still-finds-it (2) |
| `buildTools` never adds the tool | offered-in-klatch, footer-names-it (2) |
| `excludeChannelId` dropped from recall | does-not-search-this-room (1) |
| `createToolUseArtifact` call removed | artifact-persists (1) |
| roundtable scope hoisted to `assistants[0].entity` | per-seat-scope (1) |

Result: **8 failed / 23 passed**, landing on exactly those disjoint sets and nothing else. Restored
all six; `grep REVERT-PROBE packages/` clean.

## 13:27 — Verification

```
npm test    → 1297 server (+31) / 226 client, 13 skipped, exit 0
npm run typecheck → clean ×3 workspaces (runs first as part of npm test)
npm run build     → green end to end
```

Server baseline before this fire was 1266 (my 09:26 Round 49 entry); +31 is exactly this round's
test count. Client 226 unchanged — no client code touched.

## 13:30 — Committed and pushed

- `5df8783` Round 50 (code + tests + plan doc section)
- `9db2236` mail to Theseus + Iris, cc team

Pushed `HEAD:main` → `b5227ff..9db2236`. Mail is on `main` in the same push per the worktree mail
rule, so neither recipient has to hunt across worktrees.

## Not proven by this fire (stated, not glossed)

**No live call.** Every test mocks the Anthropic client. What is verified: the tool is offered on the
right condition, executed with the right scope, bounded, recorded, and fed back into the same turn.
What is **not** verified: that a model reaches for it when the seed is insufficient. Asked Theseus
for that probe, with the shape — bury a distinctive fact under >20 messages in a 1-1 so layer 6
provably cannot carry it (readable free off `prompt-debug?entityId=`), then ask in the klatch — and
with the two failure modes I want distinguished rather than collapsed, since they need opposite
fixes: doesn't-call-it (salience) vs calls-it-and-reads-the-miss-as-absence (matching).

Second unmeasured risk, opposite direction: an agent calling recall *instead of* reading the seed
already in its prompt.

## Routed, not decided

To Iris: whether live `save_file` calls should also persist a `tool_use` row, and whether a recall
card is the right weight or should be passive like her carried-context chip. I wrote the artifact for
recall only — extending it to `save_file` puts a card on every file-producing turn, which is her
surface with no ruling behind it.

## Unchanged and still with xian

**Backfill** (gap doc open question 3). All 72 imported channels bind to `default-entity`. Recall
does not fix that and widens the blast radius: layer 6 gave a mixed identity's 20 recent messages;
recall lets the same mixed identity search all of it.

---

## Session wrap verification (per CLAUDE.md)

**Step 1 — commits landed on `origin/main`** (`git log origin/main --oneline -5`, run 13:31 PT):

```
9db2236 mail(daedalus): Round 50 recall tool landed — probe ask to Theseus, one surface question to Iris
5df8783 Round 50: on-demand recall — the other half of continuity #3
b5227ff log(calliope): 12:30 MID fire — wrap verification appended
fe297d9 rollup(v39): Round 49 lands both server-side findings, verified live by Theseus
efa013c log(theseus): 8/14 START fire — Round 49 driven live, wrap verification appended
```

Both of this fire's commits are on `origin/main`.

**Step 2 — deliverable files present** (`ls -l`, run 13:31 PT):

```
packages/server/src/claude/recall.ts                                       12310
packages/server/src/__tests__/round50-recall-tool.test.ts                  23103
docs/mail/daedalus-to-theseus-iris-cc-team-recall-tool-landed-2026-08-14.md 7995
docs/plans/continuity-3-carried-context.md                                 40806
docs/logs/2026-08-14-1317-daedalus-opus-log.md                              8460
```

Modified in place and covered by `5df8783`: `packages/server/src/db/queries.ts`
(`entityTranscriptWhere`, `search` option, `countEntityTranscript`, `createToolUseArtifact`),
`packages/server/src/claude/carried-context.ts` (`RECALL_TOOL_NAME`, exported
`formatTranscriptLine`, footer names the tool), `packages/server/src/claude/client.ts`
(`buildTools`, `RecallScope`, `executeTool` recall branch, both call sites).

**Step 3 —** this log is committed last, after Steps 1 and 2 were run for real.
