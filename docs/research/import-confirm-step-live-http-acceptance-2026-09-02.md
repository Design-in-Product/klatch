# The import confirm step, over a real server — acceptance measurement

**Theseus · 2026-09-02 (STOP fire, ~19:5x PT) · Round 141**

Instrument: `scripts/probe-import-live-http.mts` · **22/22 checks passed**

This measures Iris's `f26b8fc` ("build client half of the entity confirm-step") against a **real
listening server over real HTTP**, and closes two gaps that were explicitly named — by her and by
me — rather than discovered late.

## Why this run existed

Two unclosed limits, both written down before this fire rather than reconstructed after it:

1. **Mine, from Round 139's log:** *"The curl fallback recipe is route-level, not server-level. I
   drove the same Hono route the dev server mounts; I did not stand up `npm run dev` and curl it."*
   `probe-import-entity-binding.mts` uses in-process `app.request()`. Nothing had exercised the
   actual `serve()` process.
2. **Iris's, from her handoff memo:** *"no live walkthrough against a running dev server with real
   `~/.claude/projects` sessions this fire — against the test suite and mocked fetch only."*

And one surface that neither of us had covered at all: **`uploadClaudeCodeSession`'s multipart
branch**. Iris's diff appends `entityName`/`entityId` as *form fields* (`client.ts:623-624`). My
Round 139 probe posted JSON only. A form field the server didn't read would have failed in exactly
the shape I documented for the claude.ai ZIP route — silent discard, HTTP 201, wrong binding — and
every test in the suite would still have been green.

## What it does

Spawns `packages/server/src/index.ts` as a child process against a scratch DB (`KLATCH_DB`), waits
for it to listen, and drives it with `fetch`. **xian's `klatch.db` is never opened.** Zero model
calls — import is entirely local.

The server hardcodes `const port = 3001` (`index.ts:48`) with no env override, so the probe cannot
pick its own port; it **refuses to run (exit 2) when 3001 is occupied** rather than silently
measuring a server it didn't start, backed by a DB it doesn't own.

Unlike Round 139, all arms assert behavior that must hold — a failure is a regression, exit 1.
There is no gap-arm bookkeeping, because the gaps Round 139 encoded have now closed.

| Arm | What it drives | Result |
|-----|----------------|--------|
| A | JSON body + `entityName` over real HTTP | binds to a minted `Daedalus`, `disposition=minted`, every assistant row stamped |
| B | second session, same `entityName` | **reuses the same entity row**, `matched-by-name`, exactly 1 Daedalus |
| C | JSON, no entity fields | falls back to `default-entity` — the documented fallback |
| D | **multipart + `entityName`** (Iris's new path) | **honored, not discarded** — binds to `Iris`, assistant rows stamped |
| E | multipart, no entity fields | falls back to `default-entity` |
| F | `GET /import/claude-code/sessions` | **499/499** real sessions carry `entityGuess{basis,rationale}` |
| G | deepest reachable real transcript | 604-message session imported in **84ms**, bound to `Vergil`, **0 stray assistant rows** |

**Arm D is the load-bearing one.** The multipart branch does read the form fields
(`routes/import.ts:115-122`) and the binding lands. Iris's new call site is sound end-to-end.

**Arm F is the one mocked tests structurally cannot do.** Her confirm field prefills from
`SessionInfo.entityGuess`, a type mirrored by hand client-side and supplied by mocked `fetch` in her
tests. Nothing proved the *real* endpoint emits it. It does (`routes/import.ts:67`), for every one
of 499 sessions. Had it not, the confirm step would have shipped as a permanently-blank field and
every import would have silently taken the arm-C path — green tests, broken product.

## What the real corpus looks like

Reported, not asserted — this is what the import screen will actually show on this machine:

```
basis distribution over 499 real sessions:
  identity-claim   476  95.4%
  project-name      23   4.6%
  none               0   0.0%
```

Three consequences worth naming:

- **The guesser is strong here.** 95.4% land on `identity-claim`, the basis Iris renders quiet and
  prefilled. The amber "weak guess" treatment fires on 4.6%. The import screen will be mostly calm.
- **The `none` treatment fires zero times across 499 sessions.** Iris built three treatments and
  this corpus exercises two. That is not a defect — a blank-is-legitimate path is right to have —
  but it is currently **unexercised UI outside her unit tests**, and worth knowing before it is
  demoed.
- **476 identity-claims collapse to 12 distinct names, 8 of them with ≥2 sessions.** Her batch
  group-confirm banner will do real work, not decorate an edge case.

### On the Friday question I left open this morning

Round 139 ended with an open question I declined to guess past: whether xian's department-head
conversations arrive as **Claude Code sessions** (client-only job) or **claude.ai exports** (a
server change never built). This run does **not** close it, and I want to be precise about why,
because the first read of this data is misleading.

`piper` **does** appear as an identity-claim name — which looks like the answer. It is **one
session**: "You are Piper Open. Read roles/PIPER-OPEN.md…", 565 messages, in project `27`.

One session is not a cast. The corpus is overwhelmingly **Klatch's own agents** (Calliope 94, Argus
87, Janus 79, Theseus 71, Daedalus 69, Iris 48, Terminus 22). The other named agents — Piper,
Tessera, Vergil, Themis — appear once or twice each, in *other* projects (`27`, `globe`, `openlaws`,
`themis`, `mediajunkie`), and are 480–604 message transcripts.

