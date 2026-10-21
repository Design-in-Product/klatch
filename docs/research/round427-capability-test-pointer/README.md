# Round 427 — what the capability test actually needs from xian

**Author:** Theseus (Klatch) · **Date:** 2026-10-20 (STOP fire)
**Occasion:** xian asked, via Janus
(`docs/mail/janus-to-theseus-cc-calliope-xian-capability-test-pointer-and-think-tank-2026-10-20.md`,
17:11 PT), to be pointed at the doc that defines the capability test and told exactly what he has to
provide. This directory is the measurement that changed what I would have told him.

## What I would have said, and why it was wrong

The blocker has been recorded for weeks as "a key plus a channel large enough to trigger
compaction" (Daedalus, `docs/intel/2026-10-19-sdk-bump-assessment.md` §5 step 3, widened in §3a).
Before relaying that, I measured what a request on an imported channel actually carries.

`packages/server/src/claude/client.ts` windows conversation history to the last
**`MAX_HISTORY_MESSAGES = 200`** messages (line 133, applied at two call sites), and the compaction
trigger is **160 000 `input_tokens`** (line 908). Tool artifacts are inserted into
`message_artifacts`, not into `messages.content` (`db/queries.ts`), and the history builder filters
on `m.content` — so artifact bytes are in the session file and are **not** in the request.

## The measurement

`the-history-window-is-200-messages-not-the-file.mjs` → `the-history-window.out`, **GATE true**
(11 legs, including a known positive and a control for the window arithmetic).

The repo's one reachable corpus, `exports/sessions/theseus-2026-03-22.jsonl`:

| quantity | value |
|---|---|
| bytes on disk | 3 860 602 |
| turns the importer's own parser finds | 66 (from 1001 events) |
| message rows the importer would insert | 132 |
| messages eligible for history | 132 — **the 200-window does not even bite** |
| characters of request content | **197 073** |
| bytes of the file that are *not* request content | 3 663 529 — **95%** |
| bracketed tokens (3.0–4.5 chars/token) | ~43 794 – 65 691 |
| verdict against the 160 000 trigger | **DOES-NOT-TRIGGER**, short by 2.4×–3.7× |

So "bring a big channel" is the wrong instruction twice over. The binding quantity is **prose in the
last 200 messages**, not file size; and a session file can be 10 MB of tool output and still miss.

Content needed, published as a band rather than one end of it: **≥ 720 000 chars** guarantees the
trigger at the sparse end of the bracket, **< 480 000 chars** guarantees it is not reached on content
alone, and between the two is undetermined without a live call.

## Declared blindness, and which way it can move

Chars-per-token is **estimated, not measured** — only a live call returns `input_tokens`, and that
is the blocked step. The system prompt, `tools` and carried context are unmodelled and can only
**add** tokens, so the figure above is a **floor** on the request. That makes the asymmetry explicit:
a `TRIGGERS` verdict off this floor would be sound, whereas this `DOES-NOT-TRIGGER` verdict says only
"not from message content alone" and could be overturned by the unmodelled additions. It is short by
2.4× at the nearest end, so the unmodelled additions would have to be very large to close it.

## Two revisions recorded against myself

1. **My control's expected value was wrong.** I wrote "a window of 2 keeps 25 chars"; the last two
   *eligible* messages are 7 + 5 = 12, because the third turn's assistant row is inserted empty and
   dropped before the slice. The instrument printed 12 and failed the leg. The leg was wrong, not
   the code — same class as Round 379. Left visible in the source, because a control I mis-stated
   is the one red I was most likely to explain away.
2. **My first refusal message hid its own cause.** The parser call failed and the refusal truncated
   `e.message` at 300 chars, which printed the echoed script and cut off esbuild's single
   explanatory line (`Top-level await is currently not supported with the "cjs" output format`).
   Now it reads the **tail** of stderr, where the cause is. Cousin of the pipe-hides-the-head
   lesson: a refusal that is not diagnostic costs a whole run.

## Consequence for the test plan

Three ways to get a triggering request, priced:

- **(A) A larger import.** Needs a Claude Code session with ~3.7× this corpus's *prose*. Checkable
  before the sitting by the figure above — no API call required to decide whether a candidate
  qualifies.
- **(B) Conversation growth.** Keep sending on an imported channel until it compacts. No new corpus,
  but it burns the tokens to get there.
- **(C) Lower the trigger for the sitting.** `trigger: { type: 'input_tokens', value: 160000 }` is a
  single literal at `client.ts:908`. Lowering it to e.g. 20 000 makes the existing in-repo corpus
  trigger compaction on one send, which exercises the same API surface that step 3 (a) and (b)
  actually ask about — *is a summary still produced*, and *does `instructions:` still preserve
  `[EntityName responded]` markers*. **It is not a substitute for the real-threshold run**, but it
  is the cheapest way to find out whether the beta surface still works at all before spending (A)
  or (B) on it. Useful property: `__tests__/round17-compaction-effort.test.ts:40` asserts the
  literal `160000` in source, so a lowered trigger **reddens the suite** — a built-in tripwire
  against the change being committed by accident.

(C) is my recommendation for the first sitting, and I am not treating it as closing the item.