So: **deep, strongly-identified, non-Klatch agent conversations do exist on this machine as Claude
Code sessions, and they would import correctly today.** Whether *those* are the cast xian means by
"the Piper Morgan test" is his call, not mine to infer from a filename. The question stays open;
what changed is that the Claude-Code-sessions branch is now demonstrated on real deep data rather
than assumed.

## The depth limit from Round 139 is closed

Round 139's sharpest self-noted limit: *"Duty-cycle sessions are one turn with enormous tool
payloads, so 2 messages is correct — but it means my corpus is a shallow proxy. Nothing here
measures how a 400-message transcript imports."*

Arm G measures it. A 604-message session imported over real HTTP in **84ms**, bound to its own
entity, **325 message rows persisted, and zero assistant rows NULL-stamped or mis-stamped**. That
last check matters most: a *partial* stamp at depth is precisely the failure the backfill exists to
repair, and it does not occur.

## One open question I am NOT calling a bug

The browse screen reports **604** for that session; the import persists **325** message rows.

The two numbers count different things, and both are internally defensible:
`session-scanner.ts` counts raw `user`/`assistant` events (skipping sidechain, meta, and
tool-result-only), and stops at `FINGERPRINT_LINE_CAP = 1500` lines; the importer persists grouped
turns after the parser's filtering. The scanner's count is a **lower bound** when capped, and the UI
is honest about that — `fingerprintCapped` is propagated (`session-scanner.ts:255,323`) and the
client renders it as `"604+"` (asserted in `round38-ui-context-aaxt-import-browser.test.tsx:474`).

**I checked that before reporting it, and it killed my first draft of this finding.** I had written
down "`capped` is undefined, the UI shows a capped count as if it were exact" — that was my own
script reading the wrong field name. The field is `fingerprintCapped`, it is `true`, and the client
is honest. No defect.

What remains, stated at the product layer rather than the code layer: **a user sees "604+" and
receives 325.** The `+` promises *more* and the import delivers *fewer*. I did not verify the
event-to-message mapping line by line, so I am not calling this wrong — turn-grouping plausibly
accounts for all of it. **This is a question for Daedalus**, not a defect report: is the browse
count meant to predict what lands, and if so should it count grouped turns rather than raw events?

## Limits of this run

- **Synthetic fixtures for arms A–E.** They are 2-event JSONL files written under `.testdata/`, so
  the probe runs anywhere including a sandboxed session. That is a real trade: it measures the
  *transport and binding contract*, not parser fidelity. Arms F/G use the live corpus; A–E do not.
  `probe-import-entity-binding.mts` remains the one to run for real-corpus breadth.
- **No browser.** This drives the HTTP surface the client calls, not the rendered UI. Iris's
  confirm-field styling, group-confirm banner, and mint-vs-merge copy are verified by her 10 unit
  tests and by nothing here. **A human click-through is still unperformed** — this narrows what that
  walkthrough has to catch; it does not replace it.
- **Read-only on the corpus, one write path.** Arm G imports a real session into the *scratch* DB.
  Nothing in `~/.claude/projects` is modified.
- **Single machine.** Everything above describes Amber's corpus.

## Bottom line

Iris's client half is **sound over real HTTP on both call sites**, including the multipart path
nothing had ever driven and the browse contract her mocked tests could not reach. The Round 139
depth limit is closed with a 604-message import that stamps every assistant row. The Friday
transport question is still xian's to answer, and the browse-count question is Daedalus's.
